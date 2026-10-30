import { Trash2, X } from 'lucide-react';
import type { ReactNode } from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@shared/ui/alert-dialog';
import PillButton from '../components-parts/PillButton';

interface DeleteAlertProps {
  title?: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void | Promise<void>;
  isPending?: boolean;
  trigger?: ReactNode;
}

export default function DeleteAlert({
  title = 'Delete item',
  description = 'This action cannot be undone.',
  confirmLabel = 'Delete',
  cancelLabel = 'Cancel',
  onConfirm,
  isPending = false,
  trigger,
}: DeleteAlertProps) {
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        {trigger ?? <PillButton label="Delete" icon={Trash2} />}
      </AlertDialogTrigger>
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader className="text-start">
          <div className="flex items-start gap-3 pe-8">
            <div className="bg-destructive/10 text-destructive flex size-9 shrink-0 items-center justify-center rounded-full">
              <Trash2 className="size-4" />
            </div>
            <div>
              <AlertDialogTitle>{title}</AlertDialogTitle>
              <AlertDialogDescription className="mt-1.5">{description}</AlertDialogDescription>
            </div>
          </div>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending}>{cancelLabel}</AlertDialogCancel>
          <AlertDialogAction
            onClick={() => void onConfirm()}
            disabled={isPending}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90 gap-2"
          >
            <Trash2 className="size-3.5" />
            {confirmLabel}
          </AlertDialogAction>
        </AlertDialogFooter>
        <AlertDialogCancel
          className="absolute end-3 top-3 size-8 rounded-full border-0 p-0"
          aria-label="Close"
        >
          <X className="size-4" />
        </AlertDialogCancel>
      </AlertDialogContent>
    </AlertDialog>
  );
}
