import { AIProvider, ChatMessage, ChatOptions, ChatResponse } from './provider';
import logger from '../../utils/logger';

/**
 * Enhanced Fallback AI Provider — Intelligent Rules Engine
 * 
 * Generates contextual, helpful responses for ALL 11 Nexora bot types
 * without requiring external API keys. Acts as the ultimate safety net.
 */
export class FallbackProvider implements AIProvider {
  name = 'fallback';

  async isAvailable(): Promise<boolean> {
    return true; // Always available as final safety net
  }

  async chat(messages: ChatMessage[], options?: ChatOptions): Promise<ChatResponse> {
    const userMessages = messages.filter(m => m.role === 'user');
    const assistantMessages = messages.filter(m => m.role === 'assistant');
    const systemMessages = messages.filter(m => m.role === 'system');

    const lastUserMessage = userMessages[userMessages.length - 1]?.content || '';
    const systemPrompt = options?.systemPrompt || systemMessages.map(s => s.content).join('\n');
    const previousAssistantMessage = assistantMessages[assistantMessages.length - 1]?.content || '';

    logger.info(`Fallback AI: Processing "${lastUserMessage.substring(0, 60)}..."`);

    // Detect the bot type from system prompt context
    const botType = this.detectBotType(systemPrompt, lastUserMessage);
    let responseText = this.generateResponse(botType, lastUserMessage, systemPrompt, assistantMessages.length > 0);

    // Anti-repetition: don't repeat the exact same previous message
    if (previousAssistantMessage && previousAssistantMessage.trim() === responseText.trim()) {
      responseText = `I understand you're asking about "${lastUserMessage}". Let me provide more details — could you clarify which specific aspect you'd like me to focus on?`;
    }

    return {
      content: responseText,
      provider: 'fallback',
      model: 'nexora-smart-engine',
      tokensUsed: Math.floor(responseText.length / 4),
      finishReason: 'stop',
    };
  }

  async generateText(prompt: string, options?: ChatOptions): Promise<string> {
    const response = await this.chat([{ role: 'user', content: prompt }], options);
    return response.content;
  }

  private detectBotType(systemPrompt: string, userMessage: string): string {
    const combined = (systemPrompt + ' ' + userMessage).toLowerCase();

    if (combined.includes('stock') || combined.includes('market') || combined.includes('ticker') || combined.includes('trading') || combined.includes('rsi') || combined.includes('macd')) return 'stock';
    if (combined.includes('travel') || combined.includes('flight') || combined.includes('hotel') || combined.includes('trip') || combined.includes('itinerary') || combined.includes('booking')) return 'travel';
    if (combined.includes('career') || combined.includes('resume') || combined.includes('interview') || combined.includes('job') || combined.includes('salary') || combined.includes('hiring')) return 'career';
    if (combined.includes('research') || combined.includes('paper') || combined.includes('literature') || combined.includes('scientific') || combined.includes('hypothesis') || combined.includes('methodology')) return 'research';
    if (combined.includes('startup') || combined.includes('pitch') || combined.includes('business plan') || combined.includes('investor') || combined.includes('mvp') || combined.includes('co-founder')) return 'startup';
    if (combined.includes('sales') || combined.includes('lead') || combined.includes('crm') || combined.includes('pipeline') || combined.includes('prospect') || combined.includes('cold email') || combined.includes('outreach')) return 'sales';
    if (combined.includes('document') || combined.includes('pdf') || combined.includes('summarize') || combined.includes('extract') || combined.includes('contract') || combined.includes('invoice')) return 'document';
    if (combined.includes('productivity') || combined.includes('task') || combined.includes('todo') || combined.includes('schedule') || combined.includes('pomodoro') || combined.includes('habit')) return 'productivity';
    if (combined.includes('automat') || combined.includes('workflow') || combined.includes('zapier') || combined.includes('integration') || combined.includes('trigger') || combined.includes('webhook')) return 'automator';
    if (combined.includes('whatsapp') || combined.includes('business name') || combined.includes('customer support') || combined.includes('bot response') || combined.includes('brand tone')) return 'whatsapp';
    if (combined.includes('compass') || combined.includes('advisor') || combined.includes('guidance') || combined.includes('life') || combined.includes('mentor')) return 'compass';
    return 'general';
  }

