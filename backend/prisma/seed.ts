import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const bots = [
  {
    id: 'bot-travel',
    name: 'Travel Booking Agent',
    slug: 'travel-booking-agent',
    description: 'Search flights, buses, and trains. Compare prices across carriers and book instantly with AI-powered trip planning.',
    category: 'automation',
    icon: 'Plane',
    features: JSON.stringify([
      'Flight Search',
      'Bus Routes',
      'Train Booking',
      'Price Comparison',
      'Trip Planning',
      'Instant Booking'
    ]),
    screenshots: JSON.stringify([]),
    isActive: true,
    price: 0.0,
  },
  {
    id: 'bot-hotel',
    name: 'Hotel Booking Agent',
    slug: 'hotel-booking-agent',
    description: 'Search hotels, compare room features, manage bookings, and find the best deals with AI recommendations.',
    category: 'automation',
    icon: 'Hotel',
    features: JSON.stringify([
      'Hotel Search',
      'Room Configuration',
      'Deals Comparison',
      'Instant Reservation',
      'Amenities Filter'
    ]),
    screenshots: JSON.stringify([]),
    isActive: true,
    price: 0.0,
  },
  {
    id: 'bot-1',
    name: 'WhatsApp AI Assistant',
    slug: 'whatsapp-ai-assistant',
    description: 'Intelligent WhatsApp chatbot with natural language understanding and automated responses.',
    category: 'communication',
    icon: 'MessageCircle',
    features: JSON.stringify([
      'Natural Language Processing',
      'Auto-replies',
      'Template Messages',
      'Multi-language'
    ]),
    screenshots: JSON.stringify([]),
    isActive: true,
    price: 0.0,
  },
  {
    id: 'bot-2',
    name: 'Stock Intelligence Agent',
    slug: 'stock-intelligence-agent',
    description: 'Real-time stock analysis with RSI, MACD, Bollinger Bands, AI-powered buy/sell signals and portfolio tracking.',
    category: 'analytics',
    icon: 'TrendingUp',
    features: JSON.stringify([
      'Technical Analysis',
      'AI Signals',
      'Portfolio Tracker',
      'Watchlists',
      'Sentiment Analysis'
    ]),
    screenshots: JSON.stringify([]),
    isActive: true,
    price: 0.0,
  },
  {
    id: 'bot-3',
    name: 'Career Accelerator Agent',
    slug: 'career-accelerator-agent',
    description: 'ATS resume scoring, cover letter generation, interview prep, and skill gap analysis powered by AI.',
    category: 'productivity',
    icon: 'GraduationCap',
    features: JSON.stringify([
      'ATS Scoring',
      'Cover Letters',
      'Interview Prep',
      'Skill Gap Analysis',
      'Resume Optimization'
    ]),
    screenshots: JSON.stringify([]),
    isActive: true,
    price: 0.0,
  },
  {
    id: 'bot-productivity',
    name: 'Productivity Agent',
    slug: 'productivity-agent',
    description: 'AI-powered task management, daily planning, schedule generation, goal tracking, and smart reminders.',
    category: 'productivity',
    icon: 'CheckSquare',
    features: JSON.stringify([
      'Task Management',
      'AI Scheduling',
      'Goal Tracking',
      'Smart Reminders',
      'Daily Planning'
    ]),
    screenshots: JSON.stringify([]),
    isActive: true,
    price: 0.0,
  },
  {
    id: 'bot-document',
    name: 'Document Agent',
    slug: 'document-agent',
    description: 'AI text summarization, document analysis, PDF generation, and key points extraction from any content.',
    category: 'productivity',
    icon: 'FileText',
    features: JSON.stringify([
      'Text Summarization',
      'Document Analysis',
      'PDF Generation',
      'Key Point Extraction'
    ]),
    screenshots: JSON.stringify([]),
    isActive: true,
    price: 0.0,
  },
  {
    id: 'bot-4',
    name: 'Smart File Monitor',
    slug: 'smart-file-monitor',
    description: 'AI-powered file tracking with change detection, audit logging, and alerts.',
    category: 'productivity',
    icon: 'FileSearch',
    features: JSON.stringify([
      'Change Detection',
      'Audit Logging',
      'Real-time Alerts',
      'Version History'
    ]),
    screenshots: JSON.stringify([]),
    isActive: true,
    price: 0.0,
  },
  {
    id: 'bot-5',
    name: 'Startup Co-Founder Agent',
    slug: 'startup-co-founder-agent',
    description: 'AI-powered startup idea validation with SWOT analysis, market scoring, and revenue modeling.',
    category: 'analytics',
    icon: 'Rocket',
    features: JSON.stringify([
      'Idea Validation',
      'SWOT Analysis',
      'Market Scoring',
      'Revenue Model',
      'Competitor Research'
    ]),
    screenshots: JSON.stringify([]),
    isActive: true,
    price: 0.0,
  },
  {
    id: 'bot-compass',
    name: 'Compass Travel Advisor',
    slug: 'compass-travel-advisor',
    description: 'Bespoke travel planner with specialized agent roles, real-time map integration, and automated itinerary tracking.',
    category: 'automation',
    icon: 'Compass',
    features: JSON.stringify([
      'Specialized Advisor Roles',
      'Real-Time Map Sync',
      'Itinerary Generation',
      'Automated Passport Tracking',
      'Ollama & Gemini Support'
    ]),
    screenshots: JSON.stringify([]),
    isActive: true,
    price: 0.0,
  },
  {
    id: 'bot-sales',
    name: 'AI Sales Agent',
    slug: 'ai-sales-agent',
    description: 'AI-powered lead discovery, personalized email outreach, and meeting scheduling for startups & SaaS.',
    category: 'automation',
    icon: 'Target',
    features: JSON.stringify([
      'Lead Discovery',
      'AI Lead Scoring',
      'Email Generation',
      'Meeting Scheduling',
      'Lead Enrichment',
      'Pipeline Analytics'
    ]),
    screenshots: JSON.stringify([]),
    isActive: true,
    price: 0.0,
  }
];

async function main() {
  console.log('Starting database seeding...');

  for (const bot of bots) {
    const upserted = await prisma.bot.upsert({
      where: { slug: bot.slug },
      update: {
        id: bot.id,
        name: bot.name,
        description: bot.description,
        category: bot.category,
        icon: bot.icon,
        features: bot.features,
        screenshots: bot.screenshots,
        isActive: bot.isActive,
        price: bot.price,
      },
      create: bot,
    });
    console.log(`Seeded/Upserted bot: ${upserted.name} (${upserted.id})`);
  }

  console.log('Seeding completed successfully.');
}

main()
  .catch((e) => {
    console.error('Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
