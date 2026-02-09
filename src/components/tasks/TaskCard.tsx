import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar, Paperclip, Users, Send, Mail, ChevronDown, ChevronUp, Pencil, Check, X, Lightbulb, FolderPlus, Trash2, Download, FileText, FileImage, File, Eye, Sparkles, Clock, Repeat } from 'lucide-react';
import { format } from 'date-fns';
import { he } from 'date-fns/locale';
import { useActiveEmployees } from '@/hooks/useEmployees';
import { useDocuments, getDocumentUrl, type Document } from '@/hooks/useDocuments';
import { SendApprovalRequestModal } from './SendApprovalRequestModal';
import { EmailViewModal } from '@/components/emails/EmailViewModal';
import { DocumentPreviewModal } from '@/components/shared/DocumentPreviewModal';
import type { Database } from '@/integrations/supabase/types';

type TaskWithDetails = Database['public']['Views']['tasks_with_details']['Row'];
type TaskPriority = Database['public']['Enums']['task_priority'];
type TaskStatus = Database['public']['Enums']['task_status'];

interface TaskCardProps {
  task: TaskWithDetails;
  onClick: () => void;
  onApprove?: () => void;
  showApproveButton?: boolean;
  onConvertToDecision?: (data: { title: string; description: string }) => void;
  onConvertToProject?: (data: { title: string; description: string }) => void;
  onDelete?: () => void;
  onSave?: (updates: {
    title: string;
    description: string;
    priority: TaskPriority;
    status: TaskStatus;
    assignees: string[];
  }) => Promise<void>;
}

