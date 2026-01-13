import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Check, ChevronsUpDown, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { useSuppliers, useCreateSupplier } from "@/hooks/useIssues";
import { Supplier } from "@/types/database";

interface SupplierSelectProps {
  value?: string;
  onChange: (supplierId: string | undefined) => void;
}

export function SupplierSelect({ value, onChange }: SupplierSelectProps) {
  const [open, setOpen] = useState(false);
  const [showNewSupplier, setShowNewSupplier] = useState(false);
  const [newSupplierName, setNewSupplierName] = useState("");
  
  const { data: suppliers, isLoading } = useSuppliers();
  const createSupplier = useCreateSupplier();

  const selectedSupplier = suppliers?.find(s => s.id === value);

  const handleCreateSupplier = async () => {
    if (!newSupplierName.trim()) return;
    
    const result = await createSupplier.mutateAsync({ name: newSupplierName.trim() });
    onChange(result.id);
    setNewSupplierName("");
    setShowNewSupplier(false);
    setOpen(false);
  };

  return (
    <>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between"
          >
            {selectedSupplier?.name || "בחר ספק"}
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
                    onSelect={() => {
                      onChange(supplier.id === value ? undefined : supplier.id);
                      setOpen(false);
                    }}
                  >
                    <Check
                      className={cn(
                        "ml-2 h-4 w-4",
                        value === supplier.id ? "opacity-100" : "opacity-0"
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
