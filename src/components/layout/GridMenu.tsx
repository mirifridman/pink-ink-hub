import { useState, useEffect } from "react";
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
  Menu,
  X,
  Sparkles
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useMyPermissions, type PermissionKey } from "@/hooks/usePermissions";
import { usePendingRemindersCount, useUnreadNotificationsCount } from "@/hooks/useReminders";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

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

export function GridMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { user, role, signOut } = useAuth();
  const { data: permissions, isLoading: permissionsLoading } = useMyPermissions();
  const { data: pendingRemindersCount } = usePendingRemindersCount();
  const { data: unreadNotificationsCount } = useUnreadNotificationsCount();

  // Close menu on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsOpen(false);
    };
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, []);

  // Prevent body scroll when menu is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

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

  const handleNavigate = (path: string) => {
    navigate(path);
    setTimeout(() => setIsOpen(false), 150);
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
    <>
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 h-16 bg-sidebar/95 backdrop-blur-xl flex items-center justify-between px-5 z-50 border-b border-sidebar-border">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl gradient-neon flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="text-lg font-rubik font-bold text-white">מגזין פרו</div>
            <div className="text-xs text-sidebar-foreground/60">ניהול הפקה</div>
          </div>
        </div>
        
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="w-11 h-11 bg-sidebar-accent hover:bg-sidebar-primary/20 rounded-xl flex items-center justify-center transition-all duration-300"
          aria-label={isOpen ? "סגור תפריט" : "פתח תפריט"}
        >
          {isOpen ? (
            <X className="text-white" size={24} />
          ) : (
            <Menu className="text-white" size={24} />
          )}
        </button>
      </header>

      {/* Menu Overlay */}
      <div
        className={`fixed top-16 left-0 right-0 bottom-0 bg-sidebar/98 backdrop-blur-3xl z-40 transition-all duration-300 overflow-y-auto ${
          isOpen ? "opacity-100 visible" : "opacity-0 invisible pointer-events-none"
        }`}
      >
        <div
          className={`max-w-xl mx-auto p-6 transition-all duration-400 ${
            isOpen ? "translate-y-0 opacity-100" : "-translate-y-8 opacity-0"
          }`}
        >
          {/* Grid */}
          <div className="grid grid-cols-3 gap-4">
            {filteredMenuItems.map((item, index) => {
              const Icon = item.icon;
              const badgeCount = getBadgeCount(item.badgeKey);
              const isActive = location.pathname === item.path;
              
              return (
                <button
                  key={item.id}
                  onClick={() => handleNavigate(item.path)}
                  className={`aspect-square rounded-2xl flex flex-col items-center justify-center gap-3 cursor-pointer transition-all duration-300 relative overflow-hidden group
                    ${isActive 
                      ? "bg-gradient-to-br from-sidebar-primary to-purple-600 border-transparent shadow-lg shadow-sidebar-primary/30" 
                      : "bg-sidebar-accent border border-sidebar-border hover:border-sidebar-primary/50 hover:scale-105 hover:shadow-[0_10px_40px_rgba(236,72,153,0.2)]"
                    }`}
                  style={{
                    transitionDelay: isOpen ? `${index * 40}ms` : "0ms",
                    opacity: isOpen ? 1 : 0,
                    transform: isOpen ? "translateY(0)" : "translateY(20px)",
                  }}
                >
                  {/* Hover gradient overlay */}
                  {!isActive && (
                    <div className="absolute inset-0 bg-gradient-to-br from-sidebar-primary/20 to-purple-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  )}
                  
                  {/* Badge */}
                  {badgeCount > 0 && (
                    <span className="absolute top-3 left-3 min-w-[22px] h-[22px] bg-destructive rounded-full text-xs font-semibold flex items-center justify-center px-1.5 text-white">
                      {badgeCount > 99 ? "99+" : badgeCount}
                    </span>
                  )}
                  
                  <Icon className="w-7 h-7 text-white relative z-10" />
                  <span className="text-sm font-medium text-white text-center relative z-10 px-2">{item.label}</span>
                  
                  {/* Active indicator */}
                  {isActive && (
                    <div className="absolute bottom-3 w-6 h-1 rounded-full bg-white/50" />
                  )}
                </button>
              );
            })}
          </div>

          {/* User Section */}
          <div className="mt-8 pt-5 border-t border-sidebar-border flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Avatar className={`h-11 w-11 bg-gradient-to-br ${role ? roleColors[role] : "from-pink-500 to-purple-500"}`}>
                <AvatarFallback className="bg-transparent text-white font-bold text-lg">
                  {getInitials()}
                </AvatarFallback>
              </Avatar>
              <div>
                <div className="font-medium text-white">{getUserDisplayName()}</div>
                <div className="text-xs text-sidebar-foreground/60">
                  {role ? roleLabels[role] : "משתמש"}
                </div>
              </div>
            </div>
            <button 
              onClick={handleSignOut}
              className="px-5 py-2.5 bg-sidebar-accent hover:bg-destructive/20 hover:text-destructive rounded-xl text-white text-sm transition-all duration-300 flex items-center gap-2"
            >
              <LogOut size={16} />
              התנתקות
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
