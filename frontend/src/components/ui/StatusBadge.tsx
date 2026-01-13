import * as React from "react";
import { cn } from "@/lib/utils";
import { cva, type VariantProps } from "class-variance-authority";

const statusBadgeVariants = cva(
  "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium border transition-colors",
  {
    variants: {
      status: {
        critical: "status-critical",
        urgent: "status-urgent",
        warning: "status-warning",
        success: "status-success",
        waiting: "status-waiting",
      },
    },
    defaultVariants: {
      status: "waiting",
    },
  }
);

interface StatusBadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof statusBadgeVariants> {
  pulse?: boolean;
}

const StatusBadge = React.forwardRef<HTMLSpanElement, StatusBadgeProps>(
  ({ className, status, pulse = false, children, ...props }, ref) => {
    return (
      <span
        ref={ref}
        className={cn(statusBadgeVariants({ status }), className)}
        {...props}
      >
        {pulse && (
          <span className="relative flex h-2 w-2">
            <span
              className={cn(
                "animate-ping absolute inline-flex h-full w-full rounded-full opacity-75",
                status === "critical" && "bg-red-500",
                status === "urgent" && "bg-orange-500",
                status === "warning" && "bg-yellow-500",
                status === "success" && "bg-emerald-500",
                status === "waiting" && "bg-sky-500"
              )}
            />
            <span
              className={cn(
                "relative inline-flex rounded-full h-2 w-2",
                status === "critical" && "bg-red-500",
                status === "urgent" && "bg-orange-500",
                status === "warning" && "bg-yellow-500",
                status === "success" && "bg-emerald-500",
                status === "waiting" && "bg-sky-500"
              )}
            />
          </span>
        )}
        {children}
      </span>
    );
  }
);

StatusBadge.displayName = "StatusBadge";

export { StatusBadge, statusBadgeVariants };
