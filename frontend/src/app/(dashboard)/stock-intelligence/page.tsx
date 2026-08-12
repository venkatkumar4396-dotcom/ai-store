"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import dynamic from "next/dynamic";
import api from "@/lib/api";
import {
  TrendingUp,
  TrendingDown,
  Search,
  Plus,
  Trash2,
  RefreshCw,
  BarChart3,
  Activity,
  DollarSign,
  Shield,
  Brain,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
  Star,
  Eye,
  ChevronRight,
  AlertTriangle,
  Loader2,
  Zap,
  Target,
  Clock,
  Sparkles,
  LineChart,
  Crosshair,
  Globe,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { PaperTradingPanel } from "@/components/dashboard/PaperTradingPanel";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";


const CandlestickChart = dynamic(
  () => import("@/components/dashboard/CandlestickChart"),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-[440px] flex items-center justify-center bg-zinc-950/40 border border-white/5 rounded-lg text-zinc-400">
        <Loader2 className="h-6 w-6 animate-spin mr-2" /> Loading Chart...
      </div>
    ),
  }
);

const MarketSituationPanel = dynamic(
  () => import("@/components/dashboard/MarketSituationPanel"),
  {
    ssr: false,
    loading: () => null,
  }
);

interface StockAnalysis {
  symbol: string;
  companyName: string;
  currentPrice: number;
  change: number;
  changePercent: number;
  technicalIndicators: {
    rsi: number;
    macd: { value: number; signal: number; histogram: number };
    ema20: number;
    sma50: number;
    sma200: number;
    bollingerBands: { upper: number; middle: number; lower: number };
    volume: number;
    avgVolume: number;
  };
  scores: {
    buy: number;
    sell: number;
    hold: number;
    confidence: number;
    risk: number;
  };
  recommendation: "STRONG_BUY" | "BUY" | "HOLD" | "SELL" | "STRONG_SELL";
  reasoning: string;
  sentimentSummary: string;
  supportLevels: number[];
  resistanceLevels: number[];
  stopLoss: number;
  profitTarget: number;
  analyzedAt: string;
}

interface WatchlistItem {
  id: string;
  symbol: string;
  name: string;
  createdAt: string;
}

interface PortfolioItem {
  id: string;
  symbol: string;
  shares: number;
  averagePrice: number;
  currentPrice?: number;
  totalValue?: number;
  pnl?: number;
  pnlPercent?: number;
}

/* ─── Premium Score Gauge ─── */
const ScoreGauge = ({ label, value, color, icon: Icon }: { label: string; value: number; color: string; icon?: any }) => (
  <div className="flex flex-col items-center gap-2.5 group">
    <div className="relative w-[76px] h-[76px]">
      <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
        <circle cx="50" cy="50" r="40" stroke="rgba(255,255,255,0.04)" strokeWidth="6" fill="none" />
        <circle
          cx="50" cy="50" r="40"
          stroke={color}
          strokeWidth="6"
          fill="none"
          strokeDasharray={`${value * 2.51} 251`}
          strokeLinecap="round"
          className="transition-all duration-1000 ease-out"
          style={{ filter: `drop-shadow(0 0 6px ${color}40)` }}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-lg font-bold text-white tabular-nums">{value}</span>
      </div>
    </div>
    <span className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider group-hover:text-zinc-300 transition-colors">{label}</span>
  </div>
);

/* ─── Technical Indicator Bar ─── */
const IndicatorBar = ({ label, value, min, max, unit = "" }: { label: string; value: number; min: number; max: number; unit?: string }) => {
  const pct = Math.max(0, Math.min(100, ((value - min) / (max - min)) * 100));
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-sm">
        <span className="text-zinc-400 font-medium">{label}</span>
        <span className="font-mono font-semibold text-white tabular-nums">{value.toFixed(2)}{unit}</span>
      </div>
      <div className="h-1.5 bg-white/[0.04] rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 1, ease: "easeOut" }}
          className={`h-full rounded-full ${pct > 70 ? "bg-gradient-to-r from-emerald-500 to-emerald-400" : pct > 30 ? "bg-gradient-to-r from-amber-500 to-amber-400" : "bg-gradient-to-r from-rose-500 to-rose-400"}`}
          style={{ boxShadow: pct > 70 ? '0 0 8px rgba(16,185,129,0.3)' : pct > 30 ? '0 0 8px rgba(245,158,11,0.3)' : '0 0 8px rgba(239,68,68,0.3)' }}
        />
      </div>
    </div>
  );
};

/* ─── Stat Mini Card ─── */
const STAT_COLORS: Record<string, { border: string; bg: string; text: string }> = {
  emerald: { border: "border-emerald-500/15", bg: "from-emerald-500/[0.06]", text: "text-emerald-400" },
  violet: { border: "border-violet-500/15", bg: "from-violet-500/[0.06]", text: "text-violet-400" },
  cyan: { border: "border-cyan-500/15", bg: "from-cyan-500/[0.06]", text: "text-cyan-400" },
  amber: { border: "border-amber-500/15", bg: "from-amber-500/[0.06]", text: "text-amber-400" },
  rose: { border: "border-rose-500/15", bg: "from-rose-500/[0.06]", text: "text-rose-400" },
  indigo: { border: "border-indigo-500/15", bg: "from-indigo-500/[0.06]", text: "text-indigo-400" },
};

const StatMini = ({ label, value, subtext, color }: { label: string; value: string; subtext?: string; color: string }) => {
  const c = STAT_COLORS[color] || STAT_COLORS.emerald;
  return (
    <div className={`relative overflow-hidden rounded-xl border ${c.border} bg-gradient-to-br ${c.bg} to-transparent p-4`}>
      <div className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-1">{label}</div>
      <div className={`text-xl font-bold font-mono ${c.text} tabular-nums`}>{value}</div>
      {subtext && <div className="text-[10px] text-zinc-500 mt-1">{subtext}</div>}
    </div>
  );
};

