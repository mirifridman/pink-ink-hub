import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Save, Loader2, Building2 } from 'lucide-react';
import { useSystemSettings, useUpdateSetting } from '@/hooks/useSettings';

export function GeneralSettingsTab() {
  const { data: settings, isLoading } = useSystemSettings();
  const updateSetting = useUpdateSetting();

  const [formData, setFormData] = useState({
    organization_name: '',
    timezone: 'Asia/Jerusalem',
    date_format: 'dd/MM/yyyy',
    default_theme: 'dark',
    language: 'he',
  });

  useEffect(() => {
    if (settings) {
      const getValue = (key: string, defaultValue: any) => {
        const setting = settings.find(s => s.key === key);
        return setting?.value ?? defaultValue;
      };

      setFormData({
        organization_name: getValue('organization_name', ''),
        timezone: getValue('timezone', 'Asia/Jerusalem'),
        date_format: getValue('date_format', 'dd/MM/yyyy'),
        default_theme: getValue('default_theme', 'dark'),
        language: getValue('language', 'he'),
      });
    }
  }, [settings]);

  const handleSave = async () => {
    for (const [key, value] of Object.entries(formData)) {
      await updateSetting.mutateAsync({ key, value });
    }
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
            <Building2 className="h-5 w-5" />
            פרטי ארגון
          </CardTitle>
          <CardDescription>הגדרות כלליות של המערכת</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="org_name">שם הארגון</Label>
            <Input
              id="org_name"
              value={formData.organization_name}
              onChange={(e) => setFormData({ ...formData, organization_name: e.target.value })}
              placeholder="שם הארגון שלך"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>אזור זמן</Label>
              <Select
                value={formData.timezone}
                onValueChange={(value) => setFormData({ ...formData, timezone: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Asia/Jerusalem">ישראל (GMT+2/+3)</SelectItem>
                  <SelectItem value="Europe/London">לונדון (GMT+0/+1)</SelectItem>
                  <SelectItem value="America/New_York">ניו יורק (GMT-5/-4)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>פורמט תאריך</Label>
              <Select
                value={formData.date_format}
                onValueChange={(value) => setFormData({ ...formData, date_format: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="dd/MM/yyyy">31/12/2024</SelectItem>
                  <SelectItem value="MM/dd/yyyy">12/31/2024</SelectItem>
                  <SelectItem value="yyyy-MM-dd">2024-12-31</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>ערכת נושא ברירת מחדל</Label>
              <Select
                value={formData.default_theme}
                onValueChange={(value) => setFormData({ ...formData, default_theme: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="dark">כהה</SelectItem>
                  <SelectItem value="light">בהיר</SelectItem>
                  <SelectItem value="system">מערכת</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>שפה</Label>
              <Select
                value={formData.language}
                onValueChange={(value) => setFormData({ ...formData, language: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="he">עברית</SelectItem>
                  <SelectItem value="en">English</SelectItem>
                </SelectContent>
              </Select>
            </div>
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
