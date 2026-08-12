import { PrismaClient } from '@prisma/client';
import { aiRouter } from './ai/provider';
import logger from '../utils/logger';
import PDFDocument from 'pdfkit';

const prisma = new PrismaClient();

export class DocumentService {

  async summarizeDocument(userId: string, fileName: string, content: string) {
    const systemPrompt = `You are a world-class AI document summarizer. Analyze the text provided and generate a highly professional, well-structured executive summary.
Use bullet points for key takeaways, and ensure the tone is professional, clear, and action-oriented. Limit the summary to approximately 250-400 words.`;

    let summaryText = '';
    try {
      const response = await aiRouter.chat([
        { role: 'system', content: systemPrompt },
        { role: 'user', content: `Document Title: ${fileName}\n\nContent:\n${content}` },
      ], { temperature: 0.3 });

      summaryText = response.content.trim();
    } catch (e: any) {
      logger.error(`AI summarization failed: ${e.message}`);
      summaryText = `Failed to generate summary via AI. Summary placeholder: This document titled "${fileName}" contains detailed sections of text that require manual review. Please check your AI API keys.`;
    }

    // Save to Database
    const operation = await prisma.documentOperation.create({
      data: {
        userId,
        fileName,
        operationType: 'summarize',
        summary: summaryText,
      },
    });

    await prisma.agentActivityLog.create({
      data: {
        userId,
        agentId: 'document',
        action: 'document_summarized',
        description: `Summarized document: "${fileName}"`,
        reasoning: `Character count: ${content.length}, summary length: ${summaryText.length}`,
      },
    });

    return operation;
  }

  async analyzeDocument(userId: string, fileName: string, content: string) {
    const systemPrompt = `You are a senior business intelligence and AI analyst. Analyze the following document text and extract the key takeaways, structural segments, action items (with owner/due dates if implied), and risk factors.
Format the output strictly as a JSON object:
{
  "keyTakeaways": ["Takeaway 1", "Takeaway 2"],
  "actionItems": ["Action 1", "Action 2"],
  "riskFactors": ["Risk 1", "Risk 2"],
  "entitiesMentioned": ["Entity 1", "Entity 2"]
}`;

    let analysisJson = '';
    try {
      const response = await aiRouter.chat([
        { role: 'system', content: systemPrompt },
        { role: 'user', content: `Document Title: ${fileName}\n\nContent:\n${content}` },
      ], { temperature: 0.2 });

      analysisJson = response.content.trim().replace(/```json/g, '').replace(/```/g, '');
      JSON.parse(analysisJson); // Verify valid JSON
    } catch (e: any) {
      logger.error(`AI analysis failed: ${e.message}`);
      analysisJson = JSON.stringify({
        keyTakeaways: [`Failed to analyze "${fileName}" autonomously.`],
        actionItems: ['Review the document manually.'],
        riskFactors: ['AI provider communication issues.'],
        entitiesMentioned: []
      });
    }

    // Save to Database
    const operation = await prisma.documentOperation.create({
      data: {
        userId,
        fileName,
        operationType: 'analyze',
        keyPoints: analysisJson,
      },
    });

    await prisma.agentActivityLog.create({
      data: {
        userId,
        agentId: 'document',
        action: 'document_analyzed',
        description: `Analyzed document: "${fileName}"`,
        reasoning: `Extracted key insights and risks autonomously.`,
      },
    });

    return operation;
  }

  async generatePdfDocument(userId: string, title: string, content: string): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument({ margin: 50 });
        const chunks: Buffer[] = [];

        doc.on('data', (chunk) => chunks.push(chunk));
        doc.on('end', () => resolve(Buffer.concat(chunks)));

        // Header Styling
        doc.fillColor('#6366F1')
           .fontSize(26)
           .text('NEXORA', { align: 'right' });
        doc.fontSize(10)
           .fillColor('#8B5CF6')
           .text('INTELLIGENCE, AUTOMATED.', { align: 'right' });
        
        doc.moveDown(2);
        
        // Document Title
        doc.fillColor('#1F2937')
           .fontSize(20)
           .text(title, { underline: true });
        
        doc.moveDown(1.5);
        
        // Content
        doc.fillColor('#374151')
           .fontSize(12)
           .text(content, {
             align: 'justify',
             lineGap: 4
           });

        doc.moveDown(3);
        
        // Footer watermark
        doc.fontSize(8)
           .fillColor('#9CA3AF')
           .text(`Generated Autonomously by Nexora Document Agent on ${new Date().toLocaleDateString()}`, {
             align: 'center'
           });

        doc.end();

        // Also save operation log
        prisma.documentOperation.create({
          data: {
            userId,
            fileName: `${title}.pdf`,
            operationType: 'generate_pdf',
            summary: `PDF generated with ${content.split(' ').length} words.`,
          }
        }).then(() => {
          prisma.agentActivityLog.create({
            data: {
              userId,
              agentId: 'document',
              action: 'pdf_generated',
              description: `Generated PDF: "${title}.pdf"`,
            }
          }).catch(err => logger.error(`Activity log save failed: ${err.message}`));
        }).catch(err => logger.error(`Db save failed: ${err.message}`));

      } catch (err) {
        reject(err);
      }
    });
  }

  async getHistory(userId: string) {
    return prisma.documentOperation.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });
  }
}

export const documentService = new DocumentService();
