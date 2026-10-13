"use client";

import * as React from "react";
import Link from "next/link";
import { motion, useInView } from "framer-motion";
import {
  ArrowRight,
  Bot,
  Zap,
  Sparkles,
  Shield,
  Layers,
  ArrowUpRight,
  CheckCircle2,
  Cpu,
  Plane,
  TrendingUp,
  GraduationCap,
  CheckSquare,
  FileText,
  MessageCircle,
  Target,
  Star,
  ChevronDown,
  Globe,
  Lock,
  BarChart3,
  Users,
  Clock,
  Menu,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { FEATURED_BOTS, STATS, HOW_IT_WORKS } from "@/lib/constants";
import { ParticleBackground } from "@/components/shared/ParticleBackground";
import { AnimatedCounter } from "@/components/shared/AnimatedCounter";

const fadeUp = {
  initial: { opacity: 0, y: 30 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.6 },
};

const stagger = {
  animate: { transition: { staggerChildren: 0.1 } },
};

const AGENTS = [
  { icon: Plane, name: "Travel Booking", desc: "Flights, buses, trains — search, compare, and book across carriers instantly.", color: "from-blue-600 to-cyan-500", href: "/travel-booking" },
  { icon: TrendingUp, name: "Stock Intelligence", desc: "Technical analysis with RSI, MACD, Bollinger Bands. AI buy/sell signals.", color: "from-emerald-600 to-green-500", href: "/stock-intelligence" },
  { icon: GraduationCap, name: "Career Accelerator", desc: "ATS resume scoring, cover letters, interview prep, skill gap analysis.", color: "from-blue-600 to-indigo-500", href: "/career-accelerator" },
  { icon: CheckSquare, name: "Productivity", desc: "AI task management, daily planning, schedule generation, goal tracking.", color: "from-violet-600 to-purple-500", href: "/productivity" },
  { icon: FileText, name: "Document Agent", desc: "Summarize text, analyze documents, generate PDFs, extract key insights.", color: "from-amber-600 to-orange-500", href: "/document-agent" },
  { icon: Target, name: "AI Sales Agent", desc: "Find leads, generate personalized emails, and book meetings automatically.", color: "from-cyan-600 to-blue-500", href: "/sales-agent" },
];

const FEATURES = [
  { icon: Zap, title: "Lightning Fast", desc: "Sub-second AI responses powered by multi-provider routing. Gemini, GPT-4, Claude — all at your fingertips." },
  { icon: Shield, title: "Enterprise Security", desc: "End-to-end encryption, JWT authentication, rate limiting, and input validation on every endpoint." },
  { icon: Globe, title: "Multi-Platform", desc: "Works seamlessly on desktop, tablet, and mobile. PWA-ready for installable app experience." },
  { icon: Layers, title: "9+ AI Agents", desc: "From travel booking to stock analysis — specialized agents that handle real-world tasks autonomously." },
  { icon: Lock, title: "Privacy First", desc: "Your data stays yours. No training on user data. Self-hostable with local AI via Ollama." },
  { icon: BarChart3, title: "Real-time Analytics", desc: "Track agent performance, usage patterns, and ROI with built-in dashboards." },
];

const FAQ_ITEMS = [
  { q: "What AI models does Nexora use?", a: "Nexora supports Google Gemini, OpenAI GPT-4, Anthropic Claude, Groq, and local models via Ollama. You can switch between providers seamlessly." },
  { q: "Is Nexora free to use?", a: "Yes! The free tier includes access to all agents with generous usage limits. Pro and Premium plans offer higher limits and priority support." },
  { q: "Can I self-host Nexora?", a: "Absolutely. Nexora is designed to run locally with SQLite and Ollama for a fully private, offline-capable AI platform." },
  { q: "How does the Travel Booking Agent work?", a: "It searches across multiple flight, bus, and train providers simultaneously, compares prices and schedules, and lets you book with a single click." },
  { q: "Is my data secure?", a: "All data is encrypted at rest and in transit. We use JWT authentication, bcrypt password hashing, rate limiting, and input validation throughout the platform." },
];

function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = React.useState(false);
  return (
    <div className="border border-[#CBD5E1]/80 dark:border-white/10 rounded-2xl overflow-hidden bg-white dark:bg-zinc-950/40 shadow-xs hover:shadow-sm transition-shadow">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between p-5 text-left hover:bg-[#F8FAFC] dark:hover:bg-white/5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4F46E5] focus-visible:ring-offset-2"
        aria-expanded={open}
      >
        <span className="font-semibold text-[#0F172A] dark:text-white text-sm pr-4">{q}</span>
        <ChevronDown className={`h-4 w-4 text-[#475569] dark:text-zinc-400 shrink-0 transition-transform duration-300 ${open ? "rotate-180" : ""}`} />
      </button>
      <motion.div
        initial={false}
        animate={{ height: open ? "auto" : 0, opacity: open ? 1 : 0 }}
        transition={{ duration: 0.3 }}
        className="overflow-hidden"
      >
        <p className="px-5 pb-5 text-sm text-[#334155] dark:text-zinc-400 leading-relaxed border-t border-slate-100 dark:border-white/5 pt-3">{a}</p>
      </motion.div>
    </div>
  );
}

function SectionHeading({ badge, title, subtitle }: { badge?: string; title: string; subtitle: string }) {
  const ref = React.useRef(null);
  const isInView = useInView(ref, { once: true, margin: "0px" });
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 20 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.5 }}
      className="text-center space-y-3 mb-14"
    >
      {badge && (
        <span className="inline-flex items-center bg-[#EEF2FF] dark:bg-indigo-500/10 border border-[#C7D2FE] dark:border-indigo-500/20 text-[#4338CA] dark:text-indigo-400 px-3.5 py-1.5 font-semibold uppercase tracking-[0.06em] text-xs rounded-full shadow-xs">
          {badge}
        </span>
      )}
      <h2 className="text-3xl md:text-4xl font-extrabold text-[#0F172A] dark:text-white tracking-tight">{title}</h2>
      <p className="text-[#334155] dark:text-zinc-400 text-base md:text-lg max-w-2xl mx-auto leading-relaxed">{subtitle}</p>
    </motion.div>
  );
}

