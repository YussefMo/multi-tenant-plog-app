import { useTheme } from '@shared/theme';
import { cn } from '@shared/lib/utils';

interface ThemeToggleProps {
  compact?: boolean;
  className?: string;
}

export function ThemeToggle({ compact = false, className }: ThemeToggleProps) {
  const { theme, toggle } = useTheme();
  const next = theme === 'dark' ? 'light' : 'dark';

  return (
    <button
      type="button"
      className={cn('theme-toggle', className)}
      onClick={toggle}
      aria-label={`Switch to ${next} theme`}
      title={`Switch to ${next} theme`}
    >
      <span className="theme-toggle-icon" aria-hidden="true">
        {theme === 'dark' ? '☀' : '☾'}
      </span>
      {!compact && <span>{theme === 'dark' ? 'Light' : 'Dark'}</span>}
    </button>
  );
}
