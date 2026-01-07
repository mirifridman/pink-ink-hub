import { AppLayout } from "@/components/layout/AppLayout";
import { NeonCard, NeonCardContent, NeonCardHeader, NeonCardTitle } from "@/components/ui/NeonCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  Users, 
  Plus, 
  Search,
  Mail,
  MessageCircle,
  Pencil,
  Camera,
  Palette,
  MoreVertical,
  Phone
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Supplier {
  id: string;
  name: string;
  email: string;
  phone: string;
  type: "writer" | "illustrator" | "photographer";
  contactPreference: "email" | "whatsapp" | "both";
  totalWorks: number;
  activeWorks: number;
  avatar?: string;
}

const mockSuppliers: Supplier[] = [
  {
    id: "1",
    name: "דנה כהן",
    email: "dana@example.com",
    phone: "052-1234567",
    type: "writer",
    contactPreference: "email",
    totalWorks: 45,
    activeWorks: 2,
  },
  {
    id: "2",
    name: "יוסי לוי",
    email: "yossi@example.com",
    phone: "054-9876543",
    type: "illustrator",
    contactPreference: "both",
    totalWorks: 78,
    activeWorks: 3,
  },
  {
    id: "3",
    name: "שרה אבידן",
    email: "sara@example.com",
    phone: "050-5555555",
    type: "writer",
    contactPreference: "whatsapp",
    totalWorks: 32,
    activeWorks: 1,
  },
  {
    id: "4",
    name: "מיכל רז",
    email: "michal@example.com",
    phone: "053-1112222",
    type: "illustrator",
    contactPreference: "email",
    totalWorks: 56,
    activeWorks: 2,
  },
  {
    id: "5",
    name: "אורי שמש",
    email: "ori@example.com",
    phone: "058-3334444",
    type: "photographer",
    contactPreference: "both",
    totalWorks: 23,
    activeWorks: 1,
  },
];

const getTypeIcon = (type: string) => {
  switch (type) {
    case "writer":
      return <Pencil className="w-4 h-4" />;
    case "illustrator":
      return <Palette className="w-4 h-4" />;
    case "photographer":
      return <Camera className="w-4 h-4" />;
    default:
      return null;
  }
};

const getTypeLabel = (type: string) => {
  switch (type) {
    case "writer":
      return "כותב/ת";
    case "illustrator":
      return "מאייר/ת";
    case "photographer":
      return "צלם/ת";
    default:
      return type;
  }
};

const getTypeColor = (type: string) => {
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

export default function Suppliers() {
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
          <Button className="gradient-neon text-white neon-shadow">
            <Plus className="w-4 h-4 ml-2" />
            ספק חדש
          </Button>
        </div>

        {/* Search and Filters */}
        <div className="flex items-center gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input placeholder="חיפוש ספקים..." className="pr-10" />
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" className="gap-2">
              <Pencil className="w-4 h-4" />
              כותבים
            </Button>
            <Button variant="outline" size="sm" className="gap-2">
              <Palette className="w-4 h-4" />
              מאיירים
            </Button>
            <Button variant="outline" size="sm" className="gap-2">
              <Camera className="w-4 h-4" />
              צלמים
            </Button>
          </div>
        </div>

        {/* Suppliers Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {mockSuppliers.map((supplier) => (
            <NeonCard key={supplier.id} className="group hover:-translate-y-1 transition-transform">
              <NeonCardContent className="p-5">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-xl gradient-neon flex items-center justify-center text-white font-rubik font-bold text-lg">
                      {supplier.name.charAt(0)}
                    </div>
                    <div>
                      <h3 className="font-rubik font-bold text-lg">{supplier.name}</h3>
                      <span className={cn("inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs border mt-1", getTypeColor(supplier.type))}>
                        {getTypeIcon(supplier.type)}
                        {getTypeLabel(supplier.type)}
                      </span>
                    </div>
                  </div>
                  <Button variant="ghost" size="icon" className="opacity-0 group-hover:opacity-100 transition-opacity">
                    <MoreVertical className="w-4 h-4" />
                  </Button>
                </div>

                <div className="mt-4 space-y-2">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Mail className="w-4 h-4" />
                    <span>{supplier.email}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Phone className="w-4 h-4" />
                    <span dir="ltr">{supplier.phone}</span>
                  </div>
                </div>

                <div className="mt-4 flex items-center justify-between pt-4 border-t">
                  <div className="text-sm">
                    <span className="text-muted-foreground">העדפת קשר: </span>
                    <span className="flex items-center gap-1 inline-flex">
                      {(supplier.contactPreference === "email" || supplier.contactPreference === "both") && (
                        <Mail className="w-4 h-4 text-accent" />
                      )}
                      {(supplier.contactPreference === "whatsapp" || supplier.contactPreference === "both") && (
                        <MessageCircle className="w-4 h-4 text-emerald-500" />
                      )}
                    </span>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    <span className="font-medium text-foreground">{supplier.activeWorks}</span> פעיל • 
                    <span className="font-medium text-foreground"> {supplier.totalWorks}</span> סה"כ
                  </div>
                </div>
              </NeonCardContent>
            </NeonCard>
          ))}
        </div>
      </div>
    </AppLayout>
  );
}
