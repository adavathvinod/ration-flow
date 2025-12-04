import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface ShopSettings {
  id: string;
  current_serving: number;
  last_reset_date: string;
  shop_code: string | null;
  shop_name: string | null;
  is_open: boolean;
}

export const useTokenSystem = (shopCode?: string | null) => {
  const [currentServing, setCurrentServing] = useState<number>(0);
  const [nextToken, setNextToken] = useState<number>(1);
  const [loading, setLoading] = useState(true);
  const [shopSettings, setShopSettings] = useState<ShopSettings | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const { toast } = useToast();

  // Check if within distribution period (1st-15th of month)
  const isDistributionPeriod = useCallback(() => {
    const today = new Date();
    const day = today.getDate();
    return day >= 1 && day <= 15;
  }, []);

  // Get system status - now considers owner toggle
  const getSystemStatus = useCallback((): "active" | "inactive" | "owner_closed" => {
    if (!isDistributionPeriod()) return "inactive";
    if (!isOpen) return "owner_closed";
    return "active";
  }, [isDistributionPeriod, isOpen]);

  // Fetch shop by code (for public page)
  const fetchShopByCode = useCallback(async (code: string): Promise<ShopSettings | null> => {
    try {
      const { data, error } = await supabase
        .from("shop_settings")
        .select("*")
        .eq("shop_code", code.toUpperCase())
        .maybeSingle();

      if (error) {
        console.error("Error fetching shop:", error);
        return null;
      }

      return data as ShopSettings | null;
    } catch (error) {
      console.error("Error in fetchShopByCode:", error);
      return null;
    }
  }, []);

  // Fetch current state from database
  const fetchCurrentState = useCallback(async () => {
    try {
      setLoading(true);
      let settings: ShopSettings | null = null;

      if (shopCode) {
        // Fetch by shop code (public view)
        settings = await fetchShopByCode(shopCode);
      } else {
        // Fetch owner's shop settings
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data, error } = await supabase
            .from("shop_settings")
            .select("*")
            .eq("shop_owner_id", user.id)
            .maybeSingle();

          if (!error && data) {
            settings = data as ShopSettings;
          }
        } else {
          // No user, no shop code - just get first for demo
          const { data, error } = await supabase
            .from("shop_settings")
            .select("*")
            .limit(1)
            .maybeSingle();

          if (!error && data) {
            settings = data as ShopSettings;
          }
        }
      }

      if (settings) {
        const today = new Date().toISOString().split("T")[0];

        // Check if we need to reset (new day) - also reset is_open to false
        if (settings.last_reset_date !== today) {
          const { error: updateError } = await supabase
            .from("shop_settings")
            .update({ 
              current_serving: 0, 
              last_reset_date: today,
              is_open: false // Reset to OFF on new day
            })
            .eq("id", settings.id);

          if (!updateError) {
            setCurrentServing(0);
            setNextToken(1);
            setIsOpen(false);
          }
        } else {
          setCurrentServing(settings.current_serving);
          setIsOpen(settings.is_open);
        }

        setShopSettings(settings);

        // Get highest token number for today for this shop
        const { data: tokens, error: tokensError } = await supabase
          .from("daily_tokens")
          .select("token_number")
          .eq("generation_date", today)
          .eq("shop_id", settings.id)
          .order("token_number", { ascending: false })
          .limit(1);

        if (!tokensError && tokens && tokens.length > 0) {
          setNextToken(tokens[0].token_number + 1);
        } else {
          setNextToken(1);
        }
      }
    } catch (error) {
      console.error("Error in fetchCurrentState:", error);
    } finally {
      setLoading(false);
    }
  }, [shopCode, fetchShopByCode]);

  // Toggle system open/closed (owner only)
  const toggleSystemStatus = useCallback(async (open: boolean) => {
    if (!shopSettings) {
      toast({
        title: "Error",
        description: "Shop not configured",
        variant: "destructive",
      });
      return;
    }

    try {
      const { error } = await supabase
        .from("shop_settings")
        .update({ is_open: open, updated_at: new Date().toISOString() })
        .eq("id", shopSettings.id);

      if (error) throw error;

      setIsOpen(open);
      toast({
        title: open ? "Queue Opened" : "Queue Closed",
        description: open 
          ? "Customers can now generate tokens" 
          : "Token generation is now disabled",
      });
    } catch (error) {
      console.error("Error toggling status:", error);
      toast({
        title: "Error",
        description: "Failed to update system status",
        variant: "destructive",
      });
    }
  }, [shopSettings, toast]);

  // Update shop settings (code and name)
  const updateShopSettings = useCallback(async (code: string, name: string) => {
    if (!shopSettings) {
      toast({
        title: "Error",
        description: "Shop not configured",
        variant: "destructive",
      });
      return;
    }

    try {
      const { error } = await supabase
        .from("shop_settings")
        .update({ 
          shop_code: code.toUpperCase(), 
          shop_name: name,
          updated_at: new Date().toISOString() 
        })
        .eq("id", shopSettings.id);

      if (error) throw error;

      setShopSettings({ ...shopSettings, shop_code: code.toUpperCase(), shop_name: name });
      toast({
        title: "Settings Saved",
        description: `Queue code: ${code.toUpperCase()}`,
      });
    } catch (error: any) {
      console.error("Error updating shop settings:", error);
      if (error.code === "23505") {
        toast({
          title: "Code Already Taken",
          description: "Please choose a different queue code",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Error",
          description: "Failed to save settings",
          variant: "destructive",
        });
      }
    }
  }, [shopSettings, toast]);

  // Generate a new token
  const generateToken = useCallback(async (sessionId: string): Promise<number | null> => {
    if (!shopSettings) {
      toast({
        title: "Error",
        description: "Queue not found",
        variant: "destructive",
      });
      return null;
    }

    if (!isDistributionPeriod()) {
      toast({
        title: "Distribution Closed",
        description: "Token generation is only available from 1st to 15th of each month.",
        variant: "destructive",
      });
      return null;
    }

    if (!isOpen) {
      toast({
        title: "Queue Closed",
        description: "The queue is currently closed by the owner.",
        variant: "destructive",
      });
      return null;
    }

    try {
      const today = new Date().toISOString().split("T")[0];
      
      // Check if this session already has a token today for this shop
      const { data: existingToken, error: checkError } = await supabase
        .from("daily_tokens")
        .select("token_number")
        .eq("session_id", sessionId)
        .eq("generation_date", today)
        .eq("shop_id", shopSettings.id)
        .maybeSingle();

      if (checkError) {
        console.error("Error checking existing token:", checkError);
      }

      if (existingToken) {
        toast({
          title: "Token Already Generated",
          description: `Your token number is ${existingToken.token_number}`,
        });
        return existingToken.token_number;
      }

      // Get the next token number atomically for this shop
      const { data: tokens, error: tokensError } = await supabase
        .from("daily_tokens")
        .select("token_number")
        .eq("generation_date", today)
        .eq("shop_id", shopSettings.id)
        .order("token_number", { ascending: false })
        .limit(1);

      if (tokensError) {
        console.error("Error fetching tokens:", tokensError);
        throw tokensError;
      }

      const newTokenNumber = tokens && tokens.length > 0 ? tokens[0].token_number + 1 : 1;

      // Insert the new token
      const { error: insertError } = await supabase
        .from("daily_tokens")
        .insert({
          token_number: newTokenNumber,
          session_id: sessionId,
          generation_date: today,
          shop_id: shopSettings.id,
        });

      if (insertError) {
        console.error("Error inserting token:", insertError);
        throw insertError;
      }

      setNextToken(newTokenNumber + 1);

      toast({
        title: "Token Generated!",
        description: `Your token number is ${newTokenNumber}`,
      });

      return newTokenNumber;
    } catch (error) {
      console.error("Error generating token:", error);
      toast({
        title: "Error",
        description: "Failed to generate token. Please try again.",
        variant: "destructive",
      });
      return null;
    }
  }, [shopSettings, isDistributionPeriod, isOpen, toast]);

  // Increment serving number (shop owner only)
  const incrementServing = useCallback(async () => {
    if (!shopSettings) {
      toast({
        title: "Error",
        description: "Shop not configured",
        variant: "destructive",
      });
      return;
    }

    try {
      const newServing = currentServing + 1;

      const { error } = await supabase
        .from("shop_settings")
        .update({ current_serving: newServing, updated_at: new Date().toISOString() })
        .eq("id", shopSettings.id);

      if (error) {
        console.error("Error incrementing serving:", error);
        throw error;
      }

      setCurrentServing(newServing);

      // Mark bypassed tokens as expired
      const today = new Date().toISOString().split("T")[0];
      await supabase
        .from("daily_tokens")
        .update({ is_expired: true })
        .eq("generation_date", today)
        .eq("shop_id", shopSettings.id)
        .lt("token_number", newServing);

      toast({
        title: "Updated",
        description: `Now serving token #${newServing}`,
      });
    } catch (error) {
      console.error("Error incrementing serving:", error);
      toast({
        title: "Error",
        description: "Failed to update serving number",
        variant: "destructive",
      });
    }
  }, [shopSettings, currentServing, toast]);

  // Set up realtime subscription
  useEffect(() => {
    fetchCurrentState();

    const channel = supabase
      .channel("shop_settings_changes")
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "shop_settings",
        },
        (payload) => {
          const newData = payload.new as ShopSettings;
          // Only update if it's our shop
          if (shopSettings && newData.id === shopSettings.id) {
            setCurrentServing(newData.current_serving);
            setIsOpen(newData.is_open);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchCurrentState, shopSettings?.id]);

  return {
    currentServing,
    nextToken,
    loading,
    isOpen,
    shopSettings,
    generateToken,
    incrementServing,
    getSystemStatus,
    isDistributionPeriod,
    fetchCurrentState,
    toggleSystemStatus,
    updateShopSettings,
    fetchShopByCode,
  };
};
