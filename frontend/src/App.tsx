import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";

import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import Issues from "./pages/Issues";
import Lineup from "./pages/Lineup";
import Suppliers from "./pages/Suppliers";
import Team from "./pages/Team";
import Reminders from "./pages/Reminders";
import Schedule from "./pages/Schedule";
import Messages from "./pages/Messages";
import Settings from "./pages/Settings";
import Users from "./pages/Users";
import Permissions from "./pages/Permissions";
import NotFound from "./pages/NotFound";
import MagicLink from "./pages/MagicLink";
import Profile from "./pages/Profile";
import EmailAnalytics from "./pages/EmailAnalytics";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/auth" element={<Auth />} />
            <Route path="/magic" element={<MagicLink />} />
            <Route path="/" element={<Dashboard />} />
            <Route path="/issues" element={<Issues />} />
            <Route path="/lineup" element={<Lineup />} />
            <Route path="/suppliers" element={<Suppliers />} />
            <Route path="/team" element={<Team />} />
            <Route path="/reminders" element={<Reminders />} />
            <Route path="/schedule" element={<Schedule />} />
            <Route path="/messages" element={<Messages />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/users" element={<Users />} />
            <Route path="/permissions" element={<Permissions />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/emails" element={<EmailAnalytics />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
