import { ReactNode, useState } from "react";
import { AppSidebar } from "./AppSidebar";
import { Menu, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

interface AppLayoutProps {
  children: ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      {/* Desktop Sidebar */}
      <div className="hidden md:block">
        <AppSidebar />
      </div>

      {/* Mobile Header */}
      <header className="md:hidden fixed top-0 right-0 left-0 h-14 bg-sidebar border-b border-sidebar-border flex items-center justify-between px-4 z-40">
        {/* Logo */}
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg gradient-neon flex items-center justify-center animate-pulse-neon">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <div>
            <h1 className="font-rubik font-bold text-sm text-white leading-tight">מגזין פרו</h1>
            <p className="text-[10px] text-sidebar-foreground/60 leading-tight">ניהול הפקה</p>
          </div>
        </div>

        {/* Menu Button */}
        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="text-white hover:bg-sidebar-accent">
              <Menu className="w-5 h-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="p-0 w-64 bg-sidebar border-l border-sidebar-border">
            <AppSidebar onNavigate={() => setMobileOpen(false)} />
          </SheetContent>
        </Sheet>
      </header>

      {/* Main Content */}
      <main className="md:mr-64 min-h-screen p-4 md:p-8 pt-18 md:pt-8">
        {children}
      </main>
    </div>
  );
}
