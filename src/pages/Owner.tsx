import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Ticket, LogOut, RefreshCw, Home, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import OdometerDisplay from "@/components/OdometerDisplay";
import SwipeToIncrement from "@/components/SwipeToIncrement";
import StatusBadge from "@/components/StatusBadge";
import { useTokenSystem } from "@/hooks/useTokenSystem";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { User, Session } from "@supabase/supabase-js";

const Owner = () => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const navigate = useNavigate();
  const { toast } = useToast();

  const {
    currentServing,
    nextToken,
    loading,
    incrementServing,
    getSystemStatus,
    fetchCurrentState,
  } = useTokenSystem();

  const status = getSystemStatus();

  useEffect(() => {
    // Set up auth listener first
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

    // Then check for existing session
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
              <h1 className="font-display font-bold text-lg">Owner Dashboard</h1>
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
        {/* Status Section */}
        <div className="text-center mb-8 animate-fade-in">
          <StatusBadge status={status} className="mb-4" />
          <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-2">
            Queue Management
          </h2>
          <p className="text-muted-foreground">
            Swipe to call the next token number
          </p>
        </div>

        {/* Main Dashboard */}
        <div className="max-w-2xl mx-auto space-y-6">
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
                disabled={status === "inactive"}
              />
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
          <p>Shop Owner Dashboard • All data syncs in real-time</p>
        </div>
      </footer>
    </div>
  );
};

export default Owner;
