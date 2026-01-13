import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Send, Bell, MoreHorizontal, Check, Mail, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useCreateReminder, useLineupItemReminders } from "@/hooks/useReminders";
import { useEmail } from "@/hooks/useEmail";
import { format } from "date-fns";
import { he } from "date-fns/locale";

interface LineupRowActionsProps {
  lineupItemId: string;
  supplierId: string | null;
  supplierName: string | null;
  supplierPhone: string | null;
  supplierEmail?: string | null;
  content: string;
  pageStart: number;
  pageEnd: number;
  magazineName: string;
  issueNumber: number;
  issueTheme: string;
  issueId: string;
  designStartDate: string;
  editorName?: string;
}

export function LineupRowActions({
  lineupItemId,
  supplierId,
  supplierName,
  supplierPhone,
  supplierEmail,
  content,
  pageStart,
  pageEnd,
  magazineName,
  issueNumber,
  issueTheme,
  issueId,
  designStartDate,
  editorName = "העורך",
}: LineupRowActionsProps) {
  const { toast } = useToast();
  const { user } = useAuth();
  const createReminder = useCreateReminder();
  const { data: existingReminders } = useLineupItemReminders(lineupItemId);
  const { sendAssignmentNotification, sendDeadlineReminder, isSending } = useEmail();
  
  const hasAssignmentSent = existingReminders?.some(r => r.type === 'assignment' && r.status === 'sent');
  const hasReminderSent = existingReminders?.some(r => r.type !== 'assignment' && r.status === 'sent');
  
  const pages = pageStart === pageEnd ? String(pageStart) : `${pageStart}-${pageEnd}`;
  const deadline = format(new Date(designStartDate), "dd/MM/yyyy", { locale: he });

  const handleSendAssignmentEmail = async () => {
    if (!supplierId || !supplierEmail) {
      toast({
        title: "אין כתובת אימייל",
        description: "לא הוזנה כתובת אימייל לספק זה",
        variant: "destructive",
      });
      return;
    }

    try {
      // Send email
      const success = await sendAssignmentNotification(
        supplierEmail,
        {
          supplierName: supplierName || 'ספק',
          editorName: editorName,
          issueName: `${magazineName} גיליון #${issueNumber} - ${issueTheme}`,
          contentTitle: content,
          pages: pages,
          deadline: designStartDate,
          notes: undefined,
        },
        false // Don't show default toast, we'll handle it
      );

      if (success) {
        // Create reminder record
        await createReminder.mutateAsync({
          lineup_item_id: lineupItemId,
          insert_id: null,
          supplier_id: supplierId,
          issue_id: issueId,
          type: 'assignment',
          message: `הקצאה נשלחה במייל ל${supplierEmail}`,
          scheduled_for: new Date().toISOString(),
          status: 'sent',
          sent_at: new Date().toISOString(),
          sent_by: user?.id || null,
        });

        toast({
          title: "✅ הקצאה נשלחה במייל",
          description: `הקצאה נשלחה ל${supplierName} (${supplierEmail})`,
        });
      }
    } catch (error) {
      console.error("Error sending assignment email:", error);
      toast({
        title: "שגיאה",
        description: "לא ניתן לשלוח את המייל",
        variant: "destructive",
      });
    }
  };

  const handleSendReminderEmail = async () => {
    if (!supplierId || !supplierEmail) {
      toast({
        title: "אין כתובת אימייל",
        description: "לא הוזנה כתובת אימייל לספק זה",
        variant: "destructive",
      });
      return;
    }

    // Calculate days left
    const today = new Date();
    const deadlineDate = new Date(designStartDate);
    const daysLeft = Math.ceil((deadlineDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

    try {
      // Send email
      const success = await sendDeadlineReminder(
        supplierEmail,
        {
          editorName: supplierName || 'ספק',
          issueName: `${magazineName} גיליון #${issueNumber} - ${issueTheme}`,
          contentItems: [{ title: content, pages: pages }],
          deadline: designStartDate,
          daysLeft: daysLeft,
        },
        false // Don't show default toast
      );

      if (success) {
        // Create reminder record
        await createReminder.mutateAsync({
          lineup_item_id: lineupItemId,
          insert_id: null,
          supplier_id: supplierId,
          issue_id: issueId,
          type: 'custom',
          message: `תזכורת נשלחה במייל ל${supplierEmail}`,
          scheduled_for: new Date().toISOString(),
          status: 'sent',
          sent_at: new Date().toISOString(),
          sent_by: user?.id || null,
        });

        toast({
          title: "✅ תזכורת נשלחה במייל",
          description: `תזכורת נשלחה ל${supplierName} (${supplierEmail})`,
        });
      }
    } catch (error) {
      console.error("Error sending reminder email:", error);
      toast({
        title: "שגיאה",
        description: "לא ניתן לשלוח את המייל",
        variant: "destructive",
      });
    }
  };

  if (!supplierId) {
    return null;
  }

  const hasEmail = !!supplierEmail;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
          {isSending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <MoreHorizontal className="h-4 w-4" />
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-52">
        <DropdownMenuItem
          onClick={handleSendAssignmentEmail}
          className="cursor-pointer"
          disabled={!hasEmail || isSending}
        >
          <Mail className={cn(
            "w-4 h-4 ml-2",
            hasAssignmentSent ? "text-emerald-500" : "text-muted-foreground"
          )} />
          <span className="flex-1">שלח הקצאה במייל</span>
          {hasAssignmentSent && <Check className="w-3 h-3 mr-1 text-emerald-500" />}
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={handleSendReminderEmail}
          className="cursor-pointer"
          disabled={!hasEmail || isSending}
        >
          <Bell className={cn(
            "w-4 h-4 ml-2",
            hasReminderSent ? "text-orange-500" : "text-muted-foreground"
          )} />
          <span className="flex-1">שלח תזכורת במייל</span>
          {hasReminderSent && <Check className="w-3 h-3 mr-1 text-orange-500" />}
        </DropdownMenuItem>
        
        {!hasEmail && (
          <>
            <DropdownMenuSeparator />
            <div className="px-2 py-1.5 text-xs text-muted-foreground">
              ⚠️ לספק זה אין אימייל מוגדר
            </div>
          </>
        )}
        
        {hasEmail && (
          <>
            <DropdownMenuSeparator />
            <div className="px-2 py-1.5 text-xs text-muted-foreground truncate">
              📧 {supplierEmail}
            </div>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
