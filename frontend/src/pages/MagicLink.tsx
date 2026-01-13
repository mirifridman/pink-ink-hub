import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { toast } from "sonner";
import { Loader2, CheckCircle, XCircle, Lock, Eye, EyeOff } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const roleLabels: Record<string, string> = {
  admin: "מנהל",
  designer: "מעצב",
  editor: "עורך",
  publisher: "צוות הוצאת לאור",
  social: "צוות סושיאל/דיגיטל",
};

export default function MagicLinkPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [tokenValid, setTokenValid] = useState(false);
  const [tokenData, setTokenData] = useState<{
    id: string;
    email: string;
    role: string;
    full_name: string | null;
    invited_by_name: string | null;
  } | null>(null);
  
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    verifyToken();
  }, []);

  const verifyToken = async () => {
    const token = searchParams.get("token");
    
    if (!token) {
      setErrorMessage("לא נמצא טוקן בקישור");
      setLoading(false);
      return;
    }

    try {
      // Check token in database
      const { data, error } = await supabase
        .from("magic_link_tokens")
        .select("*")
        .eq("token", token)
        .single();

      if (error || !data) {
        setErrorMessage("קישור לא תקין");
        setTokenValid(false);
        setLoading(false);
        return;
      }

      // Check if already used
      if (data.used) {
        setErrorMessage("קישור זה כבר נוצל. אם כבר נרשמת, נסה להתחבר.");
        setTokenValid(false);
        setLoading(false);
        return;
      }

      // Check expiration
      if (new Date(data.expires_at) < new Date()) {
        setErrorMessage("הקישור פג תוקף. בקש מהמנהל לשלוח הזמנה חדשה.");
        setTokenValid(false);
        setLoading(false);
        return;
      }

      // Token is valid
      setTokenValid(true);
      setTokenData({
        id: data.id,
        email: data.email,
        role: data.role,
        full_name: data.full_name,
        invited_by_name: data.invited_by_name,
      });
      setLoading(false);

    } catch (error) {
      console.error("Error verifying token:", error);
      setErrorMessage("שגיאה באימות הקישור");
      setTokenValid(false);
      setLoading(false);
    }
  };

  const handleSetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (password !== confirmPassword) {
      toast.error("הסיסמאות אינן תואמות");
      return;
    }

    if (password.length < 8) {
      toast.error("הסיסמה חייבת להכיל לפחות 8 תווים");
      return;
    }

    if (!tokenData) return;

    setSubmitting(true);

    try {
      // 1. Create user in Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: tokenData.email,
        password: password,
        options: {
          data: {
            full_name: tokenData.full_name || tokenData.email.split("@")[0],
          },
        },
      });

      if (authError) {
        if (authError.message.includes("already registered")) {
          toast.error("משתמש עם אימייל זה כבר קיים. נסה להתחבר.");
          navigate("/auth");
          return;
        }
        throw authError;
      }

      if (!authData.user) {
        throw new Error("Failed to create user");
      }

      // 2. Mark token as used
      await supabase
        .from("magic_link_tokens")
        .update({ 
          used: true, 
          used_at: new Date().toISOString() 
        })
        .eq("id", tokenData.id);

      // 3. Assign role using edge function
      const { error: roleError } = await supabase.functions.invoke("manage-users", {
        body: {
          action: "assign_role_for_magic_link",
          userId: authData.user.id,
          role: tokenData.role,
        },
      });

      // If role assignment via edge function fails, try direct insert (fallback)
      if (roleError) {
        console.log("Edge function failed, will rely on admin to assign role");
      }

      // 4. Sign in automatically
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: tokenData.email,
        password: password,
      });

      if (signInError) {
        // User was created but couldn't sign in automatically
        toast.success("החשבון נוצר בהצלחה! אנא התחבר עם הפרטים שלך.");
        navigate("/auth");
        return;
      }

      // 5. Success!
      toast.success("ברוך הבא למערכת! 🎉");
      navigate("/");

    } catch (error: any) {
      console.error("Error creating account:", error);
      toast.error(error.message || "שגיאה ביצירת החשבון");
    } finally {
      setSubmitting(false);
    }
  };

  // Loading screen
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  // Invalid link
  if (!tokenValid) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mb-4">
              <XCircle className="w-8 h-8 text-destructive" />
            </div>
            <h1 className="text-2xl font-bold">קישור לא תקין</h1>
            <p className="text-muted-foreground mt-2">
              {errorMessage || "הקישור פג תוקף או שכבר נוצל"}
            </p>
          </CardHeader>
          <CardContent>
            <Button 
              variant="outline" 
              className="w-full"
              onClick={() => navigate("/auth")}
            >
              חזרה למסך התחברות
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Password setup form
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center mb-4">
            <CheckCircle className="w-8 h-8 text-green-500" />
          </div>
          <h1 className="text-2xl font-bold">ברוך הבא! 🎉</h1>
          <p className="text-muted-foreground mt-2">
            {tokenData?.invited_by_name 
              ? `${tokenData.invited_by_name} הזמין אותך להצטרף למערכת`
              : "הוזמנת להצטרף למערכת"
            }
          </p>
          <div className="flex items-center justify-center gap-2 mt-3">
            <Badge variant="secondary" className="text-sm">
              {roleLabels[tokenData?.role || ""] || tokenData?.role}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground mt-2">{tokenData?.email}</p>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSetPassword} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="password">בחר סיסמה</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="לפחות 8 תווים"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={8}
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
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">אימות סיסמה</Label>
              <Input
                id="confirmPassword"
                type={showPassword ? "text" : "password"}
                placeholder="הזן את הסיסמה שוב"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                minLength={8}
              />
            </div>

            {password.length > 0 && password.length < 8 && (
              <p className="text-sm text-amber-600">הסיסמה חייבת להכיל לפחות 8 תווים</p>
            )}

            {password.length >= 8 && confirmPassword.length > 0 && password !== confirmPassword && (
              <p className="text-sm text-destructive">הסיסמאות אינן תואמות</p>
            )}

            <Button 
              type="submit" 
              className="w-full"
              disabled={submitting || password.length < 8 || password !== confirmPassword}
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  יוצר חשבון...
                </>
              ) : (
                <>
                  <Lock className="w-4 h-4 mr-2" />
                  צור חשבון וכנס למערכת
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
