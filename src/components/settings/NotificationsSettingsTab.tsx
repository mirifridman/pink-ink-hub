import { useState, useEffect } from 'react';
import { PushNotificationSettings } from './PushNotificationSettings';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Save, Loader2, Bell, Mail, Clock } from 'lucide-react';
import { useSystemSettings, useUpdateSetting } from '@/hooks/useSettings';

export function NotificationsSettingsTab() {
  const { data: settings, isLoading } = useSystemSettings();
  const updateSetting = useUpdateSetting();

  const [formData, setFormData] = useState({
    email_from_address: 'noreply@company.com',
    email_from_name: 'מערכת ניהול',
    enable_task_reminders: true,
    reminder_days_before: 1,
    enable_approval_notifications: true,
    enable_assignment_notifications: true,
    daily_digest_enabled: false,
    daily_digest_time: '09:00',
  });

  useEffect(() => {
    if (settings) {
      const getValue = (key: string, defaultValue: any) => {
        const setting = settings.find(s => s.key === key);
        return setting?.value ?? defaultValue;
      };

      setFormData({
        email_from_address: getValue('email_from_address', 'noreply@company.com'),
        email_from_name: getValue('email_from_name', 'מערכת ניהול'),
        enable_task_reminders: getValue('enable_task_reminders', true),
        reminder_days_before: getValue('reminder_days_before', 1),
        enable_approval_notifications: getValue('enable_approval_notifications', true),
        enable_assignment_notifications: getValue('enable_assignment_notifications', true),
        daily_digest_enabled: getValue('daily_digest_enabled', false),
        daily_digest_time: getValue('daily_digest_time', '09:00'),
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
      {/* Push Notifications */}
      <PushNotificationSettings />

      {/* Email Settings */}
      <Card className="border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            הגדרות דואר אלקטרוני
          </CardTitle>
          <CardDescription>הגדרות שליחת מיילים</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>כתובת שולח</Label>
              <Input
                value={formData.email_from_address}
                onChange={(e) => setFormData({ ...formData, email_from_address: e.target.value })}
                placeholder="noreply@company.com"
                dir="ltr"
              />
            </div>
            <div className="space-y-2">
              <Label>שם שולח</Label>
              <Input
                value={formData.email_from_name}
                onChange={(e) => setFormData({ ...formData, email_from_name: e.target.value })}
                placeholder="מערכת ניהול"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Notification Types */}
      <Card className="border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            סוגי התראות
          </CardTitle>
          <CardDescription>בחר אילו התראות לשלוח</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label>התראות על שיוך משימות</Label>
              <p className="text-sm text-muted-foreground">
                שלח מייל כשמשימה מוקצית לעובד
              </p>
            </div>
            <Switch
              checked={formData.enable_assignment_notifications}
              onCheckedChange={(checked) =>
                setFormData({ ...formData, enable_assignment_notifications: checked })
              }
            />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div>
              <Label>התראות על בקשות אישור</Label>
              <p className="text-sm text-muted-foreground">
                שלח מייל כשנשלחת בקשת אישור
              </p>
            </div>
            <Switch
              checked={formData.enable_approval_notifications}
              onCheckedChange={(checked) =>
                setFormData({ ...formData, enable_approval_notifications: checked })
              }
            />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div>
              <Label>תזכורות משימות</Label>
              <p className="text-sm text-muted-foreground">
                שלח תזכורת לפני תאריך יעד
              </p>
            </div>
            <Switch
              checked={formData.enable_task_reminders}
              onCheckedChange={(checked) =>
                setFormData({ ...formData, enable_task_reminders: checked })
              }
            />
          </div>

          {formData.enable_task_reminders && (
            <div className="pr-4 space-y-2">
              <Label>ימים לפני תאריך יעד</Label>
              <Input
                type="number"
                min={1}
                max={7}
                value={formData.reminder_days_before}
                onChange={(e) =>
                  setFormData({ ...formData, reminder_days_before: parseInt(e.target.value) || 1 })
                }
                className="w-20"
              />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Daily Digest */}
      <Card className="border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            סיכום יומי
          </CardTitle>
          <CardDescription>שליחת סיכום יומי של משימות פתוחות</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label>הפעל סיכום יומי</Label>
              <p className="text-sm text-muted-foreground">
                שלח מייל יומי עם רשימת משימות פתוחות
              </p>
            </div>
            <Switch
              checked={formData.daily_digest_enabled}
              onCheckedChange={(checked) =>
                setFormData({ ...formData, daily_digest_enabled: checked })
              }
            />
          </div>

          {formData.daily_digest_enabled && (
            <div className="space-y-2">
              <Label>שעת שליחה</Label>
              <Input
                type="time"
                value={formData.daily_digest_time}
                onChange={(e) =>
                  setFormData({ ...formData, daily_digest_time: e.target.value })
                }
                className="w-32"
              />
            </div>
          )}
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
