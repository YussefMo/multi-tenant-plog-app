import { toast as sonner } from 'sonner';
import { toApiError, validationMessages } from './http/errors';

type ToastOptions = Parameters<typeof sonner.success>[1];

function apiErrorMessage(error: unknown, fallback: string): string {
  const apiError = toApiError(error);

  switch (apiError.status) {
    case 401:
      return 'Please sign in again.';
    case 403:
      return 'You do not have access to this action.';
    case 419:
      return 'Your session expired. Please retry.';
    case 429:
      return 'Too many attempts. Try again shortly.';
    default:
      return apiError.message || fallback;
  }
}

function validationDescription(errors: Record<string, string[]>): string | undefined {
  const messages = validationMessages(errors);

  return messages.length > 0 ? messages.slice(0, 3).join(' · ') : undefined;
}

export const notify = {
  success(message: string, options?: ToastOptions) {
    return sonner.success(message, options);
  },

  error(message: string, options?: ToastOptions) {
    return sonner.error(message, options);
  },

  info(message: string, options?: ToastOptions) {
    return sonner.info(message, options);
  },

  warning(message: string, options?: ToastOptions) {
    return sonner.warning(message, options);
  },

  loading(message: string, options?: ToastOptions) {
    return sonner.loading(message, options);
  },

  promise<T>(promise: Promise<T>, messages: { loading: string; success: string; error: string }) {
    return sonner.promise(promise, messages);
  },

  dismiss(id?: string | number) {
    sonner.dismiss(id);
  },

  apiError(error: unknown, fallback = 'Something went wrong. Please try again.') {
    const apiError = toApiError(error);
    const description = validationDescription(apiError.errors);

    return sonner.error(apiErrorMessage(error, fallback), {
      description,
    });
  },

  validation(errors: Record<string, string[]>) {
    return sonner.error('Please check the form.', {
      description: validationDescription(errors),
    });
  },
};

export const toast = notify;
export { Toaster } from '@shared/ui/sonner';
