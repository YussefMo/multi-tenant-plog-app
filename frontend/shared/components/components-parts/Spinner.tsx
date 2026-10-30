import { LoaderCircle } from 'lucide-react';
import { cn } from '@shared/lib/utils';

interface SpinnerProps {
  size?: number;
  className?: string;
}

export default function Spinner({ size = 32, className }: SpinnerProps) {
  return (
    <div className={cn('flex min-h-52 w-full items-center justify-center', className)}>
      <LoaderCircle className="text-primary animate-spin" style={{ width: size, height: size }} />
    </div>
  );
}
