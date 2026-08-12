"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  TrendingUp,
  TrendingDown,
  Minus,
  ShieldCheck,
  AlertTriangle,
  Target,
  Activity,
  BarChart3,
  Brain,
  ChevronRight,
  X,
  ArrowUpRight,
  ArrowDownRight,
  Zap,
  Gauge,
  Loader2,
  Calendar,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface MarketSituation {
  overallCondition: "BULLISH" | "BEARISH" | "NEUTRAL";
  conditionStrength: number; // 0-100
  conditionSummary: string;
  buyReasons: SignalReason[];
  sellReasons: SignalReason[];
  volumeAnalysis: {
    condition: "ACCUMULATION" | "DISTRIBUTION" | "NORMAL";
    description: string;
    volumeVsAvg: number;
  };
  momentumAnalysis: {
    rsiState: string;
    macdState: string;
    trendAlignment: string;
  };
  riskReward: {
    ratio: string;
    stopLoss: number;
    profitTarget: number;
    riskPercent: number;
    rewardPercent: number;
  };
  keyLevels: {
    support: { price: number; distance: number }[];
    resistance: { price: number; distance: number }[];
  };
  aiVerdict: string;
}

interface SignalReason {
  indicator: string;
  signal: string;
  strength: "STRONG" | "MODERATE" | "WEAK";
  description: string;
}

interface MarketSituationPanelProps {
  situation: MarketSituation | null;
  isLoading: boolean;
  isOpen: boolean;
  onClose: () => void;
  spotPrice: number;
  symbol: string;
}

function StrengthBadge({ strength }: { strength: "STRONG" | "MODERATE" | "WEAK" }) {
  const styles = {
    STRONG: "bg-emerald-500/15 text-emerald-400 border-emerald-500/25",
    MODERATE: "bg-amber-500/15 text-amber-400 border-amber-500/25",
    WEAK: "bg-zinc-500/15 text-zinc-400 border-zinc-500/25",
  };
  return (
    <Badge variant="outline" className={`text-[10px] py-0 px-1.5 ${styles[strength]}`}>
      {strength}
    </Badge>
  );
}

function ConditionIcon({ condition }: { condition: string }) {
  switch (condition) {
    case "BULLISH":
      return <TrendingUp className="h-5 w-5 text-emerald-400" />;
    case "BEARISH":
      return <TrendingDown className="h-5 w-5 text-rose-400" />;
    default:
      return <Minus className="h-5 w-5 text-amber-400" />;
  }
}

// ─── Option Chain Mock Generator ───
interface OptionStrike {
  strike: number;
  callLtp: number;
  callChange: number;
  putLtp: number;
  putChange: number;
}

function generateOptionChain(spotPrice: number, symbol: string): OptionStrike[] {
  if (!spotPrice || spotPrice <= 0) return [];
  const isIndia = symbol.toUpperCase().endsWith(".NS") || symbol.toUpperCase().endsWith(".BO");
  
  // Decide strike interval based on price magnitude
  let step = 5;
  if (spotPrice > 1000) step = 50;
  else if (spotPrice > 500) step = 10;
  else if (spotPrice > 100) step = 5;
  else if (spotPrice > 10) step = 1;
  else step = 0.5;

  const centerStrike = Math.round(spotPrice / step) * step;
  const strikesCount = 9;
  const list: OptionStrike[] = [];
  
  const half = Math.floor(strikesCount / 2);
  for (let i = -half; i <= half; i++) {
    const strike = centerStrike + i * step;
    
    // Call Option Price Formula: Decays as strike rises
    const callInt = Math.max(0.01 * spotPrice, spotPrice - strike + spotPrice * 0.02);
    const callLtp = parseFloat((callInt + (Math.sin(strike) * 0.05 * spotPrice) / 10).toFixed(2));
    const callChange = parseFloat((Math.sin(strike + 1) * 8 - 2).toFixed(2));
    
    // Put Option Price Formula: Appreciates as strike rises
    const putInt = Math.max(0.01 * spotPrice, strike - spotPrice + spotPrice * 0.02);
    const putLtp = parseFloat((putInt + (Math.cos(strike) * 0.05 * spotPrice) / 10).toFixed(2));
    const putChange = parseFloat((Math.cos(strike + 2) * 8 - 2).toFixed(2));

    list.push({
      strike,
      callLtp: Math.max(0.05, callLtp),
      callChange,
      putLtp: Math.max(0.05, putLtp),
      putChange,
    });
  }
  return list;
}