export default function LandingPage() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);

  return (
    <div className="min-h-screen bg-white dark:bg-zinc-950 text-[#0F172A] dark:text-foreground flex flex-col relative overflow-x-hidden">
      {/* Ambient background */}
      <div className="fixed inset-0 mesh-bg pointer-events-none" />
      <ParticleBackground />

      {/* ═══════════════ NAVBAR ═══════════════ */}
      <header className="border-b border-[rgba(15,23,42,0.10)] dark:border-white/5 bg-white/85 dark:bg-zinc-950/85 backdrop-blur-md sticky top-0 z-50 px-4 md:px-8 h-16 flex items-center justify-between shadow-xs transition-shadow">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-[#4F46E5] via-[#4338CA] to-[#2563EB] flex items-center justify-center font-bold text-white shadow-md shadow-indigo-600/20">
            N
          </div>
          <span className="font-bold text-lg text-[#0F172A] dark:text-white tracking-tight">
            Nexora
          </span>
        </div>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-6 text-[15px] font-medium text-[#334155] dark:text-zinc-300">
          <a href="#agents" className="hover:text-[#4F46E5] dark:hover:text-white transition-colors relative py-1 group">
            Agents
            <span className="absolute bottom-0 left-0 w-full h-[2px] bg-[#4F46E5] scale-x-0 group-hover:scale-x-100 transition-transform duration-200 origin-left" />
          </a>
          <a href="#features" className="hover:text-[#4F46E5] dark:hover:text-white transition-colors relative py-1 group">
            Features
            <span className="absolute bottom-0 left-0 w-full h-[2px] bg-[#4F46E5] scale-x-0 group-hover:scale-x-100 transition-transform duration-200 origin-left" />
          </a>
          <a href="#how-it-works" className="hover:text-[#4F46E5] dark:hover:text-white transition-colors relative py-1 group">
            How It Works
            <span className="absolute bottom-0 left-0 w-full h-[2px] bg-[#4F46E5] scale-x-0 group-hover:scale-x-100 transition-transform duration-200 origin-left" />
          </a>
          <a href="#pricing" className="hover:text-[#4F46E5] dark:hover:text-white transition-colors relative py-1 group">
            Pricing
            <span className="absolute bottom-0 left-0 w-full h-[2px] bg-[#4F46E5] scale-x-0 group-hover:scale-x-100 transition-transform duration-200 origin-left" />
          </a>
          <a href="#faq" className="hover:text-[#4F46E5] dark:hover:text-white transition-colors relative py-1 group">
            FAQ
            <span className="absolute bottom-0 left-0 w-full h-[2px] bg-[#4F46E5] scale-x-0 group-hover:scale-x-100 transition-transform duration-200 origin-left" />
          </a>
        </nav>

        <div className="flex items-center gap-2.5">
          <Link
            href="/login"
            className="hidden sm:inline-flex items-center justify-center border border-[#CBD5E1] dark:border-white/10 bg-white dark:bg-transparent text-[#1E1B4B] dark:text-zinc-200 font-semibold text-sm px-[18px] py-2 h-9 rounded-[10px] hover:bg-[#F1F5F9] dark:hover:bg-white/10 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4F46E5] focus-visible:ring-offset-2"
          >
            Log In
          </Link>
          <Link
            href="/register"
            className="hidden sm:inline-flex items-center justify-center bg-[#4F46E5] hover:bg-[#4338CA] active:bg-[#3730A3] text-white font-semibold text-sm px-4.5 py-2 h-9 rounded-[10px] shadow-sm hover:shadow transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4F46E5] focus-visible:ring-offset-2"
          >
            Get Started Free
          </Link>

          {/* Mobile menu trigger */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden text-[#334155] dark:text-zinc-400 hover:text-[#0F172A] dark:hover:text-white h-9 w-9 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4F46E5]"
            aria-label="Toggle menu"
          >
            {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
      </header>

      {/* Mobile Drawer Overlay */}
      {isMobileMenuOpen && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="fixed top-16 inset-x-0 bg-white/95 dark:bg-zinc-950/95 backdrop-blur-2xl border-b border-[rgba(15,23,42,0.10)] dark:border-white/10 z-40 p-5 md:hidden space-y-4 shadow-xl"
        >
          <nav className="flex flex-col space-y-3 font-medium text-[#334155] dark:text-zinc-300">
            <a href="#agents" onClick={() => setIsMobileMenuOpen(false)} className="py-2 hover:text-[#4F46E5] transition-colors">Agents</a>
            <a href="#features" onClick={() => setIsMobileMenuOpen(false)} className="py-2 hover:text-[#4F46E5] transition-colors">Features</a>
            <a href="#how-it-works" onClick={() => setIsMobileMenuOpen(false)} className="py-2 hover:text-[#4F46E5] transition-colors">How It Works</a>
            <a href="#pricing" onClick={() => setIsMobileMenuOpen(false)} className="py-2 hover:text-[#4F46E5] transition-colors">Pricing</a>
            <a href="#faq" onClick={() => setIsMobileMenuOpen(false)} className="py-2 hover:text-[#4F46E5] transition-colors">FAQ</a>
          </nav>
          <div className="pt-3 border-t border-slate-200 dark:border-white/10 flex flex-col gap-2.5">
            <Link
              href="/login"
              onClick={() => setIsMobileMenuOpen(false)}
              className="w-full text-center border border-[#CBD5E1] dark:border-white/10 text-[#1E1B4B] dark:text-zinc-200 font-semibold py-2.5 rounded-[10px] hover:bg-[#F1F5F9]"
            >
              Log In
            </Link>
            <Link
              href="/register"
              onClick={() => setIsMobileMenuOpen(false)}
              className="w-full text-center bg-[#4F46E5] text-white font-semibold py-2.5 rounded-[10px]"
            >
              Get Started Free
            </Link>
          </div>
        </motion.div>
      )}

      {/* ═══════════════ HERO ═══════════════ */}
      <section className="relative pt-24 pb-20 px-4 md:px-8 max-w-7xl mx-auto flex flex-col items-center justify-center text-center z-10 bg-white dark:bg-transparent">
        {/* Animated subtle floating orbs */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="login-orb-1 absolute top-0 left-1/4 w-[600px] h-[300px] bg-indigo-500/[0.04] blur-[130px] rounded-full" />
          <div className="login-orb-2 absolute top-1/3 right-1/4 w-[400px] h-[400px] bg-violet-500/[0.04] blur-[120px] rounded-full" />
        </div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
          className="space-y-6 max-w-4xl relative"
        >
          {/* Section Pill Badge */}
          <div>
            <span className="inline-flex items-center bg-[#EEF2FF] dark:bg-indigo-500/10 border border-[#C7D2FE] dark:border-indigo-500/20 text-[#4338CA] dark:text-indigo-400 px-3.5 py-1.5 font-semibold uppercase tracking-[0.06em] text-xs rounded-full shadow-xs">
              <Sparkles className="h-3 w-3 mr-1.5 text-[#4F46E5]" /> PREMIUM AI AGENT PLATFORM
            </span>
          </div>

          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight text-[#0F172A] dark:text-white leading-[1.05]">
            Intelligence,{" "}
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-[#3730A3] via-[#4F46E5] to-[#2563EB]">
              Automated.
            </span>
          </h1>

          <p className="text-[#334155] dark:text-zinc-300 text-lg md:text-xl leading-relaxed max-w-2xl mx-auto font-normal">
            Deploy powerful AI agents that book travel, analyze stocks, accelerate careers, boost productivity, and process documents — all from one platform.
          </p>

          <div className="flex flex-wrap justify-center gap-4 pt-4">
            <Link
              href="/register"
              className="inline-flex items-center justify-center bg-[#4F46E5] hover:bg-[#4338CA] active:bg-[#3730A3] text-white shadow-md hover:shadow-lg gap-2 font-semibold h-12 px-8 rounded-xl group transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4F46E5] focus-visible:ring-offset-2"
            >
              Start Free <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" />
            </Link>
            <Link
              href="#agents"
              className="inline-flex items-center justify-center bg-white dark:bg-transparent border-[1.5px] border-[#CBD5E1] dark:border-white/10 hover:border-[#4F46E5] hover:bg-[#EEF2FF] dark:hover:bg-white/5 text-[#1E1B4B] dark:text-zinc-200 font-semibold h-12 px-8 rounded-xl shadow-xs transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4F46E5] focus-visible:ring-offset-2"
            >
              Explore Agents
            </Link>
          </div>

          {/* Microcopy & Trust badges */}
          <div className="flex flex-wrap justify-center gap-6 pt-6 text-sm text-[#475569] dark:text-zinc-400 font-medium">
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="h-4 w-4 text-[#059669] shrink-0" /> No credit card required
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="h-4 w-4 text-[#059669] shrink-0" /> 9+ AI agents included
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="h-4 w-4 text-[#059669] shrink-0" /> Self-hostable
            </span>
          </div>
        </motion.div>
      </section>

      {/* ═══════════════ STATS RIBBON / TRUST BANNER ═══════════════ */}
      <section className="bg-[#F8FAFC] dark:bg-zinc-950/40 py-14 px-4 md:px-8 border-y border-[rgba(15,23,42,0.08)] dark:border-white/5 z-10">
        <div className="max-w-6xl mx-auto">
          <div className="bg-white dark:bg-zinc-950/60 border border-[rgba(15,23,42,0.10)] dark:border-white/10 rounded-[20px] shadow-md p-8">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-0 lg:divide-x divide-slate-200/80 dark:divide-white/10 text-center">
              {STATS.map((stat, idx) => (
                <div key={idx} className="space-y-1.5 px-4">
                  <div className="text-4xl lg:text-5xl font-extrabold text-[#0F172A] dark:text-white tracking-tight">
                    <AnimatedCounter value={stat.value} suffix={stat.suffix} />
                  </div>
                  <p className="text-[#475569] dark:text-zinc-400 text-sm font-medium">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════ AGENTS SHOWCASE ═══════════════ */}
      <section id="agents" className="py-24 px-4 md:px-8 max-w-7xl mx-auto z-10 bg-white dark:bg-transparent">
        <SectionHeading
          badge="AI AGENTS"
          title="Powerful Agents for Real-World Tasks"
          subtitle="Each agent is built to solve specific, practical problems — not generic chatbot conversations."
        />

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {AGENTS.map((agent, idx) => {
            const Icon = agent.icon;
            return (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "0px" }}
                transition={{ duration: 0.5, delay: idx * 0.1 }}
              >
                <div className="bg-white dark:bg-zinc-950/40 border border-[#CBD5E1]/80 dark:border-white/[0.06] rounded-2xl shadow-xs hover:shadow-lg hover:border-[#C7D2FE] dark:hover:border-indigo-500/30 hover:-translate-y-1 transition-all duration-200 ease-out group h-full relative overflow-hidden flex flex-col justify-between">
                  {/* Top accent line */}
                  <div className={`absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r ${agent.color} opacity-0 group-hover:opacity-100 transition-opacity duration-300`} />

                  <div className="p-6 space-y-4">
                    <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${agent.color} flex items-center justify-center shadow-md group-hover:scale-105 transition-transform duration-200`}>
                      <Icon className="h-6 w-6 text-white" />
                    </div>
                    <div className="space-y-2">
                      <h3 className="font-bold text-lg text-[#0F172A] dark:text-white group-hover:text-[#4F46E5] dark:group-hover:text-indigo-300 transition-colors">
                        {agent.name}
                      </h3>
                      <p className="text-[#475569] dark:text-zinc-400 text-sm leading-relaxed">{agent.desc}</p>
                    </div>
                  </div>

                  <div className="p-6 pt-0">
                    <Link
                      href={agent.href}
                      className="inline-flex items-center text-[#4F46E5] dark:text-indigo-400 hover:text-[#4338CA] dark:hover:text-indigo-300 font-semibold text-sm group-hover:translate-x-1 transition-transform focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4F46E5]"
                    >
                      Try it free <ArrowRight className="h-3.5 w-3.5 ml-1" />
                    </Link>
                  </div>
                </div>
              </motion.div>
            );
          })}

          {/* Additional agents teaser */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "0px" }}
            transition={{ duration: 0.5, delay: 0.5 }}
          >
            <div className="bg-[#F8FAFC] dark:bg-zinc-950/20 border border-dashed border-[#CBD5E1] dark:border-white/10 rounded-2xl h-full flex items-center justify-center p-6 text-center">
              <div className="space-y-3">
                <div className="w-12 h-12 rounded-xl bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 flex items-center justify-center mx-auto shadow-xs">
                  <Cpu className="h-6 w-6 text-[#4F46E5] dark:text-zinc-500" />
                </div>
                <h3 className="font-semibold text-[#0F172A] dark:text-zinc-400">+ 3 More Agents</h3>
                <p className="text-[#475569] dark:text-zinc-500 text-sm max-w-xs mx-auto">WhatsApp Bot, File Tracker, Startup Advisor, and more in the dashboard.</p>
                <Link
                  href="/register"
                  className="inline-flex items-center justify-center border border-[#CBD5E1] dark:border-white/10 bg-white dark:bg-transparent text-[#1E1B4B] dark:text-zinc-300 hover:bg-[#F1F5F9] dark:hover:bg-white/5 font-semibold text-xs px-4 py-2 rounded-lg shadow-xs transition-colors"
                >
                  View All <ArrowUpRight className="h-3.5 w-3.5 ml-1" />
                </Link>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ═══════════════ FEATURES ═══════════════ */}
      <section id="features" className="py-24 px-4 md:px-8 max-w-7xl mx-auto border-t border-[rgba(15,23,42,0.08)] dark:border-white/5 z-10 bg-[#F8FAFC] dark:bg-transparent">
        <SectionHeading
          badge="FEATURES"
          title="Built for Performance & Security"
          subtitle="Enterprise-grade infrastructure with the simplicity of a consumer product."
        />

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {FEATURES.map((feature, idx) => {
            const Icon = feature.icon;
            return (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "0px" }}
                transition={{ duration: 0.5, delay: idx * 0.08 }}
              >
                <div className="bg-white dark:bg-zinc-950/40 border border-[#CBD5E1]/80 dark:border-white/[0.06] rounded-2xl shadow-xs hover:shadow-lg hover:border-[#C7D2FE] dark:hover:border-indigo-500/20 hover:-translate-y-1 transition-all duration-200 ease-out p-6 space-y-3 h-full group">
                  <div className="relative w-11 h-11">
                    <div className="absolute inset-0 bg-indigo-500/10 rounded-xl blur-md scale-110 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    <div className="relative w-11 h-11 rounded-xl bg-[#EEF2FF] dark:bg-indigo-600/10 border border-[#C7D2FE] dark:border-indigo-500/20 flex items-center justify-center text-[#4F46E5] dark:text-indigo-400 group-hover:bg-[#E0E7FF] transition-colors">
                      <Icon className="h-5 w-5" />
                    </div>
                  </div>
                  <h3 className="font-semibold text-lg text-[#0F172A] dark:text-white group-hover:text-[#4F46E5] dark:group-hover:text-indigo-300 transition-colors">{feature.title}</h3>
                  <p className="text-[#475569] dark:text-zinc-400 text-sm leading-relaxed">{feature.desc}</p>
                </div>
              </motion.div>
            );
          })}
        </div>
      </section>

      {/* ═══════════════ HOW IT WORKS ═══════════════ */}
      <section id="how-it-works" className="py-24 px-4 md:px-8 max-w-7xl mx-auto border-t border-[rgba(15,23,42,0.08)] dark:border-white/5 z-10 bg-white dark:bg-transparent">
        <SectionHeading
          badge="HOW IT WORKS"
          title="From Zero to Automated in 60 Seconds"
          subtitle="Three simple steps to deploy your first AI agent."
        />

        <div className="relative">
          {/* Connector line */}
          <div className="hidden md:block absolute top-8 left-[10%] right-[10%] h-px bg-gradient-to-r from-transparent via-[#C7D2FE] dark:via-indigo-500/30 to-transparent" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {HOW_IT_WORKS.map((item, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "0px" }}
                transition={{ duration: 0.5, delay: idx * 0.15 }}
                className="relative space-y-5 p-8 border border-[#CBD5E1]/80 dark:border-white/[0.06] bg-white dark:bg-zinc-950/40 rounded-2xl shadow-xs hover:shadow-lg hover:border-[#C7D2FE] hover:-translate-y-1 transition-all duration-200 ease-out text-center group"
              >
                <div className="flex items-center justify-center">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#4F46E5] to-[#4338CA] flex items-center justify-center font-extrabold text-white text-lg shadow-md shadow-indigo-500/20 ring-4 ring-[#EEF2FF] dark:ring-indigo-500/10">
                    {item.step}
                  </div>
                </div>
                <h3 className="font-bold text-xl text-[#0F172A] dark:text-white group-hover:text-[#4F46E5] dark:group-hover:text-indigo-300 transition-colors">{item.title}</h3>
                <p className="text-[#475569] dark:text-zinc-400 text-sm leading-relaxed">{item.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════ PRICING ═══════════════ */}
      <section id="pricing" className="py-24 px-4 md:px-8 max-w-7xl mx-auto border-t border-[rgba(15,23,42,0.08)] dark:border-white/5 z-10 bg-[#F8FAFC] dark:bg-transparent">
        <SectionHeading
          badge="PRICING"
          title="Simple, Transparent Pricing"
          subtitle="Start free. Upgrade when you need more power."
        />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {/* Free */}
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5 }}>
            <div className="bg-white dark:bg-zinc-950/40 border border-[#CBD5E1]/80 dark:border-white/10 rounded-2xl shadow-xs hover:shadow-lg hover:border-[#C7D2FE] hover:-translate-y-1 transition-all duration-200 ease-out h-full p-8 space-y-6 flex flex-col justify-between">
              <div className="space-y-6">
                <div>
                  <h3 className="font-bold text-lg text-[#0F172A] dark:text-white">Free</h3>
                  <p className="text-[#475569] dark:text-zinc-500 text-sm mt-1">For getting started</p>
                </div>
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-extrabold text-[#0F172A] dark:text-white">$0</span>
                  <span className="text-[#475569] dark:text-zinc-500 text-sm">/forever</span>
                </div>
                <div className="space-y-3">
                  {["All 8 AI agents", "50 requests/day", "Basic analytics", "Community support", "1 workspace"].map((f, i) => (
                    <div key={i} className="flex items-center gap-2 text-sm text-[#334155] dark:text-zinc-300">
                      <CheckCircle2 className="h-4 w-4 text-[#059669] shrink-0" /> {f}
                    </div>
                  ))}
                </div>
              </div>
              <Link
                href="/register"
                className="w-full inline-flex items-center justify-center border border-[#CBD5E1] dark:border-white/10 bg-white dark:bg-transparent text-[#1E1B4B] dark:text-zinc-200 font-semibold text-sm py-2.5 rounded-[10px] hover:bg-[#F1F5F9] dark:hover:bg-white/5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4F46E5]"
              >
                Get Started
              </Link>
            </div>
          </motion.div>

          {/* Pro - Highlighted Tier */}
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5, delay: 0.1 }}>
            <div className="bg-white dark:bg-zinc-950/60 border-2 border-[#4F46E5] rounded-2xl shadow-md hover:shadow-xl hover:-translate-y-1 transition-all duration-200 ease-out h-full p-8 space-y-6 relative overflow-hidden flex flex-col justify-between">
              <div className="absolute top-0 left-0 right-0 h-1 bg-[#4F46E5]" />
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-bold text-lg text-[#0F172A] dark:text-white">Pro</h3>
                    <p className="text-[#475569] dark:text-zinc-500 text-sm mt-1">For power users</p>
                  </div>
                  <span className="bg-[#4F46E5] text-white font-semibold text-xs px-2.5 py-0.5 rounded-full">
                    Popular
                  </span>
                </div>
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-extrabold text-[#0F172A] dark:text-white">$19</span>
                  <span className="text-[#475569] dark:text-zinc-500 text-sm">/month</span>
                </div>
                <div className="space-y-3">
                  {["Everything in Free", "500 requests/day", "Advanced analytics", "Priority support", "5 workspaces", "API access"].map((f, i) => (
                    <div key={i} className="flex items-center gap-2 text-sm text-[#334155] dark:text-zinc-300">
                      <CheckCircle2 className="h-4 w-4 text-[#4F46E5] shrink-0" /> {f}
                    </div>
                  ))}
                </div>
              </div>
              <Link
                href="/register"
                className="w-full inline-flex items-center justify-center bg-[#4F46E5] hover:bg-[#4338CA] active:bg-[#3730A3] text-white font-semibold text-sm py-2.5 rounded-[10px] shadow-sm hover:shadow transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4F46E5]"
              >
                Upgrade to Pro
              </Link>
            </div>
          </motion.div>

          {/* Premium */}
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5, delay: 0.2 }}>
            <div className="bg-white dark:bg-zinc-950/40 border border-[#CBD5E1]/80 dark:border-white/10 rounded-2xl shadow-xs hover:shadow-lg hover:border-[#C7D2FE] hover:-translate-y-1 transition-all duration-200 ease-out h-full p-8 space-y-6 flex flex-col justify-between">
              <div className="space-y-6">
                <div>
                  <h3 className="font-bold text-lg text-[#0F172A] dark:text-white">Premium</h3>
                  <p className="text-[#475569] dark:text-zinc-500 text-sm mt-1">For teams & enterprises</p>
                </div>
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-extrabold text-[#0F172A] dark:text-white">$49</span>
                  <span className="text-[#475569] dark:text-zinc-500 text-sm">/month</span>
                </div>
                <div className="space-y-3">
                  {["Everything in Pro", "Unlimited requests", "Custom agents", "Dedicated support", "Unlimited workspaces", "SSO & admin panel"].map((f, i) => (
                    <div key={i} className="flex items-center gap-2 text-sm text-[#334155] dark:text-zinc-300">
                      <CheckCircle2 className="h-4 w-4 text-[#4338CA] shrink-0" /> {f}
                    </div>
                  ))}
                </div>
              </div>
              <Link
                href="/register"
                className="w-full inline-flex items-center justify-center border border-[#CBD5E1] dark:border-white/10 bg-white dark:bg-transparent text-[#1E1B4B] dark:text-zinc-200 font-semibold text-sm py-2.5 rounded-[10px] hover:bg-[#F1F5F9] dark:hover:bg-white/5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4F46E5]"
              >
                Contact Sales
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ═══════════════ TESTIMONIALS ═══════════════ */}
      <section className="py-24 px-4 md:px-8 max-w-7xl mx-auto border-t border-[rgba(15,23,42,0.08)] dark:border-white/5 z-10 bg-white dark:bg-transparent">
        <SectionHeading
          badge="TESTIMONIALS"
          title="Loved by Builders Worldwide"
          subtitle="See what developers and teams are saying about Nexora."
        />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            { name: "Sarah Chen", role: "Product Manager @ TechFlow", text: "Nexora's Travel Agent saved our team 20+ hours per week on booking business trips. The price comparison across carriers is insane.", stars: 5 },
            { name: "Marcus Rivera", role: "Day Trader", text: "The Stock Intelligence Agent gives me RSI, MACD, and Bollinger Bands analysis in seconds. It's like having a Bloomberg terminal for free.", stars: 5 },
            { name: "Priya Sharma", role: "CS Graduate Student", text: "Used the Career Accelerator to optimize my resume. Got 3x more interview callbacks within two weeks. The cover letter generator is a game-changer.", stars: 5 },
          ].map((t, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "0px" }}
              transition={{ duration: 0.5, delay: idx * 0.1 }}
            >
              <div className="bg-white dark:bg-zinc-950/40 border border-[#CBD5E1]/80 dark:border-white/10 rounded-2xl shadow-xs hover:shadow-md transition-shadow p-6 space-y-4 h-full flex flex-col justify-between">
                <div className="space-y-3">
                  <div className="flex gap-1">
                    {Array.from({ length: t.stars }).map((_, i) => (
                      <Star key={i} className="h-4 w-4 text-[#F59E0B] fill-[#F59E0B]" />
                    ))}
                  </div>
                  <p className="text-[#334155] dark:text-zinc-300 text-sm leading-relaxed italic">&ldquo;{t.text}&rdquo;</p>
                </div>
                <div className="flex items-center gap-3 pt-3 border-t border-slate-100 dark:border-white/5">
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#4F46E5] to-[#4338CA] flex items-center justify-center font-bold text-white text-xs shadow-xs">
                    {t.name.split(" ").map(w => w[0]).join("")}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-[#0F172A] dark:text-white">{t.name}</p>
                    <p className="text-xs text-[#64748B] dark:text-zinc-500">{t.role}</p>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ═══════════════ FAQ ═══════════════ */}
      <section id="faq" className="py-24 px-4 md:px-8 max-w-3xl mx-auto border-t border-[rgba(15,23,42,0.08)] dark:border-white/5 z-10 bg-[#F8FAFC] dark:bg-transparent">
        <SectionHeading
          badge="FAQ"
          title="Frequently Asked Questions"
          subtitle="Everything you need to know about Nexora."
        />

        <div className="space-y-3">
          {FAQ_ITEMS.map((item, idx) => (
            <FaqItem key={idx} q={item.q} a={item.a} />
          ))}
        </div>
      </section>

      {/* ═══════════════ CTA BANNER ═══════════════ */}
      <section className="py-24 px-4 md:px-8 max-w-4xl mx-auto text-center z-10 bg-white dark:bg-transparent">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "0px" }}
          transition={{ duration: 0.6 }}
          className="p-10 md:p-14 rounded-[24px] border border-[#C7D2FE] dark:border-indigo-500/20 bg-gradient-to-br from-[#EEF2FF] via-white to-[#EEF2FF] dark:from-indigo-600/[0.08] dark:via-violet-600/[0.05] dark:to-cyan-600/[0.03] shadow-md relative overflow-hidden"
        >
          <div className="relative space-y-6">
            <div className="flex items-center justify-center gap-2 mb-2">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#4F46E5] to-[#2563EB] flex items-center justify-center shadow-md shadow-indigo-500/20">
                <Sparkles className="h-5 w-5 text-white" />
              </div>
            </div>
            <h2 className="text-3xl md:text-4xl font-extrabold text-[#0F172A] dark:text-white tracking-tight">
              Ready to automate with AI?
            </h2>
            <p className="text-[#334155] dark:text-zinc-400 text-base md:text-lg max-w-xl mx-auto">
              Join thousands of users deploying intelligent agents. Start free — no credit card required.
            </p>
            <div className="flex flex-wrap gap-4 justify-center pt-2">
              <Link
                href="/register"
                className="inline-flex items-center justify-center bg-[#4F46E5] hover:bg-[#4338CA] active:bg-[#3730A3] text-white shadow-md hover:shadow-lg gap-2 font-semibold h-12 px-8 rounded-xl group transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4F46E5] focus-visible:ring-offset-2"
              >
                Get Started Free <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" />
              </Link>
              <Link
                href="/login"
                className="inline-flex items-center justify-center bg-white dark:bg-transparent border-[1.5px] border-[#CBD5E1] dark:border-white/10 hover:border-[#4F46E5] hover:bg-[#EEF2FF] dark:hover:bg-white/5 text-[#1E1B4B] dark:text-zinc-200 font-semibold h-12 px-8 rounded-xl shadow-xs transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4F46E5] focus-visible:ring-offset-2"
              >
                Sign In
              </Link>
            </div>
          </div>
        </motion.div>
      </section>

      {/* ═══════════════ FOOTER ═══════════════ */}
      <footer className="border-t border-[rgba(15,23,42,0.08)] dark:border-white/5 bg-[#F8FAFC] dark:bg-zinc-950/60 py-16 px-4 md:px-8 text-[#475569] dark:text-zinc-500 text-sm z-10">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-10 mb-12">
            <div className="col-span-2 md:col-span-1 space-y-4">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-[#4F46E5] to-[#2563EB] flex items-center justify-center font-bold text-white text-xs">
                  N
                </div>
                <span className="font-bold text-[#0F172A] dark:text-white text-base">Nexora</span>
              </div>
              <p className="text-xs text-[#64748B] dark:text-zinc-500 leading-relaxed">
                Intelligence, Automated. The premium AI agent platform for real-world automation.
              </p>
            </div>

            <div className="space-y-3">
              <h4 className="font-semibold text-[#0F172A] dark:text-white text-sm">Product</h4>
              <div className="space-y-2 text-xs">
                <a href="#agents" className="block hover:text-[#4F46E5] dark:hover:text-white transition-colors">AI Agents</a>
                <a href="#features" className="block hover:text-[#4F46E5] dark:hover:text-white transition-colors">Features</a>
                <a href="#pricing" className="block hover:text-[#4F46E5] dark:hover:text-white transition-colors">Pricing</a>
                <a href="#faq" className="block hover:text-[#4F46E5] dark:hover:text-white transition-colors">FAQ</a>
              </div>
            </div>

            <div className="space-y-3">
              <h4 className="font-semibold text-[#0F172A] dark:text-white text-sm">Agents</h4>
              <div className="space-y-2 text-xs">
                <Link href="/login" className="block hover:text-[#4F46E5] dark:hover:text-white transition-colors">Travel Booking</Link>
                <Link href="/login" className="block hover:text-[#4F46E5] dark:hover:text-white transition-colors">Stock Analysis</Link>
                <Link href="/login" className="block hover:text-[#4F46E5] dark:hover:text-white transition-colors">Career Agent</Link>
                <Link href="/login" className="block hover:text-[#4F46E5] dark:hover:text-white transition-colors">Productivity</Link>
              </div>
            </div>

            <div className="space-y-3">
              <h4 className="font-semibold text-[#0F172A] dark:text-white text-sm">Legal</h4>
              <div className="space-y-2 text-xs">
                <a href="#" className="block hover:text-[#4F46E5] dark:hover:text-white transition-colors">Privacy Policy</a>
                <a href="#" className="block hover:text-[#4F46E5] dark:hover:text-white transition-colors">Terms of Service</a>
                <a href="#" className="block hover:text-[#4F46E5] dark:hover:text-white transition-colors">Cookie Policy</a>
              </div>
            </div>
          </div>

          <div className="border-t border-slate-200 dark:border-white/5 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="text-xs text-[#64748B] dark:text-zinc-500">
              © {new Date().getFullYear()} Nexora AI. All rights reserved.
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
