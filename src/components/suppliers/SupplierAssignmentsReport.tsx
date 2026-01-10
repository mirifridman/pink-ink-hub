import { useState, useRef } from "react";
import { NeonCard, NeonCardContent } from "@/components/ui/NeonCard";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Download, FileText, Loader2 } from "lucide-react";
import { useIssues, useSuppliers } from "@/hooks/useIssues";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { he } from "date-fns/locale";
import { toast } from "sonner";
import html2pdf from "html2pdf.js";

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
}

type ReportType = "detailed" | "summary";

export function SupplierAssignmentsReport() {
  const [selectedIssueId, setSelectedIssueId] = useState<string>("all");
  const [selectedSupplierId, setSelectedSupplierId] = useState<string>("all");
  const [reportType, setReportType] = useState<ReportType>("detailed");
  const reportRef = useRef<HTMLDivElement>(null);
  
  const { data: issues } = useIssues();
  const { data: suppliers } = useSuppliers();

  // Fetch all lineup items with supplier info
  const { data: assignments, isLoading } = useQuery({
    queryKey: ['supplier-assignments'],
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
          suppliers (id, name, supplier_type),
          issues (id, issue_number, theme, magazine_id, magazines (name))
        `)
        .not('supplier_id', 'is', null);

      if (insertsError) throw insertsError;

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
    return matchesIssue && matchesSupplier;
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
      };
    }
    acc[assignment.supplier_id].assignments.push(assignment);
    if (assignment.type === 'lineup') {
      acc[assignment.supplier_id].totalPages += (assignment.page_end - assignment.page_start + 1);
    } else {
      acc[assignment.supplier_id].totalInserts += 1;
    }
    return acc;
  }, {} as Record<string, { supplier_name: string; supplier_type: string | null; assignments: SupplierAssignment[]; totalPages: number; totalInserts: number }>);

  const handleExportPdf = async (exportType: ReportType) => {
    if (!reportRef.current) return;
    
    try {
      // Clone the report element for PDF export
      const clonedReport = reportRef.current.cloneNode(true) as HTMLElement;
      
      // Apply light theme styles for PDF
      clonedReport.style.backgroundColor = '#ffffff';
      clonedReport.style.color = '#1a1a1a';
      
      // Apply light theme to all elements
      clonedReport.querySelectorAll('*').forEach((el) => {
        const htmlEl = el as HTMLElement;
        htmlEl.style.backgroundColor = htmlEl.style.backgroundColor?.includes('muted') ? '#f5f5f5' : '';
        htmlEl.style.color = htmlEl.style.color || '#1a1a1a';
      });

      // If summary report, hide detailed tables
      if (exportType === "summary") {
        clonedReport.querySelectorAll('[data-report-detailed]').forEach((el) => {
          (el as HTMLElement).style.display = 'none';
        });
        clonedReport.querySelectorAll('[data-report-summary]').forEach((el) => {
          (el as HTMLElement).style.display = 'block';
        });
      }

      // Create a temporary container
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
      
      // Cleanup
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
        {/* Report Header - always visible in PDF */}
        <div className="mb-6 text-center border-b pb-4">
          <h2 className="text-xl font-bold text-gray-900">דו״ח הקצאות ספקים</h2>
          <p className="text-sm text-gray-600">{format(new Date(), "dd/MM/yyyy", { locale: he })}</p>
        </div>

        {Object.keys(groupedBySupplier).length === 0 ? (
          <div className="p-8 text-center text-gray-500 border rounded-lg">
            אין הקצאות להצגה
          </div>
        ) : (
          <>
            {/* Detailed Report */}
            <div data-report-detailed className="space-y-4">
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
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ))}
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
                  </tr>
                </tfoot>
              </table>
            </div>
          </>
        )}

        {/* Summary Footer */}
        {Object.keys(groupedBySupplier).length > 0 && (
          <div className="mt-6 p-4 bg-gray-100 rounded-lg border border-gray-200">
            <h4 className="font-medium mb-2 text-gray-900">סיכום</h4>
            <div className="grid grid-cols-3 gap-4 text-sm">
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
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
