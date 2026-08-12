"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles,
  Loader2,
  ArrowRight,
  ArrowLeft,
  Eye,
  EyeOff,
  CheckCircle2,
  Bot,
  TrendingUp,
  Plane,
  Shield,
  Zap,
  User,
  Rocket,
  Code,
  BarChart3,
  FlaskConical,
  Check,
  Building2,
  Lock,
  Star,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import api from "@/lib/api";

// ─── Password Strength ─────────────────────────────────────────
interface PasswordStrength {
  score: number;
  label: string;
  color: string;
  checks: { label: string; met: boolean }[];
}

function getPasswordStrength(password: string): PasswordStrength {
  const checks = [
    { label: "8+ characters", met: password.length >= 8 },
    { label: "Uppercase letter", met: /[A-Z]/.test(password) },
    { label: "Lowercase letter", met: /[a-z]/.test(password) },
    { label: "Number", met: /\d/.test(password) },
    { label: "Special character", met: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password) },
  ];
  const score = checks.filter((c) => c.met).length;
  const levels: Record<number, { label: string; color: string }> = {
    0: { label: "Very weak", color: "bg-rose-500" },
    1: { label: "Weak", color: "bg-rose-500" },
    2: { label: "Fair", color: "bg-amber-500" },
    3: { label: "Good", color: "bg-yellow-400" },
    4: { label: "Strong", color: "bg-emerald-500" },
    5: { label: "Very strong", color: "bg-emerald-400" },
  };
  return { score, ...levels[score], checks };
}

// ─── Personas & Roles Options ──────────────────────────────────
const PERSONAS = [
  {
    id: "founder",
    title: "Startup Founder",
    subtitle: "Pitch decks, market research & automated operations",
    icon: Rocket,
    gradient: "from-amber-500/20 to-orange-500/10 border-amber-500/30 text-amber-400",
  },
  {
    id: "engineer",
    title: "Software & AI Engineer",
    subtitle: "Code generation, API automations & agent dev",
    icon: Code,
    gradient: "from-cyan-500/20 to-blue-500/10 border-cyan-500/30 text-cyan-400",
  },
  {
    id: "analyst",
    title: "Financial Analyst",
    subtitle: "Stock intelligence, sentiment analysis & live signals",
    icon: BarChart3,
    gradient: "from-emerald-500/20 to-teal-500/10 border-emerald-500/30 text-emerald-400",
  },
  {
    id: "traveler",
    title: "Smart Traveler",
    subtitle: "Multi-modal flights, trains, buses & itineraries",
    icon: Plane,
    gradient: "from-violet-500/20 to-purple-500/10 border-violet-500/30 text-violet-400",
  },
  {
    id: "researcher",
    title: "AI Researcher",
    subtitle: "Deep paper summaries, citation graphs & analysis",
    icon: FlaskConical,
    gradient: "from-pink-500/20 to-rose-500/10 border-pink-500/30 text-pink-400",
  },
];

// ─── Agent Focus Options ───────────────────────────────────────
const AGENT_FOCUS_OPTIONS = [
  { id: "business", label: "Business Automator & Co-founder", icon: Building2 },
  { id: "travel", label: "Travel & Multi-Modal Booking Hub", icon: Plane },
  { id: "stocks", label: "Stock Intelligence & Financial AI", icon: BarChart3 },
  { id: "career", label: "Career Accelerator & Resume AI", icon: User },
  { id: "research", label: "Research Scientist & Doc Agent", icon: FlaskConical },
];

