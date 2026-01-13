import { useState, useCallback } from 'react';
import { sendEmail, queueEmail, EmailResponse } from '@/lib/emailService';
import {
  deadlineReminderTemplate,
  contentUploadedTemplate,
  newIssueTemplate,
  assignmentSentTemplate,
  generalReminderTemplate,
  testEmailTemplate,
  DeadlineReminderData,
  ContentUploadedData,
  NewIssueData,
  AssignmentSentData,
  GeneralReminderData
} from '@/lib/emailTemplates';
import { useToast } from '@/hooks/use-toast';

export function useEmail() {
  const [isSending, setIsSending] = useState(false);
  const { toast } = useToast();

  const handleSendResult = useCallback((result: EmailResponse, showToast = true) => {
    if (result.success) {
      if (showToast) {
        toast({
          title: 'המייל נשלח בהצלחה!',
          description: 'הנמען יקבל את ההודעה בקרוב',
        });
      }
      return true;
    } else {
      if (showToast) {
        toast({
          title: 'שגיאה בשליחת מייל',
          description: result.error || 'אירעה שגיאה, נסה שוב',
          variant: 'destructive',
        });
      }
      return false;
    }
  }, [toast]);

  // שליחת תזכורת דדליין
  const sendDeadlineReminder = useCallback(async (
    toEmail: string,
    data: DeadlineReminderData,
    showToast = true
  ): Promise<boolean> => {
    setIsSending(true);
    try {
      const html = deadlineReminderTemplate(data);
      const subject = data.daysLeft <= 1 
        ? `🚨 דחוף! ${data.issueName} - הדדליין היום!`
        : `⏰ תזכורת: ${data.issueName} - ${data.daysLeft} ימים לדדליין`;
      
      const result = await sendEmail(toEmail, subject, html);
      return handleSendResult(result, showToast);
    } finally {
      setIsSending(false);
    }
  }, [handleSendResult]);

  // שליחת אישור העלאת תוכן
  const sendContentUploadedConfirmation = useCallback(async (
    toEmail: string,
    data: ContentUploadedData,
    showToast = true
  ): Promise<boolean> => {
    setIsSending(true);
    try {
      const html = contentUploadedTemplate(data);
      const subject = `✅ התוכן שלך התקבל: ${data.contentTitle}`;
      
      const result = await sendEmail(toEmail, subject, html);
      return handleSendResult(result, showToast);
    } finally {
      setIsSending(false);
    }
  }, [handleSendResult]);

  // שליחת הודעה על גיליון חדש
  const sendNewIssueNotification = useCallback(async (
    toEmail: string,
    data: NewIssueData,
    showToast = true
  ): Promise<boolean> => {
    setIsSending(true);
    try {
      const html = newIssueTemplate(data);
      const subject = `🎉 גיליון חדש: ${data.issueName}`;
      
      const result = await sendEmail(toEmail, subject, html);
      return handleSendResult(result, showToast);
    } finally {
      setIsSending(false);
    }
  }, [handleSendResult]);

  // שליחת הקצאה לספק
  const sendAssignmentNotification = useCallback(async (
    toEmail: string,
    data: AssignmentSentData,
    showToast = true
  ): Promise<boolean> => {
    setIsSending(true);
    try {
      const html = assignmentSentTemplate(data);
      const subject = `📋 משימה חדשה: ${data.contentTitle}`;
      
      const result = await sendEmail(toEmail, subject, html);
      return handleSendResult(result, showToast);
    } finally {
      setIsSending(false);
    }
  }, [handleSendResult]);

  // שליחת תזכורת כללית
  const sendGeneralReminder = useCallback(async (
    toEmail: string,
    data: GeneralReminderData,
    showToast = true
  ): Promise<boolean> => {
    setIsSending(true);
    try {
      const html = generalReminderTemplate(data);
      const subject = `🔔 ${data.title}`;
      
      const result = await sendEmail(toEmail, subject, html);
      return handleSendResult(result, showToast);
    } finally {
      setIsSending(false);
    }
  }, [handleSendResult]);

  // שליחת מייל בדיקה
  const sendTestEmail = useCallback(async (
    toEmail: string,
    recipientName: string,
    showToast = true
  ): Promise<boolean> => {
    setIsSending(true);
    try {
      const html = testEmailTemplate(recipientName);
      const subject = '🧪 בדיקת מערכת מיילים - מגזין פרו';
      
      const result = await sendEmail(toEmail, subject, html);
      return handleSendResult(result, showToast);
    } finally {
      setIsSending(false);
    }
  }, [handleSendResult]);

  // הוספה לתור מיילים (לשליחה מתוזמנת)
  const queueDeadlineReminder = useCallback(async (
    toEmail: string,
    data: DeadlineReminderData
  ): Promise<boolean> => {
    const result = await queueEmail(
      toEmail,
      data.daysLeft <= 1 
        ? `🚨 דחוף! ${data.issueName} - הדדליין היום!`
        : `⏰ תזכורת: ${data.issueName} - ${data.daysLeft} ימים לדדליין`,
      'deadline_reminder',
      data
    );
    return result.success;
  }, []);

  return {
    isSending,
    sendDeadlineReminder,
    sendContentUploadedConfirmation,
    sendNewIssueNotification,
    sendAssignmentNotification,
    sendGeneralReminder,
    sendTestEmail,
    queueDeadlineReminder,
    // Raw functions for custom emails
    sendEmail,
    queueEmail
  };
}
