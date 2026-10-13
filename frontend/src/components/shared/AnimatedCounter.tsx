"use client";

import * as React from "react";
import { useInView, useReducedMotion } from "framer-motion";

interface AnimatedCounterProps {
  value: number;
  prefix?: string;
  suffix?: string;
  duration?: number;
}

export function AnimatedCounter({
  value = 0,
  prefix = "",
  suffix = "",
  duration = 1.2,
}: AnimatedCounterProps) {
  const safeValue = typeof value === "number" && !isNaN(value) ? value : 0;
  const ref = React.useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true, margin: "0px" });
  const shouldReduceMotion = useReducedMotion();
  const [display, setDisplay] = React.useState<number>(safeValue);
  const [hasStarted, setHasStarted] = React.useState(false);

  const formatNumber = (num: number) => {
    if (typeof num !== "number" || isNaN(num)) return "0";
    if (num % 1 !== 0) {
      return num.toFixed(1);
    }
    if (num >= 1000000) return (num / 1000000).toFixed(1) + "M";
    if (num >= 1000) return (num / 1000).toFixed(num >= 10000 ? 0 : 1) + "K";
    return num.toLocaleString();
  };

  // Immediate fallback for SSR / reduced-motion / non-view
  React.useEffect(() => {
    if (shouldReduceMotion) {
      setDisplay(safeValue);
      return;
    }

    // Safety timeout: if IntersectionObserver hasn't fired in 600ms, ensure final value is rendered
    const safetyTimer = setTimeout(() => {
      setDisplay(safeValue);
    }, 600);

    if (!isInView || hasStarted) {
      return () => clearTimeout(safetyTimer);
    }

    setHasStarted(true);
    clearTimeout(safetyTimer);

    const isDecimal = safeValue % 1 !== 0;
    const startTime = Date.now();
    const durationMs = duration * 1000;

    let frameId: number;

    const step = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / durationMs, 1);
      const eased = 1 - Math.pow(1 - progress, 3);

      if (isDecimal) {
        setDisplay(parseFloat((eased * safeValue).toFixed(1)));
      } else {
        setDisplay(Math.floor(eased * safeValue));
      }

      if (progress < 1) {
        frameId = requestAnimationFrame(step);
      } else {
        setDisplay(safeValue);
      }
    };

    frameId = requestAnimationFrame(step);

    return () => {
      clearTimeout(safetyTimer);
      cancelAnimationFrame(frameId);
    };
  }, [isInView, safeValue, duration, shouldReduceMotion, hasStarted]);

  return (
    <span
      ref={ref}
      className="tabular-nums inline-block font-extrabold text-[#0F172A] dark:text-white"
      aria-label={`${prefix}${safeValue}${suffix}`}
    >
      {prefix}
      {formatNumber(display)}
      {suffix}
    </span>
  );
}