// ─── Showcase Tabs (Left Branding Panel) ────────────────────────
const SHOWCASE_TABS = [
  {
    id: "agents",
    title: "9+ AI Agents",
    subtitle: "Autonomous domain experts ready to assist",
    items: [
      { name: "Travel Planner", status: "Active", metric: "< 1.2s response" },
      { name: "Stock Intelligence", status: "Real-Time", metric: "Live BSE/NSE" },
      { name: "Startup Co-Founder", status: "Pro", metric: "Pitch & Financials" },
      { name: "Sales Automator", status: "Active", metric: "CRM & WhatsApp" },
    ],
  },
  {
    id: "security",
    title: "Zero-Trust Security",
    subtitle: "Enterprise-grade protection by default",
    items: [
      { name: "JWT Auth", status: "Encrypted", metric: "AES-256" },
      { name: "Isolated Sandboxes", status: "Protected", metric: "Docker Containers" },
      { name: "Role Permissions", status: "Enforced", metric: "RBAC Enabled" },
      { name: "Data Privacy", status: "Compliant", metric: "100% Private" },
    ],
  },
  {
    id: "performance",
    title: "Ultra-Fast Intelligence",
    subtitle: "Multi-llm routing powered by Gemini & GPT-4",
    items: [
      { name: "Gemini 1.5 Flash", status: "Active", metric: "~180ms latency" },
      { name: "GPT-4o Vision", status: "Active", metric: "Multi-Modal" },
      { name: "DeepSeek Reasoner", status: "Active", metric: "Complex Math" },
      { name: "Fallback Router", status: "Auto", metric: "99.9% Uptime" },
    ],
  },
];

// ─── Testimonials ──────────────────────────────────────────────
const TESTIMONIALS = [
  {
    quote: "Nexora replaced 4 different SaaS tools for our startup team. Setting up took under 30 seconds!",
    name: "Priya Sharma",
    role: "Founder @ NexTech Labs",
    avatar: "PS",
  },
  {
    quote: "The autonomous stock intelligence and travel booking agents feel like having an expert assistant 24/7.",
    name: "Marcus Vance",
    role: "Lead Software Architect",
    avatar: "MV",
  },
  {
    quote: "Creating an account and picking our preferred agent stack was completely frictionless. Stunning UI!",
    name: "Elena Rostova",
    role: "Head of AI Operations",
    avatar: "ER",
  },
];

