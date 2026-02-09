import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Save, Loader2, Database, Download, RefreshCw, Clock, HardDrive } from 'lucide-react';
import { useSystemSettings, useUpdateSetting } from '@/hooks/useSettings';
import { format } from 'date-fns';
import { he } from 'date-fns/locale';

export function BackupsSettingsTab() {
  const { data: settings, isLoading } = useSystemSettings();
  const updateSetting = useUpdateSetting();

  const [formData, setFormData] = useState({
    auto_backup_enabled: false,
    backup_frequency: 'daily',
    backup_time: '02:00',
    backup_retention_days: 30,
  });

  // Mock backup data
  const [backups] = useState([
    { id: '1', name: 'backup-2024-01-15-02-00', size: '125 MB', created_at: '2024-01-15T02:00:00Z', type: 'auto' },
    { id: '2', name: 'backup-2024-01-14-02-00', size: '123 MB', created_at: '2024-01-14T02:00:00Z', type: 'auto' },
    { id: '3', name: 'backup-manual-2024-01-13', size: '122 MB', created_at: '2024-01-13T15:30:00Z', type: 'manual' },
  ]);

  useEffect(() => {
    if (settings) {
      const getValue = (key: string, defaultValue: any) => {
        const setting = settings.find(s => s.key === key);
        return setting?.value ?? defaultValue;
      };

      setFormData({
        auto_backup_enabled: getValue('auto_backup_enabled', false),
        backup_frequency: getValue('backup_frequency', 'daily'),
        backup_time: getValue('backup_time', '02:00'),
        backup_retention_days: getValue('backup_retention_days', 30),
      });
    }
  }, [settings]);

  const handleSave = async () => {
    for (const [key, value] of Object.entries(formData)) {
      await updateSetting.mutateAsync({ key, value });
    }
  };

  const handleManualBackup = () => {
    // This would trigger a manual backup in a real implementation
    alert('גיבוי ידני יופעל בקרוב');
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
      {/* Auto Backup Settings */}
      <Card className="border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            גיבוי אוטומטי
          </CardTitle>
          <CardDescription>הגדרות גיבוי אוטומטי של המערכת</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label>הפעל גיבוי אוטומטי</Label>
              <p className="text-sm text-muted-foreground">
                גבה את המערכת באופן אוטומטי
              </p>
            </div>
            <Switch
              checked={formData.auto_backup_enabled}
              onCheckedChange={(checked) =>
                setFormData({ ...formData, auto_backup_enabled: checked })
              }
            />
          </div>

          {formData.auto_backup_enabled && (
            <>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>תדירות</Label>
                  <Select
                    value={formData.backup_frequency}
                    onValueChange={(value) =>
                      setFormData({ ...formData, backup_frequency: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="daily">יומי</SelectItem>
                      <SelectItem value="weekly">שבועי</SelectItem>
                      <SelectItem value="monthly">חודשי</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>שעת גיבוי</Label>
                  <Input
                    type="time"
                    value={formData.backup_time}
                    onChange={(e) =>
                      setFormData({ ...formData, backup_time: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>שמירה (ימים)</Label>
                  <Input
                    type="number"
                    min={7}
                    max={365}
                    value={formData.backup_retention_days}
                    onChange={(e) =>
                      setFormData({ ...formData, backup_retention_days: parseInt(e.target.value) || 30 })
                    }
                  />
                </div>
              </div>
            </>
          )}

          <div className="flex gap-2 pt-2">
            <Button onClick={handleSave} disabled={updateSetting.isPending}>
              {updateSetting.isPending ? (
                <Loader2 className="h-4 w-4 ml-2 animate-spin" />
              ) : (
                <Save className="h-4 w-4 ml-2" />
              )}
              שמור
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Manual Backup */}
      <Card className="border-border/50">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5" />
                גיבוי ידני
              </CardTitle>
              <CardDescription>צור גיבוי מיידי של המערכת</CardDescription>
            </div>
            <Button onClick={handleManualBackup}>
              <RefreshCw className="h-4 w-4 ml-2" />
              צור גיבוי עכשיו
            </Button>
          </div>
        </CardHeader>
      </Card>

      {/* Backup List */}
      <Card className="border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <HardDrive className="h-5 w-5" />
            גיבויים קיימים
          </CardTitle>
          <CardDescription>{backups.length} גיבויים זמינים</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>שם</TableHead>
                  <TableHead>גודל</TableHead>
                  <TableHead>תאריך</TableHead>
                  <TableHead>סוג</TableHead>
                  <TableHead className="w-24">פעולות</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {backups.map((backup) => (
                  <TableRow key={backup.id}>
                    <TableCell className="font-mono text-sm">{backup.name}</TableCell>
                    <TableCell>{backup.size}</TableCell>
                    <TableCell>
                      {format(new Date(backup.created_at), 'd בMMM yyyy HH:mm', { locale: he })}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={
                        backup.type === 'auto'
                          ? 'bg-blue-500/10 text-blue-500 border-blue-500/20'
                          : 'bg-green-500/10 text-green-500 border-green-500/20'
                      }>
                        {backup.type === 'auto' ? 'אוטומטי' : 'ידני'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <Download className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <RefreshCw className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
