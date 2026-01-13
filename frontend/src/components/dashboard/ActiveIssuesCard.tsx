import { BookOpen, ChevronLeft } from "lucide-react";
import { Link } from "react-router-dom";
import { GlassCard, GlassCardHeader, GlassCardContent } from "@/components/ui/GlassCard";

interface Issue {
  id: string;
  name: string;
  number: number;
  progress: number;
  totalItems: number;
  completedItems: number;
}

interface ActiveIssuesCardProps {
  issues: Issue[];
}

export function ActiveIssuesCard({ issues }: ActiveIssuesCardProps) {
  return (
    <GlassCard className="col-span-full lg:col-span-2 h-full" hover={false}>
      <GlassCardHeader icon={BookOpen} title="גליונות פעילים" />
      <GlassCardContent>
        {issues.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <BookOpen className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p>אין גליונות פעילים</p>
          </div>
        ) : (
          <div className="space-y-3">
            {issues.map((issue) => (
              <Link
                key={issue.id}
                to={`/issues?view=${issue.id}`}
                className="block p-4 rounded-2xl bg-muted/30 dark:bg-white/[0.02] border border-border/50 dark:border-white/[0.08] transition-all duration-300 hover:bg-muted/50 dark:hover:bg-white/[0.05] hover:border-accent/30 hover:-translate-y-0.5 group"
              >
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h4 className="font-semibold text-[15px]">{issue.name}</h4>
                    <p className="text-xs text-muted-foreground bg-muted/50 dark:bg-white/[0.05] px-2.5 py-1 rounded-full inline-block mt-1">
                      גליון #{issue.number}
                    </p>
                  </div>
                  <ChevronLeft className="w-5 h-5 text-muted-foreground group-hover:text-accent transition-colors" />
                </div>
                
                {/* Progress Bar */}
                <div className="h-2 bg-muted dark:bg-white/10 rounded overflow-hidden mb-2">
                  <div 
                    className="h-full bg-gradient-to-r from-accent to-accent/70 rounded relative"
                    style={{ width: `${issue.progress}%` }}
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer" />
                  </div>
                </div>
                
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>{issue.completedItems} מתוך {issue.totalItems} פריטים הושלמו</span>
                  <span className="font-semibold text-accent">{issue.progress}%</span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </GlassCardContent>
    </GlassCard>
  );
}