export default function RegisterPage() {
  const router = useRouter();

  // Multi-step state (1: Essentials & Persona, 2: Security & Focus, 3: Workspace Launch)
  const [step, setStep] = React.useState<1 | 2 | 3>(1);

  // Form State
  const [name, setName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [selectedPersona, setSelectedPersona] = React.useState("founder");
  const [selectedAgentFocus, setSelectedAgentFocus] = React.useState<string[]>(["business", "stocks"]);
  const [showPassword, setShowPassword] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState("");

  // Provisioning Animation State (Step 3)
  const [provisionProgress, setProvisionProgress] = React.useState(0);
  const [provisionPhase, setProvisionPhase] = React.useState(0);

  // Left Panel Tabs & Testimonials
  const [activeTab, setActiveTab] = React.useState("agents");
  const [testimonialIdx, setTestimonialIdx] = React.useState(0);

  const strength = getPasswordStrength(password);

  // Auto rotate testimonials
  React.useEffect(() => {
    const timer = setInterval(() => {
      setTestimonialIdx((prev) => (prev + 1) % TESTIMONIALS.length);
    }, 6000);
    return () => clearInterval(timer);
  }, []);

  const toggleAgentFocus = (id: string) => {
    setSelectedAgentFocus((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const handleStep1Next = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    const cleanName = name.trim();
    const cleanEmail = email.trim().toLowerCase();

    if (!cleanName || !cleanEmail) {
      setError("Please provide your full name and a valid email address.");
      return;
    }
    if (!cleanEmail.includes("@") || !cleanEmail.includes(".")) {
      setError("Please enter a valid email address.");
      return;
    }
    setStep(2);
  };

  const handleFinalRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (strength.score < 5) {
      const missing = strength.checks.filter((c) => !c.met).map((c) => c.label).join(", ");
      setError(`Password does not meet security standards. Missing: ${missing}`);
      return;
    }

    setIsLoading(true);
    try {
      const cleanName = name.trim();
      const cleanEmail = email.trim().toLowerCase();

      const { data } = await api.post("/auth/register", { name: cleanName, email: cleanEmail, password });
      
      if (typeof window !== "undefined") {
        localStorage.setItem("nexora_logged_in", "true");
        localStorage.setItem("nexora_user_persona", selectedPersona);
        localStorage.setItem("nexora_agent_focus", JSON.stringify(selectedAgentFocus));
        if (data?.token) {
          localStorage.setItem("nexora_auth_token", data.token);
        }
      }

      // Proceed to Launch Animation Step
      setStep(3);
      runProvisioningAnimation();
    } catch (err: unknown) {
      const apiErr = err as { message?: string; response?: { data?: { error?: string; message?: string } } };
      if (apiErr.message === "Network Error" || !apiErr.response) {
        setError("Network Error: Cannot connect to Nexora API server (Port 5000).");
      } else {
        setError(apiErr.response?.data?.error || apiErr.response?.data?.message || "Registration failed. Please try again.");
      }
      setIsLoading(false);
    }
  };

  const runProvisioningAnimation = () => {
    let progress = 0;
    const interval = setInterval(() => {
      progress += 4;
      setProvisionProgress(progress);

      if (progress > 30 && progress <= 60) {
        setProvisionPhase(1);
      } else if (progress > 60 && progress <= 90) {
        setProvisionPhase(2);
      } else if (progress > 90) {
        setProvisionPhase(3);
      }

      if (progress >= 100) {
        clearInterval(interval);
        setTimeout(() => {
          router.push("/dashboard");
        }, 800);
      }
    }, 50);
  };

  const handleOAuthLogin = async (provider: "google" | "github") => {
    setIsLoading(true);
    setError("");
    try {
      const mockOAuthPayload = {
        google: {
          providerId: "google-1093284092184",
          email: "alex.google@nexora.ai",
          name: "Alex Google User",
          avatar: "https://ui-avatars.com/api/?name=Alex+Google+User&background=4285F4&color=fff",
        },
        github: {
          providerId: "github-84029384",
          email: "alex.github@nexora.ai",
          name: "Alex GitHub User",
          avatar: "https://ui-avatars.com/api/?name=Alex+GitHub+User&background=24292e&color=fff",
        },
      };
      const { data } = await api.post(`/auth/${provider}`, mockOAuthPayload[provider]);
      if (typeof window !== "undefined") {
        localStorage.setItem("nexora_logged_in", "true");
        localStorage.setItem("nexora_user_persona", selectedPersona);
        if (data?.token) {
          localStorage.setItem("nexora_auth_token", data.token);
        }
      }
      setStep(3);
      runProvisioningAnimation();
    } catch (err: unknown) {
      const apiErr = err as { response?: { data?: { error?: string } } };
      setError(apiErr.response?.data?.error || `Failed to sign in with ${provider}.`);
      setIsLoading(false);
    }
  };

  const currentTab = SHOWCASE_TABS.find((t) => t.id === activeTab) || SHOWCASE_TABS[0];
  const currentTestimonial = TESTIMONIALS[testimonialIdx];

  return (
    <div className="min-h-screen bg-[#05050f] text-foreground flex relative overflow-hidden font-sans selection:bg-indigo-500/30 selection:text-white">
      {/* ── Ambient Background Lighting ── */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-32 -left-32 w-[600px] h-[600px] rounded-full bg-indigo-600/15 blur-[140px] animate-pulse" />
        <div className="absolute top-1/2 -right-48 w-[650px] h-[650px] rounded-full bg-violet-600/12 blur-[160px]" />
        <div className="absolute -bottom-32 left-1/3 w-[500px] h-[500px] rounded-full bg-cyan-600/10 blur-[130px]" />
        <div className="absolute inset-0 bg-[radial-gradient(#rgba(255,255,255,0.03)_1px,transparent_1px)] [background-size:24px_24px] opacity-40" />
      </div>

      {/* ── Left Branding & Interactive Feature Panel (desktop only) ── */}
      <div className="hidden lg:flex flex-col justify-between w-[520px] shrink-0 relative z-10 p-10 border-r border-white/[0.08] bg-white/[0.01] backdrop-blur-2xl">
        <div className="space-y-8">
          {/* Logo Branding */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
            className="flex items-center gap-3"
          >
            <div className="relative">
              <div className="absolute inset-0 bg-indigo-500/40 rounded-xl blur-lg scale-150" />
              <div className="relative w-11 h-11 rounded-xl bg-gradient-to-br from-indigo-500 via-violet-500 to-cyan-500 flex items-center justify-center shadow-xl shadow-indigo-600/30 border border-white/20">
                <Sparkles className="h-6 w-6 text-white" />
              </div>
            </div>
            <div>
              <span className="font-extrabold text-2xl tracking-tight text-white">Nexora</span>
              <span className="ml-2 text-[10px] font-semibold text-indigo-400 uppercase tracking-widest bg-indigo-500/10 px-2 py-0.5 rounded-full border border-indigo-500/20">
                AI Platform
              </span>
            </div>
          </motion.div>

          {/* Main Headline */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="space-y-3"
          >
            <h2 className="text-4xl font-black text-white tracking-tight leading-tight">
              Craft your next-gen <br />
              <span className="bg-gradient-to-r from-indigo-400 via-violet-400 to-cyan-400 bg-clip-text text-transparent">
                AI Command Center
              </span>
            </h2>
            <p className="text-zinc-400 text-sm leading-relaxed max-w-sm">
              Deploy autonomous AI agents in seconds. From market intelligence to travel booking and code generation.
            </p>
          </motion.div>

          {/* Interactive Feature Showcase Tabs */}
          <div className="space-y-4">
            <div className="flex gap-1.5 p-1 rounded-xl bg-white/[0.03] border border-white/[0.06]">
              {SHOWCASE_TABS.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex-1 py-2 px-3 text-xs font-semibold rounded-lg transition-all ${
                    activeTab === tab.id
                      ? "bg-indigo-600/30 text-white border border-indigo-500/40 shadow-lg shadow-indigo-600/20"
                      : "text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.04]"
                  }`}
                >
                  {tab.title}
                </button>
              ))}
            </div>

            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.25 }}
                className="p-5 rounded-2xl bg-white/[0.03] border border-white/[0.08] shadow-2xl space-y-4 backdrop-blur-md"
              >
                <div>
                  <h4 className="text-sm font-bold text-white">{currentTab.title}</h4>
                  <p className="text-xs text-zinc-400">{currentTab.subtitle}</p>
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  {currentTab.items.map((item) => (
                    <div
                      key={item.name}
                      className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.05] flex flex-col justify-between space-y-1 hover:border-indigo-500/30 transition-all"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-zinc-200 truncate">{item.name}</span>
                        <span className="text-[9px] font-bold text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded-full border border-emerald-500/20">
                          {item.status}
                        </span>
                      </div>
                      <span className="text-[10px] text-zinc-500 font-mono">{item.metric}</span>
                    </div>
                  ))}
                </div>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>

        {/* Dynamic Testimonials */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="p-4 rounded-xl bg-white/[0.03] border border-white/[0.06] relative overflow-hidden"
        >
          <div className="flex items-center gap-1 mb-2 text-amber-400">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star key={i} className="h-3 w-3 fill-amber-400" />
            ))}
          </div>
          <p className="text-zinc-300 text-xs italic leading-relaxed mb-3">
            &ldquo;{currentTestimonial.quote}&rdquo;
          </p>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-500 to-violet-500 flex items-center justify-center font-bold text-xs text-white shadow-md">
              {currentTestimonial.avatar}
            </div>
            <div>
              <p className="text-xs font-semibold text-white">{currentTestimonial.name}</p>
              <p className="text-[10px] text-zinc-400">{currentTestimonial.role}</p>
            </div>
          </div>
        </motion.div>
      </div>

      {/* ── Right Form & Interactive Wizard Panel ── */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 md:p-10 relative z-10 overflow-y-auto">
        {/* Mobile Header Logo */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="flex lg:hidden items-center gap-2.5 mb-6"
        >
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-500 via-violet-500 to-cyan-500 flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <Sparkles className="h-5 w-5 text-white" />
          </div>
          <span className="font-extrabold text-xl text-white">Nexora</span>
        </motion.div>

        {/* Wizard Main Container Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-xl"
        >
          <div className="glass-glow-card rounded-3xl overflow-hidden p-6 md:p-8 space-y-6 border border-white/10 bg-zinc-950/70 backdrop-blur-xl shadow-2xl relative">
            
            {/* Step Wizard Progress Bar */}
            {step !== 3 && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-semibold">
                  <span className="text-indigo-400 flex items-center gap-1.5">
                    <span className="w-5 h-5 rounded-full bg-indigo-600/30 border border-indigo-500 flex items-center justify-center text-[10px] text-indigo-300 font-bold">
                      {step}
                    </span>
                    {step === 1 ? "Step 1: Identity & Persona" : "Step 2: Security & Primary Focus"}
                  </span>
                  <span className="text-zinc-500">Step {step} of 2</span>
                </div>
                <div className="w-full h-1.5 rounded-full bg-white/[0.08] overflow-hidden flex">
                  <motion.div
                    className="h-full bg-gradient-to-r from-indigo-500 via-violet-500 to-cyan-400 rounded-full"
                    initial={{ width: "0%" }}
                    animate={{ width: step === 1 ? "50%" : "100%" }}
                    transition={{ duration: 0.4 }}
                  />
                </div>
              </div>
            )}

            {/* Error Alert Banner */}
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/25 text-xs text-rose-300 flex items-center gap-2.5"
              >
                <span className="w-2 h-2 rounded-full bg-rose-500 shrink-0 animate-ping" />
                <span>{error}</span>
              </motion.div>
            )}

            {/* ═══════════ STEP 1: Personal Info & Persona Selection ═══════════ */}
            {step === 1 && (
              <motion.form
                key="step1"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                onSubmit={handleStep1Next}
                className="space-y-6"
              >
                <div>
                  <h1 className="text-2xl font-black text-white tracking-tight">Create Your Account</h1>
                  <p className="text-xs text-zinc-400 mt-1">Start deploying your customized AI agents in minutes.</p>
                </div>

                {/* Form Fields */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="name" className="text-zinc-300 text-xs font-semibold">Full Name</Label>
                    <Input
                      id="name"
                      type="text"
                      placeholder="e.g. Alex Forge"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="bg-white/[0.04] border-white/10 text-white placeholder-zinc-600 focus:border-indigo-500/60 focus:bg-white/[0.08] input-focus-glow transition-all rounded-xl text-xs h-11"
                      required
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="email" className="text-zinc-300 text-xs font-semibold">Email Address</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="alex@forge.ai"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="bg-white/[0.04] border-white/10 text-white placeholder-zinc-600 focus:border-indigo-500/60 focus:bg-white/[0.08] input-focus-glow transition-all rounded-xl text-xs h-11"
                      required
                    />
                  </div>
                </div>

                {/* Persona Selector */}
                <div className="space-y-3">
                  <Label className="text-zinc-300 text-xs font-semibold flex items-center justify-between">
                    <span>Select Your Primary Role</span>
                    <span className="text-[10px] text-zinc-500">Personalizes AI workspace</span>
                  </Label>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {PERSONAS.map((persona) => {
                      const Icon = persona.icon;
                      const isSelected = selectedPersona === persona.id;
                      return (
                        <button
                          type="button"
                          key={persona.id}
                          onClick={() => setSelectedPersona(persona.id)}
                          className={`p-3 rounded-2xl border text-left transition-all relative overflow-hidden flex items-start gap-3 ${
                            isSelected
                              ? `bg-indigo-600/15 border-indigo-500/60 shadow-lg shadow-indigo-600/15 ring-1 ring-indigo-500/50`
                              : "bg-white/[0.02] border-white/[0.07] hover:bg-white/[0.05] hover:border-white/20"
                          }`}
                        >
                          <div className={`p-2 rounded-xl bg-white/[0.05] border border-white/10 shrink-0 ${isSelected ? "text-indigo-400 bg-indigo-500/20" : "text-zinc-400"}`}>
                            <Icon className="h-4 w-4" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-bold text-white truncate">{persona.title}</p>
                            <p className="text-[10px] text-zinc-400 leading-tight mt-0.5 line-clamp-2">{persona.subtitle}</p>
                          </div>
                          {isSelected && (
                            <CheckCircle2 className="h-4 w-4 text-indigo-400 shrink-0 absolute top-2.5 right-2.5" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Submit Step 1 */}
                <div className="space-y-4 pt-2">
                  <Button
                    type="submit"
                    className="w-full h-11 bg-gradient-to-r from-indigo-600 via-violet-600 to-indigo-600 hover:from-indigo-500 hover:to-violet-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-indigo-600/25 gap-2 transition-all btn-premium"
                  >
                    Continue to Security & Setup <ArrowRight className="h-4 w-4" />
                  </Button>

                  {/* Divider */}
                  <div className="relative flex items-center py-1">
                    <div className="flex-1 border-t border-white/10" />
                    <span className="px-3 text-[10px] text-zinc-500 uppercase tracking-wider font-semibold">Or register instantly with</span>
                    <div className="flex-1 border-t border-white/10" />
                  </div>

                  {/* OAuth Buttons */}
                  <div className="grid grid-cols-2 gap-3">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => handleOAuthLogin("google")}
                      disabled={isLoading}
                      className="bg-white/[0.03] border-white/10 text-zinc-200 hover:text-white hover:bg-white/[0.08] hover:border-white/20 font-semibold text-xs h-10 gap-2 transition-all rounded-xl"
                    >
                      <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24">
                        <path fill="#EA4335" d="M12 5.04c1.66 0 3.2.57 4.38 1.69l3.27-3.27C17.67 1.48 15.01.5 12 .5 7.37.5 3.42 3.16 1.5 7.03l3.87 3c.92-2.75 3.51-4.99 6.63-4.99z" />
                        <path fill="#4285F4" d="M23.49 12.27c0-.81-.07-1.59-.2-2.34H12v4.43h6.43c-.28 1.47-1.11 2.71-2.36 3.55l3.66 2.84c2.14-1.97 3.39-4.88 3.39-8.48z" />
                        <path fill="#FBBC05" d="M5.37 14.51c-.24-.72-.37-1.49-.37-2.29s.13-1.57.37-2.29L1.5 6.93C.54 8.87 0 11.06 0 13.38s.54 4.51 1.5 6.45l3.87-3.32z" />
                        <path fill="#34A853" d="M12 23.5c3.24 0 5.97-1.08 7.96-2.91l-3.66-2.84c-1.01.68-2.31 1.09-3.96 1.09-3.12 0-5.71-2.24-6.63-4.99L1.5 17.17c1.92 3.87 5.87 6.33 10.5 6.33z" />
                      </svg>
                      Google
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => handleOAuthLogin("github")}
                      disabled={isLoading}
                      className="bg-white/[0.03] border-white/10 text-zinc-200 hover:text-white hover:bg-white/[0.08] hover:border-white/20 font-semibold text-xs h-10 gap-2 transition-all rounded-xl"
                    >
                      <svg className="h-4 w-4 shrink-0" fill="currentColor" viewBox="0 0 24 24">
                        <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482C19.138 20.193 22 16.44 22 12.017 22 6.484 17.522 2 12 2z" />
                      </svg>
                      GitHub
                    </Button>
                  </div>
                </div>
              </motion.form>
            )}

            {/* ═══════════ STEP 2: Password Security & Primary Focus ═══════════ */}
            {step === 2 && (
              <motion.form
                key="step2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                onSubmit={handleFinalRegister}
                className="space-y-6"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h1 className="text-2xl font-black text-white tracking-tight">Security & AI Focus</h1>
                    <p className="text-xs text-zinc-400 mt-1">Set a strong password and choose your starter agents.</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="p-2 rounded-xl bg-white/[0.04] border border-white/10 hover:bg-white/[0.08] text-zinc-300 hover:text-white transition-all flex items-center gap-1 text-xs"
                  >
                    <ArrowLeft className="h-3.5 w-3.5" /> Back
                  </button>
                </div>

                {/* Password Input */}
                <div className="space-y-2">
                  <Label htmlFor="password" className="text-zinc-300 text-xs font-semibold flex items-center gap-1.5">
                    <Lock className="h-3.5 w-3.5 text-indigo-400" /> Account Password
                  </Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Enter a strong password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="bg-white/[0.04] border-white/10 text-white placeholder-zinc-600 focus:border-indigo-500/60 focus:bg-white/[0.08] input-focus-glow transition-all rounded-xl text-xs h-11 pr-10"
                      disabled={isLoading}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-200 transition-colors"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>

                  {/* Password Strength Score Bar */}
                  {password.length > 0 && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      className="space-y-2.5 pt-1.5"
                    >
                      <div className="flex gap-1.5">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <div
                            key={i}
                            className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${
                              i < strength.score ? strength.color : "bg-zinc-800"
                            }`}
                          />
                        ))}
                      </div>
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-zinc-400">Security Score:</span>
                        <span className={`font-bold ${strength.score >= 4 ? "text-emerald-400" : strength.score >= 2 ? "text-yellow-400" : "text-rose-400"}`}>
                          {strength.label}
                        </span>
                      </div>

                      {/* Requirement badges */}
                      <div className="grid grid-cols-2 gap-2 p-3 rounded-xl bg-white/[0.02] border border-white/[0.06]">
                        {strength.checks.map((check) => (
                          <div key={check.label} className="flex items-center gap-1.5">
                            <div className={`w-3.5 h-3.5 rounded-full flex items-center justify-center ${check.met ? "bg-emerald-500/20 text-emerald-400" : "bg-zinc-800 text-zinc-600"}`}>
                              <Check className="h-2.5 w-2.5" />
                            </div>
                            <span className={`text-[10px] ${check.met ? "text-zinc-200 font-semibold" : "text-zinc-500"}`}>{check.label}</span>
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </div>

                {/* Primary AI Agent Focus */}
                <div className="space-y-3">
                  <Label className="text-zinc-300 text-xs font-semibold flex items-center justify-between">
                    <span>Pre-enable AI Agents</span>
                    <span className="text-[10px] text-zinc-500">Multi-select enabled</span>
                  </Label>

                  <div className="space-y-2">
                    {AGENT_FOCUS_OPTIONS.map((agent) => {
                      const Icon = agent.icon;
                      const isChecked = selectedAgentFocus.includes(agent.id);
                      return (
                        <button
                          type="button"
                          key={agent.id}
                          onClick={() => toggleAgentFocus(agent.id)}
                          className={`w-full p-2.5 rounded-xl border text-left transition-all flex items-center justify-between ${
                            isChecked
                              ? "bg-indigo-600/15 border-indigo-500/40 text-white shadow-sm"
                              : "bg-white/[0.02] border-white/[0.06] text-zinc-400 hover:bg-white/[0.04] hover:text-zinc-200"
                          }`}
                        >
                          <div className="flex items-center gap-2.5">
                            <div className={`p-1.5 rounded-lg ${isChecked ? "bg-indigo-500/20 text-indigo-400" : "bg-white/[0.05] text-zinc-500"}`}>
                              <Icon className="h-3.5 w-3.5" />
                            </div>
                            <span className="text-xs font-semibold">{agent.label}</span>
                          </div>
                          <div className={`w-4 h-4 rounded-md border flex items-center justify-center transition-all ${isChecked ? "bg-indigo-600 border-indigo-500 text-white" : "border-white/20 bg-transparent"}`}>
                            {isChecked && <Check className="h-3 w-3" />}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Final Submit Button */}
                <Button
                  type="submit"
                  disabled={isLoading}
                  className="w-full h-11 bg-gradient-to-r from-indigo-600 via-violet-600 to-indigo-600 hover:from-indigo-500 hover:to-violet-500 text-white font-bold text-xs rounded-xl shadow-xl shadow-indigo-600/30 gap-2 transition-all btn-premium"
                >
                  {isLoading ? (
                    <><Loader2 className="h-4 w-4 animate-spin" /> Provisioning Account...</>
                  ) : (
                    <>Launch AI Command Center <Rocket className="h-4 w-4" /></>
                  )}
                </Button>
              </motion.form>
            )}

            {/* ═══════════ STEP 3: Animated Provisioning Screen ═══════════ */}
            {step === 3 && (
              <motion.div
                key="step3"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="py-8 text-center space-y-6"
              >
                <div className="relative w-20 h-20 mx-auto">
                  <div className="absolute inset-0 bg-indigo-500/30 rounded-full blur-xl animate-ping" />
                  <div className="relative w-20 h-20 rounded-full bg-gradient-to-tr from-indigo-500 via-violet-500 to-cyan-500 p-1 shadow-2xl flex items-center justify-center">
                    <div className="w-full h-full rounded-full bg-zinc-950 flex items-center justify-center">
                      <Sparkles className="h-8 w-8 text-indigo-400 animate-bounce" />
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <h2 className="text-2xl font-black text-white">Initializing Your AI Workspace</h2>
                  <p className="text-xs text-zinc-400 max-w-sm mx-auto">
                    Setting up dedicated agent sandboxes and personalized dashboard...
                  </p>
                </div>

                {/* Progress Bar & Status Text */}
                <div className="space-y-3 max-w-md mx-auto">
                  <div className="w-full h-2 rounded-full bg-white/[0.08] overflow-hidden p-0.5 border border-white/10">
                    <motion.div
                      className="h-full bg-gradient-to-r from-indigo-500 via-violet-500 to-cyan-400 rounded-full"
                      style={{ width: `${provisionProgress}%` }}
                    />
                  </div>

                  <div className="space-y-2 text-left pt-2">
                    <div className={`flex items-center gap-2 text-xs transition-opacity ${provisionPhase >= 0 ? "opacity-100" : "opacity-30"}`}>
                      <CheckCircle2 className={`h-4 w-4 ${provisionPhase >= 1 ? "text-emerald-400" : "text-indigo-400 animate-spin"}`} />
                      <span className="text-zinc-200">Encrypting account credentials & JWT tokens...</span>
                    </div>
                    <div className={`flex items-center gap-2 text-xs transition-opacity ${provisionPhase >= 1 ? "opacity-100" : "opacity-30"}`}>
                      <CheckCircle2 className={`h-4 w-4 ${provisionPhase >= 2 ? "text-emerald-400" : provisionPhase === 1 ? "text-indigo-400 animate-spin" : "text-zinc-600"}`} />
                      <span className="text-zinc-200">Provisioning selected AI agent containers...</span>
                    </div>
                    <div className={`flex items-center gap-2 text-xs transition-opacity ${provisionPhase >= 2 ? "opacity-100" : "opacity-30"}`}>
                      <CheckCircle2 className={`h-4 w-4 ${provisionPhase >= 3 ? "text-emerald-400" : provisionPhase === 2 ? "text-indigo-400 animate-spin" : "text-zinc-600"}`} />
                      <span className="text-zinc-200">Launching personalized command center...</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Footer Sign-In Redirect */}
            {step !== 3 && (
              <div className="pt-2 text-center border-t border-white/[0.06]">
                <p className="text-xs text-zinc-400">
                  Already have a Nexora account?{" "}
                  <Link href="/login" className="text-indigo-400 hover:text-indigo-300 font-bold underline underline-offset-4 transition-colors">
                    Sign in here
                  </Link>
                </p>
              </div>
            )}
          </div>

          {/* Legal terms footer */}
          <p className="text-center text-[10px] text-zinc-500 mt-4">
            By creating an account, you agree to our{" "}
            <span className="text-zinc-400 hover:text-zinc-300 cursor-pointer underline">Terms of Service</span>{" "}
            and{" "}
            <span className="text-zinc-400 hover:text-zinc-300 cursor-pointer underline">Privacy Policy</span>.
          </p>
        </motion.div>
      </div>

      {/* Brand Badge */}
      <div className="fixed bottom-4 right-4 z-50">
        <span className="text-[11px] font-semibold text-zinc-400 bg-zinc-950/80 backdrop-blur-md border border-white/10 rounded-full px-3 py-1.5 shadow-xl">
          Kumar Productions
        </span>
      </div>
    </div>
  );
}
