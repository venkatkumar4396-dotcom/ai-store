import { AIProvider, ChatMessage, ChatOptions, ChatResponse } from './provider';
import env from '../../config/env';
import logger from '../../utils/logger';

/**
 * Groq AI Provider - Ultra-fast, free tier LLM inference (500+ tokens/sec)
 * Supports LLaMA 3.3 70B, DeepSeek R1 Distill, Mixtral, and Gemma.
 */
export class GroqProvider implements AIProvider {
  name = 'groq';
  private defaultModel = 'llama-3.3-70b-versatile';
  private apiKey: string;
  private baseUrl = 'https://api.groq.com/openai/v1';

  private availabilityVerified: boolean = false;
  private lastAvailabilityCheck: number = 0;
  private readonly AVAILABILITY_CHECK_INTERVAL_MS = 300_000; // 5 minutes

  constructor(apiKey?: string) {
    this.apiKey = apiKey || env.GROQ_API_KEY || '';
    if (!this.apiKey) {
      logger.debug('Groq API key not configured');
    }
  }

  async isAvailable(): Promise<boolean> {
    if (!this.apiKey) return false;

    const now = Date.now();
    if (this.availabilityVerified && now - this.lastAvailabilityCheck < this.AVAILABILITY_CHECK_INTERVAL_MS) {
      return true;
    }

    try {
      const res = await fetch(`${this.baseUrl}/models`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
        },
        signal: AbortSignal.timeout(5000),
      });

      const available = res.ok;
      if (available) {
        this.availabilityVerified = true;
        this.lastAvailabilityCheck = now;
      }
      return available;
    } catch (error: any) {
      logger.debug(`Groq availability check failed: ${error.message}`);
      this.availabilityVerified = false;
      return false;
    }
  }

  async chat(messages: ChatMessage[], options?: ChatOptions): Promise<ChatResponse> {
    if (!this.apiKey) {
      throw new Error('Groq API key is not configured');
    }

    const modelName = options?.model || env.GROQ_MODEL || this.defaultModel;

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

    try {
      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model: modelName,
          messages: formattedMessages,
          temperature: options?.temperature ?? 0.7,
          max_tokens: options?.maxTokens ?? 2048,
        }),
        signal: AbortSignal.timeout(30000),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Groq API returned HTTP ${response.status}: ${errorText}`);
      }

      const data: any = await response.json();
      const choice = data.choices?.[0];
      const content = choice?.message?.content || '';

      this.availabilityVerified = true;
      this.lastAvailabilityCheck = Date.now();

      return {
        content,
        provider: 'groq',
        model: data.model || modelName,
        tokensUsed: data.usage?.total_tokens || Math.floor(content.length / 4),
        finishReason: choice?.finish_reason || 'stop',
      };
    } catch (error: any) {
      this.availabilityVerified = false;
      logger.error(`Groq chat error: ${error.message}`);
      throw new Error(`Groq API error: ${error.message}`);
    }
  }

  async generateText(prompt: string, options?: ChatOptions): Promise<string> {
    const response = await this.chat([{ role: 'user', content: prompt }], options);
    return response.content;
  }
}
