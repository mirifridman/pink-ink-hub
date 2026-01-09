import { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Loader2 } from "lucide-react";

interface ProtectedRouteProps {
  children: ReactNode;
  adminOnly?: boolean;
}

export function ProtectedRoute({ children, adminOnly }: ProtectedRouteProps) {
  const { user, role, loading } = useAuth();

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

  // Admin-only pages require admin role
  if (adminOnly && role !== "admin") {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-foreground mb-2">אין הרשאה</h1>
          <p className="text-muted-foreground mb-4">
            עמוד זה מיועד למנהלים בלבד
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
