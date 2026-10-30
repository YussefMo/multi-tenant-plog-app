import { CircleCheck, CircleX, X } from 'lucide-react';
import type { ReactNode } from 'react';
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@shared/ui/alert-dialog';
import { Button } from '@shared/ui/button';
import PillButton from '../components-parts/PillButton';

interface ToggleStatusDialogProps {
  itemName: string;
  isActive: boolean;
  onConfirm: () => void;
  isLoading?: boolean;
  trigger?: ReactNode;
}

export default function ToggleStatusDialog({
  itemName,
  isActive,
  onConfirm,
  isLoading = false,
  trigger,
}: ToggleStatusDialogProps) {
  const ActionIcon = isActive ? CircleX : CircleCheck;
  const action = isActive ? 'Deactivate' : 'Activate';

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        {trigger ?? <PillButton label={action} icon={ActionIcon} />}
      </AlertDialogTrigger>
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader className="text-start">
          <div className="flex items-center gap-2">
            <ActionIcon className="text-primary size-5" />
            <AlertDialogTitle>{action} item</AlertDialogTitle>
          </div>
          <AlertDialogDescription>
            {action} “{itemName}”? You can change this later.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isLoading}>Cancel</AlertDialogCancel>
          <Button type="button" disabled={isLoading} onClick={onConfirm}>
            <ActionIcon className="size-4" />
            {isLoading ? `${action}…` : action}
          </Button>
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