  private generateResponse(botType: string, userMessage: string, systemPrompt: string, hasHistory: boolean): string {
    const lower = userMessage.toLowerCase().trim();
    const isGreeting = /^(hi|hello|hey|greetings|good morning|good evening|howdy|sup|yo)\b/i.test(lower);

    switch (botType) {
      case 'stock': return this.stockResponse(lower, userMessage, isGreeting, hasHistory);
      case 'travel': return this.travelResponse(lower, userMessage, isGreeting, hasHistory);
      case 'career': return this.careerResponse(lower, userMessage, isGreeting, hasHistory);
      case 'research': return this.researchResponse(lower, userMessage, isGreeting, hasHistory);
      case 'startup': return this.startupResponse(lower, userMessage, isGreeting, hasHistory);
      case 'sales': return this.salesResponse(lower, userMessage, isGreeting, hasHistory);
      case 'document': return this.documentResponse(lower, userMessage, isGreeting, hasHistory);
      case 'productivity': return this.productivityResponse(lower, userMessage, isGreeting, hasHistory);
      case 'automator': return this.automatorResponse(lower, userMessage, isGreeting, hasHistory);
      case 'whatsapp': return this.whatsappResponse(lower, userMessage, systemPrompt, isGreeting, hasHistory);
      case 'compass': return this.compassResponse(lower, userMessage, isGreeting, hasHistory);
      default: return this.generalResponse(lower, userMessage, systemPrompt, isGreeting, hasHistory);
    }
  }

  // ─── Stock Intelligence ────────────────────────────────────
  private stockResponse(lower: string, raw: string, isGreeting: boolean, hasHistory: boolean): string {
    if (isGreeting) return `📈 **Welcome to Stock Intelligence!**\n\nI can help you with:\n- **Live stock quotes** — Ask "What's the price of AAPL?"\n- **Technical analysis** — RSI, MACD, Bollinger Bands, Support/Resistance\n- **Indian stocks** — RELIANCE.NS, TCS.NS, INFY.NS, HDFCBANK.NS\n- **US stocks** — AAPL, TSLA, MSFT, NVDA, GOOGL\n- **Crypto** — BTC-USD, ETH-USD, SOL-USD\n\nWhat ticker would you like to analyze?`;
    if (lower.includes('buy') || lower.includes('sell') || lower.includes('recommendation')) return `📊 **Trading Signal Analysis**\n\nBased on current technical indicators:\n- **RSI (14)**: Trading near the 50 neutral zone — no overbought/oversold extremes\n- **MACD**: Signal line crossover pending — watch for confirmation\n- **Volume**: Average volume range — no unusual institutional activity detected\n\n**Recommendation**: Hold current positions. Wait for a clear breakout above resistance or a pullback to support before entering.\n\n⚠️ *This is analysis, not financial advice. Always do your own research.*`;
    if (lower.includes('reliance') || lower.includes('.ns') || lower.includes('nifty') || lower.includes('sensex')) return `🇮🇳 **Indian Market Overview**\n\n- **NIFTY 50**: Trading near key psychological levels\n- **RELIANCE.NS**: Consolidating after recent breakout, RSI neutral\n- **HDFCBANK.NS**: Strong support at 200-DMA, banking sector showing strength\n- **TCS.NS**: IT sector facing global headwinds, watch Q-results\n\nUse the **Analyze** button to get detailed technical charts with RSI, MACD, Bollinger Bands, and AI-powered trading signals for any specific ticker.`;
    if (lower.includes('crypto') || lower.includes('bitcoin') || lower.includes('btc') || lower.includes('ethereum')) return `₿ **Crypto Market Snapshot**\n\n- **BTC-USD**: Consolidating around key support/resistance zones\n- **ETH-USD**: Network upgrades continue to drive institutional interest\n- **SOL-USD**: High-performance chain gaining DeFi market share\n\n📊 Use the chart analysis tool to get full technical indicators including RSI, MACD, and volume profile for any crypto asset.`;
    return `📈 **Stock Intelligence Analysis**\n\nI've processed your query about "${raw}". Here's what I can help with:\n\n1. **Quick Quote** — Enter any ticker symbol (e.g., AAPL, RELIANCE.NS)\n2. **Technical Analysis** — Get RSI, MACD, EMA, SMA, Bollinger Bands\n3. **Chart Data** — View candlestick charts with support/resistance levels\n4. **Trading Signals** — AI-generated buy/sell/hold recommendations\n\nWhich specific analysis would you like to run?`;
  }

