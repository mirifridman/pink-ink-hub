import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
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
import { useToast } from '@/hooks/use-toast';
import { Loader2, FolderKanban } from 'lucide-react';

interface ConvertToProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  taskId: string;
  taskTitle: string;
}

export function ConvertToProjectModal({ isOpen, onClose, taskId, taskTitle }: ConvertToProjectModalProps) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [projectName, setProjectName] = useState(taskTitle);
  const [isLoading, setIsLoading] = useState(false);

  const handleConvert = async () => {
    if (!projectName.trim()) {
      toast({ title: 'שגיאה', description: 'נא להזין שם לפרויקט', variant: 'destructive' });
      return;
    }

    setIsLoading(true);

    try {
      // Create the project
      const { data: newProject, error: projectError } = await supabase
        .from('projects')
        .insert({
          name: projectName,
          status: 'planning',
          created_by: user?.id,
        })
        .select()
        .single();

      if (projectError) throw projectError;

      // Link the task to the project
      const { error: taskError } = await supabase
        .from('tasks')
        .update({ project_id: newProject.id })
        .eq('id', taskId);

      if (taskError) throw taskError;

      toast({ title: 'הצלחה', description: 'המשימה הומרה לפרויקט בהצלחה' });
      
      queryClient.invalidateQueries({ queryKey: ['projects-with-stats'] });
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      
      onClose();
      navigate('/projects');
    } catch (error: any) {
      console.error('Error converting to project:', error);
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
            <FolderKanban className="h-5 w-5" />
            המרה לפרויקט
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <p className="text-sm text-muted-foreground">
            המרת משימה לפרויקט תיצור פרויקט חדש ותשייך אליו את המשימה הנוכחית.
          </p>

          <div className="space-y-2">
            <Label htmlFor="projectName">שם הפרויקט *</Label>
            <Input
              id="projectName"
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              placeholder="הזן שם לפרויקט"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>ביטול</Button>
          <Button onClick={handleConvert} disabled={isLoading}>
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <>
                <FolderKanban className="h-4 w-4 ml-2" />
                צור פרויקט
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
