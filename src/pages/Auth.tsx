import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NeonCard, NeonCardContent, NeonCardHeader, NeonCardTitle, NeonCardDescription } from "@/components/ui/NeonCard";
import { Sparkles, Mail, Lock, User, Loader2, UserPlus, KeyRound } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";

const emailSchema = z.string().email("כתובת אימייל לא תקינה");
const passwordSchema = z.string().min(6, "הסיסמה חייבת להכיל לפחות 6 תווים");
const fullNameSchema = z.string().min(2, "השם חייב להכיל לפחות 2 תווים");

export default function Auth() {
  const [searchParams] = useSearchParams();
  const inviteToken = searchParams.get("invite");
  const inviteEmail = searchParams.get("email");
  
  const [isLogin, setIsLogin] = useState(!inviteToken);
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [email, setEmail] = useState(inviteEmail || "");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string; fullName?: string }>({});
  const [invitationInfo, setInvitationInfo] = useState<{ role: string; full_name?: string } | null>(null);
  
  const { signIn, signUp, user, loading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  // Load invitation info if there's a token
  useEffect(() => {
    const loadInvitation = async () => {
      if (inviteToken) {
        const { data, error } = await supabase
          .from("user_invitations")
          .select("*")
          .eq("id", inviteToken)
          .eq("status", "pending")
          .maybeSingle();
        
        if (data) {
          setInvitationInfo({ role: data.role, full_name: data.full_name || undefined });
          if (data.full_name) {
            setFullName(data.full_name);
          }
          setIsLogin(false);
        } else {
          toast({
            title: "הזמנה לא תקפה",
            description: "ההזמנה פגה או כבר נוצלה",
            variant: "destructive",
          });
        }
      }
    };
    loadInvitation();
  }, [inviteToken, toast]);

  useEffect(() => {
    if (user && !loading) {
      navigate("/");
    }
  }, [user, loading, navigate]);

  const validateForm = () => {
    const newErrors: { email?: string; password?: string; fullName?: string } = {};
    
    const emailResult = emailSchema.safeParse(email);
    if (!emailResult.success) {
      newErrors.email = emailResult.error.errors[0].message;
    }
    
    const passwordResult = passwordSchema.safeParse(password);
    if (!passwordResult.success) {
      newErrors.password = passwordResult.error.errors[0].message;
    }
    
    if (!isLogin) {
      const fullNameResult = fullNameSchema.safeParse(fullName);
      if (!fullNameResult.success) {
        newErrors.fullName = fullNameResult.error.errors[0].message;
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const emailResult = emailSchema.safeParse(email);
    if (!emailResult.success) {
      setErrors({ email: emailResult.error.errors[0].message });
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth?reset=true`,
      });
      
      if (error) {
        toast({
          title: "שגיאה",
          description: error.message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "נשלח בהצלחה!",
          description: "בדוק את האימייל שלך לקבלת קישור לאיפוס הסיסמה",
        });
        setIsForgotPassword(false);
      }
    } catch (error) {
      toast({
        title: "שגיאה",
        description: "אירעה שגיאה בלתי צפויה",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setIsSubmitting(true);

    try {
      if (isLogin) {
        const { error } = await signIn(email, password);
        if (error) {
          if (error.message.includes("Invalid login credentials")) {
            toast({
              title: "שגיאת התחברות",
              description: "אימייל או סיסמה שגויים",
              variant: "destructive",
            });
          } else {
            toast({
              title: "שגיאה",
              description: error.message,
              variant: "destructive",
            });
          }
        } else {
          toast({
            title: "התחברת בהצלחה!",
            description: "ברוך הבא למערכת",
          });
          navigate("/");
        }
      } else {
        const { error } = await signUp(email, password, fullName);
        if (error) {
          if (error.message.includes("User already registered")) {
            toast({
              title: "משתמש קיים",
              description: "המשתמש כבר רשום במערכת. נסה להתחבר.",
              variant: "destructive",
            });
          } else {
            toast({
              title: "שגיאה",
              description: error.message,
              variant: "destructive",
            });
          }
        } else {
          toast({
            title: "נרשמת בהצלחה!",
            description: invitationInfo 
              ? `ברוך הבא למערכת! התפקיד שלך: ${getRoleLabel(invitationInfo.role)}`
              : "הבקשה שלך נשלחה למנהל המערכת. תקבל גישה לאחר אישור.",
          });
          navigate("/");
        }
      }
    } catch (error) {
      toast({
        title: "שגיאה",
        description: "אירעה שגיאה בלתי צפויה",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const getRoleLabel = (role: string) => {
    const labels: Record<string, string> = {
      admin: "מנהל",
      designer: "מעצב",
      editor: "עורך",
      publisher: "מפיץ",
    };
    return labels[role] || role;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-neon-pink" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-xl gradient-neon flex items-center justify-center animate-pulse-neon">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <div className="text-right">
              <h1 className="font-rubik font-bold text-2xl text-foreground">מגזין פרו</h1>
              <p className="text-sm text-muted-foreground">ניהול הפקה</p>
            </div>
          </div>
        </div>

        <NeonCard variant="glow">
          <NeonCardHeader className="text-center">
            <NeonCardTitle>
              {isForgotPassword ? (
                <span className="flex items-center justify-center gap-2">
                  <KeyRound className="w-5 h-5" />
                  איפוס סיסמה
                </span>
              ) : invitationInfo ? (
                <span className="flex items-center justify-center gap-2">
                  <UserPlus className="w-5 h-5" />
                  הרשמה באמצעות הזמנה
                </span>
              ) : (
                isLogin ? "התחברות" : "הרשמה"
              )}
            </NeonCardTitle>
            <NeonCardDescription>
              {isForgotPassword ? (
                "הזן את כתובת האימייל שלך לקבלת קישור לאיפוס"
              ) : invitationInfo ? (
                <>הוזמנת להצטרף כ<span className="font-bold text-primary">{getRoleLabel(invitationInfo.role)}</span></>
              ) : (
                isLogin ? "היכנס לחשבון שלך" : "צור חשבון חדש"
              )}
            </NeonCardDescription>
          </NeonCardHeader>
          <NeonCardContent>
            {isForgotPassword ? (
              <form onSubmit={handleForgotPassword} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">אימייל</Label>
                  <div className="relative">
                    <Mail className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="your@email.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pr-10"
                      dir="ltr"
                    />
                  </div>
                  {errors.email && (
                    <p className="text-sm text-destructive">{errors.email}</p>
                  )}
                </div>

                <Button
                  type="submit"
                  className="w-full gradient-neon text-white hover:opacity-90"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <Loader2 className="w-4 h-4 animate-spin ml-2" />
                  ) : null}
                  שלח קישור לאיפוס
                </Button>
                
                <div className="mt-4 text-center">
                  <button
                    type="button"
                    onClick={() => {
                      setIsForgotPassword(false);
                      setErrors({});
                    }}
                    className="text-sm text-neon-pink hover:underline"
                  >
                    חזרה להתחברות
                  </button>
                </div>
              </form>
            ) : (
              <>
                <form onSubmit={handleSubmit} className="space-y-4">
                  {!isLogin && (
                    <div className="space-y-2">
                      <Label htmlFor="fullName">שם מלא</Label>
                      <div className="relative">
                        <User className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                          id="fullName"
                          type="text"
                          placeholder="ישראל ישראלי"
                          value={fullName}
                          onChange={(e) => setFullName(e.target.value)}
                          className="pr-10"
                        />
                      </div>
                      {errors.fullName && (
                        <p className="text-sm text-destructive">{errors.fullName}</p>
                      )}
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="email">אימייל</Label>
                    <div className="relative">
                      <Mail className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        id="email"
                        type="email"
                        placeholder="your@email.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="pr-10"
                        dir="ltr"
                        disabled={!!inviteEmail}
                      />
                    </div>
                    {errors.email && (
                      <p className="text-sm text-destructive">{errors.email}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <Label htmlFor="password">סיסמה</Label>
                      {isLogin && (
                        <button
                          type="button"
                          onClick={() => {
                            setIsForgotPassword(true);
                            setErrors({});
                          }}
                          className="text-xs text-neon-pink hover:underline"
                        >
                          שכחתי סיסמה
                        </button>
                      )}
                    </div>
                    <div className="relative">
                      <Lock className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        id="password"
                        type="password"
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="pr-10"
                      />
                    </div>
                    {errors.password && (
                      <p className="text-sm text-destructive">{errors.password}</p>
                    )}
                  </div>

                  <Button
                    type="submit"
                    className="w-full gradient-neon text-white hover:opacity-90"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <Loader2 className="w-4 h-4 animate-spin ml-2" />
                    ) : null}
                    {isLogin ? "התחבר" : "הירשם"}
                  </Button>
                </form>

                {!invitationInfo && (
                  <div className="mt-6 text-center">
                    <button
                      type="button"
                      onClick={() => {
                        setIsLogin(!isLogin);
                        setErrors({});
                      }}
                      className="text-sm text-neon-pink hover:underline"
                    >
                      {isLogin ? "אין לך חשבון? הירשם" : "יש לך חשבון? התחבר"}
                    </button>
                  </div>
                )}
              </>
            )}
          </NeonCardContent>
        </NeonCard>

        <div className="mt-6 text-center text-xs text-muted-foreground">
          <p>תפקידים: מנהל | עורך | מעצב | צוות הוצאה לאור</p>
        </div>
      </div>
    </div>
  );
}
