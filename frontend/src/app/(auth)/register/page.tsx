"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles, Loader2, ArrowRight, ArrowLeft, Eye, EyeOff, Check, X,
  Lock, User, Rocket, Code, BarChart3, Plane, FlaskConical, Building2,
  Shield, Zap, Star, CheckCircle2, Mail, Bot, TrendingUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import api from "@/lib/api";

// ─── Password Strength ─────────────────────────────────────────────
function getPasswordStrength(password: string) {
  const checks = [
    { label: "8+ characters", met: password.length >= 8 },
    { label: "Uppercase", met: /[A-Z]/.test(password) },
    { label: "Lowercase", met: /[a-z]/.test(password) },
    { label: "Number", met: /\d/.test(password) },
    { label: "Special char", met: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password) },
  ];
  const score = checks.filter((c) => c.met).length;
  const levels: Record<number, { label: string; color: string }> = {
    0: { label: "Very weak", color: "bg-rose-500" },
    1: { label: "Weak", color: "bg-rose-400" },
    2: { label: "Fair", color: "bg-amber-500" },
    3: { label: "Good", color: "bg-yellow-400" },
    4: { label: "Strong", color: "bg-emerald-500" },
    5: { label: "Very strong", color: "bg-emerald-400" },
  };
  return { score, ...levels[score], checks };
}

// ─── Personas ──────────────────────────────────────────────────────
const PERSONAS = [
  { id: "founder",    title: "Startup Founder",       icon: Rocket,      color: "text-amber-400",   bg: "bg-amber-500/10",   border: "border-amber-500/30",   ring: "ring-amber-500/40" },
  { id: "engineer",  title: "Software Engineer",       icon: Code,        color: "text-cyan-400",    bg: "bg-cyan-500/10",    border: "border-cyan-500/30",    ring: "ring-cyan-500/40" },
  { id: "analyst",   title: "Financial Analyst",       icon: BarChart3,   color: "text-emerald-400", bg: "bg-emerald-500/10", border: "border-emerald-500/30", ring: "ring-emerald-500/40" },
  { id: "traveler",  title: "Smart Traveler",          icon: Plane,       color: "text-violet-400",  bg: "bg-violet-500/10",  border: "border-violet-500/30",  ring: "ring-violet-500/40" },
  { id: "researcher",title: "AI Researcher",           icon: FlaskConical,color: "text-pink-400",    bg: "bg-pink-500/10",    border: "border-pink-500/30",    ring: "ring-pink-500/40" },
  { id: "business",  title: "Business Operator",       icon: Building2,   color: "text-orange-400",  bg: "bg-orange-500/10",  border: "border-orange-500/30",  ring: "ring-orange-500/40" },
];

const AGENT_FOCUS = [
  { id: "business", label: "Business Automator & Co-founder", icon: Building2, description: "Pitch, strategy, automation" },
  { id: "travel",   label: "Travel & Multi-Modal Booking",    icon: Plane,     description: "Flights, trains, itineraries" },
  { id: "stocks",   label: "Stock Intelligence & Finance AI", icon: TrendingUp, description: "Live BSE/NSE signals" },
  { id: "career",   label: "Career Accelerator & Resume AI",  icon: User,      description: "CV, job search, interviews" },
  { id: "research", label: "Research Scientist & Doc Agent",  icon: FlaskConical, description: "Papers, citations, analysis" },
];

// ─── Ambient Background ────────────────────────────────────────────
function AmbientBg() {
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden" aria-hidden>
      <div className="absolute -top-32 -left-32 w-[500px] h-[500px] rounded-full bg-indigo-700/20 blur-[120px]" style={{ animation: "float-slow 9s ease-in-out infinite" }} />
      <div className="absolute top-1/2 -right-40 w-[500px] h-[500px] rounded-full bg-violet-700/14 blur-[130px]" style={{ animation: "float-reverse 11s ease-in-out infinite" }} />
      <div className="absolute -bottom-40 left-1/4 w-[400px] h-[400px] rounded-full bg-cyan-700/10 blur-[110px]" style={{ animation: "float-slow 13s ease-in-out infinite reverse" }} />
      <div className="absolute inset-0 opacity-[0.016]" style={{ backgroundImage: "radial-gradient(circle, rgba(255,255,255,0.8) 1px, transparent 1px)", backgroundSize: "32px 32px" }} />
    </div>
  );
}

