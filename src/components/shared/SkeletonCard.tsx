import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader } from '@/components/ui/card';

export function SkeletonStatCard() {
  return (
    <Card className="border-border/50">
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-8 w-16" />
            <Skeleton className="h-3 w-20" />
          </div>
          <Skeleton className="h-12 w-12 rounded-lg" />
        </div>
      </CardContent>
    </Card>
  );
}

export function SkeletonTaskCard() {
  return (
    <div className="flex items-center justify-between p-4 rounded-lg bg-muted/30">
      <div className="flex items-center gap-4">
        <Skeleton className="h-4 w-4 rounded-full" />
        <div className="space-y-2">
          <Skeleton className="h-4 w-48" />
          <Skeleton className="h-3 w-24" />
        </div>
      </div>
      <Skeleton className="h-6 w-16 rounded-full" />
    </div>
  );
}

export function SkeletonProjectCard() {
  return (
    <Card className="border-border/50">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-5 w-16 rounded-full" />
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-2 w-full rounded-full" />
        <div className="flex items-center justify-between">
          <Skeleton className="h-3 w-20" />
          <Skeleton className="h-3 w-16" />
        </div>
      </CardContent>
    </Card>
  );
}

export function SkeletonListItem() {
  return (
    <div className="flex items-center gap-4 p-3">
      <Skeleton className="h-10 w-10 rounded-full" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-3 w-1/2" />
      </div>
    </div>
  );
}

export function SkeletonTable({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-4 p-3 border-b border-border">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-4 flex-1" />
        ))}
      </div>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 p-3">
          {[1, 2, 3, 4].map((j) => (
            <Skeleton key={j} className="h-4 flex-1" />
          ))}
        </div>
      ))}
    </div>
  );
}
