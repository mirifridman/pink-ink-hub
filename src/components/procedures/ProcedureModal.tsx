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
import { Switch } from '@/components/ui/switch';
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
import { Save, Trash2, FileText, Paperclip, Loader2, Plus } from 'lucide-react';
import {
  useProcedure,
  useCategories,
  useCreateProcedure,
  useUpdateProcedure,
  useDeleteProcedure,
} from '@/hooks/useProcedures';
import { DocumentUploader } from '@/components/shared/DocumentUploader';

interface ProcedureModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  procedureId: string | null;
}

export function ProcedureModal({ open, onOpenChange, procedureId }: ProcedureModalProps) {
  const isEditing = !!procedureId;

  const { data: procedure, isLoading } = useProcedure(procedureId);
  const { data: categories } = useCategories();
  const createProcedure = useCreateProcedure();
  const updateProcedure = useUpdateProcedure();
  const deleteProcedure = useDeleteProcedure();

  const [activeTab, setActiveTab] = useState('details');
  const [newCategory, setNewCategory] = useState('');
  const [showNewCategory, setShowNewCategory] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    category: '',
    is_active: true,
  });

  useEffect(() => {
    if (procedure && isEditing) {
      setFormData({
        title: procedure.title || '',
        content: procedure.content || '',
        category: procedure.category || '',
        is_active: procedure.is_active ?? true,
      });
    } else if (!isEditing) {
      setFormData({
        title: '',
        content: '',
        category: '',
        is_active: true,
      });
      setActiveTab('details');
    }
  }, [procedure, isEditing, open]);

  const handleSubmit = async () => {
    if (!formData.title.trim()) return;

    const category = showNewCategory ? newCategory : formData.category;

    if (isEditing) {
      await updateProcedure.mutateAsync({
        id: procedureId,
        ...formData,
        category: category || null,
      });
    } else {
      await createProcedure.mutateAsync({
        ...formData,
        category: category || null,
      });
    }
    onOpenChange(false);
  };

  const handleDelete = async () => {
    if (!procedureId) return;
    await deleteProcedure.mutateAsync(procedureId);
    onOpenChange(false);
  };

  const isSaving = createProcedure.isPending || updateProcedure.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            {isEditing ? 'עריכת נוהל' : 'נוהל חדש'}
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
                      placeholder="שם הנוהל"
                    />
                  </div>

                  {/* Category */}
                  <div className="space-y-2">
                    <Label>קטגוריה</Label>
                    {showNewCategory ? (
                      <div className="flex gap-2">
                        <Input
                          value={newCategory}
                          onChange={(e) => setNewCategory(e.target.value)}
                          placeholder="קטגוריה חדשה"
                          className="flex-1"
                        />
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setShowNewCategory(false);
                            setNewCategory('');
                          }}
                        >
                          ביטול
                        </Button>
                      </div>
                    ) : (
                      <div className="flex gap-2">
                        <Select
                          value={formData.category || 'none'}
                          onValueChange={(value) =>
                            setFormData({ ...formData, category: value === 'none' ? '' : value })
                          }
                        >
                          <SelectTrigger className="flex-1">
                            <SelectValue placeholder="בחר קטגוריה" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">ללא קטגוריה</SelectItem>
                            {categories?.map((cat) => (
                              <SelectItem key={cat} value={cat}>
                                {cat}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => setShowNewCategory(true)}
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                  </div>

                  {/* Content */}
                  <div className="space-y-2">
                    <Label htmlFor="content">תוכן</Label>
                    <Textarea
                      id="content"
                      value={formData.content}
                      onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                      placeholder="תוכן הנוהל..."
                      rows={10}
                      className="font-mono text-sm"
                    />
                  </div>

                  {/* Active Status */}
                  <div className="flex items-center justify-between">
                    <Label htmlFor="is_active">נוהל פעיל</Label>
                    <Switch
                      id="is_active"
                      checked={formData.is_active}
                      onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                    />
                  </div>
                </TabsContent>

                <TabsContent value="documents" className="m-0">
                  {procedureId && (
                    <DocumentUploader entityType="procedure" entityId={procedureId} />
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
                      <AlertDialogTitle>למחוק את הנוהל?</AlertDialogTitle>
                      <AlertDialogDescription>
                        פעולה זו תמחק את הנוהל וכל המסמכים המצורפים אליו.
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
