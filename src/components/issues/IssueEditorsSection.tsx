import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, X, Users } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface Editor {
  id: string;
  full_name: string | null;
  email: string | null;
}

interface SelectedEditor {
  id: string;
  editor_id: string;
  editor: Editor | null;
}

interface IssueEditorsSectionProps {
  selectedEditors: SelectedEditor[];
  availableEditors: Editor[];
  onAddEditor: (editorId: string) => void;
  onRemoveEditor: (id: string) => void;
  disabled?: boolean;
}

export function IssueEditorsSection({
  selectedEditors,
  availableEditors,
  onAddEditor,
  onRemoveEditor,
  disabled,
}: IssueEditorsSectionProps) {
  const [showAddSelect, setShowAddSelect] = useState(false);

  const selectedEditorIds = selectedEditors.map((e) => e.editor_id);
  const unselectedEditors = availableEditors.filter(
    (e) => !selectedEditorIds.includes(e.id)
  );

  const handleAddEditor = (editorId: string) => {
    onAddEditor(editorId);
    setShowAddSelect(false);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Users className="w-4 h-4 text-muted-foreground" />
        <span className="text-sm font-medium">עורכים בגיליון</span>
      </div>

      <div className="flex flex-wrap gap-2">
        {selectedEditors.map((selected) => (
          <Badge
            key={selected.id}
            variant="secondary"
            className="flex items-center gap-1 pr-1"
          >
            {selected.editor?.full_name || selected.editor?.email || "עורך"}
            {!disabled && (
              <Button
                variant="ghost"
                size="icon"
                className="h-4 w-4 p-0 hover:bg-transparent"
                onClick={() => onRemoveEditor(selected.id)}
              >
                <X className="w-3 h-3" />
              </Button>
            )}
          </Badge>
        ))}

        {!disabled && !showAddSelect && unselectedEditors.length > 0 && (
          <Button
            variant="outline"
            size="sm"
            className="h-6 text-xs"
            onClick={() => setShowAddSelect(true)}
          >
            <Plus className="w-3 h-3 ml-1" />
            הוסף עורך
          </Button>
        )}

        {showAddSelect && (
          <div className="flex items-center gap-2">
            <Select onValueChange={handleAddEditor}>
              <SelectTrigger className="w-40 h-7 text-xs">
                <SelectValue placeholder="בחר עורך" />
              </SelectTrigger>
              <SelectContent>
                {unselectedEditors.map((editor) => (
                  <SelectItem key={editor.id} value={editor.id}>
                    {editor.full_name || editor.email || "עורך"}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={() => setShowAddSelect(false)}
            >
              <X className="w-3 h-3" />
            </Button>
          </div>
        )}
      </div>

      {selectedEditors.length === 0 && (
        <p className="text-xs text-muted-foreground">לא הוגדרו עורכים לגיליון זה</p>
      )}
    </div>
  );
}