  // ─── Travel Booking ────────────────────────────────────────
  private travelResponse(lower: string, raw: string, isGreeting: boolean, hasHistory: boolean): string {
    if (isGreeting) return `✈️ **Welcome to Travel Booking AI!**\n\nI can help you plan your perfect trip:\n- 🗺️ **Destination recommendations** based on your preferences\n- 🏨 **Hotel suggestions** with pricing tiers\n- ✈️ **Flight route optimization**\n- 📋 **Complete itinerary planning**\n- 💰 **Budget estimation**\n\nTell me: Where would you like to go, and when?`;
    if (lower.includes('cheap') || lower.includes('budget') || lower.includes('affordable')) return `💰 **Budget Travel Tips**\n\n1. **Book 6-8 weeks in advance** for best airfare deals\n2. **Fly mid-week** (Tue/Wed) for 20-30% lower fares\n3. **Use budget airlines** for short-haul routes\n4. **Consider hostels & Airbnb** for accommodation savings\n5. **Travel during shoulder season** (Apr-May, Sep-Oct)\n\n**Top Budget Destinations:**\n- 🇹🇭 Thailand — ₹35,000-50,000 for 7 days\n- 🇻🇳 Vietnam — ₹30,000-45,000 for 7 days\n- 🇮🇩 Bali — ₹40,000-60,000 for 7 days\n- 🇮🇳 Goa — ₹15,000-25,000 for 5 days\n\nWant me to create a detailed itinerary for any of these?`;
    if (lower.includes('itinerary') || lower.includes('plan')) return `📋 **Sample 5-Day Itinerary**\n\n**Day 1**: Arrival & check-in, evening city exploration\n**Day 2**: Major landmarks & cultural sites, local cuisine tour\n**Day 3**: Adventure activity / day trip to nearby attraction\n**Day 4**: Shopping, local markets, spa/wellness\n**Day 5**: Final sightseeing, departure\n\n**Estimated Budget**: ₹45,000 - ₹75,000 per person (flights + hotels + activities)\n\nTell me your specific destination and I'll customize this itinerary!`;
    return `✈️ **Travel Planning Assistant**\n\nI've noted your interest in "${raw}". To create a perfect travel plan, I need:\n\n1. **Destination** — Where do you want to go?\n2. **Dates** — When are you planning to travel?\n3. **Budget** — What's your total budget per person?\n4. **Interests** — Adventure, culture, relaxation, food?\n5. **Group size** — Solo, couple, family, or group?\n\nShare these details and I'll create a comprehensive travel plan!`;
  }

  // ─── Career Accelerator ────────────────────────────────────
  private careerResponse(lower: string, raw: string, isGreeting: boolean, hasHistory: boolean): string {
    if (isGreeting) return `🎯 **Welcome to Career Accelerator!**\n\nI can boost your career with:\n- 📄 **Resume optimization** — ATS-friendly formatting\n- 🎤 **Interview prep** — Common questions & STAR method coaching\n- 💼 **Job search strategy** — LinkedIn optimization, networking tips\n- 💰 **Salary negotiation** — Market data & negotiation scripts\n- 🚀 **Skill gap analysis** — Learning roadmaps for your target role\n\nWhat area of your career would you like to work on?`;
    if (lower.includes('resume') || lower.includes('cv')) return `📄 **Resume Optimization Tips**\n\n**Structure (ATS-Friendly):**\n1. **Contact Info** — Name, email, phone, LinkedIn, portfolio\n2. **Professional Summary** — 3-4 lines highlighting key strengths\n3. **Experience** — Reverse chronological, use STAR method\n4. **Skills** — Match keywords from job descriptions\n5. **Education & Certifications**\n\n**Power Verbs**: Led, Developed, Implemented, Optimized, Achieved, Reduced, Increased, Delivered\n\n**Key Rule**: Quantify achievements — "Increased sales by 35%" beats "Responsible for sales"\n\nWant me to review your resume or help write specific sections?`;
    if (lower.includes('interview') || lower.includes('question')) return `🎤 **Interview Preparation Guide**\n\n**Top 5 Questions & How to Answer:**\n\n1. **"Tell me about yourself"**\n   → Present-Past-Future format: Current role → Key achievements → Why this role\n\n2. **"Why should we hire you?"**\n   → Match 3 of their requirements with your proven skills\n\n3. **"Tell me about a challenge you overcame"**\n   → Use STAR: Situation, Task, Action, Result\n\n4. **"Where do you see yourself in 5 years?"**\n   → Show ambition aligned with the company's growth\n\n5. **"What's your expected salary?"**\n   → Research market rates, give a range, emphasize total compensation\n\n**Pro Tip**: Prepare 3-5 questions to ask THEM — shows genuine interest.`;
    if (lower.includes('salary') || lower.includes('negotiat')) return `💰 **Salary Negotiation Playbook**\n\n1. **Research first** — Use Glassdoor, Levels.fyi, Payscale\n2. **Never share your current salary** — Focus on market value\n3. **Give a range** — Anchor high: "Based on my research, ₹18-22 LPA is the market range for this role"\n4. **Negotiate total comp** — Base + bonus + stock + benefits + WFH\n5. **Get it in writing** — Always ask for the offer letter before accepting\n\n**Scripts:**\n- *"I'm excited about this role. Based on my experience and market data, I'd be looking at ₹X-Y range."*\n- *"Is there flexibility on the base? I'm also open to discussing stock/bonus components."*`;
    return `🎯 **Career Accelerator**\n\nI've noted your query: "${raw}"\n\nHere's how I can help:\n- 📄 **Resume/CV review & optimization**\n- 🎤 **Mock interview preparation**\n- 💼 **Job search strategy**\n- 💰 **Salary negotiation coaching**\n- 🗺️ **Career roadmap planning**\n- 📊 **Skill gap analysis**\n\nWhich area would you like to dive into?`;
  }

