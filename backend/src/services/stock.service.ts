import { PrismaClient } from '@prisma/client';
import { aiRouter } from './ai/provider';
import logger from '../utils/logger';
import {
  OHLCV,
  TechnicalIndicators,
  TradingSignals,
  calcRSI,
  calcMACD,
  calcEMA,
  calcSMA,
  calcBollingerBands,
  calcATR,
  detectSupportResistance,
  generateTradingSignals,
  generateCandleSignals,
  formatPreciseNumber,
} from './stock.utils';

const prisma = new PrismaClient();

// ─── Yahoo Finance Helper ──────────────────────────────────
import YahooFinance from 'yahoo-finance2';

const yahooFinance = new (YahooFinance as any)({ suppressNotices: ['yahooSurvey'] });

async function getYahoo() {
  return yahooFinance;
}

// ─── Curated High-Volume Alias Map for Indian, Global & Crypto Symbols ───
export const POPULAR_STOCK_MAP: Array<{
  keywords: string[];
  symbol: string;
  name: string;
  exchange: string;
  type: string;
}> = [
  // Indian Giants (NSE / BSE)
  { keywords: ['RELIANCE', 'RELIANCE INDUSTRIES', 'RIL'], symbol: 'RELIANCE.NS', name: 'Reliance Industries Ltd', exchange: 'NSE', type: 'EQUITY' },
  { keywords: ['TATAMOTORS', 'TATA MOTORS', 'TMPV', 'TMCV'], symbol: 'TMCV.NS', name: 'Tata Motors Limited', exchange: 'NSE', type: 'EQUITY' },
  { keywords: ['SBIN', 'SBI', 'STATE BANK OF INDIA'], symbol: 'SBIN.NS', name: 'State Bank of India', exchange: 'NSE', type: 'EQUITY' },
  { keywords: ['INFY', 'INFOSYS'], symbol: 'INFY.NS', name: 'Infosys Limited', exchange: 'NSE', type: 'EQUITY' },
  { keywords: ['TCS', 'TATA CONSULTANCY SERVICES'], symbol: 'TCS.NS', name: 'Tata Consultancy Services Ltd', exchange: 'NSE', type: 'EQUITY' },
  { keywords: ['HDFCBANK', 'HDFC', 'HDFC BANK'], symbol: 'HDFCBANK.NS', name: 'HDFC Bank Ltd', exchange: 'NSE', type: 'EQUITY' },
  { keywords: ['ICICIBANK', 'ICICI', 'ICICI BANK'], symbol: 'ICICIBANK.NS', name: 'ICICI Bank Ltd', exchange: 'NSE', type: 'EQUITY' },
  { keywords: ['WIPRO'], symbol: 'WIPRO.NS', name: 'Wipro Limited', exchange: 'NSE', type: 'EQUITY' },
  { keywords: ['ITC'], symbol: 'ITC.NS', name: 'ITC Limited', exchange: 'NSE', type: 'EQUITY' },
  { keywords: ['LT', 'LARSEN', 'L&T', 'LARSEN & TOUBRO'], symbol: 'LT.NS', name: 'Larsen & Toubro Ltd', exchange: 'NSE', type: 'EQUITY' },
  { keywords: ['ZOMATO', 'ETERNAL'], symbol: 'ETERNAL.NS', name: 'Eternal Ltd (Zomato)', exchange: 'NSE', type: 'EQUITY' },
  { keywords: ['PAYTM', 'ONE 97'], symbol: 'PAYTM.NS', name: 'One 97 Communications (Paytm)', exchange: 'NSE', type: 'EQUITY' },
  { keywords: ['BHARTIARTL', 'AIRTEL'], symbol: 'BHARTIARTL.NS', name: 'Bharti Airtel Ltd', exchange: 'NSE', type: 'EQUITY' },
  { keywords: ['ADANIENT', 'ADANI', 'ADANI ENTERPRISES'], symbol: 'ADANIENT.NS', name: 'Adani Enterprises Ltd', exchange: 'NSE', type: 'EQUITY' },
  { keywords: ['MARUTI', 'SUZUKI'], symbol: 'MARUTI.NS', name: 'Maruti Suzuki India Ltd', exchange: 'NSE', type: 'EQUITY' },
  { keywords: ['BAJFINANCE', 'BAJAJ FINANCE'], symbol: 'BAJFINANCE.NS', name: 'Bajaj Finance Ltd', exchange: 'NSE', type: 'EQUITY' },
  { keywords: ['KOTAKBANK', 'KOTAK'], symbol: 'KOTAKBANK.NS', name: 'Kotak Mahindra Bank Ltd', exchange: 'NSE', type: 'EQUITY' },
  { keywords: ['AXISBANK', 'AXIS'], symbol: 'AXISBANK.NS', name: 'Axis Bank Ltd', exchange: 'NSE', type: 'EQUITY' },
  { keywords: ['HAL', 'HINDUSTAN AERONAUTICS'], symbol: 'HAL.NS', name: 'Hindustan Aeronautics Ltd', exchange: 'NSE', type: 'EQUITY' },
  { keywords: ['BEL', 'BHARAT ELECTRONICS'], symbol: 'BEL.NS', name: 'Bharat Electronics Ltd', exchange: 'NSE', type: 'EQUITY' },
  { keywords: ['COALINDIA', 'COAL INDIA'], symbol: 'COALINDIA.NS', name: 'Coal India Ltd', exchange: 'NSE', type: 'EQUITY' },
  { keywords: ['JIOFIN', 'JIO FINANCIAL'], symbol: 'JIOFIN.NS', name: 'Jio Financial Services Ltd', exchange: 'NSE', type: 'EQUITY' },
  { keywords: ['TATASTEEL', 'TATA STEEL'], symbol: 'TATASTEEL.NS', name: 'Tata Steel Ltd', exchange: 'NSE', type: 'EQUITY' },
  { keywords: ['TATAPOWER', 'TATA POWER'], symbol: 'TATAPOWER.NS', name: 'Tata Power Co Ltd', exchange: 'NSE', type: 'EQUITY' },
  { keywords: ['TITAN'], symbol: 'TITAN.NS', name: 'Titan Company Ltd', exchange: 'NSE', type: 'EQUITY' },
  { keywords: ['ASIANPAINT', 'ASIAN PAINTS'], symbol: 'ASIANPAINT.NS', name: 'Asian Paints Ltd', exchange: 'NSE', type: 'EQUITY' },
  { keywords: ['SUNPHARMA', 'SUN PHARMA'], symbol: 'SUNPHARMA.NS', name: 'Sun Pharmaceutical Industries Ltd', exchange: 'NSE', type: 'EQUITY' },
  
  // Indices
  { keywords: ['NIFTY', 'NIFTY 50', 'NIFTY50'], symbol: '^NSEI', name: 'NIFTY 50 Index', exchange: 'NSE', type: 'INDEX' },
  { keywords: ['BANKNIFTY', 'BANK NIFTY'], symbol: '^NSEBANK', name: 'NIFTY Bank Index', exchange: 'NSE', type: 'INDEX' },
  { keywords: ['SENSEX'], symbol: '^BSESN', name: 'S&P BSE SENSEX', exchange: 'BSE', type: 'INDEX' },
  
  // US & Global Giants
  { keywords: ['APPLE', 'AAPL'], symbol: 'AAPL', name: 'Apple Inc.', exchange: 'NASDAQ', type: 'EQUITY' },
  { keywords: ['TESLA', 'TSLA'], symbol: 'TSLA', name: 'Tesla, Inc.', exchange: 'NASDAQ', type: 'EQUITY' },
  { keywords: ['MICROSOFT', 'MSFT'], symbol: 'MSFT', name: 'Microsoft Corporation', exchange: 'NASDAQ', type: 'EQUITY' },
  { keywords: ['NVIDIA', 'NVDA'], symbol: 'NVDA', name: 'NVIDIA Corporation', exchange: 'NASDAQ', type: 'EQUITY' },
  { keywords: ['AMAZON', 'AMZN'], symbol: 'AMZN', name: 'Amazon.com, Inc.', exchange: 'NASDAQ', type: 'EQUITY' },
  { keywords: ['GOOGLE', 'GOOGL', 'ALPHABET'], symbol: 'GOOGL', name: 'Alphabet Inc.', exchange: 'NASDAQ', type: 'EQUITY' },
  { keywords: ['META', 'FACEBOOK'], symbol: 'META', name: 'Meta Platforms, Inc.', exchange: 'NASDAQ', type: 'EQUITY' },
  { keywords: ['NETFLIX', 'NFLX'], symbol: 'NFLX', name: 'Netflix, Inc.', exchange: 'NASDAQ', type: 'EQUITY' },
  { keywords: ['AMD'], symbol: 'AMD', name: 'Advanced Micro Devices, Inc.', exchange: 'NASDAQ', type: 'EQUITY' },

  // Crypto & Commodities
  { keywords: ['BITCOIN', 'BTC'], symbol: 'BTC-USD', name: 'Bitcoin USD', exchange: 'CRYPTO', type: 'CRYPTO' },
  { keywords: ['ETHEREUM', 'ETH'], symbol: 'ETH-USD', name: 'Ethereum USD', exchange: 'CRYPTO', type: 'CRYPTO' },
  { keywords: ['SOLANA', 'SOL'], symbol: 'SOL-USD', name: 'Solana USD', exchange: 'CRYPTO', type: 'CRYPTO' },
  { keywords: ['GOLD'], symbol: 'GC=F', name: 'Gold Futures', exchange: 'COMMODITY', type: 'COMMODITY' },
  { keywords: ['CRUDE', 'OIL'], symbol: 'CL=F', name: 'Crude Oil Futures', exchange: 'COMMODITY', type: 'COMMODITY' },
];

