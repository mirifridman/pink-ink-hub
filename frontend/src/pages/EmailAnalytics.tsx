import { useState, useEffect } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { useEmail } from '@/hooks/useEmail';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import {
  Mail,
  Send,
  CheckCircle,
  Clock,
  XCircle,
  RefreshCw,
  TestTube,
  BarChart3,
  Loader2,
  Inbox
} from 'lucide-react';

interface EmailStats {
  sent: number;
  pending: number;
  failed: number;
  total: number;
}

interface EmailQueueItem {
  id: string;
  to_email: string;
  subject: string;
  template_name: string;
  status: 'pending' | 'sent' | 'failed';
  attempts: number;
  error_message?: string;
  created_at: string;
  sent_at?: string;
}

export default function EmailAnalytics() {
  const { user } = useAuth();
  const { toast } = useToast();
  const { sendTestEmail, isSending } = useEmail();
  
  const [stats, setStats] = useState<EmailStats>({
    sent: 0,
    pending: 0,
    failed: 0,
    total: 0
  });
  const [recentEmails, setRecentEmails] = useState<EmailQueueItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [testEmail, setTestEmail] = useState('');
  const [testName, setTestName] = useState('');

  const loadStats = async () => {
    setIsLoading(true);
    try {
      // Try to load from email_queue table if it exists
      const { data, error } = await supabase
        .from('email_queue')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) {
        // Table might not exist yet
        console.log('Email queue table not found or error:', error.message);
        setStats({ sent: 0, pending: 0, failed: 0, total: 0 });
        setRecentEmails([]);
      } else if (data) {
        const sent = data.filter(e => e.status === 'sent').length;
        const pending = data.filter(e => e.status === 'pending').length;
        const failed = data.filter(e => e.status === 'failed').length;
        
        setStats({ sent, pending, failed, total: data.length });
        setRecentEmails(data as EmailQueueItem[]);
      }
    } catch (err) {
      console.error('Error loading email stats:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadStats();
  }, []);

  const handleSendTestEmail = async () => {
    if (!testEmail) {
      toast({
        title: 'שגיאה',
        description: 'אנא הזן כתובת אימייל',
        variant: 'destructive'
      });
      return;
    }

    const success = await sendTestEmail(testEmail, testName || 'משתמש');
    if (success) {
      setTestEmail('');
      setTestName('');
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'sent':
        return <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">נשלח</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">ממתין</Badge>;
      case 'failed':
        return <Badge className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">נכשל</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Mail className="w-8 h-8 text-neon-pink" />
              ניהול מיילים
            </h1>
            <p className="text-muted-foreground mt-1">
              צפה בסטטיסטיקות ושלח מיילי בדיקה
            </p>
          </div>
          <Button onClick={loadStats} variant="outline" disabled={isLoading}>
            <RefreshCw className={`w-4 h-4 ml-2 ${isLoading ? 'animate-spin' : ''}`} />
            רענן
          </Button>
        </div>

        <Tabs defaultValue="stats" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="stats">
              <BarChart3 className="w-4 h-4 ml-2" />
              סטטיסטיקות
            </TabsTrigger>
            <TabsTrigger value="queue">
              <Inbox className="w-4 h-4 ml-2" />
              תור מיילים
            </TabsTrigger>
            <TabsTrigger value="test">
              <TestTube className="w-4 h-4 ml-2" />
              בדיקה
            </TabsTrigger>
          </TabsList>

          {/* Stats Tab */}
          <TabsContent value="stats" className="space-y-6">
            <div className="grid gap-4 md:grid-cols-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    נשלחו
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-8 h-8 text-green-500" />
                    <span className="text-4xl font-bold text-green-600">
                      {stats.sent}
                    </span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    ממתינים
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2">
                    <Clock className="w-8 h-8 text-yellow-500" />
                    <span className="text-4xl font-bold text-yellow-600">
                      {stats.pending}
                    </span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    נכשלו
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2">
                    <XCircle className="w-8 h-8 text-red-500" />
                    <span className="text-4xl font-bold text-red-600">
                      {stats.failed}
                    </span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    סה"כ
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2">
                    <Mail className="w-8 h-8 text-blue-500" />
                    <span className="text-4xl font-bold text-blue-600">
                      {stats.total}
                    </span>
                  </div>
                </CardContent>
              </Card>
            </div>

            {stats.total === 0 && (
              <Card>
                <CardContent className="py-12 text-center">
                  <Mail className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">אין נתונים עדיין</h3>
                  <p className="text-muted-foreground">
                    כדי להתחיל לראות סטטיסטיקות, שלח מייל בדיקה קודם.
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Queue Tab */}
          <TabsContent value="queue">
            <Card>
              <CardHeader>
                <CardTitle>מיילים אחרונים</CardTitle>
                <CardDescription>
                  רשימת 50 המיילים האחרונים
                </CardDescription>
              </CardHeader>
              <CardContent>
                {recentEmails.length === 0 ? (
                  <div className="py-8 text-center text-muted-foreground">
                    <Inbox className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>אין מיילים בתור</p>
                    <p className="text-sm mt-2">
                      המיילים יופיעו כאן לאחר הגדרת טבלת email_queue ב-Supabase
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {recentEmails.map((email) => (
                      <div
                        key={email.id}
                        className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                      >
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{email.subject}</p>
                          <p className="text-sm text-muted-foreground truncate">
                            {email.to_email}
                          </p>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-xs text-muted-foreground">
                            {new Date(email.created_at).toLocaleDateString('he-IL')}
                          </span>
                          {getStatusBadge(email.status)}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Test Tab */}
          <TabsContent value="test">
            <Card>
              <CardHeader>
                <CardTitle>שליחת מייל בדיקה</CardTitle>
                <CardDescription>
                  בדוק שמערכת המיילים עובדת כראוי
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="testEmail">כתובת אימייל</Label>
                  <Input
                    id="testEmail"
                    type="email"
                    placeholder="test@example.com"
                    value={testEmail}
                    onChange={(e) => setTestEmail(e.target.value)}
                    dir="ltr"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="testName">שם הנמען (אופציונלי)</Label>
                  <Input
                    id="testName"
                    type="text"
                    placeholder="ישראל ישראלי"
                    value={testName}
                    onChange={(e) => setTestName(e.target.value)}
                  />
                </div>

                <Button
                  onClick={handleSendTestEmail}
                  disabled={isSending || !testEmail}
                  className="w-full"
                >
                  {isSending ? (
                    <Loader2 className="w-4 h-4 ml-2 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4 ml-2" />
                  )}
                  שלח מייל בדיקה
                </Button>

                <div className="p-4 rounded-lg bg-muted/50 text-sm">
                  <p className="font-medium mb-2">💡 טיפ:</p>
                  <p className="text-muted-foreground">
                    אם המייל לא מגיע, וודא שה-Edge Function "שליחת מייל" מוגדר כראוי
                    ב-Supabase ושה-RESEND_API_KEY מוגדר ב-Secrets.
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}
