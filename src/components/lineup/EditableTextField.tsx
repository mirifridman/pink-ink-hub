import { useState, useRef, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Check, X } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";

interface EditableTextFieldProps {
  lineupItemId: string;
  field: "content" | "source" | "notes";
  initialValue: string;
  placeholder?: string;
  onUpdate?: () => void;
  className?: string;
}

export function EditableTextField({
  lineupItemId,
  field,
  initialValue,
  placeholder,
  onUpdate,
  className,
}: EditableTextFieldProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [value, setValue] = useState(initialValue);
  const [isUpdating, setIsUpdating] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const { role } = useAuth();

  // Only editors and admins can edit
  const canEdit = role === "admin" || role === "editor";

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleSave = async () => {
    if (value === initialValue) {
      setIsEditing(false);
      return;
    }

    setIsUpdating(true);
    const { error } = await supabase
      .from("lineup_items")
      .update({ [field]: value || null })
      .eq("id", lineupItemId);

    if (error) {
      console.error("Error updating field:", error);
      toast.error("שגיאה בשמירה");
      setValue(initialValue);
      setIsUpdating(false);
      setIsEditing(false);
      return;
    }

    setIsUpdating(false);
    setIsEditing(false);
    toast.success("השדה עודכן");
    onUpdate?.();
  };

  const handleCancel = () => {
    setValue(initialValue);
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSave();
    } else if (e.key === "Escape") {
      handleCancel();
    }
  };

  if (!canEdit) {
    return (
      <span className={cn("text-sm", !value && "text-muted-foreground", className)}>
        {value || placeholder || "—"}
      </span>
    );
  }

  if (isEditing) {
    return (
      <div className="flex items-center gap-1">
        <Input
          ref={inputRef}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder={placeholder}
          className="h-8 text-sm"
          onBlur={handleSave}
          onKeyDown={handleKeyDown}
          disabled={isUpdating}
        />
        <Button
          size="sm"
          variant="ghost"
          onClick={handleSave}
          disabled={isUpdating}
          className="h-8 w-8 p-0"
        >
          <Check className="w-4 h-4 text-emerald-500" />
        </Button>
        <Button
          size="sm"
          variant="ghost"
          onClick={handleCancel}
          disabled={isUpdating}
          className="h-8 w-8 p-0"
        >
          <X className="w-4 h-4 text-destructive" />
        </Button>
      </div>
    );
  }

  return (
    <div
      onClick={() => setIsEditing(true)}
      className={cn(
        "cursor-pointer hover:bg-muted/50 p-1 rounded min-h-[28px] flex items-center transition-colors",
        !value && "text-muted-foreground",
        className
      )}
      title="לחץ לעריכה"
    >
      {value || placeholder || "—"}
    </div>
  );
}
