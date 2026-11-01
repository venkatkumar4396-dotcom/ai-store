import PDFDocument from 'pdfkit';

/**
 * Universal PDF Generator Service for Nexora AI Agents
 * Crafts clean, executive-ready PDF documents with consistent styling.
 */
export class PDFService {
  /**
   * Generate an ATS-optimized, beautifully styled Resume & Cover Letter PDF
   */
  generateCareerPDF(data: {
    candidateName?: string;
    jobTitle: string;
    companyName?: string;
    atsScore?: number;
    summary?: string;
    skills?: string[];
    experience?: Array<{ section: string; original?: string; improved: string }>;
    coverLetter?: string;
    recruiterEmail?: string;
  }): PDFKit.PDFDocument {
    const doc = new PDFDocument({
      margin: 40,
      size: 'A4',
      info: {
        Title: `${data.jobTitle} - Application Package`,
        Author: 'Nexora Career Accelerator AI',
      },
    });

    const primaryColor = '#0f172a'; // Deep slate
    const accentColor = '#2563eb';  // Royal blue
    const subtleColor = '#64748b';  // Slate gray
    const lightBg = '#f8fafc';      // Off white

    // ── Header Banner ──
    doc.rect(40, 40, 515, 65).fill(primaryColor);

    doc.fillColor('#ffffff')
      .fontSize(20)
      .font('Helvetica-Bold')
      .text(data.candidateName || 'AI OPTIMIZED RESUME', 55, 52);

    doc.fillColor('#94a3b8')
      .fontSize(11)
      .font('Helvetica')
      .text(`Target Role: ${data.jobTitle}${data.companyName ? `  |  Target Company: ${data.companyName}` : ''}`, 55, 78);

    if (data.atsScore) {
      doc.fillColor('#38bdf8')
        .fontSize(14)
        .font('Helvetica-Bold')
        .text(`ATS Score: ${data.atsScore}%`, 420, 62, { align: 'right' });
    }

    let y = 125;

    // ── Professional Summary ──
    if (data.summary) {
      doc.fillColor(accentColor).fontSize(12).font('Helvetica-Bold').text('PROFESSIONAL SUMMARY', 40, y);
      y += 18;
      doc.rect(40, y, 515, 1).fill('#e2e8f0');
      y += 8;

      doc.fillColor('#334155').fontSize(10).font('Helvetica').text(data.summary, 40, y, {
        width: 515,
        lineGap: 3,
      });
      y = doc.y + 16;
    }

    // ── Core Competencies / Keywords ──
    if (data.skills && data.skills.length > 0) {
      if (y > 700) { doc.addPage(); y = 40; }
      doc.fillColor(accentColor).fontSize(12).font('Helvetica-Bold').text('CORE SKILLS & MATCHING KEYWORDS', 40, y);
      y += 18;
      doc.rect(40, y, 515, 1).fill('#e2e8f0');
      y += 8;

      const skillsText = data.skills.join('  •  ');
      doc.fillColor('#1e293b').fontSize(9).font('Helvetica-Bold').text(skillsText, 40, y, {
        width: 515,
        lineGap: 4,
      });
      y = doc.y + 16;
    }

    // ── Targeted Experience / Enhanced Bullets ──
    if (data.experience && data.experience.length > 0) {
      if (y > 680) { doc.addPage(); y = 40; }
      doc.fillColor(accentColor).fontSize(12).font('Helvetica-Bold').text('ENHANCED IMPACT STATEMENTS', 40, y);
      y += 18;
      doc.rect(40, y, 515, 1).fill('#e2e8f0');
      y += 10;

      for (const item of data.experience) {
        if (y > 700) { doc.addPage(); y = 40; }

        doc.fillColor(subtleColor).fontSize(9).font('Helvetica-Bold').text(`[${item.section || 'Experience'}]`, 40, y);
        y += 12;

        doc.fillColor('#0f172a').fontSize(9.5).font('Helvetica').text(`• ${item.improved}`, 45, y, {
          width: 510,
          lineGap: 2,
        });
        y = doc.y + 8;
      }
      y += 10;
    }

    // ── Tailored Cover Letter (New Page) ──
    if (data.coverLetter) {
      doc.addPage();
      y = 40;

      doc.rect(40, y, 515, 45).fill('#1e293b');
      doc.fillColor('#ffffff').fontSize(14).font('Helvetica-Bold').text('TAILORED COVER LETTER', 55, y + 15);
      y += 65;

      doc.fillColor('#1e293b').fontSize(10).font('Helvetica').text(data.coverLetter, 40, y, {
        width: 515,
        lineGap: 4,
      });
      y = doc.y + 20;
    }

    // ── Recruiter Outreach Pitch ──
    if (data.recruiterEmail) {
      if (y > 600) { doc.addPage(); y = 40; } else { y += 15; }

      doc.rect(40, y, 515, 25).fill('#f1f5f9');
      doc.fillColor(primaryColor).fontSize(11).font('Helvetica-Bold').text('DIRECT RECRUITER OUTREACH EMAIL', 50, y + 7);
      y += 35;

      doc.fillColor('#334155').fontSize(9.5).font('Helvetica').text(data.recruiterEmail, 45, y, {
        width: 505,
        lineGap: 3,
      });
    }

    return doc;
  }

