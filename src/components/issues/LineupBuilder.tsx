import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Trash2, Save, GripVertical, ArrowUpDown, ChevronUp, ChevronDown, ArrowLeftRight } from "lucide-react";
import { PagePickerModal } from "./PagePickerModal";
import { MultiSupplierSelect } from "./MultiSupplierSelect";
import { EditorSelect } from "./EditorSelect";
import { IssueEditorsSection } from "./IssueEditorsSection";
import { NewIssueData } from "./NewIssueModal";
import { ContentTypeSelect } from "@/components/lineup/ContentTypeSelect";
import { 
  useCreateIssue, useUpdateIssue, useCreateLineupItem, useUpdateLineupItem, 
  useDeleteLineupItem, useCreateInsert, useUpdateInsert, useDeleteInsert, 
  useLineupItems, useInserts, useEditors, useIssueEditors, useAddIssueEditor, 
  useRemoveIssueEditor 
} from "@/hooks/useIssues";
import { useAuth } from "@/hooks/useAuth";
import { format } from "date-fns";
import { he } from "date-fns/locale";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface LineupBuilderProps {
  issueData: NewIssueData;
  existingIssueId?: string; // For editing existing drafts
  onBack: () => void;
  onClose: () => void;
}

interface LineupRow {
  id: string;
  pages: number[];
  contentType: string;
  content: string;
  supplierIds: string[];
  source: string;
  notes: string;
  responsibleEditorId?: string;
}

interface InsertRow {
  id: string;
  name: string;
  description: string;
  supplierIds: string[];
  notes: string;
  responsibleEditorId?: string;
}

const AUTO_SAVE_INTERVAL = 2 * 60 * 1000; // 2 minutes

