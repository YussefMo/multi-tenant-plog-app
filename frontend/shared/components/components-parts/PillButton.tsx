import { forwardRef, type ComponentType } from 'react';
import { Button } from '@shared/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@shared/ui/tooltip';
import { cn } from '@shared/lib/utils';

type PillIcon = ComponentType<{ className?: string }>;

interface PillButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  label?: string;
  icon?: PillIcon;
  showLabel?: boolean;
  tooltipOpen?: boolean;
}

const PillButton = forwardRef<HTMLButtonElement, PillButtonProps>(function PillButton(
  { label, icon: Icon, className, type = 'button', showLabel = false, tooltipOpen, ...props },
  ref,
) {
  if (showLabel) {
    return (
      <Button
        ref={ref}
        type={type}
        variant="outline"
        size="sm"
        className={cn('gap-2', className)}
        {...props}
      >
        {Icon ? <Icon className="size-4 shrink-0" /> : null}
        {label ? <span className="whitespace-nowrap">{label}</span> : null}
      </Button>
    );
  }

  return (
    <Tooltip open={tooltipOpen}>
      <TooltipTrigger asChild>
        <Button
          ref={ref}
          type={type}
          variant="ghost"
          size="icon"
          aria-label={label}
          className={cn('size-8', className)}
          {...props}
        >
          {Icon ? <Icon className="size-4 shrink-0" /> : null}
        </Button>
      </TooltipTrigger>
      {label ? (
        <TooltipContent>
          <span className="whitespace-nowrap">{label}</span>
        </TooltipContent>
      ) : null}
    </Tooltip>
  );
});

export default PillButton;
