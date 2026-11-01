import { PrismaClient } from '@prisma/client';
import { aiRouter } from './ai/provider';
import logger from '../utils/logger';
import { safeParseAIJson } from '../utils/json-utils';

const prisma = new PrismaClient();

export class AutomatorService {
  /**
   * Lead management
   */
  async getLeads(userId: string, limit?: number, offset?: number): Promise<any[]> {
    const leads = await prisma.automationLead.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset,
    });
    return leads.map(l => ({
      ...l,
      interactionHistory: JSON.parse(l.interactionHistory),
    }));
  }

  async createLead(userId: string, data: { name: string; email: string; notes?: string }): Promise<any> {
    const initialHistory = [
      { date: new Date().toISOString(), type: 'system', text: 'Lead created in CRM pipeline' }
    ];

    const lead = await prisma.automationLead.create({
      data: {
        userId,
        name: data.name,
        email: data.email,
        status: 'new',
        notes: data.notes || null,
        interactionHistory: JSON.stringify(initialHistory),
      }
    });

    await prisma.agentActivityLog.create({
      data: {
        userId,
        agentId: 'automator',
        action: 'lead_created',
        description: `Created new CRM sales lead: ${data.name} (${data.email})`,
        reasoning: 'System added lead to CRM pipeline. Initializing automatic tag.',
      }
    });

    return {
      ...lead,
      interactionHistory: initialHistory
    };
  }

  async updateLeadStatus(userId: string, leadId: string, status: string): Promise<any> {
    const existing = await prisma.automationLead.findFirst({ where: { id: leadId, userId } });
    if (!existing) throw new Error('Lead not found');

    const history = JSON.parse(existing.interactionHistory || '[]');
    history.push({
      date: new Date().toISOString(),
      type: 'status_change',
      text: `Status updated from ${existing.status} to ${status}`
    });

    const updated = await prisma.automationLead.update({
      where: { id: leadId },
      data: {
        status,
        interactionHistory: JSON.stringify(history)
      }
    });

    return {
      ...updated,
      interactionHistory: history
    };
  }

  /**
   * AI-generated sales follow-up email draft
   */
  async generateFollowUpEmail(userId: string, leadId: string, data: { pitchGoal: string }): Promise<any> {
    const lead = await prisma.automationLead.findFirst({ where: { id: leadId, userId } });
    if (!lead) throw new Error('Lead not found');

    const systemPrompt = `You are a Senior Sales Representative and a Copywriting Specialist. Draft a compelling business follow-up email for the lead.
Format your output strictly as a JSON object:
{
  "subject": "Compelling subject line",
  "body": "The complete email body in plain text, professional, short, and containing a clear call to action."
}`;

    const prompt = `Lead Name: ${lead.name}
Lead Email: ${lead.email}
Lead Notes: ${lead.notes || 'None'}
Pitch Goal / Context: ${data.pitchGoal}`;

    let aiResult;
    try {
      const response = await aiRouter.chat([
        { role: 'system', content: systemPrompt },
        { role: 'user', content: prompt }
      ], { temperature: 0.3 });

      aiResult = safeParseAIJson(response.content, 'automator email draft');
    } catch (e: any) {
      logger.warn(`Failed to generate email draft: ${e.message}`);
    }

    if (!aiResult || !aiResult.subject) {
      aiResult = {
        subject: `Follow-up on your project - NexusForge`,
        body: `Hi ${lead.name},\n\nHope you are doing well. I wanted to follow up on your project details and see if we can schedule a quick 10-minute call this week to align on automated solutions.\n\nLet me know your availability.\n\nBest regards,\nSales Team`
      };
    }

    // Append to lead history
    let history: any[] = [];
    try {
      history = JSON.parse(lead.interactionHistory || '[]');
    } catch {
      logger.warn(`Malformed interactionHistory for lead ${leadId}, resetting`);
      history = [];
    }
    history.push({
      date: new Date().toISOString(),
      type: 'email_drafted',
      text: `AI generated email draft with subject: "${aiResult.subject}"`
    });

    await prisma.automationLead.update({
      where: { id: leadId },
      data: {
        interactionHistory: JSON.stringify(history)
      }
    });

    await prisma.agentActivityLog.create({
      data: {
        userId,
        agentId: 'automator',
        action: 'email_draft_generated',
        description: `Generated sales draft for lead: ${lead.name}`,
        reasoning: `Goal context: ${data.pitchGoal}`,
      }
    });

    return aiResult;
  }

  /**
   * Send or dispatch an email to a lead
   */
  async sendLeadEmail(userId: string, leadId: string, data: { subject: string; body: string }): Promise<any> {
    const lead = await prisma.automationLead.findFirst({ where: { id: leadId, userId } });
    if (!lead) throw new Error('Lead not found');

    let sentLive = false;
    let sendError: string | null = null;

    if (process.env.SMTP_HOST && process.env.SMTP_USER) {
      try {
        const nodemailer = await import('nodemailer');
        const transporter = nodemailer.createTransport({
          host: process.env.SMTP_HOST,
          port: parseInt(process.env.SMTP_PORT || '587'),
          secure: process.env.SMTP_SECURE === 'true',
          auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS,
          },
        });

        await transporter.sendMail({
          from: process.env.SMTP_FROM || process.env.SMTP_USER,
          to: lead.email,
          subject: data.subject,
          text: data.body,
        });
        sentLive = true;
      } catch (err: any) {
        logger.warn(`SMTP send failed: ${err.message}`);
        sendError = err.message;
      }
    }

    let history: any[] = [];
    try {
      history = JSON.parse(lead.interactionHistory || '[]');
    } catch {
      history = [];
    }
    history.push({
      date: new Date().toISOString(),
      type: 'email_dispatched',
      text: `Dispatched email to ${lead.email}: "${data.subject}" (Status: ${sentLive ? 'Sent via SMTP' : 'Ready in Outbox/Mailto'})`
    });

    await prisma.automationLead.update({
      where: { id: leadId },
      data: {
        status: 'contacted',
        interactionHistory: JSON.stringify(history)
      }
    });

    await prisma.agentActivityLog.create({
      data: {
        userId,
        agentId: 'automator',
        action: 'email_dispatched',
        description: `Dispatched sales outreach to ${lead.name} (${lead.email})`,
        reasoning: `Subject: "${data.subject}"`,
      }
    });

    const mailtoUrl = `mailto:${encodeURIComponent(lead.email)}?subject=${encodeURIComponent(data.subject)}&body=${encodeURIComponent(data.body)}`;

    return {
      success: true,
      sentLive,
      sendError,
      leadEmail: lead.email,
      mailtoUrl,
      message: sentLive
        ? `Email successfully delivered to ${lead.email} via SMTP!`
        : `Outreach recorded for ${lead.name}! You can send it directly via your mail client or copy the message.`,
    };
  }

  /**
   * Invoice actions
   */
  async getInvoices(userId: string): Promise<any[]> {
    const invoices = await prisma.invoice.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
    return invoices.map(inv => ({
      ...inv,
      items: JSON.parse(inv.items),
    }));
  }

  async createInvoice(userId: string, data: { clientName: string; clientEmail: string; items: Array<{ description: string; quantity: number; rate: number }> }): Promise<any> {
    const itemsWithTotals = data.items.map(item => ({
      ...item,
      total: item.quantity * item.rate
    }));

    const amount = itemsWithTotals.reduce((sum, item) => sum + item.total, 0);

    const invoice = await prisma.invoice.create({
      data: {
        userId,
        clientName: data.clientName,
        clientEmail: data.clientEmail,
        amount,
        status: 'draft',
        items: JSON.stringify(itemsWithTotals),
      }
    });

    await prisma.agentActivityLog.create({
      data: {
        userId,
        agentId: 'automator',
        action: 'invoice_created',
        description: `Created invoice for client ${data.clientName} (Amount: $${amount})`,
        reasoning: `Client email: ${data.clientEmail}, line items: ${itemsWithTotals.length}`,
      }
    });

    return {
      ...invoice,
      items: itemsWithTotals
    };
  }

  async updateInvoiceStatus(userId: string, id: string, status: string): Promise<any> {
    return prisma.invoice.update({
      where: { id, userId },
      data: { status }
    });
  }

  /**
   * Automation Workflows
   */
  async getWorkflows(userId: string): Promise<any[]> {
    return prisma.automationWorkflow.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async createWorkflow(userId: string, data: { name: string; triggerType: string; actionType: string }): Promise<any> {
    return prisma.automationWorkflow.create({
      data: {
        userId,
        name: data.name,
        triggerType: data.triggerType,
        actionType: data.actionType,
        isActive: true,
      }
    });
  }

  async toggleWorkflow(userId: string, id: string): Promise<any> {
    const existing = await prisma.automationWorkflow.findFirst({ where: { id, userId } });
    if (!existing) throw new Error('Workflow not found');

    return prisma.automationWorkflow.update({
      where: { id },
      data: { isActive: !existing.isActive }
    });
  }

  async deleteWorkflow(userId: string, id: string): Promise<any> {
    return prisma.automationWorkflow.delete({
      where: { id, userId }
    });
  }
}

export const automatorService = new AutomatorService();