// ─── Step progress strip ──────────────────────────────────────────
function StepBar({ current, total }: { current: number; total: number }) {
  return (
    <div className="flex gap-1.5">
      {Array.from({ length: total }).map((_, i) => (
        <div
          key={i}
          className={`h-1 flex-1 rounded-full transition-all duration-500 ${i < current ? "bg-indigo-500" : i === current - 1 ? "bg-indigo-500" : "bg-white/10"}`}
        />
      ))}
    </div>
  );
}

// ─── Main Register Page ────────────────────────────────────────────
export default function RegisterPage() {
  const router = useRouter();

  const [step, setStep] = React.useState<1 | 2 | 3>(1);
  const [name, setName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [showPassword, setShowPassword] = React.useState(false);
  const [selectedPersona, setSelectedPersona] = React.useState("founder");
  const [selectedAgents, setSelectedAgents] = React.useState<string[]>(["business", "stocks"]);
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState("");
  const [provisionProgress, setProvisionProgress] = React.useState(0);
  const [provisionPhase, setProvisionPhase] = React.useState(0);

  // Google OAuth
  const [showGoogleModal, setShowGoogleModal] = React.useState(false);
  const [customGoogleEmail, setCustomGoogleEmail] = React.useState("");

  const strength = React.useMemo(() => getPasswordStrength(password), [password]);

  const toggleAgent = (id: string) =>
    setSelectedAgents((prev) => prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]);

  // ─── OAuth ─────────────────────────────────────────────────────
  const handleOAuth = (provider: "google" | "github") => {
    setError("");
    if (provider === "google") setShowGoogleModal(true);
    else handleGoogleAuth("github.user@github.com", "GitHub Developer", "github");
  };

  const handleGoogleAuth = async (targetEmail: string, targetName?: string, providerType: "google" | "github" = "google") => {
    if (!targetEmail?.trim()) return;
    setIsLoading(true); setError(""); setShowGoogleModal(false);
    const cleanEmail = targetEmail.trim().toLowerCase();
    const displayName = targetName || cleanEmail.split("@")[0].replace(/\./g, " ").replace(/\b\w/g, (l) => l.toUpperCase());
    const providerId = `${providerType}_${cleanEmail}`;
    const avatar = `https://api.dicebear.com/7.x/avataaars/svg?seed=${cleanEmail}`;
    try {
      const endpoint = providerType === "google" ? "/auth/google" : "/auth/github";
      const { data } = await api.post(endpoint, { providerId, email: cleanEmail, name: displayName, avatar });
      if (typeof window !== "undefined") {
        localStorage.setItem("nexora_logged_in", "true");
        if (data?.token) localStorage.setItem("nexora_auth_token", data.token);
      }
      router.push("/dashboard");
    } catch (err: any) {
      setError(err.response?.data?.error || "Authentication failed. Please try again.");
    } finally { setIsLoading(false); }
  };

  // ─── Step 1 validate ───────────────────────────────────────────
  const handleStep1 = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    const cleanName = name.trim();
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanName) { setError("Please enter your full name."); return; }
    if (!cleanEmail || !cleanEmail.includes("@") || !cleanEmail.includes(".")) {
      setError("Please enter a valid email address."); return;
    }
    setStep(2);
  };

  // ─── Step 2 register ──────────────────────────────────────────
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (password.length < 6) {
      setError("Password must be at least 6 characters long.");
      return;
    }
    setIsLoading(true);
    try {
      const { data } = await api.post("/auth/register", {
        name: name.trim(),
        email: email.trim().toLowerCase(),
        password,
      });
      if (typeof window !== "undefined") {
        localStorage.setItem("nexora_logged_in", "true");
        localStorage.setItem("nexora_user_persona", selectedPersona);
        localStorage.setItem("nexora_agent_focus", JSON.stringify(selectedAgents));
        if (data?.token) localStorage.setItem("nexora_auth_token", data.token);
      }
      setStep(3);
      runProvisioning();
    } catch (err: any) {
      const apiErr = err as { message?: string; response?: { data?: { error?: string; message?: string } } };
      if (apiErr.message === "Network Error" || !apiErr.response) {
        setError("Cannot reach Nexora API server. Please try again shortly.");
      } else {
        setError(apiErr.response?.data?.error || apiErr.response?.data?.message || "Registration failed. Please try again.");
      }
      setIsLoading(false);
    }
  };

  const runProvisioning = () => {
    let progress = 0;
    const iv = setInterval(() => {
      progress += 3;
      setProvisionProgress(progress);
      if (progress > 33 && progress <= 66) setProvisionPhase(1);
      else if (progress > 66 && progress <= 90) setProvisionPhase(2);
      else if (progress > 90) setProvisionPhase(3);
      if (progress >= 100) {
        clearInterval(iv);
        setTimeout(() => router.push("/dashboard"), 700);
      }
    }, 40);
  };

  const PROVISION_PHASES = [
    { label: "Creating your workspace...", icon: "✨" },
    { label: "Configuring AI agents...", icon: "🤖" },
    { label: "Securing your account...", icon: "🔐" },
    { label: "Launching Nexora!", icon: "🚀" },
  ];

  // ─── Render ─────────────────────────────────────────────────────
  return (
    <div className="min-h-screen w-full bg-[#050510] text-white flex relative overflow-hidden selection:bg-indigo-500/30">
      <AmbientBg />

      {/* ── LEFT — Feature Showcase (desktop only) ── */}
      <div className="hidden lg:flex flex-col justify-between w-[440px] xl:w-[500px] shrink-0 relative z-10 p-10 border-r border-white/[0.06]">
        {/* Logo */}
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="absolute inset-0 bg-indigo-500/40 rounded-2xl blur-xl scale-150" />
            <div className="relative w-11 h-11 rounded-2xl bg-gradient-to-br from-indigo-500 via-violet-500 to-cyan-500 flex items-center justify-center shadow-xl border border-white/20">
              <Sparkles className="h-5 w-5 text-white" />
            </div>
          </div>
          <div>
            <span className="font-extrabold text-xl text-white tracking-tight">Nexora</span>
            <p className="text-[10px] text-zinc-500 mt-0.5">The AI-Powered Workspace</p>
          </div>
        </div>

        {/* Hero */}
        <div className="space-y-6">
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs font-semibold">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Free to get started · No credit card
            </div>
            <h1 className="text-4xl font-black leading-tight">
              Build your
              <br />
              <span className="bg-gradient-to-r from-indigo-400 via-violet-400 to-cyan-400 bg-clip-text text-transparent">AI agent stack</span>
              <br />
              in 30 seconds.
            </h1>
            <p className="text-zinc-400 text-sm leading-relaxed">
              Choose your persona, select the agents you need, and your personalized AI workspace is ready instantly.
            </p>
          </div>

          {/* Agent preview cards */}
          <div className="space-y-2.5">
            {[
              { icon: "📈", name: "Stock Intelligence", status: "Live BSE/NSE", color: "from-emerald-500/10 to-teal-500/5 border-emerald-500/15" },
              { icon: "✈️", name: "Travel Booking Hub",  status: "Multi-modal",  color: "from-violet-500/10 to-purple-500/5 border-violet-500/15" },
              { icon: "🚀", name: "Startup Co-Founder",  status: "Pitch AI",     color: "from-amber-500/10 to-orange-500/5 border-amber-500/15" },
              { icon: "💬", name: "WhatsApp Sales Bot",  status: "Auto-Reply",   color: "from-cyan-500/10 to-blue-500/5 border-cyan-500/15" },
            ].map((agent, i) => (
              <motion.div
                key={agent.name}
                initial={{ opacity: 0, x: -16 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 + i * 0.07 }}
                className={`flex items-center justify-between p-3 rounded-xl border bg-gradient-to-r ${agent.color}`}
              >
                <div className="flex items-center gap-3">
                  <span className="text-lg leading-none">{agent.icon}</span>
                  <span className="text-sm font-semibold text-zinc-200">{agent.name}</span>
                </div>
                <span className="text-[10px] text-zinc-400 bg-white/[0.05] px-2 py-0.5 rounded-full border border-white/[0.06]">
                  {agent.status}
                </span>
              </motion.div>
            ))}
          </div>

          {/* Testimonial */}
          <div className="p-4 rounded-2xl bg-white/[0.025] border border-white/[0.06]">
            <div className="flex items-center gap-1 mb-2 text-amber-400">
              {[...Array(5)].map((_, i) => <Star key={i} className="h-3 w-3 fill-current" />)}
            </div>
            <p className="text-zinc-300 text-xs italic leading-relaxed">
              &ldquo;Nexora replaced 4 different SaaS tools for our team. Setup was instant.&rdquo;
            </p>
            <div className="flex items-center gap-2 mt-3">
              <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-indigo-500 to-violet-500 flex items-center justify-center font-bold text-xs text-white">PS</div>
              <div>
                <p className="text-xs font-semibold text-white">Priya Sharma</p>
                <p className="text-[10px] text-zinc-500">Founder @ NexTech Labs</p>
              </div>
            </div>
          </div>
        </div>

        {/* Trust marks */}
        <div className="flex flex-wrap gap-3 text-[10px] text-zinc-600">
          <span className="flex items-center gap-1"><Shield className="h-3 w-3 text-emerald-600" /> JWT Auth</span>
          <span className="flex items-center gap-1"><Zap className="h-3 w-3 text-amber-500" /> &lt; 1.5s response</span>
          <span className="flex items-center gap-1"><Bot className="h-3 w-3 text-indigo-500" /> 11 AI Agents</span>
        </div>
      </div>

      {/* ── RIGHT — Multi-step Registration ── */}
      <div className="flex-1 flex flex-col items-center justify-center p-5 sm:p-8 relative z-10 overflow-y-auto">
        {/* Mobile logo */}
        <div className="flex lg:hidden items-center gap-2.5 mb-8">
          <div className="w-9 h-9 rounded-2xl bg-gradient-to-br from-indigo-500 via-violet-500 to-cyan-500 flex items-center justify-center shadow-lg shadow-indigo-500/25">
            <Sparkles className="h-5 w-5 text-white" />
          </div>
          <span className="font-extrabold text-xl text-white">Nexora</span>
        </div>

        <div className="w-full max-w-[460px] bg-[#0b0c1b]/95 border border-white/20 rounded-3xl p-6 sm:p-8 shadow-2xl shadow-indigo-950/50 backdrop-blur-2xl">
          <AnimatePresence mode="wait">
            {/* ───────────── STEP 1 — Identity ───────────── */}
            {step === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, y: 20, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -16, scale: 0.97 }}
                transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                className="space-y-6"
              >
                <div className="space-y-1.5">
                  <StepBar current={1} total={2} />
                  <div className="flex items-center justify-between pt-1">
                    <h2 className="text-2xl font-black text-white tracking-tight">Create your account</h2>
                    <span className="text-xs text-zinc-300 font-semibold">Step 1 / 2</span>
                  </div>
                  <p className="text-sm font-medium text-zinc-200">Tell us who you are to personalise your workspace.</p>
                </div>

                {/* Error */}
                <AnimatePresence>
                  {error && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
                      className="flex items-start gap-3 p-3.5 rounded-xl bg-rose-500/20 border border-rose-500/40 text-rose-200 text-sm font-medium shadow-md">
                      <X className="h-4 w-4 mt-0.5 shrink-0 text-rose-400" /><span>{error}</span>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* OAuth buttons */}
                <div className="grid grid-cols-2 gap-3">
                  <button onClick={() => handleOAuth("google")} disabled={isLoading}
                    className="flex items-center justify-center gap-2.5 h-11 rounded-xl border border-white/20 bg-zinc-900/90 hover:bg-white/[0.08] text-white text-sm font-semibold transition-all hover:border-white/40">
                    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none">
                      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                    </svg>
                    Google
                  </button>
                  <button onClick={() => handleOAuth("github")} disabled={isLoading}
                    className="flex items-center justify-center gap-2.5 h-11 rounded-xl border border-white/20 bg-zinc-900/90 hover:bg-white/[0.08] text-white text-sm font-semibold transition-all hover:border-white/40">
                    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
                    </svg>
                    GitHub
                  </button>
                </div>

                {/* Divider */}
                <div className="flex items-center gap-3">
                  <div className="flex-1 h-px bg-white/20" />
                  <span className="text-xs text-zinc-300 font-semibold">or sign up with email</span>
                  <div className="flex-1 h-px bg-white/20" />
                </div>

                {/* Form */}
                <form onSubmit={handleStep1} className="space-y-4">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold text-zinc-200 uppercase tracking-wider">Full Name</Label>
                    <div className="relative group">
                      <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-600 pointer-events-none" />
                      <Input
                        id="reg-name"
                        type="text"
                        placeholder="Your full name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        data-text-black="true"
                        className="pl-10 h-12 bg-white text-black placeholder:text-zinc-500 border-white/20 focus:border-indigo-500 focus:bg-white rounded-xl transition-all text-sm font-semibold shadow-sm"
                        style={{ color: '#000000', WebkitTextFillColor: '#000000', caretColor: '#000000' }}
                        required
                      />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold text-zinc-200 uppercase tracking-wider">Email Address</Label>
                    <div className="relative group">
                      <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-600 pointer-events-none" />
                      <Input
                        id="reg-email"
                        type="email"
                        placeholder="you@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        data-text-black="true"
                        className="pl-10 h-12 bg-white text-black placeholder:text-zinc-500 border-white/20 focus:border-indigo-500 focus:bg-white rounded-xl transition-all text-sm font-semibold shadow-sm"
                        style={{ color: '#000000', WebkitTextFillColor: '#000000', caretColor: '#000000' }}
                        required
                      />
                    </div>
                  </div>

                  {/* Persona selector */}
                  <div className="space-y-2">
                    <Label className="text-xs font-bold text-zinc-200 uppercase tracking-wider">I am a...</Label>
                    <div className="grid grid-cols-2 gap-2">
                      {PERSONAS.map((p) => {
                        const Icon = p.icon;
                        const isSelected = selectedPersona === p.id;
                        return (
                          <button
                            key={p.id}
                            type="button"
                            onClick={() => setSelectedPersona(p.id)}
                            className={`flex items-center gap-2.5 p-3 rounded-xl border text-left text-sm transition-all duration-200 ${
                              isSelected
                                ? `${p.bg} ${p.border} ring-1 ${p.ring} shadow-md`
                                : "bg-zinc-900/80 border-white/10 hover:bg-zinc-800/80 hover:border-white/20"
                            }`}
                          >
                            <div className={`p-1.5 rounded-lg ${isSelected ? p.bg : "bg-white/[0.06]"}`}>
                              <Icon className={`h-4 w-4 ${isSelected ? p.color : "text-zinc-300"}`} />
                            </div>
                            <span className={`font-semibold text-xs ${isSelected ? "text-white" : "text-zinc-200"}`}>{p.title}</span>
                            {isSelected && <Check className={`h-3.5 w-3.5 ml-auto shrink-0 ${p.color}`} />}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <Button id="reg-step1-next" type="submit"
                    className="w-full h-12 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-extrabold rounded-xl shadow-lg shadow-indigo-600/30 hover:shadow-indigo-600/50 transition-all text-sm">
                    Continue <ArrowRight className="h-4 w-4 ml-1" />
                  </Button>
                </form>

                <p className="text-center text-sm font-medium text-zinc-300">
                  Already have an account?{" "}
                  <Link href="/login" className="text-indigo-300 hover:text-white font-bold transition-colors underline decoration-indigo-500/40 underline-offset-4">Sign in →</Link>
                </p>
              </motion.div>
            )}

            {/* ───────────── STEP 2 — Security + Focus ───────────── */}
            {step === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 24, scale: 0.97 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                exit={{ opacity: 0, x: -24, scale: 0.97 }}
                transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                className="space-y-6"
              >
                <div className="space-y-1.5">
                  <StepBar current={2} total={2} />
                  <div className="flex items-center justify-between pt-1">
                    <div>
                      <h2 className="text-2xl font-black text-white tracking-tight">Security & focus</h2>
                      <p className="text-sm text-zinc-400 mt-0.5">Set your password & choose your agent focus areas.</p>
                    </div>
                    <button onClick={() => setStep(1)} className="text-zinc-500 hover:text-zinc-300 transition-colors p-2 rounded-xl hover:bg-white/[0.04]">
                      <ArrowLeft className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                {/* Error */}
                <AnimatePresence>
                  {error && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
                      className="flex items-start gap-3 p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-sm">
                      <X className="h-4 w-4 mt-0.5 shrink-0" /><span>{error}</span>
                    </motion.div>
                  )}
                </AnimatePresence>

                <form onSubmit={handleRegister} className="space-y-5">
                  {/* Password */}
                  <div className="space-y-2">
                    <Label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Create Password</Label>
                    <div className="relative group">
                      <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-600 pointer-events-none" />
                      <Input
                        id="reg-password"
                        type={showPassword ? "text" : "password"}
                        placeholder="Strong password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        data-text-black="true"
                        className="pl-10 pr-10 h-12 bg-white text-black placeholder:text-zinc-500 border-white/20 focus:border-indigo-500 focus:bg-white rounded-xl transition-all text-sm font-semibold shadow-sm"
                        style={{ color: '#000000', WebkitTextFillColor: '#000000', caretColor: '#000000' }}
                        required
                      />
                      <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-600 hover:text-black transition-colors">
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>

                    {password && (
                      <div className="space-y-2 mt-1">
                        {/* Strength bar */}
                        <div className="flex items-center gap-2">
                          <div className="flex gap-1 flex-1">
                            {Array.from({ length: 5 }).map((_, i) => (
                              <div key={i} className={`h-1 flex-1 rounded-full transition-all duration-300 ${i < strength.score ? strength.color : "bg-white/10"}`} />
                            ))}
                          </div>
                          <span className="text-[10px] font-semibold text-zinc-500 w-16 text-right">{strength.label}</span>
                        </div>
                        {/* Check pills */}
                        <div className="flex flex-wrap gap-1.5">
                          {strength.checks.map((c, i) => (
                            <span key={i} className={`text-[10px] px-2 py-0.5 rounded-full border flex items-center gap-1 transition-all ${c.met ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" : "bg-white/[0.02] border-white/[0.07] text-zinc-600"}`}>
                              {c.met ? <Check className="h-2.5 w-2.5" /> : <X className="h-2.5 w-2.5" />}
                              {c.label}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Agent focus */}
                  <div className="space-y-2">
                    <Label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                      AI Agent Focus Areas <span className="text-zinc-600 normal-case font-normal ml-1">(select any)</span>
                    </Label>
                    <div className="space-y-2">
                      {AGENT_FOCUS.map((agent) => {
                        const Icon = agent.icon;
                        const checked = selectedAgents.includes(agent.id);
                        return (
                          <button
                            key={agent.id}
                            type="button"
                            onClick={() => toggleAgent(agent.id)}
                            className={`w-full flex items-center gap-3 p-3 rounded-xl border text-left transition-all duration-200 ${
                              checked
                                ? "bg-indigo-600/10 border-indigo-500/30 ring-1 ring-indigo-500/25"
                                : "bg-white/[0.02] border-white/[0.07] hover:bg-white/[0.04] hover:border-white/15"
                            }`}
                          >
                            <div className={`p-1.5 rounded-lg shrink-0 ${checked ? "bg-indigo-500/20 text-indigo-400" : "bg-white/[0.05] text-zinc-500"}`}>
                              <Icon className="h-3.5 w-3.5" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className={`text-xs font-semibold truncate ${checked ? "text-white" : "text-zinc-400"}`}>{agent.label}</div>
                              <div className="text-[10px] text-zinc-600 mt-0.5">{agent.description}</div>
                            </div>
                            <div className={`w-4 h-4 rounded-md border flex items-center justify-center shrink-0 transition-all ${checked ? "bg-indigo-600 border-indigo-500" : "border-white/20"}`}>
                              {checked && <Check className="h-2.5 w-2.5 text-white" />}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Terms */}
                  <p className="text-[11px] text-zinc-600 text-center leading-relaxed">
                    By creating an account you agree to our{" "}
                    <span className="text-zinc-400 hover:text-zinc-300 cursor-pointer underline">Terms of Service</span>{" "}
                    and{" "}
                    <span className="text-zinc-400 hover:text-zinc-300 cursor-pointer underline">Privacy Policy</span>.
                  </p>

                  <Button id="reg-submit" type="submit" disabled={isLoading}
                    className="w-full h-12 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-bold rounded-xl shadow-lg shadow-indigo-600/25 hover:shadow-indigo-600/40 transition-all text-sm">
                    {isLoading
                      ? <span className="flex items-center gap-2"><Loader2 className="h-4 w-4 animate-spin" /> Creating your workspace...</span>
                      : <span className="flex items-center gap-2">Launch My Workspace <Sparkles className="h-4 w-4" /></span>
                    }
                  </Button>
                </form>
              </motion.div>
            )}

            {/* ───────────── STEP 3 — Provisioning ───────────── */}
            {step === 3 && (
              <motion.div
                key="step3"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                className="text-center space-y-8 py-6"
              >
                {/* Animated icon */}
                <div className="relative mx-auto w-24 h-24">
                  <div className="absolute inset-0 rounded-3xl bg-indigo-600/20 blur-xl scale-110 animate-pulse" />
                  <div className="relative w-24 h-24 rounded-3xl bg-gradient-to-br from-indigo-600 via-violet-600 to-cyan-600 flex items-center justify-center shadow-2xl shadow-indigo-600/30 border border-white/20">
                    <span className="text-4xl">{PROVISION_PHASES[provisionPhase]?.icon}</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <h2 className="text-2xl font-black text-white">
                    {provisionPhase < 3 ? "Setting up your workspace" : "You're all set!"}
                  </h2>
                  <AnimatePresence mode="wait">
                    <motion.p
                      key={provisionPhase}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      className="text-zinc-400 text-sm"
                    >
                      {PROVISION_PHASES[provisionPhase]?.label}
                    </motion.p>
                  </AnimatePresence>
                </div>

                {/* Progress bar */}
                <div className="space-y-2">
                  <div className="h-2 bg-white/[0.06] rounded-full overflow-hidden">
                    <motion.div
                      className="h-full bg-gradient-to-r from-indigo-600 via-violet-600 to-cyan-500 rounded-full"
                      style={{ width: `${provisionProgress}%` }}
                      transition={{ duration: 0.1 }}
                    />
                  </div>
                  <div className="flex justify-between text-xs text-zinc-600">
                    <span>Initializing...</span>
                    <span className="font-mono font-semibold text-indigo-400">{Math.round(provisionProgress)}%</span>
                  </div>
                </div>

                {/* Phase milestones */}
                <div className="grid grid-cols-4 gap-2">
                  {PROVISION_PHASES.map((phase, i) => (
                    <div key={i} className={`flex flex-col items-center gap-1.5 p-2.5 rounded-xl border transition-all ${i <= provisionPhase ? "bg-indigo-500/10 border-indigo-500/20" : "bg-white/[0.02] border-white/[0.06]"}`}>
                      <span className="text-lg">{phase.icon}</span>
                      <span className={`text-[9px] text-center leading-tight ${i <= provisionPhase ? "text-indigo-300" : "text-zinc-600"}`}>
                        {phase.label.replace("...", "").replace("!", "")}
                      </span>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* ── Google OAuth Modal ── */}
      <AnimatePresence>
        {showGoogleModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.94, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.94, y: 12 }}
              className="w-full max-w-sm rounded-3xl border border-white/10 bg-zinc-950 p-6 shadow-2xl space-y-5"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-white flex items-center justify-center">
                    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none">
                      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                    </svg>
                  </div>
                  <div>
                    <div className="text-sm font-bold text-white">Continue with Google</div>
                    <div className="text-xs text-zinc-500">Enter your Gmail address</div>
                  </div>
                </div>
                <button onClick={() => setShowGoogleModal(false)} className="text-zinc-600 hover:text-white transition-colors">
                  <X className="h-4 w-4" />
                </button>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-zinc-400 font-medium uppercase tracking-wider">Gmail Address</Label>
                <Input
                  type="email" placeholder="yourname@gmail.com" value={customGoogleEmail}
                  onChange={(e) => setCustomGoogleEmail(e.target.value)}
                  className="h-11 bg-white/[0.04] border-white/10 text-white placeholder:text-zinc-600 rounded-xl focus:border-indigo-500/60"
                  autoFocus
                  onKeyDown={(e) => { if (e.key === "Enter") handleGoogleAuth(customGoogleEmail); }}
                />
              </div>
              <div className="flex gap-2.5">
                <Button variant="outline" onClick={() => setShowGoogleModal(false)} className="flex-1 h-10 border-white/10 text-zinc-400 hover:text-white hover:bg-white/5 rounded-xl text-sm">Cancel</Button>
                <Button onClick={() => handleGoogleAuth(customGoogleEmail)} disabled={!customGoogleEmail.trim() || isLoading} className="flex-1 h-10 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-xl text-sm">
                  {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Continue"}
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
