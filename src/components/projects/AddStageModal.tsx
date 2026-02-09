import { useState, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Loader2, GitBranch } from 'lucide-react';
import type { Database } from '@/integrations/supabase/types';

type ProjectStage = Database['public']['Tables']['project_stages']['Row'];

interface AddStageModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
  stage: ProjectStage | null;
  nextOrderIndex: number;
}

export function AddStageModal({
  isOpen,
  onClose,
  projectId,
  stage,
  nextOrderIndex,
}: AddStageModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const isEditMode = !!stage;

  useEffect(() => {
    if (stage) {
      setName(stage.name);
      setDescription(stage.description || '');
    } else {
      setName('');
      setDescription('');
    }
  }, [stage, isOpen]);

  const handleSave = async () => {
    if (!name.trim()) {
      toast({ title: 'שגיאה', description: 'נא להזין שם לשלב', variant: 'destructive' });
      return;
    }

    setIsLoading(true);

    try {
      if (isEditMode) {
        const { error } = await supabase
          .from('project_stages')
          .update({ name, description })
          .eq('id', stage.id);

        if (error) throw error;
        toast({ title: 'השלב עודכן בהצלחה' });
      } else {
        const { error } = await supabase
          .from('project_stages')
          .insert({
            project_id: projectId,
            name,
            description,
            order_index: nextOrderIndex,
            status: 'pending',
          });

        if (error) throw error;
        toast({ title: 'השלב נוסף בהצלחה' });
      }

      queryClient.invalidateQueries({ queryKey: ['project-stages', projectId] });
      queryClient.invalidateQueries({ queryKey: ['projects-with-stats'] });
      onClose();
    } catch (error: any) {
      toast({ title: 'שגיאה', description: error.message, variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <GitBranch className="h-5 w-5" />
            {isEditMode ? 'עריכת שלב' : 'הוספת שלב חדש'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="name">שם השלב *</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="לדוגמה: תכנון, פיתוח, בדיקות"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">תיאור (אופציונלי)</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="תיאור קצר של השלב"
              rows={3}
            />
          </div>

          {!isEditMode && (
            <div className="p-3 bg-muted/50 rounded-lg text-sm text-muted-foreground">
              השלב יתווסף במיקום #{nextOrderIndex + 1}. תוכל לשנות את הסדר על ידי גרירה.
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            ביטול
          </Button>
          <Button onClick={handleSave} disabled={isLoading}>
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : isEditMode ? (
              'עדכן'
            ) : (
              'הוסף שלב'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
