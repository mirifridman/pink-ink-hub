import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { UserPlus, Loader2, Eye, EyeOff } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface CreateUserModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const roleOptions = [
  { value: 'viewer', label: 'צופה', description: 'יכול לצפות בנתונים בלבד' },
  { value: 'editor', label: 'עורך', description: 'יכול לערוך משימות ופרויקטים' },
  { value: 'admin', label: 'מנהל', description: 'גישה מלאה לכל הפעולות' },
];

export function CreateUserModal({ open, onOpenChange }: CreateUserModalProps) {
  const queryClient = useQueryClient();
  
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    fullName: '',
    role: 'viewer',
  });
  const [showPassword, setShowPassword] = useState(false);

  const createUserMutation = useMutation({
    mutationFn: async () => {
      if (!formData.email || !formData.password) {
        throw new Error('נא למלא אימייל וסיסמה');
      }
      
      if (formData.password.length < 6) {
        throw new Error('הסיסמה חייבת להכיל לפחות 6 תווים');
      }

      // Call edge function to create user (admin only)
      const { data, error } = await supabase.functions.invoke('create-user', {
        body: {
          email: formData.email,
          password: formData.password,
          fullName: formData.fullName,
          role: formData.role,
        },
      });

      if (error) {
        throw new Error(error.message || 'שגיאה ביצירת משתמש');
      }

      if (data?.error) {
        throw new Error(data.error);
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast.success('המשתמש נוצר בהצלחה');
      handleClose();
    },
    onError: (error: Error) => {
      const errorMessages: Record<string, string> = {
        'User already registered': 'משתמש עם אימייל זה כבר קיים',
        'Password should be at least 6 characters': 'הסיסמה חייבת להכיל לפחות 6 תווים',
      };
      toast.error(errorMessages[error.message] || error.message);
    },
  });

  const handleClose = () => {
    setFormData({ email: '', password: '', fullName: '', role: 'viewer' });
    setShowPassword(false);
    onOpenChange(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createUserMutation.mutate();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md" dir="rtl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5 text-primary" />
            הוספת משתמש חדש
          </DialogTitle>
          <DialogDescription>
            צור משתמש חדש עם גישה למערכת
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="fullName">שם מלא</Label>
            <Input
              id="fullName"
              value={formData.fullName}
              onChange={(e) => setFormData(prev => ({ ...prev, fullName: e.target.value }))}
              placeholder="שם המשתמש"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">אימייל *</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
              placeholder="email@example.com"
              dir="ltr"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">סיסמה *</Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                value={formData.password}
                onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                placeholder="לפחות 6 תווים"
                dir="ltr"
                className="pl-10"
                required
                minLength={6}
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute left-0 top-0 h-full px-3 hover:bg-transparent"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <Eye className="h-4 w-4 text-muted-foreground" />
                )}
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="role">הרשאות</Label>
            <Select
              value={formData.role}
              onValueChange={(value) => setFormData(prev => ({ ...prev, role: value }))}
            >
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
          </div>

          <p className="text-xs text-muted-foreground">
            * המשתמש יוכל להתחבר מיד עם הפרטים שהוזנו
          </p>

          <DialogFooter className="flex gap-2 sm:gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={createUserMutation.isPending}
              className="flex-1"
            >
              ביטול
            </Button>
            <Button
              type="submit"
              disabled={createUserMutation.isPending || !formData.email || !formData.password}
              className="flex-1 gap-2"
            >
              {createUserMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <UserPlus className="h-4 w-4" />
              )}
              צור משתמש
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
