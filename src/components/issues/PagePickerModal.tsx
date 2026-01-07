import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface PagePickerModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  templatePages: 52 | 68;
  occupiedPages: number[];
  selectedPages: number[];
  onSelect: (pages: number[]) => void;
}

export function PagePickerModal({
  open,
  onOpenChange,
  templatePages,
  occupiedPages,
  selectedPages: initialSelected,
  onSelect,
}: PagePickerModalProps) {
  const [selectedPages, setSelectedPages] = useState<number[]>(initialSelected);
  const [dragStart, setDragStart] = useState<number | null>(null);

  useEffect(() => {
    setSelectedPages(initialSelected);
  }, [initialSelected, open]);

  const isOccupied = (page: number) => occupiedPages.includes(page);
  const isSelected = (page: number) => selectedPages.includes(page);

  const handlePageClick = (page: number) => {
    if (isOccupied(page)) return;

    if (selectedPages.includes(page)) {
      setSelectedPages(selectedPages.filter(p => p !== page));
    } else {
      // Add page maintaining sort order
      const newPages = [...selectedPages, page].sort((a, b) => a - b);
      setSelectedPages(newPages);
    }
  };

  const handleMouseDown = (page: number) => {
    if (isOccupied(page)) return;
    setDragStart(page);
  };

  const handleMouseUp = (page: number) => {
    if (dragStart === null || isOccupied(page)) {
      setDragStart(null);
      return;
    }

    const start = Math.min(dragStart, page);
    const end = Math.max(dragStart, page);
    
    const rangePagesAvailable: number[] = [];
    for (let i = start; i <= end; i++) {
      if (!isOccupied(i)) {
        rangePagesAvailable.push(i);
      }
    }

    // Toggle range
    const allSelected = rangePagesAvailable.every(p => selectedPages.includes(p));
    if (allSelected) {
      setSelectedPages(selectedPages.filter(p => !rangePagesAvailable.includes(p)));
    } else {
      const newPages = [...new Set([...selectedPages, ...rangePagesAvailable])].sort((a, b) => a - b);
      setSelectedPages(newPages);
    }

    setDragStart(null);
  };

  const handleConfirm = () => {
    onSelect(selectedPages);
    onOpenChange(false);
  };

  const pages = Array.from({ length: templatePages }, (_, i) => i + 1);
  const columns = 13;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl" dir="rtl">
        <DialogHeader>
          <DialogTitle className="font-rubik">בחירת עמודים</DialogTitle>
        </DialogHeader>

        <div className="py-4">
          {/* Legend */}
          <div className="flex gap-6 mb-4 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-muted border-2 border-muted-foreground/20" />
              <span>תפוס</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-primary" />
              <span>נבחר</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-background border-2 border-border" />
              <span>פנוי</span>
            </div>
          </div>

          <p className="text-sm text-muted-foreground mb-4">
            לחץ על עמוד לבחירה, או גרור לבחירת טווח
          </p>

          {/* Grid */}
          <div 
            className="grid gap-2 select-none"
            style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}
          >
            {pages.map((page) => {
              const occupied = isOccupied(page);
              const selected = isSelected(page);

              return (
                <button
                  key={page}
                  disabled={occupied}
                  onMouseDown={() => handleMouseDown(page)}
                  onMouseUp={() => handleMouseUp(page)}
                  className={cn(
                    "aspect-square rounded-md text-sm font-medium transition-all",
                    "flex items-center justify-center select-none",
                    occupied && "bg-muted text-muted-foreground cursor-not-allowed opacity-50",
                    !occupied && !selected && "bg-background border-2 border-border hover:border-primary cursor-pointer",
                    selected && "bg-primary text-primary-foreground"
                  )}
                >
                  {page}
                </button>
              );
            })}
          </div>

          {/* Selected summary */}
          <div className="mt-4 text-sm">
            <span className="font-medium">נבחרו: </span>
            {selectedPages.length > 0 ? (
              <span>
                {formatPageRange(selectedPages)} ({selectedPages.length} עמודים)
              </span>
            ) : (
              <span className="text-muted-foreground">לא נבחרו עמודים</span>
            )}
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            ביטול
          </Button>
          <Button onClick={handleConfirm} disabled={selectedPages.length === 0}>
            אישור
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function formatPageRange(pages: number[]): string {
  if (pages.length === 0) return "";
  if (pages.length === 1) return pages[0].toString();

  const sorted = [...pages].sort((a, b) => a - b);
  const ranges: string[] = [];
  let start = sorted[0];
  let end = sorted[0];

  for (let i = 1; i < sorted.length; i++) {
    if (sorted[i] === end + 1) {
      end = sorted[i];
    } else {
      ranges.push(start === end ? `${start}` : `${start}-${end}`);
      start = sorted[i];
      end = sorted[i];
    }
  }
  ranges.push(start === end ? `${start}` : `${start}-${end}`);

  return ranges.join(", ");
}
