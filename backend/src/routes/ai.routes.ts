import { Router, Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate } from '../middleware/auth';
import { aiLimiter } from '../middleware/rateLimit';
import { aiRouter, ChatMessage, ChatOptions } from '../services/ai/provider';
import { GroqProvider } from '../services/ai/groq';
import { KimiProvider } from '../services/ai/kimi';
import { GeminiProvider } from '../services/ai/gemini';
import { OllamaProvider } from '../services/ai/ollama';
import { FallbackProvider } from '../services/ai/fallback';
import { decrypt } from '../utils/crypto';
import { logActivity } from '../services/analytics.service';
import logger from '../utils/logger';

const router = Router();
const prisma = new PrismaClient();
const fallbackProvider = new FallbackProvider();

/**
 * @route   POST /api/ai/chat
 * @desc    Chat with an AI model with multi-tier fallback (Kimi -> Meta -> Gemini -> Pollinations -> Fallback)
 * @access  Private
 */
router.post('/chat', authenticate, aiLimiter, async (req: Request, res: Response, next: NextFunction) => {
  const userId = req.user!.userId;
  const { messages, provider, options } = req.body as {
    messages: ChatMessage[];
    provider?: string;
    options?: ChatOptions;
  };

  if (!messages || !Array.isArray(messages) || messages.length === 0) {
    res.status(400).json({ error: 'Messages array is required' });
    return;
  }

  const selectedProvider = (provider && typeof provider === 'string')
    ? provider.toLowerCase()
    : 'kimi';

  logger.info(`AI Route: Processing chat for provider ${selectedProvider} (${messages.length} messages)`);
  let response;

  try {
    // Check if user has their own API key for this provider
    let userApiKey = null;
    try {
      userApiKey = await prisma.apiKey.findFirst({
        where: { userId, provider: selectedProvider, isActive: true },
      });
    } catch {
      // Prisma error fallback
    }

    if (userApiKey) {
      logger.info(`Using user custom API key for ${selectedProvider} (user: ${userId})`);
      const decryptedKey = decrypt(userApiKey.encryptedKey);

      try {
        if (selectedProvider === 'groq') {
          const groq = new GroqProvider(decryptedKey);
          response = await groq.chat(messages, options);
        } else if (selectedProvider === 'kimi') {
          const kimi = new KimiProvider(decryptedKey);
          response = await kimi.chat(messages, options);
        } else if (selectedProvider === 'gemini') {
          const gemini = new GeminiProvider(decryptedKey);
          response = await gemini.chat(messages, options);
        } else if (selectedProvider === 'ollama') {
          const ollama = new OllamaProvider(decryptedKey);
          response = await ollama.chat(messages, options);
        } else {
          response = await aiRouter.chat(messages, options, selectedProvider);
        }

        try {
          await prisma.apiKey.update({
            where: { id: userApiKey.id },
            data: { lastUsedAt: new Date() },
          });
        } catch {}
      } catch (customKeyError: any) {
        logger.warn(`Custom API key for ${selectedProvider} failed (${customKeyError.message}). Falling back to system AI Router.`);
        response = await aiRouter.chat(messages, options, selectedProvider);
      }
    } else {
      // Fallback to system-level configuration
      response = await aiRouter.chat(messages, options, selectedProvider);
    }
  } catch (error: any) {
    logger.warn(`All online AI providers encountered errors (${error.message}). Activating Nexora Local Intelligence Engine.`);
    // Ultimate safety net: never leave user hanging
    response = await fallbackProvider.chat(messages, options);
  }

  try {
    await logActivity(userId, 'ai_chat', 'ai', response.provider || selectedProvider, {
      model: response.model,
      tokensUsed: response.tokensUsed || 0,
    });
  } catch {}

  res.status(200).json(response);
});

/**
 * @route   GET /api/ai/providers
 * @desc    Get status of all registered AI providers
 * @access  Private
 */
router.get('/providers', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const availability = await aiRouter.checkAvailability();
    const providers = aiRouter.listProviders();

    const result = providers.map(name => ({
      name,
      isAvailable: availability[name] ?? true,
      isPrimary: aiRouter.getPrimaryProvider()?.name === name,
    }));

    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
});

export default router;
