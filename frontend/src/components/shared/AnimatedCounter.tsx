"use client";

import * as React from "react";
import { useInView, useReducedMotion } from "framer-motion";

interface AnimatedCounterProps {
  value: number;
  prefix?: string;
  suffix?: string;
  duration?: number;
}

export function AnimatedCounter({ value, prefix = "", suffix = "", duration = 1.5 }: AnimatedCounterProps) {
  const ref = React.useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true, margin: "0px" });
  const shouldReduceMotion = useReducedMotion();
  const [display, setDisplay] = React.useState(value);
  const [hasStarted, setHasStarted] = React.useState(false);

  const formatNumber = (num: number) => {
    if (num % 1 !== 0) {
      return num.toFixed(1);
    }
    if (num >= 1000000) return (num / 1000000).toFixed(1) + "M";
    if (num >= 1000) return (num / 1000).toFixed(num >= 10000 ? 0 : 1) + "K";
    return num.toLocaleString();
  };

  React.useEffect(() => {
    if (shouldReduceMotion) {
      setDisplay(value);
      return;
    }

    if (!isInView || hasStarted) return;
    setHasStarted(true);
    setDisplay(0);

    const isDecimal = value % 1 !== 0;
    const startTime = Date.now();
    const durationMs = duration * 1000;

    const step = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / durationMs, 1);
      const eased = 1 - Math.pow(1 - progress, 3);

      if (isDecimal) {
        setDisplay(parseFloat((eased * value).toFixed(1)));
      } else {
        setDisplay(Math.floor(eased * value));
      }

      if (progress < 1) {
        requestAnimationFrame(step);
      } else {
        setDisplay(value);
      }
    };

    requestAnimationFrame(step);
  }, [isInView, value, duration, shouldReduceMotion, hasStarted]);

  return (
    <span
      ref={ref}
      className="tabular-nums inline-block font-extrabold text-[#0F172A] dark:text-white"
      aria-label={`${prefix}${value}${suffix}`}
    >
      {prefix}{formatNumber(display)}{suffix}
    </span>
  );
}