// ─── Fetch Real Quote ──────────────────────────────────────
const quoteCache = new Map<string, { data: any; timestamp: number }>();
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

export async function fetchRealQuote(symbol: string): Promise<{
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
  name: string;
  exchange: string;
  currency: string;
}> {
  const cleanSym = symbol.toUpperCase().trim();
  const cached = quoteCache.get(cleanSym);
  const now = Date.now();
  if (cached && (now - cached.timestamp < CACHE_TTL_MS)) {
    return cached.data;
  }

  const yf = await getYahoo();
  let quote: any = null;

  try {
    quote = await yf.quote(cleanSym);
  } catch (quoteErr: any) {
    logger.warn(`Direct quote fetch failed for ${cleanSym}, attempting chart meta fallback: ${quoteErr.message}`);
    try {
      const chartData: any = await yf.chart(cleanSym, { period1: getStartDate('5d'), interval: '1d' });
      if (chartData && chartData.meta) {
        const meta = chartData.meta;
        const lastQuote = chartData.quotes?.[chartData.quotes.length - 1] || {};
        const prevClose = meta.previousClose || meta.chartPreviousClose || lastQuote.close || 0;
        const currentPrice = meta.regularMarketPrice || lastQuote.close || 0;
        const change = currentPrice - prevClose;
        const changePercent = prevClose > 0 ? (change / prevClose) * 100 : 0;

        quote = {
          regularMarketPrice: currentPrice,
          regularMarketChange: change,
          regularMarketChangePercent: changePercent,
          regularMarketDayHigh: meta.regularMarketDayHigh || lastQuote.high || currentPrice,
          regularMarketDayLow: meta.regularMarketDayLow || lastQuote.low || currentPrice,
          regularMarketVolume: meta.regularMarketVolume || lastQuote.volume || 0,
          averageDailyVolume3Month: meta.regularMarketVolume || 0,
          marketCap: 0,
          trailingPE: 0,
          fiftyTwoWeekHigh: meta.fiftyTwoWeekHigh || currentPrice,
          fiftyTwoWeekLow: meta.fiftyTwoWeekLow || currentPrice,
          shortName: meta.shortName || cleanSym,
          fullExchangeName: meta.exchangeName || '',
          currency: meta.currency || 'INR',
        };
      }
    } catch (chartErr: any) {
      logger.error(`Chart fallback also failed for ${cleanSym}: ${chartErr.message}`);
    }
  }

  if (!quote || quote.regularMarketPrice === undefined || quote.regularMarketPrice === null) {
    throw new Error(`Quote data not available for ${cleanSym}`);
  }

  const result = {
    price: quote.regularMarketPrice || 0,
    change: quote.regularMarketChange || 0,
    changePercent: quote.regularMarketChangePercent || 0,
    dayHigh: quote.regularMarketDayHigh || 0,
    dayLow: quote.regularMarketDayLow || 0,
    volume: quote.regularMarketVolume || 0,
    avgVolume: quote.averageDailyVolume3Month || quote.averageDailyVolume10Day || 0,
    marketCap: quote.marketCap || 0,
    pe: quote.trailingPE || 0,
    week52High: quote.fiftyTwoWeekHigh || 0,
    week52Low: quote.fiftyTwoWeekLow || 0,
    name: quote.shortName || quote.longName || cleanSym,
    exchange: quote.fullExchangeName || quote.exchange || '',
    currency: quote.currency || 'USD',
  };

  quoteCache.set(cleanSym, { data: result, timestamp: now });
  return result;
}

