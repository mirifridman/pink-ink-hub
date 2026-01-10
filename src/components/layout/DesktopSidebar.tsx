import { useNavigate, useLocation } from "react-router-dom";
import { 
  LayoutDashboard, 
  BookOpen, 
  TableProperties, 
  Users, 
  UserCog,
  Bell, 
  Calendar, 
  MessageSquare, 
  Settings, 
  Shield,
  LogOut,
  Sparkles
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useMyPermissions, type PermissionKey } from "@/hooks/usePermissions";
import { usePendingRemindersCount, useUnreadNotificationsCount } from "@/hooks/useReminders";

interface MenuItem {
  id: string;
  label: string;
  icon: typeof LayoutDashboard;
  path: string;
  permissionKey: PermissionKey;
  badgeKey?: "reminders" | "notifications";
  adminOnly?: boolean;
}

const menuItems: MenuItem[] = [
  { id: "dashboard", label: "דשבורד", icon: LayoutDashboard, path: "/", permissionKey: "view_dashboard" },
  { id: "issues", label: "גליונות", icon: BookOpen, path: "/issues", permissionKey: "view_issues" },
  { id: "lineup", label: "ליינאפ", icon: TableProperties, path: "/lineup", permissionKey: "view_lineup" },
  { id: "suppliers", label: "ספקים", icon: Users, path: "/suppliers", permissionKey: "view_suppliers" },
  { id: "team", label: "אנשי צוות", icon: UserCog, path: "/team", permissionKey: "view_team" },
  { id: "reminders", label: "תזכורות", icon: Bell, path: "/reminders", permissionKey: "view_reminders", badgeKey: "reminders" },
  { id: "schedule", label: "לוח רבעוני", icon: Calendar, path: "/schedule", permissionKey: "view_schedule" },
  { id: "messages", label: "הודעות מערכת", icon: MessageSquare, path: "/messages", permissionKey: "view_messages", badgeKey: "notifications" },
  { id: "users", label: "ניהול משתמשים", icon: Settings, path: "/users", permissionKey: "view_users", adminOnly: true },
  { id: "permissions", label: "ניהול הרשאות", icon: Shield, path: "/permissions", permissionKey: "manage_settings", adminOnly: true },
];

type AppRole = "admin" | "designer" | "editor" | "publisher" | "social";

const roleLabels: Record<AppRole, string> = {
  admin: "מנהל",
  editor: "עורך",
  designer: "מעצב",
  publisher: "צוות הוצאה לאור",
  social: "רשתות חברתיות",
};

const roleColors: Record<AppRole, string> = {
  admin: "from-pink-500 to-purple-500",
  editor: "from-blue-500 to-cyan-500",
  designer: "from-purple-500 to-pink-500",
  publisher: "from-cyan-500 to-blue-500",
  social: "from-orange-500 to-yellow-500",
};

export function DesktopSidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, role, signOut } = useAuth();
  const { data: permissions, isLoading: permissionsLoading } = useMyPermissions();
  const { data: pendingRemindersCount } = usePendingRemindersCount();
  const { data: unreadNotificationsCount } = useUnreadNotificationsCount();

  const filteredMenuItems = menuItems.filter((item) => {
    if (role === "admin") return true;
    if (item.adminOnly) return false;
    if (permissionsLoading || !permissions) return false;
    return permissions[item.permissionKey] === true;
  });

  const getBadgeCount = (badgeKey?: "reminders" | "notifications") => {
    if (badgeKey === "reminders") return pendingRemindersCount || 0;
    if (badgeKey === "notifications") return unreadNotificationsCount || 0;
    return 0;
  };

  const handleSignOut = async () => {
    await signOut();
    navigate("/auth");
  };

  const getInitials = () => {
    if (!user?.email) return "U";
    return user.email.charAt(0).toUpperCase();
  };

  const getUserDisplayName = () => {
    if (user?.user_metadata?.full_name) {
      return user.user_metadata.full_name;
    }
    return user?.email || "משתמש";
  };

  return (
    <aside 
      className="
        fixed top-0 right-0 bottom-0 z-50 
        w-20 hover:w-60
        bg-sidebar/95 backdrop-blur-xl 
        border-l border-sidebar-border 
        flex flex-col 
        py-5 px-3 
        transition-all duration-[400ms] ease-out
        overflow-hidden
        group
        hidden lg:flex
      "
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-2.5 mb-8">
        <div className="min-w-[44px] h-11 gradient-neon rounded-[14px] flex items-center justify-center shadow-lg shadow-primary/30">
          <Sparkles className="w-5 h-5 text-white" />
        </div>
        <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 whitespace-nowrap">
          <div className="text-lg font-rubik font-bold text-foreground">מגזין פרו</div>
          <div className="text-xs text-muted-foreground">ניהול הפקה</div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 flex flex-col gap-2">
        {filteredMenuItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;
          const badgeCount = getBadgeCount(item.badgeKey);
          
          return (
            <button
              key={item.id}
              onClick={() => navigate(item.path)}
              className={`
                flex items-center gap-3 px-3 py-3 rounded-xl 
                transition-all duration-300 relative
                ${isActive
                  ? "bg-gradient-to-br from-primary to-purple-600 text-primary-foreground shadow-lg shadow-primary/30"
                  : "text-muted-foreground hover:bg-accent hover:text-foreground"
                }
              `}
            >
              {/* Icon - always visible */}
              <span className="min-w-[32px] h-8 flex items-center justify-center">
                <Icon className="w-5 h-5" />
              </span>
              
              {/* Label - visible on hover */}
              <span className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 text-sm font-medium whitespace-nowrap">
                {item.label}
              </span>
              
              {/* Badge */}
              {badgeCount > 0 && (
                <span className={`
                  min-w-[18px] h-[18px] bg-destructive rounded-full 
                  text-[10px] font-semibold text-destructive-foreground
                  flex items-center justify-center px-1.5
                  absolute top-2 right-2
                  group-hover:relative group-hover:top-0 group-hover:right-0 group-hover:mr-auto
                  transition-all duration-300
                `}>
                  {badgeCount > 99 ? "99+" : badgeCount}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* User */}
      <div className="flex flex-col gap-3 pt-4 border-t border-sidebar-border mt-auto">
        <button
          onClick={() => navigate("/profile")}
          className="flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-accent transition-all duration-200 cursor-pointer"
        >
          <div className={`min-w-[40px] h-10 bg-gradient-to-br ${role ? roleColors[role] : "from-pink-500 to-purple-500"} rounded-xl flex items-center justify-center font-semibold text-base text-white`}>
            {getInitials()}
          </div>
          <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 whitespace-nowrap overflow-hidden text-right">
            <div className="font-medium text-sm text-foreground truncate">{getUserDisplayName()}</div>
            <div className="text-[11px] text-muted-foreground">
              {role ? roleLabels[role] : "משתמש"}
            </div>
          </div>
        </button>
        
        {/* Logout button - visible on hover */}
        <button
          onClick={handleSignOut}
          className="opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-center gap-3 px-3 py-2.5 rounded-xl text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
        >
          <span className="min-w-[32px] h-8 flex items-center justify-center">
            <LogOut className="w-5 h-5" />
          </span>
          <span className="text-sm font-medium whitespace-nowrap">התנתקות</span>
        </button>
      </div>
    </aside>
  );
}