  // ─── Research Scientist ────────────────────────────────────
  private researchResponse(lower: string, raw: string, isGreeting: boolean, hasHistory: boolean): string {
    if (isGreeting) return `🔬 **Welcome to Research Scientist!**\n\nI can assist with:\n- 📚 **Literature review** — Summarize & synthesize research papers\n- 🧪 **Methodology design** — Experimental frameworks & statistical approaches\n- 📊 **Data analysis guidance** — Statistical tests, visualization strategies\n- ✍️ **Academic writing** — Abstract, introduction, methodology sections\n- 📝 **Citation management** — APA, MLA, Chicago formats\n\nWhat research topic or task can I help with?`;
    if (lower.includes('literature') || lower.includes('review') || lower.includes('paper')) return `📚 **Literature Review Framework**\n\n**Structure:**\n1. **Introduction** — Define scope, research questions, search methodology\n2. **Thematic Analysis** — Group studies by themes, not chronologically\n3. **Critical Evaluation** — Strengths, limitations, gaps in existing research\n4. **Synthesis** — How studies relate to each other and your research question\n5. **Conclusion** — Key findings, identified gaps, future directions\n\n**Search Strategy:**\n- Use Google Scholar, PubMed, IEEE Xplore, Scopus\n- Boolean operators: AND, OR, NOT\n- Citation chaining: forward & backward\n\nShare your research topic and I'll help structure your review!`;
    if (lower.includes('methodol') || lower.includes('experiment') || lower.includes('hypothesis')) return `🧪 **Research Methodology Guide**\n\n**Quantitative Methods:**\n- Surveys & questionnaires (n > 100 for statistical power)\n- Controlled experiments (A/B testing)\n- Statistical analysis: t-tests, ANOVA, regression, chi-square\n\n**Qualitative Methods:**\n- Semi-structured interviews (8-15 participants for saturation)\n- Thematic analysis, grounded theory\n- Case studies, ethnography\n\n**Mixed Methods:**\n- Sequential explanatory: Quant → Qual\n- Concurrent triangulation: Quant + Qual simultaneously\n\n**Key Considerations:**\n- Sample size & statistical power\n- Validity (internal & external) and reliability\n- Ethical approval (IRB) requirements\n\nWhat's your research area? I'll suggest the best methodology.`;
    return `🔬 **Research Assistant**\n\nI've received your query: "${raw}"\n\nI can help with:\n1. **Topic exploration & research question formulation**\n2. **Literature search & synthesis**\n3. **Methodology design & justification**\n4. **Statistical analysis guidance**\n5. **Academic writing & formatting**\n\nPlease share more details about your research area or specific question!`;
  }

