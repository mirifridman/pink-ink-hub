import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Wand2 } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { EmailInboxColumn, EmailCategory } from '@/components/emails/EmailInboxColumn';
import { EmailContentColumn } from '@/components/emails/EmailContentColumn';
import { EmailAIActionColumn } from '@/components/emails/EmailAIActionColumn';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { 
  useEmails, 
  useOutboxEmails,
  useEmailCounts, 
  useUpdateEmailStatus, 
  useDeleteEmail,
  useGenerateTaskFromEmail,
  useMarkEmailAsRead,
  Email
} from '@/hooks/useEmails';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface LinkedTask {
  id: string;
  title: string;
  status: string;
  priority: string;
}

export default function EmailCenter() {
  const [searchParams] = useSearchParams();
  const [activeCategory, setActiveCategory] = useState<EmailCategory>('inbox');
  const [selectedEmail, setSelectedEmail] = useState<Email | null>(null);
  const [emailToDelete, setEmailToDelete] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [linkedTasks, setLinkedTasks] = useState<LinkedTask[]>([]);
  const [mobileAIOpen, setMobileAIOpen] = useState(false);
  const [aiCreatedTaskId, setAiCreatedTaskId] = useState<string | null>(null);
  const [emailsWithTasks, setEmailsWithTasks] = useState<Set<string>>(new Set());
  const { toast } = useToast();

  const { data: inboxEmails = [], isLoading: isLoadingInbox } = useEmails(activeCategory !== 'outbox' ? activeCategory : undefined, searchQuery);
  const { data: outboxEmails = [], isLoading: isLoadingOutbox } = useOutboxEmails(activeCategory === 'outbox' ? searchQuery : undefined);
  const { data: counts = { inbox: 0, outbox: 0, archived: 0 } } = useEmailCounts();
  const updateStatus = useUpdateEmailStatus();
  const deleteEmail = useDeleteEmail();
  const generateTask = useGenerateTaskFromEmail();
  const markAsRead = useMarkEmailAsRead();

  // Determine which emails to show based on category
  const emails = activeCategory === 'outbox' ? outboxEmails : inboxEmails;
  const isLoading = activeCategory === 'outbox' ? isLoadingOutbox : isLoadingInbox;

  // Handle URL param for direct email selection
  useEffect(() => {
    const emailId = searchParams.get('email');
    if (emailId && emails.length > 0) {
      const foundEmail = emails.find(e => e.id === emailId);
      if (foundEmail) {
        setSelectedEmail(foundEmail);
      }
    }
  }, [searchParams, emails]);

  // Fetch linked tasks function (extracted for reuse)
  const fetchLinkedTasks = async () => {
    if (!selectedEmail) {
      setLinkedTasks([]);
      return;
    }

    const allTasks: LinkedTask[] = [];
    const seenIds = new Set<string>();

    // 1. Fetch tasks where source_reference matches email id (internal UUID)
    const { data: sourceRefTasks } = await supabase
      .from('tasks')
      .select('id, title, status, priority')
      .eq('source_reference', selectedEmail.id);

    if (sourceRefTasks) {
      for (const task of sourceRefTasks) {
        if (!seenIds.has(task.id)) {
          allTasks.push(task as LinkedTask);
          seenIds.add(task.id);
        }
      }
    }

    // 2. Fetch tasks where source_reference matches external_id (from n8n/external systems)
    if (selectedEmail.external_id) {
      const { data: externalIdTasks } = await supabase
        .from('tasks')
        .select('id, title, status, priority')
        .eq('source_reference', selectedEmail.external_id);

      if (externalIdTasks) {
        for (const task of externalIdTasks) {
          if (!seenIds.has(task.id)) {
            allTasks.push(task as LinkedTask);
            seenIds.add(task.id);
          }
        }
      }
    }

    // 3. Fetch task by created_task_id if exists
    if (selectedEmail.created_task_id && !seenIds.has(selectedEmail.created_task_id)) {
      const { data: createdTask } = await supabase
        .from('tasks')
        .select('id, title, status, priority')
        .eq('id', selectedEmail.created_task_id)
        .single();
      
      if (createdTask) {
        allTasks.unshift(createdTask as LinkedTask); // Add at beginning
        seenIds.add(createdTask.id);
      }
    }

    setLinkedTasks(allTasks);
  };

  // Fetch linked tasks when email changes
  useEffect(() => {
    fetchLinkedTasks();
  }, [selectedEmail?.id, selectedEmail?.external_id, selectedEmail?.created_task_id]);

  // Fetch emails with tasks for visual indicators
  useEffect(() => {
    const fetchEmailsWithTasksSet = async () => {
      if (emails.length === 0) {
        setEmailsWithTasks(new Set());
        return;
      }

      const emailIds = emails.map(e => e.id);
      const externalIds = emails.map(e => e.external_id).filter(Boolean) as string[];
      const allIds = [...emailIds, ...externalIds];
      
      // Get tasks linked via source_reference (can be email.id or email.external_id)
      const { data: tasksBySource } = await supabase
        .from('tasks')
        .select('source_reference')
        .in('source_reference', allIds)
        .not('source_reference', 'is', null);

      // Get email IDs that have created_task_id
      const emailsWithCreatedTask = emails
        .filter(e => !!e.created_task_id)
        .map(e => e.id);

      // Map external_id references back to email.id for UI display
      const linkedEmailIds = new Set<string>([...emailsWithCreatedTask]);
      
      if (tasksBySource) {
        for (const task of tasksBySource) {
          const ref = task.source_reference;
          if (!ref) continue;
          
          // Check if ref matches an email.id directly
          if (emailIds.includes(ref)) {
            linkedEmailIds.add(ref);
          } else {
            // Check if ref matches an external_id, map back to email.id
            const matchingEmail = emails.find(e => e.external_id === ref);
            if (matchingEmail) {
              linkedEmailIds.add(matchingEmail.id);
            }
          }
        }
      }

      setEmailsWithTasks(linkedEmailIds);
    };

    fetchEmailsWithTasksSet();
  }, [emails]);

  // Callback for when a new task is created - refetch linked tasks and indicators
  const handleTaskCreated = () => {
    fetchLinkedTasks();
    // Trigger re-fetch of emails with tasks
    setEmailsWithTasks(prev => new Set(prev)); // Force update
  };

  const handleSelectEmail = (email: Email) => {
    setSelectedEmail(email);
    // Mark as read when selecting
    if (!email.is_read) {
      markAsRead.mutate(email.id);
    }
  };

  const handleCategoryChange = (category: EmailCategory) => {
    setActiveCategory(category);
    setSelectedEmail(null);
    setSearchQuery('');
  };

  const handleUpdateStatus = async (emailId: string, status: 'new' | 'processed' | 'archived') => {
    try {
      await updateStatus.mutateAsync({ emailId, status });
      if (selectedEmail?.id === emailId) {
        setSelectedEmail(null);
      }
      toast({
        title: 'הסטטוס עודכן',
        description: status === 'processed' ? 'ההודעה סומנה כטופלה' : 'ההודעה הועברה לארכיון',
      });
    } catch (error) {
      toast({
        title: 'שגיאה',
        description: 'לא ניתן לעדכן את הסטטוס',
        variant: 'destructive',
      });
    }
  };

  const handleDelete = async () => {
    if (!emailToDelete) return;
    
    try {
      await deleteEmail.mutateAsync(emailToDelete);
      if (selectedEmail?.id === emailToDelete) {
        setSelectedEmail(null);
      }
      toast({
        title: 'ההודעה נמחקה',
        description: 'ההודעה נמחקה בהצלחה',
      });
    } catch (error) {
      toast({
        title: 'שגיאה',
        description: 'לא ניתן למחוק את ההודעה',
        variant: 'destructive',
      });
    } finally {
      setEmailToDelete(null);
    }
  };

  const handleGenerateTask = async (email: Email) => {
    try {
      const result = await generateTask.mutateAsync(email);
      toast({
        title: 'יצירת משימה עם AI',
        description: 'האוטומציה הופעלה, המשימה תהיה מוכנה בעוד מספר שניות...',
      });
      
      // Poll for the created task with multiple attempts
      const pollForTask = async (attempts: number = 0): Promise<void> => {
        if (attempts >= 5) {
          toast({
            title: 'המשימה בתהליך יצירה',
            description: 'ייתכן שהמשימה עדיין בתהליך יצירה. רענן את הדף בעוד מספר שניות.',
          });
          return;
        }

        // Wait before each attempt (increasing intervals)
        await new Promise(resolve => setTimeout(resolve, attempts === 0 ? 2000 : 3000));
        
        // First try: Check for task by source_reference (email UUID)
        const { data: taskBySource } = await supabase
          .from('tasks')
          .select('id, title')
          .eq('source_reference', email.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();
        
        if (taskBySource) {
          setAiCreatedTaskId(taskBySource.id);
          fetchLinkedTasks();
          toast({
            title: '✅ המשימה מוכנה!',
            description: `"${taskBySource.title}" נוצרה בהצלחה. לחץ לפתיחה.`,
          });
          return;
        }

        // 1.5 try: Check for task by source_reference (email external_id)
        if (email.external_id) {
          const { data: taskByExternalSource } = await supabase
            .from('tasks')
            .select('id, title')
            .eq('source_reference', email.external_id)
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle();

          if (taskByExternalSource) {
            setAiCreatedTaskId(taskByExternalSource.id);
            fetchLinkedTasks();
            toast({
              title: '✅ המשימה מוכנה!',
              description: `"${taskByExternalSource.title}" נוצרה בהצלחה. לחץ לפתיחה.`,
            });
            return;
          }
        }

        // Second try: Check if email got updated with created_task_id
        const { data: updatedEmail } = await supabase
          .from('emails')
          .select('created_task_id')
          .eq('id', email.id)
          .single();
        
        if (updatedEmail?.created_task_id) {
          // Fetch the task details for the toast
          const { data: taskData } = await supabase
            .from('tasks')
            .select('id, title')
            .eq('id', updatedEmail.created_task_id)
            .single();
          
          setAiCreatedTaskId(updatedEmail.created_task_id);
          // Update selected email so linked tasks refresh
          setSelectedEmail(prev => prev ? { ...prev, created_task_id: updatedEmail.created_task_id } : null);
          fetchLinkedTasks();
          toast({
            title: '✅ המשימה מוכנה!',
            description: taskData ? `"${taskData.title}" נוצרה בהצלחה. לחץ לפתיחה.` : 'המשימה נוצרה בהצלחה. לחץ לפתיחה.',
          });
          return;
        }

        // Third try: Look for any recent task that might be related to this email
        // (in case n8n created it without proper linking)
        const { data: recentTasks } = await supabase
          .from('tasks')
          .select('id, title, source, created_at')
          .in('source', ['email', 'n8n'])
          .gte('created_at', new Date(Date.now() - 30000).toISOString()) // Last 30 seconds
          .order('created_at', { ascending: false })
          .limit(1);

        if (recentTasks && recentTasks.length > 0) {
          const recentTask = recentTasks[0];
          setAiCreatedTaskId(recentTask.id);
          fetchLinkedTasks();
          toast({
            title: '✅ המשימה מוכנה!',
            description: `"${recentTask.title}" נוצרה בהצלחה. לחץ לפתיחה.`,
          });
          return;
        }

        // Retry
        await pollForTask(attempts + 1);
      };

      pollForTask();
      
    } catch (error) {
      toast({
        title: 'שגיאה',
        description: 'לא ניתן ליצור משימה',
        variant: 'destructive',
      });
    }
  };

  return (
    <AppLayout title="מרכז דואר" subtitle="ניהול הודעות דואר נכנס">
      {/* Light gray background to make columns pop */}
      <div className="h-[calc(100vh-140px)] bg-muted/30 rounded-2xl p-4">
        <div className="flex h-full gap-4">
          {/* Right Column - Inbox List (30%) */}
          <div className="w-full lg:w-[30%] lg:min-w-[280px] h-full">
            <EmailInboxColumn
              emails={emails}
              selectedEmailId={selectedEmail?.id || null}
              onSelectEmail={handleSelectEmail}
              isLoading={isLoading}
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              activeCategory={activeCategory}
              onCategoryChange={handleCategoryChange}
              counts={counts}
              emailsWithTasks={emailsWithTasks}
            />
          </div>

          {/* Center Column - Email Content (50%) */}
          <div className="hidden md:block flex-1 lg:w-1/2 h-full">
            <EmailContentColumn email={selectedEmail} />
          </div>

          {/* Left Column - AI Action Center (20%) - Hidden on mobile */}
          <div className="hidden lg:flex w-[20%] min-w-[220px] h-full">
            <div className="w-full bg-card rounded-xl shadow-sm border border-border/50 p-4 overflow-y-auto">
              <EmailAIActionColumn
                email={selectedEmail}
                onGenerateTask={handleGenerateTask}
                onUpdateStatus={handleUpdateStatus}
                onDelete={(id) => setEmailToDelete(id)}
                isGenerating={generateTask.isPending}
                linkedTasks={linkedTasks}
                onTaskCreated={handleTaskCreated}
                aiCreatedTaskId={aiCreatedTaskId}
                onClearAiCreatedTaskId={() => setAiCreatedTaskId(null)}
              />
            </div>
          </div>

          {/* Mobile AI Action Button */}
          <Sheet open={mobileAIOpen} onOpenChange={setMobileAIOpen}>
            <SheetTrigger asChild>
              <Button
                size="icon"
                className="lg:hidden fixed bottom-6 left-6 h-14 w-14 rounded-full shadow-lg shadow-primary/30 z-50"
              >
                <Wand2 className="h-6 w-6" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-80 p-4">
              <EmailAIActionColumn
                email={selectedEmail}
                onGenerateTask={handleGenerateTask}
                onUpdateStatus={handleUpdateStatus}
                onDelete={(id) => setEmailToDelete(id)}
                isGenerating={generateTask.isPending}
                linkedTasks={linkedTasks}
                onTaskCreated={handleTaskCreated}
                aiCreatedTaskId={aiCreatedTaskId}
                onClearAiCreatedTaskId={() => setAiCreatedTaskId(null)}
              />
            </SheetContent>
          </Sheet>
        </div>
      </div>

      {/* Delete Confirmation */}
      <AlertDialog open={!!emailToDelete} onOpenChange={() => setEmailToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>מחיקת הודעה</AlertDialogTitle>
            <AlertDialogDescription>
              האם אתה בטוח שברצונך למחוק הודעה זו? פעולה זו אינה ניתנת לביטול.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>ביטול</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              מחק
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AppLayout>
  );
}
