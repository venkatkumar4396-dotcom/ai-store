"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  BarChart3,
  History,
  ArrowUpRight,
  ArrowDownRight,
  Search,
  ShoppingCart,
  X,
  Wallet,
  Target,
  Percent,
  Activity,
  RefreshCw,
  Globe,
  ChevronDown,
  ChevronUp,
  Zap,
  LineChart,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Loader2,
  Info,
  Sparkles,
  Building2,
  IndianRupee,
  Play,
  Pause,
  Sliders,
  Brain,
  ShieldCheck,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/toaster";
import api from "@/lib/api";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

// ── Types ────────────────────────────────────────────────────────────────────

interface StockDef {
  symbol: string;
  name: string;
  sector: string;
  market: "US" | "IN";
}

interface LiveStock extends StockDef {
  price: number;
  change: number;
  changePercent: number;
  dayHigh: number;
  dayLow: number;
  volume: number;
  avgVolume: number;
  marketCap: number;
  pe: number;
  week52High: number;
  week52Low: number;
  currency: string;
  exchange: string;
  loaded: boolean;
}

interface Position {
  symbol: string;
  name: string;
  shares: number;
  avgCost: number;
  currentPrice: number;
  currency: string;
  market: "US" | "IN";
}

interface Trade {
  id: string;
  symbol: string;
  type: "buy" | "sell";
  shares: number;
  price: number;
  total: number;
  timestamp: string;
  currency: string;
}

interface Portfolio {
  cash: number;
  cashINR: number;
  positions: Position[];
  trades: Trade[];
  startingBalance: number;
  startingBalanceINR: number;
  winRate?: number;
  streak?: number;
}

interface Candle {
  time: number;          // unix ms
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

interface DrawingLine {
  id: string;
  x1: number; y1: number;
  x2: number; y2: number;
  color: string;
}

interface AISuggestion {
  signal: "BUY" | "SELL" | "HOLD";
  confidence: number;
  reasoning: string;
  pattern: string;
  sl: number;
  tp: number;
  level: "Beginner" | "Intermediate" | "Pro";
}

type OllamaStatus = "connecting" | "connected" | "error" | "idle";

interface SimulationLog {
  time: string;
  type: "info" | "buy" | "sell" | "success";
  message: string;
}

// ── Constants ─────────────────────────────────────────────────────────────────

const STARTING_BALANCE_USD = 100000;
const STARTING_BALANCE_INR = 500000;
const STORAGE_KEY = "nexora_paper_trading_v2";

const US_STOCKS: StockDef[] = [
  { symbol: "AAPL", name: "Apple Inc.", sector: "Technology", market: "US" },
  { symbol: "GOOGL", name: "Alphabet Inc.", sector: "Technology", market: "US" },
  { symbol: "MSFT", name: "Microsoft Corp.", sector: "Technology", market: "US" },
  { symbol: "AMZN", name: "Amazon.com Inc.", sector: "Consumer", market: "US" },
  { symbol: "TSLA", name: "Tesla Inc.", sector: "Automotive", market: "US" },
  { symbol: "NVDA", name: "NVIDIA Corp.", sector: "Technology", market: "US" },
  { symbol: "META", name: "Meta Platforms", sector: "Technology", market: "US" },
  { symbol: "NFLX", name: "Netflix Inc.", sector: "Entertainment", market: "US" },
];

const INDIA_STOCKS: StockDef[] = [
  { symbol: "RELIANCE.NS", name: "Reliance Industries", sector: "Conglomerate", market: "IN" },
  { symbol: "TCS.NS", name: "Tata Consultancy Services", sector: "Technology", market: "IN" },
  { symbol: "HDFCBANK.NS", name: "HDFC Bank", sector: "Finance", market: "IN" },
  { symbol: "INFY.NS", name: "Infosys", sector: "Technology", market: "IN" },
  { symbol: "TATAMOTORS.NS", name: "Tata Motors", sector: "Automotive", market: "IN" },
];

const ALL_STOCK_DEFS = [...US_STOCKS, ...INDIA_STOCKS];

function StockDetailPanel({ stock, onAnalyze, analyzing }: { stock: LiveStock; onAnalyze: () => void; analyzing: boolean }) {
  const currencySymbol = stock.currency === "INR" ? "₹" : "$";
  const volumeRatio = stock.avgVolume > 0 ? ((stock.volume / stock.avgVolume) * 100).toFixed(0) : "—";
  const week52Pos = stock.week52High - stock.week52Low > 0
    ? ((stock.price - stock.week52Low) / (stock.week52High - stock.week52Low) * 100).toFixed(0)
    : "50";

  return (
    <motion.div
      initial={{ height: 0, opacity: 0 }}
      animate={{ height: "auto", opacity: 1 }}
      exit={{ height: 0, opacity: 0 }}
      transition={{ duration: 0.3, ease: "easeInOut" }}
      className="overflow-hidden"
    >
      <div className="px-4 pb-4 pt-1">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-3">
          {[
            { label: "Day Range", value: `${currencySymbol}${stock.dayLow.toFixed(2)} - ${currencySymbol}${stock.dayHigh.toFixed(2)}` },
            { label: "Volume", value: formatCompactNumber(stock.volume), sub: `${volumeRatio}% of avg` },
            { label: "Market Cap", value: `${currencySymbol}${formatCompactNumber(stock.marketCap)}` },
            { label: "P/E Ratio", value: stock.pe > 0 ? stock.pe.toFixed(2) : "N/A" },
          ].map((item) => (
            <div key={item.label} className="bg-white/[0.02] rounded-lg p-2.5 border border-white/[0.04]">
              <span className="text-[10px] text-zinc-500 uppercase tracking-wide block">{item.label}</span>
              <span className="text-xs text-white font-semibold">{item.value}</span>
              {item.sub && <span className="text-[10px] text-zinc-500 block">{item.sub}</span>}
            </div>
          ))}
        </div>

        {/* 52-Week Range Bar */}
        <div className="bg-white/[0.02] rounded-lg p-3 border border-white/[0.04] mb-3">
          <div className="flex items-center justify-between text-[10px] text-zinc-500 mb-1.5">
            <span>52W Low: {currencySymbol}{stock.week52Low.toFixed(2)}</span>
            <span>52W High: {currencySymbol}{stock.week52High.toFixed(2)}</span>
          </div>
          <div className="relative h-2 bg-white/[0.06] rounded-full overflow-hidden">
            <div
              className="absolute top-0 left-0 h-full rounded-full bg-gradient-to-r from-rose-500 via-amber-400 to-emerald-500"
              style={{ width: `${week52Pos}%` }}
            />
            <div
              className="absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-white border-2 border-indigo-500 shadow-lg shadow-indigo-500/30"
              style={{ left: `calc(${week52Pos}% - 6px)` }}
            />
          </div>
        </div>

        {/* Analyze Button */}
        <Button
          onClick={onAnalyze}
          disabled={analyzing}
          className="w-full h-9 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white text-xs font-semibold shadow-lg shadow-indigo-600/20 transition-all"
        >
          {analyzing ? (
            <><Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" /> Analyzing...</>
          ) : (
            <><Sparkles className="h-3.5 w-3.5 mr-1.5" /> AI Stock Analysis</>
          )}
        </Button>
      </div>
    </motion.div>
  );
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function loadPortfolio(): Portfolio {
  if (typeof window === "undefined") return getDefaultPortfolio();
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed.winRate === undefined) parsed.winRate = 0;
      if (parsed.streak === undefined) parsed.streak = 0;
      return parsed;
    }
  } catch {}
  return getDefaultPortfolio();
}

function getDefaultPortfolio(): Portfolio {
  return {
    cash: STARTING_BALANCE_USD,
    cashINR: STARTING_BALANCE_INR,
    positions: [],
    trades: [],
    startingBalance: STARTING_BALANCE_USD,
    startingBalanceINR: STARTING_BALANCE_INR,
    winRate: 0,
    streak: 0,
  };
}

function savePortfolio(portfolio: Portfolio) {
  if (typeof window !== "undefined") {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(portfolio));
  }
}

const fmt = (n: number, d = 2) => n.toFixed(d);

function formatCompactNumber(num: number): string {
  if (num >= 1e12) return `${(num / 1e12).toFixed(2)}T`;
  if (num >= 1e9) return `${(num / 1e9).toFixed(2)}B`;
  if (num >= 1e6) return `${(num / 1e6).toFixed(2)}M`;
  if (num >= 1e3) return `${(num / 1e3).toFixed(1)}K`;
  return num.toLocaleString();
}

