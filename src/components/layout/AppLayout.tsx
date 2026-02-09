import { ReactNode, useState, useEffect } from 'react';
import { AppSidebar } from './AppSidebar';
import { MobileSidebar } from './MobileSidebar';
import { SearchModal } from '@/components/shared/SearchModal';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';
import { Search, Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { NotificationsDropdown } from '@/components/shared/NotificationsDropdown';

interface AppLayoutProps {
  children: ReactNode;
  title: string;
  subtitle?: string;
}

export function AppLayout({ children, title, subtitle }: AppLayoutProps) {
  const [searchOpen, setSearchOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Global keyboard shortcuts
  useKeyboardShortcuts([
    { key: 'k', ctrl: true, action: () => setSearchOpen(true) },
  ]);

  return (
    <div className="min-h-screen bg-transparent flex w-full" dir="rtl">
      {/* Desktop Sidebar */}
      <div className="hidden lg:block">
        <AppSidebar />
      </div>
      
      {/* Mobile Sidebar */}
      <MobileSidebar 
        open={mobileMenuOpen} 
        onOpenChange={setMobileMenuOpen} 
      />
      
      {/* Main Content */}
      <div className="flex-1 lg:mr-16 transition-all duration-300">
        {/* Header */}
        <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-md border-b border-border px-4 lg:px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {/* Mobile menu button */}
              <Button
                variant="ghost"
                size="icon"
                className="lg:hidden"
                onClick={() => setMobileMenuOpen(true)}
                aria-label="פתח תפריט"
              >
                <Menu className="h-5 w-5" />
              </Button>
              <div>
                <h1 className="text-xl lg:text-2xl font-bold text-foreground">{title}</h1>
                {subtitle && (
                  <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>
                )}
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              {/* Notifications */}
              <NotificationsDropdown />
              
              {/* Search button */}
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSearchOpen(true)}
                className="hidden sm:flex items-center gap-2 text-muted-foreground"
              >
                <Search className="h-4 w-4" />
                <span>חיפוש</span>
                <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100">
                  <span className="text-xs">⌘</span>K
                </kbd>
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setSearchOpen(true)}
                className="sm:hidden"
                aria-label="חיפוש"
              >
                <Search className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="p-4 lg:p-6 animate-fade-in">
          {children}
        </main>
      </div>

      {/* Global Search Modal */}
      <SearchModal open={searchOpen} onOpenChange={setSearchOpen} />
    </div>
  );
}
