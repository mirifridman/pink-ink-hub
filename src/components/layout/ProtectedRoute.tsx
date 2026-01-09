import { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useMyPermissions, type PermissionKey, ROLE_LABELS } from "@/hooks/usePermissions";
import { Loader2 } from "lucide-react";

// Map routes to their required permission keys
const routePermissions: Record<string, PermissionKey> = {
  "/": "view_dashboard",
  "/issues": "view_issues",
  "/lineup": "view_lineup",
  "/suppliers": "view_suppliers",
  "/team": "view_team",
  "/reminders": "view_reminders",
  "/schedule": "view_schedule",
  "/messages": "view_messages",
  "/users": "view_users",
  "/permissions": "manage_settings",
  "/settings": "view_settings",
};

interface ProtectedRouteProps {
  children: ReactNode;
  adminOnly?: boolean;
}

export function ProtectedRoute({ children, adminOnly }: ProtectedRouteProps) {
  const { user, role, loading } = useAuth();
  const location = useLocation();
  const { data: permissions, isLoading: permissionsLoading } = useMyPermissions();

  if (loading || permissionsLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-neon-pink" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  // Admin always has access to everything
  if (role === "admin") {
    return <>{children}</>;
  }

  // Admin-only pages require admin role
  if (adminOnly) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-foreground mb-2">אין הרשאה</h1>
          <p className="text-muted-foreground mb-4">
            עמוד זה מיועד למנהלים בלבד
          </p>
          <p className="text-sm text-muted-foreground">
            התפקיד שלך: {role ? ROLE_LABELS[role] || role : "לא מוגדר"}
          </p>
        </div>
      </div>
    );
  }

  // Check dynamic permission for non-admin routes
  const requiredPermission = routePermissions[location.pathname];
  // Only check permissions if we have loaded permissions data (not empty object)
  const hasLoadedPermissions = permissions && Object.keys(permissions).length > 0;
  
  if (requiredPermission && hasLoadedPermissions && permissions[requiredPermission] === false) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-foreground mb-2">אין הרשאה</h1>
          <p className="text-muted-foreground mb-4">
            אין לך הרשאה לצפות בעמוד זה
          </p>
          <p className="text-sm text-muted-foreground">
            התפקיד שלך: {role ? ROLE_LABELS[role] || role : "לא מוגדר"}
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
