import { useState, useMemo } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Search, FileText, Paperclip, Loader2, FolderOpen, CheckCircle2, XCircle } from 'lucide-react';
import { useProcedures, useCategories, ProcedureWithStats } from '@/hooks/useProcedures';
import { ProcedureModal } from '@/components/procedures/ProcedureModal';

export default function Procedures() {
  const { data: procedures, isLoading } = useProcedures();
  const { data: categories } = useCategories();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedProcedureId, setSelectedProcedureId] = useState<string | null>(null);

  const filteredProcedures = useMemo(() => {
    if (!procedures) return [];
    
    let filtered = procedures;

    // Filter by category
    if (selectedCategory !== 'all') {
      if (selectedCategory === 'uncategorized') {
        filtered = filtered.filter((p) => !p.category);
      } else {
        filtered = filtered.filter((p) => p.category === selectedCategory);
      }
    }

    // Filter by search
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (p) =>
          p.title.toLowerCase().includes(query) ||
          p.content?.toLowerCase().includes(query) ||
          p.category?.toLowerCase().includes(query)
      );
    }

    return filtered;
  }, [procedures, searchQuery, selectedCategory]);

  const activeCount = procedures?.filter((p) => p.is_active).length || 0;
  const totalCount = procedures?.length || 0;

  const handleAddProcedure = () => {
    setSelectedProcedureId(null);
    setModalOpen(true);
  };

  const handleEditProcedure = (procedureId: string) => {
    setSelectedProcedureId(procedureId);
    setModalOpen(true);
  };

  return (
    <AppLayout
      title="ספריית נהלים"
      subtitle={`${totalCount} נהלים • ${activeCount} פעילים`}
    >
      {/* Header Actions */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="חיפוש לפי כותרת או תוכן..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pr-10"
          />
        </div>
        <Button onClick={handleAddProcedure}>
          <Plus className="h-4 w-4 ml-2" />
          נוהל חדש
        </Button>
      </div>

      {/* Category Tabs */}
      {categories && categories.length > 0 && (
        <Tabs value={selectedCategory} onValueChange={setSelectedCategory} className="mb-6">
          <TabsList className="flex flex-wrap h-auto gap-1 p-1 w-full sm:w-auto">
            <TabsTrigger value="all" className="text-xs sm:text-sm px-2 sm:px-3 py-1.5">הכל</TabsTrigger>
            {categories.map((cat) => (
              <TabsTrigger key={cat} value={cat} className="text-xs sm:text-sm px-2 sm:px-3 py-1.5">
                {cat}
              </TabsTrigger>
            ))}
            <TabsTrigger value="uncategorized" className="text-xs sm:text-sm px-2 sm:px-3 py-1.5">ללא קטגוריה</TabsTrigger>
          </TabsList>
        </Tabs>
      )}

      {/* Loading State */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : filteredProcedures.length === 0 ? (
        <Card className="border-border/50">
          <CardContent className="p-12 text-center">
            <FileText className="h-16 w-16 mx-auto text-muted-foreground/50 mb-4" />
            <h3 className="text-lg font-medium mb-2">
              {searchQuery || selectedCategory !== 'all' ? 'לא נמצאו נהלים' : 'אין נהלים עדיין'}
            </h3>
            <p className="text-muted-foreground mb-4">
              {searchQuery || selectedCategory !== 'all'
                ? 'נסה לשנות את החיפוש או הסינון'
                : 'צור את הנוהל הראשון'}
            </p>
            {!searchQuery && selectedCategory === 'all' && (
              <Button onClick={handleAddProcedure}>
                <Plus className="h-4 w-4 ml-2" />
                נוהל חדש
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {filteredProcedures.map((procedure) => (
            <ProcedureCard
              key={procedure.id}
              procedure={procedure}
              onClick={() => handleEditProcedure(procedure.id)}
            />
          ))}
        </div>
      )}

      {/* Procedure Modal */}
      <ProcedureModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        procedureId={selectedProcedureId}
      />
    </AppLayout>
  );
}

interface ProcedureCardProps {
  procedure: ProcedureWithStats;
  onClick: () => void;
}

function ProcedureCard({ procedure, onClick }: ProcedureCardProps) {
  return (
    <Card
      className="border-border/50 hover:border-primary/50 hover:shadow-lg transition-all cursor-pointer"
      onClick={onClick}
    >
      <CardContent className="p-5">
        <div className="flex items-start gap-4">
          {/* Icon */}
          <div className="shrink-0 p-2 rounded-lg bg-primary/10">
            <FileText className="h-6 w-6 text-primary" />
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2 mb-2">
              <h3 className="font-semibold text-foreground truncate">
                {procedure.title}
              </h3>
              <div className="flex items-center gap-2 shrink-0">
                {procedure.is_active ? (
                  <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500/20">
                    <CheckCircle2 className="h-3 w-3 ml-1" />
                    פעיל
                  </Badge>
                ) : (
                  <Badge variant="outline" className="bg-muted text-muted-foreground">
                    <XCircle className="h-3 w-3 ml-1" />
                    לא פעיל
                  </Badge>
                )}
              </div>
            </div>

            {procedure.content && (
              <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                {procedure.content}
              </p>
            )}

            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              {procedure.category && (
                <div className="flex items-center gap-1">
                  <FolderOpen className="h-3 w-3" />
                  <span>{procedure.category}</span>
                </div>
              )}
              {procedure.documents_count > 0 && (
                <div className="flex items-center gap-1">
                  <Paperclip className="h-3 w-3" />
                  <span>{procedure.documents_count} מסמכים</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
