import { 
  LayoutDashboard, 
  BookOpen, 
  TableProperties, 
  Users, 
  Bell, 
  Calendar,
  Sparkles,
  MessageSquare,
  Settings,
  UserCog,
  Shield
} from "lucide-react";
import { UserMenu } from "./UserMenu";
import { NavLink, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { SidebarBadge } from "./SidebarBadge";
import { usePendingRemindersCount, useUnreadNotificationsCount } from "@/hooks/useReminders";
import { useMyPermissions, type PermissionKey } from "@/hooks/usePermissions";

interface MenuItem {
  icon: typeof LayoutDashboard;
  label: string;
  path: string;
  permissionKey: PermissionKey;
  badgeKey?: "reminders" | "notifications";
  adminOnly?: boolean;
}

const menuItems: MenuItem[] = [
  { icon: LayoutDashboard, label: "דשבורד", path: "/", permissionKey: "view_dashboard" },
  { icon: BookOpen, label: "גליונות", path: "/issues", permissionKey: "view_issues" },
  { icon: TableProperties, label: "ליינאפ", path: "/lineup", permissionKey: "view_lineup" },
  { icon: Users, label: "ספקים", path: "/suppliers", permissionKey: "view_suppliers" },
  { icon: Users, label: "אנשי צוות", path: "/team", permissionKey: "view_team" },
  { icon: Bell, label: "תזכורות", path: "/reminders", permissionKey: "view_reminders", badgeKey: "reminders" },
  { icon: Calendar, label: "לוח רבעוני", path: "/schedule", permissionKey: "view_schedule" },
  { icon: MessageSquare, label: "הודעות מערכת", path: "/messages", permissionKey: "view_messages", badgeKey: "notifications" },
  { icon: Settings, label: "הגדרות", path: "/settings", permissionKey: "view_settings" },
  { icon: UserCog, label: "ניהול משתמשים", path: "/users", permissionKey: "view_users", adminOnly: true },
  { icon: Shield, label: "ניהול הרשאות", path: "/permissions", permissionKey: "manage_settings", adminOnly: true },
];

interface AppSidebarProps {
  onNavigate?: () => void;
}

export function AppSidebar({ onNavigate }: AppSidebarProps) {
  const location = useLocation();
  const { role } = useAuth();
  const { data: permissions, isLoading: permissionsLoading } = useMyPermissions();
  const { data: pendingRemindersCount } = usePendingRemindersCount();
  const { data: unreadNotificationsCount } = useUnreadNotificationsCount();

  // Filter menu items based on role - admin sees everything
  const filteredMenuItems = menuItems.filter((item) => {
    if (role === "admin") return true;
    if (item.adminOnly) return false;
    return true; // Show all non-admin items to logged-in users
  });

  const getBadgeCount = (badgeKey?: "reminders" | "notifications") => {
    if (badgeKey === "reminders") return pendingRemindersCount || 0;
    if (badgeKey === "notifications") return unreadNotificationsCount || 0;
    return 0;
  };

  return (
    <aside className="md:fixed md:top-0 md:right-0 h-full md:h-screen w-full md:w-64 bg-sidebar text-sidebar-foreground md:border-l border-sidebar-border flex flex-col z-50">
      {/* Logo - Hidden on mobile (header shows it) */}
      <div className="p-6 border-b border-sidebar-border">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl gradient-neon flex items-center justify-center animate-pulse-neon">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="font-rubik font-bold text-lg text-white">מגזין פרו</h1>
            <p className="text-xs text-sidebar-foreground/60">ניהול הפקה</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {filteredMenuItems.map((item) => {
          const isActive = location.pathname === item.path;
          const badgeCount = getBadgeCount(item.badgeKey);
          
          return (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={onNavigate}
              className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200",
                isActive
                  ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-lg shadow-neon-pink/20"
                  : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
              )}
            >
              <item.icon className="w-5 h-5" />
              <span>{item.label}</span>
              {badgeCount > 0 && (
                <SidebarBadge count={badgeCount} />
              )}
              {isActive && !badgeCount && (
                <div className="mr-auto w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* User Menu */}
      <div className="p-4 border-t border-sidebar-border">
        <UserMenu />
      </div>
    </aside>
  );
}
