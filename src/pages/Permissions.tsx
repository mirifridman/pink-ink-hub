import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Loader2, Shield, Settings, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import {
  useRolePermissions,
  useUpdatePermission,
  PERMISSION_LABELS,
  PERMISSION_GROUPS,
  ROLE_LABELS,
  type PermissionKey,
} from "@/hooks/usePermissions";
import { cn } from "@/lib/utils";

const ROLES = ["admin", "editor", "designer", "publisher"] as const;

const roleColors: Record<string, string> = {
  admin: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400 border-red-200 dark:border-red-800",
  editor: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400 border-blue-200 dark:border-blue-800",
  designer: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400 border-purple-200 dark:border-purple-800",
  publisher: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 border-green-200 dark:border-green-800",
};

export default function Permissions() {
  const { data: permissions, isLoading } = useRolePermissions();
  const updatePermission = useUpdatePermission();

  const getPermissionValue = (role: string, permissionKey: PermissionKey): boolean => {
    const permission = permissions?.find(
      (p) => p.role === role && p.permission_key === permissionKey
    );
    return permission?.is_allowed ?? false;
  };

  const handleToggle = async (role: string, permissionKey: PermissionKey, currentValue: boolean) => {
    // Prevent disabling admin's core permissions
    if (role === "admin" && ["view_settings", "manage_settings", "view_users", "manage_users"].includes(permissionKey)) {
      toast.error("לא ניתן לבטל הרשאות ניהול בסיסיות למנהל");
      return;
    }

    try {
      await updatePermission.mutateAsync({
        role,
        permissionKey,
        isAllowed: !currentValue,
      });
      toast.success("ההרשאה עודכנה בהצלחה");
    } catch (error) {
      toast.error("שגיאה בעדכון ההרשאה");
    }
  };

  if (isLoading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-accent" />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="space-y-6 animate-fade-in-up" dir="rtl">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-rubik font-bold text-foreground flex items-center gap-3">
            <Shield className="w-8 h-8 text-accent" />
            ניהול הרשאות
          </h1>
          <p className="text-muted-foreground mt-1">
            הגדרת הרשאות גישה לכל סוג משתמש במערכת
          </p>
        </div>

        {/* Warning */}
        <div className="flex items-start gap-3 p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl">
          <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 mt-0.5 shrink-0" />
          <div className="text-sm">
            <p className="font-medium text-amber-800 dark:text-amber-300">שים לב</p>
            <p className="text-amber-700 dark:text-amber-400">
              שינויים בהרשאות ישפיעו מיידית על כל המשתמשים מאותו סוג. הרשאות מנהל מסוימות לא ניתנות לביטול.
            </p>
          </div>
        </div>

        {/* Role Headers */}
        <div className="grid grid-cols-5 gap-4">
          <div className="font-medium text-muted-foreground">הרשאה</div>
          {ROLES.map((role) => (
            <div key={role} className="text-center">
              <Badge className={cn("text-sm px-3 py-1", roleColors[role])}>
                {ROLE_LABELS[role]}
              </Badge>
            </div>
          ))}
        </div>

        {/* Permission Groups */}
        {PERMISSION_GROUPS.map((group) => (
          <Card key={group.name}>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Settings className="w-4 h-4 text-accent" />
                {group.name}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {group.permissions.map((permissionKey) => (
                <div
                  key={permissionKey}
                  className="grid grid-cols-5 gap-4 items-center py-2 border-b border-border/50 last:border-0"
                >
                  <div className="text-sm font-medium">
                    {PERMISSION_LABELS[permissionKey]}
                  </div>
                  {ROLES.map((role) => {
                    const isAllowed = getPermissionValue(role, permissionKey);
                    const isProtected =
                      role === "admin" &&
                      ["view_settings", "manage_settings", "view_users", "manage_users"].includes(permissionKey);

                    return (
                      <div key={role} className="flex justify-center">
                        <Switch
                          checked={isAllowed}
                          onCheckedChange={() => handleToggle(role, permissionKey, isAllowed)}
                          disabled={updatePermission.isPending || isProtected}
                          className={cn(
                            isProtected && "opacity-50 cursor-not-allowed"
                          )}
                        />
                      </div>
                    );
                  })}
                </div>
              ))}
            </CardContent>
          </Card>
        ))}
      </div>
    </AppLayout>
  );
}