export default function StockIntelligencePage() {
  const [ticker, setTicker] = React.useState("");
  const [isIntraday, setIsIntraday] = React.useState(false);
  const [analysis, setAnalysis] = React.useState<StockAnalysis | null>(null);
  const [watchlist, setWatchlist] = React.useState<WatchlistItem[]>([]);
  const [portfolio, setPortfolio] = React.useState<PortfolioItem[]>([]);
  const [isAnalyzing, setIsAnalyzing] = React.useState(false);
  const [isLoadingWatchlist, setIsLoadingWatchlist] = React.useState(false);
  const [isLoadingPortfolio, setIsLoadingPortfolio] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [activeTab, setActiveTab] = React.useState("analyze");

  // Chart state
  const [chartData, setChartData] = React.useState<any[] | null>(null);
  const [chartSignals, setChartSignals] = React.useState<any[]>([]);
  const [chartPeriod, setChartPeriod] = React.useState<"5d" | "1mo" | "3mo" | "6mo" | "1y">("6mo");
  const [liveQuote, setLiveQuote] = React.useState<any>(null);
  const [quickTradeSide, setQuickTradeSide] = React.useState<"buy" | "sell">("buy");
  const [tradeCount, setTradeCount] = React.useState(0);

  // Read holding average cost from practice paper portfolio in localStorage
  const avgCostForChart = React.useMemo(() => {
    if (typeof window === "undefined" || !analysis?.symbol) return undefined;
    try {
      const saved = localStorage.getItem("nexora_paper_trading_v2");
      if (saved) {
        const parsed = JSON.parse(saved);
        const pos = parsed.positions?.find((p: any) => p.symbol === analysis.symbol);
        return pos ? pos.avgCost : undefined;
      }
    } catch {}
    return undefined;
  }, [analysis?.symbol, activeTab, tradeCount]);

  // Auto-refresh states
  const [isAutoRefreshEnabled, setIsAutoRefreshEnabled] = React.useState(false);
  const [autoRefreshInterval, setAutoRefreshInterval] = React.useState(300); // default 5 min = 300 seconds
  const [refreshTimeLeft, setRefreshTimeLeft] = React.useState(300);
  const [isRefreshDialogOpen, setIsRefreshDialogOpen] = React.useState(false);
  const [isToastVisible, setIsToastVisible] = React.useState(false);
  const [toastMessage, setToastMessage] = React.useState("");

  // Autocomplete states
  const [suggestions, setSuggestions] = React.useState<any[]>([]);
  const [showSuggestions, setShowSuggestions] = React.useState(false);
  const [isSearchingSuggestions, setIsSearchingSuggestions] = React.useState(false);
  const suggestionsRef = React.useRef<HTMLDivElement>(null);

  // Debounced search logic for suggestions
  React.useEffect(() => {
    if (ticker.trim().length < 2) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    const delayDebounceFn = setTimeout(async () => {
      setIsSearchingSuggestions(true);
      try {
        const { data } = await api.get(`/agents/stock/search?q=${encodeURIComponent(ticker)}`);
        setSuggestions(data || []);
        setShowSuggestions(data && data.length > 0);
      } catch (err) {
        console.error("Failed to fetch autocomplete suggestions:", err);
      } finally {
        setIsSearchingSuggestions(false);
      }
    }, 250); // 250ms debounce

    return () => clearTimeout(delayDebounceFn);
  }, [ticker]);

  // Click outside suggestions dropdown listener
  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (suggestionsRef.current && !suggestionsRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleQuickTrade = (side: "buy" | "sell") => {
    setQuickTradeSide(side);
    setActiveTab("practice");
  };

  // Timezone state
  const [timezoneMode, setTimezoneMode] = React.useState<"exchange" | "local">("exchange");

  const activeTimeZone = React.useMemo(() => {
    if (!analysis) return Intl.DateTimeFormat().resolvedOptions().timeZone;
    const isIndia = analysis.symbol.toUpperCase().endsWith(".NS") || analysis.symbol.toUpperCase().endsWith(".BO");
    const exchangeTimeZone = isIndia ? "Asia/Kolkata" : "America/New_York";
    return timezoneMode === "exchange" ? exchangeTimeZone : Intl.DateTimeFormat().resolvedOptions().timeZone;
  }, [analysis, timezoneMode]);

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

  // Market Situation panel state
  const [isSituationOpen, setIsSituationOpen] = React.useState(false);
  const [situationData, setSituationData] = React.useState<any>(null);
  const [isSituationLoading, setIsSituationLoading] = React.useState(false);

  // Portfolio form
  const [portfolioSymbol, setPortfolioSymbol] = React.useState("");
  const [portfolioShares, setPortfolioShares] = React.useState("");
  const [portfolioPrice, setPortfolioPrice] = React.useState("");

  React.useEffect(() => {
    loadWatchlist();
    loadPortfolio();
  }, []);

  // Real-time ticking feed for active stock (Simulates live tick fluctuations)
  React.useEffect(() => {
    if (!analysis) {
      setLiveQuote(null);
      return;
    }

    setLiveQuote({
      price: analysis.currentPrice,
      volume: analysis.technicalIndicators?.volume || 0,
      timestamp: new Date().toISOString(),
    });

    let currentTickPrice = analysis.currentPrice;
    const initialPrice = analysis.currentPrice - analysis.change;

    const interval = setInterval(() => {
      // Generate a standard micro-fluctuation (-0.02% to +0.02%) to simulate market action
      const changePct = (Math.random() - 0.5) * 0.0004;
      const absPrice = Math.abs(currentTickPrice);
      const dec = absPrice >= 100 ? 2 : absPrice >= 1 ? 3 : absPrice >= 0.01 ? 4 : 6;
      currentTickPrice = parseFloat((currentTickPrice + currentTickPrice * changePct).toFixed(dec));

      setLiveQuote({
        price: currentTickPrice,
        volume: analysis.technicalIndicators?.volume || 0,
        timestamp: new Date().toISOString(),
      });

      setAnalysis((prev) => {
        if (!prev) return null;
        const absoluteChange = currentTickPrice - initialPrice;
        const relativeChangePercent = (absoluteChange / initialPrice) * 100;
        
        return {
          ...prev,
          currentPrice: currentTickPrice,
          change: absoluteChange,
          changePercent: relativeChangePercent,
        };
      });
    }, 2500); // Tick every 2.5 seconds for active feel!

    return () => clearInterval(interval);
  }, [analysis?.symbol]);

  // Periodic background refresh timer
  React.useEffect(() => {
    if (!isAutoRefreshEnabled || !analysis?.symbol) {
      return;
    }

    setRefreshTimeLeft(autoRefreshInterval);

    const timer = setInterval(() => {
      setRefreshTimeLeft((prev) => {
        if (prev <= 1) {
          triggerBackgroundRefresh();
          return autoRefreshInterval;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isAutoRefreshEnabled, autoRefreshInterval, analysis?.symbol, isIntraday, chartPeriod]);

  async function triggerBackgroundRefresh() {
    if (!analysis?.symbol) return;
    
    setToastMessage(`Auto-refreshing ${analysis.symbol} data...`);
    setIsToastVisible(true);

    try {
      const symbol = analysis.symbol;
      const res = await api.post("/agents/stock/analyze", { 
        symbol: symbol.toUpperCase(),
        isIntraday: isIntraday 
      });
      const raw = res.data;

      const mapped: StockAnalysis = {
        symbol: raw.symbol,
        companyName: raw.companyName || raw.quote?.name || raw.symbol,
        currentPrice: raw.quote?.price || raw.currentPrice || 0,
        change: raw.quote?.change || raw.change || 0,
        changePercent: raw.quote?.changePercent || raw.changePercent || 0,
        technicalIndicators: {
          rsi: raw.technicalIndicators?.rsi || raw.indicators?.rsi || 0,
          macd: {
            value: raw.technicalIndicators?.macd?.macdLine || raw.indicators?.macd?.macdLine || raw.indicators?.macd?.value || 0,
            signal: raw.technicalIndicators?.macd?.signalLine || raw.indicators?.macd?.signalLine || raw.indicators?.macd?.signal || 0,
            histogram: raw.technicalIndicators?.macd?.histogram || raw.indicators?.macd?.histogram || 0,
          },
          ema20: raw.technicalIndicators?.ema20 || raw.indicators?.ema20 || 0,
          sma50: raw.technicalIndicators?.sma50 || raw.indicators?.sma50 || 0,
          sma200: raw.technicalIndicators?.sma200 || raw.indicators?.sma200 || 0,
          bollingerBands: raw.technicalIndicators?.bollingerBands || raw.indicators?.bollingerBands || { upper: 0, middle: 0, lower: 0 },
          volume: raw.technicalIndicators?.volume || raw.volume || raw.quote?.volume || 0,
          avgVolume: raw.technicalIndicators?.avgVolume || raw.avgVolume || raw.quote?.avgVolume || 0,
        },
        scores: {
          buy: raw.scores?.buy || raw.tradingSignals?.buyScore || 0,
          sell: raw.scores?.sell || raw.tradingSignals?.sellScore || 0,
          hold: raw.scores?.hold || raw.tradingSignals?.holdScore || 0,
          confidence: raw.scores?.confidence || raw.tradingSignals?.confidence || 0,
          risk: raw.scores?.risk || raw.tradingSignals?.riskLevel || 0,
        },
        recommendation: raw.recommendation || raw.tradingSignals?.recommendation || "HOLD",
        reasoning: raw.reasoning || raw.aiExplanation || raw.tradingSignals?.reasoning || "",
        sentimentSummary: raw.newsSentiment || (raw.tradingSignals?.signals ? raw.tradingSignals.signals.join("\n") : "") || "Neutral market sentiment detected.",
        supportLevels: raw.supportLevels || raw.tradingSignals?.supportLevels || [],
        resistanceLevels: raw.resistanceLevels || raw.tradingSignals?.resistanceLevels || [],
        stopLoss: raw.stopLoss || raw.tradingSignals?.stopLoss || 0,
        profitTarget: raw.profitTarget || raw.tradingSignals?.profitTarget || 0,
        analyzedAt: raw.analyzedAt || new Date().toISOString(),
      };

      setAnalysis(mapped);
      await fetchChartData(symbol, isIntraday ? "5d" : (chartPeriod === "5d" ? "6mo" : chartPeriod), isIntraday ? "5m" : "1d");
      
      setToastMessage(`Updated data for ${symbol} successfully.`);
      setTimeout(() => setIsToastVisible(false), 3000);
    } catch (err) {
      console.error("Auto-refresh failed", err);
      setToastMessage("Failed to auto-refresh stock data.");
      setTimeout(() => setIsToastVisible(false), 3000);
    }
  }

  async function loadWatchlist() {
    setIsLoadingWatchlist(true);
    try {
      const res = await api.get("/agents/stock/watchlist");
      setWatchlist(res.data || []);
    } catch {
      // Empty watchlist if not loaded
    } finally {
      setIsLoadingWatchlist(false);
    }
  }

  async function loadPortfolio() {
    setIsLoadingPortfolio(true);
    try {
      const res = await api.get("/agents/stock/portfolio");
      setPortfolio(res.data || []);
    } catch {
      // Empty portfolio if not loaded
    } finally {
      setIsLoadingPortfolio(false);
    }
  };

  const fetchChartData = async (symbol: string, period: "5d" | "1mo" | "3mo" | "6mo" | "1y", interval: "1d" | "5m" | "15m" | "1h" = "1d") => {
    try {
      const res = await api.get(`/agents/stock/chart/${symbol.toUpperCase()}?period=${period}&interval=${interval}`);
      if (res.data && res.data.candles) {
        setChartData(res.data.candles);
        setChartSignals(res.data.signals || []);
      }
    } catch (err) {
      console.error("Failed to fetch chart data", err);
    }
  };

  const fetchMarketSituation = async (symbol: string) => {
    setIsSituationOpen(true);
    setIsSituationLoading(true);
    try {
      const res = await api.get(`/agents/stock/situation/${symbol.toUpperCase()}`);
      setSituationData(res.data);
    } catch (err) {
      console.error("Market situation failed", err);
    } finally {
      setIsSituationLoading(false);
    }
  };

  React.useEffect(() => {
    if (analysis) {
      fetchChartData(analysis.symbol, isIntraday ? "5d" : (chartPeriod === "5d" ? "6mo" : chartPeriod), isIntraday ? "5m" : "1d");
    }
  }, [chartPeriod, isIntraday]);

  const analyzeStock = async (symbol?: string) => {
    const target = symbol || ticker;
    if (!target.trim()) return;
    setIsAnalyzing(true);
    setError(null);
    setChartData(null);
    setChartSignals([]);
    try {
      const res = await api.post("/agents/stock/analyze", { 
        symbol: target.toUpperCase(),
        isIntraday: isIntraday 
      });
      const raw = res.data;

      const mapped: StockAnalysis = {
        symbol: raw.symbol,
        companyName: raw.companyName || raw.quote?.name || raw.symbol,
        currentPrice: raw.quote?.price || raw.currentPrice || 0,
        change: raw.quote?.change || raw.change || 0,
        changePercent: raw.quote?.changePercent || raw.changePercent || 0,
        technicalIndicators: {
          rsi: raw.technicalIndicators?.rsi || raw.indicators?.rsi || 0,
          macd: {
            value: raw.technicalIndicators?.macd?.macdLine || raw.indicators?.macd?.macdLine || raw.indicators?.macd?.value || 0,
            signal: raw.technicalIndicators?.macd?.signalLine || raw.indicators?.macd?.signalLine || raw.indicators?.macd?.signal || 0,
            histogram: raw.technicalIndicators?.macd?.histogram || raw.indicators?.macd?.histogram || 0,
          },
          ema20: raw.technicalIndicators?.ema20 || raw.indicators?.ema20 || 0,
          sma50: raw.technicalIndicators?.sma50 || raw.indicators?.sma50 || 0,
          sma200: raw.technicalIndicators?.sma200 || raw.indicators?.sma200 || 0,
          bollingerBands: raw.technicalIndicators?.bollingerBands || raw.indicators?.bollingerBands || { upper: 0, middle: 0, lower: 0 },
          volume: raw.technicalIndicators?.volume || raw.volume || raw.quote?.volume || 0,
          avgVolume: raw.technicalIndicators?.avgVolume || raw.avgVolume || raw.quote?.avgVolume || 0,
        },
        scores: {
          buy: raw.scores?.buy || raw.tradingSignals?.buyScore || 0,
          sell: raw.scores?.sell || raw.tradingSignals?.sellScore || 0,
          hold: raw.scores?.hold || raw.tradingSignals?.holdScore || 0,
          confidence: raw.scores?.confidence || raw.tradingSignals?.confidence || 0,
          risk: raw.scores?.risk || raw.tradingSignals?.riskLevel || 0,
        },
        recommendation: raw.recommendation || raw.tradingSignals?.recommendation || "HOLD",
        reasoning: raw.reasoning || raw.aiExplanation || raw.tradingSignals?.reasoning || "",
        sentimentSummary: raw.newsSentiment || (raw.tradingSignals?.signals ? raw.tradingSignals.signals.join("\n") : "") || "Neutral market sentiment detected.",
        supportLevels: raw.supportLevels || raw.tradingSignals?.supportLevels || [],
        resistanceLevels: raw.resistanceLevels || raw.tradingSignals?.resistanceLevels || [],
        stopLoss: raw.stopLoss || raw.tradingSignals?.stopLoss || 0,
        profitTarget: raw.profitTarget || raw.tradingSignals?.profitTarget || 0,
        analyzedAt: raw.analyzedAt || new Date().toISOString(),
      };

      setAnalysis(mapped);
      setTicker(mapped.symbol);
      await fetchChartData(mapped.symbol, isIntraday ? "5d" : (chartPeriod === "5d" ? "6mo" : chartPeriod), isIntraday ? "5m" : "1d");
    } catch (err: any) {
      setError(err.response?.data?.error || "Analysis failed. Verify ticker symbol and server health.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const addToWatchlist = async (symbol: string) => {
    try {
      await api.post("/agents/stock/watchlist", { symbol: symbol.toUpperCase(), name: symbol.toUpperCase() });
      loadWatchlist();
    } catch {}
  };

  const removeFromWatchlist = async (symbol: string) => {
    try {
      await api.delete(`/agents/stock/watchlist/${symbol}`);
      loadWatchlist();
    } catch {}
  };

  const addPortfolioItem = async () => {
    if (!portfolioSymbol || !portfolioShares || !portfolioPrice) return;
    try {
      await api.post("/agents/stock/portfolio", {
        symbol: portfolioSymbol.toUpperCase(),
        shares: parseFloat(portfolioShares),
        averagePrice: parseFloat(portfolioPrice),
      });
      setPortfolioSymbol("");
      setPortfolioShares("");
      setPortfolioPrice("");
      loadPortfolio();
    } catch {}
  };

  const getRecommendationStyle = (rec: string) => {
    switch (rec) {
      case "STRONG_BUY": return { bg: "bg-emerald-500/15", text: "text-emerald-400", border: "border-emerald-500/25", glow: "shadow-emerald-500/10" };
      case "BUY": return { bg: "bg-green-500/15", text: "text-green-400", border: "border-green-500/25", glow: "shadow-green-500/10" };
      case "HOLD": return { bg: "bg-amber-500/15", text: "text-amber-400", border: "border-amber-500/25", glow: "shadow-amber-500/10" };
      case "SELL": return { bg: "bg-orange-500/15", text: "text-orange-400", border: "border-orange-500/25", glow: "shadow-orange-500/10" };
      case "STRONG_SELL": return { bg: "bg-rose-500/15", text: "text-rose-400", border: "border-rose-500/25", glow: "shadow-rose-500/10" };
      default: return { bg: "bg-zinc-500/15", text: "text-zinc-400", border: "border-zinc-500/25", glow: "" };
    }
  };

  const recStyle = analysis ? getRecommendationStyle(analysis.recommendation) : null;

  return (
    <div className="space-y-6 stock-intelligence-page">
      {/* ═══ Page Header ═══ */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-emerald-600/20 via-cyan-600/15 to-indigo-600/10 border border-emerald-500/20 shadow-lg shadow-emerald-500/5">
              <TrendingUp className="h-6 w-6 text-emerald-400" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-white">
                Stock Intelligence
              </h1>
              <p className="text-zinc-500 text-sm mt-0.5">
                AI-powered quantitative analysis for Stocks, Crypto & Forex
              </p>
            </div>
          </div>
        </div>
        {/* Intraday Toggle — elevated to header for visibility */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsIntraday(!isIntraday)}
            className={`group flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-300 border ${
              isIntraday
                ? "bg-emerald-500/15 border-emerald-500/30 text-emerald-400 shadow-lg shadow-emerald-500/10"
                : "bg-white/[0.03] border-white/10 text-zinc-400 hover:border-white/20 hover:text-zinc-300"
            }`}
          >
            <Clock className={`h-4 w-4 transition-colors ${isIntraday ? "text-emerald-400" : "text-zinc-500"}`} />
            <span>Intraday</span>
            <span className={`text-[10px] px-1.5 py-0.5 rounded-md font-bold ${
              isIntraday ? "bg-emerald-500/20 text-emerald-300" : "bg-white/5 text-zinc-500"
            }`}>
              5MIN
            </span>
          </button>
        </div>
      </div>

      {/* ═══ Search Bar ═══ */}
      <Card className="border border-white/[0.08] bg-zinc-950/50 backdrop-blur-xl">
        <CardContent className="p-4">
          <div className="flex gap-3 items-center">
            <div ref={suggestionsRef} className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
              <Input
                placeholder="Search by company name or symbol (e.g. Apple, Reliance, AAPL)..."
                value={ticker}
                onChange={(e) => {
                  setTicker(e.target.value);
                  setShowSuggestions(true);
                }}
                onFocus={() => ticker.trim().length >= 2 && setShowSuggestions(true)}
                onKeyDown={(e) => e.key === "Enter" && analyzeStock()}
                className="pl-10 bg-white/[0.03] border-white/[0.08] text-white placeholder:text-zinc-600 h-12 font-mono text-sm tracking-wide rounded-xl focus:border-emerald-500/40 focus:ring-emerald-500/20"
              />

              {/* Suggestions Dropdown */}
              {showSuggestions && (suggestions.length > 0 || isSearchingSuggestions) && (
                <div className="absolute left-0 right-0 top-[52px] z-50 rounded-xl border border-white/[0.08] bg-zinc-950/95 backdrop-blur-xl shadow-2xl overflow-hidden max-h-60 overflow-y-auto">
                  {isSearchingSuggestions && (
                    <div className="p-3 text-xs text-zinc-500 flex items-center gap-2 border-b border-white/[0.03]">
                      <Loader2 className="h-3.5 w-3.5 animate-spin text-emerald-400" />
                      Searching assets...
                    </div>
                  )}
                  {suggestions.map((item, idx) => (
                    <button
                      key={`${item.symbol}-${idx}`}
                      onClick={() => {
                        setTicker(item.symbol);
                        setShowSuggestions(false);
                        analyzeStock(item.symbol);
                      }}
                      className="w-full flex items-center justify-between px-4 py-3 text-left text-xs hover:bg-emerald-500/10 transition-colors border-b border-white/[0.03] last:border-0"
                    >
                      <div className="flex flex-col gap-0.5">
                        <span className="font-semibold text-white">{item.name}</span>
                        <span className="text-[10px] text-zinc-500">{item.exchange} · {item.type}</span>
                      </div>
                      <Badge variant="outline" className="border-emerald-500/25 text-emerald-400 font-mono font-bold text-[10px]">
                        {item.symbol}
                      </Badge>
                    </button>
                  ))}
                </div>
              )}
            </div>
            <Button
              onClick={() => analyzeStock()}
              disabled={isAnalyzing || !ticker.trim()}
              className="bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white px-7 h-12 shadow-lg shadow-emerald-600/20 font-semibold rounded-xl transition-all hover:shadow-emerald-500/30 disabled:opacity-40"
            >
              {isAnalyzing ? (
                <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Analyzing</>
              ) : (
                <><Brain className="h-4 w-4 mr-2" /> Analyze</>
              )}
            </Button>
          </div>

          {/* Quick Assets */}
          <div className="flex flex-wrap items-center gap-2 mt-3.5 pt-3.5 border-t border-white/[0.04]">
            <span className="text-zinc-500 font-bold uppercase tracking-widest text-[10px] mr-1">Popular Markets:</span>
            {[
              { symbol: "RELIANCE.NS", label: "Reliance" },
              { symbol: "TMCV.NS", label: "Tata Motors" },
              { symbol: "SBIN.NS", label: "SBI" },
              { symbol: "HDFCBANK.NS", label: "HDFC Bank" },
              { symbol: "INFY.NS", label: "Infosys" },
              { symbol: "ETERNAL.NS", label: "Zomato" },
              { symbol: "PAYTM.NS", label: "Paytm" },
              { symbol: "^NSEI", label: "Nifty 50" },
              { symbol: "AAPL", label: "Apple" },
              { symbol: "NVDA", label: "NVIDIA" },
              { symbol: "TSLA", label: "Tesla" },
              { symbol: "BTC-USD", label: "Bitcoin" },
            ].map((item) => (
              <button
                key={item.symbol}
                onClick={() => { setTicker(item.symbol); analyzeStock(item.symbol); }}
                className="text-[11px] font-mono px-2.5 py-1 rounded-lg bg-white/[0.03] hover:bg-emerald-500/15 border border-white/[0.06] hover:border-emerald-500/30 text-zinc-400 hover:text-emerald-300 transition-all font-medium"
              >
                {item.label} <span className="text-[9px] text-zinc-600 font-normal">({item.symbol})</span>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Error Alert */}
      <AnimatePresence>
        {error && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
            <Card className="border border-rose-500/25 bg-rose-500/[0.08] backdrop-blur">
              <CardContent className="p-4 flex items-center gap-3">
                <AlertTriangle className="h-5 w-5 text-rose-400 shrink-0" />
                <p className="text-sm text-rose-300">{error}</p>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ═══ Tab Navigation ═══ */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="bg-zinc-900/40 border border-white/[0.06] p-1 rounded-xl w-full overflow-x-auto scrollbar-none flex justify-start sm:justify-center min-w-0">
          <TabsTrigger value="analyze" className="data-[state=active]:bg-white/10 data-[state=active]:text-white text-zinc-500 rounded-lg gap-2">
            <Activity className="h-4 w-4" /> Analysis
          </TabsTrigger>
          <TabsTrigger value="watchlist" className="data-[state=active]:bg-white/10 data-[state=active]:text-white text-zinc-500 rounded-lg gap-2">
            <Eye className="h-4 w-4" /> Watchlist <span className="text-[10px] ml-0.5 opacity-60">({watchlist.length})</span>
          </TabsTrigger>
          <TabsTrigger value="portfolio" className="data-[state=active]:bg-white/10 data-[state=active]:text-white text-zinc-500 rounded-lg gap-2">
            <DollarSign className="h-4 w-4" /> Portfolio
          </TabsTrigger>
          <TabsTrigger value="practice" className="data-[state=active]:bg-emerald-600 data-[state=active]:text-white text-zinc-500 rounded-lg gap-2">
            <Zap className="h-4 w-4" /> Practice
          </TabsTrigger>
        </TabsList>

        {/* ═══ ANALYSIS TAB ═══ */}
        <TabsContent value="analyze" className="space-y-6">
          <AnimatePresence mode="wait">
            {/* Loading State */}
            {isAnalyzing && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col items-center justify-center py-24 gap-5"
              >
                <div className="relative">
                  <div className="w-20 h-20 rounded-full border-2 border-emerald-500/20 border-t-emerald-400 animate-spin" />
                  <div className="absolute inset-0 w-20 h-20 rounded-full border-2 border-transparent border-b-cyan-400/40 animate-spin" style={{ animationDuration: '1.5s', animationDirection: 'reverse' }} />
                  <Brain className="absolute inset-0 m-auto h-7 w-7 text-emerald-400" />
                </div>
                <div className="text-center">
                  <p className="text-sm text-zinc-300 font-medium">Analyzing <span className="text-emerald-400 font-bold">{ticker}</span></p>
                  <p className="text-xs text-zinc-600 mt-1">Computing RSI, MACD, EMA, Bollinger Bands & AI sentiment</p>
                </div>
              </motion.div>
            )}

            {/* ═══ Analysis Results ═══ */}
            {!isAnalyzing && analysis && (
              <motion.div
                key={analysis.symbol}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="space-y-5"
              >
                {/* ─── Price Header Card ─── */}
                <Card className="border border-white/[0.08] bg-zinc-950/50 backdrop-blur-xl overflow-hidden relative">
                  <div className="absolute -top-20 -right-20 w-60 h-60 bg-emerald-500/[0.04] rounded-full blur-3xl pointer-events-none" />
                  <div className="absolute -bottom-20 -left-20 w-40 h-40 bg-cyan-500/[0.03] rounded-full blur-3xl pointer-events-none" />
                  <CardContent className="p-6 relative z-10">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-5">
                      {/* Left: Symbol & Company */}
                      <div className="space-y-2">
                        <div className="flex items-center gap-3">
                          <h2 className="text-3xl font-extrabold text-white tracking-tight">{analysis.symbol}</h2>
                          {recStyle && (
                            <Badge className={`${recStyle.bg} ${recStyle.text} ${recStyle.border} border text-xs font-bold px-2.5 py-1 shadow-md ${recStyle.glow}`}>
                              {analysis.recommendation.replace("_", " ")}
                            </Badge>
                          )}
                          {isIntraday && (
                            <Badge className="bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 text-[10px] font-bold">
                              INTRADAY
                            </Badge>
                          )}
                        </div>
                        <p className="text-zinc-500 text-sm">{analysis.companyName}</p>
                        <div className="flex gap-2 mt-1">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => addToWatchlist(analysis.symbol)}
                            className="border-white/[0.08] text-zinc-400 hover:bg-white/5 hover:text-white text-xs h-8 rounded-lg"
                          >
                            <Star className="h-3 w-3 mr-1.5" /> Watchlist
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => analyzeStock(analysis.symbol)}
                            className="border-white/[0.08] text-zinc-400 hover:bg-white/5 hover:text-white text-xs h-8 rounded-lg"
                          >
                            <RefreshCw className="h-3 w-3 mr-1.5" /> Refresh
                          </Button>
                        </div>
                      </div>

                      {/* Right: Price */}
                      <div className="text-right space-y-1">
                        <div className="text-4xl font-extrabold text-white font-mono tabular-nums tracking-tight">
                          ${analysis.currentPrice.toFixed(2)}
                        </div>
                        <div className={`flex items-center justify-end gap-1.5 text-sm font-semibold ${analysis.change >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
                          {analysis.change >= 0 ? <ArrowUpRight className="h-4 w-4" /> : <ArrowDownRight className="h-4 w-4" />}
                          {analysis.change >= 0 ? "+" : ""}{analysis.change.toFixed(2)} ({analysis.changePercent.toFixed(2)}%)
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* ─── Signal + Levels Row ─── */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Quant Signal */}
                  <Card className={`border ${recStyle?.border} bg-zinc-950/50 backdrop-blur-xl relative overflow-hidden group hover:shadow-lg transition-shadow`}>
                    <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/[0.03] to-transparent pointer-events-none" />
                    <CardContent className="p-5 relative z-10">
                      <div className="flex items-center gap-2 mb-3">
                        <Shield className="h-4 w-4 text-zinc-500" />
                        <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Quant Signal</span>
                      </div>
                      <div className={`text-2xl font-extrabold tracking-tight mb-3 ${recStyle?.text}`}>
                        {analysis.recommendation.replace("_", " ")}
                      </div>
                      <div className="space-y-1.5">
                        <div className="flex justify-between items-center text-xs">
                          <span className="text-zinc-500">Confidence</span>
                          <span className="font-bold text-white tabular-nums">{analysis.scores.confidence}%</span>
                        </div>
                        <div className="h-1.5 bg-white/[0.04] rounded-full overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${analysis.scores.confidence}%` }}
                            transition={{ duration: 1.2, ease: "easeOut" }}
                            className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-violet-500"
                            style={{ boxShadow: '0 0 10px rgba(99,102,241,0.3)' }}
                          />
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Stop Loss */}
                  <Card className="border border-rose-500/15 bg-zinc-950/50 backdrop-blur-xl relative overflow-hidden group hover:shadow-lg transition-shadow">
                    <div className="absolute inset-0 bg-gradient-to-br from-rose-500/[0.03] to-transparent pointer-events-none" />
                    <CardContent className="p-5 relative z-10">
                      <div className="flex items-center gap-2 mb-3">
                        <TrendingDown className="h-4 w-4 text-rose-500/60" />
                        <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Stop Loss</span>
                      </div>
                      <div className="text-2xl font-extrabold tracking-tight text-rose-400 font-mono tabular-nums">
                        ${analysis.stopLoss.toFixed(2)}
                      </div>
                      <p className="text-[11px] text-zinc-600 mt-2 leading-relaxed">
                        Exit below this level to limit downside risk based on ATR volatility.
                      </p>
                    </CardContent>
                  </Card>

                  {/* Profit Target */}
                  <Card className="border border-emerald-500/15 bg-zinc-950/50 backdrop-blur-xl relative overflow-hidden group hover:shadow-lg transition-shadow">
                    <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/[0.03] to-transparent pointer-events-none" />
                    <CardContent className="p-5 relative z-10">
                      <div className="flex items-center gap-2 mb-3">
                        <Target className="h-4 w-4 text-emerald-500/60" />
                        <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Profit Target</span>
                      </div>
                      <div className="text-2xl font-extrabold tracking-tight text-emerald-400 font-mono tabular-nums">
                        ${analysis.profitTarget.toFixed(2)}
                      </div>
                      <p className="text-[11px] text-zinc-600 mt-2 leading-relaxed">
                        Target exit for optimal risk/reward ratio of ~1:1.5.
                      </p>
                    </CardContent>
                  </Card>
                </div>

                {/* ─── Score Gauges ─── */}
                <Card className="border border-white/[0.06] bg-zinc-950/40 backdrop-blur-xl">
                  <CardContent className="py-5 px-6">
                    <div className="flex items-center justify-around flex-wrap gap-6">
                      {[
                        { label: "Buy", value: analysis.scores.buy, color: "#10b981" },
                        { label: "Sell", value: analysis.scores.sell, color: "#ef4444" },
                        { label: "Hold", value: analysis.scores.hold, color: "#f59e0b" },
                        { label: "Confidence", value: analysis.scores.confidence, color: "#6366f1" },
                        { label: "Risk", value: analysis.scores.risk, color: "#f97316" },
                      ].map((gauge, idx) => (
                        <motion.div
                          key={gauge.label}
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ duration: 0.4, delay: idx * 0.1, ease: "easeOut" }}
                        >
                          <ScoreGauge label={gauge.label} value={gauge.value} color={gauge.color} />
                        </motion.div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* ─── Candlestick Chart + Market Situation ─── */}
                <div className="flex flex-col lg:flex-row gap-5">
                  <Card className="border border-white/[0.06] bg-zinc-950/40 backdrop-blur-xl flex-1 min-w-0">
                    <CardHeader className="pb-3 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 space-y-0">
                      <CardTitle className="text-base font-semibold text-white flex items-center gap-2">
                        <LineChart className="h-5 w-5 text-emerald-400" /> Price Chart
                        <div className="flex items-center gap-1.5 ml-2.5">
                          <button
                            onClick={() => handleQuickTrade("buy")}
                            className="w-6.5 h-6.5 bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-[10px] font-extrabold rounded-md text-white transition-all shadow shadow-emerald-600/25 cursor-pointer flex items-center justify-center border border-emerald-500/20"
                            title="Quick Buy Order"
                          >
                            B
                          </button>
                          <button
                            onClick={() => handleQuickTrade("sell")}
                            className="w-6.5 h-6.5 bg-rose-600 hover:bg-rose-500 active:scale-95 text-[10px] font-extrabold rounded-md text-white transition-all shadow shadow-rose-600/25 cursor-pointer flex items-center justify-center border border-rose-500/20"
                            title="Quick Sell Order"
                          >
                            S
                          </button>
                        </div>
                      </CardTitle>
                      <div className="flex items-center gap-2.5 self-end md:self-auto">
                        <Button
                          size="sm"
                          onClick={() => fetchMarketSituation(analysis.symbol)}
                          className={`text-xs h-8 rounded-lg transition-all ${
                            isSituationOpen
                              ? "bg-violet-600 hover:bg-violet-500 text-white shadow-lg shadow-violet-600/20"
                              : "bg-white/[0.04] border border-violet-500/25 text-violet-400 hover:bg-violet-500/10"
                          }`}
                        >
                          <Zap className="h-3.5 w-3.5 mr-1.5" />
                          {isSituationOpen ? "Refresh" : "Market Situation"}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setIsRefreshDialogOpen(true)}
                          className={`text-xs h-8 rounded-lg transition-all ${
                            isAutoRefreshEnabled
                              ? "border-emerald-500/30 text-emerald-400 bg-emerald-500/5 hover:bg-emerald-500/10 shadow-lg shadow-emerald-500/5"
                              : "bg-white/[0.04] border-white/[0.08] text-zinc-400 hover:bg-white/5 hover:text-zinc-300"
                          }`}
                        >
                          <Clock className={`h-3.5 w-3.5 mr-1.5 ${isAutoRefreshEnabled ? "animate-pulse" : ""}`} />
                          {isAutoRefreshEnabled ? `Auto: ${Math.floor(refreshTimeLeft / 60)}m ${refreshTimeLeft % 60}s` : "Auto-Refresh"}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setTimezoneMode(prev => prev === "exchange" ? "local" : "exchange")}
                          className="bg-white/[0.04] border-white/[0.08] text-zinc-400 hover:bg-white/5 hover:text-zinc-300 text-xs h-8 rounded-lg font-medium flex items-center gap-1.5"
                          title="Toggle timezone display mode"
                        >
                          <Globe className="h-3.5 w-3.5" />
                          <span>{timezoneMode === "exchange" ? `Exchange` : `Local`} ({tzName})</span>
                        </Button>
                        {!isIntraday ? (
                          <div className="flex bg-white/[0.03] rounded-lg p-0.5 border border-white/[0.05]">
                            {(["1mo", "3mo", "6mo", "1y"] as const).map((period) => (
                              <button
                                key={period}
                                onClick={() => setChartPeriod(period)}
                                className={`px-3 py-1.5 text-[11px] font-semibold rounded-md transition-all ${
                                  chartPeriod === period
                                    ? "bg-emerald-600 text-white shadow-md shadow-emerald-600/20"
                                    : "text-zinc-500 hover:text-zinc-300"
                                }`}
                              >
                                {period.toUpperCase()}
                              </button>
                            ))}
                          </div>
                        ) : (
                          <Badge variant="outline" className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2.5 py-1.5 text-[11px] font-bold">
                            5D · 5M
                          </Badge>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent className="pt-0">
                      {chartData ? (
                        <CandlestickChart
                          data={chartData}
                          symbol={analysis.symbol}
                          stopLoss={analysis.stopLoss}
                          profitTarget={analysis.profitTarget}
                          supportLevels={analysis.supportLevels}
                          resistanceLevels={analysis.resistanceLevels}
                          signals={chartSignals}
                          liveQuote={liveQuote}
                          timezoneMode={timezoneMode}
                          avgPrice={avgCostForChart}
                        />
                      ) : (
                        <div className="w-full h-[440px] flex items-center justify-center text-zinc-600">
                          <Loader2 className="h-5 w-5 animate-spin mr-2" /> Loading chart...
                        </div>
                      )}
                      {/* Chart Legend */}
                      <div className="flex flex-wrap gap-x-5 gap-y-1.5 mt-3 justify-center text-[11px] text-zinc-500">
                        <span className="flex items-center gap-1.5"><span className="w-3 h-0.5 border-t border-dashed border-rose-500 inline-block" /> Stop Loss</span>
                        <span className="flex items-center gap-1.5"><span className="w-3 h-0.5 border-t border-dashed border-emerald-500 inline-block" /> Profit Target</span>
                        <span className="flex items-center gap-1.5"><span className="w-3 h-0.5 border-t border-dotted border-cyan-500 inline-block" /> Support</span>
                        <span className="flex items-center gap-1.5"><span className="w-3 h-0.5 border-t border-dotted border-amber-500 inline-block" /> Resistance</span>
                        <span className="flex items-center gap-1.5"><svg width="10" height="10" viewBox="0 0 12 12"><polygon points="6,0 12,12 0,12" fill="#10b981" /></svg> Buy</span>
                        <span className="flex items-center gap-1.5"><svg width="10" height="10" viewBox="0 0 12 12"><polygon points="6,12 12,0 0,0" fill="#ef4444" /></svg> Sell</span>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Market Situation Side Panel */}
                  {isSituationOpen && (
                    <MarketSituationPanel
                      situation={situationData}
                      isLoading={isSituationLoading}
                      isOpen={isSituationOpen}
                      onClose={() => setIsSituationOpen(false)}
                      spotPrice={analysis.currentPrice}
                      symbol={analysis.symbol}
                    />
                  )}
                </div>

                {/* ─── Technical Indicators + AI Reasoning ─── */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                  {/* Technical Indicators */}
                  <Card className="border border-white/[0.06] bg-zinc-950/40 backdrop-blur-xl">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base font-semibold text-white flex items-center gap-2">
                        <BarChart3 className="h-5 w-5 text-cyan-400" /> Technical Indicators
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3.5">
                      <IndicatorBar label="RSI (14)" value={analysis.technicalIndicators.rsi} min={0} max={100} />
                      <IndicatorBar label="EMA (20)" value={analysis.technicalIndicators.ema20} min={analysis.currentPrice * 0.8} max={analysis.currentPrice * 1.2} />
                      <IndicatorBar label="SMA (50)" value={analysis.technicalIndicators.sma50} min={analysis.currentPrice * 0.8} max={analysis.currentPrice * 1.2} />
                      <IndicatorBar label="SMA (200)" value={analysis.technicalIndicators.sma200} min={analysis.currentPrice * 0.7} max={analysis.currentPrice * 1.3} />

                      <div className="pt-3 border-t border-white/[0.04] space-y-2.5">
                        {[
                          { label: "MACD", value: analysis.technicalIndicators.macd.value, colored: true, histogram: analysis.technicalIndicators.macd.histogram },
                          { label: "MACD Signal", value: analysis.technicalIndicators.macd.signal },
                          { label: "Bollinger Upper", value: analysis.technicalIndicators.bollingerBands.upper, prefix: "$" },
                          { label: "Bollinger Lower", value: analysis.technicalIndicators.bollingerBands.lower, prefix: "$" },
                          { label: "Volume", value: analysis.technicalIndicators.volume / 1e6, suffix: "M" },
                        ].map((item, i) => (
                          <div key={i} className="flex justify-between items-center text-sm">
                            <span className="text-zinc-500 font-medium">{item.label}</span>
                            <span className={`font-mono font-semibold tabular-nums ${
                              item.colored ? ((item.histogram || 0) > 0 ? "text-emerald-400" : "text-rose-400") : "text-white"
                            }`}>
                              {item.prefix || ""}{item.value.toFixed(2)}{item.suffix || ""}
                            </span>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  {/* AI Reasoning */}
                  <Card className="border border-white/[0.06] bg-zinc-950/40 backdrop-blur-xl">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base font-semibold text-white flex items-center gap-2">
                        <Brain className="h-5 w-5 text-violet-400" /> AI Analysis
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="p-4 bg-violet-500/[0.04] rounded-xl border border-violet-500/10">
                        <h4 className="text-xs font-bold text-violet-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                          <Sparkles className="h-3.5 w-3.5" /> Sentiment
                        </h4>
                        <p className="text-sm text-zinc-300 leading-relaxed whitespace-pre-wrap">{analysis.sentimentSummary}</p>
                      </div>
                      <div className="p-4 bg-cyan-500/[0.04] rounded-xl border border-cyan-500/10">
                        <h4 className="text-xs font-bold text-cyan-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                          <Crosshair className="h-3.5 w-3.5" /> Detailed Analysis
                        </h4>
                        <p className="text-sm text-zinc-300 leading-relaxed whitespace-pre-wrap">{analysis.reasoning}</p>
                      </div>

                      {/* Support / Resistance */}
                      <div className="grid grid-cols-2 gap-3">
                        <div className="p-3.5 bg-emerald-500/[0.04] rounded-xl border border-emerald-500/10">
                          <h5 className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider mb-2">Support Levels</h5>
                          {analysis.supportLevels.length === 0 ? (
                            <div className="text-xs text-zinc-600 font-mono">None detected</div>
                          ) : (
                            analysis.supportLevels.map((s, i) => (
                              <div key={i} className="text-sm font-mono font-semibold text-emerald-300 tabular-nums">${s.toFixed(2)}</div>
                            ))
                          )}
                        </div>
                        <div className="p-3.5 bg-rose-500/[0.04] rounded-xl border border-rose-500/10">
                          <h5 className="text-[10px] font-bold text-rose-400 uppercase tracking-wider mb-2">Resistance Levels</h5>
                          {analysis.resistanceLevels.length === 0 ? (
                            <div className="text-xs text-zinc-600 font-mono">None detected</div>
                          ) : (
                            analysis.resistanceLevels.map((r, i) => (
                              <div key={i} className="text-sm font-mono font-semibold text-rose-300 tabular-nums">${r.toFixed(2)}</div>
                            ))
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </motion.div>
            )}

            {/* ═══ Empty State ═══ */}
            {!isAnalyzing && !analysis && !error && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col items-center justify-center py-16 gap-6">
                <div className="relative">
                  <div className="absolute inset-0 bg-emerald-500/10 rounded-full blur-2xl scale-150" />
                  <div className="relative p-5 rounded-2xl bg-gradient-to-br from-emerald-500/15 to-cyan-500/10 border border-emerald-500/20 shadow-xl shadow-emerald-500/5">
                    <TrendingUp className="h-10 w-10 text-emerald-400" />
                  </div>
                </div>
                <div className="text-center space-y-2">
                  <h3 className="text-xl font-bold text-white">Start Analyzing</h3>
                  <p className="text-sm text-zinc-500 max-w-md leading-relaxed">
                    Enter any ticker symbol above to get AI-powered analysis with real-time technical indicators, buy/sell signals, and chart patterns.
                  </p>
                </div>

                {/* Quick Start Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full max-w-xl mt-2">
                  {[
                    { title: "Stocks", textColor: "text-emerald-400", symbols: ["AAPL", "TSLA", "NVDA", "MSFT"] },
                    { title: "Crypto", textColor: "text-violet-400", symbols: ["BTC-USD", "ETH-USD", "SOL-USD", "ADA-USD"] },
                    { title: "Forex", textColor: "text-cyan-400", symbols: ["EURUSD=X", "GBPUSD=X", "USDJPY=X", "AUDUSD=X"] },
                  ].map((cat) => (
                    <div key={cat.title} className="p-4 rounded-xl border border-white/[0.05] bg-zinc-950/30 space-y-2.5">
                      <span className={`text-[10px] font-bold uppercase tracking-widest ${cat.textColor}`}>{cat.title}</span>
                      <div className="flex flex-wrap gap-1.5">
                        {cat.symbols.map((sym) => (
                          <Button
                            key={sym}
                            size="sm"
                            variant="outline"
                            onClick={() => { setTicker(sym); analyzeStock(sym); }}
                            className="border-white/[0.06] text-zinc-400 hover:text-white hover:bg-white/5 text-[11px] font-semibold h-7 px-2.5 rounded-md"
                          >
                            {sym}
                          </Button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </TabsContent>

        {/* ═══ WATCHLIST TAB ═══ */}
        <TabsContent value="watchlist" className="space-y-4">
          <Card className="border border-white/[0.06] bg-zinc-950/40 backdrop-blur-xl">
            <CardHeader>
              <CardTitle className="text-base font-semibold text-white flex items-center gap-2">
                <Star className="h-5 w-5 text-amber-400" /> Your Watchlist
              </CardTitle>
              <CardDescription className="text-zinc-500 text-sm">Track stocks you&apos;re interested in. Click any ticker to analyze it.</CardDescription>
            </CardHeader>
            <CardContent>
              {watchlist.length === 0 ? (
                <div className="text-center py-12 text-zinc-600 text-sm">
                  <Eye className="h-8 w-8 mx-auto mb-3 text-zinc-700" />
                  Your watchlist is empty. Analyze a stock and add it.
                </div>
              ) : (
                <div className="space-y-2">
                  {watchlist.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between p-3.5 bg-white/[0.02] rounded-xl border border-white/[0.04] hover:bg-white/[0.05] transition-all group"
                    >
                      <button
                        onClick={() => { setTicker(item.symbol); setActiveTab("analyze"); analyzeStock(item.symbol); }}
                        className="flex items-center gap-3 text-left"
                      >
                        <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center font-bold text-emerald-400 text-sm border border-emerald-500/10">
                          {item.symbol.slice(0, 2)}
                        </div>
                        <div>
                          <div className="font-semibold text-white text-sm">{item.symbol}</div>
                          <div className="text-xs text-zinc-600">{item.name}</div>
                        </div>
                      </button>
                      <div className="flex items-center gap-1.5">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => { setTicker(item.symbol); setActiveTab("analyze"); analyzeStock(item.symbol); }}
                          className="text-zinc-500 hover:text-white h-8 w-8 p-0"
                        >
                          <Activity className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => removeFromWatchlist(item.symbol)}
                          className="text-zinc-600 hover:text-rose-400 opacity-0 group-hover:opacity-100 transition h-8 w-8 p-0"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ═══ PORTFOLIO TAB ═══ */}
        <TabsContent value="portfolio" className="space-y-4">
          <Card className="border border-white/[0.06] bg-zinc-950/40 backdrop-blur-xl">
            <CardHeader>
              <CardTitle className="text-base font-semibold text-white flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-emerald-400" /> Portfolio Tracker
              </CardTitle>
              <CardDescription className="text-zinc-500 text-sm">Track your positions, calculate P&L and total value.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Add position form */}
              <div className="flex flex-wrap gap-3 p-4 bg-white/[0.02] rounded-xl border border-white/[0.04]">
                <Input
                  placeholder="Symbol"
                  value={portfolioSymbol}
                  onChange={(e) => setPortfolioSymbol(e.target.value.toUpperCase())}
                  className="w-28 bg-white/[0.03] border-white/[0.08] text-white rounded-lg"
                />
                <Input
                  placeholder="Shares"
                  type="number"
                  value={portfolioShares}
                  onChange={(e) => setPortfolioShares(e.target.value)}
                  className="w-28 bg-white/[0.03] border-white/[0.08] text-white rounded-lg"
                />
                <Input
                  placeholder="Avg Price"
                  type="number"
                  value={portfolioPrice}
                  onChange={(e) => setPortfolioPrice(e.target.value)}
                  className="w-32 bg-white/[0.03] border-white/[0.08] text-white rounded-lg"
                />
                <Button onClick={addPortfolioItem} className="bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg">
                  <Plus className="h-4 w-4 mr-1" /> Add
                </Button>
              </div>

              {/* Portfolio list */}
              {portfolio.length === 0 ? (
                <div className="text-center py-12 text-zinc-600 text-sm">
                  <DollarSign className="h-8 w-8 mx-auto mb-3 text-zinc-700" />
                  No positions yet. Add your first stock position above.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-zinc-600 border-b border-white/[0.04]">
                        <th className="text-left pb-3 font-semibold text-xs uppercase tracking-wider">Symbol</th>
                        <th className="text-right pb-3 font-semibold text-xs uppercase tracking-wider">Shares</th>
                        <th className="text-right pb-3 font-semibold text-xs uppercase tracking-wider">Avg Price</th>
                        <th className="text-right pb-3 font-semibold text-xs uppercase tracking-wider">Total Cost</th>
                      </tr>
                    </thead>
                    <tbody className="text-white">
                      {portfolio.map((item) => (
                        <tr key={item.id} className="border-b border-white/[0.03] hover:bg-white/[0.02] transition">
                          <td className="py-3.5 font-semibold text-emerald-400">{item.symbol}</td>
                          <td className="py-3.5 text-right font-mono tabular-nums">{item.shares}</td>
                          <td className="py-3.5 text-right font-mono tabular-nums">${item.averagePrice.toFixed(2)}</td>
                          <td className="py-3.5 text-right font-mono tabular-nums">${(item.shares * item.averagePrice).toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ═══ PRACTICE TRADING TAB ═══ */}
        <TabsContent value="practice" className="space-y-6">
          <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 dark:bg-emerald-950/10 p-4 mb-4">
            <div className="flex items-center gap-2 mb-1">
              <Zap className="h-4 w-4 text-emerald-600 dark:text-emerald-400 practice-mode-icon" />
              <span className="font-semibold text-sm text-emerald-700 dark:text-emerald-300 practice-mode-title">Paper Trading Practice Mode</span>
              <Badge className="bg-emerald-500/10 dark:bg-emerald-600/20 text-emerald-700 dark:text-emerald-400 border-emerald-500/20 text-[10px] practice-mode-badge">Virtual</Badge>
            </div>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Practice trading with $100,000 in virtual funds. No real money involved — perfect for learning strategies, testing ideas, and building confidence before you invest real capital.
            </p>
          </div>
          <PaperTradingPanel 
            initialSymbol={analysis?.symbol} 
            initialSide={quickTradeSide} 
            onTradeExecuted={() => setTradeCount(c => c + 1)}
          />
        </TabsContent>
      </Tabs>

      {/* Auto-Refresh Configuration Dialog */}
      <Dialog open={isRefreshDialogOpen} onOpenChange={setIsRefreshDialogOpen}>
        <DialogContent className="max-w-sm border border-white/[0.08] bg-zinc-950/95 backdrop-blur-xl p-5 text-white">
          <DialogHeader>
            <DialogTitle className="text-base font-bold flex items-center gap-2">
              <Clock className="h-5 w-5 text-emerald-400" />
              Auto-Refresh Settings
            </DialogTitle>
            <DialogDescription className="text-zinc-400 text-xs">
              Automatically refresh stock price charts and quantitative analytics indicators at regular intervals.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-zinc-300">Enable Auto-Refresh</span>
              <Switch
                checked={isAutoRefreshEnabled}
                onCheckedChange={(val) => {
                  setIsAutoRefreshEnabled(val);
                  if (val) {
                    setRefreshTimeLeft(autoRefreshInterval);
                  }
                }}
              />
            </div>

            {isAutoRefreshEnabled && (
              <div className="space-y-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">Interval Rate</span>
                <div className="grid grid-cols-4 gap-2">
                  {[
                    { label: "1m", value: 60 },
                    { label: "5m", value: 300 },
                    { label: "10m", value: 600 },
                    { label: "30m", value: 1800 }
                  ].map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => {
                        setAutoRefreshInterval(opt.value);
                        setRefreshTimeLeft(opt.value);
                      }}
                      className={`py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                        autoRefreshInterval === opt.value
                          ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400 font-bold"
                          : "bg-white/[0.02] border-white/5 text-zinc-500 hover:text-zinc-300 hover:bg-white/5"
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {isAutoRefreshEnabled && (
              <div className="space-y-2 border-t border-white/5 pt-3">
                <div className="flex justify-between items-center text-xs font-mono">
                  <span className="text-zinc-500">Next Update In</span>
                  <span className="text-emerald-400 font-bold">
                    {Math.floor(refreshTimeLeft / 60)}m {refreshTimeLeft % 60}s
                  </span>
                </div>
                <div className="h-1 bg-white/[0.04] rounded-full overflow-hidden">
                  <div
                    className="h-full bg-emerald-500 transition-all duration-1000 ease-linear"
                    style={{ width: `${(refreshTimeLeft / autoRefreshInterval) * 100}%` }}
                  />
                </div>
              </div>
            )}
          </div>

          <DialogFooter className="flex gap-2 sm:justify-between items-center">
            <Button
              variant="ghost"
              onClick={() => setIsRefreshDialogOpen(false)}
              className="text-zinc-500 hover:text-zinc-300 hover:bg-white/5 h-8 text-xs font-semibold px-3"
            >
              Close
            </Button>
            <Button
              onClick={() => {
                triggerBackgroundRefresh();
                setRefreshTimeLeft(autoRefreshInterval);
              }}
              disabled={!analysis?.symbol}
              className="bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs h-8 px-3 rounded-lg flex items-center gap-1 shadow-lg shadow-emerald-600/25 disabled:opacity-40"
            >
              <RefreshCw className="h-3 w-3" />
              Refresh Now
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Floating Status Toast */}
      <AnimatePresence>
        {isToastVisible && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-4 py-3 bg-zinc-900/95 border border-emerald-500/20 text-emerald-400 rounded-xl shadow-2xl backdrop-blur text-xs font-semibold"
          >
            <RefreshCw className="h-3.5 w-3.5 animate-spin text-emerald-400" />
            <span>{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
