import { useState } from "react";
import { Search, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface QueueCodeEntryProps {
  onSubmit: (code: string) => void;
  loading?: boolean;
  error?: string | null;
}

const QueueCodeEntry = ({ onSubmit, loading, error }: QueueCodeEntryProps) => {
  const [code, setCode] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (code.trim()) {
      onSubmit(code.trim().toUpperCase());
    }
  };

  return (
    <Card className="max-w-md mx-auto animate-fade-in">
      <CardHeader className="text-center">
        <CardTitle className="text-xl font-display">Enter Queue Code</CardTitle>
        <p className="text-sm text-muted-foreground mt-2">
          Enter the unique code provided by the business to access their queue
        </p>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="e.g., SHOP-001"
              className="pl-10 h-12 text-lg font-mono tracking-wider uppercase"
              disabled={loading}
            />
          </div>
          {error && (
            <p className="text-sm text-destructive text-center">{error}</p>
          )}
          <Button
            type="submit"
            disabled={!code.trim() || loading}
            className="w-full h-12 text-lg gap-2"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                Access Queue
                <ArrowRight className="w-5 h-5" />
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default QueueCodeEntry;
