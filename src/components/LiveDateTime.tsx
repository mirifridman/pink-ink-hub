import { useEffect, useState } from 'react';
import { Calendar, Clock } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

export const LiveDateTime = () => {
  const [dateTime, setDateTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setDateTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('he-IL', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }).format(date);
  };

  const formatTime = (date: Date) => {
    return new Intl.DateTimeFormat('he-IL', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    }).format(date);
  };

  return (
    <Card className="bg-gradient-to-br from-primary/90 to-accent/80 text-primary-foreground overflow-hidden relative">
      <CardContent className="pt-6">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            <span className="text-lg font-medium transition-all duration-300">
              {formatDate(dateTime)}
            </span>
          </div>
          
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5" />
            <span 
              className="text-4xl font-bold tabular-nums transition-all duration-300"
              style={{
                textShadow: '0 2px 10px rgba(0,0,0,0.2)'
              }}
            >
              {formatTime(dateTime)}
            </span>
          </div>
        </div>

        {/* Decorative elements */}
        <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-white opacity-10 rounded-full blur-3xl" />
        <div className="absolute -top-10 -right-10 w-32 h-32 bg-white opacity-10 rounded-full blur-2xl" />
      </CardContent>
    </Card>
  );
};
