import { AIProvider, ChatMessage, ChatOptions, ChatResponse } from './provider';
import env from '../../config/env';
import logger from '../../utils/logger';

interface OllamaResponse {
  model: string;
  message: {
    role: string;
    content: string;
  };
  done: boolean;
  total_duration?: number;
  eval_count?: number;
}

export class OllamaProvider implements AIProvider {
  name = 'ollama';
  private baseUrl: string;
  private defaultModel: string;

  constructor(baseUrl?: string, model?: string) {
    this.baseUrl = baseUrl || env.OLLAMA_BASE_URL;
    this.defaultModel = model || env.OLLAMA_MODEL;
  }

  async isAvailable(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/api/tags`, {
        signal: AbortSignal.timeout(3000),
      });
      return response.ok;
    } catch (error: any) {
      logger.debug(`Ollama availability check failed: ${error.message}`);
      return false;
    }
  }

  async chat(messages: ChatMessage[], options?: ChatOptions): Promise<ChatResponse> {
    let modelName = options?.model || this.defaultModel;

    // If the requested model is clearly for a different provider (e.g. Gemini, OpenAI, Claude),
    // override it to use the default Ollama model to prevent 404 errors.
    const lowerModel = modelName.toLowerCase();
    if (lowerModel.includes('gemini') || lowerModel.includes('gpt') || lowerModel.includes('claude')) {
      modelName = this.defaultModel;
    }


    // Convert messages to Ollama format
    const ollamaMessages = messages.map(msg => ({
      role: msg.role === 'assistant' ? 'assistant' : msg.role === 'system' ? 'system' : 'user',
      content: msg.content,
    }));

    // If there's a system prompt in options, prepend it
    if (options?.systemPrompt) {
      ollamaMessages.unshift({
        role: 'system',
        content: options.systemPrompt,
      });
    }

    try {
      const response = await fetch(`${this.baseUrl}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: modelName,
          messages: ollamaMessages,
          stream: false,
          options: {
            temperature: options?.temperature ?? 0.7,
            num_predict: options?.maxTokens ?? 2048,
          },
        }),
        signal: AbortSignal.timeout(120000), // 2 minute timeout for local models
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Ollama API returned ${response.status}: ${errorText}`);
      }

      const data = (await response.json()) as OllamaResponse;

      return {
        content: data.message.content,
        provider: 'ollama',
        model: data.model || modelName,
        tokensUsed: data.eval_count,
        finishReason: data.done ? 'stop' : 'length',
      };
    } catch (error: any) {
      logger.error(`Ollama chat error: ${error.message}`);
      throw new Error(`Ollama API error: ${error.message}`);
    }
  }

  async generateText(prompt: string, options?: ChatOptions): Promise<string> {
    const response = await this.chat([{ role: 'user', content: prompt }], options);
    return response.content;
  }

  /**
   * List available models on the Ollama instance
   */
  async listModels(): Promise<string[]> {
    try {
      const response = await fetch(`${this.baseUrl}/api/tags`, {
        signal: AbortSignal.timeout(5000),
      });

      if (!response.ok) {
        throw new Error(`Failed to list models: ${response.status}`);
      }

      const data = (await response.json()) as { models: Array<{ name: string }> };
      return data.models.map(m => m.name);
    } catch (error: any) {
      logger.error(`Ollama list models error: ${error.message}`);
      return [];
    }
  }
}
