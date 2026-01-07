import { useState, useEffect } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { NeonCard, NeonCardContent, NeonCardHeader, NeonCardTitle } from "@/components/ui/NeonCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { MessageSquare, Send, Check, Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { he } from "date-fns/locale";

interface Message {
  id: string;
  sender_id: string;
  subject: string;
  content: string;
  is_read: boolean;
  created_at: string;
  sender_name?: string;
}

export default function Messages() {
  const { role, user } = useAuth();
  const { toast } = useToast();
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [subject, setSubject] = useState("");
  const [content, setContent] = useState("");

  const isPublisher = role === "publisher";
  const canViewAllMessages = role === "editor" || role === "admin";

  useEffect(() => {
    fetchMessages();
  }, [user, role]);

  const fetchMessages = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("editor_messages")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Fetch sender profiles
      const senderIds = [...new Set(data?.map(m => m.sender_id) || [])];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, full_name")
        .in("id", senderIds);

      const messagesWithNames = data?.map(msg => ({
        ...msg,
        sender_name: profiles?.find(p => p.id === msg.sender_id)?.full_name || "משתמש לא ידוע"
      })) || [];

      setMessages(messagesWithNames);
    } catch (error) {
      console.error("Error fetching messages:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !subject.trim() || !content.trim()) return;

    setSending(true);
    try {
      const { error } = await supabase.from("editor_messages").insert({
        sender_id: user.id,
        subject: subject.trim(),
        content: content.trim(),
      });

      if (error) throw error;

      toast({
        title: "ההודעה נשלחה!",
        description: "ההודעה נשלחה לעורכת בהצלחה",
      });

      setSubject("");
      setContent("");
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
      
      setMessages(prev => 
        prev.map(m => m.id === messageId ? { ...m, is_read: true } : m)
      );
    } catch (error) {
      console.error("Error marking message as read:", error);
    }
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-rubik font-bold text-foreground">הודעות לעורכת</h1>
          <p className="text-muted-foreground mt-1">
            {isPublisher ? "שלח הודעה לעורכת המגזין" : "צפה בהודעות שנשלחו על ידי צוות ההוצאה לאור"}
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Send Message Form - Only for publishers */}
          {isPublisher && (
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
                    disabled={sending || !subject.trim() || !content.trim()}
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
          )}

          {/* Messages List */}
          <NeonCard className={isPublisher ? "" : "lg:col-span-2"}>
            <NeonCardHeader>
              <NeonCardTitle className="flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-neon-pink" />
                {isPublisher ? "ההודעות שלי" : "הודעות שהתקבלו"}
                {messages.filter(m => !m.is_read).length > 0 && (
                  <StatusBadge status="critical" pulse>
                    {messages.filter(m => !m.is_read).length} חדשות
                  </StatusBadge>
                )}
              </NeonCardTitle>
            </NeonCardHeader>
            <NeonCardContent>
              {loading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-neon-pink" />
                </div>
              ) : messages.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <MessageSquare className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>אין הודעות</p>
                </div>
              ) : (
                <div className="space-y-3 max-h-[500px] overflow-y-auto">
                  {messages.map((message) => (
                    <div
                      key={message.id}
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
                            {!message.is_read && (
                              <StatusBadge status="critical">חדש</StatusBadge>
                            )}
                          </div>
                          {canViewAllMessages && (
                            <p className="text-xs text-muted-foreground mb-2">
                              מאת: {message.sender_name}
                            </p>
                          )}
                          <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                            {message.content}
                          </p>
                          <p className="text-xs text-muted-foreground mt-2">
                            {format(new Date(message.created_at), "dd/MM/yyyy HH:mm", { locale: he })}
                          </p>
                        </div>
                        {canViewAllMessages && !message.is_read && (
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
                  ))}
                </div>
              )}
            </NeonCardContent>
          </NeonCard>
        </div>
      </div>
    </AppLayout>
  );
}
