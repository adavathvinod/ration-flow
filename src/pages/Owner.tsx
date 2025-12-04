import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Ticket, LogOut, RefreshCw, Home, Users, Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import OdometerDisplay from "@/components/OdometerDisplay";
import SwipeToIncrement from "@/components/SwipeToIncrement";
import StatusBadge from "@/components/StatusBadge";
import SystemToggle from "@/components/SystemToggle";
import ShopCodeSetup from "@/components/ShopCodeSetup";
import QRCodeDisplay from "@/components/QRCodeDisplay";
import { useTokenSystem } from "@/hooks/useTokenSystem";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { User, Session } from "@supabase/supabase-js";

const Owner = () => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const {
    currentServing,
    nextToken,
    loading,
    isOpen,
    shopSettings,
    incrementServing,
    getSystemStatus,
    fetchCurrentState,
    toggleSystemStatus,
    updateShopSettings,
  } = useTokenSystem();

  const status = getSystemStatus();
  const isConfigured = shopSettings?.shop_code && shopSettings?.shop_name;

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        setAuthLoading(false);

        if (!session) {
          navigate("/auth");
        }
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setAuthLoading(false);

      if (!session) {
        navigate("/auth");
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    toast({
      title: "Signed out",
      description: "You have been signed out successfully.",
    });
    navigate("/auth");
  };

  const handleCopyCode = () => {
    if (shopSettings?.shop_code) {
      navigator.clipboard.writeText(shopSettings.shop_code);
      setCopied(true);
      toast({
        title: "Copied!",
        description: "Queue code copied to clipboard",
      });
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center">
              <Ticket className="w-5 h-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="font-display font-bold text-lg">
                {shopSettings?.shop_name || "Owner Dashboard"}
              </h1>
              <p className="text-xs text-muted-foreground truncate max-w-[150px] md:max-w-none">
                {user.email}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link to="/">
              <Button variant="ghost" size="sm" className="gap-2">
                <Home className="w-4 h-4" />
                <span className="hidden md:inline">Public View</span>
              </Button>
            </Link>
            <Button variant="ghost" size="sm" onClick={handleSignOut} className="gap-2">
              <LogOut className="w-4 h-4" />
              <span className="hidden md:inline">Sign Out</span>
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 md:py-12">
        {/* Queue Code Display (if configured) */}
        {isConfigured && (
          <div className="max-w-2xl mx-auto mb-6">
            <Card className="bg-primary/5 border-primary/20 animate-fade-in">
              <CardContent className="flex items-center justify-between p-4">
                <div>
                  <p className="text-sm text-muted-foreground">Your Queue Code</p>
                  <p className="text-2xl font-mono font-bold tracking-wider text-primary">
                    {shopSettings.shop_code}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <QRCodeDisplay
                    shopCode={shopSettings.shop_code}
                    shopName={shopSettings.shop_name || undefined}
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleCopyCode}
                    className="gap-2"
                  >
                    {copied ? (
                      <Check className="w-4 h-4 text-accent" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                    {copied ? "Copied" : "Copy"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Status Section */}
        <div className="text-center mb-8 animate-fade-in">
          <StatusBadge status={status} className="mb-4" />
          <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-2">
            Queue Management
          </h2>
          <p className="text-muted-foreground">
            {isConfigured
              ? "Control your queue and call the next token"
              : "Set up your queue instance to get started"}
          </p>
        </div>

        <div className="max-w-2xl mx-auto space-y-6">
          {/* Shop Setup (if not configured) */}
          {!isConfigured && (
            <ShopCodeSetup
              currentCode={shopSettings?.shop_code}
              currentName={shopSettings?.shop_name}
              onSave={updateShopSettings}
              loading={loading}
            />
          )}

          {/* System Toggle */}
          {isConfigured && (
            <div className="animate-fade-in" style={{ animationDelay: "0.05s" }}>
              <SystemToggle
                isOpen={isOpen}
                onToggle={toggleSystemStatus}
                disabled={status === "inactive" || loading}
              />
              {status === "inactive" && (
                <p className="text-xs text-muted-foreground text-center mt-2">
                  System toggle available during distribution period (1st - 15th)
                </p>
              )}
            </div>
          )}

          {/* Current Serving - Large Display */}
          <Card className="animate-fade-in" style={{ animationDelay: "0.1s" }}>
            <CardHeader className="text-center pb-0">
              <CardTitle className="text-lg font-medium text-muted-foreground flex items-center justify-center gap-2">
                <span className="relative flex h-2 w-2">
                  <span className="live-indicator absolute inline-flex h-full w-full rounded-full bg-accent opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-accent"></span>
                </span>
                Now Serving
              </CardTitle>
            </CardHeader>
            <CardContent className="flex justify-center py-6">
              {loading ? (
                <div className="h-36 flex items-center justify-center">
                  <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                </div>
              ) : (
                <OdometerDisplay value={currentServing} />
              )}
            </CardContent>
          </Card>

          {/* Swipe Control */}
          <Card className="animate-fade-in" style={{ animationDelay: "0.2s" }}>
            <CardHeader className="text-center pb-4">
              <CardTitle className="text-lg font-medium">Call Next Token</CardTitle>
            </CardHeader>
            <CardContent className="pb-8">
              <SwipeToIncrement
                onIncrement={incrementServing}
                disabled={!isConfigured || status === "inactive" || !isOpen}
              />
              {!isOpen && isConfigured && status !== "inactive" && (
                <p className="text-xs text-muted-foreground text-center mt-4">
                  Turn on the system toggle above to enable token calling
                </p>
              )}
            </CardContent>
          </Card>

          {/* Stats Row */}
          <div className="grid grid-cols-2 gap-4">
            <Card className="animate-fade-in" style={{ animationDelay: "0.3s" }}>
              <CardContent className="p-4 text-center">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-2">
                  <Users className="w-5 h-5 text-primary" />
                </div>
                <p className="text-2xl font-display font-bold text-foreground">
                  {nextToken > 1 ? nextToken - 1 : 0}
                </p>
                <p className="text-xs text-muted-foreground">Tokens Generated</p>
              </CardContent>
            </Card>

            <Card className="animate-fade-in" style={{ animationDelay: "0.4s" }}>
              <CardContent className="p-4 text-center">
                <div className="w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center mx-auto mb-2">
                  <Ticket className="w-5 h-5 text-accent" />
                </div>
                <p className="text-2xl font-display font-bold text-foreground">
                  {Math.max(0, (nextToken > 1 ? nextToken - 1 : 0) - currentServing)}
                </p>
                <p className="text-xs text-muted-foreground">Waiting in Queue</p>
              </CardContent>
            </Card>
          </div>

          {/* Shop Settings (if configured, allow editing) */}
          {isConfigured && (
            <ShopCodeSetup
              currentCode={shopSettings?.shop_code}
              currentName={shopSettings?.shop_name}
              onSave={updateShopSettings}
              loading={loading}
            />
          )}

          {/* Refresh Button */}
          <div className="text-center">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => fetchCurrentState()}
              className="gap-2 text-muted-foreground"
            >
              <RefreshCw className="w-4 h-4" />
              Refresh Data
            </Button>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border mt-12 py-6">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>Queue Management Dashboard • All data syncs in real-time</p>
        </div>
      </footer>
    </div>
  );
};

export default Owner;
