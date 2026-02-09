import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Save, Loader2, Lock, Key, Shield, Smartphone } from 'lucide-react';
import { useSystemSettings, useUpdateSetting } from '@/hooks/useSettings';

export function SecuritySettingsTab() {
  const { data: settings, isLoading } = useSystemSettings();
  const updateSetting = useUpdateSetting();

  const [formData, setFormData] = useState({
    password_min_length: 8,
    password_require_uppercase: true,
    password_require_numbers: true,
    password_require_special: false,
    max_login_attempts: 5,
    lockout_duration_minutes: 15,
    session_timeout_minutes: 60,
    enable_2fa: false,
  });

  useEffect(() => {
    if (settings) {
      const getValue = (key: string, defaultValue: any) => {
        const setting = settings.find(s => s.key === key);
        return setting?.value ?? defaultValue;
      };

      setFormData({
        password_min_length: getValue('password_min_length', 8),
        password_require_uppercase: getValue('password_require_uppercase', true),
        password_require_numbers: getValue('password_require_numbers', true),
        password_require_special: getValue('password_require_special', false),
        max_login_attempts: getValue('max_login_attempts', 5),
        lockout_duration_minutes: getValue('lockout_duration_minutes', 15),
        session_timeout_minutes: getValue('session_timeout_minutes', 60),
        enable_2fa: getValue('enable_2fa', false),
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
      {/* Password Policy */}
      <Card className="border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Key className="h-5 w-5" />
            מדיניות סיסמאות
          </CardTitle>
          <CardDescription>הגדרות דרישות לסיסמאות משתמשים</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>אורך מינימלי</Label>
              <Input
                type="number"
                min={6}
                max={32}
                value={formData.password_min_length}
                onChange={(e) =>
                  setFormData({ ...formData, password_min_length: parseInt(e.target.value) || 8 })
                }
                className="w-24"
              />
            </div>
          </div>

          <Separator />

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>דרוש אות גדולה</Label>
              <Switch
                checked={formData.password_require_uppercase}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, password_require_uppercase: checked })
                }
              />
            </div>
            <div className="flex items-center justify-between">
              <Label>דרוש מספר</Label>
              <Switch
                checked={formData.password_require_numbers}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, password_require_numbers: checked })
                }
              />
            </div>
            <div className="flex items-center justify-between">
              <Label>דרוש תו מיוחד (!@#$%)</Label>
              <Switch
                checked={formData.password_require_special}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, password_require_special: checked })
                }
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Account Lockout */}
      <Card className="border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lock className="h-5 w-5" />
            נעילת חשבון
          </CardTitle>
          <CardDescription>הגנה מפני ניסיונות התחברות מרובים</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>מספר ניסיונות מקסימלי</Label>
              <Input
                type="number"
                min={3}
                max={10}
                value={formData.max_login_attempts}
                onChange={(e) =>
                  setFormData({ ...formData, max_login_attempts: parseInt(e.target.value) || 5 })
                }
                className="w-24"
              />
            </div>
            <div className="space-y-2">
              <Label>זמן נעילה (דקות)</Label>
              <Input
                type="number"
                min={5}
                max={60}
                value={formData.lockout_duration_minutes}
                onChange={(e) =>
                  setFormData({ ...formData, lockout_duration_minutes: parseInt(e.target.value) || 15 })
                }
                className="w-24"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Session Settings */}
      <Card className="border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            הגדרות Session
          </CardTitle>
          <CardDescription>ניהול זמני התחברות</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Session Timeout (דקות)</Label>
            <Input
              type="number"
              min={15}
              max={480}
              value={formData.session_timeout_minutes}
              onChange={(e) =>
                setFormData({ ...formData, session_timeout_minutes: parseInt(e.target.value) || 60 })
              }
              className="w-24"
            />
            <p className="text-xs text-muted-foreground">
              המשתמש יתנתק אוטומטית לאחר זמן חוסר פעילות
            </p>
          </div>
        </CardContent>
      </Card>

      {/* 2FA */}
      <Card className="border-border/50">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-500/10 rounded-lg">
                <Smartphone className="h-5 w-5 text-purple-500" />
              </div>
              <div>
                <CardTitle className="text-lg">אימות דו-שלבי (2FA)</CardTitle>
                <CardDescription>שכבת אבטחה נוספת</CardDescription>
              </div>
            </div>
            <Badge variant="outline" className="bg-muted text-muted-foreground">
              בקרוב
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            תמיכה באימות דו-שלבי תהיה זמינה בקרוב
          </p>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={updateSetting.isPending}>
          {updateSetting.isPending ? (
            <Loader2 className="h-4 w-4 ml-2 animate-spin" />
          ) : (
            <Save className="h-4 w-4 ml-2" />
          )}
          שמור שינויים
        </Button>
      </div>
    </div>
  );
}
