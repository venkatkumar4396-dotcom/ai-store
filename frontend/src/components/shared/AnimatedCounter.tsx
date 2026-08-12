"use client";

import * as React from "react";
import { motion, useInView } from "framer-motion";

interface AnimatedCounterProps {
  value: number;
  prefix?: string;
  suffix?: string;
  duration?: number;
}

export function AnimatedCounter({ value, prefix = "", suffix = "", duration = 2 }: AnimatedCounterProps) {
  const ref = React.useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-50px" });
  const [display, setDisplay] = React.useState(0);

  React.useEffect(() => {
    if (!isInView) return;

    const end = value;
    const startTime = Date.now();
    const durationMs = duration * 1000;

    const step = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / durationMs, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = Math.floor(eased * end);
      setDisplay(current);

      if (progress < 1) {
        requestAnimationFrame(step);
      } else {
        setDisplay(end);
      }
    };

    requestAnimationFrame(step);
  }, [isInView, value, duration]);

  const formatNumber = (num: number) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + "M";
    if (num >= 1000) return (num / 1000).toFixed(num >= 10000 ? 0 : 1) + "K";
    return num.toLocaleString();
  };

  return (
    <motion.span
      ref={ref}
      initial={{ opacity: 0, y: 10 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.5 }}
      className="tabular-nums"
    >
      {prefix}{formatNumber(display)}{suffix}
    </motion.span>
  );
}
