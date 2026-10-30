export type ApiEventName = 'unauthorized' | 'forbidden' | 'support-ended' | 'csrf-failed';

type ApiEventListener = (detail: unknown) => void;

const target = new EventTarget();

export const apiEvents = {
  on(event: ApiEventName, listener: ApiEventListener): () => void {
    const handler = (nativeEvent: Event) => listener((nativeEvent as CustomEvent).detail);

    target.addEventListener(event, handler);

    return () => target.removeEventListener(event, handler);
  },

  emit(event: ApiEventName, detail?: unknown): void {
    target.dispatchEvent(new CustomEvent(event, { detail }));
  },
};
