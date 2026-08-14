import { AIProvider, ChatMessage, ChatOptions, ChatResponse } from './provider';
import env from '../../config/env';
import logger from '../../utils/logger';

/**
 * Meta / Llama API Provider
 *
 * Uses the Llama API / OpenAI-compatible endpoint
 * Endpoint: https://api.llama-api.com/chat/completions (or OpenAI-compatible standard)
 * Models: llama3.3-70b, llama3.1-70b, llama3.1-8b, llama3-70b
 */

interface MetaChatCompletionResponse {
  id?: string;
  object?: string;
  created?: number;
  model?: string;
  choices?: Array<{
    index?: number;
    message?: {
      role: string;
      content: string;
    };
    finish_reason?: string;
  }>;
  usage?: {
    prompt_tokens?: number;
    completion_tokens?: number;
    total_tokens?: number;
  };
}

export class MetaLlamaProvider implements AIProvider {
  name = 'meta';
  private apiKey: string;
  private baseUrl: string;
  private defaultModel: string;

  private availabilityVerified: boolean = false;
  private lastAvailabilityCheck: number = 0;
  private readonly AVAILABILITY_CHECK_INTERVAL_MS = 300_000; // 5 minutes

  constructor(apiKey?: string, baseUrl?: string, model?: string) {
    this.apiKey = apiKey || env.META_API_KEY || 'LLM_1958630808184263_hfZ4QHw6laX-PjUxOg5Io0y8mKs';
    this.baseUrl = (baseUrl || env.META_BASE_URL || 'https://api.llama-api.com').replace(/\/+$/, '');
    this.defaultModel = model || env.META_MODEL || 'llama3.3-70b';

    if (!this.apiKey) {
      logger.warn('Meta / Llama API key not configured');
    }
  }

  async isAvailable(): Promise<boolean> {
    if (!this.apiKey) return false;

    const now = Date.now();
    if (this.availabilityVerified && now - this.lastAvailabilityCheck < this.AVAILABILITY_CHECK_INTERVAL_MS) {
      return true;
    }

    try {
      // Direct quick ping
      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model: this.defaultModel,
          messages: [{ role: 'user', content: 'hi' }],
          max_tokens: 5,
        }),
        signal: AbortSignal.timeout(8000),
      });

      const available = response.ok || response.status === 400 || response.status === 429;
      if (response.ok) {
        this.availabilityVerified = true;
        this.lastAvailabilityCheck = now;
      }
      return available;
    } catch (error: any) {
      logger.debug(`Meta Llama availability check error: ${error.message}`);
      return true; // Still attempt on chat if network glitch
    }
  }

  async chat(messages: ChatMessage[], options?: ChatOptions): Promise<ChatResponse> {
    const modelName = options?.model || this.defaultModel;

    const apiMessages: Array<{ role: string; content: string }> = [];

    if (options?.systemPrompt) {
      apiMessages.push({ role: 'system', content: options.systemPrompt });
    }

    for (const msg of messages) {
      apiMessages.push({
        role: msg.role,
        content: msg.content,
      });
    }

    try {
      const endpoint = this.baseUrl.endsWith('/chat/completions')
        ? this.baseUrl
        : `${this.baseUrl}/chat/completions`;

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model: modelName,
          messages: apiMessages,
          temperature: options?.temperature ?? 0.7,
          max_tokens: options?.maxTokens ?? 2048,
        }),
        signal: AbortSignal.timeout(60000), // 60s timeout
      });

      if (!response.ok) {
        const errorText = await response.text();
        let parsedError = errorText;
        try {
          const errJson = JSON.parse(errorText);
          parsedError = errJson.error?.message || errJson.message || errorText;
        } catch {
          // keep raw text
        }

        logger.warn(`Meta Llama API error [${response.status}]: ${parsedError}`);
        throw new Error(`Meta Llama API returned ${response.status}: ${parsedError}`);
      }

      const data = (await response.json()) as MetaChatCompletionResponse;
      const choice = data.choices?.[0];

      if (!choice || !choice.message) {
        throw new Error('Meta Llama API returned no choices');
      }

      this.availabilityVerified = true;
      this.lastAvailabilityCheck = Date.now();

      return {
        content: choice.message.content,
        provider: 'meta',
        model: data.model || modelName,
        tokensUsed: data.usage?.total_tokens,
        finishReason: choice.finish_reason || 'stop',
      };
    } catch (error: any) {
      this.availabilityVerified = false;
      logger.error(`Meta Llama chat error: ${error.message}`);
      throw new Error(`Meta Llama API error: ${error.message}`);
    }
  }

  async generateText(prompt: string, options?: ChatOptions): Promise<string> {
    const response = await this.chat([{ role: 'user', content: prompt }], options);
    return response.content;
  }
}
