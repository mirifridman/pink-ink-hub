import { AppLayout } from "@/components/layout/AppLayout";
import { NeonCard, NeonCardContent } from "@/components/ui/NeonCard";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Calendar, 
  Send, 
  ChevronRight,
  ChevronLeft,
  BookOpen,
  Loader2
} from "lucide-react";
import { useIssues } from "@/hooks/useIssues";
import { format, getQuarter, getYear, startOfQuarter, endOfQuarter, getMonth } from "date-fns";
import { he } from "date-fns/locale";
import { useState, useMemo } from "react";

const getStatusColor = (status: string) => {
  switch (status) {
    case "draft":
      return "waiting";
    case "in_progress":
      return "warning";
    case "completed":
      return "success";
    default:
      return "waiting";
  }
};

const getStatusLabel = (status: string) => {
  switch (status) {
    case "draft":
      return "טיוטה";
    case "in_progress":
      return "בהפקה";
    case "completed":
      return "הושלם";
    default:
      return status;
  }
};

const hebrewMonths = [
  "ינואר", "פברואר", "מרץ", "אפריל", "מאי", "יוני",
  "יולי", "אוגוסט", "ספטמבר", "אוקטובר", "נובמבר", "דצמבר"
];

const getQuarterMonths = (quarter: number): number[] => {
  switch (quarter) {
    case 1: return [0, 1, 2]; // Jan, Feb, Mar
    case 2: return [3, 4, 5]; // Apr, May, Jun
    case 3: return [6, 7, 8]; // Jul, Aug, Sep
    case 4: return [9, 10, 11]; // Oct, Nov, Dec
    default: return [0, 1, 2];
  }
};

export default function Schedule() {
  const { data: issues, isLoading } = useIssues();
  
  const currentDate = new Date();
  const currentQuarter = getQuarter(currentDate);
  const currentYear = getYear(currentDate);
  
  const [selectedQuarter, setSelectedQuarter] = useState(currentQuarter);
  const [selectedYear, setSelectedYear] = useState(currentYear);
  
  const quarterMonths = getQuarterMonths(selectedQuarter);
  
  const filteredIssues = useMemo(() => {
    if (!issues) return [];
    
    return issues.filter(issue => {
      const distributionDate = new Date(issue.distribution_month);
      const issueMonth = getMonth(distributionDate);
      const issueYear = getYear(distributionDate);
      
      return issueYear === selectedYear && quarterMonths.includes(issueMonth);
    });
  }, [issues, selectedYear, quarterMonths]);

  const handlePrevQuarter = () => {
    if (selectedQuarter === 1) {
      setSelectedQuarter(4);
      setSelectedYear(selectedYear - 1);
    } else {
      setSelectedQuarter(selectedQuarter - 1);
    }
  };

  const handleNextQuarter = () => {
    if (selectedQuarter === 4) {
      setSelectedQuarter(1);
      setSelectedYear(selectedYear + 1);
    } else {
      setSelectedQuarter(selectedQuarter + 1);
    }
  };

  const quarterValue = `q${selectedQuarter}-${selectedYear}`;

  const quarterOptions = [];
  for (let y = currentYear - 1; y <= currentYear + 1; y++) {
    for (let q = 1; q <= 4; q++) {
      quarterOptions.push({ value: `q${q}-${y}`, label: `רבעון ${q} - ${y}` });
    }
  }

  return (
    <AppLayout>
      <div className="space-y-6 animate-fade-in-up">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-rubik font-bold text-foreground flex items-center gap-3">
              <Calendar className="w-8 h-8 text-accent" />
              לוח רבעוני
            </h1>
            <p className="text-muted-foreground mt-1">תכנון גליונות לרבעון הקרוב</p>
          </div>
          <div className="flex items-center gap-4">
            <Button variant="outline" size="icon" onClick={handleNextQuarter}>
              <ChevronRight className="w-4 h-4" />
            </Button>
            <Select 
              value={quarterValue}
              onValueChange={(value) => {
                const [q, y] = value.replace('q', '').split('-');
                setSelectedQuarter(parseInt(q));
                setSelectedYear(parseInt(y));
              }}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {quarterOptions.map(opt => (
                  <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button variant="outline" size="icon" onClick={handlePrevQuarter}>
              <ChevronLeft className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-accent" />
          </div>
        ) : filteredIssues.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <Calendar className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>אין גיליונות ברבעון זה</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {quarterMonths.map((monthIndex) => {
              const monthIssues = filteredIssues.filter(issue => {
                const distributionDate = new Date(issue.distribution_month);
                return getMonth(distributionDate) === monthIndex;
              });

              return (
                <div key={monthIndex} className="space-y-4">
                  <h2 className="text-xl font-rubik font-bold text-center py-3 bg-muted rounded-xl">
                    {hebrewMonths[monthIndex]}
                  </h2>
                  {monthIssues.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground text-sm">
                      אין גיליונות
                    </div>
                  ) : (
                    monthIssues.map((issue) => (
                      <NeonCard
                        key={issue.id}
                        variant={issue.status === "in_progress" ? "glow" : "default"}
                        className="transition-all hover:-translate-y-1"
                      >
                        <NeonCardContent className="p-5">
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex items-center gap-2">
                              <BookOpen className="w-4 h-4 text-accent" />
                              <h3 className="font-medium">{issue.magazine?.name}</h3>
                            </div>
                            <StatusBadge status={getStatusColor(issue.status) as any}>
                              {getStatusLabel(issue.status)}
                            </StatusBadge>
                          </div>
                          
                          <p className="text-sm text-muted-foreground mb-1">גליון #{issue.issue_number}</p>
                          <p className="text-sm font-medium mb-4">{issue.theme}</p>

                          <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">סגירת סקיצה:</span>
                              <span>{format(new Date(issue.sketch_close_date), 'dd/MM/yyyy')}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">תחילת עיצוב:</span>
                              <span>{format(new Date(issue.design_start_date), 'dd/MM/yyyy')}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">תאריך הדפסה:</span>
                              <span className="font-medium">{format(new Date(issue.print_date), 'dd/MM/yyyy')}</span>
                            </div>
                          </div>

                          <div className="mt-4 pt-4 border-t">
                            <div className="flex justify-between text-sm">
                              <span className="text-muted-foreground">חודש הפצה:</span>
                              <span className="font-medium">
                                {format(new Date(issue.distribution_month), 'MMMM yyyy', { locale: he })}
                              </span>
                            </div>
                          </div>
                        </NeonCardContent>
                      </NeonCard>
                    ))
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