const priorityConfig = {
  low: { label: 'נמוכה', className: 'bg-muted text-muted-foreground border-border' },
  medium: { label: 'בינונית', className: 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border-emerald-500/30' },
  high: { label: 'גבוהה', className: 'bg-orange-500/20 text-orange-600 dark:text-orange-400 border-orange-500/30' },
  urgent: { label: 'דחופה', className: 'bg-red-500/20 text-red-600 dark:text-red-400 border-red-500/30' },
};

const priorityOptions: { value: TaskPriority; label: string; color: string }[] = [
  { value: 'low', label: 'נמוכה', color: 'bg-muted text-muted-foreground' },
  { value: 'medium', label: 'בינונית', color: 'bg-blue-500/20 text-blue-600 dark:text-blue-400' },
  { value: 'high', label: 'גבוהה', color: 'bg-orange-500/20 text-orange-600 dark:text-orange-400' },
  { value: 'urgent', label: 'דחופה', color: 'bg-red-500/20 text-red-600 dark:text-red-400' },
];

const statusOptions: { value: TaskStatus; label: string }[] = [
  { value: 'new', label: 'חדשה' },
  { value: 'approved', label: 'מאושרת' },
  { value: 'in_progress', label: 'בביצוע' },
  { value: 'partial', label: 'הושלם חלקית' },
  { value: 'completed', label: 'הושלמה' },
  { value: 'stuck', label: 'תקוע' },
];

const approvalStatusConfig = {
  pending: { label: 'ממתין לאישור', className: 'bg-yellow-500/20 text-yellow-600 dark:text-yellow-400' },
  approved: { label: 'מאושר', className: 'bg-green-500/20 text-green-600 dark:text-green-400' },
  rejected: { label: 'נדחה', className: 'bg-red-500/20 text-red-600 dark:text-red-400' },
  request_sent: { label: 'נשלחה בקשה', className: 'bg-blue-500/20 text-blue-600 dark:text-blue-400' },
};

export function TaskCard({ 
  task, 
  onClick, 
  onApprove, 
  showApproveButton = false,
  onConvertToDecision,
  onConvertToProject,
  onDelete,
  onSave
}: TaskCardProps) {
  const [sendRequestModalOpen, setSendRequestModalOpen] = useState(false);
  const [emailModalOpen, setEmailModalOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [previewDocument, setPreviewDocument] = useState<Document | null>(null);
  const { data: employees } = useActiveEmployees();
  const { data: documents = [] } = useDocuments('task', task.id || null);
  
  // Helper to get file icon
  const getFileIcon = (filePath: string) => {
    const ext = filePath.split('.').pop()?.toLowerCase();
    if (['pdf'].includes(ext || '')) return <FileText className="h-4 w-4 text-destructive" />;
    if (['doc', 'docx'].includes(ext || '')) return <FileText className="h-4 w-4 text-primary" />;
    if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext || '')) return <FileImage className="h-4 w-4 text-primary" />;
    return <File className="h-4 w-4 text-muted-foreground" />;
  };
  
  // Editable fields
  const [editedTitle, setEditedTitle] = useState(task.title || '');
  const [editedDescription, setEditedDescription] = useState(task.description || '');
  const [priority, setPriority] = useState<TaskPriority>(task.priority || 'medium');
  const [status, setStatus] = useState<TaskStatus>(task.status || 'new');
  const [selectedAssignees, setSelectedAssignees] = useState<string[]>(
    ((task.assignees as { id: string; full_name: string }[] | null) || []).map(a => a.id)
  );
  
  const priorityDisplay = priorityConfig[task.priority || 'medium'];
  const approvalStatus = approvalStatusConfig[task.approval_status || 'pending'];
  
  const assignees = (task.assignees as { id: string; full_name: string }[] | null) || [];
  const hasAssignees = assignees.length > 0;
  
  // Check if task was created from email (can be via direct conversion or n8n)
  // For n8n tasks, source_reference might contain external_id even if source is 'n8n'
  const isFromEmail = (task.source === 'email' || task.source === 'n8n') && task.source_reference;
  
  // Check if task was created by AI (via n8n automation - has no created_by user)
  const isAICreated = (task.source === 'email' || task.source === 'n8n') && !task.created_by;

  const toggleAssignee = (empId: string) => {
    setSelectedAssignees(prev =>
      prev.includes(empId)
        ? prev.filter(id => id !== empId)
        : [...prev, empId]
    );
  };

  const handleApproveClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onApprove?.();
  };

  const handleEditClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onClick();
  };

  const handleSendRequestClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setSendRequestModalOpen(true);
  };

  const handleEmailLinkClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setEmailModalOpen(true);
  };

  const handleManualApproval = async () => {
    if (!onSave) return;
    setIsSaving(true);
    try {
      await onSave({
        title: editedTitle,
        description: editedDescription,
        priority,
        status: 'approved',
        assignees: selectedAssignees,
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveChanges = async () => {
    if (!onSave) return;
    setIsSaving(true);
    try {
      await onSave({
        title: editedTitle,
        description: editedDescription,
        priority,
        status,
        assignees: selectedAssignees,
      });
      setIsExpanded(false);
    } finally {
      setIsSaving(false);
    }
  };

  // Show send request button only for pending tasks that don't have a request sent yet
  const canSendRequest = task.approval_status === 'pending';

  return (
    <>
      <Card className="overflow-hidden border-border/50 hover:border-primary/30 transition-all hover:shadow-lg hover:shadow-primary/5">
        {/* Gradient Top Border */}
        <div className="h-1 bg-gradient-to-l from-cyan-400 via-blue-500 to-primary" />
        
        <CardContent className="p-4 space-y-3">
          {/* Header Row - Title, Priority Badge & Controls */}
          <div className="flex items-start justify-between gap-3">
            {!isExpanded ? (
              <h3 
                className="font-bold text-foreground line-clamp-2 flex-1 cursor-pointer hover:text-primary transition-colors"
                onClick={onClick}
              >
                {task.title}
              </h3>
            ) : (
              <div className="flex-1" />
            )}
            <div className="flex items-center gap-1 shrink-0">
              <Badge variant="outline" className={priorityDisplay.className}>
                {priorityDisplay.label}
              </Badge>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsExpanded(!isExpanded);
                }}
              >
                {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </Button>
              {onDelete && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-muted-foreground hover:text-destructive"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete();
                  }}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>

          {/* Collapsed View */}
          {!isExpanded && (
            <>
              {/* Description */}
              {task.description && (
                <p className="text-sm text-muted-foreground line-clamp-3">
                  {task.description}
                </p>
              )}

              {/* Meta Row - Attachments, Due Date, Assignment Status, Email Link */}
              <div className="flex items-center gap-3 flex-wrap text-sm">
                {/* Email Source Link */}
                {isFromEmail && (
                  <button
                    onClick={handleEmailLinkClick}
                    className="flex items-center gap-1 text-primary hover:text-primary/80 transition-colors"
                    title="צפה במייל המקור"
                  >
                    <Mail className="h-4 w-4" />
                    <span className="text-xs underline">מייל מקור</span>
                  </button>
                )}
                
                {/* Attachments with Popover */}
                {documents.length > 0 && (
                  <Popover>
                    <PopoverTrigger asChild>
                      <button 
                        className="flex items-center gap-1 text-muted-foreground hover:text-primary transition-colors"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Paperclip className="h-4 w-4" />
                        <span>{documents.length}</span>
                      </button>
                    </PopoverTrigger>
                    <PopoverContent 
                      className="w-72 p-3" 
                      align="start"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <h4 className="text-sm font-medium mb-2">קבצים מצורפים</h4>
                      <div className="space-y-2 max-h-48 overflow-y-auto">
                        {documents.map((doc) => (
                          <div
                            key={doc.id}
                            className="flex items-center gap-2 p-2 rounded-lg bg-muted/50 hover:bg-muted transition-colors group"
                          >
                            {getFileIcon(doc.file_path)}
                            <span className="flex-1 text-sm truncate">{doc.name}</span>
                            <button
                              onClick={() => setPreviewDocument(doc)}
                              className="p-1 rounded hover:bg-primary/10 transition-colors"
                              title="צפייה בקובץ"
                            >
                              <Eye className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                            </button>
                            <a
                              href={getDocumentUrl(doc.file_path)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-1 rounded hover:bg-primary/10 transition-colors"
                              title="הורד קובץ"
                            >
                              <Download className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                            </a>
                          </div>
                        ))}
                      </div>
                    </PopoverContent>
                  </Popover>
                )}
                
                {/* Due Date */}
                {task.due_date && (
                  <div className="flex items-center gap-1 text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    <span>{format(new Date(task.due_date), 'd בMMM', { locale: he })}</span>
                  </div>
                )}
                
                {/* Recurrence Badge */}
                {(task as any).recurrence_type && (
                  <Badge variant="outline" className="bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/30">
                    <Repeat className="h-3 w-3 ml-1" />
                    {(() => {
                      const recurrenceType = (task as any).recurrence_type;
                      const labels: Record<string, string> = {
                        daily: 'יומי',
                        weekly: 'שבועי',
                        monthly: 'חודשי',
                        yearly: 'שנתי',
                      };
                      return labels[recurrenceType] || recurrenceType;
                    })()}
                  </Badge>
                )}
                
                {/* Assignment Status Badge */}
                <Badge 
                  variant="outline" 
                  className={hasAssignees 
                    ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30' 
                    : 'bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/30'
                  }
                >
                  <Users className="h-3 w-3 ml-1" />
                  {hasAssignees ? 'שויך' : 'ממתין לשיבוץ'}
                </Badge>

                {/* Approval Status Badge */}
                {task.approval_status && task.approval_status !== 'pending' && (
                  <Badge className={approvalStatus.className}>
                    {approvalStatus.label}
                  </Badge>
                )}

                {/* AI Created Badge */}
                {isAICreated && (
                  <Badge variant="outline" className="bg-violet-500/10 text-violet-600 dark:text-violet-400 border-violet-500/30">
                    <Sparkles className="h-3 w-3 ml-1" />
                    נוצר ע"י AI
                  </Badge>
                )}

                {/* Creation Time */}
                {task.created_at && (
                  <div className="flex items-center gap-1 text-muted-foreground text-xs">
                    <Clock className="h-3 w-3" />
                    <span>{format(new Date(task.created_at), 'd/M HH:mm', { locale: he })}</span>
                  </div>
                )}
              </div>

              {/* Action Buttons - Collapsed */}
              <div className="flex gap-2 pt-2 border-t border-border/50">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  onClick={handleEditClick}
                >
                  ערוך
                </Button>
                
                {canSendRequest && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 gap-1"
                    onClick={handleSendRequestClick}
                  >
                    <Send className="h-3 w-3" />
                    שלח לאישור
                  </Button>
                )}
                
                {showApproveButton && (
                  <Button
                    size="sm"
                    className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white"
                    onClick={handleApproveClick}
                  >
                    אשר משימה
                  </Button>
                )}
              </div>
            </>
          )}

          {/* Expanded View - Full Edit Mode */}
          {isExpanded && (
            <div className="space-y-4">
              {/* Editable Title & Description */}
              <div className="space-y-3">
                <div className="space-y-1.5">
                  <Label className="text-xs flex items-center gap-1">
                    <Pencil className="h-3 w-3" />
                    נושא המשימה
                  </Label>
                  <Input
                    value={editedTitle}
                    onChange={(e) => setEditedTitle(e.target.value)}
                    className="h-9"
                    placeholder="נושא המשימה..."
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs flex items-center gap-1">
                    <Pencil className="h-3 w-3" />
                    תיאור המשימה
                  </Label>
                  <Textarea
                    value={editedDescription}
                    onChange={(e) => setEditedDescription(e.target.value)}
                    className="min-h-[80px] resize-none"
                    placeholder="תיאור המשימה..."
                  />
                </div>
              </div>

              {/* Priority & Status Row */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs">עדיפות</Label>
                  <Select value={priority} onValueChange={(v) => setPriority(v as TaskPriority)}>
                    <SelectTrigger className="h-9">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {priorityOptions.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          <span className={`px-2 py-0.5 rounded text-xs ${opt.color}`}>
                            {opt.label}
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs">סטטוס</Label>
                  <Select value={status} onValueChange={(v) => setStatus(v as TaskStatus)}>
                    <SelectTrigger className="h-9">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {statusOptions.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Assignees */}
              <div className="space-y-1.5">
                <Label className="text-xs">שיוך לעובדים</Label>
                <div className="flex flex-wrap gap-1.5 p-2 border rounded-lg min-h-[60px] bg-muted/30">
                  {employees?.map((emp) => (
                    <Badge
                      key={emp.id}
                      variant={selectedAssignees.includes(emp.id) ? 'default' : 'outline'}
                      className="cursor-pointer transition-all text-xs"
                      onClick={() => toggleAssignee(emp.id)}
                    >
                      {emp.full_name}
                      {selectedAssignees.includes(emp.id) && (
                        <X className="h-3 w-3 mr-1" />
                      )}
                    </Badge>
                  ))}
                  {(!employees || employees.length === 0) && (
                    <p className="text-xs text-muted-foreground">אין עובדים פעילים</p>
                  )}
                </div>
              </div>

              {/* Email Source Link in expanded mode */}
              {isFromEmail && (
                <button
                  onClick={handleEmailLinkClick}
                  className="flex items-center gap-1 text-primary hover:text-primary/80 transition-colors text-sm"
                  title="צפה במייל המקור"
                >
                  <Mail className="h-4 w-4" />
                  <span className="underline">צפה במייל המקור</span>
                </button>
              )}

              {/* Action Buttons - Expanded */}
              <div className="pt-2 border-t border-border/50 space-y-3">
                {/* Save & Approve Buttons */}
                <div className="flex flex-col gap-2">
                  {onSave && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="w-full"
                      onClick={handleSaveChanges}
                      disabled={isSaving}
                    >
                      <Check className="h-4 w-4 ml-1" />
                      שמור שינויים
                    </Button>
                  )}
                  {canSendRequest && onSave && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="w-full border-green-500/30 text-green-400 hover:bg-green-500/10"
                      onClick={handleManualApproval}
                      disabled={isSaving}
                    >
                      <Check className="h-4 w-4 ml-1" />
                      אישור ידני והקמת משימה
                    </Button>
                  )}
                  {canSendRequest && (
                    <Button
                      size="sm"
                      className="w-full bg-blue-600 hover:bg-blue-700"
                      onClick={handleSendRequestClick}
                      disabled={isSaving}
                    >
                      <Send className="h-4 w-4 ml-1" />
                      שליחת בקשה לאישור
                    </Button>
                  )}
                </div>

                {/* Convert to Decision / Project buttons */}
                {(onConvertToDecision || onConvertToProject) && (
                  <div className="grid grid-cols-2 gap-2">
                    {onConvertToDecision && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="border-purple-500/30 text-purple-400 hover:bg-purple-500/10"
                        onClick={() => onConvertToDecision({ title: editedTitle, description: editedDescription })}
                        disabled={isSaving}
                      >
                        <Lightbulb className="h-4 w-4 ml-1" />
                        המרה להחלטה
                      </Button>
                    )}
                    {onConvertToProject && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="border-amber-500/30 text-amber-400 hover:bg-amber-500/10"
                        onClick={() => onConvertToProject({ title: editedTitle, description: editedDescription })}
                        disabled={isSaving}
                      >
                        <FolderPlus className="h-4 w-4 ml-1" />
                        המרה לפרויקט
                      </Button>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Send Approval Request Modal */}
      <SendApprovalRequestModal
        isOpen={sendRequestModalOpen}
        onClose={() => setSendRequestModalOpen(false)}
        task={task}
      />

      {/* Email View Modal */}
      <EmailViewModal
        emailId={task.source_reference || null}
        open={emailModalOpen}
        onOpenChange={setEmailModalOpen}
      />

      {/* Document Preview Modal */}
      <DocumentPreviewModal
        open={!!previewDocument}
        onOpenChange={(open) => !open && setPreviewDocument(null)}
        filePath={previewDocument?.file_path || null}
        fileName={previewDocument?.name}
      />
    </>
  );
}
