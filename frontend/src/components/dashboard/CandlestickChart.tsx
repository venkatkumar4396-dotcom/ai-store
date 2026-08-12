"use client";

import React, { useEffect, useRef, useCallback } from "react";
import {
  createChart,
  ColorType,
  LineStyle,
  CandlestickSeries,
  HistogramSeries,
  CrosshairMode,
  createSeriesMarkers,
} from "lightweight-charts";
import { useTheme } from "@/components/layout/ThemeProvider";

interface CandleData {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume?: number;
}

interface CandleSignal {
  date: string;
  type: "BUY" | "SELL";
  label: string;
  score: number;
}

interface CandlestickChartProps {
  data: CandleData[];
  symbol?: string;
  stopLoss?: number;
  profitTarget?: number;
  supportLevels?: number[];
  resistanceLevels?: number[];
  signals?: CandleSignal[];
  liveQuote?: { price: number; volume: number; timestamp: string };
  timezoneMode?: "exchange" | "local";
  avgPrice?: number;
}

/** Format large numbers compactly (1.2M, 345K, etc.) */
function formatVolume(vol: number): string {
  if (vol >= 1_000_000_000) return (vol / 1_000_000_000).toFixed(1) + "B";
  if (vol >= 1_000_000) return (vol / 1_000_000).toFixed(1) + "M";
  if (vol >= 1_000) return (vol / 1_000).toFixed(1) + "K";
  return vol.toString();
}

/** Format price with dynamic precision */
function formatPrice(price: number): string {
  if (price === undefined || price === null || isNaN(price)) return "0.00";
  const abs = Math.abs(price);
  if (abs >= 100) return price.toFixed(2);
  if (abs >= 1) return price.toFixed(3);
  if (abs >= 0.01) return price.toFixed(4);
  return price.toFixed(6);
}

