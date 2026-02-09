import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Bell, BellOff, Loader2, Smartphone, AlertCircle } from 'lucide-react';
import { usePushNotifications } from '@/hooks/usePushNotifications';

export function PushNotificationSettings() {
  const { 
    isSupported, 
    isSubscribed, 
    isLoading, 
    permission,
    subscribe, 
    unsubscribe 
  } = usePushNotifications();

  if (!isSupported) {
    return (
      <Card className="border-border/50">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-muted rounded-lg">
              <Smartphone className="h-5 w-5 text-muted-foreground" />
            </div>
            <div>
              <CardTitle className="text-lg">התראות פוש</CardTitle>
              <CardDescription>לא נתמך בדפדפן זה</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <AlertCircle className="h-4 w-4" />
            <span>הדפדפן שלך לא תומך בהתראות פוש. נסה להשתמש ב-Chrome או Firefox.</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-border/50">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${isSubscribed ? 'bg-primary/10' : 'bg-muted'}`}>
              {isSubscribed ? (
                <Bell className="h-5 w-5 text-primary" />
              ) : (
                <BellOff className="h-5 w-5 text-muted-foreground" />
              )}
            </div>
            <div>
              <CardTitle className="text-lg">התראות פוש</CardTitle>
              <CardDescription>קבל התראות ישירות לטלפון</CardDescription>
            </div>
          </div>
          <Badge 
            variant="outline" 
            className={isSubscribed 
              ? 'bg-primary/10 text-primary border-primary/20' 
              : 'bg-muted text-muted-foreground'
            }
          >
            {isSubscribed ? 'פעיל' : 'כבוי'}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {permission === 'denied' ? (
          <div className="flex items-center gap-2 text-sm text-destructive">
            <AlertCircle className="h-4 w-4" />
            <span>התראות חסומות בדפדפן. יש לאפשר בהגדרות הדפדפן.</span>
          </div>
        ) : (
          <>
            <p className="text-sm text-muted-foreground">
              {isSubscribed 
                ? 'אתה מקבל התראות על משימות חדשות, עדכונים ואירועים חשובים.'
                : 'הפעל התראות פוש כדי לקבל עדכונים בזמן אמת על משימות ואירועים חשובים.'}
            </p>
            
            <Button
              onClick={isSubscribed ? unsubscribe : subscribe}
              disabled={isLoading}
              variant={isSubscribed ? 'outline' : 'default'}
              className="w-full sm:w-auto"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 ml-2 animate-spin" />
                  טוען...
                </>
              ) : isSubscribed ? (
                <>
                  <BellOff className="h-4 w-4 ml-2" />
                  כבה התראות
                </>
              ) : (
                <>
                  <Bell className="h-4 w-4 ml-2" />
                  הפעל התראות
                </>
              )}
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  );
}
