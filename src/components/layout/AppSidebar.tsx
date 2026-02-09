import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  CheckSquare,
  FolderKanban,
  FileText,
  Gavel,
  Users,
  Settings,
  LogOut,
  Moon,
  Sun,
  Mail,
  Bell,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { ProfileModal } from '@/components/profile/ProfileModal';
import logoImage from '@/assets/logo.png';

const menuItems = [
  { title: 'סקירה כללית', path: '/', icon: LayoutDashboard },
  { title: 'משימות', path: '/tasks', icon: CheckSquare, badge: true },
  { title: 'מרכז דואר', path: '/email-center', icon: Mail, emailBadge: true },
  { title: 'פרויקטים', path: '/projects', icon: FolderKanban },
  { title: 'נהלים', path: '/procedures', icon: FileText },
  { title: 'החלטות', path: '/decisions', icon: Gavel },
  { title: 'צוות', path: '/team', icon: Users },
  { title: 'התראות', path: '/notifications', icon: Bell, notificationBadge: true },
  { title: 'הגדרות', path: '/settings', icon: Settings },
];

export function AppSidebar() {
  const location = useLocation();
  const { profile, signOut } = useAuth();
  const { theme, toggleTheme, setTheme } = useTheme();
  const [isHovered, setIsHovered] = useState(false);
  const [totalTasksCount, setTotalTasksCount] = useState(0);
  const [incomingEmailsCount, setIncomingEmailsCount] = useState(0);
  const [unreadNotificationsCount, setUnreadNotificationsCount] = useState(0);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

  // Sidebar is collapsed by default, expands on hover
  const isExpanded = isHovered;

  // Initialize theme from profile only when user has no local preference yet
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    const profileTheme = profile?.theme_preference;

    if (!savedTheme && (profileTheme === 'dark' || profileTheme === 'light')) {
      setTheme(profileTheme);
    }
  }, [profile?.theme_preference, setTheme]);

  // Fetch tasks and emails count
  useEffect(() => {
    const fetchCounts = async () => {
      // Fetch open tasks count (exclude completed)
      const { count: tasksCount } = await supabase
        .from('tasks')
        .select('*', { count: 'exact', head: true })
        .neq('status', 'completed');
      
      // Fetch unread inbox emails count (same logic as inbox: exclude outbox and automation)
      const { data: outboxReplies } = await supabase
        .from('email_replies')
        .select('email_id');
      
      const outboxEmailIds = outboxReplies 
        ? [...new Set(outboxReplies.map(r => r.email_id))] 
        : [];

      let unreadQuery = supabase
        .from('emails')
        .select('*', { count: 'exact', head: true })
        .eq('is_read', false)
        .neq('status', 'archived')
        .neq('sender_name', 'mancal');
      
      if (outboxEmailIds.length > 0) {
        unreadQuery = unreadQuery.not('id', 'in', `(${outboxEmailIds.join(',')})`);
      }
      
      const { count: unreadEmailsCount } = await unreadQuery;
      
      // Fetch unread notifications count
      const { count: notificationsCount } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', profile?.id || '')
        .eq('is_read', false);
      
      setTotalTasksCount(tasksCount || 0);
      setIncomingEmailsCount(unreadEmailsCount || 0);
      setUnreadNotificationsCount(notificationsCount || 0);
    };

    fetchCounts();

    // Subscribe to task changes
    const tasksChannel = supabase
      .channel('tasks-count-sidebar')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tasks' }, () => {
        fetchCounts();
      })
      .subscribe();

    // Subscribe to emails changes (Email Center - for unread count)
    const emailsChannel = supabase
      .channel('emails-count-sidebar')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'emails' }, () => {
        fetchCounts();
      })
      .subscribe();

    // Subscribe to notifications changes
    const notificationsChannel = supabase
      .channel('notifications-count-sidebar')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'notifications' }, () => {
        fetchCounts();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(tasksChannel);
      supabase.removeChannel(emailsChannel);
      supabase.removeChannel(notificationsChannel);
    };
  }, [profile?.id]);

  const getInitials = (name: string | null) => {
    if (!name) return '?';
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getRoleLabel = (role: string | null) => {
    const roles: Record<string, string> = {
      admin: 'מנהל מערכת',
      editor: 'עורך',
      viewer: 'צופה',
    };
    return roles[role || 'viewer'] || 'צופה';
  };

  return (
    <aside
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={cn(
        'fixed right-0 top-0 h-screen bg-sidebar flex flex-col border-l border-sidebar-border transition-all duration-300 z-50',
        isExpanded ? 'w-64' : 'w-16'
      )}
    >
      {/* Header */}
      <div className="p-3 flex items-center justify-center h-16">
        <div className={cn(
          'flex items-center gap-3 transition-all duration-300 overflow-hidden',
          isExpanded ? 'w-full' : 'w-10'
        )}>
          <img 
            src={logoImage} 
            alt="מגדל אור" 
            className="w-10 h-10 rounded-lg object-contain shrink-0"
          />
          <div className={cn(
            'transition-all duration-300 whitespace-nowrap',
            isExpanded ? 'opacity-100' : 'opacity-0 w-0'
          )}>
            <h1 className="text-sidebar-foreground font-bold text-lg">מטה מנכ״ל</h1>
            <p className="text-sidebar-muted text-xs">ניהול משימות ופרויקטים</p>
          </div>
        </div>
      </div>

      <Separator className="bg-sidebar-border" />

      {/* Navigation */}
      <nav className="flex-1 p-2 space-y-1 overflow-y-auto">
        {menuItems.map((item) => {
          const isActive = location.pathname === item.path;
          const Icon = item.icon;
          const tasksBadgeCount = totalTasksCount;
          const emailBadgeCount = incomingEmailsCount;
          const notificationBadgeCount = unreadNotificationsCount;
          const showBadge = item.badge ? tasksBadgeCount > 0 : (item.emailBadge ? emailBadgeCount > 0 : (item.notificationBadge ? notificationBadgeCount > 0 : false));
          const badgeCount = item.badge ? tasksBadgeCount : (item.emailBadge ? emailBadgeCount : (item.notificationBadge ? notificationBadgeCount : 0));

          return (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 relative',
                isExpanded ? '' : 'justify-center',
                isActive
                  ? 'bg-sidebar-accent text-sidebar-foreground border-r-2 border-primary shadow-sm font-medium'
                  : 'text-sidebar-foreground hover:bg-sidebar-accent/50'
              )}
            >
              <div className="relative">
                <Icon className={cn('h-5 w-5 shrink-0', isActive && 'text-primary')} />
                {/* Badge on icon when collapsed */}
                {!isExpanded && showBadge && (
                  <span className="absolute -top-1.5 -left-1.5 bg-primary text-primary-foreground text-[10px] font-bold rounded-full min-w-[16px] h-4 flex items-center justify-center px-1">
                    {badgeCount > 99 ? '99+' : badgeCount}
                  </span>
                )}
              </div>
              <span className={cn(
                'flex-1 whitespace-nowrap transition-all duration-300',
                isExpanded ? 'opacity-100' : 'opacity-0 w-0 overflow-hidden'
              )}>
                {item.title}
              </span>
              {isExpanded && showBadge && (
                <Badge variant="default" className="bg-primary text-primary-foreground text-xs px-2">
                  {badgeCount}
                </Badge>
              )}
            </Link>
          );
        })}
      </nav>

      <Separator className="bg-sidebar-border" />

      {/* Footer */}
      <div className="p-2 space-y-2">
        {/* Theme Toggle */}
        <Button
          variant="ghost"
          onClick={toggleTheme}
          className={cn(
            'w-full gap-3 text-sidebar-foreground hover:bg-sidebar-accent',
            isExpanded ? 'justify-start' : 'justify-center'
          )}
        >
          {theme === 'dark' ? (
            <Sun className="h-5 w-5 shrink-0" />
          ) : (
            <Moon className="h-5 w-5 shrink-0" />
          )}
          <span className={cn(
            'whitespace-nowrap transition-all duration-300',
            isExpanded ? 'opacity-100' : 'opacity-0 w-0 overflow-hidden'
          )}>
            {theme === 'dark' ? 'מצב בהיר' : 'מצב כהה'}
          </span>
        </Button>

        {/* User Info - Clickable for Profile */}
        {profile && (
          <button
            onClick={() => setIsProfileModalOpen(true)}
            className={cn(
              'w-full flex items-center gap-3 p-2 rounded-lg bg-sidebar-accent/50 hover:bg-sidebar-accent transition-colors text-right',
              isExpanded ? '' : 'justify-center'
            )}
          >
            <Avatar className="h-9 w-9 border-2 border-primary/30 shrink-0">
              {profile.avatar_url && <AvatarImage src={profile.avatar_url} />}
              <AvatarFallback className="bg-primary text-primary-foreground text-sm">
                {getInitials(profile.full_name)}
              </AvatarFallback>
            </Avatar>
            <div className={cn(
              'flex-1 min-w-0 transition-all duration-300',
              isExpanded ? 'opacity-100' : 'opacity-0 w-0 overflow-hidden'
            )}>
              <p className="text-sidebar-foreground font-medium text-sm truncate">
                {profile.full_name || profile.email}
              </p>
              <p className="text-sidebar-muted text-xs truncate">{getRoleLabel(profile.role)}</p>
            </div>
          </button>
        )}

        {/* Logout Button */}
        <Button
          variant="ghost"
          onClick={signOut}
          className={cn(
            'w-full gap-3 text-sidebar-foreground hover:bg-destructive/20 hover:text-destructive',
            isExpanded ? 'justify-start' : 'justify-center'
          )}
        >
          <LogOut className="h-5 w-5 shrink-0" />
          <span className={cn(
            'whitespace-nowrap transition-all duration-300',
            isExpanded ? 'opacity-100' : 'opacity-0 w-0 overflow-hidden'
          )}>
            התנתקות
          </span>
        </Button>
      </div>

      {/* Profile Modal */}
      <ProfileModal 
        isOpen={isProfileModalOpen} 
        onClose={() => setIsProfileModalOpen(false)} 
      />
    </aside>
  );
}
