import { cn } from "@/lib/utils";

interface StatusBadgeProps {
  status: "active" | "inactive";
  className?: string;
}

const StatusBadge = ({ status, className }: StatusBadgeProps) => {
  const statusConfig = {
    active: {
      label: "Distribution Active",
      className: "bg-accent text-accent-foreground",
      showPulse: true,
    },
    inactive: {
      label: "Distribution Period Ended",
      className: "bg-muted text-muted-foreground",
      showPulse: false,
    },
  };

  const config = statusConfig[status];

  return (
    <div
      className={cn(
        "inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium",
        config.className,
        className
      )}
    >
      {config.showPulse && (
        <span className="relative flex h-2 w-2">
          <span className="live-indicator absolute inline-flex h-full w-full rounded-full opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-current"></span>
        </span>
      )}
      {config.label}
    </div>
  );
};

export default StatusBadge;
