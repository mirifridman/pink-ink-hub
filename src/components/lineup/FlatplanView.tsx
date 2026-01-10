import { useState, useCallback, useMemo } from "react";
import { getContentTypeColor, getContentTypeLabel, CONTENT_TYPES } from "./ContentTypeSelect";
import { cn } from "@/lib/utils";
import { useSwapLineupPages, useUpdateLineupPages } from "@/hooks/useIssues";
import { toast } from "sonner";
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
  issueId: string;
  onUpdate: () => void;
}

export function FlatplanView({ lineupItems, templatePages, issueId, onUpdate }: FlatplanViewProps) {
  const [draggedItem, setDraggedItem] = useState<LineupItem | null>(null);
  const [dragOverPage, setDragOverPage] = useState<number | null>(null);
  const swapLineupPages = useSwapLineupPages();
  const updateLineupPages = useUpdateLineupPages();

  // Create a map of pages to items - memoized to be stable for callbacks
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

  const handleDragStart = useCallback((e: React.DragEvent, item: LineupItem) => {
    console.log("DragStart:", item.id, item.content, "pages:", item.page_start, "-", item.page_end);
    setDraggedItem(item);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', item.id);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent, pageNum: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverPage(pageNum);
  }, []);

  const handleDragLeave = useCallback(() => {
    setDragOverPage(null);
  }, []);

  const handleDrop = useCallback(async (e: React.DragEvent, dropPageNum: number) => {
    e.preventDefault();
    setDragOverPage(null);

    // Get the dragged item ID from dataTransfer as backup
    const draggedItemId = e.dataTransfer.getData('text/plain');
    console.log("HandleDrop:", dropPageNum, "draggedItemId from dataTransfer:", draggedItemId, "draggedItem state:", draggedItem?.id);

    // Use the dragged item from state, or find it from lineupItems using the ID
    const sourceDraggedItem = draggedItem || lineupItems.find(item => item.id === draggedItemId);
    
    if (!sourceDraggedItem) {
      console.log("No dragged item found, returning");
      setDraggedItem(null);
      return;
    }

    // Get the item at the drop location (if any)
    const targetItem = pageItemMap.get(dropPageNum);
    console.log("Target item:", targetItem?.id, targetItem?.content);
    
    // If dropping on self, do nothing
    if (targetItem?.id === sourceDraggedItem.id) {
      console.log("Dropping on self, returning");
      setDraggedItem(null);
      return;
    }

    if (targetItem) {
      // Swap pages between two items - use the actual first pages of each item
      console.log("Swapping pages:", sourceDraggedItem.id, "with", targetItem.id);
      try {
        await swapLineupPages.mutateAsync({
          item1Id: sourceDraggedItem.id,
          item2Id: targetItem.id,
          item1Pages: { page_start: sourceDraggedItem.page_start, page_end: sourceDraggedItem.page_end },
          item2Pages: { page_start: targetItem.page_start, page_end: targetItem.page_end },
          issueId,
        });
        onUpdate();
        toast.success("העמודים הוחלפו בהצלחה");
      } catch (error) {
        console.error("Swap error:", error);
        toast.error("שגיאה בהחלפת עמודים");
      }
    } else {
      // Move to empty space - use the drop page as the new start
      const pageSpan = sourceDraggedItem.page_end - sourceDraggedItem.page_start;
      const newPageEnd = dropPageNum + pageSpan;

      // Check if target pages are valid
      if (newPageEnd > templatePages) {
        toast.error("אין מספיק עמודים ביעד");
        setDraggedItem(null);
        return;
      }

      // Check if any pages in the new range are occupied (except by dragged item)
      for (let p = dropPageNum; p <= newPageEnd; p++) {
        const occupyingItem = pageItemMap.get(p);
        if (occupyingItem && occupyingItem.id !== sourceDraggedItem.id) {
          toast.error("העמודים תפוסים");
          setDraggedItem(null);
          return;
        }
      }

      const wasDesigned = sourceDraggedItem.design_status === 'designed' || sourceDraggedItem.is_designed === true;
      console.log("Moving to empty space:", dropPageNum, "-", newPageEnd);
      try {
        await updateLineupPages.mutateAsync({
          id: sourceDraggedItem.id,
          page_start: dropPageNum,
          page_end: newPageEnd,
          wasDesigned,
        });
        onUpdate();
        if (wasDesigned) {
          toast.success("העמודים עודכנו - המעצב יצטרך לאשר מחדש");
        } else {
          toast.success("העמודים עודכנו");
        }
      } catch (error) {
        console.error("Update error:", error);
        toast.error("שגיאה בעדכון");
      }
    }

    setDraggedItem(null);
  }, [draggedItem, lineupItems, templatePages, pageItemMap, swapLineupPages, updateLineupPages, issueId, onUpdate]);

  const handleDragEnd = useCallback(() => {
    setDraggedItem(null);
    setDragOverPage(null);
  }, []);

  const renderPage = (pageNum: number) => {
    const item = pageItemMap.get(pageNum);
    const isFirstPageOfItem = item && item.page_start === pageNum;
    const isDragOver = dragOverPage === pageNum;
    const isDragging = draggedItem?.id === item?.id;
    const isStandby = item?.design_status === 'standby';

    return (
      <div
        key={pageNum}
        className={cn(
          "relative h-28 border-2 rounded-lg transition-all duration-200",
          item ? getContentTypeColor(item.content_type) : "bg-muted/50",
          item ? "text-white" : "text-muted-foreground",
          isDragOver && "ring-2 ring-primary ring-offset-2",
          isDragging && "opacity-50",
          isFirstPageOfItem && "cursor-grab active:cursor-grabbing",
          isStandby && "ring-2 ring-orange-500"
        )}
        draggable={!!isFirstPageOfItem}
        onDragStart={isFirstPageOfItem ? (e) => handleDragStart(e, item!) : undefined}
        onDragOver={(e) => handleDragOver(e, pageNum)}
        onDragLeave={handleDragLeave}
        onDrop={(e) => handleDrop(e, pageNum)}
        onDragEnd={handleDragEnd}
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

      {/* Instructions */}
      <p className="text-center text-sm text-muted-foreground">
        גרור פריטים להחלפת מיקום בין עמודים
      </p>
    </div>
  );
}
