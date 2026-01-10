import { forwardRef } from "react";
import { getContentTypeColor, getContentTypeLabel, CONTENT_TYPES } from "./ContentTypeSelect";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { he } from "date-fns/locale";

interface LineupItem {
  id: string;
  page_start: number;
  page_end: number;
  content: string;
  content_type?: string | null;
  design_status?: string | null;
  is_designed?: boolean;
}

interface Issue {
  id: string;
  issue_number: number;
  theme: string;
  print_date: string;
  magazine?: {
    name: string;
  } | null;
}

interface FlatplanExportViewProps {
  lineupItems: LineupItem[];
  templatePages: number;
  issue: Issue;
}

export const FlatplanExportView = forwardRef<HTMLDivElement, FlatplanExportViewProps>(
  ({ lineupItems, templatePages, issue }, ref) => {
    // Create a map of pages to items
    const pageItemMap = new Map<number, LineupItem>();
    lineupItems.forEach(item => {
      for (let p = item.page_start; p <= item.page_end; p++) {
        pageItemMap.set(p, item);
      }
    });

    // Generate page pairs (spreads) - RTL: right page has lower number
    const spreads: { right: number; left: number | null }[] = [];
    
    // Page 1 is always alone (cover)
    spreads.push({ right: 1, left: null });
    
    // Rest of pages in pairs
    for (let i = 2; i <= templatePages; i += 2) {
      spreads.push({ 
        right: i, 
        left: i + 1 <= templatePages ? i + 1 : null 
      });
    }

    // Split spreads into pages (8 spreads per A4 page for portrait)
    const SPREADS_PER_PAGE = 8;
    const pages: typeof spreads[] = [];
    for (let i = 0; i < spreads.length; i += SPREADS_PER_PAGE) {
      pages.push(spreads.slice(i, i + SPREADS_PER_PAGE));
    }

    const renderPage = (pageNum: number) => {
      const item = pageItemMap.get(pageNum);
      const isFirstPageOfItem = item && item.page_start === pageNum;

      return (
        <div
          key={pageNum}
          className={cn(
            "relative h-16 border rounded transition-all",
            item ? getContentTypeColor(item.content_type) : "bg-gray-100",
            item ? "text-white" : "text-gray-500"
          )}
          style={{ 
            minHeight: '60px',
            borderColor: 'rgba(0,0,0,0.15)'
          }}
        >
          {/* Page number */}
          <div className={cn(
            "absolute top-0.5 right-0.5 text-[9px] font-bold rounded px-1",
            item ? "bg-black/20" : "bg-gray-200"
          )}>
            {pageNum}
          </div>

          {/* Content (show only on first page of item) */}
          {isFirstPageOfItem && (
            <div className="absolute inset-0 flex flex-col items-center justify-center p-1 text-center">
              <span className="text-[8px] font-medium opacity-80">
                {getContentTypeLabel(item.content_type)}
              </span>
              <span className="text-[9px] font-bold line-clamp-2">
                {item.content}
              </span>
            </div>
          )}

          {/* Empty page indicator */}
          {!item && (
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-[9px]">ריק</span>
            </div>
          )}

          {/* Multi-page indicator */}
          {item && !isFirstPageOfItem && (
            <div className="absolute inset-0 flex items-center justify-center opacity-50">
              <span className="text-[9px]">← המשך</span>
            </div>
          )}
        </div>
      );
    };

    return (
      <div 
        ref={ref} 
        className="bg-white text-black"
        style={{ 
          width: '210mm',
          fontFamily: 'Heebo, sans-serif',
          direction: 'rtl'
        }}
      >
        {pages.map((pageSpreads, pageIndex) => (
          <div 
            key={pageIndex}
            style={{ 
              minHeight: '297mm',
              padding: '12mm',
              pageBreakAfter: pageIndex < pages.length - 1 ? 'always' : 'auto',
              boxSizing: 'border-box'
            }}
          >
            {/* Header - only on first page */}
            {pageIndex === 0 && (
              <>
                {/* Issue Details Header */}
                <div className="mb-6 pb-4 border-b-2 border-gray-300">
                  <h1 className="text-2xl font-bold text-gray-800 mb-3">
                    דו"ח ליינאפ - תצוגה ויזואלית
                  </h1>
                  <div className="flex flex-wrap gap-6 text-sm">
                    <div>
                      <span className="text-gray-500">מגזין:</span>{" "}
                      <span className="font-semibold">{issue.magazine?.name}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">גיליון:</span>{" "}
                      <span className="font-semibold">{issue.issue_number}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">נושא:</span>{" "}
                      <span className="font-semibold text-violet-700">{issue.theme}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">הורדה לדפוס:</span>{" "}
                      <span className="font-semibold">
                        {format(new Date(issue.print_date), "dd/MM/yyyy", { locale: he })}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Legend */}
                <div className="mb-6 p-3 bg-gray-50 rounded-lg border border-gray-200">
                  <h3 className="text-sm font-semibold text-gray-700 mb-2">מקרא סוגי תכנים:</h3>
                  <div className="flex flex-wrap gap-3">
                    {CONTENT_TYPES.map((type) => (
                      <div key={type.value} className="flex items-center gap-1.5">
                        <div 
                          className={cn("w-4 h-4 rounded", type.color)} 
                          style={{ border: '1px solid rgba(0,0,0,0.1)' }}
                        />
                        <span className="text-xs text-gray-700">{type.label}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}

            {/* Page indicator for multi-page exports */}
            {pages.length > 1 && pageIndex > 0 && (
              <div className="mb-4 text-sm text-gray-500">
                המשך - עמוד {pageIndex + 1} מתוך {pages.length}
              </div>
            )}

            {/* Spreads Grid */}
            <div className="grid grid-cols-4 gap-3">
              {pageSpreads.map((spread, idx) => (
                <div 
                  key={idx} 
                  className="flex flex-row-reverse justify-center gap-0.5 p-1.5 bg-gray-50 rounded border border-gray-200"
                >
                  <div className={cn("w-16", !spread.left && "mx-auto")}>
                    {renderPage(spread.right)}
                  </div>
                  {spread.left && (
                    <div className="w-16">
                      {renderPage(spread.left)}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Footer */}
            <div className="mt-auto pt-4 text-center text-xs text-gray-400" style={{ marginTop: '20mm' }}>
              הופק בתאריך: {format(new Date(), "dd/MM/yyyy HH:mm", { locale: he })}
            </div>
          </div>
        ))}
      </div>
    );
  }
);

FlatplanExportView.displayName = "FlatplanExportView";