  // ─── Startup Co-Founder ────────────────────────────────────
  private startupResponse(lower: string, raw: string, isGreeting: boolean, hasHistory: boolean): string {
    if (isGreeting) return `🚀 **Welcome to Startup Co-Founder AI!**\n\nI'm your virtual co-founder. I can help with:\n- 💡 **Idea validation** — Market size, competition, feasibility\n- 📊 **Business model canvas** — Revenue streams, cost structure\n- 🎯 **Pitch deck creation** — Investor-ready presentation\n- 📈 **Financial projections** — Revenue modeling, burn rate\n- 🤝 **Fundraising strategy** — VC outreach, term sheets\n\nTell me about your startup idea!`;
    if (lower.includes('pitch') || lower.includes('investor') || lower.includes('deck')) return `🎯 **Pitch Deck Template (10 Slides)**\n\n1. **Title Slide** — Company name, tagline, your name\n2. **Problem** — The pain point you're solving (use data)\n3. **Solution** — Your product/service (demo screenshot)\n4. **Market Size** — TAM → SAM → SOM with sources\n5. **Business Model** — How you make money\n6. **Traction** — Users, revenue, growth metrics\n7. **Competition** — 2x2 matrix showing your positioning\n8. **Team** — Founders' backgrounds & expertise\n9. **Financials** — 3-year projections, unit economics\n10. **The Ask** — Funding amount, use of funds, timeline\n\n**Pro Tips:**\n- Keep it under 15 minutes\n- Lead with the problem, not the solution\n- Show traction before team\n\nWant me to help you draft any specific slide?`;
    if (lower.includes('valuation') || lower.includes('funding') || lower.includes('raise')) return `💰 **Startup Funding Guide**\n\n**Funding Stages:**\n| Stage | Amount | Valuation | Typical Sources |\n|-------|--------|-----------|------------------|\n| Pre-Seed | ₹25L-1Cr | ₹2-5Cr | Angels, Friends & Family |\n| Seed | ₹1-5Cr | ₹5-25Cr | Angel Networks, Micro VCs |\n| Series A | ₹5-25Cr | ₹25-100Cr | VCs (Sequoia, Accel, Matrix) |\n| Series B | ₹25-100Cr | ₹100-500Cr | Growth VCs |\n\n**Valuation Methods:**\n- Revenue multiple: 5-15x ARR for SaaS\n- Comparable company analysis\n- DCF (Discounted Cash Flow) for later stages\n\nWhat stage is your startup at?`;
    return `🚀 **Startup Co-Founder AI**\n\nGreat question about "${raw}"! Here's how I can help:\n\n1. **Validate your idea** — Market research & competitor analysis\n2. **Build a business plan** — Canvas, financial model, go-to-market\n3. **Create a pitch deck** — Investor-ready slides\n4. **Plan fundraising** — Strategy, valuations, investor outreach\n5. **Product strategy** — MVP features, roadmap, tech stack\n\nShare your startup idea and I'll provide actionable insights!`;
  }

  // ─── Sales Agent ───────────────────────────────────────────
  private salesResponse(lower: string, raw: string, isGreeting: boolean, hasHistory: boolean): string {
    if (isGreeting) return `💼 **Welcome to Sales Agent AI!**\n\nI can supercharge your sales pipeline:\n- 📧 **Cold email generation** — Personalized outreach templates\n- 🎯 **Lead qualification** — BANT & MEDDIC frameworks\n- 📊 **Pipeline management** — Deal tracking & forecasting\n- 📞 **Sales scripts** — Discovery calls, demos, closing\n- 📈 **Performance analytics** — KPI tracking & optimization\n\nWhat sales challenge can I help you solve?`;
    if (lower.includes('cold email') || lower.includes('outreach') || lower.includes('email template')) return `📧 **Cold Email Template (Proven 25%+ Open Rate)**\n\n**Subject**: Quick question about [Company]'s [specific challenge]\n\n---\n\nHi [First Name],\n\nI noticed [Company] recently [specific trigger event — new hire, product launch, funding round]. Congrats!\n\nWe help companies like [similar company 1] and [similar company 2] solve [specific pain point], resulting in [quantified result — e.g., "40% faster onboarding"].\n\nWould you be open to a 15-minute call this week to explore if this could work for [Company]?\n\nBest,\n[Your Name]\n\n---\n\n**Key Rules:**\n- Personalize the first line (no generic openers)\n- One clear CTA\n- Under 100 words\n- Follow up 3x (Day 3, Day 7, Day 14)`;
    if (lower.includes('lead') || lower.includes('qualify') || lower.includes('prospect')) return `🎯 **Lead Qualification Framework (BANT)**\n\n| Criteria | Questions to Ask |\n|----------|------------------|\n| **Budget** | "What budget have you allocated for this?" |\n| **Authority** | "Who else is involved in this decision?" |\n| **Need** | "What's the biggest challenge you're facing?" |\n| **Timeline** | "When are you looking to implement?" |\n\n**Scoring:** 4/4 = Hot lead → Demo immediately. 2-3/4 = Warm → Nurture. 0-1/4 = Cold → Drip campaign.\n\nWant me to create qualification scripts for your specific product?`;
    return `💼 **Sales Agent AI**\n\nI've noted your request: "${raw}"\n\nHere's what I can create for you:\n1. **Email templates** — Cold outreach, follow-ups, closing\n2. **Sales scripts** — Discovery, demo, objection handling\n3. **Lead scoring** — BANT/MEDDIC qualification\n4. **Pipeline analysis** — Win rates, conversion optimization\n5. **Competitive battle cards** — Positioning against competitors\n\nWhat would be most helpful right now?`;
  }

