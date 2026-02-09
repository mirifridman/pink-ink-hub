import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Mail, Phone, Building2 } from 'lucide-react';
import { Employee } from '@/hooks/useEmployees';

interface EmployeeCardProps {
  employee: Employee;
  onClick: () => void;
}

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

function getInitials(name: string): string {
  const parts = name.trim().split(' ');
  if (parts.length >= 2) {
    return parts[0][0] + parts[1][0];
  }
  return name.substring(0, 2);
}

export function EmployeeCard({ employee, onClick }: EmployeeCardProps) {
  const avatarColor = getAvatarColor(employee.full_name);
  const initials = getInitials(employee.full_name);

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
                {employee.full_name}
              </h3>
              <Badge
                variant={employee.is_active ? 'default' : 'secondary'}
                className={employee.is_active ? 'bg-green-500/10 text-green-500 border-green-500/20' : 'bg-muted text-muted-foreground'}
              >
                {employee.is_active ? 'פעיל' : 'לא פעיל'}
              </Badge>
            </div>

            {employee.position && (
              <p className="text-sm text-muted-foreground mb-2">
                {employee.position}
              </p>
            )}

            <div className="space-y-1">
              {employee.email && (
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Mail className="h-3 w-3" />
                  <span className="truncate">{employee.email}</span>
                </div>
              )}
              {employee.phone && (
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Phone className="h-3 w-3" />
                  <span>{employee.phone}</span>
                </div>
              )}
              {employee.department && (
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Building2 className="h-3 w-3" />
                  <span>{employee.department}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
