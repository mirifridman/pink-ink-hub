import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { FileText, Search, Download, Loader2, Filter } from 'lucide-react';
import { useAuditLogs, useAllProfiles, AuditLogFilters } from '@/hooks/useSettings';
import { format } from 'date-fns';
import { he } from 'date-fns/locale';

const actionColors: Record<string, string> = {
  create: 'bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20',
  update: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20',
  delete: 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20',
  login: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20',
  logout: 'bg-muted text-muted-foreground border-border',
};

export function AuditLogsTab() {
  const [filters, setFilters] = useState<AuditLogFilters>({});
  const { data: logs, isLoading } = useAuditLogs(filters);
  const { data: profiles } = useAllProfiles();

  const handleExportCSV = () => {
    if (!logs) return;

    const headers = ['תאריך', 'משתמש', 'פעולה', 'סוג', 'פרטים'];
    const rows = logs.map((log) => [
      format(new Date(log.created_at), 'dd/MM/yyyy HH:mm'),
      log.user_name || '',
      log.action,
      log.entity_type || '',
      JSON.stringify(log.details || {}),
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `audit-logs-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const getActionColor = (action: string) => {
    const lowerAction = action.toLowerCase();
    if (lowerAction.includes('create') || lowerAction.includes('add')) return actionColors.create;
    if (lowerAction.includes('update') || lowerAction.includes('edit')) return actionColors.update;
    if (lowerAction.includes('delete') || lowerAction.includes('remove')) return actionColors.delete;
    if (lowerAction.includes('login')) return actionColors.login;
    if (lowerAction.includes('logout')) return actionColors.logout;
    return 'bg-muted text-muted-foreground';
  };

  return (
    <div className="space-y-6">
      <Card className="border-border/50">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                לוג פעילות
              </CardTitle>
              <CardDescription>{logs?.length || 0} רשומות</CardDescription>
            </div>
            <Button variant="outline" onClick={handleExportCSV} disabled={!logs?.length}>
              <Download className="h-4 w-4 ml-2" />
              ייצא CSV
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="flex flex-wrap gap-4 mb-4 p-4 bg-muted/30 rounded-lg">
            <div className="space-y-1">
              <Label className="text-xs">מתאריך</Label>
              <Input
                type="date"
                value={filters.startDate || ''}
                onChange={(e) => setFilters({ ...filters, startDate: e.target.value || undefined })}
                className="w-40"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">עד תאריך</Label>
              <Input
                type="date"
                value={filters.endDate || ''}
                onChange={(e) => setFilters({ ...filters, endDate: e.target.value || undefined })}
                className="w-40"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">משתמש</Label>
              <Select
                value={filters.userId || 'all'}
                onValueChange={(value) =>
                  setFilters({ ...filters, userId: value === 'all' ? undefined : value })
                }
              >
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="כל המשתמשים" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">כל המשתמשים</SelectItem>
                  {profiles?.map((profile) => (
                    <SelectItem key={profile.id} value={profile.id}>
                      {profile.full_name || profile.email}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">פעולה</Label>
              <Input
                value={filters.action || ''}
                onChange={(e) => setFilters({ ...filters, action: e.target.value || undefined })}
                placeholder="חיפוש פעולה..."
                className="w-40"
              />
            </div>
            <div className="flex items-end">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setFilters({})}
              >
                נקה סינון
              </Button>
            </div>
          </div>

          {/* Table */}
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <div className="border rounded-lg max-h-[500px] overflow-auto">
              <Table>
                <TableHeader className="sticky top-0 bg-background">
                  <TableRow>
                    <TableHead className="w-40">תאריך</TableHead>
                    <TableHead>משתמש</TableHead>
                    <TableHead>פעולה</TableHead>
                    <TableHead>סוג</TableHead>
                    <TableHead>פרטים</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {logs?.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell className="text-sm">
                        {format(new Date(log.created_at), 'd/M/yy HH:mm', { locale: he })}
                      </TableCell>
                      <TableCell>{log.user_name}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={getActionColor(log.action)}>
                          {log.action}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {log.entity_type || '-'}
                      </TableCell>
                      <TableCell className="max-w-xs truncate text-xs text-muted-foreground">
                        {log.details ? JSON.stringify(log.details) : '-'}
                      </TableCell>
                    </TableRow>
                  ))}
                  {logs?.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                        לא נמצאו רשומות
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
