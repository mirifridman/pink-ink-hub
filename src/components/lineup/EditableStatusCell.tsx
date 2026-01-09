import { useState } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useHasPermission } from "@/hooks/usePermissions";
import { cn } from "@/lib/utils";
import { HelpCircle, Check } from "lucide-react";

interface EditableStatusCellProps {
  lineupItemId: string;
  field: "text_ready" | "files_ready" | "is_designed";
  initialValue: boolean;
  designStatus?: string | null; // To detect standby state for is_designed field
  onUpdate?: () => void;
}

export function EditableStatusCell({
  lineupItemId,
  field,
  initialValue,
  designStatus,
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

  // Check if this is a standby state for the is_designed field
  const isStandby = field === "is_designed" && designStatus === "standby";

  const handleToggle = async () => {
    if (!canEdit) {
      toast.error("אין לך הרשאה לעדכן שדה זה");
      return;
    }

    setIsUpdating(true);
    
    // For standby items, clicking confirms the design and returns to 'designed' status
    if (isStandby) {
      const { error } = await supabase
        .from("lineup_items")
        .update({ 
          is_designed: true,
          design_status: "designed" 
        })
        .eq("id", lineupItemId);

      if (error) {
        console.error("Error updating status:", error);
        toast.error("שגיאה בעדכון הסטטוס");
        setIsUpdating(false);
        return;
      }

      setIsChecked(true);
      setIsUpdating(false);
      toast.success("העיצוב אושר מחדש");
      onUpdate?.();
      return;
    }

    // Regular toggle behavior
    const newValue = !isChecked;
    const updates: any = { [field]: newValue };
    
    // If marking as designed, also set design_status
    if (field === "is_designed") {
      updates.design_status = newValue ? "designed" : "pending";
    }
    
    const { error } = await supabase
      .from("lineup_items")
      .update(updates)
      .eq("id", lineupItemId);

    if (error) {
      console.error("Error updating status:", error);
      toast.error("שגיאה בעדכון הסטטוס");
      setIsUpdating(false);
      return;
    }

    setIsChecked(newValue);
    setIsUpdating(false);
    toast.success("סטטוס עודכן");
    onUpdate?.();
  };

  // Standby state: show "?" on red background
  if (isStandby) {
    return (
      <button
        onClick={handleToggle}
        disabled={!canEdit || isUpdating}
        className={cn(
          "w-5 h-5 rounded flex items-center justify-center transition-colors",
          "bg-destructive text-destructive-foreground",
          canEdit && !isUpdating && "hover:bg-destructive/80 cursor-pointer",
          (!canEdit || isUpdating) && "opacity-50 cursor-not-allowed"
        )}
        title="לחץ לאישור העיצוב מחדש"
      >
        <HelpCircle className="w-3.5 h-3.5" />
      </button>
    );
  }

  // Designed state: show checkmark on black background
  if (field === "is_designed" && isChecked) {
    return (
      <button
        onClick={handleToggle}
        disabled={!canEdit || isUpdating}
        className={cn(
          "w-5 h-5 rounded flex items-center justify-center transition-colors",
          "bg-foreground text-background",
          canEdit && !isUpdating && "hover:bg-foreground/80 cursor-pointer",
          (!canEdit || isUpdating) && "opacity-50 cursor-not-allowed"
        )}
        title="לחץ לביטול סימון העיצוב"
      >
        <Check className="w-3.5 h-3.5" />
      </button>
    );
  }

  // Regular checkbox for other states
  return (
    <Checkbox
      checked={isChecked}
      onCheckedChange={handleToggle}
      disabled={!canEdit || isUpdating}
      className="w-5 h-5"
    />
  );
}
