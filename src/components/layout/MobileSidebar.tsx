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
  X,
  Mail,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { cn } from '@/lib/utils';
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

const menuItems = [
  { title: 'סקירה כללית', path: '/', icon: LayoutDashboard },
  { title: 'משימות', path: '/tasks', icon: CheckSquare, badge: true },
  { title: 'מרכז דואר', path: '/email-center', icon: Mail },
  { title: 'פרויקטים', path: '/projects', icon: FolderKanban },
  { title: 'נהלים', path: '/procedures', icon: FileText },
  { title: 'החלטות', path: '/decisions', icon: Gavel },
  { title: 'צוות', path: '/team', icon: Users },
  { title: 'הגדרות', path: '/settings', icon: Settings },
];

interface MobileSidebarProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function MobileSidebar({ open, onOpenChange }: MobileSidebarProps) {
  const location = useLocation();
  const { profile, signOut } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [totalTasksCount, setTotalTasksCount] = useState(0);
  const [incomingEmailsCount, setIncomingEmailsCount] = useState(0);

  useEffect(() => {
    const fetchCounts = async () => {
      // Fetch total tasks count
      const { count: tasksCount } = await supabase
        .from('tasks')
        .select('*', { count: 'exact', head: true });
      
      // Fetch unprocessed incoming emails count
      const { count: emailsCount } = await supabase
        .from('incoming_emails')
        .select('*', { count: 'exact', head: true })
        .eq('is_processed', false);
      
      setTotalTasksCount(tasksCount || 0);
      setIncomingEmailsCount(emailsCount || 0);
    };

    fetchCounts();

    // Subscribe to task changes
    const tasksChannel = supabase
      .channel('mobile-tasks-count')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tasks' }, () => {
        fetchCounts();
      })
      .subscribe();

    // Subscribe to email changes
    const emailsChannel = supabase
      .channel('mobile-emails-count')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'incoming_emails' }, () => {
        fetchCounts();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(tasksChannel);
      supabase.removeChannel(emailsChannel);
    };
  }, []);

  const getInitials = (name: string | null) => {
    if (!name) return '?';
    return name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const getRoleLabel = (role: string | null) => {
    const roles: Record<string, string> = {
      admin: 'מנהל מערכת',
      editor: 'עורך',
      viewer: 'צופה',
    };
    return roles[role || 'viewer'] || 'צופה';
  };

  const handleNavigation = () => {
    onOpenChange(false);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-[280px] p-0 bg-sidebar">
        <SheetHeader className="p-4 border-b border-sidebar-border">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg gradient-primary flex items-center justify-center">
                <span className="text-primary-foreground font-bold text-lg">מ</span>
              </div>
              <div>
                <SheetTitle className="text-sidebar-foreground font-bold text-lg text-right">מטה מנכ״ל</SheetTitle>
                <p className="text-sidebar-muted text-xs">ניהול משימות ופרויקטים</p>
              </div>
            </div>
          </div>
        </SheetHeader>

        <nav className="flex-1 p-3 space-y-1">
          {menuItems.map((item) => {
            const isActive = location.pathname === item.path;
            const Icon = item.icon;

            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={handleNavigation}
                className={cn(
                  'flex items-center gap-3 px-3 py-3 rounded-lg transition-all duration-200',
                  isActive
                    ? 'bg-sidebar-accent text-primary border-r-2 border-primary'
                    : 'text-sidebar-foreground hover:bg-sidebar-accent/50'
                )}
              >
                <Icon className={cn('h-5 w-5', isActive && 'text-primary')} />
                <span className="flex-1">{item.title}</span>
                {item.badge && (totalTasksCount + incomingEmailsCount) > 0 && (
                  <Badge variant="default" className="bg-primary text-primary-foreground text-xs px-2">
                    {totalTasksCount + incomingEmailsCount}
                  </Badge>
                )}
              </Link>
            );
          })}
        </nav>

        <Separator className="bg-sidebar-border" />

        <div className="p-3 space-y-3">
          <Button
            variant="ghost"
            onClick={toggleTheme}
            className="w-full justify-start gap-3 text-sidebar-foreground hover:bg-sidebar-accent"
          >
            {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            <span>{theme === 'dark' ? 'מצב בהיר' : 'מצב כהה'}</span>
          </Button>

          {profile && (
            <div className="flex items-center gap-3 p-2 rounded-lg bg-sidebar-accent/50">
              <Avatar className="h-9 w-9 border-2 border-primary/30">
                {profile.avatar_url && <AvatarImage src={profile.avatar_url} />}
                <AvatarFallback className="bg-primary text-primary-foreground text-sm">
                  {getInitials(profile.full_name)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-sidebar-foreground font-medium text-sm truncate">
                  {profile.full_name || profile.email}
                </p>
                <p className="text-sidebar-muted text-xs truncate">{getRoleLabel(profile.role)}</p>
              </div>
            </div>
          )}

          <Button
            variant="ghost"
            onClick={signOut}
            className="w-full justify-start gap-3 text-sidebar-foreground hover:bg-destructive/20 hover:text-destructive"
          >
            <LogOut className="h-5 w-5" />
            <span>התנתקות</span>
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
