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
    <div className="border border-white/10 rounded-xl overflow-hidden bg-zinc-950/40 backdrop-blur-sm">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between p-5 text-left hover:bg-white/5 transition-colors"
      >
        <span className="font-semibold text-white text-sm pr-4">{q}</span>
        <ChevronDown className={`h-4 w-4 text-zinc-400 shrink-0 transition-transform duration-300 ${open ? "rotate-180" : ""}`} />
      </button>
      <motion.div
        initial={false}
        animate={{ height: open ? "auto" : 0, opacity: open ? 1 : 0 }}
        transition={{ duration: 0.3 }}
        className="overflow-hidden"
      >
        <p className="px-5 pb-5 text-sm text-zinc-400 leading-relaxed">{a}</p>
      </motion.div>
    </div>
  );
}

function SectionHeading({ badge, title, subtitle }: { badge?: string; title: string; subtitle: string }) {
  const ref = React.useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-80px" });
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 20 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.5 }}
      className="text-center space-y-3 mb-14"
    >
      {badge && (
        <Badge variant="outline" className="bg-indigo-500/10 border-indigo-500/20 text-indigo-400 px-3 py-1 font-semibold uppercase tracking-wider text-xs">
          {badge}
        </Badge>
      )}
      <h2 className="text-3xl md:text-4xl font-bold text-white tracking-tight">{title}</h2>
      <p className="text-zinc-400 text-base md:text-lg max-w-2xl mx-auto leading-relaxed">{subtitle}</p>
    </motion.div>
  );
}

