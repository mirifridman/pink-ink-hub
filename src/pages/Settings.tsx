import { useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { 
  useMagazines, 
  useCreateMagazine, 
  useDeleteMagazine,
  useAllUsersWithRoles,
  useAllProfiles,
  useAssignRole,
  useRemoveRole,
  useUserInvitations
} from "@/hooks/useIssues";
import { Plus, Trash2, BookOpen, Users, UserPlus, Mail, RefreshCw, X, Clock } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { useQueryClient } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";
import { he } from "date-fns/locale";

const roleLabels: Record<string, string> = {
  admin: "מנהל",
  designer: "מעצב",
  editor: "עורך",
  publisher: "מפיץ",
};

export default function Settings() {
  const [newMagazineName, setNewMagazineName] = useState("");
  const [selectedUserId, setSelectedUserId] = useState("");
  const [selectedRole, setSelectedRole] = useState<"admin" | "designer" | "editor" | "publisher">("editor");
  
  // New user form state
  const [isAddUserOpen, setIsAddUserOpen] = useState(false);
  const [newUserEmail, setNewUserEmail] = useState("");
  const [newUserName, setNewUserName] = useState("");
  const [newUserPassword, setNewUserPassword] = useState("");
  const [newUserRole, setNewUserRole] = useState<"admin" | "designer" | "editor" | "publisher">("editor");
  const [isCreatingUser, setIsCreatingUser] = useState(false);
  
  const queryClient = useQueryClient();
  
  const { data: magazines, isLoading: isLoadingMagazines } = useMagazines();
  const { data: usersWithRoles, isLoading: isLoadingUsers } = useAllUsersWithRoles();
  const { data: allProfiles } = useAllProfiles();
  const { data: invitations, isLoading: isLoadingInvitations } = useUserInvitations();
  
  const createMagazine = useCreateMagazine();
  const deleteMagazine = useDeleteMagazine();
  const assignRole = useAssignRole();
  const removeRole = useRemoveRole();
  
  // Filter out users who already have roles
  const availableUsers = allProfiles?.filter(
    profile => !usersWithRoles?.some(u => u.id === profile.id)
  ) || [];

  const handleAddMagazine = async () => {
    if (!newMagazineName.trim()) {
      toast.error("יש להזין שם מותג");
      return;
    }

    try {
      await createMagazine.mutateAsync({ name: newMagazineName.trim() });
      setNewMagazineName("");
      toast.success("המותג נוסף בהצלחה");
    } catch (error) {
      toast.error("שגיאה בהוספת המותג");
    }
  };

  const handleDeleteMagazine = async (id: string) => {
    try {
      await deleteMagazine.mutateAsync(id);
      toast.success("המותג נמחק בהצלחה");
    } catch (error) {
      toast.error("שגיאה במחיקת המותג - ייתכן שקיימים גליונות המשויכים אליו");
    }
  };

  const handleAddUser = async () => {
    if (!selectedUserId) {
      toast.error("יש לבחור משתמש");
      return;
    }

    try {
      await assignRole.mutateAsync({ userId: selectedUserId, role: selectedRole });
      setSelectedUserId("");
      toast.success("התפקיד הוקצה בהצלחה");
    } catch (error) {
      toast.error("שגיאה בהקצאת התפקיד");
    }
  };

  const handleRemoveUser = async (userId: string) => {
    try {
      await removeRole.mutateAsync(userId);
      toast.success("המשתמש הוסר בהצלחה");
    } catch (error) {
      toast.error("שגיאה בהסרת המשתמש");
    }
  };

  const handleChangeRole = async (userId: string, newRole: "admin" | "designer" | "editor" | "publisher") => {
    try {
      await assignRole.mutateAsync({ userId, role: newRole });
      toast.success("התפקיד עודכן בהצלחה");
    } catch (error) {
      toast.error("שגיאה בעדכון התפקיד");
    }
  };

  const handleCreateUser = async () => {
    if (!newUserEmail) {
      toast.error("יש להזין כתובת אימייל");
      return;
    }

    setIsCreatingUser(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error("יש להתחבר מחדש");
        return;
      }

      const response = await supabase.functions.invoke("manage-users", {
        body: {
          action: "invite",
          email: newUserEmail,
          fullName: newUserName,
          role: newUserRole,
        },
      });

      if (response.error) {
        throw new Error(response.error.message);
      }

      if (response.data?.error) {
        throw new Error(response.data.error);
      }

      toast.success("ההזמנה נשלחה בהצלחה");
      setIsAddUserOpen(false);
      setNewUserEmail("");
      setNewUserName("");
      setNewUserPassword("");
      setNewUserRole("editor");
      
      // Refresh the lists
      queryClient.invalidateQueries({ queryKey: ["allUsersWithRoles"] });
      queryClient.invalidateQueries({ queryKey: ["allProfiles"] });
      queryClient.invalidateQueries({ queryKey: ["userInvitations"] });
    } catch (error: any) {
      toast.error("שגיאה בשליחת ההזמנה: " + error.message);
    } finally {
      setIsCreatingUser(false);
    }
  };

  const handleCancelInvitation = async (invitationId: string) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error("יש להתחבר מחדש");
        return;
      }

      const response = await supabase.functions.invoke("manage-users", {
        body: {
          action: "cancel_invitation",
          invitationId,
        },
      });

      if (response.error) {
        throw new Error(response.error.message);
      }

      if (response.data?.error) {
        throw new Error(response.data.error);
      }

      toast.success("ההזמנה בוטלה");
      queryClient.invalidateQueries({ queryKey: ["userInvitations"] });
    } catch (error: any) {
      toast.error("שגיאה בביטול ההזמנה: " + error.message);
    }
  };

  const handleResendInvitation = async (invitationId: string) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error("יש להתחבר מחדש");
        return;
      }

      const response = await supabase.functions.invoke("manage-users", {
        body: {
          action: "resend_invitation",
          invitationId,
        },
      });

      if (response.error) {
        throw new Error(response.error.message);
      }

      if (response.data?.error) {
        throw new Error(response.data.error);
      }

      toast.success("ההזמנה נשלחה מחדש");
      queryClient.invalidateQueries({ queryKey: ["userInvitations"] });
    } catch (error: any) {
      toast.error("שגיאה בשליחת ההזמנה: " + error.message);
    }
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">הגדרות מערכת</h1>
          <p className="text-muted-foreground">ניהול הגדרות כלליות של המערכת</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="w-5 h-5" />
              ניהול מותגים
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Input
                placeholder="שם המותג החדש"
                value={newMagazineName}
                onChange={(e) => setNewMagazineName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAddMagazine()}
                className="flex-1"
              />
              <Button onClick={handleAddMagazine} disabled={createMagazine.isPending}>
                <Plus className="w-4 h-4 ml-2" />
                הוסף
              </Button>
            </div>

            {isLoadingMagazines ? (
              <p className="text-muted-foreground text-sm">טוען...</p>
            ) : magazines?.length === 0 ? (
              <p className="text-muted-foreground text-sm">אין מותגים במערכת</p>
            ) : (
              <div className="space-y-2">
                {magazines?.map((magazine) => (
                  <div
                    key={magazine.id}
                    className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                  >
                    <span className="font-medium">{magazine.name}</span>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>מחיקת מותג</AlertDialogTitle>
                          <AlertDialogDescription>
                            האם אתה בטוח שברצונך למחוק את המותג "{magazine.name}"?
                            פעולה זו לא ניתנת לביטול.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>ביטול</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleDeleteMagazine(magazine.id)}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          >
                            מחק
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              ניהול משתמשים ותפקידים
            </CardTitle>
            <Dialog open={isAddUserOpen} onOpenChange={setIsAddUserOpen}>
              <DialogTrigger asChild>
                <Button>
                  <UserPlus className="w-4 h-4 ml-2" />
                  משתמש חדש
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>הזמנת משתמש חדש</DialogTitle>
                  <DialogDescription>
                    הזן את פרטי המשתמש החדש. המשתמש יקבל הזמנה באימייל להצטרף למערכת.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">כתובת אימייל *</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="user@example.com"
                      value={newUserEmail}
                      onChange={(e) => setNewUserEmail(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="name">שם מלא</Label>
                    <Input
                      id="name"
                      placeholder="ישראל ישראלי"
                      value={newUserName}
                      onChange={(e) => setNewUserName(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>תפקיד</Label>
                    <Select value={newUserRole} onValueChange={(v) => setNewUserRole(v as typeof newUserRole)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="editor">עורך</SelectItem>
                        <SelectItem value="designer">מעצב</SelectItem>
                        <SelectItem value="publisher">מפיץ</SelectItem>
                        <SelectItem value="admin">מנהל</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsAddUserOpen(false)}>
                    ביטול
                  </Button>
                  <Button onClick={handleCreateUser} disabled={isCreatingUser}>
                    <Mail className="w-4 h-4 ml-2" />
                    {isCreatingUser ? "שולח..." : "שלח הזמנה"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex gap-2">
              <Select value={selectedUserId} onValueChange={setSelectedUserId}>
                <SelectTrigger className="flex-1">
                  <SelectValue placeholder="בחר משתמש להוספה" />
                </SelectTrigger>
                <SelectContent>
                  {availableUsers.length === 0 ? (
                    <SelectItem value="none" disabled>אין משתמשים זמינים</SelectItem>
                  ) : (
                    availableUsers.map((user) => (
                      <SelectItem key={user.id} value={user.id}>
                        {user.full_name || user.email || "משתמש ללא שם"}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
              <Select value={selectedRole} onValueChange={(v) => setSelectedRole(v as typeof selectedRole)}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="editor">עורך</SelectItem>
                  <SelectItem value="designer">מעצב</SelectItem>
                  <SelectItem value="publisher">מפיץ</SelectItem>
                  <SelectItem value="admin">מנהל</SelectItem>
                </SelectContent>
              </Select>
              <Button onClick={handleAddUser} disabled={assignRole.isPending || !selectedUserId}>
                <Plus className="w-4 h-4 ml-2" />
                הוסף
              </Button>
            </div>

            <Tabs defaultValue="users" className="w-full">
              <TabsList className="mb-4">
                <TabsTrigger value="users">משתמשים פעילים</TabsTrigger>
                <TabsTrigger value="invitations" className="relative">
                  הזמנות ממתינות
                  {invitations && invitations.length > 0 && (
                    <Badge variant="secondary" className="mr-2 h-5 px-1.5 text-xs">
                      {invitations.length}
                    </Badge>
                  )}
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="users">
                {isLoadingUsers ? (
                  <p className="text-muted-foreground text-sm">טוען...</p>
                ) : usersWithRoles?.length === 0 ? (
                  <p className="text-muted-foreground text-sm">אין משתמשים עם תפקידים במערכת</p>
                ) : (
                  <div className="space-y-2">
                    {usersWithRoles?.map((user) => (
                      <div
                        key={user.id}
                        className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                      >
                        <div className="flex items-center gap-4">
                          <div>
                            <span className="font-medium">{user.full_name || "משתמש ללא שם"}</span>
                            {user.email && (
                              <p className="text-sm text-muted-foreground">{user.email}</p>
                            )}
                          </div>
                          <Select 
                            value={user.role} 
                            onValueChange={(v) => handleChangeRole(user.id, v as typeof selectedRole)}
                          >
                            <SelectTrigger className="w-28 h-8">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="editor">עורך</SelectItem>
                              <SelectItem value="designer">מעצב</SelectItem>
                              <SelectItem value="publisher">מפיץ</SelectItem>
                              <SelectItem value="admin">מנהל</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive">
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>הסרת משתמש</AlertDialogTitle>
                              <AlertDialogDescription>
                                האם אתה בטוח שברצונך להסיר את התפקיד של "{user.full_name || user.email}"?
                                המשתמש לא יוכל לגשת למערכת.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>ביטול</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleRemoveUser(user.id)}
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                              >
                                הסר
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    ))}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="invitations">
                {isLoadingInvitations ? (
                  <p className="text-muted-foreground text-sm">טוען...</p>
                ) : !invitations || invitations.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Clock className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p>אין הזמנות ממתינות</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {invitations.map((invitation) => (
                      <div
                        key={invitation.id}
                        className="flex items-center justify-between p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg"
                      >
                        <div className="flex items-center gap-4">
                          <div>
                            <span className="font-medium">{invitation.full_name || invitation.email}</span>
                            <p className="text-sm text-muted-foreground">{invitation.email}</p>
                            <p className="text-xs text-muted-foreground flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              נשלח {formatDistanceToNow(new Date(invitation.created_at), { locale: he, addSuffix: true })}
                            </p>
                          </div>
                          <Badge variant="outline">{roleLabels[invitation.role]}</Badge>
                          <Badge variant="secondary" className="bg-amber-200 text-amber-800 dark:bg-amber-800 dark:text-amber-200">
                            ממתין לאישור
                          </Badge>
                        </div>
                        <div className="flex items-center gap-1">
                          <Button 
                            variant="ghost" 
                            size="icon"
                            onClick={() => handleResendInvitation(invitation.id)}
                            title="שלח שוב"
                          >
                            <RefreshCw className="w-4 h-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="text-destructive hover:text-destructive"
                            onClick={() => handleCancelInvitation(invitation.id)}
                            title="בטל הזמנה"
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