// ─── Fetch Historical Candles ──────────────────────────────

export async function fetchHistoricalCandles(
  symbol: string,
  period: '5d' | '1mo' | '3mo' | '6mo' | '1y' = '6mo',
  interval: '1d' | '5m' | '15m' | '1h' = '1d'
): Promise<OHLCV[]> {
  const yf = await getYahoo();
  let result: any = null;

  try {
    result = await yf.chart(symbol, {
      period1: getStartDate(period),
      interval: interval,
    });
  } catch (err: any) {
    logger.warn(`Chart fetch failed for ${symbol} with interval ${interval}: ${err.message}. Retrying with daily interval...`);
    if (interval !== '1d') {
      result = await yf.chart(symbol, {
        period1: getStartDate('6mo'),
        interval: '1d',
      });
    } else {
      throw err;
    }
  }

  if (!result?.quotes || result.quotes.length === 0) {
    throw new Error(`No historical data found for ${symbol}`);
  }

  let mapped = result.quotes
    .filter((q: any) => q.open != null && q.close != null && q.high != null && q.low != null)
    .map((q: any) => ({
      date: interval === '1d' 
        ? new Date(q.date).toISOString().split('T')[0] 
        : new Date(q.date).toISOString(), // Return full timestamp for intraday mapping
      open: formatPreciseNumber(q.open),
      high: formatPreciseNumber(q.high),
      low: formatPreciseNumber(q.low),
      close: formatPreciseNumber(q.close),
      volume: q.volume || 0,
    }));

  if (interval !== '1d') {
    const isIndia = symbol.toUpperCase().endsWith('.NS') || symbol.toUpperCase().endsWith('.BO');
    const timeZone = isIndia ? 'Asia/Kolkata' : 'America/New_York';
    const startHour = isIndia ? 915 : 930;
    const endHour = isIndia ? 1530 : 1600;

    mapped = mapped.filter((q: any) => {
      const marketTime = new Date(new Date(q.date).toLocaleString('en-US', { timeZone }));
      const timeVal = marketTime.getHours() * 100 + marketTime.getMinutes();
      return timeVal >= startHour && timeVal <= endHour;
    });
  }

  return mapped;
}

function getStartDate(period: string): string {
  const now = new Date();
  switch (period) {
    case '5d': now.setDate(now.getDate() - 5); break;
    case '1mo': now.setMonth(now.getMonth() - 1); break;
    case '3mo': now.setMonth(now.getMonth() - 3); break;
    case '6mo': now.setMonth(now.getMonth() - 6); break;
    case '1y': now.setFullYear(now.getFullYear() - 1); break;
  }
  return now.toISOString().split('T')[0];
}

// ─── Calculate All Technical Indicators ────────────────────

export function calculateIndicators(candles: OHLCV[]): TechnicalIndicators {
  const closes = candles.map(c => c.close);
  const volumes = candles.map(c => c.volume);

  const rsi = calcRSI(closes, 14);
  const macd = calcMACD(closes, 12, 26, 9);
  const ema20 = calcEMA(closes, 20);
  const sma50 = calcSMA(closes, 50);
  const sma200 = calcSMA(closes, 200);
  const bollingerBands = calcBollingerBands(closes, 20, 2);
  const atr = calcATR(candles, 14);

  const currentVol = volumes[volumes.length - 1] || 0;
  const avgVol = volumes.length > 0
    ? Math.round(volumes.slice(-20).reduce((s, v) => s + v, 0) / Math.min(20, volumes.length))
    : 0;

  // Determine trend
  let trend = 'Neutral Consolidation';
  if (rsi > 68 && ema20 > sma50) trend = 'Bullish Breakout';
  else if (rsi > 60) trend = 'Bullish Momentum';
  else if (rsi < 35 && ema20 < sma50) trend = 'Bearish Breakdown';
  else if (rsi < 42) trend = 'Bearish Momentum';
  else if (closes[closes.length - 1] > sma50) trend = 'Mild Bullish';
  else if (closes[closes.length - 1] < sma50) trend = 'Mild Bearish';

  return {
    rsi: parseFloat(rsi.toFixed(2)),
    macd,
    ema20: parseFloat(ema20.toFixed(2)),
    sma50: parseFloat(sma50.toFixed(2)),
    sma200: parseFloat(sma200.toFixed(2)),
    bollingerBands,
    atr: parseFloat(atr.toFixed(2)),
    volume: currentVol,
    avgVolume: avgVol,
    trend,
  };
}

// ─── Stock Service Class ───────────────────────────────────

