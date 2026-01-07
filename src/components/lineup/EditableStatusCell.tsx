import { useState } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

interface EditableStatusCellProps {
  lineupItemId: string;
  field: "text_ready" | "files_ready" | "is_designed";
  initialValue: boolean;
  onUpdate?: () => void;
}

export function EditableStatusCell({
  lineupItemId,
  field,
  initialValue,
  onUpdate,
}: EditableStatusCellProps) {
  const [isChecked, setIsChecked] = useState(initialValue);
  const [isUpdating, setIsUpdating] = useState(false);
  const { role } = useAuth();

  // Permission check
  const canEdit = (() => {
    if (role === "admin") return true;
    if (role === "designer" && field === "is_designed") return true;
    if (role === "editor" && field !== "is_designed") return true;
    return false;
  })();

  const handleToggle = async (checked: boolean) => {
    if (!canEdit) {
      toast.error("אין לך הרשאה לעדכן שדה זה");
      return;
    }

    setIsUpdating(true);
    const { error } = await supabase
      .from("lineup_items")
      .update({ [field]: checked })
      .eq("id", lineupItemId);

    if (error) {
      console.error("Error updating status:", error);
      toast.error("שגיאה בעדכון הסטטוס");
      setIsUpdating(false);
      return;
    }

    setIsChecked(checked);
    setIsUpdating(false);
    toast.success("סטטוס עודכן");
    onUpdate?.();
  };

  return (
    <Checkbox
      checked={isChecked}
      onCheckedChange={handleToggle}
      disabled={!canEdit || isUpdating}
      className="w-5 h-5"
    />
  );
}
