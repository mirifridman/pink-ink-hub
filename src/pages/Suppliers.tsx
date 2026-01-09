import { useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { NeonCard, NeonCardContent } from "@/components/ui/NeonCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Users, 
  Plus, 
  Search,
  Mail,
  MessageCircle,
  Pencil,
  Camera,
  Palette,
  Phone,
  Trash2,
  Edit,
  Building2,
  FileText,
  ClipboardList
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useSuppliers, useCreateSupplier } from "@/hooks/useIssues";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { SupplierAssignmentsReport } from "@/components/suppliers/SupplierAssignmentsReport";

const supplierTypes = [
  { value: "writer", label: "כותב/ת", icon: Pencil },
  { value: "illustrator", label: "מאייר/ת", icon: Palette },
  { value: "photographer", label: "צלם/ת", icon: Camera },
  { value: "editor", label: "עורכ/ת", icon: FileText },
  { value: "sub_editor", label: "עורכ/ת משנה", icon: FileText },
  { value: "designer", label: "מעצב/ת", icon: Palette },
  { value: "other", label: "אחר", icon: Users },
];

const businessTypes = [
  { value: "licensed", label: "עוסק מורשה" },
  { value: "exempt", label: "עוסק פטור" },
  { value: "company", label: "חברה בע״מ" },
  { value: "artist_salary", label: "שכר אמנים" },
  { value: "payslip", label: "תלוש" },
];

const getTypeIcon = (type: string | null) => {
  const found = supplierTypes.find(t => t.value === type);
  if (found) {
    const Icon = found.icon;
    return <Icon className="w-4 h-4" />;
  }
  return <Users className="w-4 h-4" />;
};

const getTypeLabel = (type: string | null) => {
  const found = supplierTypes.find(t => t.value === type);
  return found?.label || "אחר";
};

const getBusinessTypeLabel = (type: string | null) => {
  const found = businessTypes.find(t => t.value === type);
  return found?.label || "לא צוין";
};

const getTypeColor = (type: string | null) => {
  switch (type) {
    case "writer":
      return "bg-sky-500/10 text-sky-600 border-sky-500/20";
    case "illustrator":
      return "bg-purple-500/10 text-purple-600 border-purple-500/20";
    case "photographer":
      return "bg-amber-500/10 text-amber-600 border-amber-500/20";
    default:
      return "bg-muted text-muted-foreground";
  }
};

const formatPhoneForWhatsApp = (phone: string) => {
  // Remove all non-digit characters and add Israel country code if needed
  let cleaned = phone.replace(/\D/g, "");
  if (cleaned.startsWith("0")) {
    cleaned = "972" + cleaned.slice(1);
  }
  return cleaned;
};

