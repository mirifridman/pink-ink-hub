import { useState, useEffect, useRef } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { NeonCard, NeonCardContent } from "@/components/ui/NeonCard";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Progress } from "@/components/ui/progress";
import { 
  TableProperties, 
  FileText,
  Palette,
  User,
  Loader2,
  Send,
  Bell,
  Check,
  MessageSquare,
  LayoutGrid,
  Download,
  Share2,
  FileImage,
  Calendar,
  Printer,
  Pencil
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { useIssues, useLineupItems } from "@/hooks/useIssues";
import { format, differenceInDays } from "date-fns";
import { he } from "date-fns/locale";
import { LineupRowActions } from "@/components/lineup/LineupRowActions";
import { ReminderStatusIcon } from "@/components/lineup/ReminderStatusIcon";
import { AssignmentButton } from "@/components/lineup/AssignmentButton";
import { EditableStatusCell } from "@/components/lineup/EditableStatusCell";
import { EditableTextField } from "@/components/lineup/EditableTextField";
import { CommentsSidePanel } from "@/components/lineup/CommentsSidePanel";
import { FlatplanView } from "@/components/lineup/FlatplanView";
import { FlatplanExportView } from "@/components/lineup/FlatplanExportView";
import { getContentTypeColor, getContentTypeLabel } from "@/components/lineup/ContentTypeSelect";
import { EditIssueDialog } from "@/components/issues/EditIssueDialog";
import { useAuth } from "@/hooks/useAuth";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import html2canvas from "html2canvas";
import html2pdf from "html2pdf.js";

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
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { data: issues, isLoading: issuesLoading } = useIssues();
  const [selectedIssueId, setSelectedIssueId] = useState<string>("");
  const [activeTab, setActiveTab] = useState<string>("table");
  const { hasPermission, user, role } = useAuth();
  const queryClient = useQueryClient();
  const lineupContainerRef = useRef<HTMLDivElement>(null);
  const exportContainerRef = useRef<HTMLDivElement>(null);
  
  // Side panel state
  const [sidePanelOpen, setSidePanelOpen] = useState(false);
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [selectedItemContent, setSelectedItemContent] = useState<string>("");
  
  const canManageReminders = hasPermission(["admin", "editor"]);
  const canEdit = role === "admin" || role === "editor";
  
  // Filter issues - show all issues for dropdown (including archived for viewing)
  const activeIssues = issues || [];
  const archivedIssues = issues?.filter(i => i.status === "archived") || [];
  const nonArchivedIssues = issues?.filter(i => i.status !== "archived") || [];
  
  // Check for issue from URL params
  const issueFromUrl = searchParams.get("issue");
  
  // Set issue from URL or first active issue
  useEffect(() => {
    if (issueFromUrl && !selectedIssueId) {
      setSelectedIssueId(issueFromUrl);
    }
  }, [issueFromUrl, selectedIssueId]);
  
  // Set first active issue as default when loaded
  const effectiveIssueId = selectedIssueId || issueFromUrl || activeIssues[0]?.id || "";
  
  const { data: lineupItems, isLoading: lineupLoading, refetch: refetchLineup } = useLineupItems(effectiveIssueId);
  
  const selectedIssue = activeIssues.find(i => i.id === effectiveIssueId);
  const isArchived = selectedIssue?.status === "archived";
  
  // Calculate progress percentage
  const calculateProgress = () => {
    if (!lineupItems?.length || !selectedIssue) return 0;
    const totalPages = selectedIssue.template_pages;
    const completedPages = lineupItems
      .filter(item => item.text_ready || item.files_ready || item.is_designed)
      .reduce((sum, item) => sum + (item.page_end - item.page_start + 1), 0);
    return totalPages > 0 ? Math.round((completedPages / totalPages) * 100) : 0;
  };
  
  const progress = calculateProgress();
  
  // Calculate days left based on issue's sketch_close_date
  const getDaysLeft = (item: typeof lineupItems extends (infer T)[] ? T : never) => {
    if (!selectedIssue?.sketch_close_date) return 999;
    const closeDate = new Date(selectedIssue.sketch_close_date);
    return differenceInDays(closeDate, new Date());
  };

  // Fetch comments count for each lineup item
  const [commentsCounts, setCommentsCounts] = useState<Record<string, number>>({});
  
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

  useEffect(() => {
    fetchCommentsCounts();
  }, [lineupItems]);

  const handleOpenComments = (itemId: string, content: string) => {
    setSelectedItemId(itemId);
    setSelectedItemContent(content);
    setSidePanelOpen(true);
  };

  // Export functions
  const handleExportImage = async () => {
    if (!lineupContainerRef.current) return;
    try {
      const canvas = await html2canvas(lineupContainerRef.current, {
        backgroundColor: '#ffffff',
        scale: 2,
      });
      const link = document.createElement('a');
      link.download = `lineup-${selectedIssue?.magazine?.name}-${selectedIssue?.issue_number}.png`;
      link.href = canvas.toDataURL();
      link.click();
      toast.success('הליינאפ יוצא לתמונה בהצלחה!');
    } catch (error) {
      toast.error('שגיאה בייצוא התמונה');
    }
  };

  const handleExportPdf = async () => {
    if (!exportContainerRef.current || !selectedIssue || !lineupItems) return;
    try {
      toast.info('מכין את הקובץ...');
      const opt = {
        margin: 0,
        filename: `lineup-${selectedIssue?.magazine?.name}-גיליון-${selectedIssue?.issue_number}.pdf`,
        image: { type: 'jpeg' as const, quality: 0.98 },
        html2canvas: { 
          scale: 2, 
          backgroundColor: '#ffffff',
          useCORS: true,
        },
        jsPDF: { unit: 'mm' as const, format: 'a4' as const, orientation: 'portrait' as const },
        pagebreak: { mode: ['avoid-all', 'css', 'legacy'] }
      };
      await html2pdf().set(opt).from(exportContainerRef.current).save();
      toast.success('הליינאפ יוצא ל-PDF בהצלחה!');
    } catch (error) {
      console.error('PDF export error:', error);
      toast.error('שגיאה בייצוא ה-PDF');
    }
  };

  const handleShare = async () => {
    const shareUrl = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({
          title: `ליינאפ - ${selectedIssue?.magazine?.name} גיליון ${selectedIssue?.issue_number}`,
          text: `צפה בליינאפ של ${selectedIssue?.theme}`,
          url: shareUrl
        });
      } catch (err) {
        // User cancelled share
      }
    } else {
      await navigator.clipboard.writeText(shareUrl);
      toast.success('הקישור הועתק ללוח!');
    }
  };

  const handleMarkAsPrinted = async () => {
    if (!selectedIssue) return;
    
    const confirmed = window.confirm(
      `האם אתה בטוח שברצונך לסמן את גיליון ${selectedIssue.issue_number} כהודפס?\nפעולה זו תעביר את הגיליון לארכיון ותסגור את אפשרויות העריכה.`
    );
    
    if (!confirmed) return;
    
    try {
      const { error } = await supabase
        .from('issues')
        .update({ status: 'archived' })
        .eq('id', selectedIssue.id);
      
      if (error) throw error;
      
      toast.success('הגיליון הועבר לארכיון');
      queryClient.invalidateQueries({ queryKey: ['issues'] });
    } catch (error) {
      console.error('Error archiving issue:', error);
      toast.error('שגיאה בעדכון הגיליון');
    }
  };

  const isLoading = issuesLoading || lineupLoading;

  // Get item status color for row highlighting
  const getItemStatusColor = (item: NonNullable<typeof lineupItems>[number]) => {
    if (item.is_designed) {
      return 'border-r-4 border-r-amber-400 bg-amber-50/50 dark:bg-amber-900/10';
    }
    if (item.text_ready || item.files_ready) {
      return 'border-r-4 border-r-emerald-400 bg-emerald-50/50 dark:bg-emerald-900/10';
    }
    return 'border-r-4 border-r-muted';
  };

  return (
    <TooltipProvider>
      <AppLayout>
        <div className="space-y-4 md:space-y-6 animate-fade-in-up" dir="rtl" ref={lineupContainerRef}>
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-rubik font-bold text-foreground flex items-center gap-2 md:gap-3">
                <TableProperties className="w-6 h-6 md:w-8 md:h-8 text-accent" />
                ליינאפ
              </h1>
              <p className="text-sm md:text-base text-muted-foreground mt-1">ניהול תוכן הגליון</p>
            </div>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 md:gap-3">
              <Select value={effectiveIssueId} onValueChange={setSelectedIssueId}>
                <SelectTrigger className="w-full sm:w-[240px] md:w-[280px]">
                  <SelectValue placeholder="בחר גליון" />
                </SelectTrigger>
                <SelectContent>
                  {nonArchivedIssues.length > 0 && (
                    <>
                      {nonArchivedIssues.map((issue) => (
                        <SelectItem key={issue.id} value={issue.id}>
                          {issue.magazine?.name} - גליון {issue.issue_number} ({issue.theme})
                          {issue.status === "draft" && " [טיוטה]"}
                        </SelectItem>
                      ))}
                    </>
                  )}
                  {archivedIssues.length > 0 && (
                    <>
                      <div className="px-2 py-1.5 text-xs font-medium text-muted-foreground border-t mt-1 pt-2">
                        ארכיון
                      </div>
                      {archivedIssues.map((issue) => (
                        <SelectItem key={issue.id} value={issue.id} className="text-muted-foreground">
                          {issue.magazine?.name} - גליון {issue.issue_number} ({issue.theme})
                        </SelectItem>
                      ))}
                    </>
                  )}
                </SelectContent>
              </Select>
              
              {/* Export/Share Buttons */}
              <div className="flex items-center gap-2">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" className="flex-1 sm:flex-none">
                      <Download className="w-4 h-4 ml-1 md:ml-2" />
                      <span className="hidden sm:inline">ייצוא</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={handleExportImage}>
                      <FileImage className="w-4 h-4 ml-2" />
                      ייצוא לתמונה
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={handleExportPdf}>
                      <FileText className="w-4 h-4 ml-2" />
                      ייצוא ל-PDF
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
                
                <Button variant="outline" size="sm" onClick={handleShare} className="flex-1 sm:flex-none">
                  <Share2 className="w-4 h-4 ml-1 md:ml-2" />
                  <span className="hidden sm:inline">שתף</span>
                </Button>
              </div>
            </div>
          </div>

          {/* Issue Details Card */}
          {selectedIssue && (
            <NeonCard className="bg-muted/30">
              <NeonCardContent className="p-3 md:p-4">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  <div className="grid grid-cols-2 sm:flex sm:flex-wrap items-start sm:items-center gap-3 md:gap-6">
                    <div>
                      <p className="text-[10px] md:text-xs text-muted-foreground">מגזין</p>
                      <p className="font-medium text-sm md:text-base">{selectedIssue.magazine?.name}</p>
                    </div>
                    <div>
                      <p className="text-[10px] md:text-xs text-muted-foreground">נושא</p>
                      <p className="font-medium text-sm md:text-base text-primary">{selectedIssue.theme}</p>
                    </div>
                    {/* Hebrew Month Badge - only for Niflaot Kids */}
                    {(selectedIssue as any).hebrew_month && (
                      <Badge variant="secondary" className="bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300 col-span-2 sm:col-span-1 w-fit">
                        חודש {(selectedIssue as any).hebrew_month}
                      </Badge>
                    )}
                    <div className="flex items-center gap-1.5 md:gap-2">
                      <Pencil className="w-3 h-3 md:w-4 md:h-4 text-muted-foreground shrink-0" />
                      <div>
                        <p className="text-[10px] md:text-xs text-muted-foreground">סגירת סקיצה</p>
                        <p className="font-medium text-sm md:text-base">{format(new Date(selectedIssue.sketch_close_date), "dd/MM/yyyy")}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 md:gap-2">
                      <Printer className="w-3 h-3 md:w-4 md:h-4 text-muted-foreground shrink-0" />
                      <div>
                        <p className="text-[10px] md:text-xs text-muted-foreground">הורדה לדפוס</p>
                        <p className="font-medium text-sm md:text-base">{format(new Date(selectedIssue.print_date), "dd/MM/yyyy")}</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 md:gap-4">
                    {/* Progress Bar */}
                    <div className="w-full sm:min-w-[160px] md:min-w-[200px]">
                      <div className="flex justify-between text-[10px] md:text-xs mb-1">
                        <span className="text-muted-foreground">התקדמות</span>
                        <span className="font-medium">{progress}%</span>
                      </div>
                      <div className="w-full bg-muted rounded-full h-1.5 md:h-2 overflow-hidden">
                        <div 
                          className={cn(
                            "h-full rounded-full transition-all duration-500",
                            progress === 0 ? "bg-muted" : "bg-amber-400"
                          )}
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                    </div>
                    
                    {/* Edit Buttons */}
                    {canEdit && !isArchived && (
                      <div className="flex items-center gap-2 flex-wrap">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => navigate(`/issues?edit=${selectedIssue.id}`)}
                          className="flex-1 sm:flex-none text-xs md:text-sm"
                        >
                          <Pencil className="w-3 h-3 md:w-4 md:h-4 ml-1 md:ml-2" />
                          <span className="hidden sm:inline">ערוך ליינאפ</span>
                          <span className="sm:hidden">ערוך</span>
                        </Button>
                        <EditIssueDialog 
                          issue={selectedIssue} 
                          onUpdate={() => queryClient.invalidateQueries({ queryKey: ['issues'] })} 
                        />
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={handleMarkAsPrinted}
                          className="text-green-600 border-green-200 hover:bg-green-50 flex-1 sm:flex-none text-xs md:text-sm"
                        >
                          <Check className="w-3 h-3 md:w-4 md:h-4 ml-1 md:ml-2" />
                          <span className="hidden sm:inline">סמן כהודפס</span>
                          <span className="sm:hidden">הודפס</span>
                        </Button>
                      </div>
                    )}
                    {isArchived && (
                      <Badge variant="secondary" className="bg-gray-200 text-gray-600 text-xs">
                        ארכיון - תצוגה בלבד
                      </Badge>
                    )}
                  </div>
                </div>
              </NeonCardContent>
            </NeonCard>
          )}

          {/* Legend */}
          <div className="flex items-center gap-3 md:gap-6 text-xs md:text-sm flex-wrap">
            <span className="text-muted-foreground">מקרא:</span>
            <div className="flex items-center gap-2 md:gap-4 flex-wrap">
              <StatusBadge status="critical">היום</StatusBadge>
              <StatusBadge status="urgent">יומיים</StatusBadge>
              <StatusBadge status="warning">ממתין</StatusBadge>
              <StatusBadge status="success">מאושר</StatusBadge>
            </div>
            <div className="flex items-center gap-3 text-muted-foreground border-r pr-4">
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded bg-emerald-400" />
                <span className="text-xs">תוכן התקבל</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded bg-amber-400" />
                <span className="text-xs">מעוצב</span>
              </div>
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

          {/* Tabs for Table/Flatplan views */}
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList>
              <TabsTrigger value="table" className="gap-2">
                <TableProperties className="w-4 h-4" />
                טבלה
              </TabsTrigger>
              <TabsTrigger value="flatplan" className="gap-2">
                <LayoutGrid className="w-4 h-4" />
                תצוגה ויזואלית
              </TabsTrigger>
            </TabsList>

            <TabsContent value="table" className="mt-4">
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
                    <table className="w-full" dir="rtl">
                      <thead>
                        <tr className="border-b bg-muted/50">
                          <th className="p-4 text-right font-medium text-muted-foreground w-12"></th>
                          <th className="p-4 text-right font-medium text-muted-foreground w-20">עמודים</th>
                          <th className="p-4 text-right font-medium text-muted-foreground w-24">סוג</th>
                          <th className="p-4 text-right font-medium text-muted-foreground">תוכן</th>
                          <th className="p-4 text-right font-medium text-muted-foreground w-32">ספק</th>
                          <th className="p-4 text-right font-medium text-muted-foreground w-28">עורך אחראי</th>
                          <th className="p-4 text-right font-medium text-muted-foreground w-12">
                            <Tooltip>
                              <TooltipTrigger>💬</TooltipTrigger>
                              <TooltipContent>הערות</TooltipContent>
                            </Tooltip>
                          </th>
                          <th className="p-4 text-center font-medium text-muted-foreground w-16">
                            <Tooltip>
                              <TooltipTrigger>📄</TooltipTrigger>
                              <TooltipContent>טקסט מוכן</TooltipContent>
                            </Tooltip>
                          </th>
                          <th className="p-4 text-center font-medium text-muted-foreground w-16">
                            <Tooltip>
                              <TooltipTrigger>📁</TooltipTrigger>
                              <TooltipContent>קבצים מוכנים</TooltipContent>
                            </Tooltip>
                          </th>
                          <th className="p-4 text-center font-medium text-muted-foreground w-16">
                            <Tooltip>
                              <TooltipTrigger>🎨</TooltipTrigger>
                              <TooltipContent>עיצוב הושלם</TooltipContent>
                            </Tooltip>
                          </th>
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
                          const hasComments = (commentsCounts[item.id] || 0) > 0;
                          
                          return (
                            <tr
                              key={item.id}
                              className={cn(
                                "border-b last:border-b-0 hover:bg-muted/50 transition-colors group",
                                getItemStatusColor(item),
                                daysLeft <= 0 && !item.is_designed && !item.text_ready && !item.files_ready && "bg-red-50/50 dark:bg-red-900/10",
                                daysLeft > 0 && daysLeft <= 2 && !item.is_designed && !item.text_ready && !item.files_ready && "bg-orange-50/50 dark:bg-orange-900/10"
                              )}
                            >
                              <td className="p-4">
                                {item.supplier && (
                                  <ReminderStatusIcon lineupItemId={item.id} />
                                )}
                              </td>
                              <td className="p-4 text-muted-foreground">{pages}</td>
                              <td className="p-4">
                                {(item as any).content_type ? (
                                  <div className="flex items-center gap-1.5">
                                    <div className={cn("w-3 h-3 rounded-sm", getContentTypeColor((item as any).content_type))} />
                                    <span className="text-xs">{getContentTypeLabel((item as any).content_type)}</span>
                                  </div>
                                ) : (
                                  <span className="text-muted-foreground text-xs">-</span>
                                )}
                              </td>
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
                                {(item as any).responsible_editor ? (
                                  <span className="text-sm">{(item as any).responsible_editor.full_name || (item as any).responsible_editor.email}</span>
                                ) : (
                                  <span className="text-muted-foreground text-sm">-</span>
                                )}
                              </td>
                              <td className="p-4">
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button 
                                      variant="ghost" 
                                      size="sm" 
                                      className="gap-1 relative"
                                      onClick={() => handleOpenComments(item.id, item.content)}
                                    >
                                      <MessageSquare className="w-4 h-4" />
                                      {hasComments && (
                                        <>
                                          <Badge variant="secondary" className="h-5 min-w-[20px] text-xs">
                                            {commentsCounts[item.id]}
                                          </Badge>
                                          <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-pink-500 rounded-full animate-pulse" />
                                        </>
                                      )}
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>לחץ לצפייה בהערות</TooltipContent>
                                </Tooltip>
                              </td>
                              <td className="p-4 text-center">
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <div>
                                      <EditableStatusCell
                                        lineupItemId={item.id}
                                        field="text_ready"
                                        initialValue={item.text_ready}
                                        onUpdate={() => refetchLineup()}
                                      />
                                    </div>
                                  </TooltipTrigger>
                                  <TooltipContent>{item.text_ready ? "טקסט אושר" : "טקסט ממתין"}</TooltipContent>
                                </Tooltip>
                              </td>
                              <td className="p-4 text-center">
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <div>
                                      <EditableStatusCell
                                        lineupItemId={item.id}
                                        field="files_ready"
                                        initialValue={item.files_ready}
                                        onUpdate={() => refetchLineup()}
                                      />
                                    </div>
                                  </TooltipTrigger>
                                  <TooltipContent>{item.files_ready ? "קבצים התקבלו" : "קבצים ממתינים"}</TooltipContent>
                                </Tooltip>
                              </td>
                              <td className="p-4 text-center">
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <div>
                                      <EditableStatusCell
                                        lineupItemId={item.id}
                                        field="is_designed"
                                        initialValue={item.is_designed}
                                        designStatus={(item as any).design_status}
                                        onUpdate={() => refetchLineup()}
                                      />
                                    </div>
                                  </TooltipTrigger>
                                  <TooltipContent>{item.is_designed ? "עיצוב הושלם" : "עיצוב בהמתנה"}</TooltipContent>
                                </Tooltip>
                              </td>
                              {canManageReminders && (
                                <td className="p-4">
                                  {selectedIssue && (
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
            </TabsContent>

            <TabsContent value="flatplan" className="mt-4">
              <NeonCard>
                <NeonCardContent className="p-6">
                  {isLoading ? (
                    <div className="flex items-center justify-center py-12">
                      <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
                    </div>
                  ) : !effectiveIssueId || !selectedIssue ? (
                    <div className="text-center py-12 text-muted-foreground">
                      אין גליונות פעילים. צור גליון חדש בעמוד הגיליונות.
                    </div>
                  ) : (
                    <FlatplanView 
                      lineupItems={(lineupItems || []).map(item => ({
                        id: item.id,
                        page_start: item.page_start,
                        page_end: item.page_end,
                        content: item.content,
                        content_type: (item as any).content_type,
                        design_status: (item as any).design_status,
                        is_designed: item.is_designed,
                      }))}
                      templatePages={selectedIssue.template_pages}
                      issueId={selectedIssue.id}
                      onUpdate={() => refetchLineup()}
                    />
                  )}
                </NeonCardContent>
              </NeonCard>
            </TabsContent>
          </Tabs>
        </div>

        {/* Comments Side Panel */}
        <CommentsSidePanel
          open={sidePanelOpen}
          onOpenChange={setSidePanelOpen}
          lineupItemId={selectedItemId}
          contentTitle={selectedItemContent}
          onCommentCountChange={fetchCommentsCounts}
        />

        {/* Hidden export container for PDF */}
        <div className="fixed left-[-9999px] top-0 overflow-hidden">
          {selectedIssue && lineupItems && (
            <FlatplanExportView
              ref={exportContainerRef}
              lineupItems={lineupItems}
              templatePages={selectedIssue.template_pages}
              issue={selectedIssue}
            />
          )}
        </div>
      </AppLayout>
    </TooltipProvider>
  );
}
