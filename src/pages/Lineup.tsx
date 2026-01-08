import { useState, useEffect } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { NeonCard, NeonCardContent } from "@/components/ui/NeonCard";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { 
  TableProperties, 
  FileText,
  Palette,
  User,
  Loader2,
  Send,
  Bell,
  Check,
  MessageSquare
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useIssues, useLineupItems } from "@/hooks/useIssues";
import { format, differenceInDays } from "date-fns";
import { he } from "date-fns/locale";
import { LineupRowActions } from "@/components/lineup/LineupRowActions";
import { ReminderStatusIcon } from "@/components/lineup/ReminderStatusIcon";
import { AssignmentButton } from "@/components/lineup/AssignmentButton";
import { EditableStatusCell } from "@/components/lineup/EditableStatusCell";
import { EditableTextField } from "@/components/lineup/EditableTextField";
import { LineupComments } from "@/components/lineup/LineupComments";
import { useAuth } from "@/hooks/useAuth";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const getDeadlineStatus = (daysLeft: number): "critical" | "urgent" | "warning" | "success" | "waiting" => {
  if (daysLeft <= 0) return "critical";
  if (daysLeft <= 2) return "urgent";
  if (daysLeft <= 7) return "warning";
  return "waiting";
};

const getStatusDisplay = (textReady: boolean, filesReady: boolean, isDesigned: boolean) => {
  if (isDesigned) return { label: "מאושר", color: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20" };
  if (textReady && filesReady) return { label: "הושלם", color: "bg-yellow-500/10 text-yellow-700 border-yellow-500/20" };
  if (textReady || filesReady) return { label: "בעבודה", color: "bg-sky-500/10 text-sky-600 border-sky-500/20" };
  return { label: "ממתין", color: "bg-muted text-muted-foreground" };
};

export default function Lineup() {
  const { data: issues, isLoading: issuesLoading } = useIssues();
  const [selectedIssueId, setSelectedIssueId] = useState<string>("");
  const { hasPermission, user, role } = useAuth();
  const queryClient = useQueryClient();
  
  const canManageReminders = hasPermission(["admin", "editor"]);
  const canEdit = role === "admin" || role === "editor";
  
  // Filter only active issues (not drafts)
  const activeIssues = issues?.filter(i => i.status !== "draft") || [];
  
  // Set first active issue as default when loaded
  const effectiveIssueId = selectedIssueId || activeIssues[0]?.id || "";
  
  const { data: lineupItems, isLoading: lineupLoading, refetch: refetchLineup } = useLineupItems(effectiveIssueId);
  
  const selectedIssue = activeIssues.find(i => i.id === effectiveIssueId);
  
  // Calculate days left based on issue's sketch_close_date
  const getDaysLeft = (item: typeof lineupItems extends (infer T)[] ? T : never) => {
    if (!selectedIssue?.sketch_close_date) return 999;
    const closeDate = new Date(selectedIssue.sketch_close_date);
    return differenceInDays(closeDate, new Date());
  };

  // Fetch comments count for each lineup item
  const [commentsCounts, setCommentsCounts] = useState<Record<string, number>>({});
  
  useEffect(() => {
    const fetchCommentsCounts = async () => {
      if (!lineupItems?.length) return;
      const counts: Record<string, number> = {};
      for (const item of lineupItems) {
        const { count } = await supabase
          .from("lineup_comments")
          .select("*", { count: "exact", head: true })
          .eq("lineup_item_id", item.id);
        counts[item.id] = count || 0;
      }
      setCommentsCounts(counts);
    };
    fetchCommentsCounts();
  }, [lineupItems]);

  const isLoading = issuesLoading || lineupLoading;

  return (
    <AppLayout>
      <div className="space-y-6 animate-fade-in-up">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-rubik font-bold text-foreground flex items-center gap-3">
              <TableProperties className="w-8 h-8 text-accent" />
              ליינאפ
            </h1>
            <p className="text-muted-foreground mt-1">ניהול תוכן הגליון</p>
          </div>
          <div className="flex items-center gap-4">
            <Select value={effectiveIssueId} onValueChange={setSelectedIssueId}>
              <SelectTrigger className="w-[280px]">
                <SelectValue placeholder="בחר גליון" />
              </SelectTrigger>
              <SelectContent>
                {activeIssues.map((issue) => (
                  <SelectItem key={issue.id} value={issue.id}>
                    {issue.magazine?.name} - גליון {issue.issue_number} ({issue.theme})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-6 text-sm flex-wrap">
          <span className="text-muted-foreground">מקרא:</span>
          <div className="flex items-center gap-4 flex-wrap">
            <StatusBadge status="critical">היום</StatusBadge>
            <StatusBadge status="urgent">יומיים</StatusBadge>
            <StatusBadge status="warning">ממתין</StatusBadge>
            <StatusBadge status="success">מאושר</StatusBadge>
          </div>
          <div className="flex items-center gap-3 text-muted-foreground border-r pr-4">
            <div className="flex items-center gap-1">
              <Send className="w-4 h-4 text-emerald-500" />
              <span className="text-xs">הקצאה נשלחה</span>
            </div>
            <div className="flex items-center gap-1">
              <Bell className="w-4 h-4 text-orange-500" />
              <span className="text-xs">תזכורת נשלחה</span>
            </div>
          </div>
        </div>

        {/* Lineup Table */}
        <NeonCard>
          <NeonCardContent className="p-0 overflow-x-auto">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
              </div>
            ) : !effectiveIssueId ? (
              <div className="text-center py-12 text-muted-foreground">
                אין גליונות פעילים. צור גליון חדש בעמוד הגיליונות.
              </div>
            ) : lineupItems?.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                אין פריטים בליינאפ של גליון זה.
              </div>
            ) : (
              <table className="w-full">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="p-4 text-right font-medium text-muted-foreground w-12"></th>
                    <th className="p-4 text-right font-medium text-muted-foreground w-20">עמודים</th>
                    <th className="p-4 text-right font-medium text-muted-foreground">תוכן</th>
                    <th className="p-4 text-right font-medium text-muted-foreground w-32">ספק</th>
                    
                    <th className="p-4 text-right font-medium text-muted-foreground w-12">💬</th>
                    <th className="p-4 text-right font-medium text-muted-foreground w-28">דדליין</th>
                    <th className="p-4 text-center font-medium text-muted-foreground w-16">📄</th>
                    <th className="p-4 text-center font-medium text-muted-foreground w-16">📁</th>
                    <th className="p-4 text-center font-medium text-muted-foreground w-16">🎨</th>
                    {canManageReminders && (
                      <th className="p-4 text-right font-medium text-muted-foreground w-28">הקצאה</th>
                    )}
                    {canManageReminders && (
                      <th className="p-4 text-right font-medium text-muted-foreground w-12"></th>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {lineupItems?.map((item) => {
                    const daysLeft = getDaysLeft(item);
                    const contentStatus = getStatusDisplay(item.text_ready, item.files_ready, false);
                    const designStatus = getStatusDisplay(item.is_designed, item.is_designed, item.is_designed);
                    const pages = item.page_start === item.page_end 
                      ? String(item.page_start) 
                      : `${item.page_start}-${item.page_end}`;
                    
                    return (
                      <tr
                        key={item.id}
                        className={cn(
                          "border-b last:border-b-0 hover:bg-muted/30 transition-colors group",
                          daysLeft <= 0 && "bg-red-500/5",
                          daysLeft > 0 && daysLeft <= 2 && "bg-orange-500/5"
                        )}
                      >
                        <td className="p-4">
                          {item.supplier && (
                            <ReminderStatusIcon lineupItemId={item.id} />
                          )}
                        </td>
                        <td className="p-4 text-muted-foreground">{pages}</td>
                        <td className="p-4">
                          {canEdit ? (
                            <EditableTextField
                              lineupItemId={item.id}
                              field="content"
                              initialValue={item.content}
                              placeholder="תוכן"
                              onUpdate={() => refetchLineup()}
                            />
                          ) : (
                            <span className="font-medium">{item.content}</span>
                          )}
                        </td>
                        <td className="p-4">
                          {item.supplier ? (
                            <div className="flex items-center gap-2">
                              <User className="w-4 h-4 text-muted-foreground" />
                              <span className="text-sm">{item.supplier.name}</span>
                            </div>
                          ) : (
                            <span className="text-muted-foreground text-sm">-</span>
                          )}
                        </td>
                        <td className="p-4">
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button variant="ghost" size="sm" className="gap-1 relative">
                                <MessageSquare className="w-4 h-4" />
                                {(commentsCounts[item.id] || 0) > 0 && (
                                  <Badge variant="secondary" className="h-5 min-w-[20px] text-xs">
                                    {commentsCounts[item.id]}
                                  </Badge>
                                )}
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-2xl">
                              <LineupComments lineupItemId={item.id} contentTitle={item.content} />
                            </DialogContent>
                          </Dialog>
                        </td>
                        <td className="p-4">
                          {selectedIssue?.sketch_close_date && (
                            <StatusBadge status={getDeadlineStatus(daysLeft)} pulse={daysLeft <= 0}>
                              {format(new Date(selectedIssue.sketch_close_date), "dd/MM/yyyy")}
                            </StatusBadge>
                          )}
                        </td>
                        <td className="p-4 text-center">
                          <EditableStatusCell
                            lineupItemId={item.id}
                            field="text_ready"
                            initialValue={item.text_ready}
                            onUpdate={() => refetchLineup()}
                          />
                        </td>
                        <td className="p-4 text-center">
                          <EditableStatusCell
                            lineupItemId={item.id}
                            field="files_ready"
                            initialValue={item.files_ready}
                            onUpdate={() => refetchLineup()}
                          />
                        </td>
                        <td className="p-4 text-center">
                          <EditableStatusCell
                            lineupItemId={item.id}
                            field="is_designed"
                            initialValue={item.is_designed}
                            onUpdate={() => refetchLineup()}
                          />
                        </td>
                        {canManageReminders && (
                          <td className="p-4">
                            {item.supplier && selectedIssue && (
                              <AssignmentButton
                                lineupItemId={item.id}
                                supplierId={item.supplier_id || null}
                                supplierName={item.supplier?.name || null}
                                supplierPhone={item.supplier?.phone || null}
                                content={item.content}
                                pageStart={item.page_start}
                                pageEnd={item.page_end}
                                magazineName={selectedIssue.magazine?.name || "מגזין"}
                                issueNumber={selectedIssue.issue_number}
                                issueTheme={selectedIssue.theme}
                                issueId={selectedIssue.id}
                                designStartDate={selectedIssue.design_start_date}
                                editorName={"העורך"}
                                assignmentSent={(item as any).assignment_sent}
                                assignmentSentDate={(item as any).assignment_sent_date}
                              />
                            )}
                          </td>
                        )}
                        {canManageReminders && (
                          <td className="p-4">
                            {item.supplier && selectedIssue && (
                              <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                                <LineupRowActions
                                  lineupItemId={item.id}
                                  supplierId={item.supplier_id || null}
                                  supplierName={item.supplier?.name || null}
                                  supplierPhone={item.supplier?.phone || null}
                                  content={item.content}
                                  pageStart={item.page_start}
                                  pageEnd={item.page_end}
                                  magazineName={selectedIssue.magazine?.name || "מגזין"}
                                  issueNumber={selectedIssue.issue_number}
                                  issueTheme={selectedIssue.theme}
                                  issueId={selectedIssue.id}
                                  designStartDate={selectedIssue.design_start_date}
                                  editorName={"העורך"}
                                />
                              </div>
                            )}
                          </td>
                        )}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </NeonCardContent>
        </NeonCard>
      </div>
    </AppLayout>
  );
}
