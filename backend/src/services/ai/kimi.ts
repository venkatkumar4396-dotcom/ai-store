import { AIProvider, ChatMessage, ChatOptions, ChatResponse } from './provider';
import env from '../../config/env';
import logger from '../../utils/logger';

/**
 * Kimi (Moonshot AI) Provider
 *
 * Uses the OpenAI-compatible API at https://api.moonshot.ai/v1
 * Models: moonshot-v1-128k, moonshot-v1-32k, moonshot-v1-8k
 */

interface KimiChatCompletionResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: Array<{
    index: number;
    message: {
      role: string;
      content: string;
    };
    finish_reason: string;
  }>;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

export class KimiProvider implements AIProvider {
  name = 'kimi';
  private apiKey: string;
  private baseUrl: string;
  private defaultModel: string;

  // Cache availability to avoid redundant health-check calls
  private availabilityVerified: boolean = false;
  private lastAvailabilityCheck: number = 0;
  private readonly AVAILABILITY_CHECK_INTERVAL_MS = 300_000; // 5 minutes

  constructor(apiKey?: string, baseUrl?: string, model?: string) {
    this.apiKey = apiKey || env.KIMI_API_KEY;
    this.baseUrl = (baseUrl || env.KIMI_BASE_URL).replace(/\/+$/, ''); // strip trailing slash
    this.defaultModel = model || env.KIMI_MODEL;

    if (!this.apiKey) {
      logger.warn('Kimi (Moonshot AI) API key not configured');
    }
  }

  async isAvailable(): Promise<boolean> {
    if (!this.apiKey) return false;

    // Return cached result if recently verified
    const now = Date.now();
    if (this.availabilityVerified && now - this.lastAvailabilityCheck < this.AVAILABILITY_CHECK_INTERVAL_MS) {
      return true;
    }

    try {
      // Use the /models endpoint as a lightweight health check
      const response = await fetch(`${this.baseUrl}/models`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
        },
        signal: AbortSignal.timeout(8000),
      });

      const available = response.ok;
      if (available) {
        this.availabilityVerified = true;
        this.lastAvailabilityCheck = now;
      }
      return available;
    } catch (error: any) {
      logger.debug(`Kimi availability check failed: ${error.message}`);
      this.availabilityVerified = false;
      return false;
    }
  }

  async chat(messages: ChatMessage[], options?: ChatOptions): Promise<ChatResponse> {
    let modelName = options?.model || this.defaultModel;

    // If the requested model belongs to another provider, use our default
    const lowerModel = modelName.toLowerCase();
    if (
      lowerModel.includes('gemini') ||
      lowerModel.includes('gpt') ||
      lowerModel.includes('claude') ||
      lowerModel.includes('llama') ||
      lowerModel.includes('mistral') ||
      lowerModel.includes('phi')
    ) {
      modelName = this.defaultModel;
    }

    // Build the OpenAI-compatible messages array
    const apiMessages: Array<{ role: string; content: string }> = [];

    // Add system prompt if provided in options
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
      const response = await fetch(`${this.baseUrl}/chat/completions`, {
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
        signal: AbortSignal.timeout(120000), // 2 minute timeout
      });

      if (!response.ok) {
        const errorText = await response.text();
        let parsedError = errorText;
        try {
          const errJson = JSON.parse(errorText);
          parsedError = errJson.error?.message || errJson.message || errorText;
        } catch {
          // Keep raw text if not JSON
        }

        const isRateLimitOrQuota = response.status === 429 || response.status === 403 || response.status === 400;
        const errorMsg = isRateLimitOrQuota
          ? `Kimi API limit reached (${response.status}): ${parsedError}`
          : `Kimi API returned ${response.status}: ${parsedError}`;

        // Temporarily disable provider cache on rate limit / server error
        this.availabilityVerified = false;
        this.lastAvailabilityCheck = Date.now(); // Rate limit means don't retry immediately

        logger.warn(`Kimi Provider Error [${response.status}]: ${parsedError}`);
        throw new Error(errorMsg);
      }

      const data = (await response.json()) as KimiChatCompletionResponse;

      const choice = data.choices?.[0];
      if (!choice) {
        throw new Error('Kimi API returned no choices');
      }

      // Mark availability as verified on success
      this.availabilityVerified = true;
      this.lastAvailabilityCheck = Date.now();

      return {
        content: choice.message.content,
        provider: 'kimi',
        model: data.model || modelName,
        tokensUsed: data.usage?.total_tokens,
        finishReason: choice.finish_reason || 'stop',
      };
    } catch (error: any) {
      // Invalidate cache on failure
      this.availabilityVerified = false;
      logger.error(`Kimi chat error: ${error.message}`);
      throw new Error(`Kimi API error: ${error.message}`);
    }
  }

  async generateText(prompt: string, options?: ChatOptions): Promise<string> {
    const response = await this.chat([{ role: 'user', content: prompt }], options);
    return response.content;
  }
}
