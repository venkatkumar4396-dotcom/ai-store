import logger from '../../utils/logger';

/**
 * AI Provider interface - all providers must implement this
 */
export interface AIProvider {
  name: string;
  isAvailable(): Promise<boolean>;
  chat(messages: ChatMessage[], options?: ChatOptions): Promise<ChatResponse>;
  generateText(prompt: string, options?: ChatOptions): Promise<string>;
}

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface ChatOptions {
  temperature?: number;
  maxTokens?: number;
  model?: string;
  systemPrompt?: string;
}

export interface ChatResponse {
  content: string;
  provider: string;
  model: string;
  tokensUsed?: number;
  finishReason?: string;
}

/**
 * AI Provider Router - manages multiple AI providers with fallback
 *
 * Routing priority:
 *   1. Explicitly requested provider (via preferredProvider parameter)
 *   2. Primary provider (set during registration)
 *   3. All other registered providers in insertion order
 *
 * Availability results are cached for 60 seconds to avoid
 * redundant health-check calls on every request.
 */
export class AIProviderRouter {
  private providers: Map<string, AIProvider> = new Map();
  private primaryProvider: string = '';

  // Availability cache: provider name → { available, timestamp }
  private availabilityCache: Map<string, { available: boolean; timestamp: number }> = new Map();
  private readonly AVAILABILITY_CACHE_TTL_MS = 60_000; // 60 seconds

  registerProvider(provider: AIProvider, isPrimary: boolean = false): void {
    this.providers.set(provider.name, provider);
    if (isPrimary || this.providers.size === 1) {
      this.primaryProvider = provider.name;
    }
    logger.info(`AI Provider registered: ${provider.name}${isPrimary ? ' (primary)' : ''}`);
  }

  getProvider(name: string): AIProvider | undefined {
    return this.providers.get(name);
  }

  getPrimaryProvider(): AIProvider | undefined {
    return this.providers.get(this.primaryProvider);
  }

  listProviders(): string[] {
    return Array.from(this.providers.keys());
  }

  /**
   * Check if a provider is available, with caching.
   */
  private async isProviderAvailable(provider: AIProvider): Promise<boolean> {
    const cached = this.availabilityCache.get(provider.name);
    if (cached && Date.now() - cached.timestamp < this.AVAILABILITY_CACHE_TTL_MS) {
      return cached.available;
    }

    try {
      const available = await provider.isAvailable();
      this.availabilityCache.set(provider.name, { available, timestamp: Date.now() });
      return available;
    } catch {
      this.availabilityCache.set(provider.name, { available: false, timestamp: Date.now() });
      return false;
    }
  }

  /**
   * Invalidate the availability cache for a specific provider (e.g. after a failure).
   */
  private invalidateCache(providerName: string): void {
    this.availabilityCache.delete(providerName);
  }

  /**
   * Chat using providers with smart fallback.
   *
   * Order: preferredProvider → primaryProvider → all others
   */
  async chat(messages: ChatMessage[], options?: ChatOptions, preferredProvider?: string): Promise<ChatResponse> {
    // Build an ordered list of providers to try
    const tryOrder: string[] = [];

    if (preferredProvider && this.providers.has(preferredProvider)) {
      tryOrder.push(preferredProvider);
    }
    if (this.primaryProvider && !tryOrder.includes(this.primaryProvider)) {
      tryOrder.push(this.primaryProvider);
    }
    for (const name of this.providers.keys()) {
      if (!tryOrder.includes(name)) {
        tryOrder.push(name);
      }
    }

    let lastError: Error | null = null;

    for (const name of tryOrder) {
      const provider = this.providers.get(name)!;
      try {
        const available = await this.isProviderAvailable(provider);
        if (!available) {
          logger.debug(`AI Router: Provider ${name} is not available, skipping`);
          continue;
        }

        logger.info(`AI Router: Using provider ${name}`);
        const startTime = Date.now();

        // Wrap the call in a timeout (60 seconds) to prevent hanging
        const timeoutMs = 60_000;
        const response = await Promise.race([
          provider.chat(messages, options),
          new Promise<never>((_, reject) =>
            setTimeout(() => reject(new Error(`AI Provider ${name} timed out after ${timeoutMs}ms`)), timeoutMs)
          ),
        ]);

        const elapsed = Date.now() - startTime;
        logger.info(`AI Router: Provider ${name} responded in ${elapsed}ms`);
        return response;
      } catch (err: any) {
        lastError = err;
        // Invalidate cache so next request re-checks
        this.invalidateCache(name);
        logger.warn(`AI Provider ${name} chat failed: ${err.message}`);
        continue;
      }
    }

    throw lastError || new Error('No AI providers are currently available');
  }

  /**
   * Generate text using the primary provider with fallback
   */
  async generateText(prompt: string, options?: ChatOptions, preferredProvider?: string): Promise<string> {
    const response = await this.chat(
      [{ role: 'user', content: prompt }],
      options,
      preferredProvider
    );
    return response.content;
  }

  /**
   * Check availability of all providers
   */
  async checkAvailability(): Promise<Record<string, boolean>> {
    const status: Record<string, boolean> = {};
    for (const [name, provider] of this.providers) {
      try {
        status[name] = await provider.isAvailable();
      } catch {
        status[name] = false;
      }
    }
    return status;
  }
}

// Singleton instance
export const aiRouter = new AIProviderRouter();
