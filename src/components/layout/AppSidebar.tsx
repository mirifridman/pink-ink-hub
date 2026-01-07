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

type AppRole = "admin" | "designer" | "editor" | "publisher";

interface MenuItem {
  icon: typeof LayoutDashboard;
  label: string;
  path: string;
  roles: AppRole[];
  badgeKey?: "reminders" | "notifications";
}

const menuItems: MenuItem[] = [
  { icon: LayoutDashboard, label: "דשבורד", path: "/", roles: ["admin", "editor", "designer"] },
  { icon: BookOpen, label: "גליונות", path: "/issues", roles: ["admin", "editor", "designer", "publisher"] },
  { icon: TableProperties, label: "ליינאפ", path: "/lineup", roles: ["admin", "editor", "designer", "publisher"] },
  { icon: Users, label: "ספקים", path: "/suppliers", roles: ["admin", "editor", "designer"] },
  { icon: Users, label: "אנשי צוות", path: "/team", roles: ["admin", "editor", "designer", "publisher"] },
  { icon: Bell, label: "תזכורות", path: "/reminders", roles: ["admin", "editor"], badgeKey: "reminders" },
  { icon: Calendar, label: "לוח רבעוני", path: "/schedule", roles: ["admin", "editor", "designer", "publisher"] },
  { icon: MessageSquare, label: "הודעות מערכת", path: "/messages", roles: ["admin", "editor", "designer", "publisher"], badgeKey: "notifications" },
  { icon: UserCog, label: "ניהול משתמשים", path: "/users", roles: ["admin"] },
  { icon: Shield, label: "ניהול הרשאות", path: "/permissions", roles: ["admin"] },
  { icon: Settings, label: "הגדרות", path: "/settings", roles: ["admin"] },
];


export function AppSidebar() {
  const location = useLocation();
  const { hasPermission } = useAuth();
  const { data: pendingRemindersCount } = usePendingRemindersCount();
  const { data: unreadNotificationsCount } = useUnreadNotificationsCount();

  const filteredMenuItems = menuItems.filter((item) => 
    hasPermission(item.roles)
  );

  const getBadgeCount = (badgeKey?: "reminders" | "notifications") => {
    if (badgeKey === "reminders") return pendingRemindersCount || 0;
    if (badgeKey === "notifications") return unreadNotificationsCount || 0;
    return 0;
  };

  return (
    <aside className="fixed top-0 right-0 h-screen w-64 bg-sidebar text-sidebar-foreground border-l border-sidebar-border flex flex-col z-50">
      {/* Logo */}
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
      <nav className="flex-1 p-4 space-y-1">
        {filteredMenuItems.map((item) => {
          const isActive = location.pathname === item.path;
          const badgeCount = getBadgeCount(item.badgeKey);
          
          return (
            <NavLink
              key={item.path}
              to={item.path}
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
