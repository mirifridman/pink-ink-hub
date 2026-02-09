import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Save, Loader2, Plug, Webhook, Mail, Cloud, CheckCircle2, XCircle } from 'lucide-react';
import { useSystemSettings, useUpdateSetting } from '@/hooks/useSettings';

export function IntegrationsSettingsTab() {
  const { data: settings, isLoading } = useSystemSettings();
  const updateSetting = useUpdateSetting();

  const [formData, setFormData] = useState({
    n8n_enabled: false,
    n8n_webhook_url: '',
    resend_enabled: true,
    resend_api_key_configured: true,
    resend_from_email: '',
    resend_from_name: 'מטה מנכ״ל',
    microsoft365_enabled: false,
  });

  useEffect(() => {
    if (settings) {
      const getValue = (key: string, defaultValue: any) => {
        const setting = settings.find(s => s.key === key);
        return setting?.value ?? defaultValue;
      };

      setFormData({
        n8n_enabled: getValue('n8n_enabled', false),
        n8n_webhook_url: getValue('n8n_webhook_url', ''),
        resend_enabled: getValue('resend_enabled', true),
        resend_api_key_configured: true,
        resend_from_email: getValue('resend_from_email', ''),
        resend_from_name: getValue('resend_from_name', 'מטה מנכ״ל'),
        microsoft365_enabled: getValue('microsoft365_enabled', false),
      });
    }
  }, [settings]);

  const handleSave = async () => {
    await updateSetting.mutateAsync({ key: 'n8n_enabled', value: formData.n8n_enabled });
    await updateSetting.mutateAsync({ key: 'n8n_webhook_url', value: formData.n8n_webhook_url });
    await updateSetting.mutateAsync({ key: 'resend_enabled', value: formData.resend_enabled });
    await updateSetting.mutateAsync({ key: 'resend_from_email', value: formData.resend_from_email });
    await updateSetting.mutateAsync({ key: 'resend_from_name', value: formData.resend_from_name });
    await updateSetting.mutateAsync({ key: 'microsoft365_enabled', value: formData.microsoft365_enabled });
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
      {/* N8N Integration */}
      <Card className="border-border/50">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-500/10 rounded-lg">
                <Webhook className="h-5 w-5 text-orange-500" />
              </div>
              <div>
                <CardTitle className="text-lg">N8N</CardTitle>
                <CardDescription>אוטומציות ו-Workflows</CardDescription>
              </div>
            </div>
            <Switch
              checked={formData.n8n_enabled}
              onCheckedChange={(checked) => setFormData({ ...formData, n8n_enabled: checked })}
            />
          </div>
        </CardHeader>
        {formData.n8n_enabled && (
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Webhook URL</Label>
              <Input
                value={formData.n8n_webhook_url}
                onChange={(e) => setFormData({ ...formData, n8n_webhook_url: e.target.value })}
                placeholder="https://n8n.example.com/webhook/..."
                dir="ltr"
              />
              <p className="text-xs text-muted-foreground">
                הזן את כתובת ה-Webhook מ-N8N לקבלת אירועים מהמערכת
              </p>
            </div>
          </CardContent>
        )}
      </Card>

      {/* Resend Integration */}
      <Card className="border-border/50">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-500/10 rounded-lg">
                <Mail className="h-5 w-5 text-blue-500" />
              </div>
              <div>
                <CardTitle className="text-lg">Resend</CardTitle>
                <CardDescription>שליחת דואר אלקטרוני</CardDescription>
              </div>
            </div>
            <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500/20">
              <CheckCircle2 className="h-3 w-3 ml-1" />
              מחובר
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <CheckCircle2 className="h-4 w-4 text-green-500" />
            API Key מוגדר בסביבה
          </div>
          
          <div className="space-y-4 pt-4 border-t border-border/50">
            <div className="space-y-2">
              <Label>שם השולח</Label>
              <Input
                value={formData.resend_from_name}
                onChange={(e) => setFormData({ ...formData, resend_from_name: e.target.value })}
                placeholder="מטה מנכ״ל"
              />
            </div>
            
            <div className="space-y-2">
              <Label>כתובת דואר שולח</Label>
              <Input
                value={formData.resend_from_email}
                onChange={(e) => setFormData({ ...formData, resend_from_email: e.target.value })}
                placeholder="noreply@yourdomain.com"
                dir="ltr"
              />
              <p className="text-xs text-muted-foreground">
                הזן כתובת מדומיין מאומת ב-Resend. ללא הגדרה יישלח מ-onboarding@resend.dev (לבדיקות בלבד)
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Microsoft 365 Integration */}
      <Card className="border-border/50">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-sky-500/10 rounded-lg">
                <Cloud className="h-5 w-5 text-sky-500" />
              </div>
              <div>
                <CardTitle className="text-lg">Microsoft 365</CardTitle>
                <CardDescription>סנכרון יומן ומשימות</CardDescription>
              </div>
            </div>
            <Badge variant="outline" className="bg-muted text-muted-foreground">
              בקרוב
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            אינטגרציה עם Microsoft 365 תהיה זמינה בקרוב
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
