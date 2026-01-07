import { AppLayout } from "@/components/layout/AppLayout";
import { NeonCard, NeonCardContent, NeonCardHeader, NeonCardTitle } from "@/components/ui/NeonCard";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Plus, BookOpen, Calendar, Users, ChevronLeft } from "lucide-react";
import { Link } from "react-router-dom";

const mockIssues = [
  {
    id: "1",
    name: "מגזין לילדים",
    number: 42,
    publishDate: "15/02/2026",
    progress: 68,
    totalItems: 25,
    completedItems: 17,
    status: "in-progress" as const,
    coverImage: "https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=400&h=600&fit=crop",
  },
  {
    id: "2",
    name: "מגזין טבע",
    number: 15,
    publishDate: "01/03/2026",
    progress: 45,
    totalItems: 20,
    completedItems: 9,
    status: "in-progress" as const,
    coverImage: "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=400&h=600&fit=crop",
  },
  {
    id: "3",
    name: "מגזין לילדים",
    number: 41,
    publishDate: "15/12/2025",
    progress: 100,
    totalItems: 24,
    completedItems: 24,
    status: "completed" as const,
    coverImage: "https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=400&h=600&fit=crop",
  },
];

export default function Issues() {
  return (
    <AppLayout>
      <div className="space-y-8 animate-fade-in-up">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-rubik font-bold text-foreground">גליונות</h1>
            <p className="text-muted-foreground mt-1">ניהול גליונות המגזינים</p>
          </div>
          <Button className="gradient-neon text-white neon-shadow hover:neon-shadow-lg transition-shadow">
            <Plus className="w-4 h-4 ml-2" />
            גליון חדש
          </Button>
        </div>

        {/* Active Issues */}
        <div>
          <h2 className="text-xl font-rubik font-bold mb-4 flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-accent" />
            גליונות בהפקה
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {mockIssues
              .filter((issue) => issue.status === "in-progress")
              .map((issue) => (
                <Link key={issue.id} to={`/lineup?issue=${issue.id}`}>
                  <NeonCard variant="glow" className="group cursor-pointer overflow-hidden">
                    <div className="flex">
                      <div className="w-32 h-48 flex-shrink-0 overflow-hidden">
                        <img
                          src={issue.coverImage}
                          alt={issue.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      </div>
                      <div className="flex-1 p-5">
                        <div className="flex items-start justify-between">
                          <div>
                            <h3 className="font-rubik font-bold text-lg">{issue.name}</h3>
                            <p className="text-muted-foreground text-sm">גליון #{issue.number}</p>
                          </div>
                          <ChevronLeft className="w-5 h-5 text-muted-foreground group-hover:text-accent transition-colors" />
                        </div>
                        
                        <div className="mt-4 space-y-3">
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Calendar className="w-4 h-4" />
                            <span>תאריך פרסום: {issue.publishDate}</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Users className="w-4 h-4" />
                            <span>{issue.completedItems} מתוך {issue.totalItems} פריטים הושלמו</span>
                          </div>
                        </div>

                        <div className="mt-4 space-y-2">
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">התקדמות</span>
                            <span className="font-medium">{issue.progress}%</span>
                          </div>
                          <Progress value={issue.progress} className="h-2" />
                        </div>
                      </div>
                    </div>
                  </NeonCard>
                </Link>
              ))}
          </div>
        </div>

        {/* Completed Issues */}
        <div>
          <h2 className="text-xl font-rubik font-bold mb-4 flex items-center gap-2">
            <StatusBadge status="success">הושלמו</StatusBadge>
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {mockIssues
              .filter((issue) => issue.status === "completed")
              .map((issue) => (
                <NeonCard key={issue.id} className="group cursor-pointer">
                  <NeonCardContent className="p-4">
                    <div className="flex items-center gap-4">
                      <div className="w-16 h-24 rounded-lg overflow-hidden flex-shrink-0">
                        <img
                          src={issue.coverImage}
                          alt={issue.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div>
                        <h3 className="font-medium">{issue.name}</h3>
                        <p className="text-sm text-muted-foreground">גליון #{issue.number}</p>
                        <p className="text-xs text-muted-foreground mt-1">{issue.publishDate}</p>
                      </div>
                    </div>
                  </NeonCardContent>
                </NeonCard>
              ))}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
