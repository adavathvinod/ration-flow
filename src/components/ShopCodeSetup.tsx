import { useState } from "react";
import { Save, Building2, Hash } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";

interface ShopCodeSetupProps {
  currentCode?: string | null;
  currentName?: string | null;
  onSave: (code: string, name: string) => Promise<void>;
  loading?: boolean;
}

const ShopCodeSetup = ({ currentCode, currentName, onSave, loading }: ShopCodeSetupProps) => {
  const [code, setCode] = useState(currentCode || "");
  const [name, setName] = useState(currentName || "");
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim() || !name.trim()) return;
    
    setSaving(true);
    try {
      await onSave(code.trim().toUpperCase(), name.trim());
    } finally {
      setSaving(false);
    }
  };

  const isConfigured = currentCode && currentName;

  return (
    <Card className="animate-fade-in">
      <CardHeader>
        <CardTitle className="text-lg font-medium flex items-center gap-2">
          <Building2 className="w-5 h-5" />
          Queue Instance Setup
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="shop-name">Business Name</Label>
            <Input
              id="shop-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., City Grocery Store"
              disabled={loading || saving}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="shop-code">Unique Queue Code</Label>
            <div className="relative">
              <Hash className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                id="shop-code"
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase().replace(/[^A-Z0-9-]/g, ""))}
                placeholder="e.g., SHOP-001"
                className="pl-9 font-mono tracking-wider uppercase"
                disabled={loading || saving}
                maxLength={20}
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Share this code with customers to access your queue
            </p>
          </div>
          <Button
            type="submit"
            disabled={!code.trim() || !name.trim() || loading || saving}
            className="w-full gap-2"
          >
            {saving ? (
              <div className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            {isConfigured ? "Update Settings" : "Save & Activate"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default ShopCodeSetup;
