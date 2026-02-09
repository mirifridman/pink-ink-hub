import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Mail, Calendar, User, Trash2, Check, X, ChevronDown, ChevronUp, Pencil, Send, Lightbulb, FolderPlus } from 'lucide-react';
import { format } from 'date-fns';
import { he } from 'date-fns/locale';
import { useActiveEmployees } from '@/hooks/useEmployees';
import type { IncomingEmail, ConvertEmailOptions } from '@/hooks/useIncomingEmails';
import type { Database } from '@/integrations/supabase/types';

type TaskPriority = Database['public']['Enums']['task_priority'];
type TaskStatus = Database['public']['Enums']['task_status'];

interface EmailTaskCardProps {
  email: IncomingEmail;
  onConvert: (options: ConvertEmailOptions) => Promise<{ id: string } | undefined>;
  onDelete: () => void;
  onOpenApprovalRequest: (task: { id: string; title: string; description?: string }) => void;
  onConvertToDecision: (data: { title: string; description: string }) => void;
  onConvertToProject: (data: { title: string; description: string }) => void;
  isConverting?: boolean;
}

export interface ConvertOptions {
  priority: TaskPriority;
  status: TaskStatus;
  assignees: string[];
  approvalType: 'manual' | 'request' | 'none';
  approvalUserId?: string;
}

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

export function EmailTaskCard({
  email,
  onConvert,
  onDelete,
  onOpenApprovalRequest,
  onConvertToDecision,
  onConvertToProject,
  isConverting,
}: EmailTaskCardProps) {
  const { data: employees } = useActiveEmployees();
  
  const [isExpanded, setIsExpanded] = useState(false);
  const [priority, setPriority] = useState<TaskPriority>('medium');
  const [status, setStatus] = useState<TaskStatus>('new');
  const [selectedAssignees, setSelectedAssignees] = useState<string[]>([]);
  const [editedTitle, setEditedTitle] = useState(email.subject);
  const [editedDescription, setEditedDescription] = useState(email.content || '');

  const toggleAssignee = (empId: string) => {
    setSelectedAssignees(prev =>
      prev.includes(empId)
        ? prev.filter(id => id !== empId)
        : [...prev, empId]
    );
  };

  // Manual approval and create task
  const handleManualApproval = async () => {
    await onConvert({
      priority,
      status: 'approved',
      assignees: selectedAssignees,
      approvalType: 'manual',
      title: editedTitle,
      description: editedDescription,
    });
  };

  // Create task and then open approval request modal (handled by parent so it won't close when email disappears)
  const handleRequestApproval = async () => {
    const result = await onConvert({
      priority,
      status: 'new',
      assignees: selectedAssignees,
      approvalType: 'none',
      title: editedTitle,
      description: editedDescription,
    });

    if (result?.id) {
      onOpenApprovalRequest({ id: result.id, title: editedTitle, description: editedDescription });
    }
  };

  

  return (
    <>
      <Card className="border-blue-500/30 bg-blue-500/5 hover:border-blue-500/50 transition-all">
        <CardContent className="p-4 space-y-3">
          {/* Header with badge */}
          <div className="flex items-center justify-between">
            <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">
              <Mail className="h-3 w-3 ml-1" />
              מייל נכנס
            </Badge>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={() => setIsExpanded(!isExpanded)}
              >
                {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </Button>
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
            </div>
          </div>

          {/* Subject & Content - Read only when collapsed */}
          {!isExpanded && (
            <div>
              <h3 className="font-semibold text-foreground line-clamp-1">{email.subject}</h3>
              {email.content && (
                <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                  {email.content}
                </p>
              )}
            </div>
          )}

          {/* Sender Info */}
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <User className="h-4 w-4" />
            <span>{email.sender_name}</span>
            {email.sender_email && (
              <span className="text-xs">({email.sender_email})</span>
            )}
          </div>

          {/* Expanded Options */}
          {isExpanded && (
            <div className="space-y-4 pt-3 border-t border-border/50">
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

            </div>
          )}

          {/* Footer */}
          <div className="pt-2 border-t border-border/50 space-y-3">
            {!isExpanded ? (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1 text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  <span className="text-xs">
                    {format(new Date(email.sent_at), 'd בMMM, HH:mm', { locale: he })}
                  </span>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  className="border-blue-500/30 text-blue-400 hover:bg-blue-500/10"
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsExpanded(true);
                  }}
                >
                  עריכה והקמת משימה
                  <Pencil className="h-4 w-4 mr-1" />
                </Button>
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  className="w-full border-green-500/30 text-green-400 hover:bg-green-500/10"
                  onClick={handleManualApproval}
                  disabled={isConverting}
                >
                  <Check className="h-4 w-4 ml-1" />
                  אישור ידני והקמת משימה
                </Button>
                <Button
                  size="sm"
                  className="w-full bg-blue-600 hover:bg-blue-700"
                  onClick={handleRequestApproval}
                  disabled={isConverting}
                >
                  <Send className="h-4 w-4 ml-1" />
                  שליחת בקשה לאישור והקמת משימה
                </Button>
              </div>
            )}

            {/* Convert to Decision / Project buttons */}
            <div className="grid grid-cols-2 gap-2">
              <Button
                size="sm"
                variant="outline"
                className="border-purple-500/30 text-purple-400 hover:bg-purple-500/10"
                onClick={() => onConvertToDecision({ title: editedTitle, description: editedDescription })}
                disabled={isConverting}
              >
                <Lightbulb className="h-4 w-4 ml-1" />
                המרה להחלטה
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="border-amber-500/30 text-amber-400 hover:bg-amber-500/10"
                onClick={() => onConvertToProject({ title: editedTitle, description: editedDescription })}
                disabled={isConverting}
              >
                <FolderPlus className="h-4 w-4 ml-1" />
                המרה לפרויקט
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </>
  );
}
