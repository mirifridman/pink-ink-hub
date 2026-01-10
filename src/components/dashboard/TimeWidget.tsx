import { useState, useEffect } from "react";
import { Calendar } from "lucide-react";

export const TimeWidget = () => {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const formatDate = () => {
    return time.toLocaleDateString('he-IL', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  return (
    <div className="bg-gradient-to-br from-accent to-accent/70 rounded-[20px] p-6 relative overflow-hidden text-white h-full">
      {/* Glow effect */}
      <div className="absolute -top-1/2 -right-1/2 w-full h-full bg-[radial-gradient(circle,rgba(255,255,255,0.1)_0%,transparent_60%)] animate-pulse-glow" />
      
      {/* Decorative elements */}
      <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-white opacity-10 rounded-full blur-3xl" />
      <div className="absolute -top-10 -right-10 w-32 h-32 bg-white opacity-10 rounded-full blur-2xl" />
      
      <div className="relative z-10 h-full flex flex-col justify-center">
        <div className="flex items-center justify-center gap-2 text-sm opacity-90 mb-4">
          <Calendar className="w-4 h-4" />
          <span>{formatDate()}</span>
        </div>
        <div className="text-center">
          <div className="text-5xl md:text-6xl font-bold tracking-wide text-shadow-lg tabular-nums">
            <span>{time.getHours().toString().padStart(2, '0')}</span>
            <span className="animate-pulse">:</span>
            <span>{time.getMinutes().toString().padStart(2, '0')}</span>
            <span className="text-2xl opacity-70 mr-1">:{time.getSeconds().toString().padStart(2, '0')}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
