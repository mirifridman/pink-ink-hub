import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
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
import { Search, Plus, Edit2, Trash2, KeyRound, Loader2, Users } from 'lucide-react';
import { useAllProfiles, useUpdateProfile } from '@/hooks/useSettings';
import { format } from 'date-fns';
import { he } from 'date-fns/locale';

const roleOptions = [
  { value: 'admin', label: 'מנהל' },
  { value: 'editor', label: 'עורך' },
  { value: 'viewer', label: 'צופה' },
];

const roleColors: Record<string, string> = {
  admin: 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20',
  editor: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20',
  viewer: 'bg-muted text-muted-foreground border-border',
};

export function UsersSettingsTab() {
  const { data: profiles, isLoading } = useAllProfiles();
  const updateProfile = useUpdateProfile();

  const [searchQuery, setSearchQuery] = useState('');
  const [editingUser, setEditingUser] = useState<any>(null);
  const [editFormData, setEditFormData] = useState({
    full_name: '',
    email: '',
    role: '',
  });

  const filteredProfiles = profiles?.filter(
    (p) =>
      p.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleEdit = (user: any) => {
    setEditingUser(user);
    setEditFormData({
      full_name: user.full_name || '',
      email: user.email || '',
      role: user.role || 'viewer',
    });
  };

  const handleSaveEdit = async () => {
    if (!editingUser) return;
    await updateProfile.mutateAsync({
      id: editingUser.id,
      full_name: editFormData.full_name,
      role: editFormData.role,
    });
    setEditingUser(null);
  };

  const getRoleLabel = (role: string) => {
    return roleOptions.find((r) => r.value === role)?.label || role;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            ניהול משתמשים
          </CardTitle>
          <CardDescription>
            {profiles?.length || 0} משתמשים רשומים במערכת
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Search */}
          <div className="flex items-center gap-4 mb-4">
            <div className="relative flex-1">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="חיפוש לפי שם או אימייל..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pr-10"
              />
            </div>
          </div>

          {/* Table */}
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>שם</TableHead>
                  <TableHead>אימייל</TableHead>
                  <TableHead>תפקיד</TableHead>
                  <TableHead>הצטרף</TableHead>
                  <TableHead className="w-24">פעולות</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProfiles?.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">
                      {user.full_name || 'ללא שם'}
                    </TableCell>
                    <TableCell dir="ltr" className="text-left">
                      {user.email}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={roleColors[user.role || 'viewer']}>
                        {getRoleLabel(user.role || 'viewer')}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {user.created_at && format(new Date(user.created_at), 'd בMMM yyyy', { locale: he })}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => handleEdit(user)}
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {filteredProfiles?.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                      לא נמצאו משתמשים
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Edit User Dialog */}
      <Dialog open={!!editingUser} onOpenChange={(open) => !open && setEditingUser(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>עריכת משתמש</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>שם מלא</Label>
              <Input
                value={editFormData.full_name}
                onChange={(e) => setEditFormData({ ...editFormData, full_name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>אימייל</Label>
              <Input value={editFormData.email} disabled dir="ltr" />
            </div>
            <div className="space-y-2">
              <Label>תפקיד</Label>
              <Select
                value={editFormData.role}
                onValueChange={(value) => setEditFormData({ ...editFormData, role: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {roleOptions.map((role) => (
                    <SelectItem key={role.value} value={role.value}>
                      {role.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingUser(null)}>
              ביטול
            </Button>
            <Button onClick={handleSaveEdit} disabled={updateProfile.isPending}>
              {updateProfile.isPending && <Loader2 className="h-4 w-4 ml-2 animate-spin" />}
              שמור
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
