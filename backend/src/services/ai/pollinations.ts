import { AIProvider, ChatMessage, ChatOptions, ChatResponse } from './provider';
import logger from '../../utils/logger';

/**
 * Pollinations AI Provider - Free, Zero-Config Public LLM Engine (Anonymous Access)
 * Uses the free OpenAI-compatible / text generation endpoint.
 */
export class PollinationsProvider implements AIProvider {
  name = 'pollinations';

  async isAvailable(): Promise<boolean> {
    try {
      const res = await fetch('https://text.pollinations.ai/Hi', {
        method: 'GET',
        signal: AbortSignal.timeout(4000),
      });
      return res.ok;
    } catch {
      return true; // Still attempt on chat
    }
  }

  async chat(messages: ChatMessage[], options?: ChatOptions): Promise<ChatResponse> {
    logger.info(`Pollinations AI generating completion for ${messages.length} messages...`);

    const formattedMessages = messages.map((m) => ({
      role: m.role,
      content: m.content,
    }));

    if (options?.systemPrompt && !formattedMessages.some((m) => m.role === 'system')) {
      formattedMessages.unshift({ role: 'system', content: options.systemPrompt });
    }

    const models = ['openai', 'mistral', 'llama', 'qwen'];
    let lastError: Error | null = null;

    // 1. Try POST with JSON messages body (best for multi-turn & formatting)
    for (const model of models) {
      try {
        const response = await fetch('https://text.pollinations.ai/', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'text/plain',
          },
          body: JSON.stringify({
            messages: formattedMessages,
            model,
            seed: Date.now(),
            jsonMode: false,
          }),
          signal: AbortSignal.timeout(15000),
        });

        if (response.ok) {
          const text = await response.text();
          if (text && text.trim().length > 0) {
            const content = text.trim();
            return {
              content,
              provider: 'pollinations',
              model,
              tokensUsed: Math.floor(content.length / 4),
              finishReason: 'stop',
            };
          }
        }
      } catch (err: any) {
        logger.debug(`Pollinations POST ${model} failed: ${err.message}`);
        lastError = err;
      }
    }

    // 2. Fallback: Try GET with prompt string
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

    for (const model of models) {
      try {
        const encodedPrompt = encodeURIComponent(prompt.slice(-1500));
        const url = `https://text.pollinations.ai/${encodedPrompt}?model=${model}&seed=${Date.now()}`;

        const response = await fetch(url, {
          method: 'GET',
          headers: { 'Accept': 'text/plain' },
          signal: AbortSignal.timeout(10000),
        });

        if (response.ok) {
          const text = await response.text();
          if (text && text.trim().length > 0) {
            const content = text.trim();
            return {
              content,
              provider: 'pollinations',
              model,
              tokensUsed: Math.floor(content.length / 4),
              finishReason: 'stop',
            };
          }
        }
      } catch (err: any) {
        logger.warn(`Pollinations GET ${model} failed: ${err.message}`);
        lastError = err;
      }
    }

    throw lastError || new Error('All Pollinations models failed');
  }

  async generateText(prompt: string, options?: ChatOptions): Promise<string> {
    const response = await this.chat([{ role: 'user', content: prompt }], options);
    return response.content;
  }
}
