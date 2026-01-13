import * as React from "react";
import { cn } from "@/lib/utils";

interface NeonCardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "glow" | "status" | "glass";
  status?: "critical" | "urgent" | "warning" | "success" | "waiting";
}

const NeonCard = React.forwardRef<HTMLDivElement, NeonCardProps>(
  ({ className, variant = "default", status, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "rounded-xl border bg-card text-card-foreground transition-all duration-300",
          variant === "default" && "card-shadow hover:card-shadow-hover hover:-translate-y-0.5",
          variant === "glow" && "neon-shadow hover:neon-shadow-lg hover:-translate-y-1",
          variant === "glass" && "glass-card glass-card-hover",
          variant === "status" && status === "critical" && "border-status-critical/30 shadow-[0_4px_20px_-2px_hsl(var(--status-critical)/0.25)]",
          variant === "status" && status === "urgent" && "border-status-urgent/30 shadow-[0_4px_20px_-2px_hsl(var(--status-urgent)/0.25)]",
          variant === "status" && status === "warning" && "border-status-warning/30 shadow-[0_4px_20px_-2px_hsl(var(--status-warning)/0.25)]",
          variant === "status" && status === "success" && "border-status-success/30 shadow-[0_4px_20px_-2px_hsl(var(--status-success)/0.25)]",
          variant === "status" && status === "waiting" && "border-status-waiting/30 shadow-[0_4px_20px_-2px_hsl(var(--status-waiting)/0.25)]",
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);

NeonCard.displayName = "NeonCard";

const NeonCardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex flex-col space-y-1.5 p-5", className)}
    {...props}
  />
));
NeonCardHeader.displayName = "NeonCardHeader";

const NeonCardTitle = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h3
    ref={ref}
    className={cn("text-xl font-rubik font-bold leading-none tracking-tight", className)}
    {...props}
  />
));
NeonCardTitle.displayName = "NeonCardTitle";

const NeonCardDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn("text-sm text-muted-foreground", className)}
    {...props}
  />
));
NeonCardDescription.displayName = "NeonCardDescription";

const NeonCardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("p-5 pt-0", className)} {...props} />
));
NeonCardContent.displayName = "NeonCardContent";

const NeonCardFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex items-center p-5 pt-0", className)}
    {...props}
  />
));
NeonCardFooter.displayName = "NeonCardFooter";

export { NeonCard, NeonCardHeader, NeonCardFooter, NeonCardTitle, NeonCardDescription, NeonCardContent };
