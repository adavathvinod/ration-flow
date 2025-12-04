import { Power } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";

interface SystemToggleProps {
  isOpen: boolean;
  onToggle: (open: boolean) => void;
  disabled?: boolean;
  className?: string;
}

const SystemToggle = ({ isOpen, onToggle, disabled, className }: SystemToggleProps) => {
  return (
    <div
      className={cn(
        "flex items-center justify-between p-4 rounded-lg border transition-colors",
        isOpen 
          ? "bg-accent/10 border-accent/30" 
          : "bg-muted/50 border-border",
        className
      )}
    >
      <div className="flex items-center gap-3">
        <div
          className={cn(
            "w-10 h-10 rounded-full flex items-center justify-center transition-colors",
            isOpen ? "bg-accent text-accent-foreground" : "bg-muted text-muted-foreground"
          )}
        >
          <Power className="w-5 h-5" />
        </div>
        <div>
          <p className="font-medium">System Status</p>
          <p className="text-sm text-muted-foreground">
            {isOpen ? "Queue is open for tokens" : "Queue is closed"}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <span
          className={cn(
            "text-sm font-semibold uppercase tracking-wide",
            isOpen ? "text-accent" : "text-muted-foreground"
          )}
        >
          {isOpen ? "ON" : "OFF"}
        </span>
        <Switch
          checked={isOpen}
          onCheckedChange={onToggle}
          disabled={disabled}
          className="data-[state=checked]:bg-accent"
        />
      </div>
    </div>
  );
};

export default SystemToggle;
