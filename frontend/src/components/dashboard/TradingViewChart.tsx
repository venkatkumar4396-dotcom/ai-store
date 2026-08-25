"use client";

import React, { useEffect, useRef, memo } from "react";
import { useTheme } from "@/components/layout/ThemeProvider";

interface TradingViewChartProps {
  symbol: string;
  height?: number | string;
  autosize?: boolean;
}

/**
 * Maps standard ticker symbols to TradingView format
 * Examples:
 *   RELIANCE.NS -> NSE:RELIANCE
 *   TMCV.NS -> NSE:TATAMOTORS
 *   TATAMOTORS.NS -> NSE:TATAMOTORS
 *   SBIN.NS -> NSE:SBIN
 *   HDFCBANK.NS -> NSE:HDFCBANK
 *   INFY.NS -> NSE:INFY
 *   TCS.NS -> NSE:TCS
 *   ^NSEI -> NSE:NIFTY
 *   ^NSEBANK -> NSE:BANKNIFTY
 *   ^BSESN -> BSE:SENSEX
 *   AAPL -> NASDAQ:AAPL
 *   TSLA -> NASDAQ:TSLA
 *   BTC-USD -> BINANCE:BTCUSDT
 */
export function mapToTradingViewSymbol(symbol: string): string {
  if (!symbol) return "NSE:RELIANCE";
  const clean = symbol.toUpperCase().trim();

  // Indian Indices
  if (clean === "^NSEI" || clean === "NIFTY") return "NSE:NIFTY";
  if (clean === "^NSEBANK" || clean === "BANKNIFTY") return "NSE:BANKNIFTY";
  if (clean === "^BSESN" || clean === "SENSEX") return "BSE:SENSEX";

  // Indian Stocks (.NS -> NSE:, .BO -> BSE:)
  if (clean.endsWith(".NS")) {
    const raw = clean.replace(".NS", "");
    if (raw === "TMCV") return "NSE:TATAMOTORS";
    if (raw === "ETERNAL") return "NSE:ZOMATO";
    return `NSE:${raw}`;
  }
  if (clean.endsWith(".BO")) {
    const raw = clean.replace(".BO", "");
    return `BSE:${raw}`;
  }

  // Crypto
  if (clean === "BTC-USD" || clean === "BTCUSD" || clean === "BITCOIN") return "BINANCE:BTCUSDT";
  if (clean === "ETH-USD" || clean === "ETHUSD" || clean === "ETHEREUM") return "BINANCE:ETHUSDT";
  if (clean === "SOL-USD" || clean === "SOLUSD" || clean === "SOLANA") return "BINANCE:SOLUSDT";

  // Commodities & Forex
  if (clean === "GC=F") return "OANDA:XAUUSD";
  if (clean === "CL=F") return "NYMEX:CL1!";
  if (clean === "EURUSD=X") return "FX:EURUSD";
  if (clean === "GBPUSD=X") return "FX:GBPUSD";

  // US Tech Giants default to NASDAQ
  const nasdaqList = ["AAPL", "TSLA", "MSFT", "NVDA", "AMZN", "GOOGL", "GOOG", "META", "NFLX", "AMD", "INTC", "PYPL"];
  if (nasdaqList.includes(clean)) {
    return `NASDAQ:${clean}`;
  }

  // Default fallback
  return clean.includes(":") ? clean : `NASDAQ:${clean}`;
}

function TradingViewChartComponent({ symbol, height = 560, autosize = true }: TradingViewChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const { theme } = useTheme();
  const tvSymbol = mapToTradingViewSymbol(symbol);

  useEffect(() => {
    if (!containerRef.current) return;

    // Clear previous widget
    containerRef.current.innerHTML = "";

    const widgetContainer = document.createElement("div");
    widgetContainer.className = "tradingview-widget-container__widget";
    widgetContainer.style.height = "100%";
    widgetContainer.style.width = "100%";
    containerRef.current.appendChild(widgetContainer);

    const script = document.createElement("script");
    script.src = "https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js";
    script.type = "text/javascript";
    script.async = true;

    const widgetConfig = {
      autosize: autosize,
      symbol: tvSymbol,
      interval: "5",
      timezone: "Asia/Kolkata",
      theme: theme === "light" ? "light" : "dark",
      style: "1", // 1 = Candlestick
      locale: "en",
      enable_publishing: false,
      allow_symbol_change: true,
      calendar: false,
      support_host: "https://www.tradingview.com",
      hide_side_toolbar: false,
      withdateranges: true,
      hide_volume: false,
      details: true,
      hotlist: true,
      studies: [
        "STD;RSI",
        "STD;MACD",
      ],
      show_popup_button: true,
      popup_width: "1000",
      popup_height: "650",
      backgroundColor: theme === "light" ? "rgba(255, 255, 255, 1)" : "rgba(9, 9, 11, 0.8)",
      gridColor: theme === "light" ? "rgba(0, 0, 0, 0.05)" : "rgba(255, 255, 255, 0.04)",
    };

    script.innerHTML = JSON.stringify(widgetConfig);
    containerRef.current.appendChild(script);

    return () => {
      if (containerRef.current) {
        containerRef.current.innerHTML = "";
      }
    };
  }, [tvSymbol, theme, autosize]);

  return (
    <div
      ref={containerRef}
      className="tradingview-widget-container w-full rounded-xl overflow-hidden border border-white/[0.08] shadow-2xl"
      style={{ height: typeof height === "number" ? `${height}px` : height, minHeight: "520px" }}
    />
  );
}

export const TradingViewChart = memo(TradingViewChartComponent);
export default TradingViewChart;
