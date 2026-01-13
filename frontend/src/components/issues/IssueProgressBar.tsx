import { LineupItem, Insert, getRowColor } from "@/types/database";
import { cn } from "@/lib/utils";

interface IssueProgressBarProps {
  templatePages: number;
  lineupItems: (LineupItem & { supplier?: { name: string } | null })[];
}

export function IssueProgressBar({ templatePages, lineupItems }: IssueProgressBarProps) {
  // Build page status map
  const pageStatus: Map<number, "designed" | "content" | "pending" | "empty"> = new Map();

  // Initialize all pages as empty
  for (let i = 1; i <= templatePages; i++) {
    pageStatus.set(i, "empty");
  }

  // Populate based on lineup items
  lineupItems.forEach((item) => {
    for (let page = item.page_start; page <= item.page_end; page++) {
      if (item.is_designed) {
        pageStatus.set(page, "designed");
      } else if (item.text_ready || item.files_ready) {
        pageStatus.set(page, "content");
      } else {
        pageStatus.set(page, "pending");
      }
    }
  });

  // Count each status
  const counts = {
    designed: 0,
    content: 0,
    pending: 0,
    empty: 0,
  };

  pageStatus.forEach((status) => {
    counts[status]++;
  });

  // Build segments for visualization
  const segments: { status: "designed" | "content" | "pending" | "empty"; pages: number }[] = [];
  let currentStatus: "designed" | "content" | "pending" | "empty" | null = null;
  let currentCount = 0;

  for (let i = 1; i <= templatePages; i++) {
    const status = pageStatus.get(i)!;
    if (status === currentStatus) {
      currentCount++;
    } else {
      if (currentStatus !== null) {
        segments.push({ status: currentStatus, pages: currentCount });
      }
      currentStatus = status;
      currentCount = 1;
    }
  }
  if (currentStatus !== null) {
    segments.push({ status: currentStatus, pages: currentCount });
  }

  const statusColors = {
    designed: "bg-amber-100 dark:bg-amber-900/50",
    content: "bg-emerald-100 dark:bg-emerald-900/50",
    pending: "bg-white dark:bg-muted",
    empty: "bg-muted/50",
  };

  return (
    <div className="space-y-2">
      {/* Progress Bar */}
      <div className="h-4 rounded-full overflow-hidden flex border bg-muted/30">
        {segments.map((segment, idx) => (
          <div
            key={idx}
            className={cn("h-full transition-all", statusColors[segment.status])}
            style={{ width: `${(segment.pages / templatePages) * 100}%` }}
          />
        ))}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-4 text-sm">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-amber-100 dark:bg-amber-900/50 border" />
          <span>🟨 {counts.designed} מעוצבים</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-emerald-100 dark:bg-emerald-900/50 border" />
          <span>🟩 {counts.content} תוכן התקבל</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-white dark:bg-muted border" />
          <span>⬜ {counts.pending} בהמתנה</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-muted/50 border" />
          <span>░ {counts.empty} פנויים</span>
        </div>
      </div>
    </div>
  );
}
