import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Send, Check, AlertTriangle, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useCreateReminder } from "@/hooks/useReminders";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { he } from "date-fns/locale";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface AssignmentButtonProps {
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
  assignmentSent?: boolean;
  assignmentSentDate?: string | null;
}

export function AssignmentButton({
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
  assignmentSent = false,
  assignmentSentDate = null,
}: AssignmentButtonProps) {
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const createReminder = useCreateReminder();
  const [isLoading, setIsLoading] = useState(false);

  const pages = pageStart === pageEnd ? String(pageStart) : `${pageStart}-${pageEnd}`;
  const deadline = format(new Date(designStartDate), "dd/MM/yyyy", { locale: he });

  // Check if supplier has contact info
  const hasContactInfo = !!supplierPhone;

  const generateAssignmentMessage = () => {
    return `שלום ${supplierName},
${editorName} הקצתה לך מקום בגיליון הבא!

📋 תוכן: ${content}
📖 מגזין: ${magazineName}
📑 גיליון: #${issueNumber} - ${issueTheme}
📐 עמודים: ${pages}
📅 מועד אחרון להגשה: ${deadline}

נשמח לקבל ממך את החומר בזמן 😊`;
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

    const cleanPhone = supplierPhone.replace(/\D/g, '');
    const encodedMessage = encodeURIComponent(message);
    const url = `https://wa.me/${cleanPhone}?text=${encodedMessage}`;
    window.open(url, '_blank');
  };

  const updateLineupMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("lineup_items")
        .update({
          assignment_sent: true,
          assignment_sent_date: new Date().toISOString(),
          assignment_sent_by: user?.id,
        })
        .eq("id", lineupItemId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["lineup_items"] });
    },
  });

  const handleSendAssignment = async () => {
    if (!supplierId) return;

    // Check if already sent
    if (assignmentSent) {
      toast({
        title: "ההקצאה כבר נשלחה",
        description: assignmentSentDate 
          ? `נשלחה ב-${format(new Date(assignmentSentDate), "dd/MM/yyyy", { locale: he })}`
          : "ההקצאה כבר נשלחה לספק",
      });
      return;
    }

    // Check for contact info
    if (!hasContactInfo) {
      toast({
        title: "לא ניתן לשלוח הקצאה",
        description: "חסרים פרטי קשר - אין מספר טלפון/ווטסאפ",
        variant: "destructive",
        duration: 5000,
      });
      return;
    }

    setIsLoading(true);

    try {
      const message = generateAssignmentMessage();

      // 1. Update lineup item as sent
      await updateLineupMutation.mutateAsync();

      // 2. Create reminder record
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

      // 3. Open WhatsApp
      openWhatsApp(message);

      toast({
        title: "ההקצאה נשלחה בהצלחה! ✅",
        description: `נשלחה ל-${supplierName} בווטסאפ`,
      });
    } catch (error) {
      console.error("Error sending assignment:", error);
      toast({
        title: "שגיאה",
        description: "אירעה שגיאה בשליחת ההקצאה",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!supplierId) {
    return null;
  }

  // Already sent state
  if (assignmentSent) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              disabled
              className="opacity-70 gap-1.5 text-emerald-600"
            >
              <Check className="w-4 h-4" />
              הוקצה
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            {assignmentSentDate 
              ? `הקצאה נשלחה ב-${format(new Date(assignmentSentDate), "dd/MM/yyyy HH:mm", { locale: he })}`
              : "הקצאה נשלחה"}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  // No contact info state
  if (!hasContactInfo) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleSendAssignment}
              className="gap-1.5 text-orange-500 hover:text-orange-600 hover:bg-orange-500/10"
            >
              <AlertTriangle className="w-4 h-4" />
              הקצאה
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>חסרים פרטי קשר לספק</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  // Active button state
  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={handleSendAssignment}
      disabled={isLoading}
      className={cn(
        "gap-1.5 text-accent hover:text-accent hover:bg-accent/10",
        isLoading && "opacity-70"
      )}
    >
      {isLoading ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : (
        <Send className="w-4 h-4" />
      )}
      הקצאה
    </Button>
  );
}
