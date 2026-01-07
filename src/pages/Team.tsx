import { useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { NeonCard, NeonCardContent } from "@/components/ui/NeonCard";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, User, Mail, Phone, MessageCircle } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";

interface TeamMember {
  id: string;
  full_name: string | null;
  email: string | null;
  role: string;
}

const roleLabels: Record<string, string> = {
  admin: "מנהל",
  editor: "עורך",
  designer: "מעצב",
  publisher: "הוצאה לאור"
};

const roleColors: Record<string, string> = {
  admin: "bg-red-500/20 text-red-400 border-red-500/30",
  editor: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  designer: "bg-purple-500/20 text-purple-400 border-purple-500/30",
  publisher: "bg-green-500/20 text-green-400 border-green-500/30"
};

export default function Team() {
  const [search, setSearch] = useState("");

  const { data: teamMembers = [], isLoading } = useQuery({
    queryKey: ["team-members"],
    queryFn: async () => {
      // Get all users with roles
      const { data: roles, error: rolesError } = await supabase
        .from("user_roles")
        .select("user_id, role");

      if (rolesError) throw rolesError;

      const userIds = roles?.map(r => r.user_id) || [];

      if (userIds.length === 0) return [];

      // Get profiles for those users
      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select("id, full_name, email")
        .in("id", userIds);

      if (profilesError) throw profilesError;

      return profiles?.map(p => ({
        id: p.id,
        full_name: p.full_name,
        email: p.email,
        role: roles?.find(r => r.user_id === p.id)?.role || ""
      })) || [];
    }
  });

  const filteredMembers = teamMembers.filter(member =>
    member.full_name?.toLowerCase().includes(search.toLowerCase()) ||
    member.email?.toLowerCase().includes(search.toLowerCase()) ||
    roleLabels[member.role]?.includes(search)
  );

  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-rubik font-bold text-foreground">אנשי צוות</h1>
          <p className="text-muted-foreground mt-1">רשימת אנשי הצוות במערכת</p>
        </div>

        {/* Search */}
        <div className="relative max-w-md">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="חיפוש לפי שם, אימייל או תפקיד..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pr-10"
          />
        </div>

        {/* Team Grid */}
        {isLoading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <NeonCard key={i}>
                <NeonCardContent className="p-6">
                  <Skeleton className="h-12 w-12 rounded-full mb-4" />
                  <Skeleton className="h-5 w-32 mb-2" />
                  <Skeleton className="h-4 w-24 mb-4" />
                  <Skeleton className="h-4 w-full" />
                </NeonCardContent>
              </NeonCard>
            ))}
          </div>
        ) : filteredMembers.length === 0 ? (
          <div className="text-center py-12">
            <User className="w-12 h-12 mx-auto text-muted-foreground/50 mb-3" />
            <p className="text-muted-foreground">לא נמצאו אנשי צוות</p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filteredMembers.map((member) => (
              <NeonCard key={member.id} variant="glow" className="hover:scale-[1.02] transition-transform">
                <NeonCardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-neon-pink to-neon-purple flex items-center justify-center text-white font-bold text-lg">
                      {member.full_name?.charAt(0) || "?"}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-foreground truncate">
                        {member.full_name || "ללא שם"}
                      </h3>
                      <span className={`inline-block px-2 py-0.5 text-xs rounded-full border mt-1 ${roleColors[member.role] || "bg-muted text-muted-foreground"}`}>
                        {roleLabels[member.role] || member.role}
                      </span>
                    </div>
                  </div>

                  {member.email && (
                    <div className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
                      <Mail className="w-4 h-4 shrink-0" />
                      <span className="truncate">{member.email}</span>
                    </div>
                  )}

                  <div className="mt-4 flex gap-2">
                    {member.email && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1"
                        asChild
                      >
                        <a href={`mailto:${member.email}`}>
                          <Mail className="w-4 h-4 ml-1" />
                          אימייל
                        </a>
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1"
                      asChild
                    >
                      <a href={`/messages`}>
                        <MessageCircle className="w-4 h-4 ml-1" />
                        הודעה
                      </a>
                    </Button>
                  </div>
                </NeonCardContent>
              </NeonCard>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