export function LineupBuilder({ issueData, existingIssueId, onBack, onClose }: LineupBuilderProps) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const createIssue = useCreateIssue();
  const updateIssue = useUpdateIssue();
  const createLineupItem = useCreateLineupItem();
  const updateLineupItem = useUpdateLineupItem();
  const deleteLineupItem = useDeleteLineupItem();
  const createInsert = useCreateInsert();
  const updateInsert = useUpdateInsert();
  const deleteInsert = useDeleteInsert();
  const addIssueEditor = useAddIssueEditor();
  const removeIssueEditor = useRemoveIssueEditor();
  
  // Editors data
  const { data: allEditors = [] } = useEditors();
  const { data: issueEditors = [] } = useIssueEditors(existingIssueId);
  const [pendingEditors, setPendingEditors] = useState<string[]>(issueData.editor_ids || []);
  
  const [lineupRows, setLineupRows] = useState<LineupRow[]>([]);
  const [hasInserts, setHasInserts] = useState(false);
  const [insertRows, setInsertRows] = useState<InsertRow[]>([]);
  const [pagePickerOpen, setPagePickerOpen] = useState(false);
  const [editingRowId, setEditingRowId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [savedIssueId, setSavedIssueId] = useState<string | null>(existingIssueId || null);
  const [lastAutoSave, setLastAutoSave] = useState<Date | null>(null);
  const [showExitDialog, setShowExitDialog] = useState(false);
  const hasChangesRef = useRef(false);
  const pendingNavigationRef = useRef<(() => void) | null>(null);
  const [draggedRowId, setDraggedRowId] = useState<string | null>(null);
  const [showSwapModal, setShowSwapModal] = useState(false);
  const [swapSourceRow, setSwapSourceRow] = useState<LineupRow | null>(null);
  const [swapTargetId, setSwapTargetId] = useState<string>("");
  const [initialLoadDone, setInitialLoadDone] = useState(false);

  // Load existing lineup items if editing a draft
  const { data: existingLineupItems } = useLineupItems(existingIssueId);
  const { data: existingInserts } = useInserts(existingIssueId);
  
  // Load from source issue if copying lineup
  const { data: sourceLineupItems } = useLineupItems(issueData.copy_lineup_from);

  // Load existing data when editing a draft
  useEffect(() => {
    if (existingIssueId && existingLineupItems && !initialLoadDone) {
      const rows = existingLineupItems.map((item) => ({
        id: item.id,
        pages: Array.from({ length: item.page_end - item.page_start + 1 }, (_, i) => item.page_start + i),
        contentType: (item as any).content_type || "",
        content: item.content,
        supplierIds: item.supplier_id ? [item.supplier_id] : [],
        source: item.source || "",
        notes: item.notes || "",
        responsibleEditorId: (item as any).responsible_editor_id || undefined,
      }));
      setLineupRows(rows);
      setInitialLoadDone(true);
    }
  }, [existingIssueId, existingLineupItems, initialLoadDone]);

  // Load existing inserts when editing a draft
  useEffect(() => {
    if (existingIssueId && existingInserts && existingInserts.length > 0 && !initialLoadDone) {
      setHasInserts(true);
      const rows = existingInserts.map((item) => ({
        id: item.id,
        name: item.name,
        description: item.description || "",
        supplierIds: item.supplier_id ? [item.supplier_id] : [],
        notes: item.notes || "",
        responsibleEditorId: (item as any).responsible_editor_id || undefined,
      }));
      setInsertRows(rows);
    }
  }, [existingIssueId, existingInserts, initialLoadDone]);

  // Load from source issue if copying lineup (for new issues)
  useEffect(() => {
    if (!existingIssueId && issueData.copy_lineup_from && sourceLineupItems) {
      const copiedRows = sourceLineupItems.map((item, idx) => ({
        id: `copied-${idx}`,
        pages: Array.from({ length: item.page_end - item.page_start + 1 }, (_, i) => item.page_start + i),
        contentType: (item as any).content_type || "",
        content: item.content,
        supplierIds: item.supplier_id ? [item.supplier_id] : [],
        source: item.source || "",
        notes: item.notes || "",
        responsibleEditorId: undefined,
      }));
      setLineupRows(copiedRows);
    }
  }, [existingIssueId, sourceLineupItems, issueData.copy_lineup_from]);

  // Track if there are unsaved changes
  useEffect(() => {
    hasChangesRef.current = (lineupRows.length > 0 || insertRows.length > 0) && !savedIssueId;
  }, [lineupRows, insertRows, savedIssueId]);

  // Warn before browser close/refresh
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasChangesRef.current) {
        e.preventDefault();
        e.returnValue = '';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, []);

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
      contentType: "",
      content: "",
      supplierIds: [],
      source: "",
      notes: "",
      responsibleEditorId: undefined,
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

  const moveRow = (fromIndex: number, toIndex: number) => {
    if (fromIndex === toIndex) return;
    setLineupRows(rows => {
      const newRows = [...rows];
      const [removed] = newRows.splice(fromIndex, 1);
      newRows.splice(toIndex, 0, removed);
      return newRows;
    });
  };

  const swapRowPages = (id1: string, id2: string) => {
    setLineupRows(rows => {
      const row1 = rows.find(r => r.id === id1);
      const row2 = rows.find(r => r.id === id2);
      if (!row1 || !row2) return rows;
      
      return rows.map(row => {
        if (row.id === id1) return { ...row, pages: row2.pages };
        if (row.id === id2) return { ...row, pages: row1.pages };
        return row;
      });
    });
  };

  const handleDragStart = (e: React.DragEvent, id: string) => {
    setDraggedRowId(id);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    if (!draggedRowId || draggedRowId === targetId) {
      setDraggedRowId(null);
      return;
    }
    
    const fromIndex = lineupRows.findIndex(r => r.id === draggedRowId);
    const toIndex = lineupRows.findIndex(r => r.id === targetId);
    moveRow(fromIndex, toIndex);
    setDraggedRowId(null);
  };

  const openSwapModal = (row: LineupRow) => {
    setSwapSourceRow(row);
    setSwapTargetId("");
    setShowSwapModal(true);
  };

  const executeSwap = () => {
    if (swapSourceRow && swapTargetId) {
      swapRowPages(swapSourceRow.id, swapTargetId);
      setShowSwapModal(false);
      setSwapSourceRow(null);
      setSwapTargetId("");
      toast.success("העמודים הוחלפו בהצלחה");
    }
  };

  const moveRowUp = (index: number) => {
    if (index > 0) {
      moveRow(index, index - 1);
    }
  };

  const moveRowDown = (index: number) => {
    if (index < lineupRows.length - 1) {
      moveRow(index, index + 1);
    }
  };

  const addInsertRow = () => {
    const newRow: InsertRow = {
      id: `insert-${Date.now()}`,
      name: "",
      description: "",
      supplierIds: [],
      notes: "",
      responsibleEditorId: undefined,
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
      let issueId = savedIssueId;
      
      if (existingIssueId) {
        // Update existing issue
        await updateIssue.mutateAsync({
          id: existingIssueId,
          status: asDraft ? "draft" : "in_progress",
        });
        issueId = existingIssueId;
        
        // For existing issues, we need to update/create/delete lineup items
        // Get the IDs of rows that were originally loaded
        const existingRowIds = existingLineupItems?.map(item => item.id) || [];
        const currentRowIds = lineupRows.map(row => row.id);
        
        // Delete removed items
        for (const existingId of existingRowIds) {
          if (!currentRowIds.includes(existingId)) {
            await deleteLineupItem.mutateAsync({ id: existingId, issueId: existingIssueId });
          }
        }
        
        // Update or create items
        for (const row of lineupRows) {
          if (row.pages.length > 0 && row.content) {
            const sortedPages = [...row.pages].sort((a, b) => a - b);
            const isExisting = existingRowIds.includes(row.id);
            
            if (isExisting) {
              await updateLineupItem.mutateAsync({
                id: row.id,
                page_start: sortedPages[0],
                page_end: sortedPages[sortedPages.length - 1],
                content: row.content,
                content_type: row.contentType || null,
                supplier_id: row.supplierIds[0] || null,
                source: row.source || null,
                notes: row.notes || null,
                responsible_editor_id: row.responsibleEditorId || null,
              } as any);
            } else {
              await createLineupItem.mutateAsync({
                issue_id: existingIssueId,
                page_start: sortedPages[0],
                page_end: sortedPages[sortedPages.length - 1],
                content: row.content,
                content_type: row.contentType || null,
                supplier_id: row.supplierIds[0] || null,
                source: row.source || null,
                notes: row.notes || null,
                text_ready: false,
                files_ready: false,
                is_designed: false,
                designer_notes: null,
                responsible_editor_id: row.responsibleEditorId || null,
              } as any);
            }
          }
        }
        
        // Handle inserts similarly
        const existingInsertIds = existingInserts?.map(item => item.id) || [];
        const currentInsertIds = insertRows.map(row => row.id);
        
        // Delete removed inserts
        for (const existingId of existingInsertIds) {
          if (!currentInsertIds.includes(existingId)) {
            await deleteInsert.mutateAsync({ id: existingId, issueId: existingIssueId });
          }
        }
        
        // Update or create inserts
        if (hasInserts) {
          for (const insert of insertRows) {
            if (insert.name) {
              const isExisting = existingInsertIds.includes(insert.id);
              
              if (isExisting) {
                await updateInsert.mutateAsync({
                  id: insert.id,
                  name: insert.name,
                  description: insert.description || null,
                  supplier_id: insert.supplierIds[0] || null,
                  notes: insert.notes || null,
                  responsible_editor_id: insert.responsibleEditorId || null,
                } as any);
              } else {
                await createInsert.mutateAsync({
                  issue_id: existingIssueId,
                  name: insert.name,
                  description: insert.description || null,
                  supplier_id: insert.supplierIds[0] || null,
                  notes: insert.notes || null,
                  text_ready: false,
                  files_ready: false,
                  is_designed: false,
                  designer_notes: null,
                  responsible_editor_id: insert.responsibleEditorId || null,
                } as any);
              }
            }
          }
        }
      } else {
        // Create new issue
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
          hebrew_month: issueData.hebrew_month || null,
        } as any);

        issueId = issue.id;
        setSavedIssueId(issue.id);

        // Add editors for new issue
        for (const editorId of pendingEditors) {
          await addIssueEditor.mutateAsync({ issueId: issue.id, editorId });
        }

        // Create lineup items
        for (const row of lineupRows) {
          if (row.pages.length > 0 && row.content) {
            const sortedPages = [...row.pages].sort((a, b) => a - b);
            await createLineupItem.mutateAsync({
              issue_id: issue.id,
              page_start: sortedPages[0],
              page_end: sortedPages[sortedPages.length - 1],
              content: row.content,
              content_type: row.contentType || null,
              supplier_id: row.supplierIds[0] || null,
              source: row.source || null,
              notes: row.notes || null,
              text_ready: false,
              files_ready: false,
              is_designed: false,
              designer_notes: null,
              responsible_editor_id: row.responsibleEditorId || null,
            } as any);
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
                supplier_id: insert.supplierIds[0] || null,
                notes: insert.notes || null,
                text_ready: false,
                files_ready: false,
                is_designed: false,
                designer_notes: null,
                responsible_editor_id: insert.responsibleEditorId || null,
              } as any);
            }
          }
        }
      }

      if (isAutoSave) {
        setLastAutoSave(new Date());
        toast.success("נשמר אוטומטית", { duration: 2000 });
      } else {
        toast.success(asDraft ? "הגיליון נשמר כטיוטה" : "הגיליון נשמר בהצלחה");
        onClose();
        navigate(`/issues?view=${issueId}`);
      }
    } catch (error) {
      console.error("Error saving issue:", error);
      if (isAutoSave) {
        toast.error("שגיאה בשמירה אוטומטית");
      } else {
        toast.error("שגיאה בשמירה");
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
    pendingNavigationRef.current = null;
  };

  const handleBackClick = () => {
    if (hasChangesRef.current) {
      pendingNavigationRef.current = onBack;
      setShowExitDialog(true);
    } else {
      onBack();
    }
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

  // Selected editors from issue_editors or pending for new issue
  const selectedEditorsDisplay = existingIssueId
    ? issueEditors.map((ie) => ({
        id: ie.id,
        editor_id: ie.editor_id,
        editor: ie.editor,
      }))
    : pendingEditors.map((editorId, idx) => ({
        id: `pending-${idx}`,
        editor_id: editorId,
        editor: allEditors.find((e) => e.id === editorId) || null,
      }));

  const handleAddEditorToIssue = async (editorId: string) => {
    if (existingIssueId) {
      await addIssueEditor.mutateAsync({ issueId: existingIssueId, editorId });
    } else {
      setPendingEditors((prev) => [...prev, editorId]);
    }
  };

  const handleRemoveEditorFromIssue = async (id: string) => {
    if (existingIssueId) {
      await removeIssueEditor.mutateAsync({ id, issueId: existingIssueId });
    } else {
      const idx = parseInt(id.replace("pending-", ""));
      setPendingEditors((prev) => prev.filter((_, i) => i !== idx));
    }
  };

  // Get editors assigned to this issue for the responsible editor dropdown
  const assignedEditors = existingIssueId
    ? issueEditors.map((ie) => ie.editor).filter(Boolean) as { id: string; full_name: string | null; email: string | null }[]
    : allEditors.filter((e) => pendingEditors.includes(e.id));

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

      {/* Issue Editors Section */}
      <div className="p-4 border rounded-lg bg-muted/30">
        <IssueEditorsSection
          selectedEditors={selectedEditorsDisplay}
          availableEditors={allEditors}
          onAddEditor={handleAddEditorToIssue}
          onRemoveEditor={handleRemoveEditorFromIssue}
        />
      </div>

      {/* Lineup Table */}
      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-24 text-center">סדר</TableHead>
              <TableHead className="text-right w-24">עמוד</TableHead>
              <TableHead className="text-right w-32">סוג תוכן</TableHead>
              <TableHead className="text-right">תוכן</TableHead>
              <TableHead className="text-right w-40">ספק</TableHead>
              <TableHead className="text-right w-32">הערות</TableHead>
              {assignedEditors.length > 0 && (
                <TableHead className="text-right w-36">עורך אחראי</TableHead>
              )}
              <TableHead className="w-20"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {lineupRows.map((row, index) => (
              <TableRow 
                key={row.id}
                draggable
                onDragStart={(e) => handleDragStart(e, row.id)}
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, row.id)}
                className={cn(
                  "cursor-move transition-colors",
                  draggedRowId === row.id && "opacity-50 bg-muted"
                )}
              >
                <TableCell className="p-1">
                  <div className="flex items-center justify-center gap-0.5">
                    <div className="flex flex-col">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={() => moveRowUp(index)}
                        disabled={index === 0}
                        title="הזז למעלה"
                      >
                        <ChevronUp className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={() => moveRowDown(index)}
                        disabled={index === lineupRows.length - 1}
                        title="הזז למטה"
                      >
                        <ChevronDown className="w-4 h-4" />
                      </Button>
                    </div>
                    <GripVertical className="w-4 h-4 text-muted-foreground cursor-grab" />
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => openSwapModal(row)}
                      title="החלף עמודים עם פריט אחר"
                      disabled={lineupRows.length < 2}
                    >
                      <ArrowLeftRight className="w-4 h-4" />
                    </Button>
                  </div>
                </TableCell>
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
                  <ContentTypeSelect
                    value={row.contentType}
                    onChange={(val) => updateRow(row.id, { contentType: val })}
                    placeholder="בחר סוג"
                    className="w-full"
                  />
                </TableCell>
                <TableCell>
                  <Input
                    value={row.content}
                    onChange={(e) => updateRow(row.id, { content: e.target.value })}
                    placeholder="תוכן העמוד"
                  />
                </TableCell>
                <TableCell>
                  <MultiSupplierSelect
                    value={row.supplierIds}
                    onChange={(ids) => updateRow(row.id, { supplierIds: ids })}
                  />
                </TableCell>
                <TableCell>
                  <Input
                    value={row.notes}
                    onChange={(e) => updateRow(row.id, { notes: e.target.value })}
                    placeholder="הערות"
                  />
                </TableCell>
                {assignedEditors.length > 0 && (
                  <TableCell>
                    <EditorSelect
                      value={row.responsibleEditorId}
                      onChange={(id) => updateRow(row.id, { responsibleEditorId: id })}
                      editors={assignedEditors}
                      placeholder="בחר עורך"
                    />
                  </TableCell>
                )}
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
                  <TableHead className="text-right w-32">הערות</TableHead>
                  {assignedEditors.length > 0 && (
                    <TableHead className="text-right w-36">עורך אחראי</TableHead>
                  )}
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
                      <MultiSupplierSelect
                        value={row.supplierIds}
                        onChange={(ids) => updateInsertRow(row.id, { supplierIds: ids })}
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        value={row.notes}
                        onChange={(e) => updateInsertRow(row.id, { notes: e.target.value })}
                        placeholder="הערות"
                      />
                    </TableCell>
                    {assignedEditors.length > 0 && (
                      <TableCell>
                        <EditorSelect
                          value={row.responsibleEditorId}
                          onChange={(id) => updateInsertRow(row.id, { responsibleEditorId: id })}
                          editors={assignedEditors}
                          placeholder="בחר עורך"
                        />
                      </TableCell>
                    )}
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
        <Button variant="outline" onClick={handleBackClick}>
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

      {/* Swap Pages Modal */}
      <Dialog open={showSwapModal} onOpenChange={setShowSwapModal}>
        <DialogContent dir="rtl" className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>החלפת עמודים</DialogTitle>
            <DialogDescription>
              {swapSourceRow && (
                <>
                  בחר פריט להחלפת עמודים עם: <strong>{swapSourceRow.content || "ללא שם"}</strong>
                  {swapSourceRow.pages.length > 0 && (
                    <span className="mr-1">(עמ׳ {formatPages(swapSourceRow.pages)})</span>
                  )}
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Select value={swapTargetId} onValueChange={setSwapTargetId}>
              <SelectTrigger>
                <SelectValue placeholder="בחר פריט להחלפה" />
              </SelectTrigger>
              <SelectContent>
                {lineupRows
                  .filter(r => r.id !== swapSourceRow?.id && r.pages.length > 0)
                  .map(row => (
                    <SelectItem key={row.id} value={row.id}>
                      {row.content || "ללא שם"} (עמ׳ {formatPages(row.pages)})
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setShowSwapModal(false)}>
              ביטול
            </Button>
            <Button onClick={executeSwap} disabled={!swapTargetId}>
              <ArrowLeftRight className="w-4 h-4 ml-2" />
              החלף עמודים
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
