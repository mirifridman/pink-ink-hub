import { ReactNode } from "react";
import { GridMenu } from "./GridMenu";
import { DesktopSidebar } from "./DesktopSidebar";

interface AppLayoutProps {
  children: ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  return (
    <div className="min-h-screen bg-background">
      {/* Mobile Grid Menu */}
      <GridMenu />
      
      {/* Desktop Sidebar */}
      <DesktopSidebar />
      
      {/* Main Content - with margin for desktop sidebar */}
      <main className="min-h-screen p-3 md:p-6 lg:p-8 pt-[70px] md:pt-20 lg:pt-8 lg:mr-20">
        {children}
      </main>
    </div>
  );
}
