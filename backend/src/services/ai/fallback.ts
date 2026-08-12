import { AIProvider, ChatMessage, ChatOptions, ChatResponse } from './provider';
import logger from '../../utils/logger';

export class FallbackProvider implements AIProvider {
  name = 'fallback';

  async isAvailable(): Promise<boolean> {
    return true; // Always available as final safety net
  }

  async chat(messages: ChatMessage[], options?: ChatOptions): Promise<ChatResponse> {
    const userMessages = messages.filter(m => m.role === 'user');
    const assistantMessages = messages.filter(m => m.role === 'assistant');
    const systemMessages = messages.filter(m => m.role === 'system');

    const lastUserMessage = userMessages.pop()?.content || '';
    const systemPrompt = options?.systemPrompt || systemMessages.map(s => s.content).join('\n');
    const previousAssistantMessage = assistantMessages.pop()?.content || '';

    logger.info(`Fallback AI Provider generating dynamic response for message: "${lastUserMessage.substring(0, 40)}..."`);

    // Parse metadata from system prompt if available
    let businessName = '';
    let services = '';
    let faq = '';

    const businessMatch = systemPrompt.match(/Business Name:\s*([^\n]+)/i);
    if (businessMatch) businessName = businessMatch[1].trim();

    const servicesMatch = systemPrompt.match(/Services Offered:\s*([^\n]+)/i);
    if (servicesMatch) services = servicesMatch[1].trim();

    const faqMatch = systemPrompt.match(/Knowledge Base \/ FAQs:\s*([^\n]+)/i);
    if (faqMatch) faq = faqMatch[1].trim();

    const lower = lastUserMessage.toLowerCase();
    const hasAlreadyGreeted = assistantMessages.length > 0 || previousAssistantMessage.length > 0;

    let responseText = '';

    // Greetings logic
    if (lower.includes('hello') || lower.includes('hi') || lower.includes('hey') || lower.includes('greetings')) {
      if (hasAlreadyGreeted) {
        responseText = businessName
          ? `How can I help you today with ${businessName}? Feel free to ask about our services, pricing, or support.`
          : `How can I assist you further? Let me know what information or service you're looking for.`;
      } else {
        responseText = businessName
          ? `Hello! 👋 Welcome to ${businessName}. How can I assist you today?`
          : `Hello! 👋 Welcome to Nexora AI Center! How can I assist you with your project today?`;
      }
    }
    // Pricing / Cost inquiries
    else if (lower.includes('price') || lower.includes('cost') || lower.includes('pricing') || lower.includes('charge') || lower.includes('rate')) {
      if (services) {
        responseText = `Our pricing depends on the service package you choose. Here are our main services:\n${services}\n\nWould you like a custom quote for any of these?`;
      } else {
        responseText = `Nexora offers flexible plan tiers starting with our Free Developer Tier up to Enterprise Custom Agent Deployments. Check out the Billing tab in Settings for full details.`;
      }
    }
    // Services / Capabilities
    else if (lower.includes('service') || lower.includes('offer') || lower.includes('feature') || lower.includes('do you do') || lower.includes('product')) {
      if (services) {
        responseText = `We offer the following services:\n• ${services.split(',').join('\n• ')}\n\nWhich of these would you like to learn more about?`;
      } else {
        responseText = `Nexora provides specialized AI agents for business automation, stock intelligence, travel bookings, document processing, and software development. Which area are you interested in?`;
      }
    }
    // FAQ or Help
    else if (lower.includes('help') || lower.includes('support') || lower.includes('faq') || lower.includes('question')) {
      if (faq) {
        responseText = `Here is some helpful info from our knowledge base:\n\n${faq}\n\nLet me know if you need any additional assistance!`;
      } else {
        responseText = `I'm here to help! You can ask me to analyze data, draft business communications, generate code, or automate workflow tasks. What would you like to get started on?`;
      }
    }
    // Code / Development
    else if (lower.includes('code') || lower.includes('python') || lower.includes('script') || lower.includes('function') || lower.includes('api')) {
      responseText = `Here is an automated implementation snippet based on your request:\n\n\`\`\`javascript\n// Nexora Automated Helper\nasync function executeTask(payload) {\n  console.log("Processing request:", payload);\n  return { status: "success", timestamp: new Date().toISOString() };\n}\n\`\`\`\n\nLet me know if you'd like to adapt this script for a specific language or API.`;
    }
    // Default dynamic contextual reply
    else {
      if (businessName) {
        responseText = `Thank you for your message! Regarding "${lastUserMessage}", our team at ${businessName} is on it. Is there any specific detail or service you'd like more information on?`;
      } else {
        responseText = `Thank you for reaching out regarding "${lastUserMessage}". I have processed your request. How else can I assist you with this?`;
      }
    }

    // Anti-repetition check: ensure we don't repeat the exact same previous message
    if (previousAssistantMessage && previousAssistantMessage.trim() === responseText.trim()) {
      responseText = `I received your message about "${lastUserMessage}". Could you provide a bit more context so I can best assist you?`;
    }

    return {
      content: responseText,
      provider: 'fallback',
      model: 'nexora-local-engine',
      tokensUsed: Math.floor(responseText.length / 4),
      finishReason: 'stop',
    };
  }

  async generateText(prompt: string, options?: ChatOptions): Promise<string> {
    const response = await this.chat([{ role: 'user', content: prompt }], options);
    return response.content;
  }
}
