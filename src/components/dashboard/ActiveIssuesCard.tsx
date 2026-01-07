import { BookOpen, ChevronLeft } from "lucide-react";
import { Link } from "react-router-dom";
import { NeonCard, NeonCardContent, NeonCardHeader, NeonCardTitle } from "@/components/ui/NeonCard";
import { Progress } from "@/components/ui/progress";

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
    <NeonCard className="col-span-full lg:col-span-1">
      <NeonCardHeader>
        <NeonCardTitle className="flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-accent" />
          גליונות פעילים
        </NeonCardTitle>
      </NeonCardHeader>
      <NeonCardContent>
        <div className="space-y-4">
          {issues.map((issue) => (
            <Link
              key={issue.id}
              to={`/issues/${issue.id}`}
              className="block p-4 rounded-xl bg-muted/50 hover:bg-muted transition-all hover:-translate-y-0.5 group"
            >
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h4 className="font-medium">{issue.name}</h4>
                  <p className="text-sm text-muted-foreground">גליון #{issue.number}</p>
                </div>
                <ChevronLeft className="w-5 h-5 text-muted-foreground group-hover:text-accent transition-colors" />
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">התקדמות</span>
                  <span className="font-medium">{issue.progress}%</span>
                </div>
                <Progress value={issue.progress} className="h-2" />
                <p className="text-xs text-muted-foreground">
                  {issue.completedItems} מתוך {issue.totalItems} פריטים הושלמו
                </p>
              </div>
            </Link>
          ))}
        </div>
      </NeonCardContent>
    </NeonCard>
  );
}
