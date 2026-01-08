import { useState, useCallback } from "react";
import { getContentTypeColor, getContentTypeLabel, CONTENT_TYPES } from "./ContentTypeSelect";
import { cn } from "@/lib/utils";
import { useUpdateLineupItem } from "@/hooks/useIssues";
import { toast } from "sonner";

interface LineupItem {
  id: string;
  page_start: number;
  page_end: number;
  content: string;
  content_type?: string | null;
}

interface FlatplanViewProps {
  lineupItems: LineupItem[];
  templatePages: number;
  onUpdate: () => void;
}

export function FlatplanView({ lineupItems, templatePages, onUpdate }: FlatplanViewProps) {
  const [draggedItem, setDraggedItem] = useState<LineupItem | null>(null);
  const [dragOverPage, setDragOverPage] = useState<number | null>(null);
  const updateLineupItem = useUpdateLineupItem();

  // Create a map of pages to items
  const pageItemMap = new Map<number, LineupItem>();
  lineupItems.forEach(item => {
    for (let p = item.page_start; p <= item.page_end; p++) {
      pageItemMap.set(p, item);
    }
  });

  // Generate page pairs (spreads)
  const spreads: { left: number | null; right: number | null }[] = [];
  
  // Page 1 is always alone (cover)
  spreads.push({ left: 1, right: null });
  
  // Rest of pages in pairs (2-3, 4-5, etc.)
  for (let i = 2; i <= templatePages; i += 2) {
    spreads.push({ 
      left: i, 
      right: i + 1 <= templatePages ? i + 1 : null 
    });
  }

  const handleDragStart = useCallback((e: React.DragEvent, item: LineupItem) => {
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

  const handleDrop = useCallback(async (e: React.DragEvent, targetPageStart: number) => {
    e.preventDefault();
    setDragOverPage(null);

    if (!draggedItem) return;

    const pageSpan = draggedItem.page_end - draggedItem.page_start;
    const newPageEnd = targetPageStart + pageSpan;

    // Check if target pages are valid
    if (newPageEnd > templatePages) {
      toast.error("אין מספיק עמודים ביעד");
      return;
    }

    // Check if target pages are occupied by another item
    for (let p = targetPageStart; p <= newPageEnd; p++) {
      const existingItem = pageItemMap.get(p);
      if (existingItem && existingItem.id !== draggedItem.id) {
        toast.error("העמודים תפוסים על ידי פריט אחר");
        return;
      }
    }

    try {
      await updateLineupItem.mutateAsync({
        id: draggedItem.id,
        page_start: targetPageStart,
        page_end: newPageEnd,
      });
      onUpdate();
      toast.success("העמודים עודכנו");
    } catch (error) {
      toast.error("שגיאה בעדכון");
    }

    setDraggedItem(null);
  }, [draggedItem, templatePages, pageItemMap, updateLineupItem, onUpdate]);

  const handleDragEnd = useCallback(() => {
    setDraggedItem(null);
    setDragOverPage(null);
  }, []);

  const renderPage = (pageNum: number) => {
    const item = pageItemMap.get(pageNum);
    const isFirstPageOfItem = item && item.page_start === pageNum;
    const isDragOver = dragOverPage === pageNum;
    const isDragging = draggedItem?.id === item?.id;

    return (
      <div
        key={pageNum}
        className={cn(
          "relative h-32 border-2 rounded-lg transition-all duration-200",
          item ? getContentTypeColor(item.content_type) : "bg-muted/50",
          item ? "text-white" : "text-muted-foreground",
          isDragOver && "ring-2 ring-primary ring-offset-2",
          isDragging && "opacity-50",
          isFirstPageOfItem && "cursor-grab active:cursor-grabbing"
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
            <span className="text-xs font-medium opacity-80">
              {getContentTypeLabel(item.content_type)}
            </span>
            <span className="text-sm font-bold line-clamp-2 mt-1">
              {item.content}
            </span>
            {item.page_start !== item.page_end && (
              <span className="text-xs opacity-70 mt-1">
                עמ׳ {item.page_start}-{item.page_end}
              </span>
            )}
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
      </div>

      {/* Spreads */}
      <div className="space-y-4">
        {spreads.map((spread, idx) => (
          <div key={idx} className="flex justify-center gap-1">
            {/* For RTL: right page first, then left */}
            {spread.right && (
              <div className="w-40">
                {renderPage(spread.right)}
              </div>
            )}
            {spread.left && (
              <div className={cn("w-40", !spread.right && "mx-auto")}>
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