function formatCurrency(value: number, currency: string = "USD"): string {
  if (currency === "INR") return `₹${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  return `$${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function calcEMA(data: number[], period: number): number[] {
  if (data.length === 0) return [];
  const k = 2 / (period + 1);
  const ema: number[] = [data[0]];
  for (let i = 1; i < data.length; i++) {
    ema.push(data[i] * k + ema[i - 1] * (1 - k));
  }
  return ema;
}

function calcRSI(closes: number[], period = 14): number[] {
  if (closes.length <= period) return new Array(closes.length).fill(50);
  const rsi: number[] = new Array(period).fill(50);
  let gains = 0, losses = 0;
  for (let i = 1; i <= period; i++) {
    const d = closes[i] - closes[i - 1];
    if (d > 0) gains += d; else losses -= d;
  }
  let avgGain = gains / period, avgLoss = losses / period;
  rsi.push(avgLoss === 0 ? 100 : 100 - 100 / (1 + avgGain / avgLoss));
  for (let i = period + 1; i < closes.length; i++) {
    const d = closes[i] - closes[i - 1];
    avgGain = (avgGain * (period - 1) + Math.max(d, 0)) / period;
    avgLoss = (avgLoss * (period - 1) + Math.max(-d, 0)) / period;
    rsi.push(avgLoss === 0 ? 100 : 100 - 100 / (1 + avgGain / avgLoss));
  }
  return rsi;
}

async function askOllama(
  prompt: string,
  model = "llama3",
  ollamaUrl = "http://localhost:11434"
): Promise<string> {
  const res = await fetch(`${ollamaUrl}/api/generate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ model, prompt, stream: false }),
  });
  if (!res.ok) throw new Error(`Ollama error ${res.status}`);
  const json = await res.json();
  return json.response ?? "";
}

// ── Main Component ─────────────────────────────────────────────────────────────

interface PaperTradingPanelProps {
  initialSymbol?: string;
  initialSide?: "buy" | "sell";
  onTradeExecuted?: () => void;
}

export function PaperTradingPanel({ initialSymbol, initialSide, onTradeExecuted }: PaperTradingPanelProps) {
  const { addToast } = useToast();
  const [portfolio, setPortfolio] = React.useState<Portfolio>(getDefaultPortfolio());
  const [searchQuery, setSearchQuery] = React.useState("");
  const [selectedStock, setSelectedStock] = React.useState<LiveStock | null>(null);
  const [orderType, setOrderType] = React.useState<"buy" | "sell">("buy");
  const [shares, setShares] = React.useState<string>("10");
  const [activeTab, setActiveTab] = React.useState<"trade" | "positions" | "history">("trade");
  const [marketTab, setMarketTab] = React.useState<"US" | "IN">("US");
  const [liveStocks, setLiveStocks] = React.useState<Record<string, LiveStock>>({});
  const [loading, setLoading] = React.useState(true);
  const [refreshing, setRefreshing] = React.useState(false);
  const [expandedSymbol, setExpandedSymbol] = React.useState<string | null>(null);
  const [analyzingSymbol, setAnalyzingSymbol] = React.useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = React.useState<Date | null>(null);

  // SVG Chart states
  const [candles, setCandles] = React.useState<Candle[]>([]);
  const [allHistoricalCandles, setAllHistoricalCandles] = React.useState<Candle[]>([]);
  const [futureCandles, setFutureCandles] = React.useState<Candle[]>([]);
  const [offset, setOffset] = React.useState(0);
  const [zoom, setZoom] = React.useState(60);
  const [showEMA, setShowEMA] = React.useState(true);
  const [showRSI, setShowRSI] = React.useState(true);
  const [showVol, setShowVol] = React.useState(true);
  const [loadingChart, setLoadingChart] = React.useState(false);
  const [chartInterval, setChartInterval] = React.useState<"5m" | "15m" | "1h" | "1d">("1d");
  const [chartPeriod, setChartPeriod] = React.useState<"5d" | "1mo" | "3mo" | "6mo" | "1y">("6mo");

  const handleChangeInterval = (newInterval: "5m" | "15m" | "1h" | "1d") => {
    setChartInterval(newInterval);
    if (newInterval === "5m" || newInterval === "15m") {
      setChartPeriod("5d");
    } else if (newInterval === "1h") {
      setChartPeriod("1mo");
    } else {
      setChartPeriod("6mo");
    }
  };

  // Drawing tools
  const [drawings, setDrawings] = React.useState<DrawingLine[]>([]);
  const [drawMode, setDrawMode] = React.useState(false);
  const [drawStart, setDrawStart] = React.useState<{ x: number; y: number } | null>(null);
  const [drawColor, setDrawColor] = React.useState("#f59e0b");
  const [crosshair, setCrosshair] = React.useState<{ x: number; y: number } | null>(null);

  // AI states
  const [suggestion, setSuggestion] = React.useState<AISuggestion | null>(null);
  const [aiLoading, setAiLoading] = React.useState(false);
  const [aiChat, setAiChat] = React.useState<{ role: "user" | "ai"; text: string }[]>([]);
  const [chatInput, setChatInput] = React.useState("");
  const [ollamaUrl, setOllamaUrl] = React.useState("http://localhost:11434");
  const [ollamaModel, setOllamaModel] = React.useState("llama3");
  const [ollamaStatus, setOllamaStatus] = React.useState<OllamaStatus>("idle");
  const [showSettings, setShowSettings] = React.useState(false);
  const [traderLevel, setTraderLevel] = React.useState<"Beginner" | "Intermediate" | "Pro">("Beginner");

  // Replay Simulator States
  const [isSimulating, setIsSimulating] = React.useState(false);
  const [simulationSpeed, setSimulationSpeed] = React.useState(1.5); // seconds per tick
  const [simulatedPrice, setSimulatedPrice] = React.useState<number | null>(null);
  const [simulatedChange, setSimulatedChange] = React.useState(0);

  // Auto-Pilot States
  const [isAutoPilotActive, setIsAutoPilotActive] = React.useState(false);
  const [autopilotLogs, setAutopilotLogs] = React.useState<SimulationLog[]>([
    { time: new Date().toLocaleTimeString(), type: "info", message: "AI Trading Co-pilot initialized and waiting..." }
  ]);

  // Order Confirmation Permission Dialog State
  const [isPermissionDialogOpen, setIsPermissionDialogOpen] = React.useState(false);
  const [permissionSliderVal, setPermissionSliderVal] = React.useState(0);
  const [pendingOrderDetails, setPendingOrderDetails] = React.useState<{
    side: "buy" | "sell";
    shares: number;
    price: number;
    total: number;
    currency: string;
  } | null>(null);

  const svgRef = React.useRef<SVGSVGElement>(null);
  const chatRef = React.useRef<HTMLDivElement>(null);
  const chartContainerRef = React.useRef<HTMLDivElement>(null);

  // ═══════════ INITIAL LOAD AND WATCHLISTS ═══════════

  React.useEffect(() => {
    setPortfolio(loadPortfolio());
    checkOllamaConnection();
  }, []);

  async function checkOllamaConnection() {
    setOllamaStatus("connecting");
    try {
      const r = await fetch(`${ollamaUrl}/api/tags`);
      setOllamaStatus(r.ok ? "connected" : "error");
    } catch {
      setOllamaStatus("error");
    }
  }

  const fetchQuotes = React.useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    else setRefreshing(true);

    try {
      const currentMarketStocks = marketTab === "US" ? US_STOCKS : INDIA_STOCKS;
      const symbols = currentMarketStocks.map(s => s.symbol);

      const positionSymbols = portfolio.positions.map(p => p.symbol).filter(s => !symbols.includes(s));
      const allSymbols = [...symbols, ...positionSymbols];

      const response = await api.post("/agents/stock/quotes/batch", { symbols: allSymbols });
      const quotes = response.data;

      setLiveStocks(prev => {
        const updated = { ...prev };
        for (const def of ALL_STOCK_DEFS) {
          const q = quotes[def.symbol];
          if (q) {
            updated[def.symbol] = {
              ...def,
              price: q.price,
              change: q.change,
              changePercent: q.changePercent,
              dayHigh: q.dayHigh,
              dayLow: q.dayLow,
              volume: q.volume,
              avgVolume: q.avgVolume,
              marketCap: q.marketCap,
              pe: q.pe,
              week52High: q.week52High,
              week52Low: q.week52Low,
              currency: q.currency || (def.market === "IN" ? "INR" : "USD"),
              exchange: q.exchange || "",
              loaded: true,
            };
          }
        }
        for (const sym of positionSymbols) {
          const q = quotes[sym];
          if (q && !updated[sym]) {
            updated[sym] = {
              symbol: sym,
              name: q.name || sym,
              sector: "Other",
              market: sym.endsWith(".NS") || sym.endsWith(".BO") ? "IN" : "US",
              price: q.price,
              change: q.change,
              changePercent: q.changePercent,
              dayHigh: q.dayHigh,
              dayLow: q.dayLow,
              volume: q.volume,
              avgVolume: q.avgVolume,
              marketCap: q.marketCap,
              pe: q.pe,
              week52High: q.week52High,
              week52Low: q.week52Low,
              currency: q.currency || "USD",
              exchange: q.exchange || "",
              loaded: true,
            };
          }
        }
        return updated;
      });

      // Update positions with live prices
      setPortfolio(prev => {
        const updated = {
          ...prev,
          positions: prev.positions.map(p => {
            const q = quotes[p.symbol];
            return q ? { ...p, currentPrice: q.price } : p;
          }),
        };
        savePortfolio(updated);
        return updated;
      });

      // Automatically select the first stock if none is currently selected
      setSelectedStock((currentSelected) => {
        if (currentSelected) return currentSelected;
        const firstDef = currentMarketStocks[0];
        const loadedFirst = quotes[firstDef.symbol];
        if (loadedFirst) {
          return {
            ...firstDef,
            price: loadedFirst.price,
            change: loadedFirst.change,
            changePercent: loadedFirst.changePercent,
            dayHigh: loadedFirst.dayHigh,
            dayLow: loadedFirst.dayLow,
            volume: loadedFirst.volume,
            avgVolume: loadedFirst.avgVolume,
            marketCap: loadedFirst.marketCap,
            pe: loadedFirst.pe,
            week52High: loadedFirst.week52High,
            week52Low: loadedFirst.week52Low,
            currency: loadedFirst.currency || (firstDef.market === "IN" ? "INR" : "USD"),
            exchange: loadedFirst.exchange || "",
            loaded: true,
          };
        }
        return null;
      });

      setLastRefresh(new Date());
    } catch (err: any) {
      console.error("Failed to fetch quotes:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [marketTab, portfolio.positions.length]);

  React.useEffect(() => {
    fetchQuotes();
  }, [marketTab]);

  React.useEffect(() => {
    const interval = setInterval(() => {
      if (!isSimulating) {
        fetchQuotes(true);
      }
    }, 30000);
    return () => clearInterval(interval);
  }, [fetchQuotes, isSimulating]);

  // Synchronize stock details if parsed from parent
  React.useEffect(() => {
    if (initialSymbol && liveStocks[initialSymbol]) {
      setSelectedStock(liveStocks[initialSymbol]);
    } else if (initialSymbol) {
      const loadInitial = async () => {
        try {
          const res = await api.get(`/agents/stock/quote/${initialSymbol}`);
          const q = res.data;
          const newStock: LiveStock = {
            symbol: initialSymbol,
            name: q.name || initialSymbol,
            sector: "Other",
            market: initialSymbol.endsWith(".NS") || initialSymbol.endsWith(".BO") ? "IN" : "US",
            price: q.price,
            change: q.change,
            changePercent: q.changePercent,
            dayHigh: q.dayHigh,
            dayLow: q.dayLow,
            volume: q.volume,
            avgVolume: q.avgVolume,
            marketCap: q.marketCap,
            pe: q.pe,
            week52High: q.week52High,
            week52Low: q.week52Low,
            currency: q.currency || "USD",
            exchange: q.exchange || "",
            loaded: true,
          };
          setLiveStocks(prev => ({ ...prev, [initialSymbol]: newStock }));
          setSelectedStock(newStock);
        } catch {}
      };
      loadInitial();
    }
    if (initialSide) {
      setOrderType(initialSide);
      setActiveTab("trade");
    }
  }, [initialSymbol, initialSide]);

  // ═══════════ REAL CHART DATA LOADING ═══════════

  React.useEffect(() => {
    if (!selectedStock) return;
    const loadRealCandles = async () => {
      setLoadingChart(true);
      try {
        const res = await api.get(`/agents/stock/chart/${selectedStock.symbol}?period=${chartPeriod}&interval=${chartInterval}`);
        const mapped: Candle[] = res.data.candles.map((c: any) => ({
          time: new Date(c.date).getTime(),
          open: c.open,
          high: c.high,
          low: c.low,
          close: c.close,
          volume: c.volume,
        }));
        setAllHistoricalCandles(mapped);
        
        if (!isSimulating) {
          setCandles(mapped);
          setFutureCandles([]);
        }
      } catch (err) {
        console.error("Failed to load real candles:", err);
      } finally {
        setLoadingChart(false);
      }
    };
    loadRealCandles();
  }, [selectedStock, isSimulating, chartPeriod, chartInterval]);

  // ═══════════ REPLAY SIMULATION TIMERS ═══════════

  const handleToggleSimulation = () => {
    if (!isSimulating) {
      if (allHistoricalCandles.length < 30) {
        addToast({ type: "warning", title: "Insufficient Data", description: "Not enough historical chart data to run replay." });
        return;
      }
      // Set simulation active
      const splitIdx = Math.floor(allHistoricalCandles.length * 0.7);
      const preHistory = allHistoricalCandles.slice(0, splitIdx);
      const postHistory = allHistoricalCandles.slice(splitIdx);

      setCandles(preHistory);
      setFutureCandles(postHistory);
      setIsSimulating(true);
      setSimulatedPrice(preHistory[preHistory.length - 1].close);
      addToast({ type: "success", title: "Practice Replay Started", description: "Running tick simulation candle-by-candle." });
    } else {
      setIsSimulating(false);
      setIsAutoPilotActive(false);
      setSimulatedPrice(null);
      setCandles(allHistoricalCandles);
      setFutureCandles([]);
      addToast({ type: "info", title: "Practice Replay Paused", description: "Chart restored to full history." });
    }
  };

  React.useEffect(() => {
    if (!isSimulating || futureCandles.length === 0) {
      if (isSimulating && futureCandles.length === 0) {
        setIsSimulating(false);
        setIsAutoPilotActive(false);
        addToast({ type: "info", title: "Replay Complete", description: "All historical replay ticks have ended." });
      }
      return;
    }

    const timer = setInterval(() => {
      setFutureCandles(prevFuture => {
        if (prevFuture.length === 0) return prevFuture;
        const nextCandle = prevFuture[0];
        
        setCandles(prevCandles => {
          const updated = [...prevCandles, nextCandle];
          // Keep window size stable if too large
          if (updated.length > 200) updated.shift();
          return updated;
        });

        setSimulatedPrice(nextCandle.close);
        
        // Calculate change relative to stock open
        if (selectedStock) {
          const openPrice = selectedStock.price - selectedStock.change;
          const currentChange = nextCandle.close - openPrice;
          setSimulatedChange(currentChange);
        }

        return prevFuture.slice(1);
      });
    }, simulationSpeed * 1000);

    return () => clearInterval(timer);
  }, [isSimulating, futureCandles, simulationSpeed, selectedStock]);

  const activePrice = simulatedPrice !== null ? simulatedPrice : (selectedStock?.price || 0);
  const activeChange = simulatedPrice !== null ? simulatedChange : (selectedStock?.change || 0);
  const activeChangePct = selectedStock 
    ? (simulatedPrice !== null ? (activeChange / (selectedStock.price - selectedStock.change)) * 100 : selectedStock.changePercent) 
    : 0;

  // ═══════════ AI AUTO-PILOT LOGIC (FULLY AUTOMATED) ═══════════

  React.useEffect(() => {
    if (!isAutoPilotActive || !isSimulating || !selectedStock || candles.length === 0) return;

    const interval = setInterval(async () => {
      const recentCloses = candles.map(c => c.close);
      const rsiNow = recentCloses.length > 14 ? calcRSI(recentCloses).pop() || 50 : 50;
      const currentHoldings = portfolio.positions.find(p => p.symbol === selectedStock.symbol)?.shares || 0;

      const log = (type: SimulationLog["type"], msg: string) => {
        setAutopilotLogs(prev => [{ time: new Date().toLocaleTimeString(), type, message: msg }, ...prev.slice(0, 19)]);
      };

      // Built-in rule-based decision
      const isOversold = rsiNow < 35;
      const isOverbought = rsiNow > 65;

      if (isOversold && currentHoldings === 0) {
        const targetShares = parseInt(shares) || 10;
        const totalCost = activePrice * targetShares;
        const currency = selectedStock.currency;
        const isINR = currency === "INR";
        const availableCash = isINR ? portfolio.cashINR : portfolio.cash;

        if (totalCost <= availableCash) {
          log("buy", `AI Autopilot: Detected RSI oversold (${rsiNow.toFixed(1)}) signal on ${selectedStock.symbol}...`);
          executeTradeConfirmed("buy", targetShares, activePrice, selectedStock);
          log("success", `AI Autopilot: Executed BUY order of ${targetShares} shares @ ${formatCurrency(activePrice, currency)}.`);
        } else {
          log("info", `AI Autopilot: Insufficient funds to buy ${selectedStock.symbol}.`);
        }
      } else if (isOverbought && currentHoldings > 0) {
        log("sell", `AI Autopilot: Detected RSI overbought (${rsiNow.toFixed(1)}) signal on ${selectedStock.symbol}...`);
        executeTradeConfirmed("sell", currentHoldings, activePrice, selectedStock);
        log("success", `AI Autopilot: Executed SELL target to close position of ${currentHoldings} shares.`);
      } else {
        log("info", `AI Autopilot: Technical conditions neutral (RSI: ${rsiNow.toFixed(1)}) — monitoring charts.`);
      }
    }, 8000); // Trigger autopilot decisions every 8 seconds

    return () => clearInterval(interval);
  }, [isAutoPilotActive, isSimulating, selectedStock, candles, activePrice, portfolio, shares]);

  // ═══════════ AI STOCK INTELLIGENCE INTEGRATION ═══════════

  const getAISuggestion = async () => {
    if (!selectedStock) return;
    setAiLoading(true);
    try {
      // Connect to the backend stock intelligence analysis endpoint
      const response = await api.post("/agents/stock/analyze", { symbol: selectedStock.symbol, isIntraday: false });
      const data = response.data;
      
      const sigMap: Record<string, "BUY" | "SELL" | "HOLD"> = {
        STRONG_BUY: "BUY",
        BUY: "BUY",
        HOLD: "HOLD",
        SELL: "SELL",
        STRONG_SELL: "SELL"
      };

      const parsed: AISuggestion = {
        signal: sigMap[data.recommendation] || "HOLD",
        confidence: data.signals?.buyScore || data.signals?.sellScore || 65,
        reasoning: data.aiExplanation ? data.aiExplanation.replace(/<[^>]*>/g, "").split("\n")[0] : "Bullish price patterns emerging.",
        pattern: data.signals?.recommendation || "Trend Crossover",
        sl: data.signals?.stopLoss || (selectedStock.price * 0.96),
        tp: data.signals?.profitTarget || (selectedStock.price * 1.08),
        level: traderLevel
      };

      setSuggestion(parsed);
      setAiChat(c => [...c, {
        role: "ai",
        text: `**${parsed.signal}** (${parsed.confidence}% confidence)\n${parsed.reasoning}\n\nPattern: ${parsed.pattern}\nSL: ${formatCurrency(parsed.sl, selectedStock.currency)} | TP: ${formatCurrency(parsed.tp, selectedStock.currency)}`
      }]);

    } catch (err) {
      console.error("AI Analysis failed:", err);
      // Fallback local analysis
      const recentCloses = candles.map(c => c.close);
      const rsiNow = recentCloses.length > 14 ? calcRSI(recentCloses).pop() || 50 : 50;
      const atr = selectedStock.dayHigh - selectedStock.dayLow || selectedStock.price * 0.02;
      const fallback: AISuggestion = {
        signal: rsiNow < 35 ? "BUY" : rsiNow > 65 ? "SELL" : "HOLD",
        confidence: rsiNow < 35 ? 70 : rsiNow > 65 ? 68 : 50,
        pattern: "RSI Momentum Support",
        reasoning: `Technical signals neutral. RSI indicator stands at ${rsiNow.toFixed(1)}.`,
        sl: rsiNow < 35 ? selectedStock.price - atr * 1.5 : selectedStock.price + atr * 1.5,
        tp: rsiNow < 35 ? selectedStock.price + atr * 2.5 : selectedStock.price - atr * 2.5,
        level: traderLevel
      };
      setSuggestion(fallback);
      setAiChat(c => [...c, { role: "ai", text: `⚠️ Technical fallback:\n**${fallback.signal}** — ${fallback.reasoning}` }]);
    } finally {
      setAiLoading(false);
    }
  };

  const sendChat = async () => {
    if (!chatInput.trim() || !selectedStock) return;
    const msg = chatInput.trim();
    setChatInput("");
    setAiChat(c => [...c, { role: "user", text: msg }]);

    if (ollamaStatus === "connected") {
      setAiLoading(true);
      try {
        const recentCloses = candles.map(c => c.close);
        const rsiVal = recentCloses.length > 14 ? calcRSI(recentCloses).pop() || 50 : 50;
        const ctx = `You are a professional day trading mentor advising a ${traderLevel} trader practicing on simulated stock ${selectedStock.symbol} which is priced at ${formatCurrency(activePrice, selectedStock.currency)}. RSI is currently ${rsiVal.toFixed(1)}. Reply in 2-3 precise lines.`;
        const reply = await askOllama(`${ctx}\n\nQuestion: ${msg}`, ollamaModel, ollamaUrl);
        setAiChat(c => [...c, { role: "ai", text: reply }]);
      } catch {
        setAiChat(c => [...c, { role: "ai", text: "Lost connection to Ollama server. Verify port 11434 is running." }]);
      }
      setAiLoading(false);
    } else {
      // Offline local responses for core learning concepts
      const rVal = candles.map(c => c.close).slice(-14);
      const rsiNow = rVal.length > 0 ? calcRSI(rVal).pop() || 50 : 50;
      const reply = fallbackAnswer(msg, activePrice, rsiNow);
      setAiChat(c => [...c, { role: "ai", text: reply }]);
    }
  };

  React.useEffect(() => {
    if (chatRef.current) {
      chatRef.current.scrollTop = chatRef.current.scrollHeight;
    }
  }, [aiChat]);

  // ── SVG Mouse Event Actions ───────────────────────────────────────────────

  const handleSVGMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    const rect = svgRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    setCrosshair({ x, y });
  };

  const handleSVGMouseDown = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!drawMode) return;
    const rect = svgRef.current?.getBoundingClientRect();
    if (!rect) return;
    setDrawStart({ x: e.clientX - rect.left, y: e.clientY - rect.top });
  };

  const handleSVGMouseUp = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!drawMode || !drawStart) return;
    const rect = svgRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x2 = e.clientX - rect.left;
    const y2 = e.clientY - rect.top;
    if (Math.abs(x2 - drawStart.x) > 10 || Math.abs(y2 - drawStart.y) > 10) {
      setDrawings(d => [...d, { id: Date.now().toString(), x1: drawStart.x, y1: drawStart.y, x2, y2, color: drawColor }]);
    }
    setDrawStart(null);
  };

  React.useEffect(() => {
    const el = chartContainerRef.current;
    if (!el) return;

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      if (e.ctrlKey || e.metaKey) {
        setZoom(z => Math.max(10, Math.min(120, z + (e.deltaY > 0 ? 5 : -5))));
      } else {
        setOffset(o => Math.max(0, Math.min(candles.length - 10, o + (e.deltaY > 0 ? 3 : -3))));
      }
    };

    el.addEventListener("wheel", onWheel, { passive: false });
    return () => {
      el.removeEventListener("wheel", onWheel);
    };
  }, [candles.length]);

  // ── Dimensions ────────────────────────────────────────────────────────────

  const W = 880, H_CHART = 340, H_RSI = 80, H_VOL = 60;
  const totalH = H_CHART + (showRSI ? H_RSI + 6 : 0) + (showVol ? H_VOL + 6 : 0);
  const PAD_L = 60, PAD_R = 10, PAD_T = 20, PAD_B = 20;
  const chartW = W - PAD_L - PAD_R;

  const visibleCandles = React.useMemo(() => {
    if (candles.length === 0) return [];
    const end = candles.length - offset;
    const start = Math.max(0, end - zoom);
    return candles.slice(start, end);
  }, [candles, offset, zoom]);

  const candleW = Math.max(1, (chartW / (visibleCandles.length || 1)) * 0.7);

  const priceMin = visibleCandles.length > 0 ? Math.min(...visibleCandles.map(c => c.low)) * 0.998 : 0;
  const priceMax = visibleCandles.length > 0 ? Math.max(...visibleCandles.map(c => c.high)) * 1.002 : 100;
  const volMax = visibleCandles.length > 0 ? Math.max(...visibleCandles.map(c => c.volume)) : 10000;

  const px = (i: number) => PAD_L + (i + 0.5) * (chartW / (visibleCandles.length || 1));
  const py = (p: number) => PAD_T + ((priceMax - p) / (priceMax - priceMin || 1)) * (H_CHART - PAD_T - PAD_B);
  const rsiY = (v: number) => H_CHART + 6 + ((100 - v) / 100) * H_RSI;
  const volY = (v: number) => H_CHART + (showRSI ? H_RSI + 12 : 6) + (1 - v / (volMax || 1)) * H_VOL;

  const ema9 = React.useMemo(() => {
    const closes = visibleCandles.map(c => c.close);
    return calcEMA(closes, 9);
  }, [visibleCandles]);

  const ema21 = React.useMemo(() => {
    const closes = visibleCandles.map(c => c.close);
    return calcEMA(closes, 21);
  }, [visibleCandles]);

  const rsiVals = React.useMemo(() => {
    const closes = visibleCandles.map(c => c.close);
    return calcRSI(closes, 14);
  }, [visibleCandles]);

  const priceTicks = Array.from({ length: 6 }, (_, i) => priceMin + (i / 5) * (priceMax - priceMin));

  const crosshairCandle = React.useMemo(() => {
    if (!crosshair || visibleCandles.length === 0 || crosshair.x < PAD_L || crosshair.x > W - PAD_R) return null;
    const idx = Math.floor(((crosshair.x - PAD_L) / chartW) * visibleCandles.length);
    return visibleCandles[Math.max(0, Math.min(idx, visibleCandles.length - 1))];
  }, [crosshair, visibleCandles, chartW]);

  // ═══════════ TRADE ACTIONS ═══════════

  const handleRequestTrade = () => {
    const numShares = parseInt(shares);
    if (!selectedStock || !numShares || numShares <= 0) {
      addToast({ type: "warning", title: "Invalid Order", description: "Please select a stock and enter a valid quantity." });
      return;
    }

    const total = activePrice * numShares;
    const isINR = selectedStock.currency === "INR";
    const availableCash = isINR ? portfolio.cashINR : portfolio.cash;

    if (orderType === "buy" && total > availableCash) {
      addToast({
        type: "error",
        title: "Insufficient Funds",
        description: `You need ${formatCurrency(total, selectedStock.currency)} but only have ${formatCurrency(availableCash, selectedStock.currency)} available.`,
      });
      return;
    }

    if (orderType === "sell") {
      const position = portfolio.positions.find((p) => p.symbol === selectedStock.symbol);
      if (!position || position.shares < numShares) {
        addToast({ type: "error", title: "Insufficient Shares", description: `You only hold ${position?.shares || 0} shares of ${selectedStock.symbol}.` });
        return;
      }
    }

    setPendingOrderDetails({
      side: orderType,
      shares: numShares,
      price: activePrice,
      total,
      currency: selectedStock.currency,
    });
    setPermissionSliderVal(0);
    setIsPermissionDialogOpen(true);
  };

  const handleAuthorizeSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseInt(e.target.value);
    setPermissionSliderVal(val);
    if (val >= 90) {
      setIsPermissionDialogOpen(false);
      if (pendingOrderDetails && selectedStock) {
        executeTradeConfirmed(pendingOrderDetails.side, pendingOrderDetails.shares, pendingOrderDetails.price, selectedStock);
      }
      setPendingOrderDetails(null);
    }
  };

  function executeTradeConfirmed(side: "buy" | "sell", numShares: number, price: number, stock: LiveStock) {
    const total = price * numShares;
    const isINR = stock.currency === "INR";

    const existingPosition = portfolio.positions.find((p) => p.symbol === stock.symbol);
    let newPositions: Position[];

    if (side === "buy") {
      if (existingPosition) {
        const newShares = existingPosition.shares + numShares;
        const newAvgCost = (existingPosition.avgCost * existingPosition.shares + price * numShares) / newShares;
        newPositions = portfolio.positions.map((p) =>
          p.symbol === stock.symbol
            ? { ...p, shares: newShares, avgCost: Math.round(newAvgCost * 100) / 100, currentPrice: price }
            : p
        );
      } else {
        newPositions = [
          ...portfolio.positions,
          {
            symbol: stock.symbol,
            name: stock.name,
            shares: numShares,
            avgCost: price,
            currentPrice: price,
            currency: stock.currency,
            market: stock.market,
          },
        ];
      }
    } else {
      // Sell
      const position = portfolio.positions.find((p) => p.symbol === stock.symbol);
      if (!position) return;

      const remainingShares = position.shares - numShares;
      if (remainingShares === 0) {
        newPositions = portfolio.positions.filter((p) => p.symbol !== stock.symbol);
      } else {
        newPositions = portfolio.positions.map((p) =>
          p.symbol === stock.symbol ? { ...p, shares: remainingShares, currentPrice: price } : p
        );
      }
    }

    const tradeItem: Trade = {
      id: `t-${Date.now()}`,
      symbol: stock.symbol,
      type: side,
      shares: numShares,
      price,
      total: Math.round(total * 100) / 100,
      timestamp: new Date().toISOString(),
      currency: stock.currency,
    };

    const newTrades = [tradeItem, ...portfolio.trades];

    let newStreak = portfolio.streak || 0;
    if (side === "sell" && existingPosition) {
      const profit = (price - existingPosition.avgCost) * numShares;
      if (profit > 0) newStreak += 1;
      else newStreak = 0;
    }

    const closedSales = newTrades.filter(t => t.type === "sell");
    let calculatedWinRate = portfolio.winRate || 0;
    if (closedSales.length > 0) {
      const profitableSales = closedSales.filter(t => {
        const buyMatches = newTrades.filter(b => b.symbol === t.symbol && b.type === "buy");
        if (buyMatches.length > 0) {
          return t.price > buyMatches[0].price;
        }
        return true;
      });
      calculatedWinRate = Math.round((profitableSales.length / closedSales.length) * 100);
    }

    const newPortfolio: Portfolio = {
      startingBalance: portfolio.startingBalance,
      startingBalanceINR: portfolio.startingBalanceINR,
      cash: isINR ? portfolio.cash : Math.round((portfolio.cash + (side === "buy" ? -total : total)) * 100) / 100,
      cashINR: isINR ? Math.round((portfolio.cashINR + (side === "buy" ? -total : total)) * 100) / 100 : portfolio.cashINR,
      positions: newPositions,
      trades: newTrades,
      winRate: calculatedWinRate,
      streak: newStreak,
    };

    setPortfolio(newPortfolio);
    savePortfolio(newPortfolio);
    setShares("");

    addToast({
      type: side === "buy" ? "success" : "info",
      title: `${side === "buy" ? "Bought" : "Sold"} ${numShares} ${stock.symbol}`,
      description: `Virtual trade executed at ${formatCurrency(price, stock.currency)}.`
    });

    if (onTradeExecuted) {
      onTradeExecuted();
    }
  };

  const handleReset = () => {
    const fresh = getDefaultPortfolio();
    setPortfolio(fresh);
    savePortfolio(fresh);
    addToast({ type: "info", title: "Portfolio Reset Completed", description: "Virtual cash and history have been cleared." });
  };

  const totalPortfolioUSD = portfolio.cash + portfolio.positions.filter(p => p.currency === "USD").reduce((s, p) => s + p.shares * p.currentPrice, 0);
  const totalPortfolioINR = portfolio.cashINR + portfolio.positions.filter(p => p.currency === "INR").reduce((s, p) => s + p.shares * p.currentPrice, 0);
  const totalPnlUSD = totalPortfolioUSD - portfolio.startingBalance;

  const currentHoldingAvg = React.useMemo(() => {
    if (!selectedStock) return null;
    const pos = portfolio.positions.find(p => p.symbol === selectedStock.symbol);
    return pos ? pos.avgCost : null;
  }, [portfolio.positions, selectedStock]);

  return (
    <div className="space-y-6">

      {/* ═══════════ GAMIFIED METRICS HEADER ═══════════ */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        {[
          {
            label: "Practice Balance (USD)",
            value: formatCurrency(totalPortfolioUSD, "USD"),
            icon: <Wallet className="h-4.5 w-4.5 text-indigo-400" />,
            color: "text-white",
            glow: "shadow-indigo-500/5",
          },
          {
            label: "Practice Balance (INR)",
            value: formatCurrency(totalPortfolioINR, "INR"),
            icon: <IndianRupee className="h-4.5 w-4.5 text-amber-500" />,
            color: "text-amber-400",
            glow: "shadow-amber-500/5",
          },
          {
            label: "Practice P&L",
            value: `${totalPnlUSD >= 0 ? "+" : ""}${formatCurrency(totalPnlUSD, "USD")}`,
            icon: <Activity className="h-4.5 w-4.5 text-emerald-400" />,
            color: totalPnlUSD >= 0 ? "text-emerald-400" : "text-rose-400",
            glow: totalPnlUSD >= 0 ? "shadow-emerald-500/5" : "shadow-rose-500/5",
          },
          {
            label: "Practice Win Rate",
            value: `${portfolio.winRate || 0}%`,
            icon: <Target className="h-4.5 w-4.5 text-violet-400" />,
            color: "text-violet-300",
            glow: "shadow-violet-500/5",
          },
          {
            label: "Active Win Streak",
            value: `${portfolio.streak || 0} Trades`,
            icon: <Percent className="h-4.5 w-4.5 text-orange-400" />,
            color: "text-orange-400",
            glow: "shadow-orange-500/5",
          },
        ].map((item, idx) => (
          <Card key={idx} className={`border border-white/[0.04] bg-zinc-950/45 shadow-lg ${item.glow} hover:border-white/[0.08] transition-all duration-300`}>
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <span className="text-[10px] text-zinc-500 uppercase tracking-wider block font-semibold">{item.label}</span>
                <span className={`text-sm lg:text-base font-extrabold font-mono tracking-tight mt-0.5 block ${item.color}`}>{item.value}</span>
              </div>
              <div className="bg-white/[0.02] border border-white/[0.04] p-2.5 rounded-xl">{item.icon}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* ── SETTINGS PANEL ── */}
      {showSettings && (
        <Card className="border border-white/[0.06] bg-zinc-950/75 p-4 flex gap-4 items-center flex-wrap">
          <span className="text-xs text-zinc-400">Ollama API URL:</span>
          <Input value={ollamaUrl} onChange={e => setOllamaUrl(e.target.value)}
            className="bg-white/5 border-white/10 text-white text-xs w-52 h-8" />
          <span className="text-xs text-zinc-400">Model:</span>
          <Input value={ollamaModel} onChange={e => setOllamaModel(e.target.value)}
            className="bg-white/5 border-white/10 text-white text-xs w-32 h-8" />
          <Button onClick={checkOllamaConnection} className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs h-8 px-4">Connect</Button>
          <StatusDot status={ollamaStatus} />
          <span className="text-[10px] text-zinc-500">Run <code className="text-indigo-400">ollama serve</code> to activate AI Mentor Chat models</span>
        </Card>
      )}

      {/* ═══════════ MAIN PRACTICE AREA ═══════════ */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">

        {/* ── LEFT PANEL: SVG CHART & WATCHLISTS ── */}
        <div className="xl:col-span-2 space-y-4">

          {/* WATCHLIST HEADER AND SEARCH */}
          <Card className="border border-white/[0.04] bg-zinc-950/30 backdrop-blur-md">
            <CardHeader className="py-3 px-4 flex flex-row items-center justify-between space-y-0">
              <div className="flex gap-2">
                <Button variant={marketTab === "US" ? "secondary" : "ghost"} size="sm" onClick={() => setMarketTab("US")} className="text-xs font-semibold h-7.5 px-3">US Stocks</Button>
                <Button variant={marketTab === "IN" ? "secondary" : "ghost"} size="sm" onClick={() => setMarketTab("IN")} className="text-xs font-semibold h-7.5 px-3">India Stocks</Button>
              </div>
              <div className="relative w-48">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-550" />
                <input
                  placeholder="Filter watchlist..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-full bg-white/[0.03] border border-white/[0.06] rounded-lg pl-8.5 pr-2.5 py-1 text-[11px] text-white placeholder-zinc-500 focus:outline-none focus:border-white/10"
                />
              </div>
            </CardHeader>

            <CardContent className="p-0 border-t border-white/[0.04]">
              <div className="overflow-x-auto">
                <table className="w-full text-[11px] text-zinc-400">
                  <thead>
                    <tr className="border-b border-white/[0.04] text-zinc-500 text-left font-semibold uppercase tracking-wider bg-white/[0.01]">
                      <th className="py-2.5 px-4">Symbol</th>
                      <th className="py-2.5 px-4">Price</th>
                      <th className="py-2.5 px-4 text-right">Change</th>
                      <th className="py-2.5 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(marketTab === "US" ? US_STOCKS : INDIA_STOCKS)
                      .filter(s => s.symbol.toLowerCase().includes(searchQuery.toLowerCase()) || s.name.toLowerCase().includes(searchQuery.toLowerCase()))
                      .map(def => {
                        const stock = liveStocks[def.symbol];
                        const isExpanded = expandedSymbol === def.symbol;
                        return (
                          <React.Fragment key={def.symbol}>
                            <tr className={`border-b border-white/[0.02] hover:bg-white/[0.02] cursor-pointer transition-all ${selectedStock?.symbol === def.symbol ? "bg-indigo-600/10 border-l-2 border-l-indigo-500" : ""}`}
                              onClick={() => setSelectedStock(stock)}>
                              <td className="py-3 px-4 font-bold text-white flex items-center gap-1.5">
                                <span>{def.symbol.replace(".NS", "")}</span>
                                <span className="text-[9px] font-normal text-zinc-550 block leading-tight">{def.name}</span>
                              </td>
                              <td className="py-3 px-4 font-mono font-bold text-white">
                                {stock ? formatCurrency(stock.price, stock.currency) : <Loader2 className="h-3 w-3 animate-spin" />}
                              </td>
                              <td className={`py-3 px-4 text-right font-mono font-bold ${stock ? (stock.change >= 0 ? "text-emerald-450" : "text-rose-455") : ""}`}>
                                {stock ? `${stock.change >= 0 ? "+" : ""}${stock.changePercent.toFixed(2)}%` : "—"}
                              </td>
                              <td className="py-3 px-4 text-right">
                                <div className="flex gap-2 justify-end">
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    className="text-[10px] text-indigo-400 hover:bg-indigo-600/10 px-2 h-7"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setExpandedSymbol(isExpanded ? null : def.symbol);
                                    }}
                                  >
                                    Details
                                  </Button>
                                </div>
                              </td>
                            </tr>
                            {isExpanded && stock && (
                              <tr key={`exp-${def.symbol}`}>
                                <td colSpan={4} className="bg-white/[0.01]">
                                  <StockDetailPanel
                                    stock={stock}
                                    onAnalyze={() => getAISuggestion()}
                                    analyzing={aiLoading}
                                  />
                                </td>
                              </tr>
                            )}
                          </React.Fragment>
                        );
                      })}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* SVG CHART PANEL */}
          {selectedStock && (
            <Card className="border border-white/[0.05] bg-zinc-950/45 p-4 shadow-xl">
              {/* Toolbar */}
              <div className="flex gap-3 mb-4 flex-wrap items-center">
                <div className="flex gap-1.5 bg-white/[0.02] border border-white/[0.06] rounded-lg p-0.5">
                  <Button variant={showEMA ? "secondary" : "ghost"} size="sm" onClick={() => setShowEMA(!showEMA)} className="text-[10px] h-7 px-3">EMA</Button>
                  <Button variant={showRSI ? "secondary" : "ghost"} size="sm" onClick={() => setShowRSI(!showRSI)} className="text-[10px] h-7 px-3">RSI</Button>
                  <Button variant={showVol ? "secondary" : "ghost"} size="sm" onClick={() => setShowVol(!showVol)} className="text-[10px] h-7 px-3">Volume</Button>
                </div>

                <div className="flex gap-1 bg-white/[0.02] border border-white/[0.06] rounded-lg p-0.5">
                  {(["5m", "15m", "1h", "1d"] as const).map(inv => (
                    <Button
                      key={inv}
                      variant={chartInterval === inv ? "secondary" : "ghost"}
                      size="sm"
                      onClick={() => handleChangeInterval(inv)}
                      className="text-[10px] h-7 px-2 font-mono uppercase"
                    >
                      {inv}
                    </Button>
                  ))}
                </div>

                <div className="flex gap-1.5 bg-white/[0.02] border border-white/[0.06] rounded-lg p-0.5 items-center">
                  <Button variant={drawMode ? "destructive" : "ghost"} size="sm" onClick={() => setDrawMode(!drawMode)} className={`text-[10px] h-7 px-3 ${drawMode ? "bg-amber-600 hover:bg-amber-500 text-black font-bold" : ""}`}>✏ Draw</Button>
                  {["#f59e0b", "#ef4444", "#22c55e", "#58a6ff", "#a855f7"].map(c => (
                    <div key={c} onClick={() => setDrawColor(c)}
                      className="w-4 h-4 rounded-full cursor-pointer transition-transform hover:scale-110"
                      style={{ background: c, border: drawColor === c ? "2px solid #fff" : "2px solid transparent" }} />
                  ))}
                  <Button variant="ghost" size="sm" onClick={() => setDrawings([])} className="text-[10px] text-zinc-550 hover:text-white h-7 px-2">Clear</Button>
                </div>

                <div className="ml-auto flex items-center gap-2">
                  <span className="text-[10px] text-zinc-500 hidden sm:inline">Scroll: Mousewheel | Zoom: Ctrl+wheel</span>
                  <Button
                    onClick={handleToggleSimulation}
                    variant={isSimulating ? "destructive" : "secondary"}
                    size="sm"
                    className="h-8.5 text-xs font-semibold gap-1.5"
                  >
                    {isSimulating ? <><Pause className="h-3.5 w-3.5" /> Stop Replay</> : <><Play className="h-3.5 w-3.5" /> Start Replay</>}
                  </Button>
                </div>
              </div>

              {/* Chart Screen */}
              <div ref={chartContainerRef} className="relative bg-zinc-950/80 border border-white/[0.08] rounded-xl overflow-hidden shadow-2xl">
                {loadingChart && (
                  <div className="absolute inset-0 bg-black/40 backdrop-blur-sm z-30 flex items-center justify-center">
                    <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
                  </div>
                )}

                {/* Selected Asset Floating Header */}
                <div className="absolute top-3 left-16 z-20 flex gap-4 items-center">
                  <span className="text-white font-extrabold text-sm">{selectedStock.symbol.replace(".NS", "")}</span>
                  <span className="font-mono text-xs font-semibold text-emerald-450">${fmt(activePrice)}</span>
                  {crosshairCandle && (
                    <div className="text-[10px] text-zinc-450 hidden md:flex gap-3 bg-black/50 backdrop-blur-md px-2.5 py-1 rounded-md border border-white/[0.04]">
                      <span>O: <b className="text-zinc-200">{fmt(crosshairCandle.open)}</b></span>
                      <span>H: <b className="text-zinc-200">{fmt(crosshairCandle.high)}</b></span>
                      <span>L: <b className="text-zinc-200">{fmt(crosshairCandle.low)}</b></span>
                      <span>C: <b style={{ color: crosshairCandle.close >= crosshairCandle.open ? "#22c55e" : "#ef4444" }}>{fmt(crosshairCandle.close)}</b></span>
                      <span>Vol: <b className="text-indigo-400">{crosshairCandle.volume.toLocaleString()}</b></span>
                    </div>
                  )}
                </div>

                <svg
                  ref={svgRef}
                  width="100%"
                  height={totalH}
                  viewBox={`0 0 ${W} ${totalH}`}
                  className="block"
                  onMouseMove={handleSVGMouseMove}
                  onMouseLeave={() => setCrosshair(null)}
                  onMouseDown={handleSVGMouseDown}
                  onMouseUp={handleSVGMouseUp}
                  style={{ cursor: drawMode ? "crosshair" : "default" }}
                >
                  {/* X-axis date/time grid lines & labels */}
                  {visibleCandles.map((c, i) => {
                    const cx = px(i);
                    const step = Math.ceil(visibleCandles.length / 6) || 10;
                    if (i % step === 0) {
                      return (
                        <g key={`x-grid-${c.time}-${i}`}>
                          {/* Vertical grid line */}
                          <line x1={cx} y1={PAD_T} x2={cx} y2={H_CHART} stroke="#ffffff" strokeOpacity={0.02} strokeWidth={1} />
                          {/* Tick mark */}
                          <line x1={cx} y1={H_CHART} x2={cx} y2={H_CHART + 4} stroke="#3f3f46" strokeWidth={1} />
                          {/* Label */}
                          <text
                            x={cx}
                            y={H_CHART + 14}
                            textAnchor="middle"
                            fill="#71717a"
                            className="font-mono"
                            fontSize={8}
                          >
                            {(() => {
                              const d = new Date(c.time);
                              if (chartInterval === "1d") {
                                return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
                              }
                              return d.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit", hour12: false });
                            })()}
                          </text>
                        </g>
                      );
                    }
                    return null;
                  })}

                  {/* Grid lines & price tags */}
                  {priceTicks.map((p, i) => (
                    <g key={i}>
                      <line x1={PAD_L} y1={py(p)} x2={W - PAD_R} y2={py(p)} stroke="#ffffff" strokeOpacity={0.03} strokeWidth={1} />
                      <text x={PAD_L - 8} y={py(p) + 3} textAnchor="end" fill="#52525b" className="font-mono" fontSize={9}>{fmt(p)}</text>
                    </g>
                  ))}

                  {/* Draw Candles */}
                  {visibleCandles.map((c, i) => {
                    const cx = px(i);
                    const cOpen = py(c.open);
                    const cClose = py(c.close);
                    const cHigh = py(c.high);
                    const cLow = py(c.low);
                    const color = c.close >= c.open ? "#22c55e" : "#ef4444";
                    return (
                      <g key={c.time + i}>
                        <line x1={cx} y1={cHigh} x2={cx} y2={cLow} stroke={color} strokeWidth={1.2} />
                        <rect
                          x={cx - candleW / 2}
                          y={Math.min(cOpen, cClose)}
                          width={candleW}
                          height={Math.max(2, Math.abs(cOpen - cClose))}
                          fill={color}
                          opacity={0.9}
                          rx={1}
                        />
                      </g>
                    );
                  })}

                  {/* Indicators (EMA) */}
                  {showEMA && ema9.length > 1 && (
                    <polyline points={ema9.map((v, i) => `${px(i)},${py(v)}`).join(" ")} fill="none" stroke="#f59e0b" strokeWidth={1.5} opacity={0.7} />
                  )}
                  {showEMA && ema21.length > 1 && (
                    <polyline points={ema21.map((v, i) => `${px(i)},${py(v)}`).join(" ")} fill="none" stroke="#a855f7" strokeWidth={1.5} opacity={0.7} />
                  )}

                  {/* Position target average cost line */}
                  {currentHoldingAvg && (
                    <g>
                      <line x1={PAD_L} y1={py(currentHoldingAvg)} x2={W - PAD_R} y2={py(currentHoldingAvg)} stroke="#6366f1" strokeWidth={1.5} strokeDasharray="6,4" />
                      <text x={PAD_L + 6} y={py(currentHoldingAvg) - 4} fill="#6366f1" className="font-bold tracking-wide" fontSize={9}>Holding Avg: {formatCurrency(currentHoldingAvg, selectedStock.currency)}</text>
                    </g>
                  )}

                  {/* AI target TP/SL projection levels */}
                  {suggestion && (
                    <>
                      <line x1={PAD_L} y1={py(suggestion.sl)} x2={W - PAD_R} y2={py(suggestion.sl)} stroke="#f43f5e" strokeWidth={1} strokeDasharray="4,4" opacity={0.6} />
                      <text x={W - PAD_R - 6} y={py(suggestion.sl) - 3} textAnchor="end" fill="#f43f5e" fontSize={9}>SL {fmt(suggestion.sl)}</text>

                      <line x1={PAD_L} y1={py(suggestion.tp)} x2={W - PAD_R} y2={py(suggestion.tp)} stroke="#10b981" strokeWidth={1} strokeDasharray="4,4" opacity={0.6} />
                      <text x={W - PAD_R - 6} y={py(suggestion.tp) - 3} textAnchor="end" fill="#10b981" fontSize={9}>TP {fmt(suggestion.tp)}</text>
                    </>
                  )}

                  {/* User custom drawings */}
                  {drawings.map(d => (
                    <line key={d.id} x1={d.x1} y1={d.y1} x2={d.x2} y2={d.y2} stroke={d.color} strokeWidth={1.8} />
                  ))}

                  {/* Active drawing preview line */}
                  {drawMode && drawStart && crosshair && (
                    <line x1={drawStart.x} y1={drawStart.y} x2={crosshair.x} y2={crosshair.y} stroke={drawColor} strokeWidth={1.5} strokeDasharray="4,3" />
                  )}

                  {/* Hover Crosshairs & Prices */}
                  {crosshair && (
                    <>
                      <line x1={crosshair.x} y1={0} x2={crosshair.x} y2={totalH} stroke="#27272a" strokeWidth={1} strokeDasharray="3,3" />
                      <line x1={0} y1={crosshair.y} x2={W} y2={crosshair.y} stroke="#27272a" strokeWidth={1} strokeDasharray="3,3" />
                      {crosshair.y < H_CHART && (
                        <g>
                          <rect x={W - PAD_R - 55} y={crosshair.y - 8} width={55} height={16} fill="#18181b" rx={3} />
                          <text x={W - PAD_R - 4} y={crosshair.y + 4} textAnchor="end" fill="#a1a1aa" className="font-mono" fontSize={9}>
                            {fmt(priceMax - ((crosshair.y - PAD_T) / (H_CHART - PAD_T - PAD_B || 1)) * (priceMax - priceMin))}
                          </text>
                        </g>
                      )}
                    </>
                  )}

                  {/* RSI panel */}
                  {showRSI && (
                    <g>
                      <line x1={PAD_L} y1={H_CHART + 2} x2={W - PAD_R} y2={H_CHART + 2} stroke="#18181b" strokeWidth={1} />
                      <text x={PAD_L - 6} y={H_CHART + 14} textAnchor="end" fill="#52525b" fontSize={9}>RSI</text>
                      {[30, 50, 70].map(v => (
                        <g key={v}>
                          <line x1={PAD_L} y1={rsiY(v)} x2={W - PAD_R} y2={rsiY(v)} stroke={v === 50 ? "#18181b" : v === 70 ? "#ef44441a" : "#22c55e1a"} strokeWidth={1} />
                          <text x={PAD_L - 6} y={rsiY(v) + 3} textAnchor="end" fill="#3f3f46" fontSize={8}>{v}</text>
                        </g>
                      ))}
                      {rsiVals.length > 1 && (
                        <polyline points={rsiVals.map((v, i) => `${px(i)},${rsiY(v)}`).join(" ")} fill="none" stroke="#6366f1" strokeWidth={1.5} />
                      )}
                    </g>
                  )}

                  {/* Volume panel */}
                  {showVol && (
                    <g>
                      <line x1={PAD_L} y1={H_CHART + (showRSI ? H_RSI + 8 : 2)} x2={W - PAD_R} y2={H_CHART + (showRSI ? H_RSI + 8 : 2)} stroke="#18181b" strokeWidth={1} />
                      <text x={PAD_L - 6} y={H_CHART + (showRSI ? H_RSI + 18 : 12)} textAnchor="end" fill="#52525b" fontSize={9}>VOL</text>
                      {visibleCandles.map((c, i) => (
                        <rect
                          key={c.time + i + "v"}
                          x={px(i) - candleW / 2}
                          y={volY(c.volume)}
                          width={candleW}
                          height={H_CHART + (showRSI ? H_RSI + 12 : 6) + H_VOL - volY(c.volume)}
                          fill={c.close >= c.open ? "#22c55e" : "#ef4444"}
                          opacity={0.3}
                          rx={0.5}
                        />
                      ))}
                    </g>
                  )}
                </svg>
              </div>
            </Card>
          )}
        </div>

        {/* ── RIGHT PANEL: TRADE ACTIONS & CHAT ── */}
        <div className="space-y-6">

          {/* SIMULATED DESK ORDER ACTIONS */}
          <Card className="border border-white/[0.04] bg-zinc-950/45 shadow-xl">
            <CardHeader className="py-4">
              <CardTitle className="text-sm font-bold flex items-center gap-1.5">
                <Sliders className="h-4 w-4 text-indigo-400" />
                Simulated Order Execution
              </CardTitle>
              <CardDescription className="text-[11px] text-zinc-550">Practice buying and selling asset shares.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {selectedStock ? (
                <>
                  {/* Buy/Sell tab switcher */}
                  <div className="grid grid-cols-2 gap-1.5 p-1 bg-white/[0.02] border border-white/[0.06] rounded-xl">
                    <Button variant={orderType === "buy" ? "secondary" : "ghost"} size="sm" onClick={() => setOrderType("buy")} className={`text-xs font-bold ${orderType === "buy" ? "bg-emerald-600 hover:bg-emerald-500 text-white" : "text-zinc-400"}`}>BUY</Button>
                    <Button variant={orderType === "sell" ? "secondary" : "ghost"} size="sm" onClick={() => setOrderType("sell")} className={`text-xs font-bold ${orderType === "sell" ? "bg-rose-600 hover:bg-rose-500 text-white" : "text-zinc-400"}`}>SELL</Button>
                  </div>

                  {/* Quantity fields */}
                  <div className="space-y-3">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-zinc-400 font-medium">Quantity (Shares):</span>
                      <Input
                        type="number"
                        min="1"
                        max="10000"
                        value={shares}
                        onChange={(e) => setShares(e.target.value)}
                        className="bg-white/5 border-white/10 text-white font-bold w-24 h-8 text-center"
                      />
                    </div>

                    <div className="p-3 bg-white/[0.02] border border-white/[0.04] rounded-xl space-y-2 text-xs">
                      <div className="flex justify-between text-zinc-550">
                        <span>Price per Share:</span>
                        <span className="text-white font-mono">{formatCurrency(activePrice, selectedStock.currency)}</span>
                      </div>
                      <div className="flex justify-between font-bold border-t border-white/[0.03] pt-2">
                        <span className="text-zinc-300">Total Order Cost:</span>
                        <span className="text-indigo-400 font-mono">{formatCurrency(activePrice * (parseInt(shares) || 0), selectedStock.currency)}</span>
                      </div>
                    </div>

                    <Button
                      onClick={handleRequestTrade}
                      className={`w-full text-xs font-bold tracking-wide shadow-lg ${orderType === "buy" ? "bg-emerald-600 hover:bg-emerald-500" : "bg-rose-600 hover:bg-rose-500"} text-white h-9.5`}
                    >
                      Place Practice {orderType.toUpperCase()} Order
                    </Button>
                  </div>
                </>
              ) : (
                <div className="text-zinc-500 text-xs text-center py-6">Select an asset from the list above to trade.</div>
              )}
            </CardContent>
          </Card>

          {/* AI ADVISOR SUGGESTION */}
          <Card className="border border-white/[0.04] bg-zinc-950/45 shadow-xl">
            <CardHeader className="py-4 flex flex-row items-center justify-between space-y-0">
              <div>
                <CardTitle className="text-sm font-bold flex items-center gap-1.5">
                  <Brain className="h-4 w-4 text-indigo-400" />
                  AI Market Suggestions
                </CardTitle>
                <CardDescription className="text-[11px] text-zinc-550">Gemini intelligence signals.</CardDescription>
              </div>
              {selectedStock && (
                <Button onClick={getAISuggestion} disabled={aiLoading} size="sm" className="bg-indigo-600 hover:bg-indigo-500 text-white text-[10px] h-7 px-3">
                  {aiLoading ? "Analyzing..." : "Analyze"}
                </Button>
              )}
            </CardHeader>
            <CardContent className="space-y-4">
              {suggestion ? (
                <SuggestionCard s={suggestion} currency={selectedStock?.currency || "USD"} />
              ) : (
                <div className="text-zinc-550 text-xs text-center py-6">Click "Analyze" to generate AI trading signals.</div>
              )}
            </CardContent>
          </Card>

          {/* AI MENTOR CHAT DESK */}
          <Card className="border border-white/[0.04] bg-zinc-950/45 shadow-xl h-[280px] flex flex-col overflow-hidden">
            <CardHeader className="py-2.5 px-4 border-b border-white/[0.04]">
              <CardTitle className="text-[11px] font-bold text-indigo-400 flex items-center justify-between">
                <span>AI TRADING CO-PILOT CHAT</span>
                <span className="cursor-pointer text-[10px] text-zinc-500 hover:text-indigo-400 transition-colors" onClick={() => setShowSettings(!showSettings)}>⚙ Settings</span>
              </CardTitle>
            </CardHeader>
            
            <div ref={chatRef} className="flex-1 overflow-y-auto p-4 space-y-3 scrollbar-none">
              {aiChat.length === 0 && (
                <div className="text-zinc-550 text-xs italic text-center py-6">
                  Ask me anything! e.g., "What is RSI?", "Explain the EMA crossover", or "What SL/TP does the AI suggest?"
                </div>
              )}
              {aiChat.map((m, i) => (
                <div
                  key={i}
                  className={`p-2.5 rounded-xl text-xs leading-relaxed max-w-[85%] ${
                    m.role === "user" 
                      ? "bg-indigo-650/15 border-l-2 border-l-indigo-500 text-white ml-auto" 
                      : "bg-white/[0.02] border border-white/[0.04] text-zinc-350 mr-auto"
                  }`}
                >
                  <div className="text-[9px] text-zinc-500 mb-1 select-none font-bold uppercase">{m.role === "user" ? "You" : "Mentor"}</div>
                  <div className="whitespace-pre-wrap">{m.text}</div>
                </div>
              ))}
            </div>

            <div className="p-3 border-t border-white/[0.04] bg-zinc-950/20 flex gap-2">
              <input
                value={chatInput}
                onChange={e => setChatInput(e.target.value)}
                onKeyDown={e => e.key === "Enter" && sendChat()}
                placeholder="Ask trading mentor..."
                disabled={!selectedStock}
                className="flex-1 bg-white/[0.03] border border-white/[0.06] rounded-lg px-3 py-1.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-indigo-500/50 disabled:opacity-40"
              />
              <Button onClick={sendChat} disabled={!selectedStock || !chatInput.trim()} className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs h-8 px-3">↑</Button>
            </div>
          </Card>

          {/* AUTO-PILOT CONTROL */}
          {isSimulating && (
            <Card className="border border-white/[0.04] bg-zinc-950/45 p-4 shadow-xl space-y-4">
              <div className="flex justify-between items-center">
                <div>
                  <span className="text-xs text-white font-bold block">AI Auto-Pilot Mode</span>
                  <span className="text-[10px] text-zinc-550 block">Fully automated live chart backtesting.</span>
                </div>
                <Button
                  onClick={() => setIsAutoPilotActive(!isAutoPilotActive)}
                  variant={isAutoPilotActive ? "destructive" : "secondary"}
                  size="sm"
                  className="h-8 text-xs font-semibold"
                >
                  {isAutoPilotActive ? "Disable Auto-Pilot" : "Enable Auto-Pilot"}
                </Button>
              </div>

              {isAutoPilotActive && (
                <div className="space-y-1.5 pt-2 border-t border-white/[0.04]">
                  <div className="text-[9px] font-bold uppercase tracking-wider text-zinc-550">Autopilot execution logs:</div>
                  <div className="bg-black/40 border border-white/[0.05] rounded-xl p-2.5 font-mono text-[9px] text-zinc-500 h-24 overflow-y-auto space-y-1.5 scrollbar-none">
                    {autopilotLogs.map((l, i) => (
                      <div key={i} className="flex gap-1.5 items-start">
                        <span className="text-zinc-650 shrink-0">{l.time}</span>
                        <span className={
                          l.type === "buy" ? "text-emerald-450" : 
                          l.type === "sell" ? "text-rose-455" : 
                          l.type === "success" ? "text-cyan-400 font-bold" : "text-zinc-500"
                        }>
                          {l.message}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </Card>
          )}

          {/* Reset Simulated Practice */}
          <Button
            onClick={handleReset}
            variant="outline"
            className="w-full border-white/[0.06] text-zinc-550 hover:text-white hover:border-rose-500/25 hover:bg-rose-500/5 text-xs h-9.5"
          >
            Reset Practice Portfolio
          </Button>

        </div>
      </div>

      {/* ── BOT TRADE HISTORY ── */}
      <Card className="border border-white/[0.04] bg-zinc-950/30 p-4">
        <div className="text-[11px] font-bold uppercase tracking-wider text-zinc-500 mb-3 flex items-center gap-1.5">
          <History className="h-4 w-4" /> Practice Trade History
        </div>
        <div className="flex gap-3 overflow-x-auto pb-1.5 scrollbar-none">
          {portfolio.trades.length === 0 && (
            <span className="text-xs text-zinc-550 italic">No virtual trades placed yet. Go buy or sell assets to start practicing!</span>
          )}
          {portfolio.trades.slice(0, 10).map((t, idx) => (
            <div key={idx} className={`bg-white/[0.02] border border-white/[0.04] rounded-xl p-3 text-xs flex flex-col gap-1 min-w-[130px] border-l-2 ${t.type === "buy" ? "border-l-emerald-500" : "border-l-rose-500"}`}>
              <div className="flex justify-between items-center font-bold">
                <span className={t.type === "buy" ? "text-emerald-450" : "text-rose-455"}>{t.type.toUpperCase()}</span>
                <span className="text-white">{t.symbol.replace(".NS", "")}</span>
              </div>
              <div className="text-[10px] text-zinc-550 font-mono">Qty: {t.shares}</div>
              <div className="text-[10px] text-zinc-300 font-mono font-bold mt-0.5">Price: {formatCurrency(t.price, t.currency)}</div>
            </div>
          ))}
        </div>
      </Card>

      {/* ═══════════ SLIDE-TO-CONFIRM PERMISSION MODAL ═══════════ */}
      <Dialog open={isPermissionDialogOpen} onOpenChange={setIsPermissionDialogOpen}>
        <DialogContent className="max-w-md border border-white/[0.08] bg-zinc-950/98 backdrop-blur-2xl p-6 text-white rounded-2xl shadow-2xl">
          <div className="absolute -top-20 -right-20 w-44 h-44 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
          
          <DialogHeader>
            <DialogTitle className="text-lg font-bold flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-indigo-400" />
              Authorize Simulated Order
            </DialogTitle>
            <DialogDescription className="text-zinc-400 text-xs">
              Review and grant explicit permission to execute the following transaction.
            </DialogDescription>
          </DialogHeader>

          {pendingOrderDetails && selectedStock && (
            <div className="space-y-4 py-3">
              <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.06] space-y-2.5">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-zinc-500">Transaction Side:</span>
                  <Badge className={pendingOrderDetails.side === "buy" ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/25" : "bg-rose-500/15 text-rose-400 border border-rose-500/25"}>
                    {pendingOrderDetails.side.toUpperCase()}
                  </Badge>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-zinc-500">Asset Target:</span>
                  <span className="text-white font-bold">{selectedStock.symbol.replace(".NS", "")} ({selectedStock.name})</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-zinc-500">Shares Order:</span>
                  <span className="text-white font-bold font-mono">{pendingOrderDetails.shares}</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-zinc-500">Price per Share:</span>
                  <span className="text-white font-bold font-mono">{formatCurrency(pendingOrderDetails.price, pendingOrderDetails.currency)}</span>
                </div>
                <div className="border-t border-white/[0.05] pt-2.5 flex justify-between items-center">
                  <span className="text-xs font-semibold text-zinc-300">Total Simulated Cost:</span>
                  <span className="text-white text-md font-extrabold font-mono">{formatCurrency(pendingOrderDetails.total, pendingOrderDetails.currency)}</span>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-indigo-500/[0.02] border border-indigo-500/10 space-y-2 text-xs">
                <div className="flex justify-between text-zinc-500">
                  <span>Balance Before:</span>
                  <span className="font-mono">{formatCurrency(pendingOrderDetails.currency === "INR" ? portfolio.cashINR : portfolio.cash, pendingOrderDetails.currency)}</span>
                </div>
                <div className="flex justify-between font-bold text-indigo-400">
                  <span>Predicted Balance After:</span>
                  <span className="font-mono">
                    {formatCurrency(
                      (pendingOrderDetails.currency === "INR" ? portfolio.cashINR : portfolio.cash) +
                      (pendingOrderDetails.side === "buy" ? -pendingOrderDetails.total : pendingOrderDetails.total),
                      pendingOrderDetails.currency
                    )}
                  </span>
                </div>
              </div>

              <div className="space-y-2 pt-2">
                <div className="relative h-12 bg-white/[0.03] border border-white/10 rounded-xl overflow-hidden flex items-center justify-center">
                  <motion.div
                    className={`absolute left-0 top-0 bottom-0 bg-gradient-to-r ${pendingOrderDetails.side === "buy" ? 'from-emerald-600/30 to-green-600/30' : 'from-rose-600/30 to-red-600/30'} z-0`}
                    style={{ width: `${permissionSliderVal}%` }}
                  />
                  <span className="text-xs font-semibold text-zinc-400 z-10 select-none pointer-events-none">
                    {permissionSliderVal >= 75 ? "Release to Confirm" : "Slide Slider Right to Authorize"}
                  </span>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={permissionSliderVal}
                    onChange={handleAuthorizeSliderChange}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-ew-resize z-20"
                  />
                </div>
              </div>
            </div>
          )}

          <div className="flex justify-start pt-2">
            <Button
              variant="ghost"
              onClick={() => {
                setIsPermissionDialogOpen(false);
                setPendingOrderDetails(null);
              }}
              className="text-zinc-500 hover:text-zinc-300 hover:bg-white/5 h-8 text-xs font-semibold px-4"
            >
              Cancel Order
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ── Supporting Sub-components ──────────────────────────────────────────────────

function LevelBadge({ level }: { level: string }) {
  const colors: Record<string, string> = { Beginner: "#22c55e", Intermediate: "#f59e0b", Pro: "#ef4444" };
  return (
    <span style={{ background: colors[level] + "22", color: colors[level], border: `1px solid ${colors[level]}44` }}
      className="px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wide">
      {level}
    </span>
  );
}

function StatusDot({ status }: { status: OllamaStatus }) {
  const colors: Record<OllamaStatus, string> = { connected: "#22c55e", connecting: "#f59e0b", error: "#ef4444", idle: "#8b949e" };
  const labels: Record<OllamaStatus, string> = { connected: "Ollama Connected", connecting: "Connecting...", error: "Offline", idle: "Not Configured" };
  return (
    <span className="flex items-center gap-1.5 text-[11px] font-medium" style={{ color: colors[status] }}>
      <span className="w-2 h-2 rounded-full inline-block" style={{ background: colors[status] }} />
      {labels[status]}
    </span>
  );
}

function SuggestionCard({ s, currency }: { s: AISuggestion, currency: string }) {
  const sigColor = s.signal === "BUY" ? "#22c55e" : s.signal === "SELL" ? "#ef4444" : "#f59e0b";
  const bgGlow = s.signal === "BUY" ? "bg-emerald-950/10 border-l-emerald-500" : s.signal === "SELL" ? "bg-rose-950/10 border-l-rose-500" : "bg-amber-950/10 border-l-amber-500";
  return (
    <div className={`p-4 rounded-xl border border-white/[0.04] border-l-3 ${bgGlow} space-y-2.5`}>
      <div className="flex items-center justify-between">
        <span className="font-extrabold text-sm tracking-wide" style={{ color: sigColor }}>{s.signal} SIGNAL</span>
        <span className="text-[10px] font-semibold text-zinc-550 font-mono">{s.confidence}% Conf.</span>
      </div>
      <div className="w-full bg-white/[0.04] h-1.5 rounded-full overflow-hidden">
        <div className="h-full rounded-full transition-all duration-500" style={{ width: `${s.confidence}%`, background: sigColor }} />
      </div>
      <div className="text-[10px] text-zinc-400">Pattern: <b className="text-white">{s.pattern}</b></div>
      <p className="text-xs text-zinc-300 leading-relaxed font-medium">{s.reasoning}</p>
      <div className="flex justify-between border-t border-white/[0.03] pt-2 text-[10px] text-zinc-500">
        <span>Stop Loss: <b className="text-rose-455 font-mono">{formatCurrency(s.sl, currency)}</b></span>
        <span>Target: <b className="text-emerald-450 font-mono">{formatCurrency(s.tp, currency)}</b></span>
      </div>
    </div>
  );
}

// ── AI offline logic fallbacks ─────────────────────────────────────────────────

function fallbackAnswer(msg: string, price: number, rsi: number): string {
  const q = msg.toLowerCase();
  if (q.includes("rsi")) return `RSI (Relative Strength Index) measures momentum. Current RSI is ${rsi.toFixed(1)}. Above 70 is overbought (selling exhaustion), below 30 is oversold (buying exhaustion), and 30-70 is neutral.`;
  if (q.includes("ema") || q.includes("moving average")) return "EMA (Exponential Moving Average) smooths price data. A crossover of EMA 9 crossing above EMA 21 signals bullish entry, while crossing below indicates bearish exits.";
  if (q.includes("stop loss") || q.includes("sl")) return "Stop Loss (SL) is your defensive price target. Set it below local support for BUY orders or above local resistance for SELL orders. Limit risk to 1-2% per position.";
  if (q.includes("take profit") || q.includes("tp")) return "Take profit (TP) defines your exit target to secure gains. Maintain a risk-reward ratio of at least 1:2 (e.g. risk $2 to make $4).";
  if (q.includes("candle") || q.includes("pattern")) return "Candlesticks reveal buyer/seller struggle. Green indicates buyers closed the period higher. Red indicates sellers pushed it lower. Long wicks show rejection points.";
  if (q.includes("buy") || q.includes("sell") || q.includes("now")) return `Current mock price: $${price.toFixed(2)}. RSI is ${rsi.toFixed(1)}. ${rsi < 35 ? "Oversold RSI favors a potential BUY bounce." : rsi > 65 ? "Overbought RSI favors a potential SELL pullback." : "Neutral zone, wait for EMA crossover or support bounce."}`;
  return `Ollama is currently offline. Ask me about basic trading terms: RSI, EMA indicators, candle charts, Stop Loss (SL), or Take Profit (TP)!`;
}
