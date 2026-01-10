import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Download, FileText, Loader2, CalendarIcon } from "lucide-react";
import { useIssues, useSuppliers } from "@/hooks/useIssues";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { format, isWithinInterval, parseISO, startOfDay, endOfDay } from "date-fns";
import { he } from "date-fns/locale";
import { toast } from "sonner";
import html2pdf from "html2pdf.js";
import { cn } from "@/lib/utils";

interface SupplierAssignment {
  supplier_id: string;
  supplier_name: string;
  supplier_type: string | null;
  issue_id: string;
  issue_number: number;
  magazine_name: string;
  theme: string;
  content: string;
  page_start: number;
  page_end: number;
  type: 'lineup' | 'insert';
  lineup_item_id?: string;
  insert_id?: string;
  created_at: string;
  amount: number;
}

type ReportType = "detailed" | "summary";

export function SupplierAssignmentsReport() {
  const [selectedIssueId, setSelectedIssueId] = useState<string>("all");
  const [selectedSupplierId, setSelectedSupplierId] = useState<string>("all");
  const [dateFrom, setDateFrom] = useState<Date | undefined>(undefined);
  const [dateTo, setDateTo] = useState<Date | undefined>(undefined);
  const reportRef = useRef<HTMLDivElement>(null);
  
  const { data: issues } = useIssues();
  const { data: suppliers } = useSuppliers();

  // Fetch all lineup items with supplier info and budget
  const { data: assignments, isLoading } = useQuery({
    queryKey: ['supplier-assignments-with-budget'],
    queryFn: async () => {
      // Fetch lineup items
      const { data: lineupItems, error: lineupError } = await supabase
        .from('lineup_items')
        .select(`
          id,
          content,
          page_start,
          page_end,
          supplier_id,
          issue_id,
          created_at,
          suppliers (id, name, supplier_type),
          issues (id, issue_number, theme, magazine_id, magazines (name))
        `)
        .not('supplier_id', 'is', null);

      if (lineupError) throw lineupError;

      // Fetch inserts
      const { data: inserts, error: insertsError } = await supabase
        .from('inserts')
        .select(`
          id,
          name,
          supplier_id,
          issue_id,
          created_at,
          suppliers (id, name, supplier_type),
          issues (id, issue_number, theme, magazine_id, magazines (name))
        `)
        .not('supplier_id', 'is', null);

      if (insertsError) throw insertsError;

      // Fetch budget items
      const { data: budgetItems, error: budgetError } = await supabase
        .from('budget_items')
        .select('*');

      if (budgetError) throw budgetError;

      // Create maps for budget lookup
      const lineupBudgetMap = new Map<string, number>();
      const insertBudgetMap = new Map<string, number>();
      
      budgetItems?.forEach((item: any) => {
        if (item.lineup_item_id) {
          const current = lineupBudgetMap.get(item.lineup_item_id) || 0;
          lineupBudgetMap.set(item.lineup_item_id, current + Number(item.amount));
        }
        if (item.insert_id) {
          const current = insertBudgetMap.get(item.insert_id) || 0;
          insertBudgetMap.set(item.insert_id, current + Number(item.amount));
        }
      });

      const allAssignments: SupplierAssignment[] = [];

      // Process lineup items
      lineupItems?.forEach((item: any) => {
        if (item.suppliers && item.issues) {
          allAssignments.push({
            supplier_id: item.supplier_id,
            supplier_name: item.suppliers.name,
            supplier_type: item.suppliers.supplier_type,
            issue_id: item.issue_id,
            issue_number: item.issues.issue_number,
            magazine_name: item.issues.magazines?.name || '',
            theme: item.issues.theme,
            content: item.content,
            page_start: item.page_start,
            page_end: item.page_end,
            type: 'lineup',
            lineup_item_id: item.id,
            created_at: item.created_at,
            amount: lineupBudgetMap.get(item.id) || 0,
          });
        }
      });

      // Process inserts
      inserts?.forEach((item: any) => {
        if (item.suppliers && item.issues) {
          allAssignments.push({
            supplier_id: item.supplier_id,
            supplier_name: item.suppliers.name,
            supplier_type: item.suppliers.supplier_type,
            issue_id: item.issue_id,
            issue_number: item.issues.issue_number,
            magazine_name: item.issues.magazines?.name || '',
            theme: item.issues.theme,
            content: item.name,
            page_start: 0,
            page_end: 0,
            type: 'insert',
            insert_id: item.id,
            created_at: item.created_at,
            amount: insertBudgetMap.get(item.id) || 0,
          });
        }
      });

      return allAssignments;
    },
  });

  // Filter assignments
  const filteredAssignments = assignments?.filter(a => {
    const matchesIssue = selectedIssueId === "all" || a.issue_id === selectedIssueId;
    const matchesSupplier = selectedSupplierId === "all" || a.supplier_id === selectedSupplierId;
    
    // Date filter
    let matchesDate = true;
    if (dateFrom || dateTo) {
      const itemDate = parseISO(a.created_at);
      if (dateFrom && dateTo) {
        matchesDate = isWithinInterval(itemDate, {
          start: startOfDay(dateFrom),
          end: endOfDay(dateTo)
        });
      } else if (dateFrom) {
        matchesDate = itemDate >= startOfDay(dateFrom);
      } else if (dateTo) {
        matchesDate = itemDate <= endOfDay(dateTo);
      }
    }
    
    return matchesIssue && matchesSupplier && matchesDate;
  }) || [];

  // Group by supplier
  const groupedBySupplier = filteredAssignments.reduce((acc, assignment) => {
    if (!acc[assignment.supplier_id]) {
      acc[assignment.supplier_id] = {
        supplier_name: assignment.supplier_name,
        supplier_type: assignment.supplier_type,
        assignments: [],
        totalPages: 0,
        totalInserts: 0,
        totalAmount: 0,
      };
    }
    acc[assignment.supplier_id].assignments.push(assignment);
    acc[assignment.supplier_id].totalAmount += assignment.amount;
    if (assignment.type === 'lineup') {
      acc[assignment.supplier_id].totalPages += (assignment.page_end - assignment.page_start + 1);
    } else {
      acc[assignment.supplier_id].totalInserts += 1;
    }
    return acc;
  }, {} as Record<string, { supplier_name: string; supplier_type: string | null; assignments: SupplierAssignment[]; totalPages: number; totalInserts: number; totalAmount: number }>);

  const grandTotalAmount = Object.values(groupedBySupplier).reduce((sum, d) => sum + d.totalAmount, 0);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('he-IL', { style: 'currency', currency: 'ILS' }).format(amount);
  };

  const handleExportPdf = async (exportType: ReportType) => {
    if (!reportRef.current) return;
    
    try {
      const clonedReport = reportRef.current.cloneNode(true) as HTMLElement;
      
      clonedReport.style.backgroundColor = '#ffffff';
      clonedReport.style.color = '#1a1a1a';
      
      clonedReport.querySelectorAll('*').forEach((el) => {
        const htmlEl = el as HTMLElement;
        htmlEl.style.backgroundColor = htmlEl.style.backgroundColor?.includes('muted') ? '#f5f5f5' : '';
        htmlEl.style.color = htmlEl.style.color || '#1a1a1a';
      });

      if (exportType === "summary") {
        clonedReport.querySelectorAll('[data-report-detailed]').forEach((el) => {
          (el as HTMLElement).style.display = 'none';
        });
        clonedReport.querySelectorAll('[data-report-summary]').forEach((el) => {
          (el as HTMLElement).style.display = 'block';
        });
      }

      const tempContainer = document.createElement('div');
      tempContainer.style.position = 'absolute';
      tempContainer.style.left = '-9999px';
      tempContainer.style.backgroundColor = '#ffffff';
      tempContainer.appendChild(clonedReport);
      document.body.appendChild(tempContainer);
      
      const filename = exportType === "summary" 
        ? `supplier-summary-report-${format(new Date(), 'yyyy-MM-dd')}.pdf`
        : `supplier-assignments-report-${format(new Date(), 'yyyy-MM-dd')}.pdf`;

      const opt = {
        margin: 10,
        filename,
        image: { type: 'jpeg' as const, quality: 0.98 },
        html2canvas: { 
          scale: 2, 
          backgroundColor: '#ffffff',
          useCORS: true,
        },
        jsPDF: { unit: 'mm' as const, format: 'a4' as const, orientation: 'portrait' as const }
      };
      
      await html2pdf().set(opt).from(clonedReport).save();
      
      document.body.removeChild(tempContainer);
      
      toast.success('הדו״ח יוצא ל-PDF בהצלחה!');
    } catch (error) {
      toast.error('שגיאה בייצוא ה-PDF');
    }
  };

  const getSupplierTypeLabel = (type: string | null) => {
    const types: Record<string, string> = {
      writer: "כותב/ת",
      illustrator: "מאייר/ת",
      photographer: "צלם/ת",
      editor: "עורכ/ת",
      sub_editor: "עורכ/ת משנה",
      designer: "מעצב/ת",
      other: "אחר",
    };
    return types[type || ''] || "אחר";
  };

  const clearDateFilters = () => {
    setDateFrom(undefined);
    setDateTo(undefined);
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
      {/* Filters */}
      <div className="flex items-center gap-4 flex-wrap">
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">סנן לפי גיליון:</span>
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
          <span className="text-sm text-muted-foreground">סנן לפי ספק:</span>
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

        {/* Date Range Filter */}
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">מתאריך:</span>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-[140px] justify-start text-right font-normal",
                  !dateFrom && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="ml-2 h-4 w-4" />
                {dateFrom ? format(dateFrom, "dd/MM/yyyy") : "בחר תאריך"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={dateFrom}
                onSelect={setDateFrom}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">עד תאריך:</span>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-[140px] justify-start text-right font-normal",
                  !dateTo && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="ml-2 h-4 w-4" />
                {dateTo ? format(dateTo, "dd/MM/yyyy") : "בחר תאריך"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={dateTo}
                onSelect={setDateTo}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>

        {(dateFrom || dateTo) && (
          <Button variant="ghost" size="sm" onClick={clearDateFilters}>
            נקה תאריכים
          </Button>
        )}

        <div className="flex items-center gap-2 mr-auto">
          <Button variant="outline" onClick={() => handleExportPdf("detailed")}>
            <Download className="w-4 h-4 ml-2" />
            ייצוא מפורט
          </Button>
          <Button variant="outline" onClick={() => handleExportPdf("summary")}>
            <FileText className="w-4 h-4 ml-2" />
            ייצוא סיכום
          </Button>
        </div>
      </div>

      {/* Report Content */}
      <div ref={reportRef} className="bg-white text-gray-900 p-6 rounded-lg">
        {/* Report Header */}
        <div className="mb-6 text-center border-b pb-4">
          <h2 className="text-xl font-bold text-gray-900">דו״ח הקצאות ספקים</h2>
          <p className="text-sm text-gray-600">{format(new Date(), "dd/MM/yyyy", { locale: he })}</p>
          {(dateFrom || dateTo) && (
            <p className="text-sm text-gray-500 mt-1">
              {dateFrom && dateTo 
                ? `טווח תאריכים: ${format(dateFrom, "dd/MM/yyyy")} - ${format(dateTo, "dd/MM/yyyy")}`
                : dateFrom 
                  ? `מתאריך: ${format(dateFrom, "dd/MM/yyyy")}`
                  : `עד תאריך: ${format(dateTo!, "dd/MM/yyyy")}`
              }
            </p>
          )}
        </div>

        {Object.keys(groupedBySupplier).length === 0 ? (
          <div className="p-8 text-center text-gray-500 border rounded-lg">
            אין הקצאות להצגה
          </div>
        ) : (
          <>
            {/* Detailed Report */}
            <div data-report-detailed>
              {selectedIssueId !== "all" ? (
                /* Single table view when filtering by specific issue */
                <div className="border rounded-lg bg-white overflow-hidden">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b bg-gray-50">
                        <th className="p-2 text-right font-medium text-gray-700">ספק</th>
                        <th className="p-2 text-right font-medium text-gray-700">תוכן</th>
                        <th className="p-2 text-right font-medium text-gray-700">עמודים</th>
                        <th className="p-2 text-right font-medium text-gray-700">סוג</th>
                        <th className="p-2 text-right font-medium text-gray-700">סכום</th>
                      </tr>
                    </thead>
                    <tbody>
                      {Object.entries(groupedBySupplier).map(([supplierId, data], supplierIdx, arr) => (
                        <>
                          {data.assignments.map((assignment, idx) => (
                            <tr key={`${supplierId}-${idx}`} className="border-b border-gray-100">
                              {idx === 0 ? (
                                <td 
                                  className="p-2 text-gray-900 font-medium align-top"
                                  rowSpan={data.assignments.length}
                                >
                                  <div className="flex items-center gap-2">
                                    <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-sm">
                                      {data.supplier_name.charAt(0)}
                                    </div>
                                    <div>
                                      <div>{data.supplier_name}</div>
                                      <div className="text-xs text-gray-500">{getSupplierTypeLabel(data.supplier_type)}</div>
                                    </div>
                                  </div>
                                </td>
                              ) : null}
                              <td className="p-2 text-gray-800">{assignment.content}</td>
                              <td className="p-2 text-gray-800">
                                {assignment.type === 'lineup' 
                                  ? `${assignment.page_start}-${assignment.page_end}` 
                                  : '-'}
                              </td>
                              <td className="p-2">
                                <span className="px-2 py-0.5 rounded border border-gray-300 text-xs text-gray-700">
                                  {assignment.type === 'lineup' ? 'מדור' : 'שילוב'}
                                </span>
                              </td>
                              <td className="p-2 text-gray-800 font-medium">
                                {assignment.amount > 0 ? formatCurrency(assignment.amount) : '-'}
                              </td>
                            </tr>
                          ))}
                          {/* Supplier subtotal row */}
                          <tr className="bg-gray-50 border-b-2 border-gray-300">
                            <td colSpan={4} className="p-2 text-right text-gray-700 font-medium">
                              סה״כ {data.supplier_name}: {data.totalPages} עמודים, {data.totalInserts} שילובים
                            </td>
                            <td className="p-2 text-green-700 font-bold">{formatCurrency(data.totalAmount)}</td>
                          </tr>
                        </>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="bg-gray-100 border-t-2 border-gray-400">
                        <td colSpan={4} className="p-3 text-right text-gray-900 font-bold">סה״כ כללי:</td>
                        <td className="p-3 text-green-700 font-bold text-lg">{formatCurrency(grandTotalAmount)}</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              ) : (
                /* Separate boxes view when showing all issues */
                <div className="space-y-4">
                  {Object.entries(groupedBySupplier).map(([supplierId, data]) => (
                    <div key={supplierId} className="border rounded-lg p-4 bg-white">
                      {/* Supplier Header */}
                      <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-200">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center text-blue-700 font-bold">
                            {data.supplier_name.charAt(0)}
                          </div>
                          <div>
                            <h3 className="font-bold text-lg text-gray-900">{data.supplier_name}</h3>
                            <span className="text-sm text-gray-600">
                              {getSupplierTypeLabel(data.supplier_type)}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <span className="px-3 py-1 rounded-full bg-sky-100 text-sky-700 text-sm font-medium">
                            {data.totalPages} עמודים
                          </span>
                          {data.totalInserts > 0 && (
                            <span className="px-3 py-1 rounded-full bg-purple-100 text-purple-700 text-sm font-medium">
                              {data.totalInserts} שילובים
                            </span>
                          )}
                          <span className="px-3 py-1 rounded-full bg-green-100 text-green-700 text-sm font-bold">
                            {formatCurrency(data.totalAmount)}
                          </span>
                        </div>
                      </div>

                      {/* Assignments Table */}
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b bg-gray-50">
                            <th className="p-2 text-right font-medium text-gray-700">מגזין</th>
                            <th className="p-2 text-right font-medium text-gray-700">גיליון</th>
                            <th className="p-2 text-right font-medium text-gray-700">תוכן</th>
                            <th className="p-2 text-right font-medium text-gray-700">עמודים</th>
                            <th className="p-2 text-right font-medium text-gray-700">סוג</th>
                            <th className="p-2 text-right font-medium text-gray-700">סכום</th>
                          </tr>
                        </thead>
                        <tbody>
                          {data.assignments.map((assignment, idx) => (
                            <tr key={idx} className="border-b last:border-0">
                              <td className="p-2 text-gray-800">{assignment.magazine_name}</td>
                              <td className="p-2 text-gray-800">
                                #{assignment.issue_number} - {assignment.theme}
                              </td>
                              <td className="p-2 text-gray-800">{assignment.content}</td>
                              <td className="p-2 text-gray-800">
                                {assignment.type === 'lineup' 
                                  ? `${assignment.page_start}-${assignment.page_end}` 
                                  : '-'}
                              </td>
                              <td className="p-2">
                                <span className="px-2 py-0.5 rounded border border-gray-300 text-xs text-gray-700">
                                  {assignment.type === 'lineup' ? 'מדור' : 'שילוב'}
                                </span>
                              </td>
                              <td className="p-2 text-gray-800 font-medium">
                                {assignment.amount > 0 ? formatCurrency(assignment.amount) : '-'}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                        <tfoot>
                          <tr className="bg-gray-50 font-bold">
                            <td colSpan={5} className="p-2 text-right text-gray-700">סה״כ לספק:</td>
                            <td className="p-2 text-green-700">{formatCurrency(data.totalAmount)}</td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Summary Report - for summary PDF export */}
            <div data-report-summary className="hidden">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="bg-gray-100 border-b-2 border-gray-300">
                    <th className="p-3 text-right font-bold text-gray-800">ספק</th>
                    <th className="p-3 text-right font-bold text-gray-800">סוג</th>
                    <th className="p-3 text-center font-bold text-gray-800">עמודים</th>
                    <th className="p-3 text-center font-bold text-gray-800">שילובים</th>
                    <th className="p-3 text-center font-bold text-gray-800">סה״כ פריטים</th>
                    <th className="p-3 text-center font-bold text-gray-800">סכום</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(groupedBySupplier).map(([supplierId, data]) => (
                    <tr key={supplierId} className="border-b border-gray-200">
                      <td className="p-3 text-gray-800 font-medium">{data.supplier_name}</td>
                      <td className="p-3 text-gray-600">{getSupplierTypeLabel(data.supplier_type)}</td>
                      <td className="p-3 text-center text-gray-800">{data.totalPages}</td>
                      <td className="p-3 text-center text-gray-800">{data.totalInserts}</td>
                      <td className="p-3 text-center font-bold text-gray-900">{data.assignments.length}</td>
                      <td className="p-3 text-center font-bold text-green-700">{formatCurrency(data.totalAmount)}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="bg-gray-100 border-t-2 border-gray-300">
                    <td className="p-3 font-bold text-gray-900">סה״כ</td>
                    <td className="p-3 text-gray-600">{Object.keys(groupedBySupplier).length} ספקים</td>
                    <td className="p-3 text-center font-bold text-gray-900">
                      {Object.values(groupedBySupplier).reduce((sum, d) => sum + d.totalPages, 0)}
                    </td>
                    <td className="p-3 text-center font-bold text-gray-900">
                      {Object.values(groupedBySupplier).reduce((sum, d) => sum + d.totalInserts, 0)}
                    </td>
                    <td className="p-3 text-center font-bold text-gray-900">
                      {Object.values(groupedBySupplier).reduce((sum, d) => sum + d.assignments.length, 0)}
                    </td>
                    <td className="p-3 text-center font-bold text-green-700">{formatCurrency(grandTotalAmount)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </>
        )}

        {/* Summary Footer */}
        {Object.keys(groupedBySupplier).length > 0 && (
          <div className="mt-6 p-4 bg-gray-100 rounded-lg border border-gray-200">
            <h4 className="font-medium mb-2 text-gray-900">סיכום כללי</h4>
            <div className="grid grid-cols-4 gap-4 text-sm">
              <div>
                <span className="text-gray-600">סה״כ ספקים:</span>{" "}
                <strong className="text-gray-900">{Object.keys(groupedBySupplier).length}</strong>
              </div>
              <div>
                <span className="text-gray-600">סה״כ עמודים:</span>{" "}
                <strong className="text-gray-900">{Object.values(groupedBySupplier).reduce((sum, d) => sum + d.totalPages, 0)}</strong>
              </div>
              <div>
                <span className="text-gray-600">סה״כ שילובים:</span>{" "}
                <strong className="text-gray-900">{Object.values(groupedBySupplier).reduce((sum, d) => sum + d.totalInserts, 0)}</strong>
              </div>
              <div>
                <span className="text-gray-600">סה״כ סכום:</span>{" "}
                <strong className="text-green-700 text-lg">{formatCurrency(grandTotalAmount)}</strong>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
