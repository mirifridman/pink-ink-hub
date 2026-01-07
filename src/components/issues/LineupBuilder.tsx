import { useState, useEffect, useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Trash2, Save } from "lucide-react";
import { PagePickerModal } from "./PagePickerModal";
import { SupplierSelect } from "./SupplierSelect";
import { NewIssueData } from "./NewIssueModal";
import { useCreateIssue, useCreateLineupItem, useCreateInsert, useLineupItems } from "@/hooks/useIssues";
import { useAuth } from "@/hooks/useAuth";
import { format } from "date-fns";
import { he } from "date-fns/locale";
import { useNavigate, useBlocker } from "react-router-dom";
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
} from "@/components/ui/alert-dialog";

interface LineupBuilderProps {
  issueData: NewIssueData;
  onBack: () => void;
  onClose: () => void;
}

interface LineupRow {
  id: string;
  pages: number[];
  content: string;
  supplierId?: string;
  source: string;
  notes: string;
}

interface InsertRow {
  id: string;
  name: string;
  description: string;
  supplierId?: string;
  notes: string;
}

const AUTO_SAVE_INTERVAL = 2 * 60 * 1000; // 2 minutes

export function LineupBuilder({ issueData, onBack, onClose }: LineupBuilderProps) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const createIssue = useCreateIssue();
  const createLineupItem = useCreateLineupItem();
  const createInsert = useCreateInsert();
  
  const [lineupRows, setLineupRows] = useState<LineupRow[]>([]);
  const [hasInserts, setHasInserts] = useState(false);
  const [insertRows, setInsertRows] = useState<InsertRow[]>([]);
  const [pagePickerOpen, setPagePickerOpen] = useState(false);
  const [editingRowId, setEditingRowId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [savedIssueId, setSavedIssueId] = useState<string | null>(null);
  const [lastAutoSave, setLastAutoSave] = useState<Date | null>(null);
  const [showExitDialog, setShowExitDialog] = useState(false);
  const hasChangesRef = useRef(false);
  const pendingNavigationRef = useRef<(() => void) | null>(null);

  // Load from source issue if copying lineup
  const { data: sourceLineupItems } = useLineupItems(issueData.copy_lineup_from);

  useEffect(() => {
    if (issueData.copy_lineup_from && sourceLineupItems) {
      const copiedRows = sourceLineupItems.map((item, idx) => ({
        id: `copied-${idx}`,
        pages: Array.from({ length: item.page_end - item.page_start + 1 }, (_, i) => item.page_start + i),
        content: item.content,
        supplierId: item.supplier_id || undefined,
        source: item.source || "",
        notes: item.notes || "",
      }));
      setLineupRows(copiedRows);
    }
  }, [sourceLineupItems, issueData.copy_lineup_from]);

  // Track if there are unsaved changes
  useEffect(() => {
    hasChangesRef.current = (lineupRows.length > 0 || insertRows.length > 0) && !savedIssueId;
  }, [lineupRows, insertRows, savedIssueId]);

  // Block navigation when there are unsaved changes
  const blocker = useBlocker(
    ({ currentLocation, nextLocation }) =>
      hasChangesRef.current && 
      currentLocation.pathname !== nextLocation.pathname
  );

  useEffect(() => {
    if (blocker.state === "blocked") {
      pendingNavigationRef.current = () => blocker.proceed?.();
      setShowExitDialog(true);
    }
  }, [blocker.state]);

  // Auto-save every 2 minutes
  useEffect(() => {
    if (savedIssueId) return; // Already saved, no need for auto-save
    
    const interval = setInterval(() => {
      if (hasChangesRef.current && !saving) {
        handleAutoSave();
      }
    }, AUTO_SAVE_INTERVAL);

    return () => clearInterval(interval);
  }, [savedIssueId, saving]);

  const occupiedPages = lineupRows.flatMap(row => 
    editingRowId !== row.id ? row.pages : []
  );

  const totalDefinedPages = lineupRows.reduce((sum, row) => sum + row.pages.length, 0);
  const currentEditingRow = lineupRows.find(r => r.id === editingRowId);

  const addRow = () => {
    const newRow: LineupRow = {
      id: `new-${Date.now()}`,
      pages: [],
      content: "",
      supplierId: undefined,
      source: "",
      notes: "",
    };
    setLineupRows([...lineupRows, newRow]);
  };

  const updateRow = (id: string, updates: Partial<LineupRow>) => {
    setLineupRows(rows =>
      rows.map(row => (row.id === id ? { ...row, ...updates } : row))
    );
  };

  const deleteRow = (id: string) => {
    setLineupRows(rows => rows.filter(row => row.id !== id));
  };

  const addInsertRow = () => {
    const newRow: InsertRow = {
      id: `insert-${Date.now()}`,
      name: "",
      description: "",
      supplierId: undefined,
      notes: "",
    };
    setInsertRows([...insertRows, newRow]);
  };

  const updateInsertRow = (id: string, updates: Partial<InsertRow>) => {
    setInsertRows(rows =>
      rows.map(row => (row.id === id ? { ...row, ...updates } : row))
    );
  };

  const deleteInsertRow = (id: string) => {
    setInsertRows(rows => rows.filter(row => row.id !== id));
  };

  const handleAutoSave = async () => {
    if (!user || saving || savedIssueId) return;
    
    // Only auto-save if there's actual content
    const hasContent = lineupRows.some(row => row.content || row.pages.length > 0);
    if (!hasContent) return;

    await handleSave(true, true);
  };

  const handleSave = async (asDraft: boolean, isAutoSave = false) => {
    if (!user) return;

    setSaving(true);
    try {
      // Create the issue
      const issue = await createIssue.mutateAsync({
        magazine_id: issueData.magazine_id,
        issue_number: issueData.issue_number,
        template_pages: issueData.template_pages,
        distribution_month: format(issueData.distribution_month, "yyyy-MM-dd"),
        theme: issueData.theme,
        design_start_date: format(issueData.design_start_date, "yyyy-MM-dd"),
        sketch_close_date: format(issueData.sketch_close_date, "yyyy-MM-dd"),
        print_date: format(issueData.print_date, "yyyy-MM-dd"),
        status: asDraft ? "draft" : "in_progress",
        created_by: user.id,
      });

      setSavedIssueId(issue.id);

      // Create lineup items
      for (const row of lineupRows) {
        if (row.pages.length > 0 && row.content) {
          const sortedPages = [...row.pages].sort((a, b) => a - b);
          await createLineupItem.mutateAsync({
            issue_id: issue.id,
            page_start: sortedPages[0],
            page_end: sortedPages[sortedPages.length - 1],
            content: row.content,
            supplier_id: row.supplierId || null,
            source: row.source || null,
            notes: row.notes || null,
            text_ready: false,
            files_ready: false,
            is_designed: false,
            designer_notes: null,
          });
        }
      }

      // Create inserts
      if (hasInserts) {
        for (const insert of insertRows) {
          if (insert.name) {
            await createInsert.mutateAsync({
              issue_id: issue.id,
              name: insert.name,
              description: insert.description || null,
              supplier_id: insert.supplierId || null,
              notes: insert.notes || null,
              text_ready: false,
              files_ready: false,
              is_designed: false,
              designer_notes: null,
            });
          }
        }
      }

      if (isAutoSave) {
        setLastAutoSave(new Date());
        toast.success("נשמר אוטומטית כטיוטה", { duration: 2000 });
      } else {
        toast.success(asDraft ? "הגיליון נשמר כטיוטה" : "הגיליון נוצר בהצלחה");
        onClose();
        navigate(`/issues?view=${issue.id}`);
      }
    } catch (error) {
      console.error("Error creating issue:", error);
      if (isAutoSave) {
        toast.error("שגיאה בשמירה אוטומטית");
      }
    } finally {
      setSaving(false);
    }
  };

  const handleExitWithSave = async () => {
    await handleSave(true);
    setShowExitDialog(false);
    pendingNavigationRef.current?.();
  };

  const handleExitWithoutSave = () => {
    hasChangesRef.current = false;
    setShowExitDialog(false);
    pendingNavigationRef.current?.();
  };

  const handleCancelExit = () => {
    setShowExitDialog(false);
    blocker.reset?.();
    pendingNavigationRef.current = null;
  };

  const formatPages = (pages: number[]) => {
    if (pages.length === 0) return "—";
    const sorted = [...pages].sort((a, b) => a - b);
    if (sorted.length === 1) return sorted[0].toString();
    const first = sorted[0];
    const last = sorted[sorted.length - 1];
    if (last - first + 1 === sorted.length) {
      return `${first}-${last}`;
    }
    return sorted.join(", ");
  };

  return (
    <div className="space-y-6" dir="rtl">
      {/* Header */}
      <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
        <div>
          <h3 className="font-rubik font-bold text-lg">
            גיליון #{issueData.issue_number} - {issueData.theme}
          </h3>
          <p className="text-sm text-muted-foreground">
            {format(issueData.distribution_month, "MMMM yyyy", { locale: he })}
          </p>
        </div>
        <div className="text-left">
          <p className="text-sm font-medium">תבנית: {issueData.template_pages} עמודים</p>
          <p className="text-sm text-muted-foreground">
            הוגדרו: {totalDefinedPages}/{issueData.template_pages}
          </p>
          {lastAutoSave && (
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <Save className="w-3 h-3" />
              נשמר אוטומטית ב-{format(lastAutoSave, "HH:mm")}
            </p>
          )}
        </div>
      </div>

      {/* Lineup Table */}
      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-right w-24">עמוד</TableHead>
              <TableHead className="text-right">תוכן</TableHead>
              <TableHead className="text-right w-40">ספק</TableHead>
              <TableHead className="text-right w-32">מקור</TableHead>
              <TableHead className="text-right w-40">הערות</TableHead>
              <TableHead className="w-12"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {lineupRows.map((row) => (
              <TableRow key={row.id}>
                <TableCell>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setEditingRowId(row.id);
                      setPagePickerOpen(true);
                    }}
                    className="w-full justify-center"
                  >
                    {formatPages(row.pages)}
                  </Button>
                </TableCell>
                <TableCell>
                  <Input
                    value={row.content}
                    onChange={(e) => updateRow(row.id, { content: e.target.value })}
                    placeholder="תוכן העמוד"
                  />
                </TableCell>
                <TableCell>
                  <SupplierSelect
                    value={row.supplierId}
                    onChange={(id) => updateRow(row.id, { supplierId: id })}
                  />
                </TableCell>
                <TableCell>
                  <Input
                    value={row.source}
                    onChange={(e) => updateRow(row.id, { source: e.target.value })}
                    placeholder="מקור"
                  />
                </TableCell>
                <TableCell>
                  <Input
                    value={row.notes}
                    onChange={(e) => updateRow(row.id, { notes: e.target.value })}
                    placeholder="הערות"
                  />
                </TableCell>
                <TableCell>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => deleteRow(row.id)}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        <div className="p-2 border-t">
          <Button variant="ghost" onClick={addRow} className="w-full">
            <Plus className="w-4 h-4 ml-2" />
            הוסף פריט
          </Button>
        </div>
      </div>

      {/* Inserts Section */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Checkbox
            id="has-inserts"
            checked={hasInserts}
            onCheckedChange={(checked) => setHasInserts(checked as boolean)}
          />
          <Label htmlFor="has-inserts" className="cursor-pointer font-medium">
            יש אינסרטים
          </Label>
        </div>

        {hasInserts && (
          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-right">שם האינסרט</TableHead>
                  <TableHead className="text-right">תיאור</TableHead>
                  <TableHead className="text-right w-40">ספק</TableHead>
                  <TableHead className="text-right w-40">הערות</TableHead>
                  <TableHead className="w-12"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {insertRows.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell>
                      <Input
                        value={row.name}
                        onChange={(e) => updateInsertRow(row.id, { name: e.target.value })}
                        placeholder="שם האינסרט"
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        value={row.description}
                        onChange={(e) => updateInsertRow(row.id, { description: e.target.value })}
                        placeholder="תיאור"
                      />
                    </TableCell>
                    <TableCell>
                      <SupplierSelect
                        value={row.supplierId}
                        onChange={(id) => updateInsertRow(row.id, { supplierId: id })}
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        value={row.notes}
                        onChange={(e) => updateInsertRow(row.id, { notes: e.target.value })}
                        placeholder="הערות"
                      />
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => deleteInsertRow(row.id)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            <div className="p-2 border-t">
              <Button variant="ghost" onClick={addInsertRow} className="w-full">
                <Plus className="w-4 h-4 ml-2" />
                הוסף אינסרט
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex justify-between pt-4 border-t">
        <Button variant="outline" onClick={onBack}>
          חזור
        </Button>
        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={() => handleSave(true)}
            disabled={saving}
          >
            <Save className="w-4 h-4 ml-2" />
            שמור כטיוטה
          </Button>
          <Button
            onClick={() => handleSave(false)}
            disabled={saving}
            className="gradient-neon text-white"
          >
            צור גיליון
          </Button>
        </div>
      </div>

      {/* Page Picker Modal */}
      <PagePickerModal
        open={pagePickerOpen}
        onOpenChange={setPagePickerOpen}
        templatePages={issueData.template_pages}
        occupiedPages={occupiedPages}
        selectedPages={currentEditingRow?.pages || []}
        onSelect={(pages) => {
          if (editingRowId) {
            updateRow(editingRowId, { pages });
          }
        }}
      />

      {/* Exit Confirmation Dialog */}
      <AlertDialog open={showExitDialog} onOpenChange={setShowExitDialog}>
        <AlertDialogContent dir="rtl">
          <AlertDialogHeader>
            <AlertDialogTitle>לצאת מהתהליך?</AlertDialogTitle>
            <AlertDialogDescription>
              יש לך שינויים שלא נשמרו. האם לשמור כטיוטה לפני היציאה?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex gap-2 sm:gap-0">
            <AlertDialogCancel onClick={handleCancelExit}>
              המשך בעריכה
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleExitWithoutSave}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              צא ללא שמירה
            </AlertDialogAction>
            <AlertDialogAction onClick={handleExitWithSave}>
              שמור וצא
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
