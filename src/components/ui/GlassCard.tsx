import * as React from "react";
import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

interface GlassCardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "glow" | "gradient";
  hover?: boolean;
}

const GlassCard = React.forwardRef<HTMLDivElement, GlassCardProps>(
  ({ className, variant = "default", hover = true, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "glass-card",
          hover && "glass-card-hover cursor-pointer",
          variant === "glow" && "neon-shadow hover:neon-shadow-lg",
          variant === "gradient" && "bg-gradient-to-br from-accent/90 to-accent/70 border-none text-white",
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);

GlassCard.displayName = "GlassCard";

interface GlassCardHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  icon?: LucideIcon | string;
  title: string;
  action?: React.ReactNode;
  iconClassName?: string;
}

const GlassCardHeader = React.forwardRef<HTMLDivElement, GlassCardHeaderProps>(
  ({ className, icon, title, action, iconClassName, ...props }, ref) => {
    const IconComponent = typeof icon === "string" ? null : icon;
    
    return (
      <div
        ref={ref}
        className={cn("flex items-center justify-between mb-5", className)}
        {...props}
      >
        <div className="flex items-center gap-2.5">
          {icon && (
            <span className={cn(
              "w-8 h-8 bg-gradient-to-br from-accent to-accent/80 rounded-[10px] flex items-center justify-center text-sm text-white",
              iconClassName
            )}>
              {typeof icon === "string" ? (
                icon
              ) : IconComponent ? (
                <IconComponent className="w-4 h-4" />
              ) : null}
            </span>
          )}
          <span className="text-base font-semibold">{title}</span>
        </div>
        {action}
      </div>
    );
  }
);

GlassCardHeader.displayName = "GlassCardHeader";

const GlassCardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("", className)} {...props} />
));

GlassCardContent.displayName = "GlassCardContent";

export { GlassCard, GlassCardHeader, GlassCardContent };
