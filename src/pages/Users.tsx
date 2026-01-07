import { useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { 
  useAllUsersWithRoles,
  useAllProfiles,
  useAssignRole,
  useRemoveRole,
  useUserInvitations,
  usePendingUsers
} from "@/hooks/useIssues";
import { 
  Plus, Trash2, Users, UserPlus, Clock, Search, 
  Copy, MessageCircle, Link2, CheckCircle, X, RefreshCw,
  Shield, Palette, Edit3, Send, UserCheck, Hourglass
} from "lucide-react";
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
} from "@/components/ui/dialog";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { useQueryClient } from "@tanstack/react-query";
import { formatDistanceToNow, format } from "date-fns";
import { he } from "date-fns/locale";
import { cn } from "@/lib/utils";

type AppRole = "admin" | "designer" | "editor" | "publisher";

const roleLabels: Record<string, string> = {
  admin: "מנהל",
  designer: "מעצב",
  editor: "עורך",
  publisher: "מפיץ",
};

const roleIcons: Record<string, typeof Shield> = {
  admin: Shield,
  designer: Palette,
  editor: Edit3,
  publisher: Send,
};

const roleColors: Record<string, string> = {
  admin: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
  designer: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400",
  editor: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
  publisher: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
};

export default function UsersPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterRole, setFilterRole] = useState<string>("all");
  const [selectedUserId, setSelectedUserId] = useState("");
  const [selectedRole, setSelectedRole] = useState<AppRole>("editor");
  
  // New user form state
  const [isAddUserOpen, setIsAddUserOpen] = useState(false);
  const [newUserEmail, setNewUserEmail] = useState("");
  const [newUserName, setNewUserName] = useState("");
  const [newUserRole, setNewUserRole] = useState<AppRole>("editor");
  const [isCreatingUser, setIsCreatingUser] = useState(false);
  const [invitationLink, setInvitationLink] = useState<string | null>(null);
  const [showLinkModal, setShowLinkModal] = useState(false);
  
  const queryClient = useQueryClient();
  
  const { data: usersWithRoles, isLoading: isLoadingUsers } = useAllUsersWithRoles();
  const { data: allProfiles } = useAllProfiles();
  const { data: invitations, isLoading: isLoadingInvitations } = useUserInvitations();
  const { data: pendingUsers, isLoading: isLoadingPending } = usePendingUsers();
  
  const assignRole = useAssignRole();
  const removeRole = useRemoveRole();
  
  // Filter out users who already have roles
  const availableUsers = allProfiles?.filter(
    profile => !usersWithRoles?.some(u => u.id === profile.id)
  ) || [];

  // Filter users based on search and role
  const filteredUsers = usersWithRoles?.filter(user => {
    const matchesSearch = 
      user.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = filterRole === "all" || user.role === filterRole;
    return matchesSearch && matchesRole;
  }) || [];

  // Group users by role
  const usersByRole = {
    admin: filteredUsers.filter(u => u.role === "admin"),
    editor: filteredUsers.filter(u => u.role === "editor"),
    designer: filteredUsers.filter(u => u.role === "designer"),
    publisher: filteredUsers.filter(u => u.role === "publisher"),
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

  const handleChangeRole = async (userId: string, newRole: AppRole) => {
    try {
      await assignRole.mutateAsync({ userId, role: newRole });
      toast.success("התפקיד עודכן בהצלחה");
    } catch (error) {
      toast.error("שגיאה בעדכון התפקיד");
    }
  };

  const handleCreateInvitation = async () => {
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
          action: "create_invitation_link",
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

      const invitationId = response.data.token || response.data.invitation?.id;
      if (!invitationId) {
        throw new Error("לא התקבל מזהה הזמנה");
      }
      
      const signupUrl = `${window.location.origin}/auth?invite=${invitationId}&email=${encodeURIComponent(newUserEmail)}&name=${encodeURIComponent(newUserName || '')}&role=${encodeURIComponent(newUserRole)}`;
      setInvitationLink(signupUrl);
      setShowLinkModal(true);
      setIsAddUserOpen(false);
      
      // Refresh invitations list
      queryClient.invalidateQueries({ queryKey: ["userInvitations"] });
      
      toast.success("ההזמנה נוצרה בהצלחה");
    } catch (error: any) {
      toast.error("שגיאה ביצירת ההזמנה: " + error.message);
    } finally {
      setIsCreatingUser(false);
    }
  };

  const handleCopyLink = async () => {
    if (invitationLink) {
      await navigator.clipboard.writeText(invitationLink);
      toast.success("הלינק הועתק!");
    }
  };

  const handleShareWhatsApp = () => {
    if (invitationLink) {
      const message = `שלום ${newUserName || ""},\nהוזמנת להצטרף למערכת ניהול המגזינים.\nלחץ על הקישור להרשמה:\n${invitationLink}`;
      const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
      window.open(whatsappUrl, "_blank");
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

  const handleResendInvitation = async (invitation: any) => {
    const signupUrl = `${window.location.origin}/auth?invite=${invitation.id}&email=${encodeURIComponent(invitation.email)}`;
    setInvitationLink(signupUrl);
    setNewUserName(invitation.full_name || "");
    setNewUserEmail(invitation.email);
    setShowLinkModal(true);
  };

  const resetForm = () => {
    setNewUserEmail("");
    setNewUserName("");
    setNewUserRole("editor");
    setInvitationLink(null);
  };

  const UserCard = ({ user }: { user: typeof filteredUsers[0] }) => {
    const RoleIcon = roleIcons[user.role];
    
    return (
      <div className="flex items-center justify-between p-4 bg-card border rounded-xl hover:shadow-md transition-shadow">
        <div className="flex items-center gap-4">
          <div className={cn(
            "w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold",
            roleColors[user.role]
          )}>
            {user.full_name?.charAt(0)?.toUpperCase() || user.email?.charAt(0)?.toUpperCase() || "?"}
          </div>
          <div>
            <p className="font-medium text-foreground">{user.full_name || "משתמש ללא שם"}</p>
            <p className="text-sm text-muted-foreground">{user.email}</p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <Select 
            value={user.role} 
            onValueChange={(v) => handleChangeRole(user.id, v as AppRole)}
          >
            <SelectTrigger className="w-32">
              <div className="flex items-center gap-2">
                <RoleIcon className="w-4 h-4" />
                <SelectValue />
              </div>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="editor">
                <div className="flex items-center gap-2">
                  <Edit3 className="w-4 h-4" /> עורך
                </div>
              </SelectItem>
              <SelectItem value="designer">
                <div className="flex items-center gap-2">
                  <Palette className="w-4 h-4" /> מעצב
                </div>
              </SelectItem>
              <SelectItem value="publisher">
                <div className="flex items-center gap-2">
                  <Send className="w-4 h-4" /> מפיץ
                </div>
              </SelectItem>
              <SelectItem value="admin">
                <div className="flex items-center gap-2">
                  <Shield className="w-4 h-4" /> מנהל
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
          
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive hover:bg-destructive/10">
                <Trash2 className="w-4 h-4" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent dir="rtl">
              <AlertDialogHeader>
                <AlertDialogTitle>הסרת משתמש</AlertDialogTitle>
                <AlertDialogDescription>
                  האם אתה בטוח שברצונך להסיר את התפקיד של "{user.full_name || user.email}"?
                  המשתמש לא יוכל לגשת למערכת.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter className="flex-row-reverse gap-2">
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
      </div>
    );
  };

  const PendingUserCard = ({ user }: { user: { id: string; full_name: string | null; email: string | null; created_at: string } }) => {
    const [selectedPendingRole, setSelectedPendingRole] = useState<AppRole>("editor");
    const [isApproving, setIsApproving] = useState(false);

    const handleApprove = async () => {
      setIsApproving(true);
      try {
        await assignRole.mutateAsync({ userId: user.id, role: selectedPendingRole });
        queryClient.invalidateQueries({ queryKey: ["pendingUsers"] });
        toast.success(`${user.full_name || user.email} אושר כ${roleLabels[selectedPendingRole]}`);
      } catch (error) {
        toast.error("שגיאה באישור המשתמש");
      } finally {
        setIsApproving(false);
      }
    };

    return (
      <div className="flex items-center justify-between p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-blue-200 dark:bg-blue-800 flex items-center justify-center text-blue-800 dark:text-blue-200 font-bold text-lg">
            {user.full_name?.charAt(0)?.toUpperCase() || user.email?.charAt(0)?.toUpperCase() || "?"}
          </div>
          <div>
            <p className="font-medium text-foreground">{user.full_name || "משתמש ללא שם"}</p>
            <p className="text-sm text-muted-foreground">{user.email}</p>
            <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
              <Clock className="w-3 h-3" />
              נרשם {formatDistanceToNow(new Date(user.created_at), { locale: he, addSuffix: true })}
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <Select value={selectedPendingRole} onValueChange={(v) => setSelectedPendingRole(v as AppRole)}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="editor">
                <div className="flex items-center gap-2">
                  <Edit3 className="w-4 h-4" /> עורך
                </div>
              </SelectItem>
              <SelectItem value="designer">
                <div className="flex items-center gap-2">
                  <Palette className="w-4 h-4" /> מעצב
                </div>
              </SelectItem>
              <SelectItem value="publisher">
                <div className="flex items-center gap-2">
                  <Send className="w-4 h-4" /> מפיץ
                </div>
              </SelectItem>
              <SelectItem value="admin">
                <div className="flex items-center gap-2">
                  <Shield className="w-4 h-4" /> מנהל
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
          
          <Button 
            onClick={handleApprove}
            disabled={isApproving}
            className="bg-green-600 hover:bg-green-700 text-white"
          >
            <UserCheck className="w-4 h-4 ml-2" />
            {isApproving ? "מאשר..." : "אשר"}
          </Button>
        </div>
      </div>
    );
  };

  return (
    <AppLayout>
      <div className="space-y-6" dir="rtl">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-rubik font-bold text-foreground">ניהול משתמשים</h1>
            <p className="text-muted-foreground mt-1">ניהול משתמשים, תפקידים והזמנות</p>
          </div>
          <Button 
            onClick={() => setIsAddUserOpen(true)}
            className="gradient-neon text-white neon-shadow hover:neon-shadow-lg transition-shadow"
          >
            <UserPlus className="w-4 h-4 ml-2" />
            הזמן משתמש חדש
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {(["admin", "editor", "designer", "publisher"] as const).map(role => {
            const RoleIcon = roleIcons[role];
            const count = usersWithRoles?.filter(u => u.role === role).length || 0;
            return (
              <Card key={role} className={cn(
                "cursor-pointer transition-all hover:scale-105",
                filterRole === role && "ring-2 ring-primary"
              )} onClick={() => setFilterRole(filterRole === role ? "all" : role)}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-2xl font-bold">{count}</p>
                      <p className="text-sm text-muted-foreground">{roleLabels[role]}</p>
                    </div>
                    <div className={cn("p-3 rounded-xl", roleColors[role])}>
                      <RoleIcon className="w-5 h-5" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Search and Filter */}
        <div className="flex gap-4">
          <div className="relative flex-1">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="חיפוש לפי שם או אימייל..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pr-10"
            />
          </div>
          {availableUsers.length > 0 && (
            <div className="flex gap-2">
              <Select value={selectedUserId} onValueChange={setSelectedUserId}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="בחר משתמש קיים" />
                </SelectTrigger>
                <SelectContent>
                  {availableUsers.map((user) => (
                    <SelectItem key={user.id} value={user.id}>
                      {user.full_name || user.email || "משתמש ללא שם"}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={selectedRole} onValueChange={(v) => setSelectedRole(v as AppRole)}>
                <SelectTrigger className="w-28">
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
          )}
        </div>

        {/* Tabs */}
        <Tabs defaultValue="pending" className="w-full">
          <TabsList>
            <TabsTrigger value="pending" className="flex items-center gap-2">
              <Hourglass className="w-4 h-4" />
              ממתינים לאישור
              {pendingUsers && pendingUsers.length > 0 && (
                <Badge variant="destructive" className="mr-1">
                  {pendingUsers.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="users" className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              משתמשים פעילים ({usersWithRoles?.length || 0})
            </TabsTrigger>
            <TabsTrigger value="invitations" className="flex items-center gap-2">
              <Clock className="w-4 h-4" />
              הזמנות ממתינות
              {invitations && invitations.length > 0 && (
                <Badge variant="secondary" className="mr-1">
                  {invitations.length}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="pending" className="mt-6">
            {isLoadingPending ? (
              <div className="text-center py-12 text-muted-foreground">טוען בקשות...</div>
            ) : !pendingUsers || pendingUsers.length === 0 ? (
              <div className="text-center py-12">
                <UserCheck className="w-16 h-16 mx-auto text-muted-foreground/30 mb-4" />
                <p className="text-muted-foreground">אין משתמשים ממתינים לאישור</p>
                <p className="text-sm text-muted-foreground mt-2">כל המשתמשים שנרשמו כבר קיבלו תפקיד</p>
              </div>
            ) : (
              <div className="space-y-3">
                {pendingUsers.map((user) => (
                  <PendingUserCard key={user.id} user={user} />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="users" className="mt-6">
            {isLoadingUsers ? (
              <div className="text-center py-12 text-muted-foreground">טוען משתמשים...</div>
            ) : filteredUsers.length === 0 ? (
              <div className="text-center py-12">
                <Users className="w-16 h-16 mx-auto text-muted-foreground/30 mb-4" />
                <p className="text-muted-foreground">
                  {searchTerm || filterRole !== "all" ? "לא נמצאו משתמשים מתאימים" : "אין משתמשים במערכת"}
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredUsers.map((user) => (
                  <UserCard key={user.id} user={user} />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="invitations" className="mt-6">
            {isLoadingInvitations ? (
              <div className="text-center py-12 text-muted-foreground">טוען הזמנות...</div>
            ) : !invitations || invitations.length === 0 ? (
              <div className="text-center py-12">
                <Clock className="w-16 h-16 mx-auto text-muted-foreground/30 mb-4" />
                <p className="text-muted-foreground">אין הזמנות ממתינות</p>
              </div>
            ) : (
              <div className="space-y-3">
                {invitations.map((invitation) => (
                  <div
                    key={invitation.id}
                    className="flex items-center justify-between p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full bg-amber-200 dark:bg-amber-800 flex items-center justify-center text-amber-800 dark:text-amber-200 font-bold">
                        {invitation.full_name?.charAt(0)?.toUpperCase() || invitation.email?.charAt(0)?.toUpperCase() || "?"}
                      </div>
                      <div>
                        <p className="font-medium">{invitation.full_name || invitation.email}</p>
                        <p className="text-sm text-muted-foreground">{invitation.email}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="outline" className={roleColors[invitation.role]}>
                            {roleLabels[invitation.role]}
                          </Badge>
                          <span className="text-xs text-muted-foreground flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            נשלח {formatDistanceToNow(new Date(invitation.created_at), { locale: he, addSuffix: true })}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleResendInvitation(invitation)}
                      >
                        <Link2 className="w-4 h-4 ml-2" />
                        קישור
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon"
                        className="text-destructive hover:text-destructive hover:bg-destructive/10"
                        onClick={() => handleCancelInvitation(invitation.id)}
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
      </div>

      {/* New User Dialog */}
      <Dialog open={isAddUserOpen} onOpenChange={(open) => { setIsAddUserOpen(open); if (!open) resetForm(); }}>
        <DialogContent dir="rtl" className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>הזמנת משתמש חדש</DialogTitle>
            <DialogDescription>
              הזן את פרטי המשתמש וצור קישור הזמנה לשליחה
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
              <Select value={newUserRole} onValueChange={(v) => setNewUserRole(v as AppRole)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="editor">
                    <div className="flex items-center gap-2">
                      <Edit3 className="w-4 h-4" /> עורך
                    </div>
                  </SelectItem>
                  <SelectItem value="designer">
                    <div className="flex items-center gap-2">
                      <Palette className="w-4 h-4" /> מעצב
                    </div>
                  </SelectItem>
                  <SelectItem value="publisher">
                    <div className="flex items-center gap-2">
                      <Send className="w-4 h-4" /> מפיץ
                    </div>
                  </SelectItem>
                  <SelectItem value="admin">
                    <div className="flex items-center gap-2">
                      <Shield className="w-4 h-4" /> מנהל
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter className="flex-row-reverse gap-2 sm:gap-2">
            <Button variant="outline" onClick={() => setIsAddUserOpen(false)}>
              ביטול
            </Button>
            <Button onClick={handleCreateInvitation} disabled={isCreatingUser} className="gradient-neon text-white">
              <Link2 className="w-4 h-4 ml-2" />
              {isCreatingUser ? "יוצר..." : "צור קישור הזמנה"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Invitation Link Modal */}
      <Dialog open={showLinkModal} onOpenChange={(open) => { setShowLinkModal(open); if (!open) resetForm(); }}>
        <DialogContent dir="rtl" className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-500" />
              ההזמנה נוצרה בהצלחה
            </DialogTitle>
            <DialogDescription>
              שלח את הקישור למשתמש באמצעות וואצאפ או העתק אותו
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="p-3 bg-muted rounded-lg text-sm break-all font-mono">
              {invitationLink}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Button onClick={handleCopyLink} variant="outline" className="w-full">
                <Copy className="w-4 h-4 ml-2" />
                העתק קישור
              </Button>
              <Button onClick={handleShareWhatsApp} className="w-full bg-green-600 hover:bg-green-700 text-white">
                <MessageCircle className="w-4 h-4 ml-2" />
                שלח בוואצאפ
              </Button>
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => { setShowLinkModal(false); resetForm(); }}>
              סגור
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