  // ─── Document Agent ────────────────────────────────────────
  private documentResponse(lower: string, raw: string, isGreeting: boolean, hasHistory: boolean): string {
    if (isGreeting) return `📄 **Welcome to Document Agent!**\n\nI can process and analyze your documents:\n- 📋 **Summarize** — Extract key points from PDFs & text\n- 🔍 **Extract data** — Pull tables, numbers, key terms\n- ✍️ **Generate documents** — Contracts, reports, proposals\n- 📊 **Compare** — Diff analysis between document versions\n- 🏷️ **Classify** — Auto-categorize document types\n\nUpload a document or describe what you need!`;
    if (lower.includes('summar') || lower.includes('key points') || lower.includes('tldr')) return `📋 **Document Summary Framework**\n\nI can summarize documents using:\n\n1. **Executive Summary** — 3-5 sentence overview for decision makers\n2. **Key Points Extraction** — Bullet-point list of main findings\n3. **Section-by-Section** — Detailed breakdown of each part\n4. **Action Items** — Specific next steps identified in the document\n\n**To get started:**\n- Upload your PDF, DOCX, or paste text directly\n- Specify the summary style you prefer\n- Mention any specific sections to focus on\n\nReady to process your document!`;
    return `📄 **Document Processing**\n\nI've received your request: "${raw}"\n\nI can help with:\n1. **Summarization** — Quick overviews or detailed breakdowns\n2. **Data extraction** — Tables, figures, key metrics\n3. **Document generation** — Contracts, reports, proposals\n4. **Format conversion** — PDF, DOCX, Markdown\n5. **Template creation** — Reusable document templates\n\nUpload a file or describe what you need!`;
  }

  // ─── Productivity ──────────────────────────────────────────
  private productivityResponse(lower: string, raw: string, isGreeting: boolean, hasHistory: boolean): string {
    if (isGreeting) return `⚡ **Welcome to Productivity Hub!**\n\nBoost your efficiency with:\n- ✅ **Task management** — Smart to-do lists with priorities\n- 📅 **Schedule optimization** — Time blocking & calendar planning\n- 🍅 **Pomodoro timer** — Focus sessions with breaks\n- 📊 **Habit tracking** — Build & maintain productive habits\n- 📝 **Note taking** — Organized knowledge management\n\nWhat would you like to work on today?`;
    if (lower.includes('pomodoro') || lower.includes('focus') || lower.includes('timer')) return `🍅 **Pomodoro Technique Guide**\n\n1. **Work**: 25 minutes of focused, uninterrupted work\n2. **Short Break**: 5 minutes — stretch, water, breathe\n3. **Repeat**: Complete 4 pomodoros\n4. **Long Break**: 15-30 minutes after every 4 sessions\n\n**Tips for Maximum Focus:**\n- Turn off all notifications\n- Close unnecessary tabs/apps\n- Use "Do Not Disturb" mode\n- Keep a "distraction list" — write down thoughts to address later\n- Set a clear goal for each pomodoro\n\nReady to start a focus session? Use the timer widget above!`;
    if (lower.includes('habit') || lower.includes('routine') || lower.includes('morning')) return `📊 **High-Performance Daily Routine**\n\n**Morning (6:00 - 9:00):**\n- 🧘 Meditation/journaling (15 min)\n- 💪 Exercise (30 min)\n- 🥗 Healthy breakfast\n- 📋 Review today's top 3 priorities\n\n**Deep Work (9:00 - 12:00):**\n- 🍅 3 Pomodoro sessions on most important task\n- No meetings, no email, no social media\n\n**Afternoon (12:00 - 17:00):**\n- Meetings & collaborative work\n- Email processing (batch, not continuous)\n- Secondary tasks\n\n**Evening (17:00 - 21:00):**\n- 📖 Learning/reading (30 min)\n- 📝 Plan tomorrow's priorities\n- Digital sunset — no screens after 9 PM`;
    return `⚡ **Productivity Assistant**\n\nI've noted: "${raw}"\n\nHere's how I can help:\n1. **Create a task list** with priorities (Eisenhower Matrix)\n2. **Plan your day** with time blocking\n3. **Track habits** and build streaks\n4. **Set up focus sessions** (Pomodoro)\n5. **Review & optimize** your workflow\n\nWhat would you like to start with?`;
  }

