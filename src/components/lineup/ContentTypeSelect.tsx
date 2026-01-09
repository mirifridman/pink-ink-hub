import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export const CONTENT_TYPES = [
  { value: "cover", label: "שער", color: "bg-rose-500" },
  { value: "inner_cover", label: "שער פנימי", color: "bg-rose-400" },
  { value: "comics", label: "קומיקס", color: "bg-amber-500" },
  { value: "facts", label: "עובדות", color: "bg-emerald-500" },
  { value: "challenge", label: "אתגר", color: "bg-cyan-500" },
  { value: "news", label: "חדשות", color: "bg-blue-500" },
  { value: "regular_section", label: "מדור קבוע", color: "bg-violet-500" },
  { value: "articles", label: "כתבות", color: "bg-indigo-500" },
  { value: "young_writers", label: "מערכת הכתבים הצעירים", color: "bg-pink-500" },
  { value: "light_section", label: "מדור קליל", color: "bg-orange-400" },
  { value: "puzzles", label: "שעשועון", color: "bg-lime-500" },
  { value: "reader_feedback", label: "משוב קוראים", color: "bg-teal-500" },
  { value: "kids", label: "קטנים", color: "bg-purple-400" },
  { value: "editorial", label: "מערכתי", color: "bg-slate-600" },
  { value: "story", label: "סיפור", color: "bg-indigo-400" },
] as const;

export type ContentTypeValue = typeof CONTENT_TYPES[number]["value"];

export function getContentTypeColor(value: string | null | undefined): string {
  const type = CONTENT_TYPES.find(t => t.value === value);
  return type?.color || "bg-muted";
}

export function getContentTypeLabel(value: string | null | undefined): string {
  const type = CONTENT_TYPES.find(t => t.value === value);
  return type?.label || "";
}

interface ContentTypeSelectProps {
  value: string | undefined;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export function ContentTypeSelect({ value, onChange, placeholder = "בחר סוג", className }: ContentTypeSelectProps) {
  return (
    <Select value={value || ""} onValueChange={onChange}>
      <SelectTrigger className={className}>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {CONTENT_TYPES.map((type) => (
          <SelectItem key={type.value} value={type.value}>
            <div className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded-sm ${type.color}`} />
              <span>{type.label}</span>
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
