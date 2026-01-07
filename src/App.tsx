import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { ProtectedRoute } from "@/components/layout/ProtectedRoute";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import Issues from "./pages/Issues";
import Lineup from "./pages/Lineup";
import Suppliers from "./pages/Suppliers";
import Reminders from "./pages/Reminders";
import Schedule from "./pages/Schedule";
import Messages from "./pages/Messages";
import Settings from "./pages/Settings";
import NotFound from "./pages/NotFound";

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
            <Route path="/" element={
              <ProtectedRoute allowedRoles={["admin", "editor", "designer"]}>
                <Dashboard />
              </ProtectedRoute>
            } />
            <Route path="/issues" element={
              <ProtectedRoute allowedRoles={["admin", "editor", "designer"]}>
                <Issues />
              </ProtectedRoute>
            } />
            <Route path="/lineup" element={
              <ProtectedRoute allowedRoles={["admin", "editor", "designer"]}>
                <Lineup />
              </ProtectedRoute>
            } />
            <Route path="/suppliers" element={
              <ProtectedRoute allowedRoles={["admin", "editor", "designer", "publisher"]}>
                <Suppliers />
              </ProtectedRoute>
            } />
            <Route path="/reminders" element={
              <ProtectedRoute allowedRoles={["admin", "editor"]}>
                <Reminders />
              </ProtectedRoute>
            } />
            <Route path="/schedule" element={
              <ProtectedRoute allowedRoles={["admin", "editor", "designer", "publisher"]}>
                <Schedule />
              </ProtectedRoute>
            } />
            <Route path="/messages" element={
              <ProtectedRoute allowedRoles={["admin", "editor", "publisher"]}>
                <Messages />
              </ProtectedRoute>
            } />
            <Route path="/settings" element={
              <ProtectedRoute allowedRoles={["admin"]}>
                <Settings />
              </ProtectedRoute>
            } />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
