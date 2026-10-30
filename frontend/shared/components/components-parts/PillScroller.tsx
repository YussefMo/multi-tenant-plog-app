import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { Button } from '@shared/ui/button';

interface PillScrollerProps {
  children: ReactNode;
  role?: string;
  previousLabel?: string;
  nextLabel?: string;
}

export default function PillScroller({
  children,
  role,
  previousLabel = 'Scroll previous',
  nextLabel = 'Scroll next',
}: PillScrollerProps) {
  const scrollerRef = useRef<HTMLDivElement | null>(null);
  const contentRef = useRef<HTMLDivElement | null>(null);
  const [canPrevious, setCanPrevious] = useState(false);
  const [canNext, setCanNext] = useState(false);

  const sync = useCallback(() => {
    const element = scrollerRef.current;

    if (!element) {
      return;
    }

    const max = element.scrollWidth - element.clientWidth;
    setCanPrevious(element.scrollLeft > 1);
    setCanNext(element.scrollLeft < max - 1);
  }, []);

  useEffect(() => {
    const scroller = scrollerRef.current;
    const content = contentRef.current;

    if (!scroller || !content) {
      return;
    }

    scroller.querySelector<HTMLElement>('[data-active="true"]')?.scrollIntoView({
      block: 'nearest',
      inline: 'center',
    });
    sync();

    const observer = new ResizeObserver(sync);
    observer.observe(scroller);
    observer.observe(content);

    return () => observer.disconnect();
  }, [sync]);

  const step = (direction: -1 | 1) => {
    const element = scrollerRef.current;

    if (!element) {
      return;
    }

    element.scrollBy({
      left: direction * Math.max(element.clientWidth * 0.6, 160),
      behavior: 'smooth',
    });
  };

  const hidden = 'pointer-events-none opacity-0';

  return (
    <div className="relative flex min-w-0 flex-1 items-center">
      <div ref={scrollerRef} onScroll={sync} className="min-w-0 flex-1 overflow-x-auto">
        <div ref={contentRef} role={role} className="flex w-max gap-2">
          {children}
        </div>
      </div>

      <Button
        variant="outline"
        size="icon"
        className={`absolute start-0 top-1/2 z-10 size-7 -translate-y-1/2 ${canPrevious ? '' : hidden}`}
        onClick={() => step(-1)}
        tabIndex={canPrevious ? 0 : -1}
        aria-hidden={!canPrevious}
        aria-label={previousLabel}
      >
        <ChevronLeft />
      </Button>

      <Button
        variant="outline"
        size="icon"
        className={`absolute end-0 top-1/2 z-10 size-7 -translate-y-1/2 ${canNext ? '' : hidden}`}
        onClick={() => step(1)}
        tabIndex={canNext ? 0 : -1}
        aria-hidden={!canNext}
        aria-label={nextLabel}
      >
        <ChevronRight />
      </Button>
    </div>
  );
}
