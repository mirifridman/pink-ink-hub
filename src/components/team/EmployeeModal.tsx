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
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Save, Trash2, User, LinkIcon, ListTodo, Loader2 } from 'lucide-react';
import {
  Employee,
  useEmployeeWithTasks,
  useSystemUsers,
  useCreateEmployee,
  useUpdateEmployee,
  useDeleteEmployee,
} from '@/hooks/useEmployees';

interface EmployeeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  employeeId: string | null; // null = create new
}

const priorityColors: Record<string, string> = {
  low: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
  medium: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20',
  high: 'bg-orange-500/10 text-orange-500 border-orange-500/20',
  urgent: 'bg-red-500/10 text-red-500 border-red-500/20',
};

const statusLabels: Record<string, string> = {
  new: 'חדש',
  in_progress: 'בביצוע',
  stuck: 'תקוע',
  completed: 'הושלם',
};

export function EmployeeModal({ open, onOpenChange, employeeId }: EmployeeModalProps) {
  const isEditing = !!employeeId;
  
  const { data: employeeData, isLoading: loadingEmployee } = useEmployeeWithTasks(employeeId);
  const { data: systemUsers } = useSystemUsers();
  const createEmployee = useCreateEmployee();
  const updateEmployee = useUpdateEmployee();
  const deleteEmployee = useDeleteEmployee();

  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    phone: '',
    department: '',
    position: '',
    notes: '',
    is_active: true,
    user_id: '',
  });

  useEffect(() => {
    if (employeeData && isEditing) {
      setFormData({
        full_name: employeeData.full_name || '',
        email: employeeData.email || '',
        phone: employeeData.phone || '',
        department: employeeData.department || '',
        position: employeeData.position || '',
        notes: employeeData.notes || '',
        is_active: employeeData.is_active ?? true,
        user_id: employeeData.user_id || '',
      });
    } else if (!isEditing) {
      setFormData({
        full_name: '',
        email: '',
        phone: '',
        department: '',
        position: '',
        notes: '',
        is_active: true,
        user_id: '',
      });
    }
  }, [employeeData, isEditing, open]);

  const handleSubmit = async () => {
    if (!formData.full_name.trim()) return;

    const payload = {
      ...formData,
      user_id: formData.user_id || null,
    };

    if (isEditing) {
      await updateEmployee.mutateAsync({ id: employeeId, ...payload });
    } else {
      await createEmployee.mutateAsync(payload);
    }
    onOpenChange(false);
  };

  const handleDelete = async () => {
    if (!employeeId) return;
    await deleteEmployee.mutateAsync(employeeId);
    onOpenChange(false);
  };

  const isSaving = createEmployee.isPending || updateEmployee.isPending;
  const isDeleting = deleteEmployee.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            {isEditing ? 'עריכת עובד' : 'הוספת עובד חדש'}
          </DialogTitle>
        </DialogHeader>

        {loadingEmployee && isEditing ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <ScrollArea className="flex-1 pr-4">
            <div className="space-y-4 pb-4">
              {/* Name - Required */}
              <div className="space-y-2">
                <Label htmlFor="full_name">שם מלא *</Label>
                <Input
                  id="full_name"
                  value={formData.full_name}
                  onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                  placeholder="הכנס שם מלא"
                />
              </div>

              {/* Email */}
              <div className="space-y-2">
                <Label htmlFor="email">אימייל</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="example@company.com"
                  dir="ltr"
                />
              </div>

              {/* Phone */}
              <div className="space-y-2">
                <Label htmlFor="phone">טלפון</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="050-0000000"
                  dir="ltr"
                />
              </div>

              {/* Department */}
              <div className="space-y-2">
                <Label htmlFor="department">מחלקה</Label>
                <Input
                  id="department"
                  value={formData.department}
                  onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                  placeholder="מחלקת פיתוח"
                />
              </div>

              {/* Position */}
              <div className="space-y-2">
                <Label htmlFor="position">תפקיד</Label>
                <Input
                  id="position"
                  value={formData.position}
                  onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                  placeholder="מנהל פרויקטים"
                />
              </div>

              {/* Notes */}
              <div className="space-y-2">
                <Label htmlFor="notes">הערות</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="הערות נוספות..."
                  rows={2}
                />
              </div>

              <Separator />

              {/* Active Status */}
              <div className="flex items-center justify-between">
                <Label htmlFor="is_active">עובד פעיל</Label>
                <Switch
                  id="is_active"
                  checked={formData.is_active}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                />
              </div>

              {/* Link to System User */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <LinkIcon className="h-4 w-4" />
                  קישור למשתמש מערכת
                </Label>
                <Select
                  value={formData.user_id || 'none'}
                  onValueChange={(value) => {
                    const selectedUser = systemUsers?.find(u => u.id === value);
                    if (selectedUser && value !== 'none') {
                      // Auto-fill name and email from selected user
                      setFormData(prev => ({
                        ...prev,
                        user_id: value,
                        full_name: prev.full_name || selectedUser.full_name || '',
                        email: prev.email || selectedUser.email || '',
                      }));
                    } else {
                      setFormData(prev => ({ ...prev, user_id: value === 'none' ? '' : value }));
                    }
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="בחר משתמש" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">ללא קישור</SelectItem>
                    {systemUsers?.map((user) => (
                      <SelectItem key={user.id} value={user.id}>
                        <div className="flex items-center gap-2">
                          <span>{user.full_name || 'ללא שם'}</span>
                          {user.email && (
                            <span className="text-muted-foreground text-xs">({user.email})</span>
                          )}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {formData.user_id && (
                  <p className="text-xs text-muted-foreground">
                    משתמש מקושר יוכל להתחבר ולראות משימות משויכות
                  </p>
                )}
              </div>

              {/* Assigned Tasks - Only when editing */}
              {isEditing && employeeData?.tasks && employeeData.tasks.length > 0 && (
                <>
                  <Separator />
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <ListTodo className="h-4 w-4" />
                      משימות משויכות ({employeeData.tasks.length})
                    </Label>
                    <div className="space-y-2 max-h-40 overflow-y-auto">
                      {employeeData.tasks.map((task) => (
                        <div
                          key={task.id}
                          className="flex items-center justify-between p-2 bg-muted/50 rounded-md text-sm"
                        >
                          <span className="truncate flex-1">{task.title}</span>
                          <div className="flex items-center gap-2 shrink-0">
                            <Badge variant="outline" className={priorityColors[task.priority]}>
                              {task.priority}
                            </Badge>
                            <Badge variant="outline">
                              {statusLabels[task.status] || task.status}
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>
          </ScrollArea>
        )}

        {/* Actions */}
        <div className="flex items-center justify-between pt-4 border-t">
          {isEditing ? (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" size="sm" disabled={isDeleting}>
                  <Trash2 className="h-4 w-4 ml-2" />
                  מחק
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>למחוק את העובד?</AlertDialogTitle>
                  <AlertDialogDescription>
                    פעולה זו תמחק את העובד לצמיתות. לא ניתן לבטל פעולה זו.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>ביטול</AlertDialogCancel>
                  <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
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
            <Button
              onClick={handleSubmit}
              disabled={!formData.full_name.trim() || isSaving}
            >
              {isSaving ? (
                <Loader2 className="h-4 w-4 ml-2 animate-spin" />
              ) : (
                <Save className="h-4 w-4 ml-2" />
              )}
              {isEditing ? 'שמור' : 'הוסף'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
