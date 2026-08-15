import { AIProvider, ChatMessage, ChatOptions, ChatResponse } from './provider';
import logger from '../../utils/logger';

/**
 * Pollinations AI Provider - Free, Zero-Config Public LLM Engine (Anonymous Access)
 * Uses the anonymous text generation endpoint which is NOT rate-limited for free users.
 */
export class PollinationsProvider implements AIProvider {
  name = 'pollinations';

  async isAvailable(): Promise<boolean> {
    try {
      const res = await fetch('https://text.pollinations.ai/Hi', {
        method: 'GET',
        signal: AbortSignal.timeout(5000),
      });
      return res.ok;
    } catch {
      return false;
    }
  }

  async chat(messages: ChatMessage[], options?: ChatOptions): Promise<ChatResponse> {
    logger.info(`Pollinations AI generating completion for ${messages.length} messages...`);

    // Build a single prompt from messages
    let prompt = '';
    for (const msg of messages) {
      if (msg.role === 'system') {
        prompt += `System: ${msg.content}\n\n`;
      } else if (msg.role === 'user') {
        prompt += `User: ${msg.content}\n\n`;
      } else if (msg.role === 'assistant') {
        prompt += `Assistant: ${msg.content}\n\n`;
      }
    }
    prompt += 'Assistant:';

    // Try multiple model endpoints
    const models = ['openai', 'mistral', 'llama', 'qwen'];
    let lastError: Error | null = null;

    for (const model of models) {
      try {
        const encodedPrompt = encodeURIComponent(prompt.slice(-2000));
        const url = `https://text.pollinations.ai/${encodedPrompt}?model=${model}&seed=${Date.now()}`;

        const response = await fetch(url, {
          method: 'GET',
          headers: { 'Accept': 'text/plain' },
          signal: AbortSignal.timeout(15000),
        });

        if (!response.ok) {
          throw new Error(`Pollinations ${model} returned HTTP ${response.status}`);
        }

        const text = await response.text();
        if (!text || text.trim().length === 0) {
          throw new Error(`Pollinations ${model} returned empty response`);
        }

        const content = text.trim();
        return {
          content,
          provider: 'pollinations',
          model,
          tokensUsed: Math.floor(content.length / 4),
          finishReason: 'stop',
        };
      } catch (err: any) {
        logger.warn(`Pollinations ${model} failed: ${err.message}`);
        lastError = err;
        continue;
      }
    }

    throw lastError || new Error('All Pollinations models failed');
  }

  async generateText(prompt: string, options?: ChatOptions): Promise<string> {
    const response = await this.chat([{ role: 'user', content: prompt }], options);
    return response.content;
  }
}
