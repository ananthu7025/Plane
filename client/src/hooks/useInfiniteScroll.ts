import { useRef, useEffect, useCallback, useMemo } from "react";

interface InfiniteScrollOptions {
  threshold?: number;
  rootMargin?: string;
}

export function useInfiniteScroll(options: InfiniteScrollOptions = {}) {
  // Memoize options so they don't change between renders
  const observerOptions = useMemo(
    () => ({
      threshold: options.threshold ?? 0.5,
      rootMargin: options.rootMargin ?? "200px 0px",
    }),
    [options.threshold, options.rootMargin]
  );

  const topSentinelRef = useRef<HTMLDivElement>(null);
  const bottomSentinelRef = useRef<HTMLDivElement>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const callbacksRef = useRef<{ onTop?: () => void; onBottom?: () => void }>({});

  // Initialize observer with stable options
  useEffect(() => {
    const handleIntersection = (entries: IntersectionObserverEntry[]) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;

        if (entry.target === topSentinelRef.current) {
          callbacksRef.current.onTop?.();
        } else if (entry.target === bottomSentinelRef.current) {
          callbacksRef.current.onBottom?.();
        }
      });
    };

    observerRef.current = new IntersectionObserver(
      handleIntersection,
      observerOptions
    );

    // Observe sentinels if they exist
    if (topSentinelRef.current) {
      observerRef.current.observe(topSentinelRef.current);
    }
    if (bottomSentinelRef.current) {
      observerRef.current.observe(bottomSentinelRef.current);
    }

    // Cleanup on unmount or options change
    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [observerOptions]);

  // Update callbacks without recreating observer
  const setCallbacks = useCallback((onTop?: () => void, onBottom?: () => void) => {
    callbacksRef.current = { onTop, onBottom };
  }, []);

  return {
    topSentinelRef,
    bottomSentinelRef,
    setCallbacks,
  };
}
