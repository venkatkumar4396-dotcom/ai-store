"use client";

import * as React from "react";

/**
 * DevContrastGuard (Development Only)
 * Scans the active DOM tree and logs an error / asserts if any visible text node's
 * computed color equals its effective background color (or difference is under 5 RGB units).
 */
export function DevContrastGuard() {
  React.useEffect(() => {
    if (process.env.NODE_ENV !== "development") return;

    function parseRgb(colorStr: string): [number, number, number] | null {
      const match = colorStr.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
      if (!match) return null;
      return [parseInt(match[1], 10), parseInt(match[2], 10), parseInt(match[3], 10)];
    }

    function getEffectiveBg(el: HTMLElement | null): string {
      let curr = el;
      while (curr && curr !== document.documentElement) {
        const bg = window.getComputedStyle(curr).backgroundColor;
        if (bg && bg !== "transparent" && bg !== "rgba(0, 0, 0, 0)") {
          return bg;
        }
        curr = curr.parentElement;
      }
      return "rgb(255, 255, 255)";
    }

    function checkContrast() {
      // Find all text elements
      const elements = document.querySelectorAll<HTMLElement>("p, h1, h2, h3, h4, h5, h6, span, button, a, label, td, th");
      const violations: Array<{ text: string; color: string; bg: string; el: HTMLElement }> = [];

      elements.forEach((el) => {
        // Skip hidden or empty elements
        if (!el.innerText || !el.innerText.trim()) return;
        if (el.offsetParent === null) return;

        const computed = window.getComputedStyle(el);
        if (computed.display === "none" || computed.visibility === "hidden" || parseFloat(computed.opacity) === 0) {
          return;
        }

        const textColor = computed.color;
        const bgColor = getEffectiveBg(el);

        const textRgb = parseRgb(textColor);
        const bgRgb = parseRgb(bgColor);

        if (textRgb && bgRgb) {
          const diff = Math.abs(textRgb[0] - bgRgb[0]) + Math.abs(textRgb[1] - bgRgb[1]) + Math.abs(textRgb[2] - bgRgb[2]);
          // If text color and background color are identical or within 10 total units
          if (diff < 10) {
            violations.push({
              text: el.innerText.slice(0, 40),
              color: textColor,
              bg: bgColor,
              el,
            });
          }
        }
      });

      if (violations.length > 0) {
        console.error(
          `[DevContrastGuard] ⚠️ Found ${violations.length} invisible text node(s) where text matches background:`,
          violations
        );
      }
    }

    const timer = setTimeout(checkContrast, 1200);
    return () => clearTimeout(timer);
  }, []);

  return null;
}
