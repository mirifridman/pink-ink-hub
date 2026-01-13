import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Send, Bell, MoreHorizontal, Check, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useCreateReminder, useLineupItemReminders } from "@/hooks/useReminders";
import { format } from "date-fns";
import { he } from "date-fns/locale";

interface LineupRowActionsProps {
  lineupItemId: string;
  supplierId: string | null;
  supplierName: string | null;
  supplierPhone: string | null;
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
  
  const hasAssignmentSent = existingReminders?.some(r => r.type === 'assignment' && r.status === 'sent');
  const hasReminderSent = existingReminders?.some(r => r.type !== 'assignment' && r.status === 'sent');
  
  const pages = pageStart === pageEnd ? String(pageStart) : `${pageStart}-${pageEnd}`;
  const deadline = format(new Date(designStartDate), "dd/MM/yyyy", { locale: he });

  const generateAssignmentMessage = () => {
    return `שלום ${supplierName},

הוקצאה לך משימת כתיבה:
📖 מגזין: ${magazineName}
📑 גיליון: #${issueNumber} - ${issueTheme}
📄 מדור: ${content}
📐 עמודים: ${pages}
📅 יש להגיש עד: ${deadline}

בברכה,
${editorName}`;
  };

  const generateReminderMessage = () => {
    return `שלום ${supplierName},

תזכורת לגבי משימת הכתיבה שלך:
📄 מדור: ${content}
📅 יש להגיש עד: ${deadline}

בברכה,
${editorName}`;
  };

  const openWhatsApp = (message: string) => {
    if (!supplierPhone) {
      toast({
        title: "אין מספר טלפון",
        description: "לא הוזן מספר טלפון לספק זה",
        variant: "destructive",
      });
      return;
    }

    // Clean phone number
    const cleanPhone = supplierPhone.replace(/\D/g, '');
    const encodedMessage = encodeURIComponent(message);
    const url = `https://wa.me/${cleanPhone}?text=${encodedMessage}`;
    window.open(url, '_blank');
  };

  const handleSendAssignment = async () => {
    if (!supplierId) return;

    const message = generateAssignmentMessage();
    
    // Create reminder record
    try {
      await createReminder.mutateAsync({
        lineup_item_id: lineupItemId,
        insert_id: null,
        supplier_id: supplierId,
        issue_id: issueId,
        type: 'assignment',
        message,
        scheduled_for: new Date().toISOString(),
        status: 'sent',
        sent_at: new Date().toISOString(),
        sent_by: user?.id || null,
      });

      openWhatsApp(message);

      toast({
        title: "הקצאה נשלחה",
        description: `הקצאה נשלחה ל${supplierName}`,
      });
    } catch (error) {
      console.error("Error creating reminder:", error);
      toast({
        title: "שגיאה",
        description: "לא ניתן לשמור את התזכורת",
        variant: "destructive",
      });
    }
  };

  const handleSendReminder = async () => {
    if (!supplierId) return;

    const message = generateReminderMessage();
    
    try {
      await createReminder.mutateAsync({
        lineup_item_id: lineupItemId,
        insert_id: null,
        supplier_id: supplierId,
        issue_id: issueId,
        type: 'custom',
        message,
        scheduled_for: new Date().toISOString(),
        status: 'sent',
        sent_at: new Date().toISOString(),
        sent_by: user?.id || null,
      });

      openWhatsApp(message);

      toast({
        title: "תזכורת נשלחה",
        description: `תזכורת נשלחה ל${supplierName}`,
      });
    } catch (error) {
      console.error("Error creating reminder:", error);
      toast({
        title: "שגיאה",
        description: "לא ניתן לשמור את התזכורת",
        variant: "destructive",
      });
    }
  };

  if (!supplierId) {
    return null;
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuItem
          onClick={handleSendAssignment}
          className="cursor-pointer"
        >
          <Send className={cn(
            "w-4 h-4 ml-2",
            hasAssignmentSent ? "text-emerald-500" : "text-muted-foreground"
          )} />
          שלח הקצאה לספק
          {hasAssignmentSent && <Check className="w-3 h-3 mr-auto text-emerald-500" />}
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={handleSendReminder}
          className="cursor-pointer"
        >
          <Bell className={cn(
            "w-4 h-4 ml-2",
            hasReminderSent ? "text-orange-500" : "text-muted-foreground"
          )} />
          שלח תזכורת
          {hasReminderSent && <Check className="w-3 h-3 mr-auto text-orange-500" />}
        </DropdownMenuItem>
        {supplierPhone && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => openWhatsApp('')}
              className="cursor-pointer"
            >
              <ExternalLink className="w-4 h-4 ml-2 text-muted-foreground" />
              פתח ווטסאפ
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
