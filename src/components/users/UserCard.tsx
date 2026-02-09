import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Mail, Shield, Key } from 'lucide-react';

interface UserProfile {
  id: string;
  full_name: string | null;
  email: string;
  role: string;
  avatar_url: string | null;
  created_at: string;
}

interface UserCardProps {
  user: UserProfile;
  onClick: () => void;
}

const roleConfig: Record<string, { label: string; color: string }> = {
  admin: { label: 'מנהל', color: 'bg-red-500/10 text-red-500 border-red-500/20' },
  editor: { label: 'עורך', color: 'bg-blue-500/10 text-blue-500 border-blue-500/20' },
  viewer: { label: 'צופה', color: 'bg-muted text-muted-foreground border-muted' },
};

// Generate consistent color from string hash
function getAvatarColor(name: string): string {
  const colors = [
    'bg-red-500',
    'bg-orange-500',
    'bg-amber-500',
    'bg-yellow-500',
    'bg-lime-500',
    'bg-green-500',
    'bg-emerald-500',
    'bg-teal-500',
    'bg-cyan-500',
    'bg-sky-500',
    'bg-blue-500',
    'bg-indigo-500',
    'bg-violet-500',
    'bg-purple-500',
    'bg-fuchsia-500',
    'bg-pink-500',
    'bg-rose-500',
  ];

  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    const char = name.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }

  return colors[Math.abs(hash) % colors.length];
}

function getInitials(name: string | null, email: string): string {
  if (name) {
    const parts = name.trim().split(' ');
    if (parts.length >= 2) {
      return parts[0][0] + parts[1][0];
    }
    return name.substring(0, 2);
  }
  return email.substring(0, 2).toUpperCase();
}

export function UserCard({ user, onClick }: UserCardProps) {
  const avatarColor = getAvatarColor(user.full_name || user.email);
  const initials = getInitials(user.full_name, user.email);
  const role = roleConfig[user.role] || roleConfig.viewer;

  return (
    <Card
      className="border-border/50 hover:border-primary/50 hover:shadow-lg transition-all cursor-pointer group"
      onClick={onClick}
    >
      <CardContent className="p-5">
        <div className="flex items-start gap-4">
          {/* Avatar */}
          <div
            className={`w-14 h-14 rounded-full ${avatarColor} flex items-center justify-center text-white font-bold text-lg shrink-0`}
          >
            {initials}
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2 mb-1">
              <h3 className="font-semibold text-foreground truncate">
                {user.full_name || 'ללא שם'}
              </h3>
              <Badge variant="outline" className={role.color}>
                <Shield className="h-3 w-3 ml-1" />
                {role.label}
              </Badge>
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Mail className="h-3 w-3" />
                <span className="truncate" dir="ltr">{user.email}</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Key className="h-3 w-3" />
                <span>גישה למערכת</span>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
