import { PrismaClient } from '@prisma/client';
import { aiRouter } from './ai/provider';
import logger from '../utils/logger';
import { safeParseAIJson } from '../utils/json-utils';

const prisma = new PrismaClient();

export class SalesService {
  /**
   * AI-powered lead finder: generates qualified leads based on criteria
   */
  async findLeads(userId: string, data: { industry: string; targetRole: string; companySize: string }): Promise<any[]> {
    const systemPrompt = `You are an expert B2B Sales Intelligence Agent specializing in lead generation for SaaS and startup companies.
Generate a list of 5 realistic, high-quality sales leads based on the user's criteria.
Format your output strictly as a JSON array of objects:
[
  {
    "name": "Full Name",
    "email": "realistic_email@company.com",
    "company": "Company Name",
    "role": "Job Title",
    "industry": "Industry",
    "companySize": "e.g. 50-200",
    "leadScore": number (0-100, based on fit quality),
    "notes": "Brief note on why this is a good lead"
  }
]
Make the leads realistic and diverse. Give higher scores to leads that are a better fit for the criteria. All emails should look realistic but use fictional domains.`;

    const prompt = `Find sales leads matching these criteria:
Industry: ${data.industry}
Target Role/Title: ${data.targetRole}
Company Size: ${data.companySize}`;

    let leads: any[];
    try {
      const response = await aiRouter.chat([
        { role: 'system', content: systemPrompt },
        { role: 'user', content: prompt }
      ], { temperature: 0.7 });

      leads = safeParseAIJson(response.content, 'sales lead generation') || [];
    } catch (e: any) {
      logger.warn(`Failed to parse AI sales lead response, using defaults: ${e.message}`);
      leads = [
        { name: 'Sarah Chen', email: 'sarah.chen@techflow.io', company: 'TechFlow Solutions', role: data.targetRole || 'VP of Sales', industry: data.industry || 'Technology', companySize: data.companySize || '50-200', leadScore: 87, notes: 'Strong fit — actively hiring for sales automation.' },
        { name: 'Michael Torres', email: 'm.torres@growthstack.co', company: 'GrowthStack', role: 'Head of Revenue', industry: data.industry || 'SaaS', companySize: '20-50', leadScore: 82, notes: 'Recently funded Series A, expanding sales team.' },
        { name: 'Emily Watson', email: 'emily@scalewise.com', company: 'ScaleWise Inc.', role: 'Director of Business Development', industry: data.industry || 'FinTech', companySize: '100-500', leadScore: 75, notes: 'Looking for outbound sales tools.' },
        { name: 'James Park', email: 'jpark@nexusventures.io', company: 'Nexus Ventures', role: 'Sales Operations Manager', industry: data.industry || 'Technology', companySize: '200-500', leadScore: 70, notes: 'Evaluating CRM solutions.' },
        { name: 'Priya Sharma', email: 'priya@cloudbridge.dev', company: 'CloudBridge', role: data.targetRole || 'Chief Revenue Officer', industry: data.industry || 'Cloud Services', companySize: '50-200', leadScore: 91, notes: 'High intent — posted about needing sales automation on LinkedIn.' },
      ];
    }

    const savedLeads = [];
    for (const lead of leads) {
      const saved = await prisma.salesLead.create({
        data: {
          userId,
          name: lead.name,
          email: lead.email,
          company: lead.company,
          industry: lead.industry || data.industry,
          role: lead.role || data.targetRole,
          companySize: lead.companySize || data.companySize,
          leadScore: lead.leadScore || 50,
          notes: lead.notes || '',
          source: 'ai_generated',
        }
      });
      savedLeads.push(saved);
    }

    await prisma.agentActivityLog.create({
      data: {
        userId,
        agentId: 'sales',
        action: 'lead_generation',
        description: `Generated ${savedLeads.length} leads for ${data.industry} / ${data.targetRole}`,
        reasoning: `Industry: ${data.industry}, Role: ${data.targetRole}, Size: ${data.companySize}`,
      }
    });

    return savedLeads;
  }

