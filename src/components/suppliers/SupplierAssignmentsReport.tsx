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

export function SupplierAssignmentsReport() {
  const [selectedIssueId, setSelectedIssueId] = useState<string>("all");
  const [selectedSupplierId, setSelectedSupplierId] = useState<string>("all");
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

  const handleExportPdf = async () => {
    if (!reportRef.current) return;
    
    try {
      const opt = {
        margin: 10,
        filename: `supplier-assignments-report-${format(new Date(), 'yyyy-MM-dd')}.pdf`,
        image: { type: 'jpeg' as const, quality: 0.98 },
        html2canvas: { scale: 2, backgroundColor: '#ffffff' },
        jsPDF: { unit: 'mm' as const, format: 'a4' as const, orientation: 'portrait' as const }
      };
      
      await html2pdf().set(opt).from(reportRef.current).save();
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

        <Button variant="outline" onClick={handleExportPdf} className="mr-auto">
          <Download className="w-4 h-4 ml-2" />
          ייצוא ל-PDF
        </Button>
      </div>

      {/* Report Content */}
      <div ref={reportRef} className="bg-background p-4">
        <div className="mb-6 text-center print:block hidden">
          <h2 className="text-xl font-bold">דו״ח הקצאות ספקים</h2>
          <p className="text-sm text-muted-foreground">{format(new Date(), "dd/MM/yyyy", { locale: he })}</p>
        </div>

        {Object.keys(groupedBySupplier).length === 0 ? (
          <NeonCard>
            <NeonCardContent className="p-8 text-center text-muted-foreground">
              אין הקצאות להצגה
            </NeonCardContent>
          </NeonCard>
        ) : (
          <div className="space-y-4">
            {Object.entries(groupedBySupplier).map(([supplierId, data]) => (
              <NeonCard key={supplierId}>
                <NeonCardContent className="p-4">
                  {/* Supplier Header */}
                  <div className="flex items-center justify-between mb-4 pb-3 border-b">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary font-bold">
                        {data.supplier_name.charAt(0)}
                      </div>
                      <div>
                        <h3 className="font-bold text-lg">{data.supplier_name}</h3>
                        <span className="text-sm text-muted-foreground">
                          {getSupplierTypeLabel(data.supplier_type)}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <Badge variant="secondary" className="bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-300">
                        {data.totalPages} עמודים
                      </Badge>
                      {data.totalInserts > 0 && (
                        <Badge variant="secondary" className="bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300">
                          {data.totalInserts} שילובים
                        </Badge>
                      )}
                    </div>
                  </div>

                  {/* Assignments Table */}
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b bg-muted/30">
                        <th className="p-2 text-right font-medium">מגזין</th>
                        <th className="p-2 text-right font-medium">גיליון</th>
                        <th className="p-2 text-right font-medium">תוכן</th>
                        <th className="p-2 text-right font-medium">עמודים</th>
                        <th className="p-2 text-right font-medium">סוג</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.assignments.map((assignment, idx) => (
                        <tr key={idx} className="border-b last:border-0 hover:bg-muted/20">
                          <td className="p-2">{assignment.magazine_name}</td>
                          <td className="p-2">
                            #{assignment.issue_number} - {assignment.theme}
                          </td>
                          <td className="p-2">{assignment.content}</td>
                          <td className="p-2">
                            {assignment.type === 'lineup' 
                              ? `${assignment.page_start}-${assignment.page_end}` 
                              : '-'}
                          </td>
                          <td className="p-2">
                            <Badge variant="outline" className="text-xs">
                              {assignment.type === 'lineup' ? 'מדור' : 'שילוב'}
                            </Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </NeonCardContent>
              </NeonCard>
            ))}
          </div>
        )}

        {/* Summary */}
        {Object.keys(groupedBySupplier).length > 0 && (
          <div className="mt-6 p-4 bg-muted/30 rounded-lg">
            <h4 className="font-medium mb-2">סיכום</h4>
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">סה״כ ספקים:</span>{" "}
                <strong>{Object.keys(groupedBySupplier).length}</strong>
              </div>
              <div>
                <span className="text-muted-foreground">סה״כ עמודים:</span>{" "}
                <strong>{Object.values(groupedBySupplier).reduce((sum, d) => sum + d.totalPages, 0)}</strong>
              </div>
              <div>
                <span className="text-muted-foreground">סה״כ שילובים:</span>{" "}
                <strong>{Object.values(groupedBySupplier).reduce((sum, d) => sum + d.totalInserts, 0)}</strong>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
