import express, { Express, Request, Response } from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { PrismaClient } from '@prisma/client';
import helmet from 'helmet';

import env from './config/env';
import logger from './utils/logger';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';
import { apiLimiter } from './middleware/rateLimit';
import { inputSanitizer } from './middleware/sanitizer';
import { initWebSocket } from './websocket';

// AI Services & Providers
import { aiRouter } from './services/ai/provider';
import { KimiProvider } from './services/ai/kimi';
import { GeminiProvider } from './services/ai/gemini';
import { OllamaProvider } from './services/ai/ollama';

// Services needing cleanups
import { fileTrackerService } from './services/fileTracker.service';

// Import Routes
import authRoutes from './routes/auth.routes';
import userRoutes from './routes/user.routes';
import botRoutes from './routes/bot.routes';
import whatsappRoutes from './routes/whatsapp.routes';
import fileTrackerRoutes from './routes/fileTracker.routes';
import aiRoutes from './routes/ai.routes';
import analyticsRoutes from './routes/analytics.routes';

// AI Agent Routes
import stockRoutes from './routes/stock.routes';
import startupRoutes from './routes/startup.routes';
import researchRoutes from './routes/research.routes';
import careerRoutes from './routes/career.routes';
import automatorRoutes from './routes/automator.routes';
import notificationRoutes from './routes/notification.routes';
import travelRoutes from './routes/travel.routes';
import productivityRoutes from './routes/productivity.routes';
import documentRoutes from './routes/document.routes';
import adminRoutes from './routes/admin.routes';
import paymentRoutes from './routes/payment.routes';
import bookingRoutes from './routes/booking.routes';
import salesRoutes from './routes/sales.routes';

const app: Express = express();
const httpServer = createServer(app);
const prisma = new PrismaClient();

// Initialize WebSocket layer
initWebSocket(httpServer);

// Restore active WhatsApp sessions on boot
import { whatsappService } from './services/whatsapp.service';
whatsappService.restoreActiveSessions();

import { FallbackProvider } from './services/ai/fallback';
import { PollinationsProvider } from './services/ai/pollinations';

// Register AI Providers
try {
  const hasGemini = !!env.GEMINI_API_KEY;
  aiRouter.registerProvider(new GeminiProvider(), hasGemini);  // Google Gemini (Primary when API key is provided)
  aiRouter.registerProvider(new KimiProvider(), !hasGemini);   // Moonshot Kimi AI
  aiRouter.registerProvider(new PollinationsProvider());      // Pollinations AI (Zero-config free online LLM)
  aiRouter.registerProvider(new OllamaProvider());            // Ollama local fallback
  aiRouter.registerProvider(new FallbackProvider());          // Rules-engine safety net
  logger.info('AI Providers (Gemini, Kimi, Pollinations, Ollama, Fallback) successfully registered in Router.');
} catch (error: any) {
  logger.error(`Failed to register AI Providers: ${error.message}`);
}

// ─── Middleware ─────────────────────────────────────────────

app.use(cors({
  origin: true,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'x-auth-token'],
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// Apply security headers protection (Helmet)
app.use(helmet({
  contentSecurityPolicy: false, // Turn off CSP restriction for easy local media loading
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));

// Sanitize all incoming user input (XSS protection)
app.use(inputSanitizer);

// Apply general API rate limiter to all api routes
app.use('/api', apiLimiter);

// ─── Health Check ───────────────────────────────────────────

app.get('/health', (req: Request, res: Response) => {
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: env.NODE_ENV,
  });
});

// ─── Route Mounts ───────────────────────────────────────────

app.use('/api/auth', authRoutes);
app.use('/api/user', userRoutes);
app.use('/api/bots', botRoutes);
app.use('/api/whatsapp', whatsappRoutes);
app.use('/api/file-tracker', fileTrackerRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/analytics', analyticsRoutes);

// AI Agent Mounts
app.use('/api/agents/stock', stockRoutes);
app.use('/api/agents/startup', startupRoutes);
app.use('/api/agents/research', researchRoutes);
app.use('/api/agents/career', careerRoutes);
app.use('/api/agents/automator', automatorRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/agents/travel', travelRoutes);
app.use('/api/agents/productivity', productivityRoutes);
app.use('/api/agents/document', documentRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/booking', bookingRoutes);
app.use('/api/agents/sales', salesRoutes);

// ─── Error Handling ─────────────────────────────────────────

// 404 Handler — catches unmatched routes
app.use(notFoundHandler);

// Global Error Handler (must be 4-param to catch thrown errors)
app.use(errorHandler);

// ─── Server Startup ─────────────────────────────────────────

const PORT = env.PORT || 5000;

httpServer.listen(PORT, '0.0.0.0', () => {
  logger.info(`Server running on http://localhost:${PORT}`);
  logger.info(`Environment: ${env.NODE_ENV}`);
  logger.info(`Database: ${env.DATABASE_URL.startsWith('file:') ? 'SQLite (local)' : 'PostgreSQL (remote)'}`);
});

// Graceful Shutdown Handler
async function gracefulShutdown(signal: string) {
  logger.info(`${signal} received, shutting down gracefully...`);

  // Stop file watching trackers
  try {
    await fileTrackerService.cleanup();
  } catch (error: any) {
    logger.error(`Error during file tracker watcher cleanup: ${error.message}`);
  }

  // Close server
  httpServer.close(() => {
    logger.info('HTTP server closed');
  });

  // Disconnect Database
  try {
    await prisma.$disconnect();
    logger.info('Prisma client disconnected');
  } catch (error: any) {
    logger.error(`Error disconnecting Prisma: ${error.message}`);
  }

  process.exit(0);
}

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

process.on('unhandledRejection', (reason, promise) => {
  logger.error(`Unhandled Rejection at: ${promise}, reason: ${reason}`);
});

process.on('uncaughtException', (error) => {
  logger.error(`Uncaught Exception thrown: ${error.message}`, { stack: error.stack });
  // In production, always exit on uncaughtException so process managers (PM2/Docker) can restart fresh
  process.exit(1);
});

export default app;