  /**
   * AI-powered lead enrichment
   */
  async enrichLead(userId: string, leadId: string): Promise<any> {
    const lead = await prisma.salesLead.findFirst({ where: { id: leadId, userId } });
    if (!lead) throw new Error('Lead not found');

    const systemPrompt = `You are a Sales Intelligence Agent. Enrich the following lead with additional business insights.
Format your output as a JSON object:
{
  "companyRevenue": "estimated annual revenue",
  "techStack": ["tech1", "tech2"],
  "recentNews": "brief recent company news",
  "painPoints": ["pain1", "pain2"],
  "bestApproach": "recommended sales approach",
  "linkedinInsight": "inferred LinkedIn activity/interests",
  "competitorsUsed": ["competitor1"],
  "buyingSignals": ["signal1", "signal2"]
}`;

    const prompt = `Enrich this lead:
Name: ${lead.name}
Company: ${lead.company}
Role: ${lead.role}
Industry: ${lead.industry}
Company Size: ${lead.companySize || 'Unknown'}`;

    let enrichment;
    try {
      const response = await aiRouter.chat([
        { role: 'system', content: systemPrompt },
        { role: 'user', content: prompt }
      ], { temperature: 0.4 });

      enrichment = safeParseAIJson(response.content, 'lead enrichment');
    } catch (e: any) {
      logger.warn(`Failed to enrich lead, using defaults: ${e.message}`);
      enrichment = {
        companyRevenue: '$5M-$20M estimated',
        techStack: ['React', 'Node.js', 'AWS'],
        recentNews: 'Recently expanded to new markets',
        painPoints: ['Manual outreach processes', 'Low email response rates'],
        bestApproach: 'Personalized demo offer highlighting automation ROI',
        linkedinInsight: 'Active poster, engages with sales-tech content',
        competitorsUsed: ['HubSpot', 'Outreach.io'],
        buyingSignals: ['Hiring for sales roles', 'Attending SaaS conferences'],
      };
    }

    const updated = await prisma.salesLead.update({
      where: { id: leadId },
      data: {
        enrichment: JSON.stringify(enrichment),
        leadScore: Math.min(100, (lead.leadScore || 50) + 10),
      }
    });

    return { ...updated, enrichment };
  }

  /**
   * AI-powered sales email generation
   */
  async generateEmail(userId: string, data: { leadId?: string; emailType: string; tone: string; context?: string }): Promise<any> {
    let leadContext = '';
    if (data.leadId) {
      const lead = await prisma.salesLead.findFirst({ where: { id: data.leadId, userId } });
      if (lead) {
        leadContext = `Lead: ${lead.name} (${lead.role} at ${lead.company}, ${lead.industry})
Lead Score: ${lead.leadScore}/100
Notes: ${lead.notes || 'None'}
Enrichment: ${lead.enrichment || 'None'}`;
      }
    }

    const systemPrompt = `You are an expert B2B Sales Email Copywriter. Write a compelling sales email.
Email Type: ${data.emailType.replace(/_/g, ' ')}
Tone: ${data.tone}

Format your output as JSON:
{
  "subject": "email subject line",
  "body": "full email body with proper greeting and sign-off. Use \\n for line breaks."
}

Rules:
- Keep it concise (under 200 words)
- Include a clear call-to-action
- Personalize based on the lead info if provided
- Use the specified tone
- Make it feel human, not robotic`;

    const prompt = leadContext
      ? `Write a ${data.emailType.replace(/_/g, ' ')} email for this lead:\n${leadContext}\n\nAdditional context: ${data.context || 'None'}`
      : `Write a ${data.emailType.replace(/_/g, ' ')} email. Context: ${data.context || 'General SaaS outreach'}`;

    let emailData;
    try {
      const response = await aiRouter.chat([
        { role: 'system', content: systemPrompt },
        { role: 'user', content: prompt }
      ], { temperature: 0.6 });

      emailData = safeParseAIJson(response.content, 'sales email generation');
    } catch (e: any) {
      logger.warn(`Failed to generate email, using default: ${e.message}`);
      emailData = {
        subject: 'Quick question about your sales process',
        body: `Hi there,\n\nI noticed your company is growing rapidly — congrats! I wanted to reach out because we help teams like yours automate outbound sales and book more meetings with qualified prospects.\n\nWould you be open to a quick 15-minute call this week to see if there\'s a fit?\n\nBest regards,\nYour Sales Team`
      };
    }

    const saved = await prisma.salesEmail.create({
      data: {
        userId,
        leadId: data.leadId || null,
        subject: emailData.subject,
        body: emailData.body,
        emailType: data.emailType,
        tone: data.tone,
        status: 'draft',
      }
    });

    await prisma.agentActivityLog.create({
      data: {
        userId,
        agentId: 'sales',
        action: 'email_generated',
        description: `Generated ${data.emailType} email: "${emailData.subject}"`,
        reasoning: `Tone: ${data.tone}, Lead: ${data.leadId || 'none'}`,
      }
    });

    return saved;
  }

