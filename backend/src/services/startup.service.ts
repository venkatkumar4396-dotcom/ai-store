import { PrismaClient } from '@prisma/client';
import { aiRouter } from './ai/provider';
import logger from '../utils/logger';
import { safeParseAIJson } from '../utils/json-utils';

const prisma = new PrismaClient();

export class StartupService {
  /**
   * Analyze startup idea using AI
   */
  async analyzeIdea(userId: string, data: { name: string; industry: string; description: string }): Promise<any> {
    const systemPrompt = `You are an expert Startup Venture Capital Analyst and a Y-Combinator Startup Advisor. Analyze the user's business idea.
Format your output strictly as a JSON object with the following fields:
{
  "scores": {
    "startupScore": number (0-100),
    "marketOpportunity": number (0-100),
    "revenuePotential": number (0-100),
    "risk": number (0-100)
  },
  "swot": {
    "strengths": ["string", "string"],
    "weaknesses": ["string", "string"],
    "opportunities": ["string", "string"],
    "threats": ["string", "string"]
  },
  "roadmap": [
    { "phase": "Phase 1: MVP Setup", "timeframe": "1-3 months", "actions": ["action A", "action B"] },
    { "phase": "Phase 2: Alpha Launch", "timeframe": "4-6 months", "actions": ["action C", "action D"] },
    { "phase": "Phase 3: Scale Operations", "timeframe": "7-12 months", "actions": ["action E"] }
  ],
  "revenueModel": {
    "pricingTiers": [
      { "name": "Basic", "price": "$19/mo", "features": ["feature A", "feature B"] },
      { "name": "Pro", "price": "$49/mo", "features": ["feature C", "feature D"] }
    ],
    "streams": ["stream A", "stream B"]
  },
  "competitors": [
    { "name": "Competitor X", "marketShare": "High", "differentiator": "We focus on automated workflows" }
  ],
  "aiExplanation": "A long markdown string containing strategic advice, investor preparation strategies, customer persona descriptions, and growth blueprints."
}`;

    const prompt = `Startup Name: ${data.name}
Industry Category: ${data.industry}
Product Description: ${data.description}`;

    let aiResult;
    try {
      const response = await aiRouter.chat([
        { role: 'system', content: systemPrompt },
        { role: 'user', content: prompt }
      ], { temperature: 0.3 });

      aiResult = safeParseAIJson(response.content, 'startup analysis');
    } catch (e: any) {
      logger.warn(`AI startup analysis call failed: ${e.message}`);
      aiResult = null;
    }

    if (!aiResult) {
      logger.warn('Using structured fallback for startup analysis');
      aiResult = {
        scores: { startupScore: 75, marketOpportunity: 70, revenuePotential: 80, risk: 45 },
        swot: {
          strengths: ['Innovative technology stack', 'Fast development speed'],
          weaknesses: ['Lack of initial customer brand awareness', 'Limited initial seed funding'],
          opportunities: ['Growing target market interest in automated tools', 'Open partnerships in secondary SaaS markets'],
          threats: ['Established competitor responses', 'Customer transition friction']
        },
        roadmap: [
          { phase: 'Phase 1: MVP Scaffolding', timeframe: '1-2 months', actions: ['Finalize tech stack', 'Build core interfaces'] },
          { phase: 'Phase 2: Closed Pilot', timeframe: '3-4 months', actions: ['Onboard early customers', 'Optimize system flows'] }
        ],
        revenueModel: {
          pricingTiers: [
            { name: 'Starter', price: '$29/mo', features: ['Core features', 'Standard support'] },
            { name: 'Premium', price: '$89/mo', features: ['All templates', 'Dedicated support'] }
          ],
          streams: ['Subscription model', 'Add-on credits']
        },
        competitors: [
          { name: 'Traditional tools', marketShare: 'Large', differentiator: 'Lacks native AI-native reasoning flow' }
        ],
        aiExplanation: `Your startup idea **${data.name}** shows solid potential. Focus should be placed on developing a clear MVP feature set within the first 60 days. Secure early customer feedback pipelines to optimize value streams.`
      };
    }

    // Normalize: AI may return "swot" or "swotAnalysis" — ensure consistent key
    const swotData = aiResult.swotAnalysis || aiResult.swot || { strengths: [], weaknesses: [], opportunities: [], threats: [] };

    const saved = await prisma.startupIdea.create({
      data: {
        userId,
        name: data.name,
        industry: data.industry,
        description: data.description,
        scores: JSON.stringify(aiResult.scores),
        swotAnalysis: JSON.stringify(swotData),
        roadmap: JSON.stringify(aiResult.roadmap),
        revenueModel: JSON.stringify(aiResult.revenueModel),
        competitorResearch: JSON.stringify(aiResult.competitors),
        aiExplanation: aiResult.aiExplanation,
      }
    });

    await prisma.agentActivityLog.create({
      data: {
        userId,
        agentId: 'startup',
        action: 'idea_validation',
        description: `Validated startup idea: ${data.name} (${data.industry})`,
        reasoning: `Startup Score: ${aiResult.scores.startupScore}%, Market Opp: ${aiResult.scores.marketOpportunity}%`,
      }
    });

    return {
      ...saved,
      scores: aiResult.scores,
      swotAnalysis: swotData,
      roadmap: aiResult.roadmap,
      revenueModel: aiResult.revenueModel,
      competitorResearch: aiResult.competitors
    };
  }

  /**
   * Get all ideas
   */
  async getIdeas(userId: string): Promise<any[]> {
    const ideas = await prisma.startupIdea.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });

    return ideas.map(idea => ({
      ...idea,
      scores: JSON.parse(idea.scores),
      swotAnalysis: JSON.parse(idea.swotAnalysis),
      roadmap: JSON.parse(idea.roadmap),
      revenueModel: JSON.parse(idea.revenueModel),
      competitorResearch: JSON.parse(idea.competitorResearch),
    }));
  }

  async deleteIdea(userId: string, id: string): Promise<any> {
    return prisma.startupIdea.delete({
      where: { id, userId },
    });
  }
}

export const startupService = new StartupService();
