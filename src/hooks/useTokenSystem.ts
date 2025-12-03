import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface ShopSettings {
  id: string;
  current_serving: number;
  last_reset_date: string;
}

export const useTokenSystem = () => {
  const [currentServing, setCurrentServing] = useState<number>(0);
  const [nextToken, setNextToken] = useState<number>(1);
  const [loading, setLoading] = useState(true);
  const [shopSettingsId, setShopSettingsId] = useState<string | null>(null);
  const { toast } = useToast();

  // Check if within distribution period (1st-15th of month)
  const isDistributionPeriod = useCallback(() => {
    const today = new Date();
    const day = today.getDate();
    return day >= 1 && day <= 15;
  }, []);

  // Check if token generation is open (before 12 PM)
  const isTokenGenerationOpen = useCallback(() => {
    const now = new Date();
    const hours = now.getHours();
    return hours < 12;
  }, []);

  // Get system status
  const getSystemStatus = useCallback((): "active" | "closed" | "inactive" => {
    if (!isDistributionPeriod()) return "inactive";
    if (!isTokenGenerationOpen()) return "closed";
    return "active";
  }, [isDistributionPeriod, isTokenGenerationOpen]);

  // Fetch current state from database
  const fetchCurrentState = useCallback(async () => {
    try {
      // Get shop settings (first one for now - in production, filter by specific shop)
      const { data: settings, error: settingsError } = await supabase
        .from("shop_settings")
        .select("*")
        .limit(1)
        .maybeSingle();

      if (settingsError) {
        console.error("Error fetching shop settings:", settingsError);
        return;
      }

      if (settings) {
        const today = new Date().toISOString().split("T")[0];
        
        // Check if we need to reset (new day)
        if (settings.last_reset_date !== today) {
          // Reset for new day
          const { error: updateError } = await supabase
            .from("shop_settings")
            .update({ current_serving: 0, last_reset_date: today })
            .eq("id", settings.id);

          if (!updateError) {
            setCurrentServing(0);
            setNextToken(1);
          }
        } else {
          setCurrentServing(settings.current_serving);
        }
        
        setShopSettingsId(settings.id);
      }

      // Get highest token number for today
      const today = new Date().toISOString().split("T")[0];
      const { data: tokens, error: tokensError } = await supabase
        .from("daily_tokens")
        .select("token_number")
        .eq("generation_date", today)
        .order("token_number", { ascending: false })
        .limit(1);

      if (!tokensError && tokens && tokens.length > 0) {
        setNextToken(tokens[0].token_number + 1);
      } else {
        setNextToken(1);
      }
    } catch (error) {
      console.error("Error in fetchCurrentState:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Generate a new token
  const generateToken = useCallback(async (sessionId: string): Promise<number | null> => {
    if (!isDistributionPeriod()) {
      toast({
        title: "Distribution Closed",
        description: "Token generation is only available from 1st to 15th of each month.",
        variant: "destructive",
      });
      return null;
    }

    if (!isTokenGenerationOpen()) {
      toast({
        title: "Token Generation Closed",
        description: "Token Generation Closed After 12 PM",
        variant: "destructive",
      });
      return null;
    }

    try {
      // Check if this session already has a token today
      const today = new Date().toISOString().split("T")[0];
      const { data: existingToken, error: checkError } = await supabase
        .from("daily_tokens")
        .select("token_number")
        .eq("session_id", sessionId)
        .eq("generation_date", today)
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

      // Get the next token number atomically
      const { data: tokens, error: tokensError } = await supabase
        .from("daily_tokens")
        .select("token_number")
        .eq("generation_date", today)
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
  }, [isDistributionPeriod, isTokenGenerationOpen, toast]);

  // Increment serving number (shop owner only)
  const incrementServing = useCallback(async () => {
    if (!shopSettingsId) {
      toast({
        title: "Error",
        description: "Shop not configured",
        variant: "destructive",
      });
      return;
    }

    try {
      // Simple +1 increment without conditions
      const newServing = currentServing + 1;
      
      const { error } = await supabase
        .from("shop_settings")
        .update({ current_serving: newServing, updated_at: new Date().toISOString() })
        .eq("id", shopSettingsId);

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
  }, [shopSettingsId, currentServing, toast]);

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
          setCurrentServing(newData.current_serving);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchCurrentState]);

  return {
    currentServing,
    nextToken,
    loading,
    generateToken,
    incrementServing,
    getSystemStatus,
    isDistributionPeriod,
    isTokenGenerationOpen,
    fetchCurrentState,
  };
};
