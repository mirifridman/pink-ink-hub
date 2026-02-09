import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { User, Lock, Bell, Palette, Loader2, Eye, EyeOff } from 'lucide-react';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ProfileModal({ isOpen, onClose }: ProfileModalProps) {
  const { profile, refreshProfile } = useAuth();
  const { theme, setTheme } = useTheme();
  const { toast } = useToast();

  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('profile');

  // Profile form
  const [fullName, setFullName] = useState('');
  
  // Password form
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);

  // Preferences form
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [pushNotifications, setPushNotifications] = useState(true);

  useEffect(() => {
    if (profile) {
      setFullName(profile.full_name || '');
      setEmailNotifications(profile.email_notifications ?? true);
      setPushNotifications(profile.push_notifications ?? true);
    }
  }, [profile, isOpen]);

  const getInitials = (name: string | null) => {
    if (!name) return 'U';
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const handleSaveProfile = async () => {
    if (!profile) return;
    
    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: fullName,
        })
        .eq('id', profile.id);

      if (error) throw error;

      await refreshProfile();
      toast({ title: 'הצלחה', description: 'הפרופיל עודכן בהצלחה' });
    } catch (error: any) {
      toast({ title: 'שגיאה', description: error.message, variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSavePreferences = async () => {
    if (!profile) return;
    
    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          email_notifications: emailNotifications,
          push_notifications: pushNotifications,
          theme_preference: theme,
        })
        .eq('id', profile.id);

      if (error) throw error;

      await refreshProfile();
      toast({ title: 'הצלחה', description: 'ההעדפות עודכנו בהצלחה' });
    } catch (error: any) {
      toast({ title: 'שגיאה', description: error.message, variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleChangePassword = async () => {
    if (!newPassword || !confirmPassword) {
      toast({ title: 'שגיאה', description: 'נא למלא את כל השדות', variant: 'destructive' });
      return;
    }

    if (newPassword !== confirmPassword) {
      toast({ title: 'שגיאה', description: 'הסיסמאות אינן תואמות', variant: 'destructive' });
      return;
    }

    if (newPassword.length < 6) {
      toast({ title: 'שגיאה', description: 'הסיסמה חייבת להכיל לפחות 6 תווים', variant: 'destructive' });
      return;
    }

    setIsLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) throw error;

      toast({ title: 'הצלחה', description: 'הסיסמה עודכנה בהצלחה' });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error: any) {
      toast({ title: 'שגיאה', description: error.message, variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  const getRoleLabel = (role: string | null) => {
    switch (role) {
      case 'admin': return 'מנהל';
      case 'editor': return 'עורך';
      default: return 'צופה';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md" dir="rtl">
        <DialogHeader>
          <DialogTitle>הפרופיל שלי</DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="flex w-full justify-start gap-1">
            <TabsTrigger value="profile" className="flex-1 gap-1">
              <User className="h-4 w-4" />
              פרופיל
            </TabsTrigger>
            <TabsTrigger value="preferences" className="flex-1 gap-1">
              <Palette className="h-4 w-4" />
              העדפות
            </TabsTrigger>
            <TabsTrigger value="security" className="flex-1 gap-1">
              <Lock className="h-4 w-4" />
              אבטחה
            </TabsTrigger>
          </TabsList>

          {/* Profile Tab */}
          <TabsContent value="profile" className="space-y-4 py-4">
            <div className="flex items-center gap-4 p-4 bg-muted/30 rounded-lg">
              <Avatar className="h-16 w-16 border-2 border-primary/30">
                {profile?.avatar_url && <AvatarImage src={profile.avatar_url} />}
                <AvatarFallback className="bg-primary text-primary-foreground text-xl">
                  {getInitials(profile?.full_name)}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="font-semibold text-lg">{profile?.full_name || 'משתמש'}</p>
                <p className="text-sm text-muted-foreground">{profile?.email}</p>
                <p className="text-xs text-muted-foreground mt-1">{getRoleLabel(profile?.role)}</p>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="fullName">שם מלא</Label>
              <Input
                id="fullName"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="הזן את שמך המלא"
              />
            </div>

            <div className="space-y-2">
              <Label>אימייל</Label>
              <Input
                value={profile?.email || ''}
                disabled
                className="bg-muted"
                dir="ltr"
              />
              <p className="text-xs text-muted-foreground">לא ניתן לשנות את כתובת האימייל</p>
            </div>

            <Button onClick={handleSaveProfile} disabled={isLoading} className="w-full">
              {isLoading && <Loader2 className="h-4 w-4 ml-2 animate-spin" />}
              שמור שינויים
            </Button>
          </TabsContent>

          {/* Preferences Tab */}
          <TabsContent value="preferences" className="space-y-4 py-4">
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                <div className="flex items-center gap-3">
                  <Palette className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="font-medium">מצב כהה</p>
                    <p className="text-sm text-muted-foreground">החלף בין מצב בהיר לכהה</p>
                  </div>
                </div>
                <Switch
                  checked={theme === 'dark'}
                  onCheckedChange={(checked) => setTheme(checked ? 'dark' : 'light')}
                />
              </div>

              <Separator />

              <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                <div className="flex items-center gap-3">
                  <Bell className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="font-medium">התראות במייל</p>
                    <p className="text-sm text-muted-foreground">קבל עדכונים לתיבת הדואר</p>
                  </div>
                </div>
                <Switch
                  checked={emailNotifications}
                  onCheckedChange={setEmailNotifications}
                />
              </div>

              <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                <div className="flex items-center gap-3">
                  <Bell className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="font-medium">התראות דחיפה</p>
                    <p className="text-sm text-muted-foreground">קבל התראות בזמן אמת</p>
                  </div>
                </div>
                <Switch
                  checked={pushNotifications}
                  onCheckedChange={setPushNotifications}
                />
              </div>
            </div>

            <Button onClick={handleSavePreferences} disabled={isLoading} className="w-full">
              {isLoading && <Loader2 className="h-4 w-4 ml-2 animate-spin" />}
              שמור העדפות
            </Button>
          </TabsContent>

          {/* Security Tab */}
          <TabsContent value="security" className="space-y-4 py-4">
            <div className="p-4 bg-muted/30 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Lock className="h-5 w-5 text-muted-foreground" />
                <p className="font-medium">החלפת סיסמה</p>
              </div>
              <p className="text-sm text-muted-foreground">
                הזן סיסמה חדשה להחלפת הסיסמה הנוכחית
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="newPassword">סיסמה חדשה</Label>
              <div className="relative">
                <Input
                  id="newPassword"
                  type={showNewPassword ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="הזן סיסמה חדשה"
                  className="pl-10"
                  dir="ltr"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute left-1 top-1/2 -translate-y-1/2 h-7 w-7"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                >
                  {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">אימות סיסמה</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="הזן שוב את הסיסמה החדשה"
                dir="ltr"
              />
            </div>

            <Button 
              onClick={handleChangePassword} 
              disabled={isLoading || !newPassword || !confirmPassword} 
              className="w-full"
            >
              {isLoading && <Loader2 className="h-4 w-4 ml-2 animate-spin" />}
              עדכן סיסמה
            </Button>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
