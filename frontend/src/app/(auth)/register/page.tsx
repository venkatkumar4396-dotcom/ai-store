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
  Check,
  X,
  Lock,
  User,
  Rocket,
  Code,
  BarChart3,
  Plane,
  FlaskConical,
  Building2,
  ShieldCheck,
  Zap,
  CheckCircle2,
  Mail,
  Bot,
  TrendingUp,
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
    5: { label: "Very strong", color: "bg-emerald-500" },
  };
  return { score, ...levels[score], checks };
}

// ─── Personas ──────────────────────────────────────────────────────
const PERSONAS = [
  { id: "founder",    title: "Startup Founder",       icon: Rocket,      color: "text-amber-600",   bg: "bg-amber-50",   border: "border-amber-200" },
  { id: "engineer",  title: "Software Engineer",       icon: Code,        color: "text-cyan-600",    bg: "bg-cyan-50",    border: "border-cyan-200" },
  { id: "analyst",   title: "Financial Analyst",       icon: BarChart3,   color: "text-emerald-600", bg: "bg-emerald-50", border: "border-emerald-200" },
  { id: "traveler",  title: "Smart Traveler",          icon: Plane,       color: "text-violet-600",  bg: "bg-violet-50",  border: "border-violet-200" },
  { id: "researcher",title: "AI Researcher",           icon: FlaskConical,color: "text-pink-600",    bg: "bg-pink-50",    border: "border-pink-200" },
  { id: "business",  title: "Business Operator",       icon: Building2,   color: "text-orange-600",  bg: "bg-orange-50",  border: "border-orange-200" },
];

const AGENT_FOCUS = [
  { id: "business", label: "Business Automator", description: "Pitch, strategy, automation", icon: Building2 },
  { id: "travel",   label: "Travel & Booking",   description: "Flights, trains, itineraries", icon: Plane },
  { id: "stocks",   label: "Stock Intelligence", description: "Live indicators & signals", icon: TrendingUp },
  { id: "career",   label: "Career Accelerator", description: "CV & resume optimizer", icon: User },
];