  /**
   * Generate an Executive Startup Brief & Pitch Deck Outline PDF
   */
  generateStartupPDF(data: {
    name: string;
    industry: string;
    description: string;
    scores?: { startupScore?: number; marketOpportunity?: number; revenuePotential?: number; risk?: number };
    swot?: { strengths?: string[]; weaknesses?: string[]; opportunities?: string[]; threats?: string[] };
    roadmap?: Array<{ phase: string; timeframe?: string; actions?: string[] }>;
    revenueModel?: { pricingTiers?: Array<{ name: string; price: string; features?: string[] }> };
  }): PDFKit.PDFDocument {
    const doc = new PDFDocument({
      margin: 40,
      size: 'A4',
      info: { Title: `${data.name} - Executive Investment Brief`, Author: 'Nexora Startup Co-Founder' },
    });

    const primaryColor = '#4338ca'; // Indigo
    const darkSlate = '#0f172a';

    // Header
    doc.rect(40, 40, 515, 65).fill(primaryColor);
    doc.fillColor('#ffffff').fontSize(22).font('Helvetica-Bold').text(data.name.toUpperCase(), 55, 50);
    doc.fillColor('#c7d2fe').fontSize(10).font('Helvetica').text(`Industry: ${data.industry}  |  Executive Investment Brief`, 55, 78);

    if (data.scores?.startupScore) {
      doc.fillColor('#a5f3fc').fontSize(16).font('Helvetica-Bold').text(`Score: ${data.scores.startupScore}/100`, 430, 62, { align: 'right' });
    }

    let y = 125;

    // Overview
    doc.fillColor(primaryColor).fontSize(12).font('Helvetica-Bold').text('EXECUTIVE OVERVIEW', 40, y);
    y += 18;
    doc.rect(40, y, 515, 1).fill('#e2e8f0');
    y += 8;

    doc.fillColor('#334155').fontSize(10).font('Helvetica').text(data.description, 40, y, { width: 515, lineGap: 3 });
    y = doc.y + 16;

    // SWOT
    if (data.swot) {
      if (y > 600) { doc.addPage(); y = 40; }
      doc.fillColor(primaryColor).fontSize(12).font('Helvetica-Bold').text('STRATEGIC SWOT ANALYSIS', 40, y);
      y += 18;
      doc.rect(40, y, 515, 1).fill('#e2e8f0');
      y += 10;

      const printSWOTCol = (title: string, items: string[] | undefined, x: number, curY: number) => {
        doc.fillColor(darkSlate).fontSize(10).font('Helvetica-Bold').text(title, x, curY);
        let itemY = curY + 14;
        for (const it of (items || []).slice(0, 4)) {
          doc.fillColor('#475569').fontSize(8.5).font('Helvetica').text(`• ${it}`, x, itemY, { width: 240, lineGap: 2 });
          itemY = doc.y + 4;
        }
        return itemY;
      };

      const leftY = printSWOTCol('Strengths', data.swot.strengths, 40, y);
      const rightY = printSWOTCol('Opportunities', data.swot.opportunities, 300, y);
      y = Math.max(leftY, rightY) + 12;

      const leftY2 = printSWOTCol('Weaknesses', data.swot.weaknesses, 40, y);
      const rightY2 = printSWOTCol('Threats', data.swot.threats, 300, y);
      y = Math.max(leftY2, rightY2) + 16;
    }

    // Roadmap
    if (data.roadmap && data.roadmap.length > 0) {
      if (y > 650) { doc.addPage(); y = 40; }
      doc.fillColor(primaryColor).fontSize(12).font('Helvetica-Bold').text('EXECUTION ROADMAP', 40, y);
      y += 18;
      doc.rect(40, y, 515, 1).fill('#e2e8f0');
      y += 10;

      for (const step of data.roadmap) {
        doc.fillColor(darkSlate).fontSize(10).font('Helvetica-Bold').text(`${step.phase} ${step.timeframe ? `(${step.timeframe})` : ''}`, 40, y);
        y += 14;
        if (step.actions) {
          for (const act of step.actions) {
            doc.fillColor('#475569').fontSize(8.5).font('Helvetica').text(`  ✓ ${act}`, 45, y, { width: 505 });
            y = doc.y + 3;
          }
        }
        y += 6;
      }
    }

    return doc;
  }
}

export const pdfService = new PDFService();
