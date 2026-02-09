import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Save, Loader2, Shield } from 'lucide-react';
import { useSystemSettings, useUpdateSetting } from '@/hooks/useSettings';

const roles = [
  { id: 'admin', label: 'מנהל', color: 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20' },
  { id: 'editor', label: 'עורך', color: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20' },
  { id: 'viewer', label: 'צופה', color: 'bg-muted text-muted-foreground border-border' },
];

const categories = [
  {
    id: 'tasks',
    label: 'משימות',
    permissions: [
      { id: 'view', label: 'צפייה' },
      { id: 'create', label: 'יצירה' },
      { id: 'edit', label: 'עריכה' },
      { id: 'delete', label: 'מחיקה' },
    ],
  },
  {
    id: 'projects',
    label: 'פרויקטים',
    permissions: [
      { id: 'view', label: 'צפייה' },
      { id: 'create', label: 'יצירה' },
      { id: 'edit', label: 'עריכה' },
      { id: 'delete', label: 'מחיקה' },
    ],
  },
  {
    id: 'team',
    label: 'צוות',
    permissions: [
      { id: 'view', label: 'צפייה' },
      { id: 'create', label: 'יצירה' },
      { id: 'edit', label: 'עריכה' },
      { id: 'delete', label: 'מחיקה' },
    ],
  },
  {
    id: 'procedures',
    label: 'נהלים והחלטות',
    permissions: [
      { id: 'view', label: 'צפייה' },
      { id: 'create', label: 'יצירה' },
      { id: 'edit', label: 'עריכה' },
      { id: 'delete', label: 'מחיקה' },
    ],
  },
  {
    id: 'documents',
    label: 'מסמכים',
    permissions: [
      { id: 'view', label: 'צפייה' },
      { id: 'upload', label: 'העלאה' },
      { id: 'delete', label: 'מחיקה' },
    ],
  },
  {
    id: 'settings',
    label: 'הגדרות',
    permissions: [
      { id: 'view', label: 'צפייה' },
      { id: 'edit', label: 'עריכה' },
    ],
  },
];

// Default permissions matrix
const defaultPermissions: Record<string, Record<string, Record<string, boolean>>> = {
  admin: {
    tasks: { view: true, create: true, edit: true, delete: true },
    projects: { view: true, create: true, edit: true, delete: true },
    team: { view: true, create: true, edit: true, delete: true },
    procedures: { view: true, create: true, edit: true, delete: true },
    documents: { view: true, upload: true, delete: true },
    settings: { view: true, edit: true },
  },
  editor: {
    tasks: { view: true, create: true, edit: true, delete: false },
    projects: { view: true, create: true, edit: true, delete: false },
    team: { view: true, create: true, edit: true, delete: false },
    procedures: { view: true, create: true, edit: true, delete: false },
    documents: { view: true, upload: true, delete: false },
    settings: { view: false, edit: false },
  },
  viewer: {
    tasks: { view: true, create: false, edit: false, delete: false },
    projects: { view: true, create: false, edit: false, delete: false },
    team: { view: true, create: false, edit: false, delete: false },
    procedures: { view: true, create: false, edit: false, delete: false },
    documents: { view: true, upload: false, delete: false },
    settings: { view: false, edit: false },
  },
};

export function PermissionsSettingsTab() {
  const { data: settings, isLoading } = useSystemSettings();
  const updateSetting = useUpdateSetting();

  const [permissions, setPermissions] = useState(defaultPermissions);

  useEffect(() => {
    if (settings) {
      const permSetting = settings.find(s => s.key === 'permissions_matrix');
      if (permSetting?.value) {
        setPermissions(permSetting.value);
      }
    }
  }, [settings]);

  const togglePermission = (roleId: string, categoryId: string, permId: string) => {
    setPermissions((prev) => ({
      ...prev,
      [roleId]: {
        ...prev[roleId],
        [categoryId]: {
          ...prev[roleId]?.[categoryId],
          [permId]: !prev[roleId]?.[categoryId]?.[permId],
        },
      },
    }));
  };

  const handleSave = async () => {
    await updateSetting.mutateAsync({ key: 'permissions_matrix', value: permissions });
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
            <Shield className="h-5 w-5" />
            מטריצת הרשאות
          </CardTitle>
          <CardDescription>הגדר הרשאות לפי תפקיד</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-right p-3 font-medium">קטגוריה</th>
                  <th className="text-right p-3 font-medium">הרשאה</th>
                  {roles.map((role) => (
                    <th key={role.id} className="text-center p-3 font-medium">
                      <Badge variant="outline" className={role.color}>
                        {role.label}
                      </Badge>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {categories.map((category) =>
                  category.permissions.map((perm, permIndex) => (
                    <tr key={`${category.id}-${perm.id}`} className="border-b">
                      {permIndex === 0 && (
                        <td
                          className="p-3 font-medium bg-muted/30"
                          rowSpan={category.permissions.length}
                        >
                          {category.label}
                        </td>
                      )}
                      <td className="p-3">{perm.label}</td>
                      {roles.map((role) => (
                        <td key={role.id} className="text-center p-3">
                          <Checkbox
                            checked={permissions[role.id]?.[category.id]?.[perm.id] ?? false}
                            onCheckedChange={() =>
                              togglePermission(role.id, category.id, perm.id)
                            }
                            disabled={role.id === 'admin'}
                          />
                        </td>
                      ))}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="pt-4">
            <Button onClick={handleSave} disabled={updateSetting.isPending}>
              {updateSetting.isPending ? (
                <Loader2 className="h-4 w-4 ml-2 animate-spin" />
              ) : (
                <Save className="h-4 w-4 ml-2" />
              )}
              שמור שינויים
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