export default function LandingPage() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col relative overflow-x-hidden">
      {/* Ambient background */}
      <div className="fixed inset-0 mesh-bg pointer-events-none" />
      <ParticleBackground />

      {/* ═══════════════ HEADER ═══════════════ */}
      <header className="border-b border-white/5 bg-zinc-950/60 backdrop-blur-xl sticky top-0 z-50 px-4 md:px-8 h-16 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-indigo-600 via-violet-500 to-cyan-500 flex items-center justify-center font-bold shadow-lg shadow-indigo-600/20">
            N
          </div>
          <span className="font-bold text-lg bg-clip-text text-transparent bg-gradient-to-r from-white via-zinc-200 to-zinc-400">
            Nexora
          </span>
        </div>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-8 text-sm text-zinc-400 font-medium">
          <a href="#agents" className="hover:text-white transition-colors">Agents</a>
          <a href="#features" className="hover:text-white transition-colors">Features</a>
          <a href="#how-it-works" className="hover:text-white transition-colors">How It Works</a>
          <a href="#pricing" className="hover:text-white transition-colors">Pricing</a>
          <a href="#faq" className="hover:text-white transition-colors">FAQ</a>
        </nav>

        <div className="flex items-center gap-2.5">
          <Button variant="ghost" className="text-zinc-400 hover:text-white text-sm font-medium hidden sm:inline-flex" asChild>
            <Link href="/login">Log In</Link>
          </Button>
          <Button className="bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-sm shadow-md shadow-indigo-500/10 hidden sm:inline-flex" asChild>
            <Link href="/register">Get Started Free</Link>
          </Button>

          {/* Mobile menu trigger */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden text-zinc-400 hover:text-white h-9 w-9"
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
          className="fixed top-16 inset-x-0 bg-zinc-950/95 backdrop-blur-2xl border-b border-white/10 z-40 p-5 md:hidden space-y-4 shadow-2xl"
        >
          <nav className="flex flex-col space-y-3 font-medium text-zinc-300">
            <a href="#agents" onClick={() => setIsMobileMenuOpen(false)} className="py-2 hover:text-white transition-colors">Agents</a>
            <a href="#features" onClick={() => setIsMobileMenuOpen(false)} className="py-2 hover:text-white transition-colors">Features</a>
            <a href="#how-it-works" onClick={() => setIsMobileMenuOpen(false)} className="py-2 hover:text-white transition-colors">How It Works</a>
            <a href="#pricing" onClick={() => setIsMobileMenuOpen(false)} className="py-2 hover:text-white transition-colors">Pricing</a>
            <a href="#faq" onClick={() => setIsMobileMenuOpen(false)} className="py-2 hover:text-white transition-colors">FAQ</a>
          </nav>
          <div className="pt-3 border-t border-white/10 flex flex-col gap-2.5">
            <Button variant="outline" className="w-full border-white/10 text-zinc-200" asChild>
              <Link href="/login" onClick={() => setIsMobileMenuOpen(false)}>Log In</Link>
            </Button>
            <Button className="w-full bg-indigo-600 text-white font-semibold" asChild>
              <Link href="/register" onClick={() => setIsMobileMenuOpen(false)}>Get Started Free</Link>
            </Button>
          </div>
        </motion.div>
      )}

      {/* ═══════════════ HERO ═══════════════ */}
      <section className="relative pt-24 pb-20 px-4 md:px-8 max-w-7xl mx-auto flex flex-col items-center justify-center text-center z-10">
        {/* Animated floating orbs */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="login-orb-1 absolute top-0 left-1/4 w-[600px] h-[300px] bg-indigo-500/[0.08] blur-[130px] rounded-full" />
          <div className="login-orb-2 absolute top-1/3 right-1/4 w-[400px] h-[400px] bg-violet-500/[0.07] blur-[120px] rounded-full" />
          <div className="login-orb-3 absolute bottom-0 left-1/3 w-[350px] h-[250px] bg-cyan-500/[0.05] blur-[100px] rounded-full" />
        </div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
          className="space-y-6 max-w-4xl relative"
        >
          <Badge variant="outline" className="bg-indigo-500/10 border-indigo-500/20 text-indigo-400 px-4 py-1.5 font-semibold uppercase tracking-wider text-xs">
            <Sparkles className="h-3 w-3 mr-1.5 animate-pulse" /> Premium AI Agent Platform
          </Badge>

          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight text-white leading-[1.05]">
            Intelligence,{" "}
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 via-violet-400 to-cyan-400">
              Automated.
            </span>
          </h1>

          <p className="text-zinc-400 text-lg md:text-xl leading-relaxed max-w-2xl mx-auto">
            Deploy powerful AI agents that book travel, analyze stocks, accelerate careers, boost productivity, and process documents — all from one platform.
          </p>

          <div className="flex flex-wrap justify-center gap-4 pt-4">
            <Button size="lg" className="bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-500/20 gap-2 font-semibold h-12 px-8 btn-premium" asChild>
              <Link href="/register">
                Start Free <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" className="border-white/10 hover:bg-white/5 text-zinc-300 h-12 px-8" asChild>
              <Link href="#agents">
                Explore Agents
              </Link>
            </Button>
          </div>

          {/* Trust badges */}
          <div className="flex flex-wrap justify-center gap-6 pt-6 text-xs text-zinc-500">
            <span className="flex items-center gap-1.5"><CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" /> No credit card required</span>
            <span className="flex items-center gap-1.5"><CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" /> 9+ AI agents included</span>
            <span className="flex items-center gap-1.5"><CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" /> Self-hostable</span>
          </div>
        </motion.div>
      </section>

      {/* ═══════════════ STATS RIBBON ═══════════════ */}
      <section className="border-y border-white/5 bg-zinc-950/40 backdrop-blur-sm py-10 px-4 z-10">
        <div className="max-w-6xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          {STATS.map((stat, idx) => (
            <div key={idx} className="space-y-1">
              <span className="text-3xl md:text-4xl font-extrabold text-white">
                <AnimatedCounter value={stat.value} suffix={stat.suffix} />
              </span>
              <p className="text-zinc-500 text-xs md:text-sm font-medium">{stat.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ═══════════════ AGENTS SHOWCASE ═══════════════ */}
      <section id="agents" className="py-24 px-4 md:px-8 max-w-7xl mx-auto z-10">
        <SectionHeading
          badge="AI Agents"
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
                viewport={{ once: true, margin: "-50px" }}
                transition={{ duration: 0.5, delay: idx * 0.1 }}
              >
                <Card className="border border-white/[0.06] bg-zinc-950/40 backdrop-blur-sm hover:border-indigo-500/30 transition-all duration-300 group h-full card-3d relative overflow-hidden">
                  {/* Gradient top accent */}
                  <div className={`absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r ${agent.color} opacity-0 group-hover:opacity-100 transition-opacity duration-300`} />
                  {/* Background glow */}
                  <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-indigo-500/0 to-violet-500/0 group-hover:from-indigo-500/[0.06] group-hover:to-violet-500/[0.03] rounded-full blur-2xl transition-all duration-500 pointer-events-none" />
                  <CardContent className="p-6 space-y-4 relative">
                    <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${agent.color} flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                      <Icon className="h-6 w-6 text-white" />
                    </div>
                    <div className="space-y-2">
                      <h3 className="font-bold text-lg text-white group-hover:text-indigo-300 transition-colors">
                        {agent.name}
                      </h3>
                      <p className="text-zinc-400 text-sm leading-relaxed">{agent.desc}</p>
                    </div>
                    <Button variant="ghost" className="text-indigo-400 hover:text-indigo-300 p-0 h-auto font-semibold text-sm group-hover:translate-x-1 transition-transform" asChild>
                      <Link href={agent.href}>
                        Try it free <ArrowRight className="h-3.5 w-3.5 ml-1" />
                      </Link>
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}

          {/* Additional agents teaser */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ duration: 0.5, delay: 0.5 }}
          >
            <Card className="border border-dashed border-white/10 bg-zinc-950/20 h-full flex items-center justify-center">
              <CardContent className="p-6 text-center space-y-3">
                <div className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center mx-auto">
                  <Cpu className="h-6 w-6 text-zinc-500" />
                </div>
                <h3 className="font-semibold text-zinc-400">+ 3 More Agents</h3>
                <p className="text-zinc-500 text-sm">WhatsApp Bot, File Tracker, Startup Advisor, and more in the dashboard.</p>
                <Button variant="outline" className="border-white/10 text-zinc-400 hover:text-white" asChild>
                  <Link href="/register">View All <ArrowUpRight className="h-3.5 w-3.5 ml-1" /></Link>
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </section>

      {/* ═══════════════ FEATURES ═══════════════ */}
      <section id="features" className="py-24 px-4 md:px-8 max-w-7xl mx-auto border-t border-white/5 z-10">
        <SectionHeading
          badge="Features"
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
                viewport={{ once: true, margin: "-50px" }}
                transition={{ duration: 0.5, delay: idx * 0.08 }}
              >
                <Card className="border border-white/[0.06] bg-zinc-950/40 backdrop-blur-sm h-full group hover:border-indigo-500/20 transition-all duration-300">
                  <CardContent className="p-6 space-y-3">
                    <div className="relative w-11 h-11">
                      <div className="absolute inset-0 bg-indigo-500/20 rounded-xl blur-md scale-110 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                      <div className="relative w-11 h-11 rounded-xl bg-indigo-600/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 group-hover:bg-indigo-600/15 transition-colors">
                        <Icon className="h-5 w-5" />
                      </div>
                    </div>
                    <h3 className="font-semibold text-white group-hover:text-indigo-300 transition-colors">{feature.title}</h3>
                    <p className="text-zinc-400 text-sm leading-relaxed">{feature.desc}</p>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
      </section>

      {/* ═══════════════ HOW IT WORKS ═══════════════ */}
      <section id="how-it-works" className="py-24 px-4 md:px-8 max-w-7xl mx-auto border-t border-white/5 z-10">
        <SectionHeading
          badge="How It Works"
          title="From Zero to Automated in 60 Seconds"
          subtitle="Three simple steps to deploy your first AI agent."
        />

        <div className="relative">
          {/* Connector line */}
          <div className="hidden md:block absolute top-8 left-[10%] right-[10%] h-px bg-gradient-to-r from-transparent via-indigo-500/30 to-transparent" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {HOW_IT_WORKS.map((item, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ duration: 0.5, delay: idx * 0.15 }}
                className="relative space-y-5 p-8 border border-white/[0.06] bg-zinc-950/40 backdrop-blur-sm rounded-2xl group hover:border-indigo-500/20 transition-all duration-300 text-center"
              >
                <div className="flex items-center justify-center">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-600 to-violet-600 flex items-center justify-center font-extrabold text-white text-lg shadow-xl shadow-indigo-500/20 ring-4 ring-indigo-500/10">
                    {item.step}
                  </div>
                </div>
                <h3 className="font-bold text-xl text-white group-hover:text-indigo-300 transition-colors">{item.title}</h3>
                <p className="text-zinc-400 text-sm leading-relaxed">{item.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════ PRICING ═══════════════ */}
      <section id="pricing" className="py-24 px-4 md:px-8 max-w-7xl mx-auto border-t border-white/5 z-10">
        <SectionHeading
          badge="Pricing"
          title="Simple, Transparent Pricing"
          subtitle="Start free. Upgrade when you need more power."
        />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {/* Free */}
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5 }}>
            <Card className="border border-white/10 bg-zinc-950/40 backdrop-blur-sm h-full">
              <CardContent className="p-8 space-y-6">
                <div>
                  <h3 className="font-bold text-lg text-white">Free</h3>
                  <p className="text-zinc-500 text-sm mt-1">For getting started</p>
                </div>
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-extrabold text-white">$0</span>
                  <span className="text-zinc-500 text-sm">/forever</span>
                </div>
                <div className="space-y-3">
                  {["All 8 AI agents", "50 requests/day", "Basic analytics", "Community support", "1 workspace"].map((f, i) => (
                    <div key={i} className="flex items-center gap-2 text-sm text-zinc-300">
                      <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" /> {f}
                    </div>
                  ))}
                </div>
                <Button className="w-full border-white/10 hover:bg-white/5 text-zinc-300" variant="outline" asChild>
                  <Link href="/register">Get Started</Link>
                </Button>
              </CardContent>
            </Card>
          </motion.div>

          {/* Pro - highlighted */}
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5, delay: 0.1 }}>
            <Card className="border-2 border-indigo-500/40 bg-zinc-950/60 backdrop-blur-sm h-full relative overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-indigo-600 via-violet-500 to-cyan-500" />
              <CardContent className="p-8 space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-bold text-lg text-white">Pro</h3>
                    <p className="text-zinc-500 text-sm mt-1">For power users</p>
                  </div>
                  <Badge className="bg-indigo-600 text-white border-0">Popular</Badge>
                </div>
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-extrabold text-white">$19</span>
                  <span className="text-zinc-500 text-sm">/month</span>
                </div>
                <div className="space-y-3">
                  {["Everything in Free", "500 requests/day", "Advanced analytics", "Priority support", "5 workspaces", "API access"].map((f, i) => (
                    <div key={i} className="flex items-center gap-2 text-sm text-zinc-300">
                      <CheckCircle2 className="h-4 w-4 text-indigo-400 shrink-0" /> {f}
                    </div>
                  ))}
                </div>
                <Button className="w-full bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-500/20" asChild>
                  <Link href="/register">Upgrade to Pro</Link>
                </Button>
              </CardContent>
            </Card>
          </motion.div>

          {/* Premium */}
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5, delay: 0.2 }}>
            <Card className="border border-white/10 bg-zinc-950/40 backdrop-blur-sm h-full">
              <CardContent className="p-8 space-y-6">
                <div>
                  <h3 className="font-bold text-lg text-white">Premium</h3>
                  <p className="text-zinc-500 text-sm mt-1">For teams & enterprises</p>
                </div>
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-extrabold text-white">$49</span>
                  <span className="text-zinc-500 text-sm">/month</span>
                </div>
                <div className="space-y-3">
                  {["Everything in Pro", "Unlimited requests", "Custom agents", "Dedicated support", "Unlimited workspaces", "SSO & admin panel"].map((f, i) => (
                    <div key={i} className="flex items-center gap-2 text-sm text-zinc-300">
                      <CheckCircle2 className="h-4 w-4 text-violet-400 shrink-0" /> {f}
                    </div>
                  ))}
                </div>
                <Button className="w-full border-white/10 hover:bg-white/5 text-zinc-300" variant="outline" asChild>
                  <Link href="/register">Contact Sales</Link>
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </section>

      {/* ═══════════════ TESTIMONIALS ═══════════════ */}
      <section className="py-24 px-4 md:px-8 max-w-7xl mx-auto border-t border-white/5 z-10">
        <SectionHeading
          badge="Testimonials"
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
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: idx * 0.1 }}
            >
              <Card className="border border-white/10 bg-zinc-950/40 backdrop-blur-sm h-full">
                <CardContent className="p-6 space-y-4">
                  <div className="flex gap-0.5">
                    {Array.from({ length: t.stars }).map((_, i) => (
                      <Star key={i} className="h-4 w-4 text-amber-400 fill-amber-400" />
                    ))}
                  </div>
                  <p className="text-zinc-300 text-sm leading-relaxed italic">&ldquo;{t.text}&rdquo;</p>
                  <div className="flex items-center gap-3 pt-2 border-t border-white/5">
                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-600 to-violet-500 flex items-center justify-center font-bold text-white text-xs">
                      {t.name.split(" ").map(w => w[0]).join("")}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-white">{t.name}</p>
                      <p className="text-xs text-zinc-500">{t.role}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ═══════════════ FAQ ═══════════════ */}
      <section id="faq" className="py-24 px-4 md:px-8 max-w-3xl mx-auto border-t border-white/5 z-10">
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

      {/* ═══════════════ CTA ═══════════════ */}
      <section className="py-24 px-4 md:px-8 max-w-4xl mx-auto text-center z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="p-12 rounded-3xl border border-indigo-500/20 bg-gradient-to-br from-indigo-600/[0.08] via-violet-600/[0.05] to-cyan-600/[0.03] backdrop-blur-sm relative overflow-hidden"
        >
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[500px] h-[200px] bg-indigo-500/[0.12] blur-[100px] rounded-full pointer-events-none" />
          <div className="absolute bottom-0 right-1/4 w-[200px] h-[150px] bg-violet-500/[0.08] blur-[80px] rounded-full pointer-events-none" />
          <div className="relative space-y-6">
            <div className="flex items-center justify-center gap-2 mb-2">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-violet-500 to-cyan-500 flex items-center justify-center shadow-xl shadow-indigo-500/20">
                <Sparkles className="h-5 w-5 text-white animate-pulse" />
              </div>
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-white">
              Ready to automate with AI?
            </h2>
            <p className="text-zinc-400 text-lg max-w-xl mx-auto">
              Join thousands of users deploying intelligent agents. Start free — no credit card required.
            </p>
            <div className="flex flex-wrap gap-4 justify-center">
              <Button size="lg" className="bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-500/20 gap-2 font-semibold h-12 px-10 btn-premium" asChild>
                <Link href="/register">
                  Get Started Free <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" className="border-white/10 hover:bg-white/5 text-zinc-300 h-12 px-8" asChild>
                <Link href="/login">Sign In</Link>
              </Button>
            </div>
          </div>
        </motion.div>
      </section>

      {/* ═══════════════ FOOTER ═══════════════ */}
      <footer className="border-t border-white/5 bg-zinc-950/60 py-16 px-4 md:px-8 text-zinc-500 text-sm z-10">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-10 mb-12">
            <div className="col-span-2 md:col-span-1 space-y-4">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-indigo-600 via-violet-500 to-cyan-500 flex items-center justify-center font-bold text-white text-xs">
                  N
                </div>
                <span className="font-bold text-white">Nexora</span>
              </div>
              <p className="text-xs text-zinc-500 leading-relaxed">
                Intelligence, Automated. The premium AI agent platform for real-world automation.
              </p>
            </div>

            <div className="space-y-3">
              <h4 className="font-semibold text-white text-sm">Product</h4>
              <div className="space-y-2 text-xs">
                <a href="#agents" className="block hover:text-white transition-colors">AI Agents</a>
                <a href="#features" className="block hover:text-white transition-colors">Features</a>
                <a href="#pricing" className="block hover:text-white transition-colors">Pricing</a>
                <a href="#faq" className="block hover:text-white transition-colors">FAQ</a>
              </div>
            </div>

            <div className="space-y-3">
              <h4 className="font-semibold text-white text-sm">Agents</h4>
              <div className="space-y-2 text-xs">
                <Link href="/login" className="block hover:text-white transition-colors">Travel Booking</Link>
                <Link href="/login" className="block hover:text-white transition-colors">Stock Analysis</Link>
                <Link href="/login" className="block hover:text-white transition-colors">Career Agent</Link>
                <Link href="/login" className="block hover:text-white transition-colors">Productivity</Link>
              </div>
            </div>

            <div className="space-y-3">
              <h4 className="font-semibold text-white text-sm">Legal</h4>
              <div className="space-y-2 text-xs">
                <a href="#" className="block hover:text-white transition-colors">Privacy Policy</a>
                <a href="#" className="block hover:text-white transition-colors">Terms of Service</a>
                <a href="#" className="block hover:text-white transition-colors">Cookie Policy</a>
              </div>
            </div>
          </div>

          <div className="border-t border-white/5 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="text-xs text-zinc-500">
              © {new Date().getFullYear()} Nexora AI. All rights reserved.
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
