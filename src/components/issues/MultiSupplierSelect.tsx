import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Check, ChevronsUpDown, Plus, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useSuppliers, useCreateSupplier } from "@/hooks/useIssues";

interface MultiSupplierSelectProps {
  value: string[];
  onChange: (supplierIds: string[]) => void;
}

export function MultiSupplierSelect({ value, onChange }: MultiSupplierSelectProps) {
  const [open, setOpen] = useState(false);
  const [showNewSupplier, setShowNewSupplier] = useState(false);
  const [newSupplierName, setNewSupplierName] = useState("");
  
  const { data: suppliers, isLoading } = useSuppliers();
  const createSupplier = useCreateSupplier();

  const selectedSuppliers = suppliers?.filter(s => value.includes(s.id)) || [];

  const handleToggleSupplier = (supplierId: string) => {
    if (value.includes(supplierId)) {
      onChange(value.filter(id => id !== supplierId));
    } else {
      onChange([...value, supplierId]);
    }
  };

  const handleRemoveSupplier = (supplierId: string) => {
    onChange(value.filter(id => id !== supplierId));
  };

  const handleCreateSupplier = async () => {
    if (!newSupplierName.trim()) return;
    
    const result = await createSupplier.mutateAsync({ name: newSupplierName.trim() });
    onChange([...value, result.id]);
    setNewSupplierName("");
    setShowNewSupplier(false);
  };

  return (
    <>
      <div className="space-y-2">
        {/* Selected suppliers badges */}
        {selectedSuppliers.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {selectedSuppliers.map((supplier) => (
              <Badge key={supplier.id} variant="secondary" className="text-xs">
                {supplier.name}
                <button
                  type="button"
                  onClick={() => handleRemoveSupplier(supplier.id)}
                  className="mr-1 hover:text-destructive"
                >
                  <X className="w-3 h-3" />
                </button>
              </Badge>
            ))}
          </div>
        )}
        
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              role="combobox"
              aria-expanded={open}
              className="w-full justify-between"
              size="sm"
            >
              {selectedSuppliers.length === 0 
                ? "בחר ספקים" 
                : `${selectedSuppliers.length} ספקים נבחרו`}
              <ChevronsUpDown className="mr-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[300px] p-0" align="start">
            <Command>
              <CommandInput placeholder="חפש ספק..." />
              <CommandList>
                <CommandEmpty>
                  <div className="p-2 text-center">
                    <p className="text-sm text-muted-foreground mb-2">לא נמצאו ספקים</p>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowNewSupplier(true)}
                      className="w-full"
                    >
                      <Plus className="w-4 h-4 ml-2" />
                      הוסף ספק חדש
                    </Button>
                  </div>
                </CommandEmpty>
                <CommandGroup>
                  {suppliers?.map((supplier) => (
                    <CommandItem
                      key={supplier.id}
                      value={supplier.name}
                      onSelect={() => handleToggleSupplier(supplier.id)}
                    >
                      <Check
                        className={cn(
                          "ml-2 h-4 w-4",
                          value.includes(supplier.id) ? "opacity-100" : "opacity-0"
                        )}
                      />
                      {supplier.name}
                    </CommandItem>
                  ))}
                </CommandGroup>
                <div className="p-2 border-t">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowNewSupplier(true)}
                    className="w-full justify-start"
                  >
                    <Plus className="w-4 h-4 ml-2" />
                    הוסף ספק חדש
                  </Button>
                </div>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
      </div>

      <Dialog open={showNewSupplier} onOpenChange={setShowNewSupplier}>
        <DialogContent dir="rtl">
          <DialogHeader>
            <DialogTitle>ספק חדש</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>שם הספק</Label>
              <Input
                value={newSupplierName}
                onChange={(e) => setNewSupplierName(e.target.value)}
                placeholder="הזן שם ספק"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNewSupplier(false)}>
              ביטול
            </Button>
            <Button onClick={handleCreateSupplier} disabled={!newSupplierName.trim()}>
              הוסף ספק
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
