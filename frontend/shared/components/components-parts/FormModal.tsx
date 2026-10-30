import { X } from 'lucide-react';
import type { ComponentProps, ComponentType, ReactNode } from 'react';
import { Button } from '@shared/ui/button';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogTitle,
  DialogTrigger,
} from '@shared/ui/dialog';
import { cn } from '@shared/lib/utils';

function FormModal(props: ComponentProps<typeof Dialog>) {
  return <Dialog {...props} />;
}

function FormModalTrigger(props: ComponentProps<typeof DialogTrigger>) {
  return <DialogTrigger {...props} />;
}

function FormModalContent({ className, children, ...props }: ComponentProps<typeof DialogContent>) {
  return (
    <DialogContent className={cn('flex max-h-[90vh] flex-col gap-0 p-0', className)} {...props}>
      {children}
    </DialogContent>
  );
}

interface FormModalHeaderProps {
  title: ReactNode;
  description?: ReactNode;
  icon?: ComponentType<{ className?: string }>;
  showDescription?: boolean;
  className?: string;
}

function FormModalHeader({
  title,
  description,
  icon: Icon,
  showDescription = true,
  className,
}: FormModalHeaderProps) {
  return (
    <div className={cn('shrink-0 px-6 pt-6', className)}>
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          {Icon ? <Icon className="text-primary size-5 shrink-0" /> : null}
          <DialogTitle className="text-lg font-semibold">{title}</DialogTitle>
        </div>
        <DialogClose className="hover:bg-accent inline-flex size-8 items-center justify-center rounded-full">
          <X className="size-4" />
          <span className="sr-only">Close</span>
        </DialogClose>
      </div>
      {showDescription && description ? (
        <DialogDescription className="text-muted-foreground pt-1 text-sm">
          {description}
        </DialogDescription>
      ) : null}
      <div className="bg-border mt-4 h-px w-full" />
    </div>
  );
}

function FormModalBody({ className, children, ...props }: ComponentProps<'div'>) {
  return (
    <div
      className={cn('flex min-h-0 flex-1 flex-col overflow-y-auto px-6 py-5', className)}
      {...props}
    >
      {children}
    </div>
  );
}

interface FormModalFooterProps {
  cancelLabel?: string;
  submitLabel?: string;
  submitFormId?: string;
  onSubmitClick?: () => void;
  isSubmitting?: boolean;
  submitDisabled?: boolean;
  submittingLabel?: string;
  submitIcon?: ComponentType<{ className?: string }>;
  className?: string;
}

function FormModalFooter({
  cancelLabel = 'Cancel',
  submitLabel = 'Save',
  submitFormId,
  onSubmitClick,
  isSubmitting = false,
  submitDisabled = false,
  submittingLabel,
  submitIcon: SubmitIcon,
  className,
}: FormModalFooterProps) {
  const isButtonSubmit = Boolean(onSubmitClick);

  return (
    <DialogFooter
      className={cn(
        'bg-muted/40 flex shrink-0 items-center justify-end gap-2 border-t px-6 py-3',
        className,
      )}
    >
      <DialogClose asChild>
        <Button type="button" variant="outline">
          {cancelLabel}
        </Button>
      </DialogClose>
      <Button
        type={isButtonSubmit ? 'button' : 'submit'}
        form={isButtonSubmit ? undefined : submitFormId}
        onClick={onSubmitClick}
        disabled={isSubmitting || submitDisabled}
      >
        {SubmitIcon ? <SubmitIcon className="size-4 shrink-0" /> : null}
        {isSubmitting ? (submittingLabel ?? submitLabel) : submitLabel}
      </Button>
    </DialogFooter>
  );
}

export {
  FormModal,
  FormModalBody,
  FormModalContent,
  FormModalFooter,
  FormModalHeader,
  FormModalTrigger,
};
