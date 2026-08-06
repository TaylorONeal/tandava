/**
 * Value-transition animation for the dashboard readouts.
 *
 * Numbers tween over 300ms so a slider drag reads as movement rather than as a
 * flicker. Under `prefers-reduced-motion` the tween is skipped entirely and the
 * value snaps, which keeps every readout functional without motion.
 *
 * Layout space is always reserved by the caller (fixed-width tabular figures),
 * so animating the value never moves anything on the page.
 */
import { useEffect, useRef, useState } from "react";

const DURATION_MS = 300;

export function usePrefersReducedMotion(): boolean {
  const [prefers, setPrefers] = useState(() => {
    if (typeof window === "undefined" || !window.matchMedia) return false;
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  });

  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return;
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const onChange = () => setPrefers(query.matches);
    query.addEventListener("change", onChange);
    return () => query.removeEventListener("change", onChange);
  }, []);

  return prefers;
}

export function useAnimatedNumber(target: number): number {
  const reduced = usePrefersReducedMotion();
  const [value, setValue] = useState(target);
  const fromRef = useRef(target);
  const frameRef = useRef<number>(0);

  useEffect(() => {
    if (reduced || !Number.isFinite(target)) {
      setValue(target);
      fromRef.current = target;
      return;
    }

    const from = fromRef.current;
    const start = performance.now();
    cancelAnimationFrame(frameRef.current);

    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / DURATION_MS);
      // Ease-out cubic: fast commitment, soft landing.
      const eased = 1 - Math.pow(1 - t, 3);
      const next = from + (target - from) * eased;
      setValue(next);
      if (t < 1) {
        frameRef.current = requestAnimationFrame(tick);
      } else {
        fromRef.current = target;
      }
    };

    frameRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frameRef.current);
  }, [target, reduced]);

  return value;
}

/** Debounce for slider-driven recompute. 120ms keeps drags feeling live. */
export function useDebounced<T>(value: T, delayMs = 120): T {
  const reduced = usePrefersReducedMotion();
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    if (reduced) {
      setDebounced(value);
      return;
    }
    const timer = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(timer);
  }, [value, delayMs, reduced]);

  return debounced;
}