export class StockService {
  /**
   * Resolve any user query (e.g. "Tesla", "Apple", "Reliance", "Tata Motors", "State Bank of India", "TSLA")
   * into a verified, working ticker symbol (e.g. "TSLA", "AAPL", "RELIANCE.NS", "TATAMOTORS.NS", "SBIN.NS").
   */
  async resolveSymbol(symbolOrQuery: string): Promise<string> {
    if (!symbolOrQuery || !symbolOrQuery.trim()) return symbolOrQuery;

    const clean = symbolOrQuery.trim();
    const cleanUpper = clean.toUpperCase();

    // 1. Check curated Alias Map
    const aliasMatch = POPULAR_STOCK_MAP.find(item =>
      item.keywords.some(k => k === cleanUpper || k === cleanUpper.replace(/\s+/g, ''))
    );
    if (aliasMatch) {
      logger.info(`Resolved stock query "${symbolOrQuery}" via alias map to "${aliasMatch.symbol}" (${aliasMatch.name})`);
      return aliasMatch.symbol;
    }

    // 2. Direct ticker check: If it looks like a symbol format (e.g. TSLA, AAPL, RELIANCE.NS, BTC-USD)
    if (/^[A-Z0-9.\-=:]{1,12}$/.test(cleanUpper)) {
      try {
        const direct = await fetchRealQuote(cleanUpper);
        if (direct && direct.price > 0) {
          return cleanUpper;
        }
      } catch {
        // Direct quote failed — cleanUpper might be an un-suffixed Indian symbol
      }
    }

    // 3. Indian .NS Suffix Fallback (for single word tickers without dot like SBIN, WIPRO, TITAN, MARUTI)
    if (!cleanUpper.includes('.') && /^[A-Z0-9]{2,12}$/.test(cleanUpper)) {
      try {
        const nsSym = `${cleanUpper}.NS`;
        const nsQuote = await fetchRealQuote(nsSym);
        if (nsQuote && nsQuote.price > 0) {
          logger.info(`Resolved un-suffixed ticker "${cleanUpper}" to NSE ticker "${nsSym}"`);
          return nsSym;
        }
      } catch {
        // Fallthrough to search
      }
    }

    // 4. Search query to resolve company name -> ticker symbol
    try {
      const searchResults = await this.searchStocks(clean);
      if (searchResults && searchResults.length > 0) {
        const match = searchResults.find((r: any) => r.symbol && /^[A-Z0-9.\-=:]{1,15}$/.test(r.symbol));
        if (match) {
          logger.info(`Resolved stock query "${symbolOrQuery}" via search to "${match.symbol}" (${match.name})`);
          return match.symbol.toUpperCase();
        }
      }
    } catch (err) {
      logger.warn(`Symbol resolution failed for "${symbolOrQuery}": ${err instanceof Error ? err.message : err}`);
    }

    return cleanUpper;
  }

  /**
   * Get real-time quote for a symbol
   */
  async getQuote(symbol: string) {
    const cleanSym = await this.resolveSymbol(symbol);
    try {
      return await fetchRealQuote(cleanSym);
    } catch (error: any) {
      logger.error(`Failed to fetch quote for ${cleanSym}: ${error.message}`);
      throw new Error(`Could not fetch quote for ${cleanSym}. Verify the ticker symbol.`);
    }
  }

