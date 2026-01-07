import { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Loader2 } from "lucide-react";

type AppRole = "admin" | "designer" | "editor" | "publisher";

interface ProtectedRouteProps {
  children: ReactNode;
  allowedRoles?: AppRole[];
}

export function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const { user, role, loading, hasPermission } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-neon-pink" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  // If specific roles are required and user doesn't have permission
  if (allowedRoles && allowedRoles.length > 0 && !hasPermission(allowedRoles)) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-foreground mb-2">אין הרשאה</h1>
          <p className="text-muted-foreground mb-4">
            אין לך הרשאה לצפות בעמוד זה
          </p>
          <p className="text-sm text-muted-foreground">
            התפקיד שלך: {role || "לא מוגדר"}
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
