/**
 * Stock Technical Indicator Calculations
 * Real RSI, MACD, EMA, SMA, Bollinger Bands, ATR, Support/Resistance
 */

export interface OHLCV {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface TechnicalIndicators {
  rsi: number;
  macd: { macdLine: number; signalLine: number; histogram: number };
  ema20: number;
  sma50: number;
  sma200: number;
  bollingerBands: { upper: number; middle: number; lower: number };
  atr: number;
  volume: number;
  avgVolume: number;
  trend: string;
}

export interface TradingSignals {
  recommendation: 'STRONG_BUY' | 'BUY' | 'HOLD' | 'SELL' | 'STRONG_SELL';
  buyScore: number;
  sellScore: number;
  holdScore: number;
  confidenceScore: number;
  riskScore: number;
  stopLoss: number;
  profitTarget: number;
  supportLevels: number[];
  resistanceLevels: number[];
  reasoning: string;
}

export function formatPreciseNumber(val: number): number {
  if (val === undefined || val === null || isNaN(val)) return 0;
  const abs = Math.abs(val);
  if (abs >= 100) return parseFloat(val.toFixed(2));
  if (abs >= 1) return parseFloat(val.toFixed(3));
  if (abs >= 0.01) return parseFloat(val.toFixed(4));
  return parseFloat(val.toFixed(6));
}

// ─── Simple Moving Average ──────────────────────────────────

export function calcSMA(closes: number[], period: number): number {
  if (closes.length < period) return closes[closes.length - 1] || 0;
  const slice = closes.slice(-period);
  return slice.reduce((sum, v) => sum + v, 0) / period;
}

// ─── Exponential Moving Average ─────────────────────────────

export function calcEMA(closes: number[], period: number): number {
  if (closes.length === 0) return 0;
  if (closes.length < period) return calcSMA(closes, closes.length);

  const k = 2 / (period + 1);
  let ema = calcSMA(closes.slice(0, period), period);

  for (let i = period; i < closes.length; i++) {
    ema = closes[i] * k + ema * (1 - k);
  }
  return ema;
}

// Full EMA series (returns array of EMA values)
export function calcEMASeries(closes: number[], period: number): number[] {
  if (closes.length === 0) return [];
  const k = 2 / (period + 1);
  const result: number[] = [];

  // Start with SMA for first `period` values
  let ema = calcSMA(closes.slice(0, period), period);
  for (let i = 0; i < period; i++) {
    result.push(ema);
  }

  for (let i = period; i < closes.length; i++) {
    ema = closes[i] * k + ema * (1 - k);
    result.push(ema);
  }
  return result;
}

// ─── RSI (Relative Strength Index) ─────────────────────────

export function calcRSI(closes: number[], period: number = 14): number {
  if (closes.length < period + 1) return 50; // neutral default

  const changes: number[] = [];
  for (let i = 1; i < closes.length; i++) {
    changes.push(closes[i] - closes[i - 1]);
  }

  // Initial average gain/loss
  let avgGain = 0;
  let avgLoss = 0;
  for (let i = 0; i < period; i++) {
    if (changes[i] > 0) avgGain += changes[i];
    else avgLoss += Math.abs(changes[i]);
  }
  avgGain /= period;
  avgLoss /= period;

  // Smoothed RSI using Wilder's method
  for (let i = period; i < changes.length; i++) {
    const change = changes[i];
    avgGain = (avgGain * (period - 1) + (change > 0 ? change : 0)) / period;
    avgLoss = (avgLoss * (period - 1) + (change < 0 ? Math.abs(change) : 0)) / period;
  }

  if (avgLoss === 0) return 100;
  const rs = avgGain / avgLoss;
  return 100 - (100 / (1 + rs));
}

// ─── MACD (Moving Average Convergence Divergence) ──────────

export function calcMACD(closes: number[], fastPeriod = 12, slowPeriod = 26, signalPeriod = 9) {
  const emaFast = calcEMASeries(closes, fastPeriod);
  const emaSlow = calcEMASeries(closes, slowPeriod);

  // MACD line = Fast EMA - Slow EMA
  const macdLine: number[] = [];
  for (let i = 0; i < closes.length; i++) {
    macdLine.push((emaFast[i] || 0) - (emaSlow[i] || 0));
  }

  // Signal line = 9-period EMA of MACD line
  const signalValues = calcEMASeries(macdLine.slice(slowPeriod - 1), signalPeriod);

  const lastMACD = macdLine[macdLine.length - 1] || 0;
  const lastSignal = signalValues[signalValues.length - 1] || 0;

  return {
    macdLine: parseFloat(lastMACD.toFixed(4)),
    signalLine: parseFloat(lastSignal.toFixed(4)),
    histogram: parseFloat((lastMACD - lastSignal).toFixed(4)),
  };
}

// ─── Bollinger Bands ────────────────────────────────────────

export function calcBollingerBands(closes: number[], period = 20, multiplier = 2) {
  const sma = calcSMA(closes, period);
  const slice = closes.slice(-period);
  const variance = slice.reduce((sum, v) => sum + Math.pow(v - sma, 2), 0) / period;
  const stdDev = Math.sqrt(variance);

  return {
    upper: formatPreciseNumber(sma + multiplier * stdDev),
    middle: formatPreciseNumber(sma),
    lower: formatPreciseNumber(sma - multiplier * stdDev),
  };
}

// ─── ATR (Average True Range) ───────────────────────────────

export function calcATR(candles: OHLCV[], period = 14): number {
  if (candles.length < 2) return 0;

  const trueRanges: number[] = [];
  for (let i = 1; i < candles.length; i++) {
    const high = candles[i].high;
    const low = candles[i].low;
    const prevClose = candles[i - 1].close;
    const tr = Math.max(high - low, Math.abs(high - prevClose), Math.abs(low - prevClose));
    trueRanges.push(tr);
  }

  if (trueRanges.length < period) {
    return trueRanges.reduce((s, v) => s + v, 0) / trueRanges.length;
  }

  // Wilder's smoothing
  let atr = trueRanges.slice(0, period).reduce((s, v) => s + v, 0) / period;
  for (let i = period; i < trueRanges.length; i++) {
    atr = (atr * (period - 1) + trueRanges[i]) / period;
  }
  return atr;
}

// ─── Support / Resistance Detection ────────────────────────

export function detectSupportResistance(candles: OHLCV[], currentPrice: number): { support: number[]; resistance: number[] } {
  const support: number[] = [];
  const resistance: number[] = [];

  // Find local min/max from the last 60 candles
  const recent = candles.slice(-60);

  for (let i = 2; i < recent.length - 2; i++) {
    const low = recent[i].low;
    const high = recent[i].high;

    // Local minimum (support)
    if (low < recent[i - 1].low && low < recent[i - 2].low &&
        low < recent[i + 1].low && low < recent[i + 2].low) {
      if (low < currentPrice) {
        support.push(formatPreciseNumber(low));
      }
    }

    // Local maximum (resistance)
    if (high > recent[i - 1].high && high > recent[i - 2].high &&
        high > recent[i + 1].high && high > recent[i + 2].high) {
      if (high > currentPrice) {
        resistance.push(formatPreciseNumber(high));
      }
    }
  }

  // Deduplicate close levels (within 1% of each other)
  const dedup = (levels: number[]) => {
    const sorted = [...new Set(levels)].sort((a, b) => a - b);
    const result: number[] = [];
    for (const level of sorted) {
      if (result.length === 0 || Math.abs(level - result[result.length - 1]) / result[result.length - 1] > 0.01) {
        result.push(level);
      }
    }
    return result;
  };

  return {
    support: dedup(support).slice(-3), // closest 3 support levels
    resistance: dedup(resistance).slice(0, 3), // closest 3 resistance levels
  };
}

// ─── Generate Trading Signals ──────────────────────────────

export function generateTradingSignals(
  currentPrice: number,
  indicators: TechnicalIndicators,
  supportResistance: { support: number[]; resistance: number[] }
): TradingSignals {
  let buyScore = 0;
  let sellScore = 0;
  let signals: string[] = [];

  // RSI signals
  if (indicators.rsi < 30) { buyScore += 25; signals.push('RSI oversold (<30) — strong buy signal'); }
  else if (indicators.rsi < 40) { buyScore += 15; signals.push('RSI approaching oversold — moderate buy'); }
  else if (indicators.rsi > 70) { sellScore += 25; signals.push('RSI overbought (>70) — strong sell signal'); }
  else if (indicators.rsi > 60) { sellScore += 10; signals.push('RSI elevated — caution'); }
  else { buyScore += 5; sellScore += 5; signals.push('RSI neutral zone'); }

  // MACD signals
  if (indicators.macd.histogram > 0 && indicators.macd.macdLine > indicators.macd.signalLine) {
    buyScore += 20;
    signals.push('MACD bullish crossover — upward momentum');
  } else if (indicators.macd.histogram < 0 && indicators.macd.macdLine < indicators.macd.signalLine) {
    sellScore += 20;
    signals.push('MACD bearish crossover — downward momentum');
  } else {
    buyScore += 5; sellScore += 5;
  }

  // Price vs Moving Averages
  if (currentPrice > indicators.ema20 && currentPrice > indicators.sma50) {
    buyScore += 15;
    signals.push('Price above EMA(20) & SMA(50) — bullish trend');
  } else if (currentPrice < indicators.ema20 && currentPrice < indicators.sma50) {
    sellScore += 15;
    signals.push('Price below EMA(20) & SMA(50) — bearish trend');
  }

  // Golden/Death cross (SMA50 vs SMA200)
  if (indicators.sma50 > indicators.sma200 && indicators.sma200 > 0) {
    buyScore += 10;
    signals.push('Golden Cross (SMA50 > SMA200) — long-term bullish');
  } else if (indicators.sma50 < indicators.sma200 && indicators.sma200 > 0) {
    sellScore += 10;
    signals.push('Death Cross (SMA50 < SMA200) — long-term bearish');
  }

  // Bollinger Bands
  if (currentPrice <= indicators.bollingerBands.lower) {
    buyScore += 15;
    signals.push('Price at lower Bollinger Band — potential bounce');
  } else if (currentPrice >= indicators.bollingerBands.upper) {
    sellScore += 15;
    signals.push('Price at upper Bollinger Band — potential pullback');
  }

  // Normalize scores
  const total = buyScore + sellScore || 1;
  buyScore = Math.round((buyScore / total) * 100);
  sellScore = Math.round((sellScore / total) * 100);
  const holdScore = Math.max(0, 100 - Math.abs(buyScore - sellScore));

  // Determine recommendation
  let recommendation: TradingSignals['recommendation'];
  if (buyScore >= 75) recommendation = 'STRONG_BUY';
  else if (buyScore >= 55) recommendation = 'BUY';
  else if (sellScore >= 75) recommendation = 'STRONG_SELL';
  else if (sellScore >= 55) recommendation = 'SELL';
  else recommendation = 'HOLD';

  // Stop Loss & Profit Target using ATR
  const atrMultiplier = 2;
  const stopLoss = formatPreciseNumber(currentPrice - indicators.atr * atrMultiplier);
  const profitTarget = formatPreciseNumber(currentPrice + indicators.atr * atrMultiplier * 1.5);

  // Use support level if closer
  const closestSupport = supportResistance.support[supportResistance.support.length - 1];
  const finalStopLoss = closestSupport && closestSupport > stopLoss
    ? formatPreciseNumber(closestSupport * 0.99)  // just below support
    : stopLoss;

  // Use resistance level if closer
  const closestResistance = supportResistance.resistance[0];
  const finalProfitTarget = closestResistance && closestResistance < profitTarget
    ? formatPreciseNumber(closestResistance * 0.99)
    : profitTarget;

  // Confidence & Risk
  const confidenceScore = Math.min(95, Math.max(30, Math.abs(buyScore - sellScore) + 40));
  const riskScore = indicators.rsi > 70 || indicators.rsi < 30
    ? Math.min(90, Math.round(indicators.atr / currentPrice * 1000 + 40))
    : Math.min(70, Math.round(indicators.atr / currentPrice * 1000 + 20));

  const reasoning = signals.join('\n• ');

  return {
    recommendation,
    buyScore,
    sellScore,
    holdScore,
    confidenceScore,
    riskScore,
    stopLoss: finalStopLoss,
    profitTarget: finalProfitTarget,
    supportLevels: supportResistance.support,
    resistanceLevels: supportResistance.resistance,
    reasoning: `• ${reasoning}`,
  };
}

// ─── Per-Candle Buy / Sell Signal Detection ─────────────────

export interface CandleSignal {
  date: string;
  type: 'BUY' | 'SELL';
  label: string;   // short reason (e.g. "Bullish Engulfing")
  score: number;    // signal strength 1-100
}

/**
 * Scan through candles and detect actionable buy/sell patterns.
 * Returns an array of signals positioned at the candle where they triggered.
 */
export function generateCandleSignals(candles: OHLCV[]): CandleSignal[] {
  if (candles.length < 30) return []; // need enough history

  const signals: CandleSignal[] = [];
  const closes = candles.map(c => c.close);

  // Pre-compute rolling RSI series
  const rsiSeries = computeRSISeries(closes, 14);

  // Pre-compute MACD histogram series
  const macdSeries = computeMACDHistogramSeries(closes);

  // Pre-compute Bollinger Bands series
  const bbSeries = computeBollingerSeries(closes, 20, 2);

  for (let i = 2; i < candles.length; i++) {
    const curr = candles[i];
    const prev = candles[i - 1];
    const prev2 = candles[i - 2];
    const body = curr.close - curr.open;
    const absBody = Math.abs(body);
    const prevBody = prev.close - prev.open;
    const absPrevBody = Math.abs(prevBody);
    const range = curr.high - curr.low;
    const isBullish = body > 0;
    const isPrevBullish = prevBody > 0;

    let buyScore = 0;
    let sellScore = 0;
    let buyLabels: string[] = [];
    let sellLabels: string[] = [];

    // ── Candlestick Pattern Detection ──────────────────────

    // Bullish Engulfing: previous red candle fully engulfed by current green
    if (isBullish && !isPrevBullish && curr.open <= prev.close && curr.close >= prev.open && absBody > absPrevBody * 0.8) {
      buyScore += 30;
      buyLabels.push('Bullish Engulfing');
    }

    // Bearish Engulfing: previous green candle fully engulfed by current red
    if (!isBullish && isPrevBullish && curr.open >= prev.close && curr.close <= prev.open && absBody > absPrevBody * 0.8) {
      sellScore += 30;
      sellLabels.push('Bearish Engulfing');
    }

    // Hammer (bullish): small body at top, long lower shadow, short upper shadow
    if (range > 0) {
      const lowerShadow = Math.min(curr.open, curr.close) - curr.low;
      const upperShadow = curr.high - Math.max(curr.open, curr.close);
      if (lowerShadow > absBody * 2 && upperShadow < absBody * 0.5 && absBody > 0) {
        // Confirm downtrend context (prev 3 candles declining)
        if (i >= 3 && candles[i - 1].close < candles[i - 2].close && candles[i - 2].close < candles[i - 3].close) {
          buyScore += 25;
          buyLabels.push('Hammer');
        }
      }

      // Shooting Star (bearish): small body at bottom, long upper shadow
      if (upperShadow > absBody * 2 && lowerShadow < absBody * 0.5 && absBody > 0) {
        // Confirm uptrend context
        if (i >= 3 && candles[i - 1].close > candles[i - 2].close && candles[i - 2].close > candles[i - 3].close) {
          sellScore += 25;
          sellLabels.push('Shooting Star');
        }
      }
    }

    // Morning Star (bullish 3-candle): big red → small body → big green
    if (i >= 2) {
      const body2 = prev2.close - prev2.open;
      const absBody2 = Math.abs(body2);
      if (body2 < 0 && absBody2 > 0 && absPrevBody < absBody2 * 0.3 && isBullish && absBody > absBody2 * 0.5) {
        buyScore += 20;
        buyLabels.push('Morning Star');
      }

      // Evening Star (bearish 3-candle): big green → small body → big red
      if (body2 > 0 && absBody2 > 0 && absPrevBody < absBody2 * 0.3 && !isBullish && absBody > absBody2 * 0.5) {
        sellScore += 20;
        sellLabels.push('Evening Star');
      }
    }

    // ── Technical Indicator Confluence ──────────────────────

    // RSI signals
    const rsi = rsiSeries[i];
    const prevRsi = rsiSeries[i - 1];
    if (rsi !== undefined && prevRsi !== undefined) {
      // RSI crossing up from oversold
      if (prevRsi < 30 && rsi >= 30) {
        buyScore += 25;
        buyLabels.push('RSI Oversold Bounce');
      }
      // RSI crossing down from overbought
      if (prevRsi > 70 && rsi <= 70) {
        sellScore += 25;
        sellLabels.push('RSI Overbought Drop');
      }
    }

    // MACD histogram crossover
    const macdHist = macdSeries[i];
    const prevMacdHist = macdSeries[i - 1];
    if (macdHist !== undefined && prevMacdHist !== undefined) {
      // MACD histogram turning positive (bullish crossover)
      if (prevMacdHist < 0 && macdHist >= 0) {
        buyScore += 20;
        buyLabels.push('MACD Bullish Cross');
      }
      // MACD histogram turning negative (bearish crossover)
      if (prevMacdHist > 0 && macdHist <= 0) {
        sellScore += 20;
        sellLabels.push('MACD Bearish Cross');
      }
    }

    // Bollinger Band signals
    const bb = bbSeries[i];
    if (bb) {
      // Price touching/crossing below lower band → potential buy
      if (curr.close <= bb.lower && isBullish) {
        buyScore += 15;
        buyLabels.push('BB Lower Bounce');
      }
      // Price touching/crossing above upper band → potential sell
      if (curr.close >= bb.upper && !isBullish) {
        sellScore += 15;
        sellLabels.push('BB Upper Rejection');
      }
    }

    // ── Emit signal if strong enough ───────────────────────
    // Require minimum score of 30 and at least 2 confirming factors to reduce noise
    if (buyScore >= 30 && buyLabels.length >= 1 && buyScore > sellScore) {
      signals.push({
        date: curr.date,
        type: 'BUY',
        label: buyLabels.join(' + '),
        score: Math.min(100, buyScore),
      });
    } else if (sellScore >= 30 && sellLabels.length >= 1 && sellScore > buyScore) {
      signals.push({
        date: curr.date,
        type: 'SELL',
        label: sellLabels.join(' + '),
        score: Math.min(100, sellScore),
      });
    }
  }

  // Deduplicate: keep max 1 signal per 3-day window (keep highest score)
  return deduplicateSignals(signals);
}

// ─── Helper: RSI series (per-candle) ────────────────────────

function computeRSISeries(closes: number[], period: number = 14): (number | undefined)[] {
  const result: (number | undefined)[] = new Array(closes.length).fill(undefined);
  if (closes.length < period + 1) return result;

  const changes: number[] = [];
  for (let i = 1; i < closes.length; i++) {
    changes.push(closes[i] - closes[i - 1]);
  }

  let avgGain = 0, avgLoss = 0;
  for (let i = 0; i < period; i++) {
    if (changes[i] > 0) avgGain += changes[i];
    else avgLoss += Math.abs(changes[i]);
  }
  avgGain /= period;
  avgLoss /= period;

  result[period] = avgLoss === 0 ? 100 : 100 - (100 / (1 + avgGain / avgLoss));

  for (let i = period; i < changes.length; i++) {
    const change = changes[i];
    avgGain = (avgGain * (period - 1) + (change > 0 ? change : 0)) / period;
    avgLoss = (avgLoss * (period - 1) + (change < 0 ? Math.abs(change) : 0)) / period;
    result[i + 1] = avgLoss === 0 ? 100 : 100 - (100 / (1 + avgGain / avgLoss));
  }

  return result;
}

// ─── Helper: MACD histogram series ──────────────────────────

function computeMACDHistogramSeries(closes: number[], fast = 12, slow = 26, signal = 9): (number | undefined)[] {
  const result: (number | undefined)[] = new Array(closes.length).fill(undefined);
  if (closes.length < slow + signal) return result;

  const emaFast = calcEMASeries(closes, fast);
  const emaSlow = calcEMASeries(closes, slow);

  const macdLine: number[] = [];
  for (let i = 0; i < closes.length; i++) {
    macdLine.push((emaFast[i] || 0) - (emaSlow[i] || 0));
  }

  const signalLine = calcEMASeries(macdLine.slice(slow - 1), signal);

  for (let i = slow - 1; i < closes.length; i++) {
    const sIdx = i - (slow - 1);
    if (sIdx < signalLine.length) {
      result[i] = macdLine[i] - signalLine[sIdx];
    }
  }

  return result;
}

// ─── Helper: Bollinger Bands series ─────────────────────────

function computeBollingerSeries(closes: number[], period = 20, multiplier = 2): ({ upper: number; lower: number } | undefined)[] {
  const result: ({ upper: number; lower: number } | undefined)[] = new Array(closes.length).fill(undefined);
  if (closes.length < period) return result;

  for (let i = period - 1; i < closes.length; i++) {
    const slice = closes.slice(i - period + 1, i + 1);
    const sma = slice.reduce((s, v) => s + v, 0) / period;
    const variance = slice.reduce((s, v) => s + Math.pow(v - sma, 2), 0) / period;
    const stdDev = Math.sqrt(variance);
    result[i] = {
      upper: sma + multiplier * stdDev,
      lower: sma - multiplier * stdDev,
    };
  }

  return result;
}

// ─── Helper: Deduplicate signals within 3-day windows ───────

function deduplicateSignals(signals: CandleSignal[]): CandleSignal[] {
  if (signals.length === 0) return [];
  const sorted = [...signals].sort((a, b) => a.date.localeCompare(b.date));
  const result: CandleSignal[] = [sorted[0]];

  for (let i = 1; i < sorted.length; i++) {
    const last = result[result.length - 1];
    const dayDiff = Math.abs(new Date(sorted[i].date).getTime() - new Date(last.date).getTime()) / (1000 * 60 * 60 * 24);

    if (dayDiff < 3 && sorted[i].type === last.type) {
      // Keep higher score
      if (sorted[i].score > last.score) {
        result[result.length - 1] = sorted[i];
      }
    } else {
      result.push(sorted[i]);
    }
  }

  return result;
}