export default function MarketSituationPanel({
  situation,
  isLoading,
  isOpen,
  onClose,
  spotPrice,
  symbol,
}: MarketSituationPanelProps) {
  if (!isOpen) return null;

  const conditionColors = {
    BULLISH: { bg: "from-emerald-600/20 to-emerald-600/5", text: "text-emerald-400", border: "border-emerald-500/20" },
    BEARISH: { bg: "from-rose-600/20 to-rose-600/5", text: "text-rose-400", border: "border-rose-500/20" },
    NEUTRAL: { bg: "from-amber-600/20 to-amber-600/5", text: "text-amber-400", border: "border-amber-500/20" },
  };

  const isIndia = symbol.toUpperCase().endsWith(".NS") || symbol.toUpperCase().endsWith(".BO");
  const currencySign = isIndia ? "₹" : "$";
  const optionList = generateOptionChain(spotPrice, symbol);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, x: 40 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: 40 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className="w-full lg:w-[420px] shrink-0 space-y-4"
      >
        {/* Header Title with Close */}
        <div className="flex items-center justify-between border-b border-white/5 pb-2">
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
              <Zap className="h-4 w-4 text-violet-400" />
              {symbol} Analysis Console
            </h3>
            <p className="text-[10px] text-zinc-500 mt-0.5">Real-time indicators & derivatives chain</p>
          </div>
          <Button size="sm" variant="ghost" onClick={onClose} className="h-8 w-8 p-0 text-zinc-500 hover:text-white rounded-lg hover:bg-white/5">
            <X className="h-4.5 w-4.5" />
          </Button>
        </div>

        {/* Console Tab Controller */}
        <Tabs defaultValue="situation" className="w-full space-y-4">
          <TabsList className="bg-zinc-950/40 border border-white/[0.06] p-1 w-full grid grid-cols-2 rounded-xl">
            <TabsTrigger value="situation" className="text-xs data-[state=active]:bg-white/10 data-[state=active]:text-white text-zinc-500 rounded-lg">
              <Activity className="h-3.5 w-3.5 mr-1.5" /> Market Situation
            </TabsTrigger>
            <TabsTrigger value="options" className="text-xs data-[state=active]:bg-white/10 data-[state=active]:text-white text-zinc-500 rounded-lg">
              <BarChart3 className="h-3.5 w-3.5 mr-1.5" /> Options Chain
            </TabsTrigger>
          </TabsList>

          {/* 1. MARKET SITUATION TAB */}
          <TabsContent value="situation" className="space-y-4 mt-0 outline-none">
            {isLoading ? (
              <Card className="border border-white/10 bg-zinc-950/60 backdrop-blur-xl">
                <CardContent className="flex flex-col items-center justify-center py-16 gap-3">
                  <Loader2 className="h-8 w-8 animate-spin text-violet-400" />
                  <p className="text-sm text-zinc-400">Analyzing market conditions...</p>
                </CardContent>
              </Card>
            ) : situation ? (
              <>
                {/* Overall Condition Card */}
                <Card className={`border ${conditionColors[situation.overallCondition].border} bg-zinc-950/60 backdrop-blur-xl overflow-hidden relative`}>
                  <div className={`absolute inset-0 bg-gradient-to-br ${conditionColors[situation.overallCondition].bg} pointer-events-none`} />
                  <CardContent className="p-4 relative">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <div className="p-2 rounded-lg bg-white/5">
                          <ConditionIcon condition={situation.overallCondition} />
                        </div>
                        <div>
                          <div className={`text-lg font-bold ${conditionColors[situation.overallCondition].text}`}>
                            {situation.overallCondition}
                          </div>
                          <div className="text-[11px] text-zinc-500">Market Condition</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className={`text-2xl font-bold font-mono ${conditionColors[situation.overallCondition].text}`}>
                          {situation.conditionStrength}%
                        </div>
                        <div className="text-[11px] text-zinc-500">Confidence</div>
                      </div>
                    </div>
                    <p className="text-xs text-zinc-300 leading-relaxed">{situation.conditionSummary}</p>
                  </CardContent>
                </Card>

                {/* Why to BUY */}
                <Card className="border border-emerald-500/15 bg-zinc-950/60 backdrop-blur-xl">
                  <CardHeader className="pb-2 pt-3 px-4">
                    <CardTitle className="text-sm font-semibold text-emerald-400 flex items-center gap-2">
                      <ArrowUpRight className="h-4 w-4" />
                      Why to BUY
                      <Badge variant="outline" className="ml-auto text-[10px] bg-emerald-500/10 text-emerald-400 border-emerald-500/20">
                        {situation.buyReasons.length} signals
                      </Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="px-4 pb-3 space-y-2">
                    {situation.buyReasons.length === 0 ? (
                      <p className="text-xs text-zinc-500 py-2">No significant bullish signals detected.</p>
                    ) : (
                      situation.buyReasons.map((reason, i) => (
                        <div key={i} className="p-2.5 bg-emerald-500/5 rounded-lg border border-emerald-500/10">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs font-semibold text-emerald-300">{reason.indicator}</span>
                            <StrengthBadge strength={reason.strength} />
                          </div>
                          <p className="text-[11px] text-zinc-400 leading-relaxed">{reason.description}</p>
                        </div>
                      ))
                    )}
                  </CardContent>
                </Card>

                {/* Why to SELL */}
                <Card className="border border-rose-500/15 bg-zinc-950/60 backdrop-blur-xl">
                  <CardHeader className="pb-2 pt-3 px-4">
                    <CardTitle className="text-sm font-semibold text-rose-400 flex items-center gap-2">
                      <ArrowDownRight className="h-4 w-4" />
                      Why to SELL
                      <Badge variant="outline" className="ml-auto text-[10px] bg-rose-500/10 text-rose-400 border-rose-500/20">
                        {situation.sellReasons.length} signals
                      </Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="px-4 pb-3 space-y-2">
                    {situation.sellReasons.length === 0 ? (
                      <p className="text-xs text-zinc-500 py-2">No significant bearish signals detected.</p>
                    ) : (
                      situation.sellReasons.map((reason, i) => (
                        <div key={i} className="p-2.5 bg-rose-500/5 rounded-lg border border-rose-500/10">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs font-semibold text-rose-300">{reason.indicator}</span>
                            <StrengthBadge strength={reason.strength} />
                          </div>
                          <p className="text-[11px] text-zinc-400 leading-relaxed">{reason.description}</p>
                        </div>
                      ))
                    )}
                  </CardContent>
                </Card>

                {/* Key Levels */}
                <Card className="border border-white/10 bg-zinc-950/60 backdrop-blur-xl">
                  <CardHeader className="pb-2 pt-3 px-4">
                    <CardTitle className="text-sm font-semibold text-white flex items-center gap-2">
                      <Activity className="h-4 w-4 text-indigo-400" />
                      Key Levels
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="px-4 pb-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <div className="text-[10px] text-emerald-400 font-semibold uppercase tracking-wider mb-1.5">Support</div>
                        {situation.keyLevels.support.length === 0 ? (
                          <div className="text-xs text-zinc-600">None</div>
                        ) : (
                          situation.keyLevels.support.map((s, i) => (
                            <div key={i} className="flex items-center justify-between text-xs mb-1">
                              <span className="font-mono text-emerald-300">{currencySign}{s.price.toFixed(2)}</span>
                              <span className="text-zinc-500">-{s.distance.toFixed(1)}%</span>
                            </div>
                          ))
                        )}
                      </div>
                      <div>
                        <div className="text-[10px] text-rose-400 font-semibold uppercase tracking-wider mb-1.5">Resistance</div>
                        {situation.keyLevels.resistance.length === 0 ? (
                          <div className="text-xs text-zinc-600">None</div>
                        ) : (
                          situation.keyLevels.resistance.map((r, i) => (
                            <div key={i} className="flex items-center justify-between text-xs mb-1">
                              <span className="font-mono text-rose-300">{currencySign}{r.price.toFixed(2)}</span>
                              <span className="text-zinc-500">+{r.distance.toFixed(1)}%</span>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* AI Verdict */}
                <Card className="border border-violet-500/20 bg-zinc-950/60 backdrop-blur-xl overflow-hidden relative">
                  <div className="absolute inset-0 bg-gradient-to-br from-violet-600/10 to-transparent pointer-events-none" />
                  <CardHeader className="pb-2 pt-3 px-4 relative">
                    <CardTitle className="text-sm font-semibold text-violet-400 flex items-center gap-2">
                      <Brain className="h-4 w-4" />
                      AI Verdict
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="px-4 pb-3 relative">
                    <p className="text-xs text-zinc-300 leading-relaxed whitespace-pre-wrap">{situation.aiVerdict}</p>
                  </CardContent>
                </Card>
              </>
            ) : (
              <Card className="border border-white/10 bg-zinc-950/60 backdrop-blur-xl">
                <CardContent className="flex flex-col items-center justify-center py-12 gap-3">
                  <BarChart3 className="h-8 w-8 text-zinc-600" />
                  <p className="text-sm text-zinc-500 text-center">
                    Click &quot;Market Situation&quot; to analyze the current market conditions.
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* 2. OPTIONS CHAIN TAB */}
          <TabsContent value="options" className="space-y-4 mt-0 outline-none">
            <Card className="border border-white/[0.06] bg-zinc-950/40 backdrop-blur-xl">
              <CardHeader className="pb-3 pt-4 px-4 flex flex-row items-center justify-between gap-2 space-y-0">
                <div>
                  <CardTitle className="text-sm font-bold text-white flex items-center gap-1.5">
                    <Calendar className="h-4 w-4 text-cyan-400" />
                    Option Derivatives
                  </CardTitle>
                </div>
                {/* Expiry Dropdown */}
                <Badge variant="outline" className="bg-white/5 border-white/10 text-zinc-300 font-semibold cursor-pointer py-1 px-2.5 flex items-center gap-1">
                  <span>28 Jul 2026</span>
                  <span className="text-[10px] text-zinc-500">▼</span>
                </Badge>
              </CardHeader>
              <CardContent className="p-0">
                <div className="w-full text-xs overflow-hidden">
                  {/* Table Header */}
                  <div className="grid grid-cols-3 text-center border-b border-white/[0.06] text-zinc-500 font-bold uppercase tracking-wider py-2 bg-white/[0.01]">
                    <div>Call LTP</div>
                    <div>Strike</div>
                    <div>Put LTP</div>
                  </div>

                  {/* Option strikes with spot highlight line */}
                  <div className="divide-y divide-white/[0.03] select-none">
                    {optionList.map((item, idx) => {
                      const prevItem = optionList[idx - 1];
                      
                      // Check if spot price falls between this strike and the previous strike to draw the spot line
                      const showSpotLine = spotPrice && prevItem && 
                        ((spotPrice >= prevItem.strike && spotPrice < item.strike) || 
                         (spotPrice < prevItem.strike && spotPrice >= item.strike));

                      return (
                        <React.Fragment key={item.strike}>
                          {showSpotLine && (
                            <div className="bg-indigo-600/90 text-white font-bold py-1.5 px-3 flex items-center justify-between shadow-inner relative z-10 border-y border-indigo-500/30">
                              <span className="text-[9px] uppercase tracking-widest text-indigo-200">Spot Price</span>
                              <span className="font-mono text-xs tabular-nums">
                                {currencySign}{spotPrice.toFixed(2)}
                              </span>
                              <span className="text-[10px] opacity-75 font-medium">Live Feed</span>
                            </div>
                          )}
                          <div className="grid grid-cols-3 text-center py-2.5 hover:bg-white/[0.02] transition items-center font-mono">
                            {/* Call LTP */}
                            <div className="flex flex-col items-center">
                              <span className="text-zinc-200 font-semibold tabular-nums">{currencySign}{item.callLtp.toFixed(2)}</span>
                              <span className={`text-[9px] font-bold ${item.callChange >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
                                {item.callChange >= 0 ? "+" : ""}{item.callChange.toFixed(2)}%
                              </span>
                            </div>

                            {/* Strike */}
                            <div className="font-bold text-zinc-400 text-sm bg-white/[0.02] border-x border-white/[0.03] py-0.5">
                              {item.strike.toLocaleString()}
                            </div>

                            {/* Put LTP */}
                            <div className="flex flex-col items-center">
                              <span className="text-zinc-200 font-semibold tabular-nums">{currencySign}{item.putLtp.toFixed(2)}</span>
                              <span className={`text-[9px] font-bold ${item.putChange >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
                                {item.putChange >= 0 ? "+" : ""}{item.putChange.toFixed(2)}%
                              </span>
                            </div>
                          </div>
                        </React.Fragment>
                      );
                    })}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </motion.div>
    </AnimatePresence>
  );
}
