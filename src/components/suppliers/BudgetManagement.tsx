import { useState, useRef, useMemo } from "react";
import { NeonCard, NeonCardContent } from "@/components/ui/NeonCard";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
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
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Download, Plus, Import, Trash2, Edit2, Loader2, DollarSign } from "lucide-react";
import { useIssues, useSuppliers } from "@/hooks/useIssues";
import { useBudgetItems, useCreateBudgetItem, useUpdateBudgetItem, useDeleteBudgetItem, useImportLineupToBudget } from "@/hooks/useBudget";
import { useAuth } from "@/hooks/useAuth";
import { format } from "date-fns";
import { he } from "date-fns/locale";
import { toast } from "sonner";
import html2pdf from "html2pdf.js";

export function BudgetManagement() {
  const [selectedIssueId, setSelectedIssueId] = useState<string>("all");
  const [selectedSupplierId, setSelectedSupplierId] = useState<string>("all");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [formData, setFormData] = useState({
    issue_id: "",
    supplier_id: "",
    description: "",
    page_count: 0,
    amount: 0,
    notes: "",
  });
  const reportRef = useRef<HTMLDivElement>(null);
  
  const { user } = useAuth();
  const { data: issues } = useIssues();
  const { data: suppliers } = useSuppliers();
  const { data: budgetItems, isLoading } = useBudgetItems(selectedIssueId === "all" ? undefined : selectedIssueId);
  const createBudgetItem = useCreateBudgetItem();
  const updateBudgetItem = useUpdateBudgetItem();
  const deleteBudgetItem = useDeleteBudgetItem();
  const importLineup = useImportLineupToBudget();

  // Filter budget items
  const filteredItems = useMemo(() => {
    if (!budgetItems) return [];
    return budgetItems.filter(item => {
      const matchesSupplier = selectedSupplierId === "all" || item.supplier_id === selectedSupplierId;
      return matchesSupplier;
    });
  }, [budgetItems, selectedSupplierId]);

  // Group by supplier for summary
  const summaryBySupplier = useMemo(() => {
    const grouped: Record<string, { name: string; totalAmount: number; totalPages: number; count: number }> = {};
    filteredItems.forEach(item => {
      const supplierId = item.supplier_id || "unknown";
      const supplierName = item.supplier?.name || "ללא ספק";
      if (!grouped[supplierId]) {
        grouped[supplierId] = { name: supplierName, totalAmount: 0, totalPages: 0, count: 0 };
      }
      grouped[supplierId].totalAmount += Number(item.amount) || 0;
      grouped[supplierId].totalPages += item.page_count || 0;
      grouped[supplierId].count += 1;
    });
    return grouped;
  }, [filteredItems]);

  // Summary by issue
  const summaryByIssue = useMemo(() => {
    const grouped: Record<string, { name: string; totalAmount: number; count: number }> = {};
    filteredItems.forEach(item => {
      const issueId = item.issue_id;
      const issueName = item.issue ? `${item.issue.magazines?.name} #${item.issue.issue_number}` : "ללא גיליון";
      if (!grouped[issueId]) {
        grouped[issueId] = { name: issueName, totalAmount: 0, count: 0 };
      }
      grouped[issueId].totalAmount += Number(item.amount) || 0;
      grouped[issueId].count += 1;
    });
    return grouped;
  }, [filteredItems]);

  const totalAmount = useMemo(() => {
    return filteredItems.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
  }, [filteredItems]);

  const resetForm = () => {
    setFormData({
      issue_id: "",
      supplier_id: "",
      description: "",
      page_count: 0,
      amount: 0,
      notes: "",
    });
    setEditingItem(null);
  };

  const handleOpenAdd = () => {
    resetForm();
    setIsAddDialogOpen(true);
  };

  const handleOpenEdit = (item: any) => {
    setEditingItem(item);
    setFormData({
      issue_id: item.issue_id,
      supplier_id: item.supplier_id || "",
      description: item.description,
      page_count: item.page_count || 0,
      amount: Number(item.amount) || 0,
      notes: item.notes || "",
    });
    setIsAddDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    
    if (!formData.issue_id || !formData.description) {
      toast.error("נא למלא גיליון ותיאור");
      return;
    }

    if (editingItem) {
      await updateBudgetItem.mutateAsync({
        id: editingItem.id,
        supplier_id: formData.supplier_id || null,
        description: formData.description,
        page_count: formData.page_count,
        amount: formData.amount,
        notes: formData.notes || null,
      });
    } else {
      await createBudgetItem.mutateAsync({
        issue_id: formData.issue_id,
        supplier_id: formData.supplier_id || null,
        lineup_item_id: null,
        insert_id: null,
        description: formData.description,
        page_count: formData.page_count,
        amount: formData.amount,
        notes: formData.notes || null,
        created_by: user.id,
      });
    }

    setIsAddDialogOpen(false);
    resetForm();
  };

  const handleDelete = async (id: string, issueId: string) => {
    if (confirm("האם למחוק את הרשומה?")) {
      await deleteBudgetItem.mutateAsync({ id, issueId });
    }
  };

  const handleImportFromIssue = async (issueId: string) => {
    if (!user) return;
    await importLineup.mutateAsync({ issueId, userId: user.id });
  };

  const handleExportPdf = async () => {
    if (!reportRef.current) return;
    
    try {
      const opt = {
        margin: 10,
        filename: `budget-report-${format(new Date(), 'yyyy-MM-dd')}.pdf`,
        image: { type: 'jpeg' as const, quality: 0.98 },
        html2canvas: { scale: 2, backgroundColor: '#ffffff' },
        jsPDF: { unit: 'mm' as const, format: 'a4' as const, orientation: 'landscape' as const }
      };
      
      await html2pdf().set(opt).from(reportRef.current).save();
      toast.success('הדו״ח יוצא ל-PDF בהצלחה!');
    } catch (error) {
      toast.error('שגיאה בייצוא ה-PDF');
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('he-IL', { style: 'currency', currency: 'ILS' }).format(amount);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filters & Actions */}
      <div className="flex items-center gap-4 flex-wrap">
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">גיליון:</span>
          <Select value={selectedIssueId} onValueChange={setSelectedIssueId}>
            <SelectTrigger className="w-[250px]">
              <SelectValue placeholder="כל הגיליונות" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">כל הגיליונות</SelectItem>
              {issues?.map((issue) => (
                <SelectItem key={issue.id} value={issue.id}>
                  {issue.magazine?.name} - גיליון {issue.issue_number}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">ספק:</span>
          <Select value={selectedSupplierId} onValueChange={setSelectedSupplierId}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="כל הספקים" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">כל הספקים</SelectItem>
              {suppliers?.map((supplier) => (
                <SelectItem key={supplier.id} value={supplier.id}>
                  {supplier.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="mr-auto flex gap-2">
          {selectedIssueId !== "all" && (
            <Button
              variant="outline"
              onClick={() => handleImportFromIssue(selectedIssueId)}
              disabled={importLineup.isPending}
            >
              <Import className="w-4 h-4 ml-2" />
              ייבא מליינאפ
            </Button>
          )}
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={handleOpenAdd}>
                <Plus className="w-4 h-4 ml-2" />
                הוסף רשומה
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>{editingItem ? "עריכת רשומה" : "הוספת רשומה חדשה"}</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid gap-4">
                  <div>
                    <label className="text-sm font-medium">גיליון *</label>
                    <Select
                      value={formData.issue_id}
                      onValueChange={(v) => setFormData({ ...formData, issue_id: v })}
                      disabled={!!editingItem}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="בחר גיליון" />
                      </SelectTrigger>
                      <SelectContent>
                        {issues?.map((issue) => (
                          <SelectItem key={issue.id} value={issue.id}>
                            {issue.magazine?.name} - גיליון {issue.issue_number}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium">ספק</label>
                    <Select
                      value={formData.supplier_id || "none"}
                      onValueChange={(v) => setFormData({ ...formData, supplier_id: v === "none" ? "" : v })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="בחר ספק (אופציונלי)" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">ללא ספק</SelectItem>
                        {suppliers?.map((supplier) => (
                          <SelectItem key={supplier.id} value={supplier.id}>
                            {supplier.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium">תיאור *</label>
                    <Input
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      placeholder="תיאור התוכן"
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium">מספר עמודים</label>
                      <Input
                        type="number"
                        min={0}
                        value={formData.page_count}
                        onChange={(e) => setFormData({ ...formData, page_count: parseInt(e.target.value) || 0 })}
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium">סכום (₪)</label>
                      <Input
                        type="number"
                        min={0}
                        step="0.01"
                        value={formData.amount}
                        onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) || 0 })}
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium">הערות</label>
                    <Input
                      value={formData.notes}
                      onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                      placeholder="הערות (אופציונלי)"
                    />
                  </div>
                </div>
                
                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                    ביטול
                  </Button>
                  <Button type="submit" disabled={createBudgetItem.isPending || updateBudgetItem.isPending}>
                    {editingItem ? "עדכן" : "הוסף"}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
          
          <Button variant="outline" onClick={handleExportPdf}>
            <Download className="w-4 h-4 ml-2" />
            ייצוא PDF
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <NeonCard>
          <NeonCardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center">
                <DollarSign className="w-5 h-5 text-green-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">סה״כ תקציב</p>
                <p className="text-2xl font-bold text-green-500">{formatCurrency(totalAmount)}</p>
              </div>
            </div>
          </NeonCardContent>
        </NeonCard>
        
        <NeonCard>
          <NeonCardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-sky-500/10 flex items-center justify-center">
                <span className="text-xl font-bold text-sky-500">#</span>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">ספקים</p>
                <p className="text-2xl font-bold">{Object.keys(summaryBySupplier).length}</p>
              </div>
            </div>
          </NeonCardContent>
        </NeonCard>
        
        <NeonCard>
          <NeonCardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center">
                <span className="text-xl font-bold text-purple-500">{filteredItems.length}</span>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">רשומות</p>
                <p className="text-2xl font-bold">{filteredItems.length}</p>
              </div>
            </div>
          </NeonCardContent>
        </NeonCard>
      </div>

      {/* Report Content */}
      <div ref={reportRef} className="bg-background">
        {/* Budget Items Table */}
        <NeonCard>
          <NeonCardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-right">גיליון</TableHead>
                  <TableHead className="text-right">ספק</TableHead>
                  <TableHead className="text-right">תיאור</TableHead>
                  <TableHead className="text-right">עמודים</TableHead>
                  <TableHead className="text-right">סכום</TableHead>
                  <TableHead className="text-right">הערות</TableHead>
                  <TableHead className="text-center w-[100px]">פעולות</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredItems.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      אין רשומות להצגה
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredItems.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>
                        {item.issue?.magazines?.name} #{item.issue?.issue_number}
                      </TableCell>
                      <TableCell>{item.supplier?.name || "-"}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {item.description}
                          {item.lineup_item_id && (
                            <Badge variant="outline" className="text-xs">מדור</Badge>
                          )}
                          {item.insert_id && (
                            <Badge variant="outline" className="text-xs">שילוב</Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>{item.page_count || "-"}</TableCell>
                      <TableCell className="font-medium">
                        {formatCurrency(Number(item.amount) || 0)}
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {item.notes || "-"}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center justify-center gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleOpenEdit(item)}
                          >
                            <Edit2 className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(item.id, item.issue_id)}
                          >
                            <Trash2 className="w-4 h-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </NeonCardContent>
        </NeonCard>

        {/* Summary by Supplier */}
        {Object.keys(summaryBySupplier).length > 0 && (
          <div className="mt-6">
            <h3 className="font-medium mb-3">סיכום לפי ספק</h3>
            <NeonCard>
              <NeonCardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-right">ספק</TableHead>
                      <TableHead className="text-right">מספר רשומות</TableHead>
                      <TableHead className="text-right">סה״כ עמודים</TableHead>
                      <TableHead className="text-right">סה״כ סכום</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {Object.entries(summaryBySupplier).map(([id, data]) => (
                      <TableRow key={id}>
                        <TableCell className="font-medium">{data.name}</TableCell>
                        <TableCell>{data.count}</TableCell>
                        <TableCell>{data.totalPages}</TableCell>
                        <TableCell className="font-medium text-green-600 dark:text-green-400">
                          {formatCurrency(data.totalAmount)}
                        </TableCell>
                      </TableRow>
                    ))}
                    <TableRow className="bg-muted/50">
                      <TableCell className="font-bold">סה״כ</TableCell>
                      <TableCell className="font-bold">{filteredItems.length}</TableCell>
                      <TableCell className="font-bold">
                        {Object.values(summaryBySupplier).reduce((sum, d) => sum + d.totalPages, 0)}
                      </TableCell>
                      <TableCell className="font-bold text-green-600 dark:text-green-400">
                        {formatCurrency(totalAmount)}
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </NeonCardContent>
            </NeonCard>
          </div>
        )}

        {/* Summary by Issue */}
        {selectedIssueId === "all" && Object.keys(summaryByIssue).length > 0 && (
          <div className="mt-6">
            <h3 className="font-medium mb-3">סיכום לפי גיליון</h3>
            <NeonCard>
              <NeonCardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-right">גיליון</TableHead>
                      <TableHead className="text-right">מספר רשומות</TableHead>
                      <TableHead className="text-right">סה״כ סכום</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {Object.entries(summaryByIssue).map(([id, data]) => (
                      <TableRow key={id}>
                        <TableCell className="font-medium">{data.name}</TableCell>
                        <TableCell>{data.count}</TableCell>
                        <TableCell className="font-medium text-green-600 dark:text-green-400">
                          {formatCurrency(data.totalAmount)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </NeonCardContent>
            </NeonCard>
          </div>
        )}
      </div>
    </div>
  );
}
