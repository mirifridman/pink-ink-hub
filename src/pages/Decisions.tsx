import { useState, useMemo } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Search, Scale, Paperclip, Loader2, Calendar, FolderKanban, User } from 'lucide-react';
import { useDecisions, DecisionWithDetails } from '@/hooks/useDecisions';
import { DecisionModal } from '@/components/decisions/DecisionModal';
import { format } from 'date-fns';
import { he } from 'date-fns/locale';

const statusOptions = [
  { value: 'all', label: 'הכל' },
  { value: 'active', label: 'פעיל', color: 'bg-green-500/10 text-green-500 border-green-500/20' },
  { value: 'archived', label: 'בארכיון', color: 'bg-muted text-muted-foreground' },
  { value: 'superseded', label: 'הוחלף', color: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20' },
];

export default function Decisions() {
  const { data: decisions, isLoading } = useDecisions();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedDecisionId, setSelectedDecisionId] = useState<string | null>(null);

  const filteredDecisions = useMemo(() => {
    if (!decisions) return [];
    
    let filtered = decisions;

    // Filter by status
    if (selectedStatus !== 'all') {
      filtered = filtered.filter((d) => d.status === selectedStatus);
    }

    // Filter by search
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (d) =>
          d.title.toLowerCase().includes(query) ||
          d.description?.toLowerCase().includes(query) ||
          d.decided_by?.toLowerCase().includes(query) ||
          d.project_name?.toLowerCase().includes(query)
      );
    }

    return filtered;
  }, [decisions, searchQuery, selectedStatus]);

  const totalCount = decisions?.length || 0;
  const activeCount = decisions?.filter((d) => d.status === 'active').length || 0;

  const handleAddDecision = () => {
    setSelectedDecisionId(null);
    setModalOpen(true);
  };

  const handleEditDecision = (decisionId: string) => {
    setSelectedDecisionId(decisionId);
    setModalOpen(true);
  };

  return (
    <AppLayout
      title="מעקב החלטות"
      subtitle={`${totalCount} החלטות • ${activeCount} פעילות`}
    >
      {/* Header Actions */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="חיפוש לפי כותרת, תיאור או מחליט..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pr-10"
          />
        </div>
        <Button onClick={handleAddDecision}>
          <Plus className="h-4 w-4 ml-2" />
          החלטה חדשה
        </Button>
      </div>

      {/* Status Tabs */}
      <Tabs value={selectedStatus} onValueChange={setSelectedStatus} className="mb-6">
        <TabsList className="flex w-full sm:w-auto flex-wrap gap-1 h-auto p-1">
          {statusOptions.map((option) => (
            <TabsTrigger key={option.value} value={option.value} className="text-xs sm:text-sm px-2 sm:px-3 py-1.5">
              {option.label}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {/* Loading State */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : filteredDecisions.length === 0 ? (
        <Card className="border-border/50">
          <CardContent className="p-12 text-center">
            <Scale className="h-16 w-16 mx-auto text-muted-foreground/50 mb-4" />
            <h3 className="text-lg font-medium mb-2">
              {searchQuery || selectedStatus !== 'all' ? 'לא נמצאו החלטות' : 'אין החלטות עדיין'}
            </h3>
            <p className="text-muted-foreground mb-4">
              {searchQuery || selectedStatus !== 'all'
                ? 'נסה לשנות את החיפוש או הסינון'
                : 'צור את ההחלטה הראשונה'}
            </p>
            {!searchQuery && selectedStatus === 'all' && (
              <Button onClick={handleAddDecision}>
                <Plus className="h-4 w-4 ml-2" />
                החלטה חדשה
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {filteredDecisions.map((decision) => (
            <DecisionCard
              key={decision.id}
              decision={decision}
              onClick={() => handleEditDecision(decision.id)}
            />
          ))}
        </div>
      )}

      {/* Decision Modal */}
      <DecisionModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        decisionId={selectedDecisionId}
      />
    </AppLayout>
  );
}

interface DecisionCardProps {
  decision: DecisionWithDetails;
  onClick: () => void;
}

function DecisionCard({ decision, onClick }: DecisionCardProps) {
  const statusOption = statusOptions.find((s) => s.value === decision.status);

  return (
    <Card
      className="border-border/50 hover:border-primary/50 hover:shadow-lg transition-all cursor-pointer"
      onClick={onClick}
    >
      <CardContent className="p-5">
        <div className="flex items-start gap-4">
          {/* Icon */}
          <div className="shrink-0 p-2 rounded-lg bg-primary/10">
            <Scale className="h-6 w-6 text-primary" />
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2 mb-2">
              <h3 className="font-semibold text-foreground truncate">
                {decision.title}
              </h3>
              {statusOption && statusOption.color && (
                <Badge variant="outline" className={statusOption.color}>
                  {statusOption.label}
                </Badge>
              )}
            </div>

            {decision.description && (
              <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                {decision.description}
              </p>
            )}

            <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
              {decision.decision_date && (
                <div className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  <span>
                    {format(new Date(decision.decision_date), 'd בMMM yyyy', { locale: he })}
                  </span>
                </div>
              )}
              {decision.decided_by && (
                <div className="flex items-center gap-1">
                  <User className="h-3 w-3" />
                  <span>{decision.decided_by}</span>
                </div>
              )}
              {decision.project_name && (
                <div className="flex items-center gap-1">
                  <FolderKanban className="h-3 w-3" />
                  <span>{decision.project_name}</span>
                </div>
              )}
              {decision.documents_count > 0 && (
                <div className="flex items-center gap-1">
                  <Paperclip className="h-3 w-3" />
                  <span>{decision.documents_count} מסמכים</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
