import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import {
  Settings as SettingsIcon,
  Users,
  Shield,
  Bell,
  Plug,
  Lock,
  FileText,
  Database,
  Loader2,
} from 'lucide-react';

// Tab Components
import { GeneralSettingsTab } from '@/components/settings/GeneralSettingsTab';
import { UsersSettingsTab } from '@/components/settings/UsersSettingsTab';
import { PermissionsSettingsTab } from '@/components/settings/PermissionsSettingsTab';
import { NotificationsSettingsTab } from '@/components/settings/NotificationsSettingsTab';
import { IntegrationsSettingsTab } from '@/components/settings/IntegrationsSettingsTab';
import { SecuritySettingsTab } from '@/components/settings/SecuritySettingsTab';
import { AuditLogsTab } from '@/components/settings/AuditLogsTab';
import { BackupsSettingsTab } from '@/components/settings/BackupsSettingsTab';

const tabs = [
  { id: 'general', label: 'כללי', icon: SettingsIcon },
  { id: 'users', label: 'משתמשים', icon: Users },
  { id: 'permissions', label: 'הרשאות', icon: Shield },
  { id: 'notifications', label: 'התראות', icon: Bell },
  { id: 'integrations', label: 'אינטגרציות', icon: Plug },
  { id: 'security', label: 'אבטחה', icon: Lock },
  { id: 'logs', label: 'לוגים', icon: FileText },
  { id: 'backups', label: 'גיבויים', icon: Database },
];

export default function Settings() {
  const { profile, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('general');

  // Check admin access - consider 'admin' role
  const isAdmin = profile?.role === 'admin';

  // Redirect non-admins after loading is complete
  useEffect(() => {
    // Only redirect if we're done loading AND have a profile AND it's not admin
    if (!authLoading && profile && !isAdmin) {
      navigate('/');
    }
  }, [profile, authLoading, navigate, isAdmin]);

  // Show loading while auth is being checked
  if (authLoading) {
    return (
      <AppLayout title="הגדרות">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </AppLayout>
    );
  }

  // If still loading profile or no profile yet, show loading
  if (!profile) {
    return (
      <AppLayout title="הגדרות">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </AppLayout>
    );
  }

  // Show nothing while redirecting non-admins
  if (!isAdmin) {
    return null;
  }

  const renderTabContent = () => {
    switch (activeTab) {
      case 'general':
        return <GeneralSettingsTab />;
      case 'users':
        return <UsersSettingsTab />;
      case 'permissions':
        return <PermissionsSettingsTab />;
      case 'notifications':
        return <NotificationsSettingsTab />;
      case 'integrations':
        return <IntegrationsSettingsTab />;
      case 'security':
        return <SecuritySettingsTab />;
      case 'logs':
        return <AuditLogsTab />;
      case 'backups':
        return <BackupsSettingsTab />;
      default:
        return <GeneralSettingsTab />;
    }
  };

  return (
    <AppLayout title="הגדרות מערכת" subtitle="ניהול והגדרות כלליות">
      <div className="flex flex-col lg:flex-row gap-4 lg:gap-6">
        {/* Mobile Tab Selector */}
        <div className="lg:hidden">
          <select
            value={activeTab}
            onChange={(e) => setActiveTab(e.target.value)}
            className="w-full p-3 rounded-lg border border-border bg-background text-foreground"
          >
            {tabs.map((tab) => (
              <option key={tab.id} value={tab.id}>
                {tab.label}
              </option>
            ))}
          </select>
        </div>

        {/* Desktop Sidebar */}
        <Card className="hidden lg:block w-64 shrink-0 border-border/50 h-fit sticky top-4">
          <CardContent className="p-2">
            <nav className="space-y-1">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <Button
                    key={tab.id}
                    variant={activeTab === tab.id ? 'secondary' : 'ghost'}
                    className={cn(
                      'w-full justify-start gap-3',
                      activeTab === tab.id && 'bg-primary/10 text-primary'
                    )}
                    onClick={() => setActiveTab(tab.id)}
                  >
                    <Icon className="h-4 w-4" />
                    {tab.label}
                  </Button>
                );
              })}
            </nav>
          </CardContent>
        </Card>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {renderTabContent()}
        </div>
      </div>
    </AppLayout>
  );
}