export default function Suppliers() {
  const [activeTab, setActiveTab] = useState("suppliers");
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<string | null>(null);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<any>(null);
  
  // Form state
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    contact_name: "",
    notes: "",
    supplier_type: "writer",
    business_type: "licensed",
  });

  const { data: suppliers, isLoading } = useSuppliers();
  const createSupplier = useCreateSupplier();
  const queryClient = useQueryClient();

  const resetForm = () => {
    setFormData({
      name: "",
      email: "",
      phone: "",
      contact_name: "",
      notes: "",
      supplier_type: "writer",
      business_type: "licensed",
    });
  };

  const handleOpenAdd = () => {
    resetForm();
    setEditingSupplier(null);
    setIsAddOpen(true);
  };

  const handleOpenEdit = (supplier: any) => {
    setFormData({
      name: supplier.name || "",
      email: supplier.email || "",
      phone: supplier.phone || "",
      contact_name: supplier.contact_name || "",
      notes: supplier.notes || "",
      supplier_type: supplier.supplier_type || "writer",
      business_type: supplier.business_type || "licensed",
    });
    setEditingSupplier(supplier);
    setIsAddOpen(true);
  };

  const handleSubmit = async () => {
    if (!formData.name.trim()) {
      toast.error("יש להזין שם ספק");
      return;
    }

    try {
      if (editingSupplier) {
        // Update existing supplier
        const { error } = await supabase
          .from("suppliers")
          .update({
            name: formData.name.trim(),
            email: formData.email.trim() || null,
            phone: formData.phone.trim() || null,
            contact_name: formData.contact_name.trim() || null,
            notes: formData.notes.trim() || null,
            supplier_type: formData.supplier_type,
            business_type: formData.business_type,
          })
          .eq("id", editingSupplier.id);

        if (error) throw error;
        toast.success("הספק עודכן בהצלחה");
      } else {
        // Create new supplier
        const { error } = await supabase
          .from("suppliers")
          .insert({
            name: formData.name.trim(),
            email: formData.email.trim() || null,
            phone: formData.phone.trim() || null,
            contact_name: formData.contact_name.trim() || null,
            notes: formData.notes.trim() || null,
            supplier_type: formData.supplier_type,
            business_type: formData.business_type,
          });

        if (error) throw error;
        toast.success("הספק נוסף בהצלחה");
      }

      queryClient.invalidateQueries({ queryKey: ["suppliers"] });
      setIsAddOpen(false);
      resetForm();
      setEditingSupplier(null);
    } catch (error: any) {
      toast.error("שגיאה: " + error.message);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase
        .from("suppliers")
        .delete()
        .eq("id", id);

      if (error) throw error;
      toast.success("הספק נמחק בהצלחה");
      queryClient.invalidateQueries({ queryKey: ["suppliers"] });
    } catch (error: any) {
      toast.error("שגיאה במחיקת הספק: " + error.message);
    }
  };

  const handleWhatsApp = (phone: string) => {
    const formatted = formatPhoneForWhatsApp(phone);
    window.open(`https://wa.me/${formatted}`, "_blank");
  };

  const handleEmail = (email: string) => {
    window.open(`mailto:${encodeURIComponent(email)}`, "_blank");
  };

  // Filter suppliers
  const filteredSuppliers = suppliers?.filter(supplier => {
    const matchesSearch = !searchQuery || 
      supplier.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      supplier.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      supplier.contact_name?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesType = !filterType || supplier.supplier_type === filterType;
    
    return matchesSearch && matchesType;
  }) || [];

  return (
    <AppLayout>
      <div className="space-y-6 animate-fade-in-up">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-rubik font-bold text-foreground flex items-center gap-3">
              <Users className="w-8 h-8 text-accent" />
              ספקים
            </h1>
            <p className="text-muted-foreground mt-1">ניהול כותבים, מאיירים וצלמים</p>
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="suppliers" className="gap-2">
              <Users className="w-4 h-4" />
              ספקים
            </TabsTrigger>
            <TabsTrigger value="assignments" className="gap-2">
              <ClipboardList className="w-4 h-4" />
              דו״ח הקצאות
            </TabsTrigger>
          </TabsList>

          <TabsContent value="suppliers" className="mt-6 space-y-6">
            {/* Add Supplier Button */}
            <div className="flex justify-end">
              <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
                <DialogTrigger asChild>
                  <Button className="gradient-neon text-white neon-shadow" onClick={handleOpenAdd}>
                    <Plus className="w-4 h-4 ml-2" />
                    ספק חדש
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle>{editingSupplier ? "עריכת ספק" : "הוספת ספק חדש"}</DialogTitle>
                    <DialogDescription>
                      הזן את פרטי הספק
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">שם הספק *</Label>
                      <Input
                        id="name"
                        placeholder="שם מלא או שם עסק"
                        value={formData.name}
                        onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                      />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>סוג ספק</Label>
                        <Select 
                          value={formData.supplier_type} 
                          onValueChange={(v) => setFormData(prev => ({ ...prev, supplier_type: v }))}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {supplierTypes.map(type => (
                              <SelectItem key={type.value} value={type.value}>
                                {type.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div className="space-y-2">
                        <Label>סוג עסק</Label>
                        <Select 
                          value={formData.business_type} 
                          onValueChange={(v) => setFormData(prev => ({ ...prev, business_type: v }))}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {businessTypes.map(type => (
                              <SelectItem key={type.value} value={type.value}>
                                {type.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="contact_name">איש קשר</Label>
                      <Input
                        id="contact_name"
                        placeholder="שם איש הקשר (אם שונה מהספק)"
                        value={formData.contact_name}
                        onChange={(e) => setFormData(prev => ({ ...prev, contact_name: e.target.value }))}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="email">אימייל</Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="email@example.com"
                        value={formData.email}
                        onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="phone">טלפון</Label>
                      <Input
                        id="phone"
                        placeholder="050-1234567"
                        value={formData.phone}
                        onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="notes">הערות</Label>
                      <Textarea
                        id="notes"
                        placeholder="הערות נוספות..."
                        value={formData.notes}
                        onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                        rows={3}
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setIsAddOpen(false)}>
                      ביטול
                    </Button>
                    <Button onClick={handleSubmit}>
                      {editingSupplier ? "עדכן" : "הוסף"}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>

            {/* Search and Filters */}
            <div className="flex items-center gap-4">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input 
                  placeholder="חיפוש ספקים..." 
                  className="pr-10" 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <div className="flex items-center gap-2">
                <Button 
                  variant={filterType === null ? "default" : "outline"} 
                  size="sm"
                  onClick={() => setFilterType(null)}
                >
                  הכל
                </Button>
                {supplierTypes.slice(0, 3).map(type => (
                  <Button 
                    key={type.value}
                    variant={filterType === type.value ? "default" : "outline"} 
                    size="sm" 
                    className="gap-2"
                    onClick={() => setFilterType(type.value)}
                  >
                    <type.icon className="w-4 h-4" />
                    {type.label}
                  </Button>
                ))}
              </div>
            </div>

            {/* Suppliers Grid */}
            {isLoading ? (
              <div className="text-center py-12 text-muted-foreground">טוען ספקים...</div>
            ) : filteredSuppliers.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                {suppliers?.length === 0 ? "אין ספקים במערכת" : "לא נמצאו ספקים התואמים לחיפוש"}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredSuppliers.map((supplier) => (
                  <NeonCard key={supplier.id} className="group hover:-translate-y-1 transition-transform">
                    <NeonCardContent className="p-5">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-4">
                          <div className="w-14 h-14 rounded-xl gradient-neon flex items-center justify-center text-white font-rubik font-bold text-lg">
                            {supplier.name.charAt(0)}
                          </div>
                          <div>
                            <h3 className="font-rubik font-bold text-lg">{supplier.name}</h3>
                            <span className={cn("inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs border mt-1", getTypeColor(supplier.supplier_type))}>
                              {getTypeIcon(supplier.supplier_type)}
                              {getTypeLabel(supplier.supplier_type)}
                            </span>
                          </div>
                        </div>
                        <div className="flex gap-1">
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={() => handleOpenEdit(supplier)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                className="opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:text-destructive"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>מחיקת ספק</AlertDialogTitle>
                                <AlertDialogDescription>
                                  האם אתה בטוח שברצונך למחוק את הספק "{supplier.name}"?
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>ביטול</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleDelete(supplier.id)}
                                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                >
                                  מחק
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </div>

                      <div className="mt-4 space-y-2">
                        {supplier.contact_name && (
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Users className="w-4 h-4" />
                            <span>איש קשר: {supplier.contact_name}</span>
                          </div>
                        )}
                        {supplier.email && (
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Mail className="w-4 h-4" />
                            <span>{supplier.email}</span>
                          </div>
                        )}
                        {supplier.phone && (
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Phone className="w-4 h-4" />
                            <span dir="ltr">{supplier.phone}</span>
                          </div>
                        )}
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Building2 className="w-4 h-4" />
                          <span>{getBusinessTypeLabel(supplier.business_type)}</span>
                        </div>
                      </div>

                      {supplier.notes && (
                        <div className="mt-3 p-2 bg-muted/50 rounded-lg text-sm text-muted-foreground">
                          <FileText className="w-4 h-4 inline ml-1" />
                          {supplier.notes}
                        </div>
                      )}

                      {/* Contact Buttons */}
                      <div className="mt-4 flex items-center gap-2 pt-4 border-t">
                        {supplier.phone && (
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="flex-1 gap-2 text-emerald-600 border-emerald-200 hover:bg-emerald-50"
                            onClick={() => handleWhatsApp(supplier.phone!)}
                          >
                            <MessageCircle className="w-4 h-4" />
                            וואטסאפ
                          </Button>
                        )}
                        {supplier.email && (
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="flex-1 gap-2"
                            onClick={() => handleEmail(supplier.email!)}
                          >
                            <Mail className="w-4 h-4" />
                            אימייל
                          </Button>
                        )}
                      </div>
                    </NeonCardContent>
                  </NeonCard>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="assignments" className="mt-6">
            <SupplierAssignmentsReport />
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}
