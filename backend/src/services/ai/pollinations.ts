import { AIProvider, ChatMessage, ChatOptions, ChatResponse } from './provider';
import logger from '../../utils/logger';

/**
 * Pollinations AI Provider - Free, Zero-Config Public OpenAI-Compatible LLM Engine
 * Endpoint: https://text.pollinations.ai/openai/chat/completions
 * Supports automatic fallback across multiple models: openai, mistral, llama, qwen
 */
export class PollinationsProvider implements AIProvider {
  name = 'pollinations';
  private endpoint = 'https://text.pollinations.ai/openai/chat/completions';
  private fallbackModels = ['openai', 'mistral', 'llama', 'qwen'];

  async isAvailable(): Promise<boolean> {
    try {
      const res = await fetch(this.endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [{ role: 'user', content: 'ping' }],
          max_tokens: 5,
        }),
        signal: AbortSignal.timeout(6000),
      });
      return res.ok;
    } catch {
      return true; // Assume available as public zero-config service
    }
  }

  async chat(messages: ChatMessage[], options?: ChatOptions): Promise<ChatResponse> {
    logger.info(`Pollinations AI Provider generating completion for ${messages.length} messages...`);

    const formattedMessages: Array<{ role: string; content: string }> = [];

    if (options?.systemPrompt) {
      formattedMessages.push({ role: 'system', content: options.systemPrompt });
    }

    for (const msg of messages) {
      formattedMessages.push({
        role: msg.role,
        content: msg.content,
      });
    }

    const requestedModel = options?.model || 'openai';
    const modelsToTry = [requestedModel, ...this.fallbackModels.filter(m => m !== requestedModel)];

    let lastError: Error | null = null;

    for (const modelCandidate of modelsToTry) {
      try {
        const payload = {
          model: modelCandidate,
          messages: formattedMessages,
          temperature: options?.temperature ?? 0.7,
          max_tokens: options?.maxTokens ?? 350,
        };

        const response = await fetch(this.endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
          signal: AbortSignal.timeout(15000),
        });

        if (!response.ok) {
          const errText = await response.text();
          throw new Error(`Pollinations AI model ${modelCandidate} failed (${response.status}): ${errText}`);
        }

        const data: any = await response.json();
        const content = data?.choices?.[0]?.message?.content || '';

        if (!content || content.trim().length === 0) {
          throw new Error(`Pollinations AI model ${modelCandidate} returned empty content`);
        }

        return {
          content: content.trim(),
          provider: 'pollinations',
          model: data?.model || modelCandidate,
          tokensUsed: data?.usage?.total_tokens || Math.floor(content.length / 4),
          finishReason: data?.choices?.[0]?.finish_reason || 'stop',
        };
      } catch (err: any) {
        logger.warn(`Pollinations AI model ${modelCandidate} attempt failed: ${err.message}`);
        lastError = err;
        continue;
      }
    }

    throw lastError || new Error('All Pollinations AI free model fallbacks failed.');
  }

  async generateText(prompt: string, options?: ChatOptions): Promise<string> {
    const response = await this.chat([{ role: 'user', content: prompt }], options);
    return response.content;
  }
}
