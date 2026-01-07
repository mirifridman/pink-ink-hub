import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface Editor {
  id: string;
  full_name: string | null;
  email: string | null;
}

interface EditorSelectProps {
  value?: string;
  onChange: (editorId: string | undefined) => void;
  editors: Editor[];
  placeholder?: string;
  disabled?: boolean;
}

export function EditorSelect({ value, onChange, editors, placeholder = "בחר עורך", disabled }: EditorSelectProps) {
  return (
    <Select
      value={value || "none"}
      onValueChange={(val) => onChange(val === "none" ? undefined : val)}
      disabled={disabled}
    >
      <SelectTrigger className="w-full">
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="none">ללא</SelectItem>
        {editors.map((editor) => (
          <SelectItem key={editor.id} value={editor.id}>
            {editor.full_name || editor.email || "עורך"}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