function StepBar({ current, total }: { current: number; total: number }) {
  return (
    <div className="flex gap-1.5">
      {Array.from({ length: total }).map((_, i) => (
        <div
          key={i}
          className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${
            i < current ? "bg-indigo-600" : "bg-slate-200"
          }`}
        />
      ))}
    </div>
  );
}

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
    setSelectedAgents((prev) => (prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]));

  // OAuth
  const handleOAuth = (provider: "google" | "github") => {
    setError("");
    if (provider === "google") setShowGoogleModal(true);
    else handleGoogleAuth("github.user@github.com", "GitHub Developer", "github");
  };

  const handleGoogleAuth = async (targetEmail: string, targetName?: string, providerType: "google" | "github" = "google") => {
    if (!targetEmail?.trim()) return;
    setIsLoading(true);
    setError("");
    setShowGoogleModal(false);
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
    } finally {
      setIsLoading(false);
    }
  };

  // Step 1 validate
  const handleStep1 = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    const cleanName = name.trim();
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanName) {
      setError("Please enter your full name.");
      return;
    }
    if (!cleanEmail || !cleanEmail.includes("@") || !cleanEmail.includes(".")) {
      setError("Please enter a valid email address.");
      return;
    }
    setStep(2);
  };

  // Step 2 register
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
        setError("Cannot reach Nexora API server. Please check your connection.");
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

  return (
    <div className="min-h-screen w-full bg-slate-50 text-slate-900 flex items-center justify-center p-4 sm:p-6 lg:p-10 relative">
      <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
        
        {/* ── LEFT SHOWCASE PANEL (Desktop) ── */}
        <div className="hidden lg:flex lg:col-span-6 flex-col justify-between space-y-8 pr-2">
          {/* Logo */}
          <div className="space-y-4">
            <Link href="/" className="inline-flex items-center gap-3 group">
              <div className="w-11 h-11 rounded-xl bg-indigo-600 flex items-center justify-center shadow-md shadow-indigo-600/20">
                <Sparkles className="h-5 w-5 text-white" />
              </div>
              <div>
                <span className="font-bold text-2xl text-slate-900 tracking-tight">Nexora</span>
                <p className="text-xs text-slate-500">Autonomous AI Workspace</p>
              </div>
            </Link>

            <div className="space-y-3">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold">
                <div className="w-2 h-2 rounded-full bg-emerald-500" />
                Free tier included · No credit card required
              </div>
              <h1 className="text-3xl xl:text-4xl font-extrabold text-slate-900 leading-tight">
                Create your workspace in seconds.
              </h1>
              <p className="text-slate-600 text-sm xl:text-base leading-relaxed">
                Join thousands using Nexora for smart travel bookings, automated stock analysis, customer support, and document summarization.
              </p>
            </div>
          </div>

          {/* Quick list */}
          <div className="space-y-2.5">
            {[
              { title: "Stock Intelligence & Signals", desc: "Real-time indicators & analysis", icon: "📈" },
              { title: "Multi-Modal Travel Booker", desc: "Instant flight, train & hotel search", icon: "✈️" },
              { title: "WhatsApp 24/7 AI Chatbot", desc: "Automated leads & conversations", icon: "💬" },
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-white border border-slate-200 shadow-sm">
                <span className="text-xl leading-none">{item.icon}</span>
                <div>
                  <div className="text-xs font-bold text-slate-900">{item.title}</div>
                  <div className="text-[11px] text-slate-500">{item.desc}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Trust marks */}
          <div className="flex items-center gap-6 pt-2 border-t border-slate-200 text-xs font-medium text-slate-500">
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="h-4 w-4 text-emerald-600" />
              Secure Data Encryption
            </span>
            <span className="flex items-center gap-1.5">
              <Zap className="h-4 w-4 text-amber-600" />
              Fast 1-click Setup
            </span>
          </div>
        </div>

        {/* ── RIGHT AUTH CARD ── */}
        <div className="lg:col-span-6 flex justify-center w-full">
          <div className="w-full max-w-[440px] rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 shadow-xl shadow-slate-200/50 relative">
            
            {/* Mobile Header */}
            <div className="flex lg:hidden items-center justify-between mb-6 pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-sm">
                  <Sparkles className="h-4 w-4" />
                </div>
                <span className="font-bold text-lg text-slate-900">Nexora</span>
              </div>
              <Link href="/login" className="text-xs text-indigo-600 font-semibold">
                Sign In →
              </Link>
            </div>

            <AnimatePresence mode="wait">
              {/* ───────────── STEP 1 — Basic Info ───────────── */}
              {step === 1 && (
                <motion.div
                  key="step1"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                  transition={{ duration: 0.2 }}
                  className="space-y-5"
                >
                  <div className="space-y-2">
                    <StepBar current={1} total={2} />
                    <div className="flex items-center justify-between pt-1">
                      <h2 className="text-2xl font-bold text-slate-900">Create Account</h2>
                      <span className="text-xs text-slate-500 font-semibold">Step 1 of 2</span>
                    </div>
                    <p className="text-xs text-slate-500">Enter your details to get started.</p>
                  </div>

                  {/* Error Notification */}
                  <AnimatePresence>
                    {error && (
                      <motion.div
                        initial={{ opacity: 0, y: -4 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -4 }}
                        className="flex items-start gap-2.5 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium"
                      >
                        <X className="h-4 w-4 mt-0.5 shrink-0 text-rose-600" />
                        <span>{error}</span>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* OAuth Buttons */}
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => handleOAuth("google")}
                      disabled={isLoading}
                      className="flex items-center justify-center gap-2 h-10 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold transition-all shadow-xs"
                    >
                      <svg className="h-4 w-4" viewBox="0 0 24 24">
                        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                      </svg>
                      Google
                    </button>

                    <button
                      type="button"
                      onClick={() => handleOAuth("github")}
                      disabled={isLoading}
                      className="flex items-center justify-center gap-2 h-10 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold transition-all shadow-xs"
                    >
                      <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
                      </svg>
                      GitHub
                    </button>
                  </div>

                  {/* Divider */}
                  <div className="flex items-center gap-3">
                    <div className="flex-1 h-px bg-slate-200" />
                    <span className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider">or sign up with email</span>
                    <div className="flex-1 h-px bg-slate-200" />
                  </div>

                  {/* Form */}
                  <form onSubmit={handleStep1} className="space-y-4">
                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold text-slate-700 uppercase tracking-wider">Full Name</Label>
                      <div className="relative">
                        <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                        <Input
                          id="reg-name"
                          type="text"
                          placeholder="Jane Doe"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          className="pl-10 h-11 bg-white border-slate-300 text-slate-900 placeholder:text-slate-400 rounded-xl focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 text-sm font-medium"
                          required
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold text-slate-700 uppercase tracking-wider">Email Address</Label>
                      <div className="relative">
                        <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                        <Input
                          id="reg-email"
                          type="email"
                          placeholder="you@example.com"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className="pl-10 h-11 bg-white border-slate-300 text-slate-900 placeholder:text-slate-400 rounded-xl focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 text-sm font-medium"
                          required
                        />
                      </div>
                    </div>

                    {/* Persona selector */}
                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold text-slate-700 uppercase tracking-wider">I am a...</Label>
                      <div className="grid grid-cols-2 gap-2">
                        {PERSONAS.map((p) => {
                          const Icon = p.icon;
                          const isSelected = selectedPersona === p.id;
                          return (
                            <button
                              key={p.id}
                              type="button"
                              onClick={() => setSelectedPersona(p.id)}
                              className={`flex items-center gap-2 p-2.5 rounded-xl border text-left text-xs font-semibold transition-all ${
                                isSelected
                                  ? "bg-indigo-50 border-indigo-600 text-indigo-900 shadow-xs"
                                  : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
                              }`}
                            >
                              <Icon className={`h-4 w-4 ${isSelected ? "text-indigo-600" : "text-slate-400"}`} />
                              <span className="truncate">{p.title}</span>
                              {isSelected && <Check className="h-3.5 w-3.5 ml-auto text-indigo-600 shrink-0" />}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <Button
                      id="reg-step1-next"
                      type="submit"
                      className="w-full h-11 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl shadow-sm text-sm"
                    >
                      Continue <ArrowRight className="h-4 w-4 ml-1" />
                    </Button>
                  </form>

                  <p className="text-center text-xs text-slate-500">
                    Already have an account?{" "}
                    <Link href="/login" className="text-indigo-600 hover:text-indigo-800 font-semibold underline underline-offset-4">
                      Sign in
                    </Link>
                  </p>
                </motion.div>
              )}

              {/* ───────────── STEP 2 — Password & Options ───────────── */}
              {step === 2 && (
                <motion.div
                  key="step2"
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  transition={{ duration: 0.2 }}
                  className="space-y-5"
                >
                  <div className="space-y-2">
                    <StepBar current={2} total={2} />
                    <div className="flex items-center justify-between pt-1">
                      <div>
                        <h2 className="text-2xl font-bold text-slate-900">Set Password</h2>
                        <p className="text-xs text-slate-500 mt-0.5">Choose a secure password to protect your account.</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setStep(1)}
                        className="text-slate-400 hover:text-slate-700 p-1 rounded-lg"
                      >
                        <ArrowLeft className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  {/* Error Notification */}
                  <AnimatePresence>
                    {error && (
                      <motion.div
                        initial={{ opacity: 0, y: -4 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -4 }}
                        className="flex items-start gap-2.5 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium"
                      >
                        <X className="h-4 w-4 mt-0.5 shrink-0 text-rose-600" />
                        <span>{error}</span>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <form onSubmit={handleRegister} className="space-y-4">
                    {/* Password */}
                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold text-slate-700 uppercase tracking-wider">Password</Label>
                      <div className="relative">
                        <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                        <Input
                          id="reg-password"
                          type={showPassword ? "text" : "password"}
                          placeholder="At least 6 characters"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          className="pl-10 pr-10 h-11 bg-white border-slate-300 text-slate-900 placeholder:text-slate-400 rounded-xl focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 text-sm font-medium"
                          required
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"
                        >
                          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>

                      {password && (
                        <div className="space-y-1.5 pt-1">
                          <div className="flex gap-1">
                            {Array.from({ length: 5 }).map((_, i) => (
                              <div
                                key={i}
                                className={`h-1.5 flex-1 rounded-full transition-all ${
                                  i < strength.score ? strength.color : "bg-slate-200"
                                }`}
                              />
                            ))}
                          </div>
                          <div className="text-[11px] text-slate-500 font-medium">
                            Strength: <span className="font-semibold text-slate-800">{strength.label}</span>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Agent Focus */}
                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
                        Select AI Focus Areas
                      </Label>
                      <div className="space-y-1.5">
                        {AGENT_FOCUS.map((agent) => {
                          const Icon = agent.icon;
                          const checked = selectedAgents.includes(agent.id);
                          return (
                            <button
                              key={agent.id}
                              type="button"
                              onClick={() => toggleAgent(agent.id)}
                              className={`w-full flex items-center gap-2.5 p-2.5 rounded-xl border text-left text-xs transition-all ${
                                checked
                                  ? "bg-indigo-50 border-indigo-600 text-indigo-900"
                                  : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
                              }`}
                            >
                              <Icon className={`h-4 w-4 shrink-0 ${checked ? "text-indigo-600" : "text-slate-400"}`} />
                              <div className="flex-1 min-w-0">
                                <div className="font-semibold truncate">{agent.label}</div>
                                <div className="text-[11px] text-slate-500 truncate">{agent.description}</div>
                              </div>
                              <div
                                className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 ${
                                  checked ? "bg-indigo-600 border-indigo-600" : "border-slate-300"
                                }`}
                              >
                                {checked && <Check className="h-3 w-3 text-white" />}
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <Button
                      id="reg-submit"
                      type="submit"
                      disabled={isLoading}
                      className="w-full h-11 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl shadow-sm text-sm"
                    >
                      {isLoading ? (
                        <span className="flex items-center gap-2">
                          <Loader2 className="h-4 w-4 animate-spin" /> Creating account...
                        </span>
                      ) : (
                        <span className="flex items-center gap-2">
                          Create Account <Sparkles className="h-4 w-4" />
                        </span>
                      )}
                    </Button>
                  </form>
                </motion.div>
              )}

              {/* ───────────── STEP 3 — Provisioning ───────────── */}
              {step === 3 && (
                <motion.div
                  key="step3"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="text-center space-y-6 py-4"
                >
                  <div className="w-16 h-16 mx-auto rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center shadow-sm">
                    <span className="text-3xl">{PROVISION_PHASES[provisionPhase]?.icon}</span>
                  </div>

                  <div className="space-y-1">
                    <h2 className="text-xl font-bold text-slate-900">Setting up your workspace</h2>
                    <p className="text-xs text-slate-500">{PROVISION_PHASES[provisionPhase]?.label}</p>
                  </div>

                  <div className="space-y-2">
                    <div className="h-2 bg-slate-100 rounded-full overflow-hidden border border-slate-200">
                      <motion.div
                        className="h-full bg-indigo-600 rounded-full"
                        style={{ width: `${provisionProgress}%` }}
                        transition={{ duration: 0.1 }}
                      />
                    </div>
                    <div className="flex justify-between text-xs text-slate-500 font-medium">
                      <span>Initializing...</span>
                      <span>{Math.round(provisionProgress)}%</span>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Google OAuth Modal */}
      <AnimatePresence>
        {showGoogleModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              className="w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl space-y-4"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center">
                    <svg className="h-5 w-5" viewBox="0 0 24 24">
                      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                    </svg>
                  </div>
                  <div>
                    <div className="text-sm font-bold text-slate-900">Google Account</div>
                    <div className="text-xs text-slate-500">Enter your Gmail address</div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowGoogleModal(false)}
                  className="text-slate-400 hover:text-slate-700"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-slate-700 uppercase tracking-wider">Gmail Address</Label>
                <Input
                  type="email"
                  placeholder="yourname@gmail.com"
                  value={customGoogleEmail}
                  onChange={(e) => setCustomGoogleEmail(e.target.value)}
                  className="h-10 bg-white border-slate-300 text-slate-900 rounded-xl focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100"
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleGoogleAuth(customGoogleEmail);
                  }}
                />
              </div>

              <div className="flex gap-2.5 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowGoogleModal(false)}
                  className="flex-1 h-10 border-slate-300 text-slate-700 hover:bg-slate-50 rounded-xl text-xs font-semibold"
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  onClick={() => handleGoogleAuth(customGoogleEmail)}
                  disabled={!customGoogleEmail.trim() || isLoading}
                  className="flex-1 h-10 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl text-xs shadow-sm"
                >
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
