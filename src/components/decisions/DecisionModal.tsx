import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Save, Trash2, Scale, Loader2, Calendar } from 'lucide-react';
import {
  useDecision,
  useCreateDecision,
  useUpdateDecision,
  useDeleteDecision,
} from '@/hooks/useDecisions';
import { useProjectsWithStats } from '@/hooks/useProjects';
import { DocumentUploader } from '@/components/shared/DocumentUploader';
import { format } from 'date-fns';

interface DecisionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  decisionId: string | null;
  defaultProjectId?: string | null;
}

const statusOptions = [
  { value: 'active', label: 'פעיל', color: 'bg-green-500/10 text-green-500' },
  { value: 'archived', label: 'בארכיון', color: 'bg-muted text-muted-foreground' },
  { value: 'superseded', label: 'הוחלף', color: 'bg-yellow-500/10 text-yellow-500' },
];

export function DecisionModal({ open, onOpenChange, decisionId, defaultProjectId }: DecisionModalProps) {
  const isEditing = !!decisionId;

  const { data: decision, isLoading } = useDecision(decisionId);
  const { data: projects } = useProjectsWithStats();
  const createDecision = useCreateDecision();
  const updateDecision = useUpdateDecision();
  const deleteDecision = useDeleteDecision();

  const [activeTab, setActiveTab] = useState('details');
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    decision_date: format(new Date(), 'yyyy-MM-dd'),
    decided_by: '',
    project_id: '',
    status: 'active',
  });

  useEffect(() => {
    if (decision && isEditing) {
      setFormData({
        title: decision.title || '',
        description: decision.description || '',
        decision_date: decision.decision_date || format(new Date(), 'yyyy-MM-dd'),
        decided_by: decision.decided_by || '',
        project_id: decision.project_id || '',
        status: decision.status || 'active',
      });
    } else if (!isEditing) {
      setFormData({
        title: '',
        description: '',
        decision_date: format(new Date(), 'yyyy-MM-dd'),
        decided_by: '',
        project_id: defaultProjectId || '',
        status: 'active',
      });
      setActiveTab('details');
    }
  }, [decision, isEditing, open, defaultProjectId]);

  const handleSubmit = async () => {
    if (!formData.title.trim()) return;

    const payload = {
      ...formData,
      project_id: formData.project_id || null,
    };

    if (isEditing) {
      await updateDecision.mutateAsync({ id: decisionId, ...payload });
    } else {
      await createDecision.mutateAsync(payload);
    }
    onOpenChange(false);
  };

  const handleDelete = async () => {
    if (!decisionId) return;
    await deleteDecision.mutateAsync(decisionId);
    onOpenChange(false);
  };

  const isSaving = createDecision.isPending || updateDecision.isPending;
  const currentStatus = statusOptions.find((s) => s.value === formData.status);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Scale className="h-5 w-5" />
            {isEditing ? 'עריכת החלטה' : 'החלטה חדשה'}
          </DialogTitle>
        </DialogHeader>

        {isLoading && isEditing ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <>
            <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col overflow-hidden">
              <TabsList className="flex w-full justify-start gap-1">
                <TabsTrigger value="details" className="flex-1">פרטים</TabsTrigger>
                <TabsTrigger value="documents" disabled={!isEditing} className="flex-1">
                  מסמכים
                </TabsTrigger>
              </TabsList>

              <ScrollArea className="flex-1 mt-4">
                <TabsContent value="details" className="m-0 space-y-4">
                  {/* Title */}
                  <div className="space-y-2">
                    <Label htmlFor="title">כותרת *</Label>
                    <Input
                      id="title"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      placeholder="תיאור ההחלטה"
                    />
                  </div>

                  {/* Description */}
                  <div className="space-y-2">
                    <Label htmlFor="description">תיאור מפורט</Label>
                    <Textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      placeholder="פירוט ההחלטה, הרקע, והשלכות..."
                      rows={4}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    {/* Decision Date */}
                    <div className="space-y-2">
                      <Label htmlFor="decision_date">תאריך החלטה</Label>
                      <div className="relative">
                        <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="decision_date"
                          type="date"
                          value={formData.decision_date}
                          onChange={(e) => setFormData({ ...formData, decision_date: e.target.value })}
                          className="pr-10"
                        />
                      </div>
                    </div>

                    {/* Decided By */}
                    <div className="space-y-2">
                      <Label htmlFor="decided_by">מחליט</Label>
                      <Input
                        id="decided_by"
                        value={formData.decided_by}
                        onChange={(e) => setFormData({ ...formData, decided_by: e.target.value })}
                        placeholder="מי קיבל את ההחלטה"
                      />
                    </div>
                  </div>

                  {/* Project */}
                  <div className="space-y-2">
                    <Label>פרויקט קשור</Label>
                    <Select
                      value={formData.project_id || 'none'}
                      onValueChange={(value) =>
                        setFormData({ ...formData, project_id: value === 'none' ? '' : value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="בחר פרויקט" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">ללא פרויקט</SelectItem>
                        {projects?.map((project) => (
                          <SelectItem key={project.id} value={project.id}>
                            {project.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Status */}
                  <div className="space-y-2">
                    <Label>סטטוס</Label>
                    <Select
                      value={formData.status}
                      onValueChange={(value) => setFormData({ ...formData, status: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {statusOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className={option.color}>
                                {option.label}
                              </Badge>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </TabsContent>

                <TabsContent value="documents" className="m-0">
                  {decisionId && (
                    <DocumentUploader entityType="decision" entityId={decisionId} />
                  )}
                </TabsContent>
              </ScrollArea>
            </Tabs>

            {/* Actions */}
            <div className="flex items-center justify-between pt-4 border-t">
              {isEditing ? (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive" size="sm">
                      <Trash2 className="h-4 w-4 ml-2" />
                      מחק
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>למחוק את ההחלטה?</AlertDialogTitle>
                      <AlertDialogDescription>
                        פעולה זו תמחק את ההחלטה וכל המסמכים המצורפים אליה.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>ביטול</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={handleDelete}
                        className="bg-destructive text-destructive-foreground"
                      >
                        מחק
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              ) : (
                <div />
              )}

              <div className="flex gap-2">
                <Button variant="outline" onClick={() => onOpenChange(false)}>
                  ביטול
                </Button>
                <Button onClick={handleSubmit} disabled={!formData.title.trim() || isSaving}>
                  {isSaving ? (
                    <Loader2 className="h-4 w-4 ml-2 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4 ml-2" />
                  )}
                  {isEditing ? 'שמור' : 'צור'}
                </Button>
              </div>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
