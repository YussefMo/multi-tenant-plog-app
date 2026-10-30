import { useTheme } from '@shared/theme';
import { cn } from '@shared/lib/utils';

interface LogoProps {
  src?: string;
  alt?: string;
  width?: number;
  height?: number;
  invertOnDark?: boolean;
  className?: string;
}

export default function Logo({
  src,
  alt = 'Logo',
  width = 150,
  height = 40,
  invertOnDark = false,
  className,
}: LogoProps) {
  const { theme } = useTheme();

  if (!src) {
    return (
      <div
        className={cn(
          'bg-muted text-muted-foreground flex items-center justify-center rounded-md text-xs',
          className,
        )}
        style={{ width, height }}
        aria-label={alt}
      >
        {alt}
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      width={width}
      height={height}
      className={cn(invertOnDark && theme === 'dark' && 'invert', className)}
      style={{ width, height: 'auto' }}
    />
  );
}
