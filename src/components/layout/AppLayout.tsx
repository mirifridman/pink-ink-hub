import { ReactNode } from "react";
import { GridMenu } from "./GridMenu";

interface AppLayoutProps {
  children: ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  return (
    <div className="min-h-screen bg-background">
      <GridMenu />
      
      {/* Main Content */}
      <main className="min-h-screen p-4 md:p-8 pt-20">
        {children}
      </main>
    </div>
  );
}
