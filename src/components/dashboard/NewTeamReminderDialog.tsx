import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useCreateTeamReminder, useTeamMembers } from "@/hooks/useTeamReminders";
import { useAuth } from "@/hooks/useAuth";
import { useHasPermission } from "@/hooks/usePermissions";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

interface NewTeamReminderDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function NewTeamReminderDialog({ open, onOpenChange }: NewTeamReminderDialogProps) {
  const { user } = useAuth();
  const canSendToOthers = useHasPermission("send_team_reminders");
  const { data: teamMembers, isLoading: membersLoading } = useTeamMembers();
  const createReminder = useCreateTeamReminder();

  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [scheduledFor, setScheduledFor] = useState("");
  const [isPersonal, setIsPersonal] = useState(true);
  const [targetUserId, setTargetUserId] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim()) {
      toast.error("נא להזין כותרת");
      return;
    }

    if (!scheduledFor) {
      toast.error("נא לבחור תאריך ושעה");
      return;
    }

    if (!isPersonal && !targetUserId) {
      toast.error("נא לבחור נמען");
      return;
    }

    try {
      await createReminder.mutateAsync({
        title: title.trim(),
        message: message.trim(),
        scheduled_for: new Date(scheduledFor).toISOString(),
        is_personal: isPersonal,
        target_user_id: isPersonal ? user?.id : targetUserId,
      });

      toast.success(isPersonal ? "התזכורת האישית נוצרה בהצלחה" : "התזכורת נשלחה בהצלחה");
      onOpenChange(false);
      resetForm();
    } catch (error) {
      toast.error("שגיאה ביצירת התזכורת");
    }
  };

  const resetForm = () => {
    setTitle("");
    setMessage("");
    setScheduledFor("");
    setIsPersonal(true);
    setTargetUserId("");
  };

  // Get default datetime (now + 1 hour)
  const getDefaultDateTime = () => {
    const now = new Date();
    now.setHours(now.getHours() + 1);
    now.setMinutes(0);
    return now.toISOString().slice(0, 16);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]" dir="rtl">
        <DialogHeader>
          <DialogTitle>תזכורת חדשה</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Personal/Team Toggle */}
          {canSendToOthers && (
            <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
              <Label htmlFor="is-personal" className="text-sm">
                {isPersonal ? "תזכורת לעצמי" : "שליחה לאיש צוות"}
              </Label>
              <Switch
                id="is-personal"
                checked={!isPersonal}
                onCheckedChange={(checked) => setIsPersonal(!checked)}
              />
            </div>
          )}

          {/* Target User Select */}
          {!isPersonal && canSendToOthers && (
            <div className="space-y-2">
              <Label htmlFor="target-user">נמען</Label>
              <Select value={targetUserId} onValueChange={setTargetUserId}>
                <SelectTrigger>
                  <SelectValue placeholder="בחר איש צוות" />
                </SelectTrigger>
                <SelectContent>
                  {membersLoading ? (
                    <div className="flex justify-center p-2">
                      <Loader2 className="w-4 h-4 animate-spin" />
                    </div>
                  ) : (
                    teamMembers
                      ?.filter(m => m.id !== user?.id)
                      .map((member) => (
                        <SelectItem key={member.id} value={member.id}>
                          {member.full_name || member.email}
                        </SelectItem>
                      ))
                  )}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title">כותרת</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="הזן כותרת לתזכורת"
            />
          </div>

          {/* Message */}
          <div className="space-y-2">
            <Label htmlFor="message">הודעה (אופציונלי)</Label>
            <Textarea
              id="message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="תיאור נוסף לתזכורת"
              rows={3}
            />
          </div>

          {/* Scheduled Time */}
          <div className="space-y-2">
            <Label htmlFor="scheduled-for">תאריך ושעה</Label>
            <Input
              id="scheduled-for"
              type="datetime-local"
              value={scheduledFor || getDefaultDateTime()}
              onChange={(e) => setScheduledFor(e.target.value)}
              min={new Date().toISOString().slice(0, 16)}
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              ביטול
            </Button>
            <Button
              type="submit"
              className="gradient-neon text-white"
              disabled={createReminder.isPending}
            >
              {createReminder.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin ml-2" />
              ) : null}
              {isPersonal ? "צור תזכורת" : "שלח תזכורת"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}