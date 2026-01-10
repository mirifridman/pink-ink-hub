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
    
    // Rest of pages in pairs - right page is EVEN (lower), left page is ODD (higher)
    for (let i = 2; i <= templatePages; i += 2) {
      spreads.push({ 
        right: i, 
        left: i + 1 <= templatePages ? i + 1 : null 
      });
    }

    // Split spreads into pages (4 columns x 12 rows = 48 spreads per A4 page)
    const SPREADS_PER_PAGE = 48;
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
            "relative border rounded",
            item ? getContentTypeColor(item.content_type) : "bg-gray-100",
            item ? "text-white" : "text-gray-500"
          )}
          style={{ 
            height: '56px',
            borderColor: 'rgba(0,0,0,0.15)'
          }}
        >
          {/* Page number */}
          <div className={cn(
            "absolute top-0 right-0.5 text-[8px] font-bold",
            item ? "text-white/80" : "text-gray-400"
          )}>
            {pageNum}
          </div>

          {/* Content (show only on first page of item) */}
          {isFirstPageOfItem && (
            <div className="absolute inset-0 flex flex-col items-center justify-center px-0.5 pt-2 text-center">
              <span className="text-[6px] font-medium opacity-80 leading-tight">
                {getContentTypeLabel(item.content_type)}
              </span>
              <span className="text-[7px] font-bold line-clamp-2 leading-tight">
                {item.content}
              </span>
            </div>
          )}

          {/* Empty page indicator */}
          {!item && (
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-[8px]">ריק</span>
            </div>
          )}

          {/* Multi-page indicator */}
          {item && !isFirstPageOfItem && (
            <div className="absolute inset-0 flex items-center justify-center opacity-50">
              <span className="text-[7px]">←</span>
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
              padding: '8mm',
              pageBreakAfter: pageIndex < pages.length - 1 ? 'always' : 'auto',
              boxSizing: 'border-box'
            }}
          >
            {/* Header - only on first page */}
            {pageIndex === 0 && (
              <>
                {/* Issue Details Header */}
                <div className="mb-3 pb-2 border-b-2 border-gray-300">
                  <h1 className="text-lg font-bold text-gray-800 mb-2">
                    דו"ח ליינאפ - תצוגה ויזואלית
                  </h1>
                  <div className="flex flex-wrap gap-4 text-xs">
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
                <div className="mb-3 p-2 bg-gray-50 rounded border border-gray-200">
                  <h3 className="text-xs font-semibold text-gray-700 mb-1">מקרא:</h3>
                  <div className="flex flex-wrap gap-2">
                    {CONTENT_TYPES.map((type) => (
                      <div key={type.value} className="flex items-center gap-1">
                        <div 
                          className={cn("w-3 h-3 rounded", type.color)} 
                          style={{ border: '1px solid rgba(0,0,0,0.1)' }}
                        />
                        <span className="text-[10px] text-gray-700">{type.label}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}

            {/* Page indicator for multi-page exports */}
            {pages.length > 1 && pageIndex > 0 && (
              <div className="mb-2 text-xs text-gray-500">
                המשך - עמוד {pageIndex + 1} מתוך {pages.length}
              </div>
            )}

            {/* Spreads Grid - 4 columns x 12 rows */}
            <div className="grid grid-cols-4 gap-2">
              {pageSpreads.map((spread, idx) => (
                <div 
                  key={idx} 
                  className="flex justify-center gap-px p-1 bg-gray-50 rounded border border-gray-200"
                >
                  {/* Right page (lower number) on the right side */}
                  <div className={cn("w-14", !spread.left && "mx-auto")}>
                    {renderPage(spread.right)}
                  </div>
                  {/* Left page (higher number) on the left side */}
                  {spread.left && (
                    <div className="w-14">
                      {renderPage(spread.left)}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Footer */}
            <div className="mt-4 pt-2 text-center text-[10px] text-gray-400">
              הופק בתאריך: {format(new Date(), "dd/MM/yyyy HH:mm", { locale: he })}
            </div>
          </div>
        ))}
      </div>
    );
  }
);

FlatplanExportView.displayName = "FlatplanExportView";
