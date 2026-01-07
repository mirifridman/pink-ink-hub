import { useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  useMagazines, 
  useCreateMagazine, 
  useDeleteMagazine,
} from "@/hooks/useIssues";
import { Plus, Trash2, BookOpen } from "lucide-react";
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

export default function Settings() {
  const [newMagazineName, setNewMagazineName] = useState("");
  
  const { data: magazines, isLoading: isLoadingMagazines } = useMagazines();
  
  const createMagazine = useCreateMagazine();
  const deleteMagazine = useDeleteMagazine();

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

  return (
    <AppLayout>
      <div className="space-y-6" dir="rtl">
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
                      <AlertDialogContent dir="rtl">
                        <AlertDialogHeader>
                          <AlertDialogTitle>מחיקת מותג</AlertDialogTitle>
                          <AlertDialogDescription>
                            האם אתה בטוח שברצונך למחוק את המותג "{magazine.name}"?
                            פעולה זו לא ניתנת לביטול.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter className="flex-row-reverse gap-2">
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
      </div>
    </AppLayout>
  );
}
