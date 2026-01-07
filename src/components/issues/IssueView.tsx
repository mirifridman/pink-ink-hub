import { useState } from "react";
import { format } from "date-fns";
import { he } from "date-fns/locale";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Textarea } from "@/components/ui/textarea";
import { MessageSquare, ArrowRight, Calendar, Pencil, Eye } from "lucide-react";
import { Issue, Magazine, LineupItem, Insert, Supplier, getRowColor } from "@/types/database";
import { useLineupItems, useInserts, useUpdateLineupItem, useUpdateInsert } from "@/hooks/useIssues";
import { useAuth } from "@/hooks/useAuth";
import { IssueProgressBar } from "./IssueProgressBar";
import { cn } from "@/lib/utils";

interface IssueViewProps {
  issue: Issue & { magazine: Magazine };
  onBack: () => void;
  onEditDraft?: () => void;
}

export function IssueView({ issue, onBack, onEditDraft }: IssueViewProps) {
  const { role } = useAuth();
  const { data: lineupItems = [], isLoading: loadingLineup } = useLineupItems(issue.id);
  const { data: inserts = [], isLoading: loadingInserts } = useInserts(issue.id);
  const updateLineupItem = useUpdateLineupItem();
  const updateInsert = useUpdateInsert();

  const isEditor = role === "admin" || role === "editor";
  const isDesigner = role === "designer";

  const handleLineupUpdate = (id: string, field: keyof LineupItem, value: boolean | string) => {
    updateLineupItem.mutate({ id, [field]: value });
  };

  const handleInsertUpdate = (id: string, field: keyof Insert, value: boolean | string) => {
    updateInsert.mutate({ id, [field]: value });
  };

  const getRowBgColor = (item: LineupItem | Insert) => {
    const color = getRowColor(item);
    switch (color) {
      case "yellow":
        return "bg-amber-100 dark:bg-amber-900/30";
      case "green":
        return "bg-emerald-100 dark:bg-emerald-900/30";
      default:
        return "";
    }
  };

  const formatPageRange = (start: number, end: number) => {
    if (start === end) return start.toString();
    return `${start}-${end}`;
  };

  return (
    <div className="space-y-6" dir="rtl">
      {/* Header with Back Button */}
      <div className="flex items-center justify-between">
        <Button variant="ghost" onClick={onBack}>
          <ArrowRight className="w-4 h-4 ml-2" />
          חזרה לרשימה
        </Button>
        
        {issue.status === "draft" && isEditor && onEditDraft && (
          <Button onClick={onEditDraft} className="gradient-neon text-white">
            <Pencil className="w-4 h-4 ml-2" />
            חזרה לעריכה
          </Button>
        )}
      </div>

      {/* Issue Header */}
      <div className="p-6 bg-muted/50 rounded-lg space-y-4">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-2xl font-rubik font-bold">
              {issue.magazine.name} - גיליון #{issue.issue_number}
            </h2>
            <p className="text-lg text-muted-foreground">{issue.theme}</p>
          </div>
          <div className="text-left">
            <span className="text-sm font-medium px-3 py-1 rounded-full bg-primary/10 text-primary">
              {issue.template_pages} עמודים
            </span>
          </div>
        </div>

        {/* Timeline */}
        <div className="flex gap-8 pt-4 border-t">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-muted-foreground" />
            <div>
              <p className="text-xs text-muted-foreground">תחילת עיצוב</p>
              <p className="font-medium">{format(new Date(issue.design_start_date), "dd/MM/yyyy")}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Pencil className="w-4 h-4 text-muted-foreground" />
            <div>
              <p className="text-xs text-muted-foreground">סגירת סקיצה</p>
              <p className="font-medium">{format(new Date(issue.sketch_close_date), "dd/MM/yyyy")}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Eye className="w-4 h-4 text-muted-foreground" />
            <div>
              <p className="text-xs text-muted-foreground">הורדה לדפוס</p>
              <p className="font-medium">{format(new Date(issue.print_date), "dd/MM/yyyy")}</p>
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="pt-4 border-t">
          <IssueProgressBar templatePages={issue.template_pages} lineupItems={lineupItems} />
        </div>
      </div>

      {/* Lineup Table */}
      <div className="border rounded-lg overflow-hidden">
        <div className="p-3 bg-muted/30 border-b">
          <h3 className="font-rubik font-bold">ליינאפ</h3>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-right w-12">צבע</TableHead>
              <TableHead className="text-right w-20">עמוד</TableHead>
              <TableHead className="text-right">תוכן</TableHead>
              <TableHead className="text-right w-32">ספק</TableHead>
              <TableHead className="text-right w-24">מקור</TableHead>
              <TableHead className="text-right w-32">הערות</TableHead>
              <TableHead className="text-center w-20">📄 טקסט</TableHead>
              <TableHead className="text-center w-20">📁 קבצים</TableHead>
              <TableHead className="text-center w-20">🎨 מעוצב</TableHead>
              <TableHead className="text-center w-24">💬 הערה</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {lineupItems.map((item) => (
              <TableRow key={item.id} className={getRowBgColor(item)}>
                <TableCell>
                  <div
                    className={cn(
                      "w-4 h-4 rounded",
                      item.is_designed
                        ? "bg-amber-400"
                        : item.text_ready || item.files_ready
                        ? "bg-emerald-400"
                        : "bg-white border"
                    )}
                  />
                </TableCell>
                <TableCell className="font-medium">
                  {formatPageRange(item.page_start, item.page_end)}
                </TableCell>
                <TableCell>{item.content}</TableCell>
                <TableCell>{item.supplier?.name || "—"}</TableCell>
                <TableCell>{item.source || "—"}</TableCell>
                <TableCell className="text-sm">{item.notes || "—"}</TableCell>
                <TableCell className="text-center">
                  <Checkbox
                    checked={item.text_ready}
                    onCheckedChange={(checked) =>
                      handleLineupUpdate(item.id, "text_ready", checked as boolean)
                    }
                    disabled={!isEditor}
                  />
                </TableCell>
                <TableCell className="text-center">
                  <Checkbox
                    checked={item.files_ready}
                    onCheckedChange={(checked) =>
                      handleLineupUpdate(item.id, "files_ready", checked as boolean)
                    }
                    disabled={!isEditor}
                  />
                </TableCell>
                <TableCell className="text-center">
                  <Checkbox
                    checked={item.is_designed}
                    onCheckedChange={(checked) =>
                      handleLineupUpdate(item.id, "is_designed", checked as boolean)
                    }
                    disabled={!isDesigner}
                  />
                </TableCell>
                <TableCell className="text-center">
                  <DesignerNotePopover
                    value={item.designer_notes || ""}
                    onChange={(value) => handleLineupUpdate(item.id, "designer_notes", value)}
                    disabled={!isDesigner}
                  />
                </TableCell>
              </TableRow>
            ))}
            {lineupItems.length === 0 && (
              <TableRow>
                <TableCell colSpan={10} className="text-center py-8 text-muted-foreground">
                  אין פריטים בליינאפ
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Inserts Table */}
      {inserts.length > 0 && (
        <div className="border rounded-lg overflow-hidden">
          <div className="p-3 bg-muted/30 border-b">
            <h3 className="font-rubik font-bold">אינסרטים</h3>
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-right w-12">צבע</TableHead>
                <TableHead className="text-right">שם</TableHead>
                <TableHead className="text-right">תיאור</TableHead>
                <TableHead className="text-right w-32">ספק</TableHead>
                <TableHead className="text-right w-32">הערות</TableHead>
                <TableHead className="text-center w-20">📄 טקסט</TableHead>
                <TableHead className="text-center w-20">📁 קבצים</TableHead>
                <TableHead className="text-center w-20">🎨 מעוצב</TableHead>
                <TableHead className="text-center w-24">💬 הערה</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {inserts.map((item) => (
                <TableRow key={item.id} className={getRowBgColor(item)}>
                  <TableCell>
                    <div
                      className={cn(
                        "w-4 h-4 rounded",
                        item.is_designed
                          ? "bg-amber-400"
                          : item.text_ready || item.files_ready
                          ? "bg-emerald-400"
                          : "bg-white border"
                      )}
                    />
                  </TableCell>
                  <TableCell className="font-medium">{item.name}</TableCell>
                  <TableCell>{item.description || "—"}</TableCell>
                  <TableCell>{item.supplier?.name || "—"}</TableCell>
                  <TableCell className="text-sm">{item.notes || "—"}</TableCell>
                  <TableCell className="text-center">
                    <Checkbox
                      checked={item.text_ready}
                      onCheckedChange={(checked) =>
                        handleInsertUpdate(item.id, "text_ready", checked as boolean)
                      }
                      disabled={!isEditor}
                    />
                  </TableCell>
                  <TableCell className="text-center">
                    <Checkbox
                      checked={item.files_ready}
                      onCheckedChange={(checked) =>
                        handleInsertUpdate(item.id, "files_ready", checked as boolean)
                      }
                      disabled={!isEditor}
                    />
                  </TableCell>
                  <TableCell className="text-center">
                    <Checkbox
                      checked={item.is_designed}
                      onCheckedChange={(checked) =>
                        handleInsertUpdate(item.id, "is_designed", checked as boolean)
                      }
                      disabled={!isDesigner}
                    />
                  </TableCell>
                  <TableCell className="text-center">
                    <DesignerNotePopover
                      value={item.designer_notes || ""}
                      onChange={(value) => handleInsertUpdate(item.id, "designer_notes", value)}
                      disabled={!isDesigner}
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}

interface DesignerNotePopoverProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}

function DesignerNotePopover({ value, onChange, disabled }: DesignerNotePopoverProps) {
  const [localValue, setLocalValue] = useState(value);
  const [open, setOpen] = useState(false);

  const handleSave = () => {
    onChange(localValue);
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className={cn(value && "text-primary")}
        >
          <MessageSquare className="w-4 h-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-72" align="end" dir="rtl">
        <div className="space-y-2">
          <p className="text-sm font-medium">הערת גרפיקאי</p>
          <Textarea
            value={localValue}
            onChange={(e) => setLocalValue(e.target.value)}
            placeholder="הוסף הערה..."
            disabled={disabled}
            rows={3}
          />
          {!disabled && (
            <Button size="sm" onClick={handleSave} className="w-full">
              שמור
            </Button>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
