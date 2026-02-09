import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Save, Shield, Loader2, Mail, Calendar, User as UserIcon } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { he } from 'date-fns/locale';
import { useAuth } from '@/contexts/AuthContext';

interface UserProfile {
  id: string;
  full_name: string | null;
  email: string;
  role: string;
  avatar_url: string | null;
  created_at: string;
}

interface UserModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string | null;
}

const roleOptions = [
  { value: 'viewer', label: 'צופה', description: 'יכול לצפות בנתונים בלבד' },
  { value: 'editor', label: 'עורך', description: 'יכול לערוך משימות ופרויקטים' },
  { value: 'admin', label: 'מנהל', description: 'גישה מלאה לכל הפעולות' },
];

export function UserModal({ open, onOpenChange, userId }: UserModalProps) {
  const { profile: currentUserProfile } = useAuth();
  const queryClient = useQueryClient();
  const [role, setRole] = useState('viewer');

  const { data: user, isLoading } = useQuery({
    queryKey: ['user-profile', userId],
    queryFn: async () => {
      if (!userId) return null;
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) throw error;
      return data as UserProfile;
    },
    enabled: !!userId && open,
  });

  // Fetch linked employee
  const { data: linkedEmployee } = useQuery({
    queryKey: ['user-linked-employee', userId],
    queryFn: async () => {
      if (!userId) return null;
      const { data, error } = await supabase
        .from('employees')
        .select('id, full_name, position, department')
        .eq('user_id', userId)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      return data;
    },
    enabled: !!userId && open,
  });

  useEffect(() => {
    if (user) {
      setRole(user.role || 'viewer');
    }
  }, [user]);

  const updateRoleMutation = useMutation({
    mutationFn: async (newRole: string) => {
      if (!userId) throw new Error('No user selected');

      const { error } = await supabase
        .from('profiles')
        .update({ role: newRole })
        .eq('id', userId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      queryClient.invalidateQueries({ queryKey: ['user-profile', userId] });
      toast.success('ההרשאות עודכנו בהצלחה');
      onOpenChange(false);
    },
    onError: (error: Error) => {
      toast.error('שגיאה בעדכון הרשאות: ' + error.message);
    },
  });

  const handleSave = () => {
    updateRoleMutation.mutate(role);
  };

  const isCurrentUser = currentUserProfile?.id === userId;
  const isAdmin = currentUserProfile?.role === 'admin';

  if (!userId) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserIcon className="h-5 w-5" />
            פרטי משתמש
          </DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : user ? (
          <ScrollArea className="max-h-[70vh]">
            <div className="space-y-4 pb-4">
              {/* User Info */}
              <div className="p-4 bg-muted/50 rounded-lg space-y-3">
                <div className="flex items-center gap-2">
                  <UserIcon className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">{user.full_name || 'ללא שם'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm" dir="ltr">{user.email}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">
                    הצטרף ב-{format(new Date(user.created_at), 'd בMMM yyyy', { locale: he })}
                  </span>
                </div>
              </div>

              {/* Linked Employee */}
              {linkedEmployee && (
                <>
                  <Separator />
                  <div className="space-y-2">
                    <Label>עובד מקושר</Label>
                    <div className="p-3 bg-muted/30 rounded-lg border">
                      <p className="font-medium">{linkedEmployee.full_name}</p>
                      {linkedEmployee.position && (
                        <p className="text-sm text-muted-foreground">{linkedEmployee.position}</p>
                      )}
                      {linkedEmployee.department && (
                        <Badge variant="outline" className="mt-1">{linkedEmployee.department}</Badge>
                      )}
                    </div>
                  </div>
                </>
              )}

              <Separator />

              {/* Role Selection */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Shield className="h-4 w-4" />
                  הרשאות
                </Label>
                
                {isAdmin && !isCurrentUser ? (
                  <Select value={role} onValueChange={setRole}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {roleOptions.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          <div className="flex flex-col">
                            <span>{opt.label}</span>
                            <span className="text-xs text-muted-foreground">{opt.description}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <div className="p-3 bg-muted/50 rounded-lg">
                    <Badge variant="outline" className="mb-2">
                      {roleOptions.find(r => r.value === user.role)?.label || 'צופה'}
                    </Badge>
                    {isCurrentUser && (
                      <p className="text-xs text-muted-foreground">לא ניתן לשנות את ההרשאות שלך</p>
                    )}
                    {!isAdmin && (
                      <p className="text-xs text-muted-foreground">רק מנהלים יכולים לשנות הרשאות</p>
                    )}
                  </div>
                )}
              </div>
            </div>
          </ScrollArea>
        ) : null}

        {/* Actions */}
        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            סגור
          </Button>
          {isAdmin && !isCurrentUser && (
            <Button
              onClick={handleSave}
              disabled={updateRoleMutation.isPending || role === user?.role}
            >
              {updateRoleMutation.isPending ? (
                <Loader2 className="h-4 w-4 ml-2 animate-spin" />
              ) : (
                <Save className="h-4 w-4 ml-2" />
              )}
              שמור
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
