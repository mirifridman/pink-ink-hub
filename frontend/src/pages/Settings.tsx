import { useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  useMagazines, 
  useCreateMagazine, 
  useDeleteMagazine,
  usePageTemplates,
  useCreatePageTemplate,
  useDeletePageTemplate,
} from "@/hooks/useIssues";
import { Plus, Trash2, BookOpen, FileText } from "lucide-react";
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
  const [newPageCount, setNewPageCount] = useState("");
  
  const { data: magazines, isLoading: isLoadingMagazines } = useMagazines();
  const { data: pageTemplates, isLoading: isLoadingTemplates } = usePageTemplates();
  
  const createMagazine = useCreateMagazine();
  const deleteMagazine = useDeleteMagazine();
  const createPageTemplate = useCreatePageTemplate();
  const deletePageTemplate = useDeletePageTemplate();

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

  const handleAddPageTemplate = async () => {
    const pageCount = parseInt(newPageCount);
    if (!pageCount || pageCount < 1) {
      toast.error("יש להזין מספר עמודים תקין");
      return;
    }

    if (pageTemplates?.some(t => t.page_count === pageCount)) {
      toast.error("תבנית עם מספר עמודים זה כבר קיימת");
      return;
    }

    try {
      await createPageTemplate.mutateAsync(pageCount);
      setNewPageCount("");
      toast.success("תבנית העמודים נוספה בהצלחה");
    } catch (error) {
      toast.error("שגיאה בהוספת תבנית העמודים");
    }
  };

  const handleDeletePageTemplate = async (id: string) => {
    try {
      await deletePageTemplate.mutateAsync(id);
      toast.success("תבנית העמודים נמחקה בהצלחה");
    } catch (error) {
      toast.error("שגיאה במחיקת תבנית העמודים - ייתכן שקיימים גליונות המשתמשים בה");
    }
  };

  return (
    <AppLayout>
      <div className="space-y-6" dir="rtl">
        <div>
          <h1 className="text-2xl font-bold text-foreground">הגדרות מערכת</h1>
          <p className="text-muted-foreground">ניהול הגדרות כלליות של המערכת</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Magazines Card */}
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

          {/* Page Templates Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5" />
                תבניות עמודים
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Input
                  type="number"
                  placeholder="מספר עמודים"
                  value={newPageCount}
                  onChange={(e) => setNewPageCount(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleAddPageTemplate()}
                  className="flex-1"
                  min={1}
                />
                <Button onClick={handleAddPageTemplate} disabled={createPageTemplate.isPending}>
                  <Plus className="w-4 h-4 ml-2" />
                  הוסף
                </Button>
              </div>

              {isLoadingTemplates ? (
                <p className="text-muted-foreground text-sm">טוען...</p>
              ) : pageTemplates?.length === 0 ? (
                <p className="text-muted-foreground text-sm">אין תבניות עמודים במערכת</p>
              ) : (
                <div className="space-y-2">
                  {pageTemplates?.map((template) => (
                    <div
                      key={template.id}
                      className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                    >
                      <span className="font-medium">{template.page_count} עמודים</span>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive">
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent dir="rtl">
                          <AlertDialogHeader>
                            <AlertDialogTitle>מחיקת תבנית עמודים</AlertDialogTitle>
                            <AlertDialogDescription>
                              האם אתה בטוח שברצונך למחוק את התבנית של {template.page_count} עמודים?
                              פעולה זו לא ניתנת לביטול.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter className="flex-row-reverse gap-2">
                            <AlertDialogCancel>ביטול</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDeletePageTemplate(template.id)}
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
      </div>
    </AppLayout>
  );
}
