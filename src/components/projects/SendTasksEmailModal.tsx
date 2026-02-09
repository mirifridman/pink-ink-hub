import { useState } from 'react';
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
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Mail } from 'lucide-react';

interface SendTasksEmailModalProps {
  isOpen: boolean;
  onClose: () => void;
  taskIds: string[];
  projectName: string;
}

export function SendTasksEmailModal({ isOpen, onClose, taskIds, projectName }: SendTasksEmailModalProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const [recipientName, setRecipientName] = useState('');
  const [recipientEmail, setRecipientEmail] = useState('');
  const [message, setMessage] = useState('');

  const handleSend = async () => {
    if (!recipientEmail.trim() || !recipientName.trim()) {
      toast({ title: 'שגיאה', description: 'נא למלא שם ומייל', variant: 'destructive' });
      return;
    }

    setIsLoading(true);

    try {
      // Get tasks details
      const { data: tasks, error: tasksError } = await supabase
        .from('tasks_with_details')
        .select('*')
        .in('id', taskIds);

      if (tasksError) throw tasksError;

      // Send email via edge function
      const { data, error } = await supabase.functions.invoke('send-email', {
        body: {
          type: 'task_assignment',
          to: recipientEmail,
          recipientName,
          tasks,
          projectName,
          message,
          senderName: user?.email,
        },
      });

      if (error) throw error;

      // Log the email
      await supabase.from('email_logs').insert({
        type: 'task_assignment',
        recipient_email: recipientEmail,
        recipient_name: recipientName,
        subject: `משימות מפרויקט: ${projectName}`,
        sent_by: user?.id,
        metadata: { taskIds, projectName, message },
      });

      toast({ title: 'הצלחה', description: 'המייל נשלח בהצלחה' });
      resetForm();
      onClose();
    } catch (error: any) {
      console.error('Error sending email:', error);
      toast({ title: 'שגיאה', description: error.message || 'שגיאה בשליחת המייל', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setRecipientName('');
    setRecipientEmail('');
    setMessage('');
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            שליחת משימות במייל
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="p-3 bg-muted/50 rounded-lg">
            <p className="text-sm text-muted-foreground">
              נבחרו <span className="font-medium text-foreground">{taskIds.length}</span> משימות לשליחה
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="recipientName">שם הנמען *</Label>
            <Input
              id="recipientName"
              value={recipientName}
              onChange={(e) => setRecipientName(e.target.value)}
              placeholder="הזן שם"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="recipientEmail">כתובת מייל *</Label>
            <Input
              id="recipientEmail"
              type="email"
              value={recipientEmail}
              onChange={(e) => setRecipientEmail(e.target.value)}
              placeholder="example@email.com"
              dir="ltr"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="message">הודעה אישית (אופציונלי)</Label>
            <Textarea
              id="message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="הזן הודעה אישית"
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>ביטול</Button>
          <Button onClick={handleSend} disabled={isLoading}>
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <>
                <Mail className="h-4 w-4 ml-2" />
                שלח
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
