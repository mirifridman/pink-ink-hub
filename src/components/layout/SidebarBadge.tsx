import { cn } from "@/lib/utils";

interface SidebarBadgeProps {
  count: number;
  className?: string;
}

export function SidebarBadge({ count, className }: SidebarBadgeProps) {
  if (count <= 0) return null;

  return (
    <span
      className={cn(
        "mr-auto min-w-[20px] h-5 flex items-center justify-center rounded-full bg-red-500 text-white text-xs font-medium px-1.5",
        className
      )}
    >
      {count > 99 ? "99+" : count}
    </span>
  );
}
