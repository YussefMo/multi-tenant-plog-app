import { Upload } from 'lucide-react';

interface PlaceholderContentProps {
  hint?: string;
  constraints?: string;
}

export default function PlaceholderContent({
  hint = 'Click to upload or drag and drop',
  constraints = 'SVG, PNG, JPG or GIF',
}: PlaceholderContentProps) {
  return (
    <div className="flex flex-col items-center gap-1 opacity-60">
      <Upload className="text-muted-foreground size-10" aria-hidden />
      <p className="text-muted-foreground text-sm">{hint}</p>
      <p className="text-muted-foreground text-xs">{constraints}</p>
    </div>
  );
}
