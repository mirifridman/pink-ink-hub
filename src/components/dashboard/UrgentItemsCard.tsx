import { AlertTriangle, AlertCircle, Clock } from "lucide-react";
import { GlassCard, GlassCardHeader, GlassCardContent } from "@/components/ui/GlassCard";

interface UrgentItemsCardProps {
  critical: number;
  urgent: number;
  normal: number;
}

const colorClasses = {
  success: {
    bg: "bg-emerald-500/20 dark:bg-emerald-500/30",
    text: "text-emerald-600 dark:text-emerald-400",
    border: "border-emerald-500/20",
  },
  warning: {
    bg: "bg-amber-500/20 dark:bg-amber-500/30",
    text: "text-amber-600 dark:text-amber-400",
    border: "border-amber-500/20",
  },
  danger: {
    bg: "bg-red-500/20 dark:bg-red-500/30",
    text: "text-red-600 dark:text-red-400",
    border: "border-red-500/20",
  },
};

export function UrgentItemsCard({ critical, urgent, normal }: UrgentItemsCardProps) {
  const stats = [
    { icon: Clock, value: normal, label: "רגיל", color: "success" as const },
    { icon: AlertTriangle, value: urgent, label: "דחוף", color: "warning" as const },
    { icon: AlertCircle, value: critical, label: "קריטי", color: "danger" as const },
  ];

  return (
    <GlassCard className="col-span-full lg:col-span-1 h-full">
      <GlassCardHeader icon={AlertTriangle} title="פריטים דחופים" />
      <GlassCardContent>
        <div className="grid grid-cols-3 gap-3">
          {stats.map((stat, index) => (
            <div
              key={index}
              className={`${colorClasses[stat.color].bg} border ${colorClasses[stat.color].border} rounded-2xl p-4 text-center transition-all duration-300 cursor-pointer hover:scale-105`}
            >
              <div className={`w-9 h-9 rounded-[10px] flex items-center justify-center mx-auto mb-2.5 ${colorClasses[stat.color].bg}`}>
                <stat.icon className={`w-5 h-5 ${colorClasses[stat.color].text}`} />
              </div>
              <div className={`text-[28px] font-bold ${colorClasses[stat.color].text}`}>
                {stat.value}
              </div>
              <div className="text-xs text-muted-foreground mt-1">{stat.label}</div>
            </div>
          ))}
        </div>
      </GlassCardContent>
    </GlassCard>
  );
}
