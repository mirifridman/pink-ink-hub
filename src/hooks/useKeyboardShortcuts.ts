import { useEffect, useCallback } from 'react';

interface ShortcutConfig {
  key: string;
  ctrl?: boolean;
  meta?: boolean;
  shift?: boolean;
  alt?: boolean;
  action: () => void;
  description?: string;
}

export function useKeyboardShortcuts(shortcuts: ShortcutConfig[]) {
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    // Don't trigger shortcuts when typing in inputs
    const target = event.target as HTMLElement;
    if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
      // Allow Escape to work in inputs
      if (event.key !== 'Escape') {
        return;
      }
    }

    for (const shortcut of shortcuts) {
      const ctrlMatch = shortcut.ctrl ? (event.ctrlKey || event.metaKey) : !event.ctrlKey;
      const metaMatch = shortcut.meta ? event.metaKey : true;
      const shiftMatch = shortcut.shift ? event.shiftKey : !event.shiftKey;
      const altMatch = shortcut.alt ? event.altKey : !event.altKey;
      const keyMatch = event.key.toLowerCase() === shortcut.key.toLowerCase();

      if (keyMatch && ctrlMatch && shiftMatch && altMatch) {
        event.preventDefault();
        shortcut.action();
        break;
      }
    }
  }, [shortcuts]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);
}

export function useEscapeKey(onEscape: () => void) {
  useKeyboardShortcuts([
    { key: 'Escape', action: onEscape }
  ]);
}
