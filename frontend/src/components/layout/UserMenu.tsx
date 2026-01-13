import { useState } from "react";
import { LogOut, User, ChevronDown, UserCircle, Settings } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

type AppRole = "admin" | "designer" | "editor" | "publisher";

const roleLabels: Record<AppRole, string> = {
  admin: "מנהל",
  editor: "עורך",
  designer: "מעצב",
  publisher: "צוות הוצאה לאור",
};

const roleColors: Record<AppRole, string> = {
  admin: "from-neon-pink to-neon-purple",
  editor: "from-neon-blue to-neon-cyan",
  designer: "from-neon-purple to-neon-pink",
  publisher: "from-neon-cyan to-neon-blue",
};

export function UserMenu() {
  const navigate = useNavigate();
  const { user, role, signOut } = useAuth();
  const [open, setOpen] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    navigate("/auth");
  };

  const handleSwitchUser = () => {
    handleSignOut();
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
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <button className="flex items-center gap-3 p-2 rounded-xl hover:bg-sidebar-accent transition-all duration-200 w-full group">
          <Avatar className={`h-10 w-10 bg-gradient-to-br ${role ? roleColors[role] : "from-neon-pink to-neon-purple"}`}>
            <AvatarFallback className="bg-transparent text-white font-bold">
              {getInitials()}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 text-right min-w-0">
            <p className="text-sm font-medium text-sidebar-foreground truncate">
              {getUserDisplayName()}
            </p>
            {role && (
              <p className="text-xs text-sidebar-foreground/60">
                {roleLabels[role]}
              </p>
            )}
          </div>
          <ChevronDown className={`w-4 h-4 text-sidebar-foreground/60 transition-transform duration-200 ${open ? "rotate-180" : ""}`} />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent 
        align="end" 
        className="w-64 bg-card border-border shadow-xl shadow-black/20"
        sideOffset={8}
      >
        <DropdownMenuLabel className="text-right">
          <div className="flex items-center gap-3 py-2">
            <div className="flex-1 min-w-0">
              <p className="font-medium text-foreground truncate">
                {getUserDisplayName()}
              </p>
              <p className="text-xs text-muted-foreground truncate">
                {user?.email}
              </p>
            </div>
            <Avatar className={`h-10 w-10 bg-gradient-to-br ${role ? roleColors[role] : "from-neon-pink to-neon-purple"}`}>
              <AvatarFallback className="bg-transparent text-white font-bold">
                {getInitials()}
              </AvatarFallback>
            </Avatar>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem 
          onClick={() => navigate("/profile")}
          className="flex items-center gap-2 cursor-pointer text-right flex-row-reverse"
        >
          <Settings className="w-4 h-4" />
          <span>הגדרות פרופיל</span>
        </DropdownMenuItem>
        <DropdownMenuItem 
          onClick={handleSwitchUser}
          className="flex items-center gap-2 cursor-pointer text-right flex-row-reverse"
        >
          <UserCircle className="w-4 h-4" />
          <span>החלף משתמש</span>
        </DropdownMenuItem>
        <DropdownMenuItem 
          onClick={handleSignOut}
          className="flex items-center gap-2 cursor-pointer text-right flex-row-reverse text-destructive focus:text-destructive"
        >
          <LogOut className="w-4 h-4" />
          <span>התנתק</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
