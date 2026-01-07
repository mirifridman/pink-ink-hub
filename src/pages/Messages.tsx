import { useState, useEffect } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { NeonCard, NeonCardContent, NeonCardHeader, NeonCardTitle } from "@/components/ui/NeonCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MessageSquare, Send, Check, Loader2, Inbox, SendHorizontal } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { he } from "date-fns/locale";

interface Message {
  id: string;
  sender_id: string;
  recipient_id: string | null;
  subject: string;
  content: string;
  is_read: boolean;
  created_at: string;
  sender_name?: string;
  recipient_name?: string;
}

interface TeamMember {
  id: string;
  full_name: string | null;
  role: string;
}

export default function Messages() {
  const { role, user } = useAuth();
  const { toast } = useToast();
  const [receivedMessages, setReceivedMessages] = useState<Message[]>([]);
  const [sentMessages, setSentMessages] = useState<Message[]>([]);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [subject, setSubject] = useState("");
  const [content, setContent] = useState("");
  const [recipientId, setRecipientId] = useState("");

  useEffect(() => {
    if (user) {
      fetchMessages();
      fetchTeamMembers();
    }
  }, [user]);

  const fetchTeamMembers = async () => {
    try {
      // Get all users with roles
      const { data: roles, error: rolesError } = await supabase
        .from("user_roles")
        .select("user_id, role");

      if (rolesError) throw rolesError;

      const userIds = roles?.map(r => r.user_id) || [];

      // Get profiles for those users
      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select("id, full_name")
        .in("id", userIds);

      if (profilesError) throw profilesError;

      const members = profiles?.map(p => ({
        id: p.id,
        full_name: p.full_name,
        role: roles?.find(r => r.user_id === p.id)?.role || ""
      })).filter(m => m.id !== user?.id) || [];

      setTeamMembers(members);
    } catch (error) {
      console.error("Error fetching team members:", error);
    }
  };

  const fetchMessages = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      // Fetch messages where user is recipient
      const { data: received, error: receivedError } = await supabase
        .from("editor_messages")
        .select("*")
        .eq("recipient_id", user.id)
        .order("created_at", { ascending: false });

      if (receivedError) throw receivedError;

      // Fetch messages sent by user
      const { data: sent, error: sentError } = await supabase
        .from("editor_messages")
        .select("*")
        .eq("sender_id", user.id)
        .order("created_at", { ascending: false });

      if (sentError) throw sentError;

      // Get all unique user IDs for profile lookup
      const allUserIds = [...new Set([
        ...(received?.map(m => m.sender_id) || []),
        ...(sent?.map(m => m.recipient_id).filter(Boolean) || [])
      ])];

      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, full_name")
        .in("id", allUserIds);

      const getProfileName = (id: string) => 
        profiles?.find(p => p.id === id)?.full_name || "משתמש לא ידוע";

      setReceivedMessages(received?.map(msg => ({
        ...msg,
        sender_name: getProfileName(msg.sender_id),
        recipient_name: msg.recipient_id ? getProfileName(msg.recipient_id) : undefined
      })) || []);

      setSentMessages(sent?.map(msg => ({
        ...msg,
        sender_name: getProfileName(msg.sender_id),
        recipient_name: msg.recipient_id ? getProfileName(msg.recipient_id) : undefined
      })) || []);
    } catch (error) {
      console.error("Error fetching messages:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !subject.trim() || !content.trim() || !recipientId) return;

    setSending(true);
    try {
      const { error } = await supabase.from("editor_messages").insert({
        sender_id: user.id,
        recipient_id: recipientId,
        subject: subject.trim(),
        content: content.trim(),
      });

      if (error) throw error;

      const recipientName = teamMembers.find(m => m.id === recipientId)?.full_name;
      toast({
        title: "ההודעה נשלחה!",
        description: `ההודעה נשלחה ל${recipientName} בהצלחה`,
      });

      setSubject("");
      setContent("");
      setRecipientId("");
      fetchMessages();
    } catch (error) {
      toast({
        title: "שגיאה",
        description: "לא ניתן לשלוח את ההודעה",
        variant: "destructive",
      });
    } finally {
      setSending(false);
    }
  };

  const markAsRead = async (messageId: string) => {
    try {
      const { error } = await supabase
        .from("editor_messages")
        .update({ is_read: true })
        .eq("id", messageId);

      if (error) throw error;
      
      setReceivedMessages(prev => 
        prev.map(m => m.id === messageId ? { ...m, is_read: true } : m)
      );
    } catch (error) {
      console.error("Error marking message as read:", error);
    }
  };

  const getRoleLabel = (role: string) => {
    const labels: Record<string, string> = {
      admin: "מנהל",
      editor: "עורך",
      designer: "מעצב",
      publisher: "הוצאה לאור"
    };
    return labels[role] || role;
  };

  const unreadCount = receivedMessages.filter(m => !m.is_read).length;

  const MessageCard = ({ message, showRecipient = false }: { message: Message; showRecipient?: boolean }) => (
    <div
      className={`p-4 rounded-lg border transition-colors ${
        message.is_read
          ? "bg-muted/30 border-border"
          : "bg-neon-pink/5 border-neon-pink/30"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h4 className="font-medium text-foreground truncate">
              {message.subject}
            </h4>
            {!message.is_read && !showRecipient && (
              <StatusBadge status="critical">חדש</StatusBadge>
            )}
          </div>
          <p className="text-xs text-muted-foreground mb-2">
            {showRecipient ? `אל: ${message.recipient_name}` : `מאת: ${message.sender_name}`}
          </p>
          <p className="text-sm text-muted-foreground whitespace-pre-wrap">
            {message.content}
          </p>
          <p className="text-xs text-muted-foreground mt-2">
            {format(new Date(message.created_at), "dd/MM/yyyy HH:mm", { locale: he })}
          </p>
        </div>
        {!showRecipient && !message.is_read && (
          <Button
            size="sm"
            variant="ghost"
            onClick={() => markAsRead(message.id)}
            className="shrink-0"
          >
            <Check className="w-4 h-4" />
          </Button>
        )}
      </div>
    </div>
  );

  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-rubik font-bold text-foreground">הודעות מערכת</h1>
          <p className="text-muted-foreground mt-1">
            שלח וקבל הודעות מאנשי הצוות
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Send Message Form */}
          <NeonCard variant="glow">
            <NeonCardHeader>
              <NeonCardTitle className="flex items-center gap-2">
                <Send className="w-5 h-5 text-neon-pink" />
                שליחת הודעה חדשה
              </NeonCardTitle>
            </NeonCardHeader>
            <NeonCardContent>
              <form onSubmit={handleSend} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="recipient">נמען</Label>
                  <Select value={recipientId} onValueChange={setRecipientId}>
                    <SelectTrigger>
                      <SelectValue placeholder="בחר איש צוות" />
                    </SelectTrigger>
                    <SelectContent>
                      {teamMembers.map((member) => (
                        <SelectItem key={member.id} value={member.id}>
                          {member.full_name || "ללא שם"} ({getRoleLabel(member.role)})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="subject">נושא</Label>
                  <Input
                    id="subject"
                    placeholder="נושא ההודעה"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="content">תוכן ההודעה</Label>
                  <Textarea
                    id="content"
                    placeholder="כתוב את ההודעה שלך..."
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    rows={5}
                  />
                </div>
                <Button
                  type="submit"
                  className="w-full gradient-neon text-white"
                  disabled={sending || !subject.trim() || !content.trim() || !recipientId}
                >
                  {sending ? (
                    <Loader2 className="w-4 h-4 animate-spin ml-2" />
                  ) : (
                    <Send className="w-4 h-4 ml-2" />
                  )}
                  שלח הודעה
                </Button>
              </form>
            </NeonCardContent>
          </NeonCard>

          {/* Messages List */}
          <NeonCard>
            <NeonCardHeader>
              <NeonCardTitle className="flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-neon-pink" />
                הודעות
                {unreadCount > 0 && (
                  <StatusBadge status="critical" pulse>
                    {unreadCount} חדשות
                  </StatusBadge>
                )}
              </NeonCardTitle>
            </NeonCardHeader>
            <NeonCardContent>
              <Tabs defaultValue="received" className="w-full">
                <TabsList className="grid w-full grid-cols-2 mb-4">
                  <TabsTrigger value="received" className="flex items-center gap-2">
                    <Inbox className="w-4 h-4" />
                    נכנסות ({receivedMessages.length})
                  </TabsTrigger>
                  <TabsTrigger value="sent" className="flex items-center gap-2">
                    <SendHorizontal className="w-4 h-4" />
                    יוצאות ({sentMessages.length})
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="received">
                  {loading ? (
                    <div className="flex justify-center py-8">
                      <Loader2 className="w-6 h-6 animate-spin text-neon-pink" />
                    </div>
                  ) : receivedMessages.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <Inbox className="w-12 h-12 mx-auto mb-3 opacity-50" />
                      <p>אין הודעות נכנסות</p>
                    </div>
                  ) : (
                    <div className="space-y-3 max-h-[400px] overflow-y-auto">
                      {receivedMessages.map((message) => (
                        <MessageCard key={message.id} message={message} />
                      ))}
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="sent">
                  {loading ? (
                    <div className="flex justify-center py-8">
                      <Loader2 className="w-6 h-6 animate-spin text-neon-pink" />
                    </div>
                  ) : sentMessages.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <SendHorizontal className="w-12 h-12 mx-auto mb-3 opacity-50" />
                      <p>לא שלחת הודעות</p>
                    </div>
                  ) : (
                    <div className="space-y-3 max-h-[400px] overflow-y-auto">
                      {sentMessages.map((message) => (
                        <MessageCard key={message.id} message={message} showRecipient />
                      ))}
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </NeonCardContent>
          </NeonCard>
        </div>
      </div>
    </AppLayout>
  );
}
