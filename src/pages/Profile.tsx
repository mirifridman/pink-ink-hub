import { useState, useEffect } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Save, Lock, LogOut, User, Eye, EyeOff, Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";

const roleLabels: Record<string, string> = {
  admin: "מנהל",
  designer: "מעצב",
  editor: "עורך",
  publisher: "צוות הוצאת לאור",
  social: "צוות סושיאל/דיגיטל",
};

const roleColors: Record<string, string> = {
  admin: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
  designer: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400",
  editor: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
  publisher: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  social: "bg-cyan-100 text-cyan-800 dark:bg-cyan-900/30 dark:text-cyan-400",
};

export default function ProfilePage() {
  const { user, role, signOut } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // User info
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");

  // Password change
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);

  // Preferences
  const [rememberMe, setRememberMe] = useState(false);
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [browserNotifications, setBrowserNotifications] = useState(false);

  useEffect(() => {
    loadUserData();
  }, [user]);

  const loadUserData = async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      setEmail(user.email || "");
      setFullName(user.user_metadata?.full_name || "");

      // Load preferences
      const { data: prefs } = await supabase
        .from("user_preferences")
        .select("*")
        .eq("user_id", user.id)
        .single();

      if (prefs) {
        setRememberMe(prefs.remember_me || false);
        setEmailNotifications(prefs.email_notifications ?? true);
        setBrowserNotifications(prefs.browser_notifications || false);
      }
    } catch (error) {
      console.error("Error loading user data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateName = async () => {
    setSaving(true);
    try {
      const { error } = await supabase.auth.updateUser({
        data: { full_name: fullName },
      });

      if (error) throw error;

      // Also update profile table
      await supabase
        .from("profiles")
        .update({ full_name: fullName })
        .eq("id", user?.id);

      toast.success("השם עודכן בהצלחה");
    } catch (error: any) {
      toast.error("שגיאה בעדכון השם");
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async () => {
    if (newPassword !== confirmPassword) {
      toast.error("הסיסמאות אינן תואמות");
      return;
    }

    if (newPassword.length < 8) {
      toast.error("הסיסמה חייבת להכיל לפחות 8 תווים");
      return;
    }

    setChangingPassword(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) throw error;

      toast.success("הסיסמה עודכנה בהצלחה");
      setNewPassword("");
      setConfirmPassword("");
    } catch (error: any) {
      toast.error("שגיאה בעדכון הסיסמה");
    } finally {
      setChangingPassword(false);
    }
  };

  const handleUpdatePreferences = async () => {
    if (!user) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from("user_preferences")
        .upsert({
          user_id: user.id,
          remember_me: rememberMe,
          email_notifications: emailNotifications,
          browser_notifications: browserNotifications,
          updated_at: new Date().toISOString(),
        });

      if (error) throw error;

      toast.success("ההעדפות נשמרו בהצלחה");
    } catch (error: any) {
      toast.error("שגיאה בשמירת ההעדפות");
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    await signOut();
    navigate("/auth");
  };

  const getInitials = () => {
    if (fullName) {
      return fullName.charAt(0).toUpperCase();
    }
    if (email) {
      return email.charAt(0).toUpperCase();
    }
    return "U";
  };

  if (loading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="space-y-6 max-w-2xl mx-auto">
        <div className="flex items-center gap-3">
          <User className="w-8 h-8 text-primary" />
          <h1 className="text-3xl font-bold">הפרופיל שלי</h1>
        </div>

        {/* Profile Card */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-4">
              <Avatar className={`w-20 h-20 ${role ? roleColors[role] : "bg-primary/10"}`}>
                <AvatarFallback className="text-2xl font-bold bg-transparent">
                  {getInitials()}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <h2 className="text-2xl font-bold">{fullName || email}</h2>
                <p className="text-muted-foreground">{email}</p>
                {role && (
                  <Badge className={`mt-2 ${roleColors[role]}`}>
                    {roleLabels[role] || role}
                  </Badge>
                )}
              </div>
            </div>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Edit Name */}
            <div className="space-y-2">
              <Label>שם מלא</Label>
              <div className="flex gap-2">
                <Input
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="הזן שם מלא"
                />
                <Button onClick={handleUpdateName} disabled={saving}>
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  <span className="mr-2">שמור</span>
                </Button>
              </div>
            </div>

            {/* Change Password */}
            <Separator />
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Lock className="w-5 h-5" />
                <Label className="text-lg font-bold">שינוי סיסמה</Label>
              </div>
              
              <div className="space-y-3">
                <div className="relative">
                  <Input
                    type={showPassword ? "text" : "password"}
                    placeholder="סיסמה חדשה (לפחות 8 תווים)"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="pl-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <Input
                  type={showPassword ? "text" : "password"}
                  placeholder="אימות סיסמה חדשה"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
                {newPassword.length > 0 && newPassword.length < 8 && (
                  <p className="text-sm text-amber-600">הסיסמה חייבת להכיל לפחות 8 תווים</p>
                )}
                {newPassword.length >= 8 && confirmPassword.length > 0 && newPassword !== confirmPassword && (
                  <p className="text-sm text-destructive">הסיסמאות אינן תואמות</p>
                )}
                <Button 
                  onClick={handleChangePassword} 
                  className="w-full"
                  disabled={changingPassword || newPassword.length < 8 || newPassword !== confirmPassword}
                >
                  {changingPassword ? (
                    <Loader2 className="w-4 h-4 ml-2 animate-spin" />
                  ) : null}
                  עדכן סיסמה
                </Button>
              </div>
            </div>

            {/* Preferences */}
            <Separator />
            <div className="space-y-4">
              <Label className="text-lg font-bold">העדפות</Label>
              
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">השאר אותי מחובר</p>
                  <p className="text-sm text-muted-foreground">תישאר מחובר עד 14 יום</p>
                </div>
                <Switch
                  checked={rememberMe}
                  onCheckedChange={setRememberMe}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">התראות במייל</p>
                  <p className="text-sm text-muted-foreground">קבל עדכונים חשובים למייל</p>
                </div>
                <Switch
                  checked={emailNotifications}
                  onCheckedChange={setEmailNotifications}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">התראות בדפדפן</p>
                  <p className="text-sm text-muted-foreground">קבל התראות push בדפדפן</p>
                </div>
                <Switch
                  checked={browserNotifications}
                  onCheckedChange={setBrowserNotifications}
                />
              </div>

              <Button onClick={handleUpdatePreferences} className="w-full" disabled={saving}>
                {saving ? <Loader2 className="w-4 h-4 ml-2 animate-spin" /> : <Save className="w-4 h-4 ml-2" />}
                שמור העדפות
              </Button>
            </div>

            {/* Logout */}
            <Separator />
            <Button 
              variant="destructive" 
              className="w-full"
              onClick={handleLogout}
            >
              <LogOut className="w-4 h-4 ml-2" />
              התנתק
            </Button>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