export default function CandlestickChart({
  data,
  symbol,
  stopLoss,
  profitTarget,
  supportLevels = [],
  resistanceLevels = [],
  signals = [],
  liveQuote,
  timezoneMode = "exchange",
  avgPrice,
}: CandlestickChartProps) {
  const { theme } = useTheme();
  const isLightMode = theme === "light";
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<any>(null);
  const candlestickSeriesRef = useRef<any>(null);
  const volumeSeriesRef = useRef<any>(null);

  const isIndia = symbol?.toUpperCase().endsWith(".NS") || symbol?.toUpperCase().endsWith(".BO");
  const exchangeTimeZone = isIndia ? "Asia/Kolkata" : "America/New_York";
  const localTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const activeTimeZone = timezoneMode === "exchange" ? exchangeTimeZone : localTimeZone;

  const tzName = React.useMemo(() => {
    try {
      const parts = new Intl.DateTimeFormat("en-US", {
        timeZone: activeTimeZone,
        timeZoneName: "short",
      }).formatToParts(new Date());
      return parts.find((part) => part.type === "timeZoneName")?.value || "";
    } catch {
      return "";
    }
  }, [activeTimeZone]);

  useEffect(() => {
    if (!chartContainerRef.current) return;

    // Determine dynamic price precision based on dataset min price
    const minPrice = data.length > 0 ? Math.min(...data.map((d) => (d.low > 0 ? d.low : d.close))) : 100;
    let precision = 2;
    let minMove = 0.01;
    if (minPrice < 0.01) { precision = 6; minMove = 0.000001; }
    else if (minPrice < 1) { precision = 4; minMove = 0.0001; }
    else if (minPrice < 10) { precision = 3; minMove = 0.001; }

    // Create chart with enhanced crosshair
    const chartBg = isLightMode ? "#ffffff" : "rgba(9, 9, 11, 0.7)";
    const textColor = isLightMode ? "#606770" : "#a1a1aa";
    const gridColor = isLightMode ? "rgba(0, 0, 0, 0.05)" : "rgba(255, 255, 255, 0.03)";
    const borderColor = isLightMode ? "rgba(0, 0, 0, 0.08)" : "rgba(255, 255, 255, 0.08)";

    const chart = createChart(chartContainerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: chartBg },
        textColor: textColor,
        fontSize: 12,
      },
      grid: {
        vertLines: { color: gridColor },
        horzLines: { color: gridColor },
      },
      crosshair: {
        mode: CrosshairMode.Normal,
        vertLine: {
          color: "rgba(139, 92, 246, 0.4)",
          width: 1,
          style: LineStyle.Dashed,
          labelBackgroundColor: "rgba(139, 92, 246, 0.9)",
        },
        horzLine: {
          color: "rgba(139, 92, 246, 0.4)",
          width: 1,
          style: LineStyle.Dashed,
          labelBackgroundColor: "rgba(139, 92, 246, 0.9)",
        },
      },
      rightPriceScale: {
        borderColor: borderColor,
        visible: true,
        scaleMargins: {
          top: 0.05,
          bottom: 0.25, // Reserve space for volume
        },
      },
      timeScale: {
        borderColor: borderColor,
        visible: true,
        timeVisible: true,
      },
      localization: {
        timeFormatter: (time: any) => {
          if (typeof time === "string") return time;
          const date = new Date(time * 1000);
          
          return new Intl.DateTimeFormat("en-US", {
            timeZone: activeTimeZone,
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
            hour12: false,
          }).format(date);
        }
      },
      width: chartContainerRef.current.clientWidth,
      height: 440,
    });

    chartRef.current = chart;

    chart.timeScale().applyOptions({
      tickMarkFormatter: (time: any, tickMarkType: any, locale: any) => {
        if (typeof time === "string") return time;
        const date = new Date(time * 1000);
        
        return new Intl.DateTimeFormat("en-US", {
          timeZone: activeTimeZone,
          hour: "2-digit",
          minute: "2-digit",
          hour12: false,
        }).format(date);
      }
    } as any);

    // ── Candlestick Series ──────────────────────────────────
    const candlestickSeries = chart.addSeries(CandlestickSeries, {
      upColor: "#10b981", // emerald-500
      downColor: "#ef4444", // rose-500
      borderVisible: false,
      wickUpColor: "#10b981",
      wickDownColor: "#ef4444",
      priceFormat: {
        type: "price",
        precision: precision,
        minMove: minMove,
      },
    });

    candlestickSeriesRef.current = candlestickSeries;

    // Format data for lightweight-charts
    const formattedData = data.map((d) => {
      const hasTime = d.date.includes("T") || d.date.includes(" ");
      return {
        time: (hasTime ? Math.floor(new Date(d.date).getTime() / 1000) : d.date) as any,
        open: d.open,
        high: d.high,
        low: d.low,
        close: d.close,
      };
    });

    candlestickSeries.setData(formattedData);

    // ── Volume Histogram ────────────────────────────────────
    const volumeSeries = chart.addSeries(HistogramSeries, {
      priceFormat: {
        type: "volume" as const,
      },
      priceScaleId: "volume",
    });

    volumeSeriesRef.current = volumeSeries;

    chart.priceScale("volume").applyOptions({
      scaleMargins: {
        top: 0.82, // Volume takes the bottom 18% of the chart
        bottom: 0,
      },
    });

    const volumeData = data.map((d) => {
      const hasTime = d.date.includes("T") || d.date.includes(" ");
      return {
        time: (hasTime ? Math.floor(new Date(d.date).getTime() / 1000) : d.date) as any,
        value: d.volume || 0,
        color:
          d.close >= d.open
            ? "rgba(16, 185, 129, 0.4)" // green with alpha
            : "rgba(239, 68, 68, 0.4)", // red with alpha
      };
    });

    volumeSeries.setData(volumeData);

    // ── Buy / Sell Markers ───────────────────────────────────
    if (signals && signals.length > 0) {
      const validDates = new Set(data.map((d) => d.date));
      const markers = signals
        .filter((s) => validDates.has(s.date))
        .sort((a, b) => a.date.localeCompare(b.date))
        .map((signal) => {
          const isBuy = signal.type === "BUY";
          const hasTime = signal.date.includes("T") || signal.date.includes(" ");
          const markerTime = hasTime ? Math.floor(new Date(signal.date).getTime() / 1000) : signal.date;
          return {
            time: markerTime as any,
            position: isBuy ? ("belowBar" as const) : ("aboveBar" as const),
            color: isBuy ? "#10b981" : "#ef4444",
            shape: isBuy ? ("arrowUp" as const) : ("arrowDown" as const),
            text: `${isBuy ? "BUY" : "SELL"} · ${signal.label}`,
            size: signal.score >= 50 ? 2 : 1,
          };
        });

      if (markers.length > 0) {
        createSeriesMarkers(candlestickSeries, markers);
      }
    }

    // ── Price Lines ──────────────────────────────────────────

    // Add Stop Loss line
    if (stopLoss) {
      candlestickSeries.createPriceLine({
        price: stopLoss,
        color: "#f43f5e", // rose-500
        lineWidth: 2,
        lineStyle: LineStyle.Dashed,
        axisLabelVisible: true,
        title: "Stop Loss",
      });
    }

    // Add Profit Target line
    if (profitTarget) {
      candlestickSeries.createPriceLine({
        price: profitTarget,
        color: "#10b981", // emerald-500
        lineWidth: 2,
        lineStyle: LineStyle.Dashed,
        axisLabelVisible: true,
        title: "Profit Target",
      });
    }

    // Add Avg Cost Price line
    if (avgPrice && avgPrice > 0) {
      candlestickSeries.createPriceLine({
        price: avgPrice,
        color: "#818cf8", // indigo-400
        lineWidth: 2,
        lineStyle: LineStyle.Dashed,
        axisLabelVisible: true,
        title: "Holding Avg Cost",
      });
    }

    // Add Support Levels (dotted cyan)
    supportLevels.forEach((level) => {
      candlestickSeries.createPriceLine({
        price: level,
        color: "#06b6d4", // cyan-500
        lineWidth: 1,
        lineStyle: LineStyle.Dotted,
        axisLabelVisible: true,
        title: "Support",
      });
    });

    // Add Resistance Levels (dotted amber)
    resistanceLevels.forEach((level) => {
      candlestickSeries.createPriceLine({
        price: level,
        color: "#f59e0b", // amber-500
        lineWidth: 1,
        lineStyle: LineStyle.Dotted,
        axisLabelVisible: true,
        title: "Resistance",
      });
    });

    // ── Crosshair Tooltip ───────────────────────────────────
    const tooltip = tooltipRef.current;

    chart.subscribeCrosshairMove((param: any) => {
      if (!tooltip) return;

      if (
        !param ||
        !param.time ||
        param.point === undefined ||
        !param.point ||
        param.point.x < 0 ||
        param.point.y < 0
      ) {
        tooltip.style.display = "none";
        return;
      }

      const candleInfo = param.seriesData?.get(candlestickSeries);
      const volumeInfo = param.seriesData?.get(volumeSeries);

      if (!candleInfo) {
        tooltip.style.display = "none";
        return;
      }

      const { open, high, low, close } = candleInfo as any;
      const volume = (volumeInfo as any)?.value || 0;
      const change = close - open;
      const changePct = open !== 0 ? ((change / open) * 100).toFixed(2) : "0.00";
      const isUp = close >= open;
      const color = isUp ? "#10b981" : "#ef4444";

      // Find matching signal for this date
      const dateVal = param.time;
      const matchingSignal = signals.find((s) => {
        if (typeof dateVal === "number") {
          const sigTime = Math.floor(new Date(s.date).getTime() / 1000);
          return sigTime === dateVal;
        }
        return s.date === dateVal;
      });

      let displayTime = "";
      if (typeof dateVal === "number") {
        const date = new Date(dateVal * 1000);
        const formatted = new Intl.DateTimeFormat("en-US", {
          timeZone: activeTimeZone,
          month: "short",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
          hour12: false,
        }).format(date);
        displayTime = `${formatted} (${tzName})`;
      } else {
        displayTime = dateVal as string;
      }

      tooltip.innerHTML = `
        <div style="font-size:11px;color:#a1a1aa;margin-bottom:4px;">${displayTime}</div>
        <div style="display:grid;grid-template-columns:auto 1fr;gap:2px 10px;font-size:12px;">
          <span style="color:#71717a;">O</span><span style="color:${color};font-family:monospace;font-weight:600;">${formatPrice(open)}</span>
          <span style="color:#71717a;">H</span><span style="color:#fbbf24;font-family:monospace;font-weight:600;">${formatPrice(high)}</span>
          <span style="color:#71717a;">L</span><span style="color:#60a5fa;font-family:monospace;font-weight:600;">${formatPrice(low)}</span>
          <span style="color:#71717a;">C</span><span style="color:${color};font-family:monospace;font-weight:600;">${formatPrice(close)}</span>
        </div>
        <div style="margin-top:4px;font-size:11px;color:${color};font-weight:600;">
          ${isUp ? "▲" : "▼"} ${change >= 0 ? "+" : ""}${formatPrice(change)} (${changePct}%)
        </div>
        <div style="margin-top:3px;font-size:11px;color:#71717a;">
          Vol: <span style="color:#d4d4d8;font-family:monospace;">${formatVolume(volume)}</span>
        </div>
        ${
          matchingSignal
            ? `<div style="margin-top:4px;padding:3px 6px;border-radius:4px;font-size:10px;font-weight:700;background:${
                matchingSignal.type === "BUY" ? "rgba(16,185,129,0.15)" : "rgba(239,68,68,0.15)"
              };color:${matchingSignal.type === "BUY" ? "#10b981" : "#ef4444"};border:1px solid ${
                matchingSignal.type === "BUY" ? "rgba(16,185,129,0.3)" : "rgba(239,68,68,0.3)"
              };">
              ${matchingSignal.type} · ${matchingSignal.label} (${matchingSignal.score}%)
            </div>`
            : ""
        }
      `;

      tooltip.style.display = "block";

      // Position tooltip near cursor, but keep it on-screen
      if (!chartContainerRef.current) return;
      const containerRect = chartContainerRef.current.getBoundingClientRect();
      const tooltipWidth = 180;
      const tooltipHeight = tooltip.offsetHeight || 120;

      let left = param.point.x + 16;
      let top = param.point.y - tooltipHeight / 2;

      // Keep tooltip within chart bounds
      if (left + tooltipWidth > containerRect.width) {
        left = param.point.x - tooltipWidth - 16;
      }
      if (top < 0) top = 4;
      if (top + tooltipHeight > containerRect.height) {
        top = containerRect.height - tooltipHeight - 4;
      }

      tooltip.style.left = `${left}px`;
      tooltip.style.top = `${top}px`;
    });

    // Fit content
    chart.timeScale().fitContent();

    // Resize observer to make it responsive
    const handleResize = () => {
      if (chartContainerRef.current) {
        chart.applyOptions({ width: chartContainerRef.current.clientWidth });
      }
    };

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      chart.remove();
    };
  }, [data, stopLoss, profitTarget, supportLevels, resistanceLevels, signals, isLightMode, activeTimeZone, tzName, avgPrice]);

  // Handle real-time ticks (live candle updates & new candle creation)
  useEffect(() => {
    if (!candlestickSeriesRef.current || !liveQuote || data.length === 0) return;

    const lastIdx = data.length - 1;
    const lastCandle = data[lastIdx];
    const isIntradayChart = lastCandle.date.includes("T") || lastCandle.date.includes(" ");

    let candleTime: any;
    let candleOpen = lastCandle.close;
    let candleHigh = liveQuote.price;
    let candleLow = liveQuote.price;
    let isNewCandle = false;

    if (isIntradayChart) {
      const lastCandleTimeMs = new Date(lastCandle.date).getTime();
      const quoteTimeMs = new Date(liveQuote.timestamp).getTime();

      // Estimate time scale interval dynamically from average delta between last two candles
      let intervalMs = 5 * 60 * 1000; // Default to 5 minutes
      if (data.length > 1) {
        const prevCandleTimeMs = new Date(data[data.length - 2].date).getTime();
        const delta = lastCandleTimeMs - prevCandleTimeMs;
        if (delta > 0) intervalMs = delta;
      }

      isNewCandle = quoteTimeMs - lastCandleTimeMs >= intervalMs;

      if (isNewCandle) {
        const alignedTimeMs = Math.floor(quoteTimeMs / intervalMs) * intervalMs;
        candleTime = Math.floor(alignedTimeMs / 1000);
        candleOpen = liveQuote.price;
      } else {
        candleTime = Math.floor(lastCandleTimeMs / 1000);
        candleOpen = lastCandle.open;
        candleHigh = Math.max(lastCandle.high, liveQuote.price);
        candleLow = Math.min(lastCandle.low, liveQuote.price);
      }
    } else {
      // Daily chart
      const todayStr = new Date().toISOString().split("T")[0];
      isNewCandle = todayStr > lastCandle.date;

      if (isNewCandle) {
        candleTime = todayStr;
        candleOpen = liveQuote.price;
      } else {
        candleTime = lastCandle.date;
        candleOpen = lastCandle.open;
        candleHigh = Math.max(lastCandle.high, liveQuote.price);
        candleLow = Math.min(lastCandle.low, liveQuote.price);
      }
    }

    const updatedCandle = {
      time: candleTime,
      open: candleOpen,
      high: candleHigh,
      low: candleLow,
      close: liveQuote.price,
    };

    try {
      candlestickSeriesRef.current.update(updatedCandle);

      if (volumeSeriesRef.current) {
        volumeSeriesRef.current.update({
          time: candleTime,
          value: isNewCandle ? liveQuote.volume : (liveQuote.volume || lastCandle.volume || 0),
          color: updatedCandle.close >= updatedCandle.open
            ? "rgba(16, 185, 129, 0.4)" // Green
            : "rgba(239, 68, 68, 0.4)", // Red
        });
      }
    } catch (err) {
      console.warn("Failed to apply real-time candle update:", err);
    }
  }, [liveQuote, data.length]);

  return (
    <div className="relative">
      <div
        ref={chartContainerRef}
        className="w-full h-[440px] rounded-lg overflow-hidden border border-white/5 bg-zinc-950/40"
      />
      {/* Floating OHLCV Tooltip */}
      <div
        ref={tooltipRef}
        style={{
          display: "none",
          position: "absolute",
          zIndex: 50,
          padding: "10px 12px",
          background: isLightMode ? "rgba(255, 255, 255, 0.96)" : "rgba(9, 9, 11, 0.92)",
          backdropFilter: "blur(12px)",
          border: isLightMode ? "1px solid rgba(0, 0, 0, 0.1)" : "1px solid rgba(255, 255, 255, 0.1)",
          borderRadius: "10px",
          pointerEvents: "none",
          minWidth: "160px",
          boxShadow: isLightMode ? "0 8px 32px rgba(0,0,0,0.1)" : "0 8px 32px rgba(0,0,0,0.5)",
          color: isLightMode ? "#1c1e21" : "#f4f4f5",
        }}
      />
    </div>
  );
}
