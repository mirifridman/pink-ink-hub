import { useState } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useHasPermission } from "@/hooks/usePermissions";

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

  // Permission check based on field
  const canEditTextReady = useHasPermission("edit_lineup_text_ready");
  const canEditFilesReady = useHasPermission("edit_lineup_files_ready");
  const canEditIsDesigned = useHasPermission("edit_lineup_is_designed");

  const canEdit = (() => {
    if (field === "text_ready") return canEditTextReady;
    if (field === "files_ready") return canEditFilesReady;
    if (field === "is_designed") return canEditIsDesigned;
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