  /**
   * Mark email as sent (simulated)
   */
  async sendEmail(userId: string, emailId: string): Promise<any> {
    const email = await prisma.salesEmail.findFirst({ where: { id: emailId, userId } });
    if (!email) throw new Error('Email not found');

    const updated = await prisma.salesEmail.update({
      where: { id: emailId },
      data: { status: 'sent', sentAt: new Date() }
    });

    // Update lead status if linked
    if (email.leadId) {
      await prisma.salesLead.update({
        where: { id: email.leadId },
        data: { status: 'contacted' }
      }).catch(() => {}); // Ignore if lead not found
    }

    await prisma.agentActivityLog.create({
      data: {
        userId,
        agentId: 'sales',
        action: 'email_sent',
        description: `Sent email: "${email.subject}"`,
      }
    });

    return updated;
  }

  /**
   * Schedule a sales meeting
   */
  async scheduleMeeting(userId: string, data: { leadId?: string; title: string; dateTime: string; duration: number; agenda?: string }): Promise<any> {
    let attendees: { name: string; email: string }[] = [];

    if (data.leadId) {
      const lead = await prisma.salesLead.findFirst({ where: { id: data.leadId, userId } });
      if (lead) {
        attendees.push({ name: lead.name, email: lead.email });
        await prisma.salesLead.update({
          where: { id: data.leadId },
          data: { status: 'meeting_set' }
        });
      }
    }

    const meetingLink = `https://meet.nexora.ai/${Date.now().toString(36)}`;

    const saved = await prisma.salesMeeting.create({
      data: {
        userId,
        leadId: data.leadId || null,
        title: data.title,
        attendees: JSON.stringify(attendees),
        dateTime: new Date(data.dateTime),
        duration: data.duration || 30,
        agenda: data.agenda || null,
        meetingLink,
        status: 'scheduled',
      }
    });

    await prisma.agentActivityLog.create({
      data: {
        userId,
        agentId: 'sales',
        action: 'meeting_scheduled',
        description: `Scheduled meeting: "${data.title}" on ${data.dateTime}`,
      }
    });

    return { ...saved, attendees };
  }

  /**
   * Get all leads for user
   */
  async getLeads(userId: string): Promise<any[]> {
    return prisma.salesLead.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: { emails: true, meetings: true },
    });
  }

  /**
   * Get all emails for user
   */
  async getEmails(userId: string): Promise<any[]> {
    return prisma.salesEmail.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: { lead: true },
    });
  }

  /**
   * Get all meetings for user
   */
  async getMeetings(userId: string): Promise<any[]> {
    const meetings = await prisma.salesMeeting.findMany({
      where: { userId },
      orderBy: { dateTime: 'asc' },
      include: { lead: true },
    });
    return meetings.map(m => ({
      ...m,
      attendees: JSON.parse(m.attendees),
    }));
  }

  /**
   * Dashboard stats
   */
  async getDashboard(userId: string): Promise<any> {
    const [totalLeads, totalEmails, sentEmails, meetings, qualifiedLeads] = await Promise.all([
      prisma.salesLead.count({ where: { userId } }),
      prisma.salesEmail.count({ where: { userId } }),
      prisma.salesEmail.count({ where: { userId, status: 'sent' } }),
      prisma.salesMeeting.count({ where: { userId } }),
      prisma.salesLead.count({ where: { userId, status: { in: ['qualified', 'meeting_set', 'won'] } } }),
    ]);

    const conversionRate = totalLeads > 0 ? Math.round((qualifiedLeads / totalLeads) * 100) : 0;

    const recentLeads = await prisma.salesLead.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 5,
    });

    const recentEmails = await prisma.salesEmail.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 5,
      include: { lead: true },
    });

    const upcomingMeetings = await prisma.salesMeeting.findMany({
      where: { userId, dateTime: { gte: new Date() }, status: 'scheduled' },
      orderBy: { dateTime: 'asc' },
      take: 5,
      include: { lead: true },
    });

    return {
      stats: {
        totalLeads,
        totalEmails,
        sentEmails,
        meetings,
        conversionRate,
      },
      recentLeads,
      recentEmails,
      upcomingMeetings: upcomingMeetings.map(m => ({ ...m, attendees: JSON.parse(m.attendees) })),
    };
  }

  /**
   * Delete a lead
   */
  async deleteLead(userId: string, leadId: string): Promise<any> {
    return prisma.salesLead.delete({
      where: { id: leadId, userId },
    });
  }

  /**
   * Delete an email
   */
  async deleteEmail(userId: string, emailId: string): Promise<any> {
    return prisma.salesEmail.delete({
      where: { id: emailId, userId },
    });
  }
}

export const salesService = new SalesService();
