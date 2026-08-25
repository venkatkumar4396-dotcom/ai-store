"use client";

import React, { useEffect, useRef, useState, useCallback, useMemo } from "react";
import {
  createChart,
  ColorType,
  LineStyle,
  CandlestickSeries,
  HistogramSeries,
  LineSeries,
  CrosshairMode,
  createSeriesMarkers,
} from "lightweight-charts";
import { useTheme } from "@/components/layout/ThemeProvider";
import {
  Maximize2,
  Minimize2,
  Sparkles,
  TrendingUp,
  TrendingDown,
  Layers,
  Eye,
  EyeOff,
  Activity,
  SlidersHorizontal,
} from "lucide-react";

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
  onPeriodChange?: (period: "5d" | "1mo" | "3mo" | "6mo" | "1y") => void;
  currentPeriod?: string;
  isIntraday?: boolean;
}

/** Format large numbers compactly */
function formatVolume(vol: number): string {
  if (!vol || isNaN(vol)) return "0";
  if (vol >= 1_000_000_000) return (vol / 1_000_000_000).toFixed(2) + "B";
  if (vol >= 1_000_000) return (vol / 1_000_000).toFixed(2) + "M";
  if (vol >= 1_000) return (vol / 1_000).toFixed(1) + "K";
  return vol.toLocaleString();
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

// Indicator calculation helpers
function calculateEMA(data: CandleData[], period: number) {
  if (data.length < period) return [];
  const k = 2 / (period + 1);
  let ema = data.slice(0, period).reduce((sum, d) => sum + d.close, 0) / period;
  const result: { time: any; value: number }[] = [];

  for (let i = period - 1; i < data.length; i++) {
    const d = data[i];
    const hasTime = d.date.includes("T") || d.date.includes(" ");
    const time = hasTime ? Math.floor(new Date(d.date).getTime() / 1000) : d.date;

    if (i === period - 1) {
      result.push({ time: time as any, value: ema });
    } else {
      ema = d.close * k + ema * (1 - k);
      result.push({ time: time as any, value: ema });
    }
  }
  return result;
}

function calculateSMA(data: CandleData[], period: number) {
  if (data.length < period) return [];
  const result: { time: any; value: number }[] = [];

  for (let i = period - 1; i < data.length; i++) {
    const d = data[i];
    const hasTime = d.date.includes("T") || d.date.includes(" ");
    const time = hasTime ? Math.floor(new Date(d.date).getTime() / 1000) : d.date;

    const slice = data.slice(i - period + 1, i + 1);
    const sum = slice.reduce((acc, curr) => acc + curr.close, 0);
    result.push({ time: time as any, value: sum / period });
  }
  return result;
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
  onPeriodChange,
  currentPeriod = "6mo",
  isIntraday = false,
}: CandlestickChartProps) {
  const { theme } = useTheme();
  const isLightMode = theme === "light";
  const containerRef = useRef<HTMLDivElement>(null);
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<any>(null);
  const candlestickSeriesRef = useRef<any>(null);
  const volumeSeriesRef = useRef<any>(null);

  // Indicators toggle state
  const [showEMA20, setShowEMA20] = useState(true);
  const [showSMA50, setShowSMA50] = useState(true);
  const [showSMA200, setShowSMA200] = useState(false);
  const [showSignals, setShowSignals] = useState(true);
  const [showPriceLevels, setShowPriceLevels] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const [hoverData, setHoverData] = useState<{
    open: number;
    high: number;
    low: number;
    close: number;
    volume: number;
    change: number;
    changePct: string;
    time: string;
    signal?: CandleSignal;
  } | null>(null);

  const isIndia = symbol?.toUpperCase().endsWith(".NS") || symbol?.toUpperCase().endsWith(".BO");
  const currencySymbol = isIndia ? "₹" : "$";
  const exchangeTimeZone = isIndia ? "Asia/Kolkata" : "America/New_York";
  const localTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const activeTimeZone = timezoneMode === "exchange" ? exchangeTimeZone : localTimeZone;

  const tzName = useMemo(() => {
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

  // Current or latest bar for the top status line
  const latestBar = useMemo(() => {
    if (hoverData) return hoverData;
    if (!data || data.length === 0) return null;
    const last = data[data.length - 1];
    const change = last.close - last.open;
    const changePct = last.open !== 0 ? ((change / last.open) * 100).toFixed(2) : "0.00";
    return {
      open: last.open,
      high: last.high,
      low: last.low,
      close: last.close,
      volume: last.volume || 0,
      change,
      changePct,
      time: last.date,
    };
  }, [hoverData, data]);

  const toggleFullscreen = useCallback(() => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen?.().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      document.exitFullscreen?.().then(() => setIsFullscreen(false)).catch(() => {});
    }
  }, []);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
      if (chartRef.current && chartContainerRef.current) {
        chartRef.current.applyOptions({
          width: chartContainerRef.current.clientWidth,
          height: document.fullscreenElement ? window.innerHeight - 90 : 560,
        });
        chartRef.current.timeScale().fitContent();
      }
    };
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, []);

  useEffect(() => {
    if (!chartContainerRef.current) return;

    // Determine dynamic price precision based on dataset min price
    const minPrice = data.length > 0 ? Math.min(...data.map((d) => (d.low > 0 ? d.low : d.close))) : 100;
    let precision = 2;
    let minMove = 0.01;
    if (minPrice < 0.01) { precision = 6; minMove = 0.000001; }
    else if (minPrice < 1) { precision = 4; minMove = 0.0001; }
    else if (minPrice < 10) { precision = 3; minMove = 0.001; }

    const chartBg = isLightMode ? "#ffffff" : "rgba(10, 10, 15, 0.95)";
    const textColor = isLightMode ? "#475569" : "#94a3b8";
    const gridColor = isLightMode ? "rgba(0, 0, 0, 0.05)" : "rgba(255, 255, 255, 0.04)";
    const borderColor = isLightMode ? "rgba(0, 0, 0, 0.1)" : "rgba(255, 255, 255, 0.09)";
    const chartHeight = isFullscreen ? window.innerHeight - 90 : 560;

    const chart = createChart(chartContainerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: chartBg },
        textColor: textColor,
        fontSize: 11,
      },
      grid: {
        vertLines: { color: gridColor },
        horzLines: { color: gridColor },
      },
      crosshair: {
        mode: CrosshairMode.Normal,
        vertLine: {
          color: "rgba(99, 102, 241, 0.5)",
          width: 1,
          style: LineStyle.Dashed,
          labelBackgroundColor: "#6366f1",
        },
        horzLine: {
          color: "rgba(99, 102, 241, 0.5)",
          width: 1,
          style: LineStyle.Dashed,
          labelBackgroundColor: "#6366f1",
        },
      },
      rightPriceScale: {
        borderColor: borderColor,
        visible: true,
        scaleMargins: {
          top: 0.08,
          bottom: 0.20,
        },
      },
      timeScale: {
        borderColor: borderColor,
        visible: true,
        timeVisible: true,
        fixLeftEdge: true,
        fixRightEdge: true,
        rightOffset: 8,
        barSpacing: Math.max(6, Math.min(20, Math.floor(800 / Math.max(data.length, 1)))),
      },
      localization: {
        priceFormatter: (price: number) => `${currencySymbol}${formatPrice(price)}`,
        timeFormatter: (time: any) => {
          if (typeof time === "string") return time;
          const date = new Date(time * 1000);
          return new Intl.DateTimeFormat("en-US", {
            timeZone: activeTimeZone,
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
            hour12: false,
          }).format(date);
        },
      },
      width: chartContainerRef.current.clientWidth,
      height: chartHeight,
    });

    chartRef.current = chart;

    // ── Candlestick Series ──────────────────────────────────
    const candlestickSeries = chart.addSeries(CandlestickSeries, {
      upColor: "#10b981",
      downColor: "#ef4444",
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
        top: 0.80,
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
            ? "rgba(16, 185, 129, 0.45)"
            : "rgba(239, 68, 68, 0.45)",
      };
    });

    volumeSeries.setData(volumeData);

    // ── Technical Indicators Lines ──────────────────────────
    if (showEMA20) {
      const emaData = calculateEMA(data, 20);
      if (emaData.length > 0) {
        const emaSeries = chart.addSeries(LineSeries, {
          color: "#f59e0b", // amber-500
          lineWidth: 1,
          priceLineVisible: false,
          crosshairMarkerVisible: false,
          title: "EMA 20",
        });
        emaSeries.setData(emaData);
      }
    }

    if (showSMA50) {
      const sma50Data = calculateSMA(data, 50);
      if (sma50Data.length > 0) {
        const sma50Series = chart.addSeries(LineSeries, {
          color: "#06b6d4", // cyan-500
          lineWidth: 1,
          priceLineVisible: false,
          crosshairMarkerVisible: false,
          title: "SMA 50",
        });
        sma50Series.setData(sma50Data);
      }
    }

    if (showSMA200) {
      const sma200Data = calculateSMA(data, 200);
      if (sma200Data.length > 0) {
        const sma200Series = chart.addSeries(LineSeries, {
          color: "#a855f7", // purple-500
          lineWidth: 2,
          priceLineVisible: false,
          crosshairMarkerVisible: false,
          title: "SMA 200",
        });
        sma200Series.setData(sma200Data);
      }
    }

    // ── Buy / Sell Markers (Compact arrow badges without giant text strings) ───
    if (showSignals && signals && signals.length > 0) {
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
            text: isBuy ? "BUY" : "SELL",
            size: 1,
          };
        });

      if (markers.length > 0) {
        createSeriesMarkers(candlestickSeries, markers);
      }
    }

    // ── Price Lines ──────────────────────────────────────────
    if (showPriceLevels) {
      if (stopLoss) {
        candlestickSeries.createPriceLine({
          price: stopLoss,
          color: "#f43f5e",
          lineWidth: 2,
          lineStyle: LineStyle.Dashed,
          axisLabelVisible: true,
          title: "Stop Loss",
        });
      }

      if (profitTarget) {
        candlestickSeries.createPriceLine({
          price: profitTarget,
          color: "#10b981",
          lineWidth: 2,
          lineStyle: LineStyle.Dashed,
          axisLabelVisible: true,
          title: "Profit Target",
        });
      }

      if (avgPrice && avgPrice > 0) {
        candlestickSeries.createPriceLine({
          price: avgPrice,
          color: "#818cf8",
          lineWidth: 2,
          lineStyle: LineStyle.Dashed,
          axisLabelVisible: true,
          title: "Avg Cost",
        });
      }

      supportLevels.forEach((level) => {
        candlestickSeries.createPriceLine({
          price: level,
          color: "#06b6d4",
          lineWidth: 1,
          lineStyle: LineStyle.Dotted,
          axisLabelVisible: true,
          title: "Support",
        });
      });

      resistanceLevels.forEach((level) => {
        candlestickSeries.createPriceLine({
          price: level,
          color: "#f59e0b",
          lineWidth: 1,
          lineStyle: LineStyle.Dotted,
          axisLabelVisible: true,
          title: "Resistance",
        });
      });
    }

    // ── Crosshair Hover Handler ─────────────────────────────
    chart.subscribeCrosshairMove((param: any) => {
      if (!param || !param.time || !param.point || param.point.x < 0 || param.point.y < 0) {
        setHoverData(null);
        return;
      }

      const candleInfo = param.seriesData?.get(candlestickSeries);
      const volumeInfo = param.seriesData?.get(volumeSeries);

      if (!candleInfo) {
        setHoverData(null);
        return;
      }

      const { open, high, low, close } = candleInfo as any;
      const volume = (volumeInfo as any)?.value || 0;
      const change = close - open;
      const changePct = open !== 0 ? ((change / open) * 100).toFixed(2) : "0.00";

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
        displayTime = new Intl.DateTimeFormat("en-US", {
          timeZone: activeTimeZone,
          month: "short",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
          hour12: false,
        }).format(date);
      } else {
        displayTime = dateVal as string;
      }

      setHoverData({
        open,
        high,
        low,
        close,
        volume,
        change,
        changePct,
        time: displayTime,
        signal: matchingSignal,
      });
    });

    chart.timeScale().fitContent();

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
  }, [
    data,
    stopLoss,
    profitTarget,
    supportLevels,
    resistanceLevels,
    signals,
    isLightMode,
    activeTimeZone,
    tzName,
    avgPrice,
    isFullscreen,
    currencySymbol,
    showEMA20,
    showSMA50,
    showSMA200,
    showSignals,
    showPriceLevels,
  ]);

  // Real-time live quote ticks
  useEffect(() => {
    if (!candlestickSeriesRef.current || !liveQuote || data.length === 0) return;

    const lastIdx = data.length - 1;
    const lastCandle = data[lastIdx];
    const isIntradayChart = lastCandle.date.includes("T") || lastCandle.date.includes(" ");

    let candleTime: any;
    let candleOpen = lastCandle.close;
    let candleHigh = liveQuote.price;
    let candleLow = liveQuote.price;

    if (isIntradayChart) {
      const lastCandleTimeMs = new Date(lastCandle.date).getTime();
      const quoteTimeMs = new Date(liveQuote.timestamp).getTime();
      const intervalMs = 5 * 60 * 1000;
      const isNewCandle = quoteTimeMs - lastCandleTimeMs >= intervalMs;

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
      const todayStr = new Date().toISOString().split("T")[0];
      const isNewCandle = todayStr > lastCandle.date;

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
          value: liveQuote.volume || lastCandle.volume || 0,
          color: updatedCandle.close >= updatedCandle.open
            ? "rgba(16, 185, 129, 0.45)"
            : "rgba(239, 68, 68, 0.45)",
        });
      }
    } catch {}
  }, [liveQuote, data.length]);

  return (
    <div ref={containerRef} className="relative w-full rounded-2xl overflow-hidden bg-zinc-950/70 border border-white/[0.08] shadow-2xl backdrop-blur-xl">
      {/* ─── Top TradingView-Style Status Bar ─── */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-2.5 bg-zinc-900/80 border-b border-white/[0.06] text-xs backdrop-blur-md">
        <div className="flex flex-wrap items-center gap-3 font-mono">
          <span className="font-extrabold text-white tracking-wide flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse inline-block" />
            {symbol || "ASSET"}
          </span>
          {latestBar && (
            <>
              <span className="text-zinc-400">
                O: <span className={latestBar.close >= latestBar.open ? "text-emerald-400 font-semibold" : "text-rose-400 font-semibold"}>{currencySymbol}{formatPrice(latestBar.open)}</span>
              </span>
              <span className="text-zinc-400">
                H: <span className="text-amber-400 font-semibold">{currencySymbol}{formatPrice(latestBar.high)}</span>
              </span>
              <span className="text-zinc-400">
                L: <span className="text-cyan-400 font-semibold">{currencySymbol}{formatPrice(latestBar.low)}</span>
              </span>
              <span className="text-zinc-400">
                C: <span className={latestBar.close >= latestBar.open ? "text-emerald-400 font-bold" : "text-rose-400 font-bold"}>{currencySymbol}{formatPrice(latestBar.close)}</span>
              </span>
              <span className={`font-semibold flex items-center gap-1 px-1.5 py-0.5 rounded ${latestBar.change >= 0 ? "text-emerald-400 bg-emerald-500/10" : "text-rose-400 bg-rose-500/10"}`}>
                {latestBar.change >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                {latestBar.change >= 0 ? "+" : ""}{currencySymbol}{formatPrice(latestBar.change)} ({latestBar.changePct}%)
              </span>
              <span className="text-zinc-400 hidden sm:inline">
                Vol: <span className="text-zinc-200 font-semibold">{formatVolume(latestBar.volume)}</span>
              </span>
            </>
          )}
        </div>

        {/* Indicator & View Controls */}
        <div className="flex items-center gap-2">
          {latestBar?.signal && (
            <span className={`px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 shadow-sm ${
              latestBar.signal.type === "BUY" ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30" : "bg-rose-500/20 text-rose-300 border border-rose-500/30"
            }`}>
              <Sparkles className="h-3 w-3" />
              {latestBar.signal.type}: {latestBar.signal.label}
            </span>
          )}

          {/* Indicator toggles */}
          <div className="hidden lg:flex items-center gap-1 bg-white/[0.04] p-0.5 rounded-lg border border-white/[0.06] text-[10px]">
            <button
              onClick={() => setShowEMA20(!showEMA20)}
              className={`px-2 py-0.5 rounded font-semibold transition-all ${
                showEMA20 ? "bg-amber-500/20 text-amber-300 border border-amber-500/30" : "text-zinc-500 hover:text-zinc-300"
              }`}
              title="Toggle EMA 20 line"
            >
              EMA 20
            </button>
            <button
              onClick={() => setShowSMA50(!showSMA50)}
              className={`px-2 py-0.5 rounded font-semibold transition-all ${
                showSMA50 ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/30" : "text-zinc-500 hover:text-zinc-300"
              }`}
              title="Toggle SMA 50 line"
            >
              SMA 50
            </button>
            <button
              onClick={() => setShowSMA200(!showSMA200)}
              className={`px-2 py-0.5 rounded font-semibold transition-all ${
                showSMA200 ? "bg-purple-500/20 text-purple-300 border border-purple-500/30" : "text-zinc-500 hover:text-zinc-300"
              }`}
              title="Toggle SMA 200 line"
            >
              SMA 200
            </button>
            <button
              onClick={() => setShowPriceLevels(!showPriceLevels)}
              className={`px-2 py-0.5 rounded font-semibold transition-all ${
                showPriceLevels ? "bg-indigo-500/20 text-indigo-300 border border-indigo-500/30" : "text-zinc-500 hover:text-zinc-300"
              }`}
              title="Toggle Stop Loss, Profit Target, Support & Resistance"
            >
              Levels
            </button>
          </div>

          <button
            onClick={toggleFullscreen}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-white bg-white/[0.04] hover:bg-white/10 border border-white/5 transition-all"
            title={isFullscreen ? "Exit Fullscreen" : "Fullscreen View"}
          >
            {isFullscreen ? <Minimize2 className="h-3.5 w-3.5" /> : <Maximize2 className="h-3.5 w-3.5" />}
          </button>
        </div>
      </div>

      {/* Chart Canvas */}
      <div
        ref={chartContainerRef}
        className="w-full"
        style={{ height: isFullscreen ? "calc(100vh - 90px)" : "560px" }}
      />
    </div>
  );
}
