import { AlertTriangle, AlertCircle, Clock } from "lucide-react";
import { NeonCard, NeonCardContent, NeonCardHeader, NeonCardTitle } from "@/components/ui/NeonCard";

interface UrgentItemsCardProps {
  critical: number;
  urgent: number;
  normal: number;
}

export function UrgentItemsCard({ critical, urgent, normal }: UrgentItemsCardProps) {
  return (
    <NeonCard variant="glow" className="col-span-full lg:col-span-1">
      <NeonCardHeader>
        <NeonCardTitle className="flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-accent" />
          פריטים דחופים
        </NeonCardTitle>
      </NeonCardHeader>
      <NeonCardContent>
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center p-4 rounded-xl bg-red-500/10 border border-red-500/20">
            <AlertCircle className="w-6 h-6 text-red-500 mx-auto mb-2" />
            <div className="text-3xl font-rubik font-bold text-red-500">{critical}</div>
            <div className="text-xs text-muted-foreground mt-1">קריטי</div>
          </div>
          <div className="text-center p-4 rounded-xl bg-orange-500/10 border border-orange-500/20">
            <AlertTriangle className="w-6 h-6 text-orange-500 mx-auto mb-2" />
            <div className="text-3xl font-rubik font-bold text-orange-500">{urgent}</div>
            <div className="text-xs text-muted-foreground mt-1">דחוף</div>
          </div>
          <div className="text-center p-4 rounded-xl bg-sky-500/10 border border-sky-500/20">
            <Clock className="w-6 h-6 text-sky-500 mx-auto mb-2" />
            <div className="text-3xl font-rubik font-bold text-sky-500">{normal}</div>
            <div className="text-xs text-muted-foreground mt-1">רגיל</div>
          </div>
        </div>
      </NeonCardContent>
    </NeonCard>
  );
}
