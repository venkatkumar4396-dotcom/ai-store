import { Router, Request, Response, NextFunction } from 'express';
import { stockService } from '../services/stock.service';
import { authenticate } from '../middleware/auth';
import { aiLimiter } from '../middleware/rateLimit';

const router = Router();

/**
 * @route   GET /api/agents/stock/quote/:symbol
 * @desc    Get real-time quote for a symbol
 */
router.get('/quote/:symbol', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const symbol = req.params.symbol as string;
    if (!symbol) {
      res.status(400).json({ error: 'Stock symbol is required' });
      return;
    }
    const result = await stockService.getQuote(symbol);
    res.status(200).json(result);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

/**
 * @route   POST /api/agents/stock/quotes/batch
 * @desc    Get real-time quotes for multiple symbols at once
 */
router.post('/quotes/batch', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { symbols } = req.body;
    if (!symbols || !Array.isArray(symbols) || symbols.length === 0) {
      res.status(400).json({ error: 'An array of stock symbols is required' });
      return;
    }
    // Limit to 30 symbols per batch to avoid overload
    const limited = symbols.slice(0, 30);
    const result = await stockService.getBatchQuotes(limited);
    res.status(200).json(result);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

/**
 * @route   GET /api/agents/stock/chart/:symbol
 * @desc    Get historical OHLCV candle data + indicators for charting
 */
router.get('/chart/:symbol', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const symbol = req.params.symbol as string;
    const period = (req.query.period as string) || '6mo';
    const interval = (req.query.interval as string) || '1d';
    if (!symbol) {
      res.status(400).json({ error: 'Stock symbol is required' });
      return;
    }
    const validPeriods = ['5d', '1mo', '3mo', '6mo', '1y'];
    const chartPeriod = validPeriods.includes(period) ? period : '6mo';
    const validIntervals = ['1d', '5m', '15m', '1h'];
    const chartInterval = validIntervals.includes(interval) ? interval : '1d';

    const result = await stockService.getChartData(symbol, chartPeriod as any, chartInterval as any);
    res.status(200).json(result);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

/**
 * @route   POST /api/agents/stock/analyze
 * @desc    Full AI-powered stock analysis with real data
 */
router.post('/analyze', authenticate, aiLimiter, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.userId;
    const { symbol, isIntraday } = req.body;
    if (!symbol) {
      res.status(400).json({ error: 'Stock symbol is required' });
      return;
    }
    const result = await stockService.analyzeStock(userId, symbol, !!isIntraday);
    res.status(200).json(result);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

/**
 * @route   GET /api/agents/stock/situation/:symbol
 * @desc    Get comprehensive market situation with buy/sell reasoning
 */
router.get('/situation/:symbol', authenticate, aiLimiter, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.userId;
    const symbol = req.params.symbol as string;
    if (!symbol) {
      res.status(400).json({ error: 'Stock symbol is required' });
      return;
    }
    const result = await stockService.getMarketSituation(userId, symbol);
    res.status(200).json(result);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

/**
 * @route   GET /api/agents/stock/watchlist
 * @desc    Get user's stock watchlist
 */
router.get('/watchlist', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.userId;
    const result = await stockService.getWatchlist(userId);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
});

/**
 * @route   POST /api/agents/stock/watchlist
 * @desc    Add ticker to watchlist
 */
router.post('/watchlist', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.userId;
    const { symbol, name } = req.body;
    if (!symbol) {
      res.status(400).json({ error: 'Stock symbol is required' });
      return;
    }
    const result = await stockService.addToWatchlist(userId, symbol, name || symbol);
    res.status(201).json(result);
  } catch (error) {
    next(error);
  }
});

/**
 * @route   DELETE /api/agents/stock/watchlist/:symbol
 * @desc    Remove ticker from watchlist
 */
router.delete('/watchlist/:symbol', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.userId;
    const symbol = req.params.symbol as string;
    await stockService.removeFromWatchlist(userId, symbol);
    res.status(200).json({ message: 'Removed from watchlist successfully' });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   GET /api/agents/stock/portfolio
 * @desc    Get user's portfolio holdings
 */
router.get('/portfolio', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.userId;
    const result = await stockService.getPortfolio(userId);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
});

/**
 * @route   POST /api/agents/stock/portfolio
 * @desc    Buy/sell/update portfolio shares
 */
router.post('/portfolio', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.userId;
    const { symbol, shares, averagePrice } = req.body;
    if (!symbol || shares === undefined || averagePrice === undefined) {
      res.status(400).json({ error: 'Symbol, shares, and averagePrice are required' });
      return;
    }
    const result = await stockService.updatePortfolioItem(userId, { symbol, shares, averagePrice });
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
});

/**
 * @route   POST /api/agents/stock/alpaca-proxy
 * @desc    Secure CORS-free proxy for Alpaca Brokerage API
 */
router.post('/alpaca-proxy', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { endpoint, method, body, isLive } = req.body;
    const keyId = req.headers['x-alpaca-key-id'] as string;
    const secretKey = req.headers['x-alpaca-secret-key'] as string;

    if (!endpoint || !keyId || !secretKey) {
      res.status(400).json({ error: 'endpoint, x-alpaca-key-id, and x-alpaca-secret-key headers are required' });
      return;
    }

    const baseUrl = isLive ? 'https://api.alpaca.markets' : 'https://paper-api.alpaca.markets';
    const targetUrl = `${baseUrl}${endpoint}`;

    const headers = {
      'APCA-API-KEY-ID': keyId,
      'APCA-API-SECRET-KEY': secretKey,
      'Content-Type': 'application/json',
    };

    const fetchResult = await fetch(targetUrl, {
      method: method || 'GET',
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });

    const data = await fetchResult.json();
    res.status(fetchResult.status).json(data);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Alpaca request failed' });
  }
});

/**
 * @route   GET /api/agents/stock/search
 * @desc    Search/Autocomplete stock ticker symbols and names using Groww API with Yahoo Finance fallback
 */
router.get('/search', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const query = req.query.q as string;
    if (!query || query.trim().length < 2) {
      res.status(200).json([]);
      return;
    }
    const result = await stockService.searchStocks(query);
    res.status(200).json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