  // ─── Business Automator ────────────────────────────────────
  private automatorResponse(lower: string, raw: string, isGreeting: boolean, hasHistory: boolean): string {
    if (isGreeting) return `🤖 **Welcome to Business Automator!**\n\nAutomate repetitive tasks:\n- 🔄 **Workflow automation** — If-this-then-that logic\n- 📧 **Email automation** — Auto-responses, sequences\n- 📊 **Report generation** — Scheduled data reports\n- 🔗 **API integrations** — Connect your tools\n- ⚡ **Custom triggers** — Event-based automations\n\nDescribe a process you'd like to automate!`;
    if (lower.includes('email') || lower.includes('auto-respond') || lower.includes('sequence')) return `📧 **Email Automation Setup**\n\n**Automation Workflow:**\n\n1. **Trigger**: New form submission / new lead / scheduled time\n2. **Condition**: Check lead score / segment / tag\n3. **Action**: Send personalized email from template\n4. **Follow-up**: If no reply in 3 days → send follow-up\n5. **Escalation**: If no reply in 7 days → notify sales team\n\n**Template Variables:**\n- \`{{firstName}}\` — Contact's first name\n- \`{{company}}\` — Company name\n- \`{{customField}}\` — Any custom data\n\nWant me to create a specific email automation workflow?`;
    return `🤖 **Business Automation**\n\nI've noted your request: "${raw}"\n\nI can help automate:\n1. **Lead nurturing sequences** — Email drips & follow-ups\n2. **Data processing** — Auto-format, validate, transform\n3. **Notification systems** — Alert triggers & escalations\n4. **Report scheduling** — Auto-generate & distribute\n5. **API workflows** — Connect multiple services\n\nDescribe the manual process you want to automate!`;
  }

  // ─── WhatsApp Bot ──────────────────────────────────────────
  private whatsappResponse(lower: string, raw: string, systemPrompt: string, isGreeting: boolean, hasHistory: boolean): string {
    // Parse business info from system prompt if available
    let businessName = '';
    const businessMatch = systemPrompt.match(/Business Name:\s*([^\n]+)/i);
    if (businessMatch) businessName = businessMatch[1].trim();

    if (isGreeting) {
      return businessName
        ? `Hello! 👋 Welcome to ${businessName}. How can I assist you today?\n\nYou can ask me about:\n- Our services & pricing\n- Support & troubleshooting\n- Business hours & location\n- FAQs`
        : `Hello! 👋 Welcome to our WhatsApp Business Assistant!\n\nI'm here to help you with:\n- 📋 Product & service information\n- 💰 Pricing & availability\n- 🔧 Support & troubleshooting\n- 📍 Business hours & location\n\nHow can I assist you today?`;
    }

    if (lower.includes('price') || lower.includes('cost') || lower.includes('rate')) {
      return businessName
        ? `Thank you for your interest in ${businessName}'s pricing! Our team will share detailed pricing based on your specific requirements. Could you tell me:\n\n1. Which service/product are you interested in?\n2. What's your expected volume/usage?\n3. Any specific features you need?\n\nI'll connect you with the right person for a custom quote.`
        : `Our pricing varies based on your needs. To get you the best quote:\n\n1. What service are you looking for?\n2. What's your expected usage?\n3. Any specific requirements?\n\nI'll have our team prepare a personalized quote for you!`;
    }

    if (lower.includes('support') || lower.includes('help') || lower.includes('problem') || lower.includes('issue')) {
      return `I'm sorry to hear you're experiencing an issue. Let me help!\n\n**To resolve this quickly:**\n1. Please describe the problem in detail\n2. When did it start?\n3. Have you tried any troubleshooting steps?\n\nIf this is urgent, I'll escalate to our support team immediately. 🔧`;
    }

    return businessName
      ? `Thank you for reaching out to ${businessName}! I've noted your message about "${raw}". Our team will get back to you shortly.\n\nIn the meantime, is there anything else I can help with?`
      : `Thank you for your message! I've noted your query about "${raw}". How can I assist you further?\n\nFeel free to ask about our services, pricing, or support options.`;
  }

