import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { NeonCard, NeonCardContent } from "@/components/ui/NeonCard";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Plus, BookOpen, Calendar, Users, ChevronLeft, Lock } from "lucide-react";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import { useAuth } from "@/hooks/useAuth";
import { useIssues, useIssue, useLineupItems } from "@/hooks/useIssues";
import { NewIssueModal, NewIssueData } from "@/components/issues/NewIssueModal";
import { LineupBuilder } from "@/components/issues/LineupBuilder";
import { format } from "date-fns";
import { he } from "date-fns/locale";

export default function Issues() {
  const { role } = useAuth();
  const { data: issues, isLoading } = useIssues();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  
  const editIssueId = searchParams.get("edit");
  const viewIssueId = searchParams.get("view");
  const { data: editIssue } = useIssue(editIssueId || undefined);
  
  const [showNewIssueModal, setShowNewIssueModal] = useState(false);
  const [showLineupBuilder, setShowLineupBuilder] = useState(false);
  const [newIssueData, setNewIssueData] = useState<NewIssueData | null>(null);
  const [editingIssueId, setEditingIssueId] = useState<string | null>(null);

  const canCreateIssue = role === "admin" || role === "editor";

  // Redirect view parameter to lineup page
  useEffect(() => {
    if (viewIssueId) {
      navigate(`/lineup?issue=${viewIssueId}`, { replace: true });
    }
  }, [viewIssueId, navigate]);

  const handleContinueToLineup = (data: NewIssueData) => {
    setNewIssueData(data);
    setShowNewIssueModal(false);
    setShowLineupBuilder(true);
  };

  const handleCloseBuilder = () => {
    setShowLineupBuilder(false);
    setNewIssueData(null);
    setEditingIssueId(null);
    setSearchParams({});
  };

  // Handle edit from URL parameter (e.g., from Lineup page)
  useEffect(() => {
    if (editIssue && !showLineupBuilder) {
      const issueData: NewIssueData = {
        magazine_id: editIssue.magazine_id,
        issue_number: editIssue.issue_number,
        template_pages: editIssue.template_pages as 52 | 68,
        distribution_month: new Date(editIssue.distribution_month),
        theme: editIssue.theme,
        design_start_date: new Date(editIssue.design_start_date),
        sketch_close_date: new Date(editIssue.sketch_close_date),
        print_date: new Date(editIssue.print_date),
        editor_ids: [],
        hebrew_month: (editIssue as any).hebrew_month || undefined,
      };
      
      setNewIssueData(issueData);
      setEditingIssueId(editIssue.id);
      setShowLineupBuilder(true);
    }
  }, [editIssue, showLineupBuilder]);

  const activeIssues = issues?.filter(i => i.status === "in_progress" || i.status === "draft") || [];
  const completedIssues = issues?.filter(i => i.status === "completed") || [];

  return (
    <AppLayout>
      <div className="space-y-8 animate-fade-in-up">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-rubik font-bold text-foreground">גליונות</h1>
            <p className="text-muted-foreground mt-1">ניהול גליונות המגזינים</p>
          </div>
          
          {canCreateIssue ? (
            <Button 
              onClick={() => setShowNewIssueModal(true)}
              className="gradient-neon text-white neon-shadow hover:neon-shadow-lg transition-shadow"
            >
              <Plus className="w-4 h-4 ml-2" />
              גיליון חדש
            </Button>
          ) : (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button disabled className="opacity-50">
                  <Lock className="w-4 h-4 ml-2" />
                  גיליון חדש
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>אין הרשאה ליצור גיליון</p>
              </TooltipContent>
            </Tooltip>
          )}
        </div>

        {/* Active Issues */}
        <div>
          <h2 className="text-xl font-rubik font-bold mb-4 flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-accent" />
            גליונות בהפקה
          </h2>
          
          {isLoading ? (
            <div className="text-muted-foreground">טוען...</div>
          ) : activeIssues.length === 0 ? (
            <NeonCard>
              <NeonCardContent className="p-8 text-center text-muted-foreground">
                אין גליונות בהפקה
              </NeonCardContent>
            </NeonCard>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {activeIssues.map((issue) => (
                <IssueCard key={issue.id} issue={issue} />
              ))}
            </div>
          )}
        </div>

        {/* Completed Issues */}
        {completedIssues.length > 0 && (
          <div>
            <h2 className="text-xl font-rubik font-bold mb-4 flex items-center gap-2">
              <StatusBadge status="success">הושלמו</StatusBadge>
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {completedIssues.map((issue) => (
                <NeonCard 
                  key={issue.id} 
                  className="group cursor-pointer hover:border-primary/50 transition-colors"
                  onClick={() => navigate(`/lineup?issue=${issue.id}`)}
                >
                  <NeonCardContent className="p-4">
                    <div className="flex items-center gap-4">
                      <div className="w-16 h-24 rounded-lg overflow-hidden flex-shrink-0 bg-muted flex items-center justify-center">
                        <BookOpen className="w-8 h-8 text-muted-foreground" />
                      </div>
                      <div>
                        <h3 className="font-medium">{issue.magazine.name}</h3>
                        <p className="text-sm text-muted-foreground">גיליון #{issue.issue_number}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {format(new Date(issue.distribution_month), "MMMM yyyy", { locale: he })}
                        </p>
                      </div>
                    </div>
                  </NeonCardContent>
                </NeonCard>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* New Issue Modal */}
      <NewIssueModal
        open={showNewIssueModal}
        onOpenChange={setShowNewIssueModal}
        onContinue={handleContinueToLineup}
      />

      {/* Lineup Builder Dialog */}
      <Dialog open={showLineupBuilder} onOpenChange={handleCloseBuilder}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
          <VisuallyHidden>
            <DialogTitle>בניית ליינאפ</DialogTitle>
            <DialogDescription>עריכה או יצירה של ליינאפ לגיליון</DialogDescription>
          </VisuallyHidden>
          {newIssueData && (
            <LineupBuilder
              issueData={newIssueData}
              existingIssueId={editingIssueId || undefined}
              onBack={() => {
                if (editingIssueId) {
                  // If editing, go back to the issue view
                  handleCloseBuilder();
                  setSearchParams({ view: editingIssueId });
                } else {
                  setShowLineupBuilder(false);
                  setShowNewIssueModal(true);
                }
              }}
              onClose={handleCloseBuilder}
            />
          )}
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}

interface IssueCardProps {
  issue: {
    id: string;
    magazine: { name: string };
    issue_number: number;
    theme: string;
    distribution_month: string;
    template_pages: number;
    status: string;
  };
}

function IssueCard({ issue }: IssueCardProps) {
  const { data: lineupItems = [] } = useLineupItems(issue.id);
  const navigate = useNavigate();

  // Calculate progress
  const totalPages = issue.template_pages;
  const definedPages = lineupItems.reduce((sum, item) => sum + (item.page_end - item.page_start + 1), 0);
  const designedPages = lineupItems
    .filter(item => item.is_designed)
    .reduce((sum, item) => sum + (item.page_end - item.page_start + 1), 0);
  
  const progress = totalPages > 0 ? Math.round((designedPages / totalPages) * 100) : 0;

  const handleClick = () => {
    // Navigate directly to Lineup page with this issue selected
    navigate(`/lineup?issue=${issue.id}`);
  };

  return (
    <NeonCard 
      variant="glow" 
      className="group cursor-pointer overflow-hidden"
      onClick={handleClick}
    >
      <div className="flex">
        <div className="w-32 h-48 flex-shrink-0 overflow-hidden bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
          <BookOpen className="w-12 h-12 text-primary/50" />
        </div>
        <div className="flex-1 p-5">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="font-rubik font-bold text-lg">{issue.magazine.name}</h3>
              <p className="text-muted-foreground text-sm">גיליון #{issue.issue_number}</p>
              <p className="text-sm text-primary mt-1">{issue.theme}</p>
            </div>
            <ChevronLeft className="w-5 h-5 text-muted-foreground group-hover:text-accent transition-colors" />
          </div>
          
          <div className="mt-4 space-y-3">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Calendar className="w-4 h-4" />
              <span>הפצה: {format(new Date(issue.distribution_month), "MMMM yyyy", { locale: he })}</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Users className="w-4 h-4" />
              <span>{definedPages} מתוך {totalPages} עמודים מוגדרים</span>
            </div>
          </div>

          <div className="mt-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">התקדמות עיצוב</span>
              <span className="font-medium">{progress}%</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>

          {issue.status === "draft" && (
            <div className="mt-3">
              <StatusBadge status="warning">טיוטה</StatusBadge>
            </div>
          )}
        </div>
      </div>
    </NeonCard>
  );
}
