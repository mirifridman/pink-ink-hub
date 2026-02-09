import { useState, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Send, Clock } from 'lucide-react';

interface ApprovalRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  taskId: string;
  taskTitle: string;
}

interface Profile {
  id: string;
  full_name: string | null;
  email: string;
  role: string | null;
}

export function ApprovalRequestModal({ isOpen, onClose, taskId, taskTitle }: ApprovalRequestModalProps) {
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [selectedUser, setSelectedUser] = useState<string>('');
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [isLoadingProfiles, setIsLoadingProfiles] = useState(true);

  // Load profiles when modal opens
  useEffect(() => {
    const loadProfiles = async () => {
      if (!isOpen) return;
      
      setIsLoadingProfiles(true);
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, email, role')
        .neq('id', user?.id || '')
        .order('full_name');

      if (!error && data) {
        setProfiles(data);
      } else if (error) {
        console.error('Error loading profiles:', error);
      }
      setIsLoadingProfiles(false);
    };

    loadProfiles();
  }, [isOpen, user?.id]);

  const getInitials = (name: string | null, email: string) => {
    if (name) {
      return name.split(' ').map(n => n[0]).join('').slice(0, 2);
    }
    return email[0].toUpperCase();
  };

  const handleSendRequest = async () => {
    if (!selectedUser) {
      toast({ title: 'שגיאה', description: 'נא לבחור חבר צוות', variant: 'destructive' });
      return;
    }

    setIsLoading(true);

    try {
      // Create approval request
      const { data: request, error: requestError } = await supabase
        .from('task_approval_requests')
        .insert({
          task_id: taskId,
          requested_by: user?.id,
          requested_to: selectedUser,
          message: message || null,
        })
        .select()
        .single();

      if (requestError) throw requestError;

      // Update task approval status
      const { error: updateError } = await supabase
        .from('tasks')
        .update({ approval_status: 'request_sent' })
        .eq('id', taskId);

      if (updateError) throw updateError;

      // Get recipient details
      const selectedProfile = profiles.find(p => p.id === selectedUser);

      // Send email
      const response = await supabase.functions.invoke('send-email', {
        body: {
          type: 'approval_request',
          recipientEmail: selectedProfile?.email,
          recipientName: selectedProfile?.full_name,
          taskId,
          taskTitle,
          senderName: profile?.full_name || profile?.email,
          message,
          approvalToken: request.token,
          sentBy: user?.id,
        },
      });

      if (response.error) {
        console.error('Email error:', response.error);
        // Don't fail the whole operation if email fails
        toast({ 
          title: 'בקשה נשלחה', 
          description: 'הבקשה נשמרה אך המייל לא נשלח. נסה לשלוח תזכורת.',
          variant: 'default'
        });
      } else {
        toast({ title: 'הצלחה', description: 'בקשת האישור נשלחה בהצלחה' });
      }

      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['approval-requests'] });
      onClose();
    } catch (error: any) {
      console.error('Error sending approval request:', error);
      toast({ 
        title: 'שגיאה', 
        description: error.message || 'אירעה שגיאה בשליחת הבקשה', 
        variant: 'destructive' 
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>בקשת אישור משימה</DialogTitle>
          <DialogDescription>
            בחר חבר צוות לשלוח אליו בקשת אישור למשימה
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Task Title */}
          <div className="p-3 bg-muted/50 rounded-lg border">
            <p className="text-sm text-muted-foreground">משימה:</p>
            <p className="font-medium">{taskTitle}</p>
          </div>

          {/* Team Member Selection */}
          <div className="space-y-3">
            <Label>בחר חבר צוות</Label>
            {isLoadingProfiles ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <RadioGroup value={selectedUser} onValueChange={setSelectedUser}>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {profiles.map((p) => (
                    <label
                      key={p.id}
                      className="flex items-center gap-3 p-3 rounded-lg border cursor-pointer hover:bg-muted/50 transition-colors"
                    >
                      <RadioGroupItem value={p.id} />
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className="text-xs bg-primary/20 text-primary">
                          {getInitials(p.full_name, p.email)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <p className="font-medium text-sm">{p.full_name || p.email}</p>
                        <p className="text-xs text-muted-foreground">{p.email}</p>
                      </div>
                    </label>
                  ))}
                </div>
              </RadioGroup>
            )}
          </div>

          {/* Message */}
          <div className="space-y-2">
            <Label htmlFor="message">הודעה אישית (אופציונלי)</Label>
            <Textarea
              id="message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="הוסף הודעה לבקשה..."
              rows={3}
            />
          </div>

          {/* Expiry Note */}
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Clock className="h-4 w-4" />
            <span>הבקשה תהיה בתוקף למשך 7 ימים</span>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            ביטול
          </Button>
          <Button onClick={handleSendRequest} disabled={isLoading || !selectedUser}>
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <>
                <Send className="h-4 w-4 ml-2" />
                שלח בקשת אישור
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
