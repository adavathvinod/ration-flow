import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Ticket, Store, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import OdometerDisplay from "@/components/OdometerDisplay";
import StatusBadge from "@/components/StatusBadge";
import { useTokenSystem } from "@/hooks/useTokenSystem";

const Index = () => {
  const [sessionId] = useState(() => {
    const stored = sessionStorage.getItem("token_session_id");
    if (stored) return stored;
    const newId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    sessionStorage.setItem("token_session_id", newId);
    return newId;
  });

  const [generatedToken, setGeneratedToken] = useState<number | null>(() => {
    const stored = sessionStorage.getItem("generated_token_today");
    const storedDate = sessionStorage.getItem("generated_token_date");
    const today = new Date().toISOString().split("T")[0];
    if (stored && storedDate === today) {
      return parseInt(stored, 10);
    }
    return null;
  });

  const {
    currentServing,
    loading,
    generateToken,
    getSystemStatus,
  } = useTokenSystem();

  const status = getSystemStatus();
  const canGenerateToken = status === "active" && generatedToken === null;

  const handleGenerateToken = async () => {
    const token = await generateToken(sessionId);
    if (token !== null) {
      setGeneratedToken(token);
      const today = new Date().toISOString().split("T")[0];
      sessionStorage.setItem("generated_token_today", token.toString());
      sessionStorage.setItem("generated_token_date", today);
    }
  };

  // Get current date info
  const now = new Date();
  const currentDay = now.getDate();
  const daysRemaining = currentDay <= 15 ? 15 - currentDay : 0;

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
              <h1 className="font-display font-bold text-lg">Ration Token</h1>
              <p className="text-xs text-muted-foreground">Digital Queue System</p>
            </div>
          </div>
          <Link to="/auth">
            <Button variant="outline" size="sm" className="gap-2">
              <Store className="w-4 h-4" />
              Shop Owner
            </Button>
          </Link>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 md:py-12">
        {/* Status Section */}
        <div className="text-center mb-8 animate-fade-in">
          <StatusBadge status={status} className="mb-4" />
          <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-2">
            {status === "active"
              ? "Token System Active"
              : "Distribution Period: 1st - 15th of Month"}
          </h2>
          <p className="text-muted-foreground max-w-md mx-auto">
            {status === "active"
              ? "Get your token now and check the current serving number"
              : "Please return during the distribution period"}
          </p>
        </div>

        {/* Main Content Grid */}
        <div className="grid gap-6 md:grid-cols-2 max-w-4xl mx-auto">
          {/* Current Serving Card */}
          <Card className="card-hover animate-fade-in" style={{ animationDelay: "0.1s" }}>
            <CardHeader className="text-center pb-2">
              <CardTitle className="text-lg font-medium text-muted-foreground">
                Now Serving
              </CardTitle>
            </CardHeader>
            <CardContent className="flex justify-center pb-8">
              {loading ? (
                <div className="h-36 flex items-center justify-center">
                  <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                </div>
              ) : (
                <OdometerDisplay value={currentServing} />
              )}
            </CardContent>
          </Card>

          {/* Token Generation Card */}
          <Card className="card-hover animate-fade-in" style={{ animationDelay: "0.2s" }}>
            <CardHeader className="text-center pb-2">
              <CardTitle className="text-lg font-medium text-muted-foreground">
                {generatedToken ? "Your Token" : "Get Your Token"}
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col items-center justify-center pb-8">
              {generatedToken ? (
                <div className="text-center">
                  <div className="token-display mb-4">{generatedToken}</div>
                  <p className="text-sm text-muted-foreground">
                    {generatedToken <= currentServing
                      ? "Your token has been called!"
                      : `${generatedToken - currentServing} tokens ahead of you`}
                  </p>
                </div>
              ) : (
                <div className="w-full max-w-xs text-center">
                  <Button
                    onClick={handleGenerateToken}
                    disabled={!canGenerateToken}
                    size="lg"
                    className="w-full h-16 text-lg font-semibold gap-2 animate-pulse-glow"
                  >
                    <Ticket className="w-5 h-5" />
                    {status === "inactive" ? "Not Available" : "Generate Token"}
                  </Button>
                  {status === "active" && (
                    <p className="text-xs text-muted-foreground mt-3">
                      One token per session. Valid for today only.
                    </p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Info Card */}
        <div className="max-w-md mx-auto mt-8">
          <Card className="animate-fade-in bg-card/50" style={{ animationDelay: "0.3s" }}>
            <CardContent className="flex items-center gap-4 p-4">
              <div className="w-12 h-12 rounded-full bg-accent/10 flex items-center justify-center">
                <Calendar className="w-6 h-6 text-accent" />
              </div>
              <div>
                <p className="font-medium">Distribution Period</p>
                <p className="text-sm text-muted-foreground">
                  {daysRemaining > 0
                    ? `${daysRemaining} days remaining`
                    : "Next period starts on the 1st"}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border mt-12 py-6">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>Digital Ration Token System • Resets daily at midnight</p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
