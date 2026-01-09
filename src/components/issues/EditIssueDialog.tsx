import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Settings, CalendarIcon } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { he } from 'date-fns/locale';
import { cn } from '@/lib/utils';

interface EditIssueDialogProps {
  issue: {
    id: string;
    issue_number: number;
    theme: string;
    design_start_date: string;
    sketch_close_date: string;
    print_date: string;
    hebrew_month?: string | null;
    magazine?: { name: string } | null;
  };
  onUpdate: () => void;
}

const HEBREW_MONTHS = [
  'תשרי', 'חשוון', 'כסלו', 'טבת', 'שבט', 'אדר',
  'אדר א׳', 'אדר ב׳', 'ניסן', 'אייר', 'סיוון',
  'תמוז', 'אב', 'אלול'
];

export const EditIssueDialog = ({ issue, onUpdate }: EditIssueDialogProps) => {
  const [open, setOpen] = useState(false);
  const [issueNumber, setIssueNumber] = useState(issue.issue_number);
  const [theme, setTheme] = useState(issue.theme || '');
  const [designStartDate, setDesignStartDate] = useState<Date | undefined>(
    issue.design_start_date ? new Date(issue.design_start_date) : undefined
  );
  const [sketchCloseDate, setSketchCloseDate] = useState<Date | undefined>(
    issue.sketch_close_date ? new Date(issue.sketch_close_date) : undefined
  );
  const [printDate, setPrintDate] = useState<Date | undefined>(
    issue.print_date ? new Date(issue.print_date) : undefined
  );
  const [hebrewMonth, setHebrewMonth] = useState<string>(issue.hebrew_month || '');
  const [saving, setSaving] = useState(false);

  const isNiflaotKids = issue.magazine?.name === 'נפלאות קידס';

  // Reset form when dialog opens
  useEffect(() => {
    if (open) {
      setIssueNumber(issue.issue_number);
      setTheme(issue.theme || '');
      setDesignStartDate(issue.design_start_date ? new Date(issue.design_start_date) : undefined);
      setSketchCloseDate(issue.sketch_close_date ? new Date(issue.sketch_close_date) : undefined);
      setPrintDate(issue.print_date ? new Date(issue.print_date) : undefined);
      setHebrewMonth(issue.hebrew_month || '');
    }
  }, [open, issue]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from('issues')
        .update({
          issue_number: issueNumber,
          theme,
          design_start_date: designStartDate?.toISOString().split('T')[0],
          sketch_close_date: sketchCloseDate?.toISOString().split('T')[0],
          print_date: printDate?.toISOString().split('T')[0],
          hebrew_month: hebrewMonth || null,
          updated_at: new Date().toISOString()
        })
        .eq('id', issue.id);

      if (error) throw error;

      toast.success('פרטי הגיליון עודכנו בהצלחה!');
      setOpen(false);
      onUpdate();
    } catch (error) {
      console.error('Error updating issue:', error);
      toast.error('שגיאה בעדכון פרטי הגיליון');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Settings className="w-4 h-4 ml-2" />
          ערוך גיליון
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-[500px]" dir="rtl">
        <DialogHeader>
          <DialogTitle>עריכת פרטי גיליון</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="issueNumber">מספר גיליון</Label>
            <Input
              id="issueNumber"
              type="number"
              value={issueNumber}
              onChange={(e) => setIssueNumber(parseInt(e.target.value) || 1)}
              min={1}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="theme">נושא</Label>
            <Input
              id="theme"
              value={theme}
              onChange={(e) => setTheme(e.target.value)}
              placeholder="נושא הגיליון"
            />
          </div>

          {/* Hebrew Month - only for Niflaot Kids */}
          {isNiflaotKids && (
            <div className="space-y-2">
              <Label>חודש עברי (אופציונלי)</Label>
              <Select value={hebrewMonth} onValueChange={setHebrewMonth}>
                <SelectTrigger>
                  <SelectValue placeholder="בחר חודש עברי" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">ללא חודש עברי</SelectItem>
                  {HEBREW_MONTHS.map((month) => (
                    <SelectItem key={month} value={month}>
                      {month}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>תחילת עיצוב</Label>
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
              <Label>סגירת סקיצה</Label>
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
                    className="p-3 pointer-events-auto"
                    locale={he}
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label>הורדה לדפוס</Label>
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
                    className="p-3 pointer-events-auto"
                    locale={he}
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          <div className="flex gap-2 pt-4">
            <Button variant="outline" onClick={() => setOpen(false)} className="flex-1">
              ביטול
            </Button>
            <Button onClick={handleSave} className="flex-1" disabled={saving}>
              {saving ? 'שומר...' : 'שמור'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
