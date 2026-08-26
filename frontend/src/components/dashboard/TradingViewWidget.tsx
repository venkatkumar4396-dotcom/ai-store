"use client";

import React, { useEffect, useRef, memo } from "react";
import { useTheme } from "@/components/layout/ThemeProvider";
import { Loader2 } from "lucide-react";

interface TradingViewWidgetProps {
  symbol: string;
  height?: number | string;
  interval?: string;
}

export function mapToTradingViewSymbol(symbol: string): string {
  if (!symbol) return "NSE:NIFTY";
  const upper = symbol.toUpperCase().trim();

  // Indian Stocks & Indices
  if (upper === "RELIANCE.NS" || upper === "RELIANCE") return "NSE:RELIANCE";
  if (upper === "TMCV.NS" || upper === "TATAMOTORS.NS" || upper === "TATAMOTORS") return "NSE:TATAMOTORS";
  if (upper === "SBIN.NS" || upper === "SBIN") return "NSE:SBIN";
  if (upper === "INFY.NS" || upper === "INFY") return "NSE:INFY";
  if (upper === "TCS.NS" || upper === "TCS") return "NSE:TCS";
  if (upper === "HDFCBANK.NS" || upper === "HDFCBANK") return "NSE:HDFCBANK";
  if (upper === "ICICIBANK.NS" || upper === "ICICIBANK") return "NSE:ICICIBANK";
  if (upper === "WIPRO.NS" || upper === "WIPRO") return "NSE:WIPRO";
  if (upper === "ITC.NS" || upper === "ITC") return "NSE:ITC";
  if (upper === "LT.NS" || upper === "LT") return "NSE:LT";
  if (upper === "ETERNAL.NS" || upper === "ZOMATO.NS" || upper === "ZOMATO") return "NSE:ZOMATO";
  if (upper === "PAYTM.NS" || upper === "PAYTM") return "NSE:PAYTM";
  if (upper === "BHARTIARTL.NS" || upper === "AIRTEL") return "NSE:BHARTIARTL";
  if (upper === "ADANIENT.NS" || upper === "ADANI") return "NSE:ADANIENT";
  if (upper === "MARUTI.NS" || upper === "MARUTI") return "NSE:MARUTI";
  if (upper === "BAJFINANCE.NS") return "NSE:BAJFINANCE";
  if (upper === "KOTAKBANK.NS") return "NSE:KOTAKBANK";
  if (upper === "AXISBANK.NS") return "NSE:AXISBANK";
  if (upper === "HAL.NS") return "NSE:HAL";
  if (upper === "BEL.NS") return "NSE:BEL";
  if (upper === "COALINDIA.NS") return "NSE:COALINDIA";
  if (upper === "JIOFIN.NS") return "NSE:JIOFIN";
  if (upper === "TATASTEEL.NS") return "NSE:TATASTEEL";
  if (upper === "TATAPOWER.NS") return "NSE:TATAPOWER";
  if (upper === "TITAN.NS") return "NSE:TITAN";
  if (upper === "ASIANPAINT.NS") return "NSE:ASIANPAINT";
  if (upper === "SUNPHARMA.NS") return "NSE:SUNPHARMA";
  if (upper === "^NSEI" || upper === "NIFTY" || upper === "NIFTY50") return "NSE:NIFTY";
  if (upper === "^NSEBANK" || upper === "BANKNIFTY") return "NSE:BANKNIFTY";
  if (upper === "^BSESN" || upper === "SENSEX") return "BSE:SENSEX";

  // Generic .NS / .BO handling
  if (upper.endsWith(".NS")) {
    return `NSE:${upper.replace(".NS", "")}`;
  }
  if (upper.endsWith(".BO")) {
    return `BSE:${upper.replace(".BO", "")}`;
  }

  // Crypto
  if (upper === "BTC-USD" || upper === "BTCUSD" || upper === "BTC") return "BINANCE:BTCUSDT";
  if (upper === "ETH-USD" || upper === "ETHUSD" || upper === "ETH") return "BINANCE:ETHUSDT";
  if (upper === "SOL-USD" || upper === "SOLUSD" || upper === "SOL") return "BINANCE:SOLUSDT";

  // Forex & Commodities
  if (upper === "EURUSD=X" || upper === "EURUSD") return "FX:EURUSD";
  if (upper === "GBPUSD=X" || upper === "GBPUSD") return "FX:GBPUSD";
  if (upper === "USDJPY=X" || upper === "USDJPY") return "FX:USDJPY";
  if (upper === "GC=F" || upper === "GOLD") return "COMEX:GC1!";
  if (upper === "CL=F" || upper === "OIL") return "NYMEX:CL1!";

  // US Tech Giants
  const nasdaqList = ["AAPL", "TSLA", "MSFT", "NVDA", "AMZN", "GOOGL", "GOOG", "META", "NFLX", "AMD", "INTC", "PYPL", "ADBE", "CRM"];
  if (nasdaqList.includes(upper)) return `NASDAQ:${upper}`;

  return `NASDAQ:${upper}`;
}

