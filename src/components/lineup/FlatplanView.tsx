import { useMemo } from "react";
import { getContentTypeColor, getContentTypeLabel, CONTENT_TYPES } from "./ContentTypeSelect";
import { cn } from "@/lib/utils";
import { AlertTriangle } from "lucide-react";

interface LineupItem {
  id: string;
  page_start: number;
  page_end: number;
  content: string;
  content_type?: string | null;
  design_status?: string | null;
  is_designed?: boolean;
}

interface FlatplanViewProps {
  lineupItems: LineupItem[];
  templatePages: number;
}

export function FlatplanView({ lineupItems, templatePages }: FlatplanViewProps) {
  // Create a map of pages to items - memoized
  const pageItemMap = useMemo(() => {
    const map = new Map<number, LineupItem>();
    lineupItems.forEach(item => {
      for (let p = item.page_start; p <= item.page_end; p++) {
        map.set(p, item);
      }
    });
    return map;
  }, [lineupItems]);

  // Generate page pairs (spreads) - RTL: right page has lower number
  const spreads: { right: number; left: number | null }[] = [];
  
  // Page 1 is always alone (cover)
  spreads.push({ right: 1, left: null });
  
  // Rest of pages in pairs (2-3, 4-5, etc.) - in RTL: right=2, left=3
  for (let i = 2; i <= templatePages; i += 2) {
    spreads.push({ 
      right: i, 
      left: i + 1 <= templatePages ? i + 1 : null 
    });
  }

  const renderPage = (pageNum: number) => {
    const item = pageItemMap.get(pageNum);
    const isFirstPageOfItem = item && item.page_start === pageNum;
    const isStandby = item?.design_status === 'standby';

    return (
      <div
        key={pageNum}
        className={cn(
          "relative h-28 border-2 rounded-lg transition-all duration-200",
          item ? getContentTypeColor(item.content_type) : "bg-muted/50",
          item ? "text-white" : "text-muted-foreground",
          isStandby && "ring-2 ring-orange-500"
        )}
      >
        {/* Page number */}
        <div className={cn(
          "absolute top-1 right-1 text-xs font-bold rounded px-1.5 py-0.5",
          item ? "bg-black/20" : "bg-muted"
        )}>
          {pageNum}
        </div>

        {/* Content (show only on first page of item) */}
        {isFirstPageOfItem && (
          <div className="absolute inset-0 flex flex-col items-center justify-center p-2 text-center">
            {isStandby && (
              <div className="absolute top-1 left-1" title="ממתין לאישור עימוד מחדש">
                <AlertTriangle className="w-4 h-4 text-orange-300" />
              </div>
            )}
            <span className="text-xs font-medium opacity-80">
              {getContentTypeLabel(item.content_type)}
            </span>
            <span className="text-xs font-bold line-clamp-3 mt-0.5">
              {item.content}
            </span>
          </div>
        )}

        {/* Empty page indicator */}
        {!item && (
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-xs">ריק</span>
          </div>
        )}

        {/* Multi-page indicator */}
        {item && !isFirstPageOfItem && (
          <div className="absolute inset-0 flex items-center justify-center opacity-50">
            <span className="text-xs">← המשך</span>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6" dir="rtl">
      {/* Legend */}
      <div className="flex flex-wrap gap-2 p-4 bg-muted/30 rounded-lg">
        <span className="text-sm font-medium text-muted-foreground ml-2">מקרא:</span>
        {CONTENT_TYPES.map((type) => (
          <div key={type.value} className="flex items-center gap-1.5">
            <div className={cn("w-4 h-4 rounded", type.color)} />
            <span className="text-xs">{type.label}</span>
          </div>
        ))}
        <div className="flex items-center gap-1.5 mr-4 pr-4 border-r border-muted">
          <div className="w-4 h-4 rounded ring-2 ring-orange-500 bg-muted" />
          <span className="text-xs">ממתין לאישור מחדש</span>
        </div>
      </div>

      {/* Spreads - Multi-column responsive grid - RTL: right page (lower) on right, left page (higher) on left */}
      <div className="grid gap-6 grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
        {spreads.map((spread, idx) => (
          <div 
            key={idx} 
            className="flex flex-row-reverse justify-center gap-1 p-2 bg-muted/20 rounded-lg border border-muted/40"
          >
            {/* flex-row-reverse with RTL: renders right page on right side, left page on left side */}
            <div className={cn("w-32 lg:w-36", !spread.left && "mx-auto")}>
              {renderPage(spread.right)}
            </div>
            {spread.left && (
              <div className="w-32 lg:w-36">
                {renderPage(spread.left)}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