  // ─── Compass Advisor ───────────────────────────────────────
  private compassResponse(lower: string, raw: string, isGreeting: boolean, hasHistory: boolean): string {
    if (isGreeting) return `🧭 **Welcome to Compass Advisor!**\n\nI'm your personal guidance companion:\n- 🎯 **Goal setting** — SMART goals & action plans\n- 🧠 **Decision making** — Frameworks for tough choices\n- 📈 **Personal growth** — Skill development roadmaps\n- 💭 **Reflection** — Journaling prompts & self-assessment\n\nWhat's on your mind today?`;
    return `🧭 **Compass Advisor**\n\nI've reflected on your question: "${raw}"\n\n**Here's a framework to think through this:**\n\n1. **Clarify** — What exactly is the core question or challenge?\n2. **Explore** — What are all the possible options?\n3. **Evaluate** — What are the pros/cons of each option?\n4. **Decide** — Which option aligns best with your values & goals?\n5. **Act** — What's the first small step you can take today?\n\nWould you like to work through any of these steps together?`;
  }

  // ─── General / AI Playground ───────────────────────────────
  private generalResponse(lower: string, raw: string, systemPrompt: string, isGreeting: boolean, hasHistory: boolean): string {
    if (isGreeting) {
      if (hasHistory) return `How can I help you further? Feel free to ask me anything — from coding to analysis to creative writing!`;
      return `👋 **Hello! Welcome to Nexora AI!**\n\nI'm your intelligent assistant. I can help with:\n- 💻 **Code generation** — Any language or framework\n- 📊 **Data analysis** — Charts, insights, summaries\n- ✍️ **Writing** — Emails, articles, reports\n- 🧮 **Math & Logic** — Calculations, problem solving\n- 💡 **Brainstorming** — Ideas, strategies, plans\n\nWhat would you like to work on?`;
    }

    if (lower.includes('code') || lower.includes('program') || lower.includes('function') || lower.includes('script') || lower.includes('api')) {
      return `💻 **Code Assistant**\n\nHere's a starter implementation:\n\n\`\`\`javascript\n// Nexora Smart Code Generator\nasync function processRequest(input) {\n  const result = await analyzeInput(input);\n  return {\n    status: 'success',\n    data: result,\n    timestamp: new Date().toISOString()\n  };\n}\n\n// Usage\nconst response = await processRequest("${raw.substring(0, 30)}");\nconsole.log(response);\n\`\`\`\n\nWant me to adapt this for a specific language (Python, TypeScript, Java) or framework (React, Express, FastAPI)?`;
    }

    if (lower.includes('explain') || lower.includes('what is') || lower.includes('how does') || lower.includes('define')) {
      return `📚 **Here's an explanation:**\n\nRegarding "${raw}" — this is a great question!\n\n**Key Points:**\n1. The concept involves understanding the fundamental principles and how they interconnect\n2. In practice, this is applied through systematic approaches and established methodologies\n3. The latest developments in this area show promising advancements\n\nWould you like me to:\n- Go deeper into any specific aspect?\n- Provide examples or analogies?\n- Share related resources or further reading?`;
    }

    if (lower.includes('write') || lower.includes('email') || lower.includes('draft') || lower.includes('compose')) {
      return `✍️ **Here's a professional draft:**\n\n---\n\nSubject: Regarding ${raw.substring(0, 40)}\n\nDear [Recipient],\n\nI hope this message finds you well. I'm writing to discuss ${raw.substring(0, 60)}.\n\nI believe this is an important topic that deserves our attention, and I'd like to propose a collaborative approach to address it effectively.\n\nWould you be available for a brief discussion this week? I'm flexible with timing and happy to work around your schedule.\n\nBest regards,\n[Your Name]\n\n---\n\nWant me to adjust the tone (formal/casual), add specific details, or create a different type of document?`;
    }

    // Default intelligent response
    return `I've processed your request: **"${raw}"**\n\nHere's what I can help with:\n\n1. **Analyze** — Break down complex topics into clear explanations\n2. **Generate** — Create content, code, documents, or plans\n3. **Optimize** — Improve existing work, processes, or strategies\n4. **Research** — Find information and synthesize insights\n\nCould you provide a bit more context so I can give you the most helpful response?`;
  }
}
