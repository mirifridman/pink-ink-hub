import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Card } from "@/components/ui/card";
import { MessageSquare, Plus, Trash2, Loader2, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { format } from "date-fns";
import { he } from "date-fns/locale";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ScrollArea } from "@/components/ui/scroll-area";

interface Comment {
  id: string;
  lineup_item_id: string;
  user_name: string;
  comment_text: string;
  created_at: string;
  user_id: string | null;
}

interface CommentsSidePanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  lineupItemId: string | null;
  contentTitle: string;
  onCommentCountChange?: () => void;
}

export function CommentsSidePanel({ 
  open, 
  onOpenChange, 
  lineupItemId, 
  contentTitle,
  onCommentCountChange 
}: CommentsSidePanelProps) {
  const { user } = useAuth();
  const [newComment, setNewComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const queryClient = useQueryClient();

  // Fetch user profile for name
  const { data: userProfile } = useQuery({
    queryKey: ["profile", user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data } = await supabase
        .from("profiles")
        .select("full_name, email")
        .eq("id", user.id)
        .single();
      return data;
    },
    enabled: !!user?.id,
  });

  // Fetch comments for this lineup item
  const { data: comments = [], isLoading, refetch } = useQuery({
    queryKey: ["lineup-comments", lineupItemId],
    queryFn: async () => {
      if (!lineupItemId) return [];
      const { data, error } = await supabase
        .from("lineup_comments")
        .select("*")
        .eq("lineup_item_id", lineupItemId)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching comments:", error);
        return [];
      }
      return data || [];
    },
    enabled: !!lineupItemId && open,
  });

  // Refetch when lineupItemId changes
  useEffect(() => {
    if (lineupItemId && open) {
      refetch();
    }
  }, [lineupItemId, open, refetch]);

  const addComment = async () => {
    if (!newComment.trim() || !user || !lineupItemId) return;

    setSubmitting(true);
    const userName = userProfile?.full_name || userProfile?.email || user.email || "משתמש";

    const { error } = await supabase.from("lineup_comments").insert({
      lineup_item_id: lineupItemId,
      user_id: user.id,
      user_name: userName,
      comment_text: newComment.trim(),
    });

    if (error) {
      console.error("Error adding comment:", error);
      toast.error("שגיאה בהוספת הערה");
    } else {
      setNewComment("");
      await refetch();
      onCommentCountChange?.();
      toast.success("הערה נוספה בהצלחה");
    }
    setSubmitting(false);
  };

  const deleteComment = async (commentId: string, commentUserId: string | null) => {
    if (commentUserId !== user?.id) {
      toast.error("ניתן למחוק רק הערות שכתבת");
      return;
    }

    const { error } = await supabase
      .from("lineup_comments")
      .delete()
      .eq("id", commentId);

    if (error) {
      console.error("Error deleting comment:", error);
      toast.error("שגיאה במחיקת הערה");
    } else {
      await refetch();
      onCommentCountChange?.();
      toast.success("הערה נמחקה");
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-[400px] sm:w-[450px] p-0">
        <SheetHeader className="p-4 border-b">
          <SheetTitle className="flex items-center gap-2 text-right" dir="rtl">
            <MessageSquare className="w-5 h-5 text-primary" />
            <span>הערות - {contentTitle || "פריט"}</span>
            <Badge variant="secondary" className="mr-auto">{comments.length}</Badge>
          </SheetTitle>
        </SheetHeader>

        <div className="flex flex-col h-[calc(100vh-80px)]" dir="rtl">
          {/* Comments List */}
          <ScrollArea className="flex-1 p-4">
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
              </div>
            ) : !lineupItemId ? (
              <p className="text-center py-8 text-muted-foreground">
                בחר פריט מהטבלה לצפייה בהערות
              </p>
            ) : comments.length === 0 ? (
              <p className="text-center py-8 text-muted-foreground">אין הערות עדיין</p>
            ) : (
              <div className="space-y-3">
                {comments.map((comment) => (
                  <Card key={comment.id} className="p-3">
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex items-center gap-2">
                        <Avatar className="w-6 h-6">
                          <AvatarFallback className="text-xs bg-primary/10 text-primary">
                            {comment.user_name.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <span className="font-bold text-sm">{comment.user_name}</span>
                        <span className="text-xs text-muted-foreground">
                          {format(new Date(comment.created_at), "dd/MM/yyyy HH:mm", { locale: he })}
                        </span>
                      </div>

                      {comment.user_id === user?.id && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteComment(comment.id, comment.user_id)}
                          className="h-6 w-6 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                    </div>

                    <p className="text-sm whitespace-pre-wrap pr-8">{comment.comment_text}</p>
                  </Card>
                ))}
              </div>
            )}
          </ScrollArea>

          {/* Add Comment */}
          {lineupItemId && (
            <div className="p-4 border-t space-y-2 bg-background">
              <Textarea
                placeholder="כתוב הערה..."
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                className="min-h-[80px]"
              />
              <Button 
                onClick={addComment} 
                className="w-full"
                disabled={!newComment.trim() || submitting}
              >
                {submitting ? (
                  <Loader2 className="w-4 h-4 ml-2 animate-spin" />
                ) : (
                  <Plus className="w-4 h-4 ml-2" />
                )}
                הוסף הערה
              </Button>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
