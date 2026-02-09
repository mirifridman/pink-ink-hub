import { motion } from 'framer-motion';
import { Moon, Sun } from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';
import { cn } from '@/lib/utils';

interface ThemeToggleProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function ThemeToggle({ size = 'md', className }: ThemeToggleProps) {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';

  const sizes = {
    sm: { toggle: 'w-12 h-6', circle: 'w-4 h-4', translate: 'translate-x-6', icon: 'h-3 w-3' },
    md: { toggle: 'w-16 h-8', circle: 'w-6 h-6', translate: 'translate-x-8', icon: 'h-4 w-4' },
    lg: { toggle: 'w-20 h-10', circle: 'w-8 h-8', translate: 'translate-x-10', icon: 'h-5 w-5' },
  };

  const s = sizes[size];

  return (
    <button
      onClick={toggleTheme}
      className={cn(
        'relative rounded-full p-1 transition-all duration-500 ease-in-out',
        isDark 
          ? 'bg-secondary shadow-inner' 
          : 'bg-primary/20 shadow-lg',
        s.toggle,
        className
      )}
      aria-label="Toggle theme"
    >
      {/* Stars in dark mode */}
      {isDark && (
        <>
          <span className="absolute top-1.5 right-2 w-0.5 h-0.5 bg-foreground rounded-full animate-pulse" />
          <span className="absolute top-3 right-3.5 w-1 h-1 bg-foreground/70 rounded-full animate-pulse delay-75" />
          <span className="absolute bottom-2 right-2.5 w-0.5 h-0.5 bg-foreground/50 rounded-full animate-pulse delay-150" />
        </>
      )}
      
      {/* Sun rays in light mode */}
      {!isDark && (
        <span className="absolute inset-0 rounded-full bg-gradient-to-tr from-primary/30 to-accent/30 blur-sm" />
      )}
      
      <motion.div
        initial={false}
        animate={{
          x: isDark ? parseInt(s.translate.split('x-')[1]) * 4 : 0,
          rotate: isDark ? 360 : 0,
        }}
        transition={{
          type: 'spring',
          stiffness: 300,
          damping: 25,
        }}
        className={cn(
          'relative rounded-full flex items-center justify-center shadow-lg',
          isDark 
            ? 'bg-muted text-primary' 
            : 'bg-card text-primary',
          s.circle
        )}
      >
        {isDark ? (
          <Moon className={s.icon} />
        ) : (
          <Sun className={s.icon} />
        )}
      </motion.div>
    </button>
  );
}
