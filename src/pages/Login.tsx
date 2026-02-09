import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ThemeToggle } from '@/components/shared/ThemeToggle';
import { Loader2, Sparkles, AlertCircle, CheckCircle2, ArrowLeft, KeyRound, UserPlus, LogIn } from 'lucide-react';
import logoImage from '@/assets/logo.png';

export default function Login() {
  const navigate = useNavigate();
  const { signIn, signUp, resetPassword } = useAuth();
  const { theme } = useTheme();

  // Login state
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState('');

  // Signup state
  const [signupName, setSignupName] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [signupConfirmPassword, setSignupConfirmPassword] = useState('');
  const [signupLoading, setSignupLoading] = useState(false);
  const [signupError, setSignupError] = useState('');
  const [signupSuccess, setSignupSuccess] = useState(false);

  // Reset password state
  const [showResetPassword, setShowResetPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetLoading, setResetLoading] = useState(false);
  const [resetError, setResetError] = useState('');
  const [resetSuccess, setResetSuccess] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    setLoginLoading(true);

    const { error } = await signIn(loginEmail, loginPassword, rememberMe);

    if (error) {
      setLoginError(error);
      setLoginLoading(false);
    } else {
      navigate('/');
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setSignupError('');

    if (signupPassword.length < 8) {
      setSignupError('הסיסמה חייבת להכיל לפחות 8 תווים');
      return;
    }

    if (signupPassword !== signupConfirmPassword) {
      setSignupError('הסיסמאות אינן תואמות');
      return;
    }

    setSignupLoading(true);

    const { error } = await signUp(signupEmail, signupPassword, signupName);

    setSignupLoading(false);

    if (error) {
      setSignupError(error);
    } else {
      setSignupSuccess(true);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setResetError('');
    setResetLoading(true);

    const { error } = await resetPassword(resetEmail);

    setResetLoading(false);

    if (error) {
      setResetError(error);
    } else {
      setResetSuccess(true);
    }
  };

  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6,
        ease: 'easeOut' as const,
      },
    },
  };

  const BackgroundPattern = () => (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {/* Gradient overlay */}
      <div className={`absolute inset-0 ${
        theme === 'dark' 
          ? 'bg-gradient-to-br from-background via-background to-primary/5' 
          : 'bg-gradient-to-br from-background via-background to-primary/10'
      }`} />
      
      {/* Animated circles */}
      <motion.div
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.1, 0.2, 0.1],
        }}
        transition={{
          duration: 8,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
        className="absolute -top-1/4 -right-1/4 w-1/2 h-1/2 rounded-full bg-primary/20 blur-3xl"
      />
      <motion.div
        animate={{
          scale: [1.2, 1, 1.2],
          opacity: [0.1, 0.15, 0.1],
        }}
        transition={{
          duration: 10,
          repeat: Infinity,
          ease: 'easeInOut',
          delay: 1,
        }}
        className="absolute -bottom-1/4 -left-1/4 w-1/2 h-1/2 rounded-full bg-primary/15 blur-3xl"
      />
      
      {/* Grid pattern */}
      <div className={`absolute inset-0 ${
        theme === 'dark' ? 'opacity-[0.02]' : 'opacity-[0.03]'
      }`} style={{
        backgroundImage: `radial-gradient(circle at 1px 1px, currentColor 1px, transparent 0)`,
        backgroundSize: '40px 40px',
      }} />
    </div>
  );

  if (showResetPassword) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4 relative">
        <BackgroundPattern />
        
        {/* Theme Toggle */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="fixed top-6 left-6 z-50"
        >
          <ThemeToggle size="lg" />
        </motion.div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="w-full max-w-md relative z-10"
        >
          <Card className="border-border/50 shadow-2xl backdrop-blur-sm bg-card/95">
            <CardHeader className="text-center pb-2">
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="flex justify-center mb-4"
              >
                <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center border border-primary/20 overflow-hidden">
                  <img 
                    src={logoImage} 
                    alt="מגדל אור" 
                    className="w-full h-full object-contain p-2"
                  />
                </div>
              </motion.div>
              <CardTitle className="text-2xl font-bold">איפוס סיסמה</CardTitle>
              <CardDescription>הזן את כתובת האימייל שלך לקבלת קישור לאיפוס</CardDescription>
            </CardHeader>
            <CardContent>
              {resetSuccess ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                >
                  <Alert className="border-success/50 bg-success/10">
                    <CheckCircle2 className="h-4 w-4 text-success" />
                    <AlertDescription className="text-success">
                      נשלח קישור לאיפוס סיסמה לאימייל שלך
                    </AlertDescription>
                  </Alert>
                </motion.div>
              ) : (
                <form onSubmit={handleResetPassword} className="space-y-4">
                  {resetError && (
                    <motion.div
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                    >
                      <Alert variant="destructive">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>{resetError}</AlertDescription>
                      </Alert>
                    </motion.div>
                  )}
                  <div className="space-y-2">
                    <Label htmlFor="reset-email">אימייל</Label>
                    <Input
                      id="reset-email"
                      type="email"
                      placeholder="your@email.com"
                      value={resetEmail}
                      onChange={(e) => setResetEmail(e.target.value)}
                      required
                      dir="ltr"
                      className="text-left bg-background/50"
                    />
                  </div>
                  <Button type="submit" className="w-full font-semibold" disabled={resetLoading}>
                    {resetLoading ? (
                      <>
                        <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                        שולח...
                      </>
                    ) : (
                      'שלח קישור לאיפוס'
                    )}
                  </Button>
                </form>
              )}
              <Button
                variant="ghost"
                className="w-full mt-4 text-muted-foreground hover:text-foreground"
                onClick={() => {
                  setShowResetPassword(false);
                  setResetSuccess(false);
                  setResetError('');
                }}
              >
                <ArrowLeft className="ml-2 h-4 w-4" />
                חזרה להתחברות
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4 relative">
      <BackgroundPattern />
      
      {/* Theme Toggle */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="fixed top-6 left-6 z-50"
      >
        <ThemeToggle size="lg" />
      </motion.div>

      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="w-full max-w-md relative z-10"
      >
        <Card className="border-border/50 shadow-2xl backdrop-blur-sm bg-card/95 overflow-hidden">
          {/* Accent line at top */}
          <div className="h-1 w-full bg-gradient-to-r from-primary via-primary/80 to-primary" />
          
          <CardHeader className="text-center pb-2">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="flex justify-center mb-4"
            >
              <div className="relative">
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center border border-primary/30 shadow-lg overflow-hidden">
                  <img 
                    src={logoImage} 
                    alt="מגדל אור" 
                    className="w-full h-full object-contain p-2"
                  />
                </div>
                <motion.div
                  animate={{
                    scale: [1, 1.2, 1],
                    opacity: [0.5, 0.2, 0.5],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: 'easeInOut',
                  }}
                  className="absolute inset-0 rounded-2xl bg-primary/20 blur-xl"
                />
              </div>
            </motion.div>
            <CardTitle className="text-3xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text">
              מטה מנכ״ל
            </CardTitle>
            <CardDescription className="text-base">מערכת ניהול משימות ופרויקטים</CardDescription>
          </CardHeader>
          
          <CardContent className="pt-4">
            <Tabs defaultValue="login" className="w-full">
              <TabsList className="flex w-full justify-start mb-6 p-1 bg-muted/50 gap-1">
                <TabsTrigger 
                  value="login"
                  className="flex-1 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground gap-2"
                >
                  <LogIn className="h-4 w-4" />
                  התחברות
                </TabsTrigger>
                <TabsTrigger 
                  value="signup"
                  className="flex-1 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground gap-2"
                >
                  <UserPlus className="h-4 w-4" />
                  הרשמה
                </TabsTrigger>
              </TabsList>

              <TabsContent value="login">
                <form onSubmit={handleLogin} className="space-y-4">
                  {loginError && (
                    <motion.div
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                    >
                      <Alert variant="destructive">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>{loginError}</AlertDescription>
                      </Alert>
                    </motion.div>
                  )}
                  <div className="space-y-2">
                    <Label htmlFor="login-email">אימייל</Label>
                    <Input
                      id="login-email"
                      type="email"
                      placeholder="your@email.com"
                      value={loginEmail}
                      onChange={(e) => setLoginEmail(e.target.value)}
                      required
                      dir="ltr"
                      className="text-left bg-background/50 focus:bg-background transition-colors"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="login-password">סיסמה</Label>
                    <Input
                      id="login-password"
                      type="password"
                      placeholder="••••••••"
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      required
                      dir="ltr"
                      className="text-left bg-background/50 focus:bg-background transition-colors"
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Checkbox
                        id="remember"
                        checked={rememberMe}
                        onCheckedChange={(checked) => setRememberMe(checked === true)}
                        className="border-muted-foreground/50"
                      />
                      <Label htmlFor="remember" className="text-sm font-normal cursor-pointer text-muted-foreground">
                        הישאר מחובר
                      </Label>
                    </div>
                    <Button
                      type="button"
                      variant="link"
                      className="p-0 h-auto text-sm text-primary hover:text-primary/80"
                      onClick={() => setShowResetPassword(true)}
                    >
                      שכחתי סיסמה
                    </Button>
                  </div>
                  <Button 
                    type="submit" 
                    className="w-full font-semibold text-base h-11 shadow-lg shadow-primary/25 hover:shadow-primary/40 transition-shadow" 
                    disabled={loginLoading}
                  >
                    {loginLoading ? (
                      <>
                        <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                        מתחבר...
                      </>
                    ) : (
                      <>
                        <LogIn className="ml-2 h-4 w-4" />
                        התחברות
                      </>
                    )}
                  </Button>
                </form>
              </TabsContent>

              <TabsContent value="signup">
                {signupSuccess ? (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                  >
                    <Alert className="border-success/50 bg-success/10">
                      <CheckCircle2 className="h-4 w-4 text-success" />
                      <AlertDescription className="text-success">
                        נשלח אימייל אימות לכתובת שלך. אנא בדוק את תיבת הדואר.
                      </AlertDescription>
                    </Alert>
                  </motion.div>
                ) : (
                  <form onSubmit={handleSignup} className="space-y-4">
                    {signupError && (
                      <motion.div
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                      >
                        <Alert variant="destructive">
                          <AlertCircle className="h-4 w-4" />
                          <AlertDescription>{signupError}</AlertDescription>
                        </Alert>
                      </motion.div>
                    )}
                    <div className="space-y-2">
                      <Label htmlFor="signup-name">שם מלא</Label>
                      <Input
                        id="signup-name"
                        type="text"
                        placeholder="ישראל ישראלי"
                        value={signupName}
                        onChange={(e) => setSignupName(e.target.value)}
                        required
                        className="bg-background/50 focus:bg-background transition-colors"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="signup-email">אימייל</Label>
                      <Input
                        id="signup-email"
                        type="email"
                        placeholder="your@email.com"
                        value={signupEmail}
                        onChange={(e) => setSignupEmail(e.target.value)}
                        required
                        dir="ltr"
                        className="text-left bg-background/50 focus:bg-background transition-colors"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="signup-password">סיסמה (מינימום 8 תווים)</Label>
                      <Input
                        id="signup-password"
                        type="password"
                        placeholder="••••••••"
                        value={signupPassword}
                        onChange={(e) => setSignupPassword(e.target.value)}
                        required
                        minLength={8}
                        dir="ltr"
                        className="text-left bg-background/50 focus:bg-background transition-colors"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="signup-confirm">אישור סיסמה</Label>
                      <Input
                        id="signup-confirm"
                        type="password"
                        placeholder="••••••••"
                        value={signupConfirmPassword}
                        onChange={(e) => setSignupConfirmPassword(e.target.value)}
                        required
                        dir="ltr"
                        className="text-left bg-background/50 focus:bg-background transition-colors"
                      />
                    </div>
                    <Button 
                      type="submit" 
                      className="w-full font-semibold text-base h-11 shadow-lg shadow-primary/25 hover:shadow-primary/40 transition-shadow" 
                      disabled={signupLoading}
                    >
                      {signupLoading ? (
                        <>
                          <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                          נרשם...
                        </>
                      ) : (
                        <>
                          <UserPlus className="ml-2 h-4 w-4" />
                          הרשמה
                        </>
                      )}
                    </Button>
                  </form>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
        
        {/* Footer text */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="text-center text-sm text-muted-foreground mt-6"
        >
          מערכת ניהול משימות ופרויקטים מתקדמת
        </motion.p>
      </motion.div>
    </div>
  );
}
