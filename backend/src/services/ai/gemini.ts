import { GoogleGenerativeAI, GenerativeModel } from '@google/generative-ai';
import { AIProvider, ChatMessage, ChatOptions, ChatResponse } from './provider';
import env from '../../config/env';
import logger from '../../utils/logger';

export class GeminiProvider implements AIProvider {
  name = 'gemini';
  private client: GoogleGenerativeAI;
  private defaultModel = 'gemini-2.0-flash';

  // Cache the availability result to avoid wasteful "Say ok" calls
  private availabilityVerified: boolean = false;
  private lastAvailabilityCheck: number = 0;
  private readonly AVAILABILITY_CHECK_INTERVAL_MS = 300_000; // Re-verify every 5 minutes

  constructor(apiKey?: string) {
    const key = apiKey || env.GEMINI_API_KEY;
    if (!key) {
      logger.warn('Gemini API key not configured');
    }
    this.client = new GoogleGenerativeAI(key || '');
  }

  async isAvailable(): Promise<boolean> {
    if (!env.GEMINI_API_KEY) return false;

    // If we've successfully verified recently, return cached result
    const now = Date.now();
    if (this.availabilityVerified && now - this.lastAvailabilityCheck < this.AVAILABILITY_CHECK_INTERVAL_MS) {
      return true;
    }

    try {
      const model = this.client.getGenerativeModel({ model: this.defaultModel });
      const result = await model.generateContent('Say "ok"');
      const available = !!result.response.text();
      if (available) {
        this.availabilityVerified = true;
        this.lastAvailabilityCheck = now;
      }
      return available;
    } catch (error: any) {
      logger.debug(`Gemini availability check failed: ${error.message}`);
      this.availabilityVerified = false;
      return false;
    }
  }

  async chat(messages: ChatMessage[], options?: ChatOptions): Promise<ChatResponse> {
    let modelName = options?.model || this.defaultModel;

    // If the requested model is clearly for a different provider (e.g. Ollama, Llama, Mistral),
    // override it to use the default Gemini model to prevent errors.
    const lowerModel = modelName.toLowerCase();
    if (lowerModel.includes('llama') || lowerModel.includes('mistral') || lowerModel.includes('phi') || lowerModel.includes('gemma')) {
      modelName = this.defaultModel;
    }

    const model = this.client.getGenerativeModel({
      model: modelName,
      generationConfig: {
        temperature: options?.temperature ?? 0.7,
        maxOutputTokens: options?.maxTokens ?? 2048,
      },
    });

    // Build the chat history and current message
    const history: Array<{ role: string; parts: Array<{ text: string }> }> = [];
    let systemInstruction = options?.systemPrompt || '';
    let lastUserMessage = '';

    for (const msg of messages) {
      if (msg.role === 'system') {
        systemInstruction = msg.content;
      } else if (msg.role === 'user') {
        lastUserMessage = msg.content;
        // Only add to history if it's not the last message
      } else if (msg.role === 'assistant') {
        history.push({ role: 'model', parts: [{ text: msg.content }] });
      }
    }

    // Build user messages for history (all except the last)
    const userMessages = messages.filter(m => m.role === 'user');
    for (let i = 0; i < userMessages.length - 1; i++) {
      // Insert user message before the corresponding model response
      const historyIndex = i * 2;
      history.splice(historyIndex, 0, { role: 'user', parts: [{ text: userMessages[i].content }] });
    }

    // If we have a system instruction, prepend it to the first user message or use as context
    if (systemInstruction && lastUserMessage) {
      lastUserMessage = `System Instructions: ${systemInstruction}\n\n${lastUserMessage}`;
    } else if (systemInstruction && !lastUserMessage) {
      lastUserMessage = systemInstruction;
    }

    try {
      let result;
      if (history.length > 0) {
        const chat = model.startChat({ history });
        result = await chat.sendMessage(lastUserMessage);
      } else {
        result = await model.generateContent(lastUserMessage);
      }

      const text = result.response.text();
      const usageMetadata = result.response.usageMetadata;

      // Mark as verified since the call succeeded
      this.availabilityVerified = true;
      this.lastAvailabilityCheck = Date.now();

      return {
        content: text,
        provider: 'gemini',
        model: modelName,
        tokensUsed: usageMetadata?.totalTokenCount,
        finishReason: result.response.candidates?.[0]?.finishReason || 'stop',
      };
    } catch (error: any) {
      // Invalidate availability cache on failure
      this.availabilityVerified = false;
      logger.error(`Gemini chat error: ${error.message}`);
      throw new Error(`Gemini API error: ${error.message}`);
    }
  }

  async generateText(prompt: string, options?: ChatOptions): Promise<string> {
    const response = await this.chat([{ role: 'user', content: prompt }], options);
    return response.content;
  }
}
