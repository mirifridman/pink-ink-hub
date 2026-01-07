import { useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  useMagazines, 
  useCreateMagazine, 
  useDeleteMagazine,
  useAllUsersWithRoles,
  useAllProfiles,
  useAssignRole,
  useRemoveRole
} from "@/hooks/useIssues";
import { Plus, Trash2, BookOpen, Users } from "lucide-react";
import { toast } from "sonner";
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
  
  const { data: magazines, isLoading: isLoadingMagazines } = useMagazines();
  const { data: usersWithRoles, isLoading: isLoadingUsers } = useAllUsersWithRoles();
  const { data: allProfiles } = useAllProfiles();
  
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
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              ניהול משתמשים ותפקידים
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
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
                      <span className="font-medium">{user.full_name || user.email || "משתמש ללא שם"}</span>
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
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
