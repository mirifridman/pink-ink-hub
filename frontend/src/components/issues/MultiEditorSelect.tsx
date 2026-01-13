import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { ChevronDown, User, UserCheck, X } from "lucide-react";

interface Editor {
  id: string;
  full_name: string | null;
  email: string | null;
}

interface MultiEditorSelectProps {
  selectedEditorIds: string[];
  responsibleEditorId?: string;
  onChange: (editorIds: string[], responsibleEditorId?: string) => void;
  editors: Editor[];
  placeholder?: string;
  disabled?: boolean;
}

export function MultiEditorSelect({
  selectedEditorIds,
  responsibleEditorId,
  onChange,
  editors,
  placeholder = "בחר עורכים",
  disabled,
}: MultiEditorSelectProps) {
  const [open, setOpen] = useState(false);

  const selectedEditors = editors.filter((e) => selectedEditorIds.includes(e.id));

  const handleEditorToggle = (editorId: string, checked: boolean) => {
    let newSelectedIds: string[];
    
    if (checked) {
      newSelectedIds = [...selectedEditorIds, editorId];
    } else {
      newSelectedIds = selectedEditorIds.filter((id) => id !== editorId);
      // If removing the responsible editor, clear responsibleEditorId
      if (editorId === responsibleEditorId) {
        onChange(newSelectedIds, newSelectedIds.length === 1 ? newSelectedIds[0] : undefined);
        return;
      }
    }
    
    // Auto-set responsible editor if only one selected
    const newResponsible = newSelectedIds.length === 1 
      ? newSelectedIds[0] 
      : responsibleEditorId && newSelectedIds.includes(responsibleEditorId) 
        ? responsibleEditorId 
        : undefined;
    
    onChange(newSelectedIds, newResponsible);
  };

  const handleResponsibleChange = (editorId: string) => {
    onChange(selectedEditorIds, editorId);
  };

  const handleRemoveEditor = (editorId: string) => {
    const newSelectedIds = selectedEditorIds.filter((id) => id !== editorId);
    const newResponsible = editorId === responsibleEditorId 
      ? (newSelectedIds.length === 1 ? newSelectedIds[0] : undefined)
      : responsibleEditorId;
    onChange(newSelectedIds, newResponsible);
  };

  const getEditorName = (editor: Editor) => {
    return editor.full_name || editor.email || "עורך";
  };

  return (
    <div className="space-y-2">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className={cn(
              "w-full justify-between font-normal",
              !selectedEditorIds.length && "text-muted-foreground"
            )}
            disabled={disabled}
          >
            {selectedEditorIds.length > 0
              ? `${selectedEditorIds.length} עורכים נבחרו`
              : placeholder}
            <ChevronDown className="mr-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-80 p-0" align="start">
          <div className="p-3 border-b">
            <p className="font-medium text-sm">בחר עורכים</p>
            <p className="text-xs text-muted-foreground">ניתן לבחור מספר עורכים</p>
          </div>
          <div className="max-h-60 overflow-y-auto p-2">
            {editors.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                אין עורכים זמינים
              </p>
            ) : (
              <div className="space-y-1">
                {editors.map((editor) => (
                  <div
                    key={editor.id}
                    className={cn(
                      "flex items-center gap-2 p-2 rounded-md hover:bg-accent cursor-pointer",
                      selectedEditorIds.includes(editor.id) && "bg-accent"
                    )}
                    onClick={() => handleEditorToggle(editor.id, !selectedEditorIds.includes(editor.id))}
                  >
                    <Checkbox
                      checked={selectedEditorIds.includes(editor.id)}
                      onCheckedChange={(checked) => handleEditorToggle(editor.id, !!checked)}
                    />
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span className="flex-1 text-sm">{getEditorName(editor)}</span>
                    {selectedEditorIds.includes(editor.id) && editor.id === responsibleEditorId && (
                      <Badge variant="secondary" className="text-xs">
                        <UserCheck className="h-3 w-3 ml-1" />
                        אחראי
                      </Badge>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
          {selectedEditorIds.length > 0 && (
            <div className="border-t p-2">
              <Button
                variant="ghost"
                size="sm"
                className="w-full"
                onClick={() => {
                  onChange([], undefined);
                  setOpen(false);
                }}
              >
                נקה הכל
              </Button>
            </div>
          )}
        </PopoverContent>
      </Popover>

      {/* Selected editors with responsible editor selection */}
      {selectedEditorIds.length > 0 && (
        <div className="space-y-2">
          <div className="flex flex-wrap gap-1">
            {selectedEditors.map((editor) => (
              <Badge
                key={editor.id}
                variant={editor.id === responsibleEditorId ? "default" : "secondary"}
                className="flex items-center gap-1 pr-1"
              >
                {editor.id === responsibleEditorId && (
                  <UserCheck className="h-3 w-3" />
                )}
                {getEditorName(editor)}
                <button
                  onClick={() => handleRemoveEditor(editor.id)}
                  className="ml-1 hover:bg-background/20 rounded p-0.5"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
          </div>

          {/* Responsible editor selection - only show if more than one editor */}
          {selectedEditorIds.length > 1 && (
            <div className="border rounded-md p-3 bg-muted/30">
              <Label className="text-xs font-medium mb-2 block">עורך אחראי:</Label>
              <RadioGroup
                value={responsibleEditorId || ""}
                onValueChange={handleResponsibleChange}
                className="flex flex-wrap gap-2"
              >
                {selectedEditors.map((editor) => (
                  <div key={editor.id} className="flex items-center space-x-2 space-x-reverse">
                    <RadioGroupItem value={editor.id} id={`responsible-${editor.id}`} />
                    <Label htmlFor={`responsible-${editor.id}`} className="text-sm cursor-pointer">
                      {getEditorName(editor)}
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export function getEditorsDisplayNames(editorIds: string[], editors: Editor[]): string {
  if (!editorIds || editorIds.length === 0) return "ללא";
  const names = editorIds
    .map((id) => {
      const editor = editors.find((e) => e.id === id);
      return editor?.full_name || editor?.email || "עורך";
    })
    .filter(Boolean);
  return names.join(", ");
}
