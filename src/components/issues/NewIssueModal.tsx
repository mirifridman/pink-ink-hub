import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, X } from "lucide-react";
import { format } from "date-fns";
import { he } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { useMagazines, useLatestIssueNumber, useIssues, useEditors, useActivePageTemplates } from "@/hooks/useIssues";
import { useAuth } from "@/hooks/useAuth";
import { Badge } from "@/components/ui/badge";

interface NewIssueModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onContinue: (data: NewIssueData) => void;
}

export interface NewIssueData {
  magazine_id: string;
  template_pages: number;
  issue_number: number;
  distribution_month: Date;
  theme: string;
  design_start_date: Date;
  sketch_close_date: Date;
  print_date: Date;
  copy_lineup_from?: string;
  editor_ids: string[];
}

export function NewIssueModal({ open, onOpenChange, onContinue }: NewIssueModalProps) {
  const { user } = useAuth();
  const { data: magazines, isLoading: magazinesLoading } = useMagazines();
  const { data: issues } = useIssues();
  const { data: editors } = useEditors();
  const { data: pageTemplates } = useActivePageTemplates();
  
  const [magazineId, setMagazineId] = useState<string>("");
  const [templatePages, setTemplatePages] = useState<string>("");
  const [issueNumber, setIssueNumber] = useState<number>(1);
  const [distributionMonth, setDistributionMonth] = useState<Date>();
  const [theme, setTheme] = useState("");
  const [designStartDate, setDesignStartDate] = useState<Date>();
  const [sketchCloseDate, setSketchCloseDate] = useState<Date>();
  const [printDate, setPrintDate] = useState<Date>();
  const [copyLineup, setCopyLineup] = useState(false);
  const [sourceIssueId, setSourceIssueId] = useState<string>("");
  const [selectedEditorIds, setSelectedEditorIds] = useState<string[]>([]);

  // Set default template when templates load
  useEffect(() => {
    if (pageTemplates?.length && !templatePages) {
      setTemplatePages(pageTemplates[0].page_count.toString());
    }
  }, [pageTemplates, templatePages]);

  const { data: latestNumber } = useLatestIssueNumber(magazineId);

  useEffect(() => {
    if (latestNumber !== undefined) {
      setIssueNumber(latestNumber + 1);
    }
  }, [latestNumber]);

  const magazineIssues = issues?.filter(i => i.magazine_id === magazineId) || [];

  const isValid = () => {
    if (!magazineId || !templatePages || !distributionMonth || !theme || !designStartDate || !sketchCloseDate || !printDate) {
      return false;
    }
    if (sketchCloseDate <= designStartDate) return false;
    if (printDate <= sketchCloseDate) return false;
    return true;
  };

  const handleContinue = () => {
    if (!isValid()) return;
    
    onContinue({
      magazine_id: magazineId,
      template_pages: parseInt(templatePages),
      issue_number: issueNumber,
      distribution_month: distributionMonth!,
      theme,
      design_start_date: designStartDate!,
      sketch_close_date: sketchCloseDate!,
      print_date: printDate!,
      copy_lineup_from: copyLineup ? sourceIssueId : undefined,
      editor_ids: selectedEditorIds,
    });
  };

  const handleEditorSelect = (editorId: string) => {
    if (editorId && !selectedEditorIds.includes(editorId)) {
      setSelectedEditorIds([...selectedEditorIds, editorId]);
    }
  };

  const handleRemoveEditor = (editorId: string) => {
    setSelectedEditorIds(selectedEditorIds.filter(id => id !== editorId));
  };

  const resetForm = () => {
    setMagazineId("");
    setTemplatePages(pageTemplates?.[0]?.page_count.toString() || "");
    setIssueNumber(1);
    setDistributionMonth(undefined);
    setTheme("");
    setDesignStartDate(undefined);
    setSketchCloseDate(undefined);
    setPrintDate(undefined);
    setCopyLineup(false);
    setSourceIssueId("");
    setSelectedEditorIds([]);
  };

  const availableEditors = editors?.filter(e => !selectedEditorIds.includes(e.id)) || [];

  return (
    <Dialog open={open} onOpenChange={(o) => {
      if (!o) resetForm();
      onOpenChange(o);
    }}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto" dir="rtl">
        <DialogHeader>
          <DialogTitle className="text-xl font-rubik">גיליון חדש</DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Magazine Selection */}
          <div className="space-y-2">
            <Label>שם המותג *</Label>
            <Select value={magazineId} onValueChange={setMagazineId}>
              <SelectTrigger>
                <SelectValue placeholder="בחר מותג" />
              </SelectTrigger>
              <SelectContent>
                {magazines?.map((mag) => (
                  <SelectItem key={mag.id} value={mag.id}>
                    {mag.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Template Pages */}
          <div className="space-y-2">
            <Label>תבנית עמודים *</Label>
            <p className="text-xs text-muted-foreground">לא ניתן לשנות לאחר יצירה!</p>
            <RadioGroup value={templatePages} onValueChange={setTemplatePages}>
              <div className="flex flex-wrap gap-4">
                {pageTemplates?.map((template) => (
                  <div key={template.id} className="flex items-center gap-2">
                    <RadioGroupItem value={template.page_count.toString()} id={`pages-${template.page_count}`} />
                    <Label htmlFor={`pages-${template.page_count}`} className="cursor-pointer">
                      {template.page_count} עמודים
                    </Label>
                  </div>
                ))}
              </div>
            </RadioGroup>
          </div>

          {/* Issue Number */}
          <div className="space-y-2">
            <Label>מספר גיליון *</Label>
            <Input
              type="number"
              value={issueNumber}
              onChange={(e) => setIssueNumber(parseInt(e.target.value) || 1)}
              min={1}
            />
          </div>

          {/* Distribution Month */}
          <div className="space-y-2">
            <Label>חודש הפצה *</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-right",
                    !distributionMonth && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="ml-2 h-4 w-4" />
                  {distributionMonth ? format(distributionMonth, "MMMM yyyy", { locale: he }) : "בחר חודש"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={distributionMonth}
                  onSelect={setDistributionMonth}
                  className="p-3 pointer-events-auto"
                  locale={he}
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Editors Selection */}
          <div className="space-y-2">
            <Label>עורכים אחראים</Label>
            <Select onValueChange={handleEditorSelect} value="">
              <SelectTrigger>
                <SelectValue placeholder="בחר עורכים" />
              </SelectTrigger>
              <SelectContent>
                {availableEditors.map((editor) => (
                  <SelectItem key={editor.id} value={editor.id}>
                    {editor.full_name || editor.email || "עורך"}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedEditorIds.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {selectedEditorIds.map((editorId) => {
                  const editor = editors?.find(e => e.id === editorId);
                  return (
                    <Badge key={editorId} variant="secondary" className="gap-1">
                      {editor?.full_name || editor?.email || "עורך"}
                      <X 
                        className="h-3 w-3 cursor-pointer hover:text-destructive" 
                        onClick={() => handleRemoveEditor(editorId)}
                      />
                    </Badge>
                  );
                })}
              </div>
            )}
          </div>

          {/* Theme */}
          <div className="space-y-2">
            <Label>נושא הגיליון *</Label>
            <Input
              value={theme}
              onChange={(e) => setTheme(e.target.value)}
              placeholder="נושא מרכזי של הגיליון"
            />
          </div>

          {/* Dates */}
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>תחילת עיצוב *</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-right",
                      !designStartDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="ml-2 h-4 w-4" />
                    {designStartDate ? format(designStartDate, "dd/MM/yy") : "בחר"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={designStartDate}
                    onSelect={setDesignStartDate}
                    className="p-3 pointer-events-auto"
                    locale={he}
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label>סגירת סקיצה *</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-right",
                      !sketchCloseDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="ml-2 h-4 w-4" />
                    {sketchCloseDate ? format(sketchCloseDate, "dd/MM/yy") : "בחר"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={sketchCloseDate}
                    onSelect={setSketchCloseDate}
                    disabled={(date) => designStartDate ? date <= designStartDate : false}
                    className="p-3 pointer-events-auto"
                    locale={he}
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label>הורדה לדפוס *</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-right",
                      !printDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="ml-2 h-4 w-4" />
                    {printDate ? format(printDate, "dd/MM/yy") : "בחר"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={printDate}
                    onSelect={setPrintDate}
                    disabled={(date) => sketchCloseDate ? date <= sketchCloseDate : false}
                    className="p-3 pointer-events-auto"
                    locale={he}
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          {/* Copy Lineup */}
          <div className="space-y-4 pt-4 border-t">
            <div className="flex items-center gap-2">
              <Checkbox
                id="copy-lineup"
                checked={copyLineup}
                onCheckedChange={(checked) => setCopyLineup(checked as boolean)}
              />
              <Label htmlFor="copy-lineup" className="cursor-pointer">
                העתק מבנה ליינאפ מגיליון קודם
              </Label>
            </div>

            {copyLineup && magazineIssues.length > 0 && (
              <Select value={sourceIssueId} onValueChange={setSourceIssueId}>
                <SelectTrigger>
                  <SelectValue placeholder="בחר גיליון מקור" />
                </SelectTrigger>
                <SelectContent>
                  {magazineIssues.map((issue) => (
                    <SelectItem key={issue.id} value={issue.id}>
                      גיליון #{issue.issue_number} - {issue.theme}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-4 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            ביטול
          </Button>
          <Button
            onClick={handleContinue}
            disabled={!isValid()}
            className="gradient-neon text-white"
          >
            המשך לליינאפ
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