  /**
   * Get real-time quotes for multiple symbols at once
   */
  async getBatchQuotes(symbols: string[]) {
    const resolvedSymbols = await Promise.all(symbols.map(s => this.resolveSymbol(s)));
    const quotes: Record<string, any> = {};
    const symbolsToFetch: string[] = [];
    const now = Date.now();

    // Check cache first
    for (const sym of resolvedSymbols) {
      const cached = quoteCache.get(sym);
      if (cached && (now - cached.timestamp < CACHE_TTL_MS)) {
        quotes[sym] = cached.data;
      } else {
        symbolsToFetch.push(sym);
      }
    }

    if (symbolsToFetch.length > 0) {
      try {
        const url = `https://query1.finance.yahoo.com/v7/finance/quote?symbols=${symbolsToFetch.map(s => encodeURIComponent(s)).join(',')}`;
        const response = await fetch(url, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
          }
        });
        
        if (response.ok) {
          const json = (await response.json()) as any;
          const resultList = json?.quoteResponse?.result || [];
          
          for (const quote of resultList) {
            const sym = quote.symbol.toUpperCase().trim();
            const result = {
              price: quote.regularMarketPrice || 0,
              change: quote.regularMarketChange || 0,
              changePercent: quote.regularMarketChangePercent || 0,
              dayHigh: quote.regularMarketDayHigh || 0,
              dayLow: quote.regularMarketDayLow || 0,
              volume: quote.regularMarketVolume || 0,
              avgVolume: quote.averageDailyVolume3Month || quote.averageDailyVolume10Day || 0,
              marketCap: quote.marketCap || 0,
              pe: quote.trailingPE || 0,
              week52High: quote.fiftyTwoWeekHigh || 0,
              week52Low: quote.fiftyTwoWeekLow || 0,
              name: quote.shortName || quote.longName || sym,
              exchange: quote.fullExchangeName || quote.exchange || '',
              currency: quote.currency || 'USD',
            };
            quoteCache.set(sym, { data: result, timestamp: now });
            quotes[sym] = result;
          }
        } else {
          throw new Error(`Yahoo batch API returned status ${response.status}`);
        }
      } catch (err: any) {
        logger.warn(`Batch quotes fetch failed, falling back to sequential: ${err.message}`);
        // Fallback sequentially
        const results = await Promise.allSettled(
          symbolsToFetch.map(sym => fetchRealQuote(sym))
        );
        results.forEach((result, i) => {
          const sym = symbolsToFetch[i];
          if (result.status === 'fulfilled') {
            quotes[sym] = result.value;
          } else {
            logger.warn(`Failed fallback quote for ${sym}: ${result.reason?.message || 'Unknown error'}`);
            quotes[sym] = null;
          }
        });
      }
    }

    // Ensure all symbols have an entry
    for (const sym of resolvedSymbols) {
      if (!quotes[sym]) quotes[sym] = null;
    }

    return quotes;
  }

  async getChartData(
    symbol: string, 
    period: '5d' | '1mo' | '3mo' | '6mo' | '1y' = '6mo', 
    interval: '1d' | '5m' | '15m' | '1h' = '1d'
  ) {
    const cleanSym = await this.resolveSymbol(symbol);
    try {
      const candles = await fetchHistoricalCandles(cleanSym, period, interval);
      const indicators = calculateIndicators(candles);
      const signals = generateCandleSignals(candles);
      return { symbol: cleanSym, period, interval, candles, indicators, signals };
    } catch (error: any) {
      logger.error(`Failed to fetch chart data for ${cleanSym}: ${error.message}`);
      throw new Error(`Could not fetch chart data for ${cleanSym}. Verify the ticker symbol.`);
    }
  }

  /**
   * Perform full AI-powered Stock Analysis with real data
   */
  async analyzeStock(userId: string, symbol: string, isIntraday: boolean = false): Promise<any> {
    const cleanSym = await this.resolveSymbol(symbol);

    // Fetch real data
    let quote: Awaited<ReturnType<typeof fetchRealQuote>>;
    let candles: OHLCV[];
    let indicators: TechnicalIndicators;
    let tradingSignals: TradingSignals;

    try {
      [quote, candles] = await Promise.all([
        fetchRealQuote(cleanSym),
        isIntraday 
          ? fetchHistoricalCandles(cleanSym, '5d', '5m')
          : fetchHistoricalCandles(cleanSym, '6mo', '1d'),
      ]);

      indicators = calculateIndicators(candles);
      const sr = detectSupportResistance(candles, quote.price);
      tradingSignals = generateTradingSignals(quote.price, indicators, sr);
    } catch (error: any) {
      logger.error(`Failed to fetch real stock data for ${cleanSym}: ${error.message}`);
      throw new Error(`Could not fetch market data for "${cleanSym}". Please verify the ticker symbol is valid (e.g., AAPL, TSLA, GOOGL, RELIANCE.NS).`);
    }

    // Enhance with AI explanation (optional — gracefully falls back)
    let aiExplanation = tradingSignals.reasoning;
    try {
      const timeframeLabel = isIntraday ? 'intraday 5-minute interval' : 'daily interval';
      const systemPrompt = `You are a professional Day Trader and Hedge Fund Quant. Given real ${timeframeLabel} technical indicators, write a concise 3-4 paragraph analysis explaining the current trading setup, key levels to watch, and your recommendation. Use markdown formatting. Be specific with numbers.`;

      const prompt = `Ticker: ${cleanSym} (${quote.name}) [TIMEFRAME: ${isIntraday ? 'INTRADAY 5-MIN' : 'DAILY'}]
Current Price: $${quote.price} (${quote.change >= 0 ? '+' : ''}${quote.changePercent.toFixed(2)}%)
RSI(14): ${indicators.rsi}
MACD: Line=${indicators.macd.macdLine}, Signal=${indicators.macd.signalLine}, Histogram=${indicators.macd.histogram}
EMA(20): $${indicators.ema20} | SMA(50): $${indicators.sma50} | SMA(200): $${indicators.sma200}
Bollinger: Upper=$${indicators.bollingerBands.upper}, Lower=$${indicators.bollingerBands.lower}
ATR(14): $${indicators.atr}
Volume: ${quote.volume.toLocaleString()} (Avg: ${quote.avgVolume.toLocaleString()})
52W Range: $${quote.week52Low} - $${quote.week52High}
Support: ${tradingSignals.supportLevels.join(', ') || 'N/A'}
Resistance: ${tradingSignals.resistanceLevels.join(', ') || 'N/A'}
Signal: ${tradingSignals.recommendation} (Buy: ${tradingSignals.buyScore}, Sell: ${tradingSignals.sellScore})
Stop Loss: $${tradingSignals.stopLoss} | Profit Target: $${tradingSignals.profitTarget}`;

      const response = await aiRouter.chat([
        { role: 'system', content: systemPrompt },
        { role: 'user', content: prompt }
      ], { temperature: 0.3, maxTokens: 800 });

      aiExplanation = response.content.trim();
    } catch (e: any) {
      logger.warn(`AI explanation unavailable, using signal-based reasoning: ${e.message}`);
    }

    // Save to DB
    const saved = await prisma.stockAnalysis.create({
      data: {
        userId,
        symbol: cleanSym,
        buyScore: tradingSignals.buyScore,
        sellScore: tradingSignals.sellScore,
        holdScore: tradingSignals.holdScore,
        confidenceScore: tradingSignals.confidenceScore,
        riskScore: tradingSignals.riskScore,
        technicalMetrics: JSON.stringify(indicators),
        newsSentiment: tradingSignals.buyScore > 60 ? 'Positive' : tradingSignals.sellScore > 60 ? 'Negative' : 'Neutral',
        aiExplanation,
      }
    });

    // Log Agent Activity
    await prisma.agentActivityLog.create({
      data: {
        userId,
        agentId: 'stock',
        action: 'stock_analysis',
        description: `Analyzed ${cleanSym} ($${quote.price}) — ${tradingSignals.recommendation} signal`,
        reasoning: `RSI=${indicators.rsi}, MACD=${indicators.macd.histogram > 0 ? 'Bullish' : 'Bearish'}, Stop=$${tradingSignals.stopLoss}, Target=$${tradingSignals.profitTarget}`,
      }
    });

    return {
      id: saved.id,
      symbol: cleanSym,
      companyName: quote.name,
      exchange: quote.exchange,
      currency: quote.currency,
      currentPrice: quote.price,
      change: parseFloat(quote.change.toFixed(2)),
      changePercent: parseFloat(quote.changePercent.toFixed(2)),
      dayHigh: quote.dayHigh,
      dayLow: quote.dayLow,
      week52High: quote.week52High,
      week52Low: quote.week52Low,
      marketCap: quote.marketCap,
      pe: quote.pe,
      volume: quote.volume,
      avgVolume: quote.avgVolume,
      technicalIndicators: indicators,
      scores: {
        buy: tradingSignals.buyScore,
        sell: tradingSignals.sellScore,
        hold: tradingSignals.holdScore,
        confidence: tradingSignals.confidenceScore,
        risk: tradingSignals.riskScore,
      },
      recommendation: tradingSignals.recommendation,
      stopLoss: tradingSignals.stopLoss,
      profitTarget: tradingSignals.profitTarget,
      supportLevels: tradingSignals.supportLevels,
      resistanceLevels: tradingSignals.resistanceLevels,
      reasoning: aiExplanation,
      analyzedAt: saved.createdAt,
    };
  }

  /**
   * Watchlist actions
   */
  async addToWatchlist(userId: string, symbol: string, name?: string): Promise<any> {
    const cleanSym = await this.resolveSymbol(symbol);
    const displayName = name || cleanSym;
    return prisma.stockWatchlist.upsert({
      where: { userId_symbol: { userId, symbol: cleanSym } },
      update: { name: displayName },
      create: { userId, symbol: cleanSym, name: displayName },
    });
  }

  async getWatchlist(userId: string): Promise<any[]> {
    return prisma.stockWatchlist.findMany({
      where: { userId },
      orderBy: { symbol: 'asc' },
    });
  }

  async removeFromWatchlist(userId: string, symbol: string): Promise<any> {
    const cleanSym = await this.resolveSymbol(symbol);
    return prisma.stockWatchlist.delete({
      where: { userId_symbol: { userId, symbol: cleanSym } },
    });
  }

  /**
   * Portfolio actions
   */
  async getPortfolio(userId: string): Promise<any[]> {
    return prisma.portfolioItem.findMany({
      where: { userId },
      orderBy: { symbol: 'asc' },
    });
  }

  async updatePortfolioItem(userId: string, data: { symbol: string; shares: number; averagePrice: number }): Promise<any> {
    const cleanSym = await this.resolveSymbol(data.symbol);

    // Get real ATR for risk assessment
    let riskScore = 50;
    let stopLoss = parseFloat((data.averagePrice * 0.92).toFixed(2));
    let profitTarget = parseFloat((data.averagePrice * 1.15).toFixed(2));

    try {
      const candles = await fetchHistoricalCandles(cleanSym, '3mo');
      const indicators = calculateIndicators(candles);
      riskScore = Math.min(90, Math.round(indicators.atr / data.averagePrice * 1000 + 20));
      stopLoss = parseFloat((data.averagePrice - indicators.atr * 2).toFixed(2));
      profitTarget = parseFloat((data.averagePrice + indicators.atr * 3).toFixed(2));
    } catch {
      // Use percentage-based fallback
    }

    const existing = await prisma.portfolioItem.findFirst({
      where: { userId, symbol: cleanSym },
    });

    if (data.shares <= 0) {
      if (existing) {
        return prisma.portfolioItem.delete({ where: { id: existing.id } });
      }
      return null;
    }

    if (existing) {
      return prisma.portfolioItem.update({
        where: { id: existing.id },
        data: {
          shares: data.shares,
          averagePrice: data.averagePrice,
          riskScore,
          stopLoss,
          profitTarget,
        },
      });
    } else {
      return prisma.portfolioItem.create({
        data: {
          userId,
          symbol: cleanSym,
          shares: data.shares,
          averagePrice: data.averagePrice,
          riskScore,
          stopLoss,
          profitTarget,
        },
      });
    }
  }

  /**
   * Get comprehensive market situation analysis for the side panel
   */
  async getMarketSituation(userId: string, symbol: string): Promise<any> {
    const cleanSym = await this.resolveSymbol(symbol);

    let quote: Awaited<ReturnType<typeof fetchRealQuote>>;
    let candles: OHLCV[];
    let indicators: TechnicalIndicators;
    let sr: ReturnType<typeof detectSupportResistance>;
    let tradingSignals: TradingSignals;

    try {
      [quote, candles] = await Promise.all([
        fetchRealQuote(cleanSym),
        fetchHistoricalCandles(cleanSym, '6mo'),
      ]);

      indicators = calculateIndicators(candles);
      sr = detectSupportResistance(candles, quote.price);
      tradingSignals = generateTradingSignals(quote.price, indicators, sr);
    } catch (error: any) {
      logger.error(`Failed to fetch market situation for ${cleanSym}: ${error.message}`);
      throw new Error(`Could not fetch market data for "${cleanSym}". Please verify the ticker symbol.`);
    }

    // ── Build structured buy reasons ────────────────────────
    const buyReasons: Array<{ indicator: string; signal: string; strength: string; description: string }> = [];
    const sellReasons: Array<{ indicator: string; signal: string; strength: string; description: string }> = [];

    // RSI analysis
    if (indicators.rsi < 30) {
      buyReasons.push({
        indicator: 'RSI (14)',
        signal: `RSI at ${indicators.rsi.toFixed(1)} — Oversold`,
        strength: 'STRONG',
        description: `RSI is below 30 (currently ${indicators.rsi.toFixed(1)}), indicating the stock is heavily oversold. Historically this level often precedes a reversal bounce.`,
      });
    } else if (indicators.rsi < 40) {
      buyReasons.push({
        indicator: 'RSI (14)',
        signal: `RSI at ${indicators.rsi.toFixed(1)} — Near Oversold`,
        strength: 'MODERATE',
        description: `RSI is approaching the oversold zone (${indicators.rsi.toFixed(1)}). Buying pressure may increase as value buyers step in.`,
      });
    } else if (indicators.rsi > 70) {
      sellReasons.push({
        indicator: 'RSI (14)',
        signal: `RSI at ${indicators.rsi.toFixed(1)} — Overbought`,
        strength: 'STRONG',
        description: `RSI is above 70 (currently ${indicators.rsi.toFixed(1)}), indicating the stock is overbought. Risk of a pullback or mean reversion is elevated.`,
      });
    } else if (indicators.rsi > 60) {
      sellReasons.push({
        indicator: 'RSI (14)',
        signal: `RSI at ${indicators.rsi.toFixed(1)} — Elevated`,
        strength: 'MODERATE',
        description: `RSI is elevated (${indicators.rsi.toFixed(1)}). Momentum is strong but monitor for overextension.`,
      });
    }

    // MACD analysis
    if (indicators.macd.histogram > 0) {
      buyReasons.push({
        indicator: 'MACD',
        signal: 'Bullish Histogram',
        strength: indicators.macd.histogram > 1 ? 'STRONG' : 'MODERATE',
        description: `MACD histogram is positive (+${indicators.macd.histogram.toFixed(2)}), confirming bullish momentum.`,
      });
    } else {
      sellReasons.push({
        indicator: 'MACD',
        signal: 'Bearish Histogram',
        strength: indicators.macd.histogram < -1 ? 'STRONG' : 'MODERATE',
        description: `MACD histogram is negative (${indicators.macd.histogram.toFixed(2)}), confirming bearish momentum.`,
      });
    }

    // Moving Average Alignment
    if (quote.price > indicators.ema20 && quote.price > indicators.sma50) {
      buyReasons.push({
        indicator: 'Moving Averages',
        signal: 'Above EMA(20) & SMA(50)',
        strength: 'STRONG',
        description: `Price ($${quote.price}) is trading above short-term EMA(20) ($${indicators.ema20}) and medium-term SMA(50) ($${indicators.sma50}).`,
      });
    } else if (quote.price < indicators.ema20 && quote.price < indicators.sma50) {
      sellReasons.push({
        indicator: 'Moving Averages',
        signal: 'Price Below EMA(20) & SMA(50)',
        strength: 'MODERATE',
        description: `Price ($${quote.price.toFixed(2)}) is trading below both EMA(20) ($${indicators.ema20.toFixed(2)}) and SMA(50) ($${indicators.sma50.toFixed(2)}), confirming a bearish trend structure.`,
      });
    }

    // Golden / Death Cross
    if (indicators.sma50 > indicators.sma200 && indicators.sma200 > 0) {
      buyReasons.push({
        indicator: 'Golden Cross',
        signal: 'SMA(50) > SMA(200)',
        strength: 'STRONG',
        description: `The 50-day SMA ($${indicators.sma50.toFixed(2)}) is above the 200-day SMA ($${indicators.sma200.toFixed(2)}), forming a Golden Cross — a powerful long-term bullish signal.`,
      });
    } else if (indicators.sma50 < indicators.sma200 && indicators.sma200 > 0) {
      sellReasons.push({
        indicator: 'Death Cross',
        signal: 'SMA(50) < SMA(200)',
        strength: 'STRONG',
        description: `The 50-day SMA ($${indicators.sma50.toFixed(2)}) is below the 200-day SMA ($${indicators.sma200.toFixed(2)}), forming a Death Cross — a significant long-term bearish signal.`,
      });
    }

    // Bollinger Bands
    if (quote.price <= indicators.bollingerBands.lower) {
      buyReasons.push({
        indicator: 'Bollinger Bands',
        signal: 'Price at Lower Band',
        strength: 'MODERATE',
        description: `Price ($${quote.price.toFixed(2)}) is at or below the lower Bollinger Band ($${indicators.bollingerBands.lower.toFixed(2)}). This often signals a potential bounce as the price reverts to the mean.`,
      });
    } else if (quote.price >= indicators.bollingerBands.upper) {
      sellReasons.push({
        indicator: 'Bollinger Bands',
        signal: 'Price at Upper Band',
        strength: 'MODERATE',
        description: `Price ($${quote.price.toFixed(2)}) is at or above the upper Bollinger Band ($${indicators.bollingerBands.upper.toFixed(2)}). This often signals a potential pullback as the price is stretched.`,
      });
    }

    // Volume analysis
    const volumeRatio = quote.avgVolume > 0 ? ((quote.volume - quote.avgVolume) / quote.avgVolume) * 100 : 0;
    let volumeCondition: 'ACCUMULATION' | 'DISTRIBUTION' | 'NORMAL' = 'NORMAL';
    let volumeDescription = 'Volume is in line with the average — no significant accumulation or distribution pattern.';

    if (volumeRatio > 30 && quote.change > 0) {
      volumeCondition = 'ACCUMULATION';
      volumeDescription = `High volume on a green day suggests institutional accumulation. Volume is ${volumeRatio.toFixed(0)}% above the 20-day average, confirming buying conviction.`;
      buyReasons.push({
        indicator: 'Volume',
        signal: `${volumeRatio.toFixed(0)}% Above Average on Up Day`,
        strength: volumeRatio > 60 ? 'STRONG' : 'MODERATE',
        description: volumeDescription,
      });
    } else if (volumeRatio > 30 && quote.change < 0) {
      volumeCondition = 'DISTRIBUTION';
      volumeDescription = `High volume on a red day signals institutional distribution. Volume is ${volumeRatio.toFixed(0)}% above average, indicating strong selling pressure.`;
      sellReasons.push({
        indicator: 'Volume',
        signal: `${volumeRatio.toFixed(0)}% Above Average on Down Day`,
        strength: volumeRatio > 60 ? 'STRONG' : 'MODERATE',
        description: volumeDescription,
      });
    }

    // ── Momentum analysis ─────────────────────────────────
    let rsiState = 'Neutral';
    if (indicators.rsi > 70) rsiState = 'Overbought';
    else if (indicators.rsi > 60) rsiState = 'Bullish Momentum';
    else if (indicators.rsi < 30) rsiState = 'Oversold';
    else if (indicators.rsi < 40) rsiState = 'Bearish Pressure';
    else rsiState = 'Neutral Zone';

    let macdState = 'Neutral';
    if (indicators.macd.histogram > 0 && indicators.macd.macdLine > indicators.macd.signalLine) {
      macdState = indicators.macd.histogram > 1 ? 'Strong Bullish' : 'Bullish';
    } else if (indicators.macd.histogram < 0 && indicators.macd.macdLine < indicators.macd.signalLine) {
      macdState = indicators.macd.histogram < -1 ? 'Strong Bearish' : 'Bearish';
    } else {
      macdState = 'Converging (indecisive)';
    }

    let trendAlignment = indicators.trend;
    const maAligned = quote.price > indicators.ema20 && indicators.ema20 > indicators.sma50 && indicators.sma50 > indicators.sma200;
    const maAlignedBear = quote.price < indicators.ema20 && indicators.ema20 < indicators.sma50 && indicators.sma50 < indicators.sma200;
    if (maAligned) trendAlignment = 'All MAs Aligned Bullish (Price > EMA20 > SMA50 > SMA200)';
    else if (maAlignedBear) trendAlignment = 'All MAs Aligned Bearish (Price < EMA20 < SMA50 < SMA200)';

    // ── Risk / Reward ─────────────────────────────────────
    const riskPercent = quote.price > 0 ? ((quote.price - tradingSignals.stopLoss) / quote.price) * 100 : 0;
    const rewardPercent = quote.price > 0 ? ((tradingSignals.profitTarget - quote.price) / quote.price) * 100 : 0;
    const rrRatio = riskPercent > 0 ? `1:${(rewardPercent / riskPercent).toFixed(1)}` : '1:1.5';

    // ── Key levels with distance from current price ───────
    const keyLevels = {
      support: sr.support.map(s => ({
        price: s,
        distance: quote.price > 0 ? ((quote.price - s) / quote.price) * 100 : 0,
      })),
      resistance: sr.resistance.map(r => ({
        price: r,
        distance: quote.price > 0 ? ((r - quote.price) / quote.price) * 100 : 0,
      })),
    };

    // ── Overall condition ─────────────────────────────────
    let overallCondition: 'BULLISH' | 'BEARISH' | 'NEUTRAL' = 'NEUTRAL';
    const buyWeight = buyReasons.reduce((sum, r) => sum + (r.strength === 'STRONG' ? 3 : r.strength === 'MODERATE' ? 2 : 1), 0);
    const sellWeight = sellReasons.reduce((sum, r) => sum + (r.strength === 'STRONG' ? 3 : r.strength === 'MODERATE' ? 2 : 1), 0);
    const totalWeight = buyWeight + sellWeight || 1;
    const conditionStrength = Math.round(Math.abs(buyWeight - sellWeight) / totalWeight * 100);

    if (buyWeight > sellWeight * 1.3) overallCondition = 'BULLISH';
    else if (sellWeight > buyWeight * 1.3) overallCondition = 'BEARISH';

    let conditionSummary = '';
    if (overallCondition === 'BULLISH') {
      conditionSummary = `${cleanSym} shows ${buyReasons.length} bullish signals vs ${sellReasons.length} bearish. Technical momentum is building to the upside with ${indicators.trend.toLowerCase()} trend structure.`;
    } else if (overallCondition === 'BEARISH') {
      conditionSummary = `${cleanSym} shows ${sellReasons.length} bearish signals vs ${buyReasons.length} bullish. Selling pressure is dominant with ${indicators.trend.toLowerCase()} price action.`;
    } else {
      conditionSummary = `${cleanSym} is in a consolidation zone with mixed signals (${buyReasons.length} buy vs ${sellReasons.length} sell). Wait for a decisive breakout above $${indicators.bollingerBands.upper.toFixed(2)} or breakdown below $${indicators.bollingerBands.lower.toFixed(2)}.`;
    }

    // ── AI Verdict ────────────────────────────────────────
    let aiVerdict = '';
    try {
      const aiPrompt = `You are an expert market analyst. Given these signals for ${cleanSym} at $${quote.price}:

BUY signals: ${buyReasons.map(r => `${r.indicator}: ${r.signal} (${r.strength})`).join(', ') || 'None'}
SELL signals: ${sellReasons.map(r => `${r.indicator}: ${r.signal} (${r.strength})`).join(', ') || 'None'}
RSI: ${indicators.rsi.toFixed(1)} | MACD Hist: ${indicators.macd.histogram.toFixed(2)} | Trend: ${indicators.trend}
Support: ${sr.support.join(', ') || 'None'} | Resistance: ${sr.resistance.join(', ') || 'None'}
Volume: ${volumeCondition} (${volumeRatio.toFixed(0)}% vs avg)

Write a 2-3 sentence actionable market verdict. Be specific about what a trader should do RIGHT NOW. Include specific price levels. No markdown formatting.`;

      const response = await aiRouter.chat([
        { role: 'system', content: 'You are a professional trading analyst. Be concise, specific, and actionable.' },
        { role: 'user', content: aiPrompt },
      ], { temperature: 0.3, maxTokens: 300 });
      aiVerdict = response.content.trim();
    } catch (e: any) {
      logger.warn(`AI verdict unavailable: ${e.message}`);
      aiVerdict = `${overallCondition} outlook for ${cleanSym}. ${conditionSummary} Stop loss at $${tradingSignals.stopLoss.toFixed(2)}, profit target at $${tradingSignals.profitTarget.toFixed(2)}.`;
    }

    return {
      symbol: cleanSym,
      currentPrice: quote.price,
      overallCondition,
      conditionStrength,
      conditionSummary,
      buyReasons,
      sellReasons,
      volumeAnalysis: {
        condition: volumeCondition,
        description: volumeDescription,
        volumeVsAvg: Math.round(volumeRatio),
      },
      momentumAnalysis: {
        rsiState,
        macdState,
        trendAlignment,
      },
      riskReward: {
        ratio: rrRatio,
        stopLoss: tradingSignals.stopLoss,
        profitTarget: tradingSignals.profitTarget,
        riskPercent,
        rewardPercent,
      },
      keyLevels,
      aiVerdict,
    };
  }

  async searchStocks(query: string) {
    const cleanQuery = query.toUpperCase().trim();
    if (!cleanQuery) return [];

    const results: Array<{ symbol: string; name: string; exchange: string; type: string }> = [];
    const addedSymbols = new Set<string>();

    // 1. Alias / Local dictionary matches
    for (const item of POPULAR_STOCK_MAP) {
      const match = item.keywords.some(
        k => k === cleanQuery || k.includes(cleanQuery) || cleanQuery.includes(k)
      );
      if (match && !addedSymbols.has(item.symbol)) {
        results.push({
          symbol: item.symbol,
          name: item.name,
          exchange: item.exchange,
          type: item.type,
        });
        addedSymbols.add(item.symbol);
      }
    }

    // 2. Primary: Yahoo Finance Search
    try {
      const yf = await getYahoo();
      const result = await yf.search(query, { newsCount: 0 });
      if (result?.quotes && result.quotes.length > 0) {
        for (const q of result.quotes) {
          if (q.symbol && typeof q.symbol === 'string' && !q.symbol.includes(' ')) {
            const sym = q.symbol.toUpperCase();
            if (!addedSymbols.has(sym)) {
              results.push({
                symbol: sym,
                name: q.shortname || q.longname || q.name || sym,
                exchange: q.exchange || q.exchDisp || '',
                type: q.quoteType || q.typeDisp || 'EQUITY',
              });
              addedSymbols.add(sym);
            }
          }
        }
      }
    } catch (yfErr) {
      logger.warn(`Yahoo search failed for query "${query}": ${yfErr instanceof Error ? yfErr.message : yfErr}`);
    }

    // 3. Secondary: Groww API search fallback for Indian market autocomplete
    try {
      const response = await fetch(`https://groww.in/v1/api/search/v3/query/global/entity?query=${encodeURIComponent(query)}&size=10`, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'application/json',
        }
      });
      if (response.ok) {
        const data = (await response.json()) as any;
        const content = data?.content || [];
        for (const item of content) {
          const symCode = item.nse_scrip_code || item.bse_script_code;
          if (symCode) {
            const sym = item.nse_scrip_code ? `${item.nse_scrip_code}.NS` : `${item.bse_script_code}.BO`;
            const cleanSym = sym.toUpperCase();
            if (!addedSymbols.has(cleanSym)) {
              results.push({
                symbol: cleanSym,
                name: item.title || item.searchable_text || cleanSym,
                exchange: item.nse_scrip_code ? 'NSE' : 'BSE',
                type: item.entity_type || 'EQUITY',
              });
              addedSymbols.add(cleanSym);
            }
          }
        }
      }
    } catch (err) {
      logger.warn(`Groww autocomplete search failed for query "${query}": ${err instanceof Error ? err.message : err}`);
    }

    return results.slice(0, 10);
  }
}

export const stockService = new StockService();

