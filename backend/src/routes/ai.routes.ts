import { Router, Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate } from '../middleware/auth';
import { aiLimiter } from '../middleware/rateLimit';
import { aiRouter, ChatMessage, ChatOptions } from '../services/ai/provider';
import { KimiProvider } from '../services/ai/kimi';
import { GeminiProvider } from '../services/ai/gemini';
import { OllamaProvider } from '../services/ai/ollama';
import { decrypt } from '../utils/crypto';
import { logActivity } from '../services/analytics.service';
import logger from '../utils/logger';

const router = Router();
const prisma = new PrismaClient();

/**
 * @route   POST /api/ai/chat
 * @desc    Chat with an AI model (Gemini/Ollama) with fallbacks and custom keys
 * @access  Private
 */
router.post('/chat', authenticate, aiLimiter, async (req: Request, res: Response, next: NextFunction) => {
  try {
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
      : 'kimi'; // Default to primary provider (Kimi/Moonshot AI)
      
    logger.info(`AI Route: Selected provider ${selectedProvider} (requested: ${provider || 'default'})`);
    let response;

    // Check if user has their own API key for this provider
    const userApiKey = await prisma.apiKey.findFirst({
      where: { userId, provider: selectedProvider, isActive: true },
    });

    if (userApiKey) {
      logger.info(`Using user custom API key for ${selectedProvider} (user: ${userId})`);
      const decryptedKey = decrypt(userApiKey.encryptedKey);

      try {
        if (selectedProvider === 'kimi') {
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

        // Update last used time on the API key
        await prisma.apiKey.update({
          where: { id: userApiKey.id },
          data: { lastUsedAt: new Date() },
        });
      } catch (customKeyError: any) {
        logger.warn(`Custom API key for ${selectedProvider} failed (${customKeyError.message}). Falling back to system AI Router.`);
        response = await aiRouter.chat(messages, options, selectedProvider);
      }
    } else {
      // Fallback to system-level configuration
      response = await aiRouter.chat(messages, options, selectedProvider);
    }

    // Log the AI activity
    await logActivity(userId, 'ai_chat', 'ai', selectedProvider, {
      model: response.model,
      tokensUsed: response.tokensUsed || 0,
    });

    res.status(200).json(response);
  } catch (error: any) {
    next(error);
  }
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
      isAvailable: availability[name] || false,
      isPrimary: aiRouter.getPrimaryProvider()?.name === name,
    }));

    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
});

export default router;