function TradingViewWidgetComponent({ symbol, height = 520, interval = "D" }: TradingViewWidgetProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const { theme } = useTheme();
  const isLightMode = theme === "light";
  const [isLoading, setIsLoading] = React.useState(true);

  const tvSymbol = React.useMemo(() => mapToTradingViewSymbol(symbol), [symbol]);
  const isIndia = tvSymbol.startsWith("NSE:") || tvSymbol.startsWith("BSE:");
  const timezone = isIndia ? "Asia/Kolkata" : "America/New_York";

  useEffect(() => {
    setIsLoading(true);
    const container = containerRef.current;
    if (!container) return;

    // Clear previous widget
    container.innerHTML = "";

    const widgetContainer = document.createElement("div");
    widgetContainer.className = "tradingview-widget-container";
    widgetContainer.style.height = "100%";
    widgetContainer.style.width = "100%";

    const widgetDiv = document.createElement("div");
    widgetDiv.className = "tradingview-widget-container__widget";
    widgetDiv.style.height = "100%";
    widgetDiv.style.width = "100%";
    widgetContainer.appendChild(widgetDiv);

    const script = document.createElement("script");
    script.type = "text/javascript";
    script.src = "https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js";
    script.async = true;
    script.innerHTML = JSON.stringify({
      autosize: true,
      symbol: tvSymbol,
      interval: interval,
      timezone: timezone,
      theme: isLightMode ? "light" : "dark",
      style: "1",
      locale: "en",
      enable_publishing: false,
      hide_side_toolbar: false,
      allow_symbol_change: true,
      save_image: true,
      calendar: false,
      support_host: "https://www.tradingview.com",
      studies: [
        "Volume@tv-basicstudies",
        "MASimple@tv-basicstudies",
        "RSI@tv-basicstudies",
      ],
      container_id: "tradingview_advanced_chart",
    });

    widgetContainer.appendChild(script);
    container.appendChild(widgetContainer);

    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 900);

    return () => {
      clearTimeout(timer);
      if (container) {
        container.innerHTML = "";
      }
    };
  }, [tvSymbol, isLightMode, interval, timezone]);

  return (
    <div className="relative w-full rounded-xl overflow-hidden border border-white/[0.08] bg-zinc-950/60 shadow-2xl backdrop-blur-xl" style={{ height }}>
      {isLoading && (
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-zinc-950/80 backdrop-blur-md text-zinc-400 gap-3">
          <Loader2 className="h-7 w-7 animate-spin text-emerald-400" />
          <div className="text-xs font-semibold text-zinc-300">Loading TradingView Live Data for {tvSymbol}...</div>
        </div>
      )}
      <div ref={containerRef} className="w-full h-full" />
    </div>
  );
}

export default memo(TradingViewWidgetComponent);
