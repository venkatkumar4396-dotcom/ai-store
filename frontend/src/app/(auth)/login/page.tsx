"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles, Loader2, ArrowRight, Lock, ShieldCheck, KeyRound, CheckCircle2,
  AlertCircle, Zap, User, Briefcase, Terminal, Check, X, Eye, EyeOff, Mail,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import api from "@/lib/api";

// ─── Password Strength ───────────────────────────────────────────
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
    1: { label: "Weak", color: "bg-rose-400" },
    2: { label: "Fair", color: "bg-amber-500" },
    3: { label: "Good", color: "bg-yellow-400" },
    4: { label: "Strong", color: "bg-emerald-500" },
    5: { label: "Very strong", color: "bg-emerald-400" },
  };
  return { score, ...levels[score], checks };
}

// ─── OTP Input ────────────────────────────────────────────────────
function OtpInput({ value, onChange }: { value: string; onChange: (val: string) => void }) {
  const inputsRef = React.useRef<(HTMLInputElement | null)[]>([]);
  const handleChange = (index: number, digit: string) => {
    if (!/^\d?$/.test(digit)) return;
    const arr = value.split("");
    while (arr.length < 6) arr.push("");
    arr[index] = digit;
    const newVal = arr.join("").slice(0, 6);
    onChange(newVal);
    if (digit && index < 5) inputsRef.current[index + 1]?.focus();
  };
  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !value[index] && index > 0) {
      inputsRef.current[index - 1]?.focus();
    }
  };
  return (
    <div className="flex gap-2 justify-center">
      {Array.from({ length: 6 }).map((_, i) => (
        <input
          key={i}
          ref={(el) => { inputsRef.current[i] = el; }}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={value[i] || ""}
          onChange={(e) => handleChange(i, e.target.value)}
          onKeyDown={(e) => handleKeyDown(i, e)}
          className="w-11 h-12 text-center text-lg font-bold rounded-xl border border-white/10 bg-white/[0.04] text-white focus:outline-none focus:border-indigo-500/70 focus:bg-indigo-500/10 focus:shadow-[0_0_0_3px_rgba(99,102,241,0.2)] transition-all duration-200 caret-indigo-400"
        />
      ))}
    </div>
  );
}

// ─── User Type Definitions ────────────────────────────────────────
type UserTypeId = "user" | "business" | "developer";

const USER_TYPES = [
  {
    id: "user" as UserTypeId,
    title: "Individual",
    subtitle: "Personal AI",
    icon: User,
    gradient: "from-indigo-600 to-violet-600",
    activeBg: "bg-indigo-500/10 border-indigo-500/40",
    activeText: "text-indigo-300",
    dotColor: "bg-indigo-500",
    demoEmail: "user@nexora.ai",
    description: "Travel, stocks, career & document agents",
  },
  {
    id: "business" as UserTypeId,
    title: "Business",
    subtitle: "WhatsApp & CRM",
    icon: Briefcase,
    gradient: "from-emerald-600 to-teal-600",
    activeBg: "bg-emerald-500/10 border-emerald-500/40",
    activeText: "text-emerald-300",
    dotColor: "bg-emerald-500",
    demoEmail: "business@nexora.ai",
    description: "WhatsApp bots, sales & customer support",
  },
  {
    id: "developer" as UserTypeId,
    title: "Developer",
    subtitle: "API & Admin",
    icon: Terminal,
    gradient: "from-amber-600 to-orange-600",
    activeBg: "bg-amber-500/10 border-amber-500/40",
    activeText: "text-amber-300",
    dotColor: "bg-amber-500",
    demoEmail: "admin@nexora.ai",
    description: "LLM control, API keys & admin config",
  },
];

// ─── Floating animated background orbs ────────────────────────────
function AmbientBg() {
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden" aria-hidden>
      <div className="absolute -top-40 -left-40 w-[600px] h-[600px] rounded-full bg-indigo-700/20 blur-[120px] animate-pulse" style={{ animationDuration: "6s" }} />
      <div className="absolute top-1/2 -right-48 w-[550px] h-[550px] rounded-full bg-violet-700/15 blur-[130px]" style={{ animation: "float-slow 12s ease-in-out infinite" }} />
      <div className="absolute -bottom-32 left-1/3 w-[450px] h-[450px] rounded-full bg-cyan-700/10 blur-[110px]" style={{ animation: "float-reverse 10s ease-in-out infinite" }} />
      {/* Subtle dot grid */}
      <div
        className="absolute inset-0 opacity-[0.018]"
        style={{
          backgroundImage: `radial-gradient(circle, rgba(255,255,255,0.8) 1px, transparent 1px)`,
          backgroundSize: "32px 32px",
        }}
      />
    </div>
  );
}

// ─── Stats bar ─────────────────────────────────────────────────────
const STATS = [
  { label: "AI Agents", value: "11+" },
  { label: "Uptime", value: "99.9%" },
  { label: "Avg Response", value: "< 1.5s" },
];

// ─── Main Login Page ────────────────────────────────────────────────
export default function LoginPage() {
  const router = useRouter();

  const [userType, setUserType] = React.useState<UserTypeId>("user");
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [showPassword, setShowPassword] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState("");

  // Forgot password flow
  const [forgotMode, setForgotMode] = React.useState(false);
  const [forgotEmail, setForgotEmail] = React.useState("");
  const [otp, setOtp] = React.useState("");
  const [resetPermissionToken, setResetPermissionToken] = React.useState("");
  const [newPassword, setNewPassword] = React.useState("");
  const [showNewPassword, setShowNewPassword] = React.useState(false);
  const [step, setStep] = React.useState<1 | 2 | 3 | 4>(1);
  const [forgotError, setForgotError] = React.useState("");
  const [forgotSuccess, setForgotSuccess] = React.useState("");

  // Google OAuth
  const [showGoogleModal, setShowGoogleModal] = React.useState(false);
  const [customGoogleEmail, setCustomGoogleEmail] = React.useState("");

  const activeType = React.useMemo(() => USER_TYPES.find((t) => t.id === userType) || USER_TYPES[0], [userType]);
  const passwordStrength = React.useMemo(() => getPasswordStrength(newPassword), [newPassword]);

  // ─── Handlers ───────────────────────────────────────────────────
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !password) { setError("Please fill in all fields."); return; }
    setIsLoading(true);
    try {
      const { data } = await api.post("/auth/login", { email: cleanEmail, password, userType });
      if (typeof window !== "undefined") {
        localStorage.setItem("nexora_logged_in", "true");
        localStorage.setItem("nexora_user_type", userType);
        if (data?.token) localStorage.setItem("nexora_auth_token", data.token);
      }
      router.push("/dashboard");
    } catch (err: any) {
      if (err.message === "Network Error" || !err.response) {
        setError("Cannot reach Nexora API server. Please try again shortly.");
      } else {
        setError(err.response?.data?.error || "Invalid email or password.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleOAuthLogin = (provider: "google" | "github") => {
    setError("");
    if (provider === "google") { setShowGoogleModal(true); }
    else { handleGoogleAuthSubmit("github.user@github.com", "GitHub Developer", "github"); }
  };

  const handleGoogleAuthSubmit = async (targetEmail: string, targetName?: string, providerType: "google" | "github" = "google") => {
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
        localStorage.setItem("nexora_user_type", userType);
        if (data?.token) localStorage.setItem("nexora_auth_token", data.token);
      }
      router.push("/dashboard");
    } catch (err: any) {
      setError(err.response?.data?.error || "Authentication failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickFill = (typeId: UserTypeId) => {
    setUserType(typeId);
    if (typeId === "developer") {
      setEmail("kumar");
      setPassword("kumar@4396");
    } else {
      const t = USER_TYPES.find((x) => x.id === typeId);
      if (t) {
        setEmail(t.demoEmail);
        setPassword("Password123!");
      }
    }
  };

  const handleForgotSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setForgotError(""); setForgotSuccess("");
    const cleanEmail = forgotEmail.trim();
    if (!cleanEmail) { setForgotError("Email address is required."); return; }
    setIsLoading(true);
    try {
      const res = await api.post("/auth/forgot-password", { email: cleanEmail });
      setForgotSuccess(res.data.message);
      if (res.data.debugOtp) setOtp(res.data.debugOtp);
      setStep(2);
    } catch (err: any) {
      setForgotError(err.response?.data?.error || "Failed to send OTP. Please try again.");
    } finally { setIsLoading(false); }
  };

  const handleOtpVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setForgotError(""); setForgotSuccess("");
    if (otp.length !== 6) { setForgotError("Please enter the complete 6-digit OTP."); return; }
    setIsLoading(true);
    try {
      const res = await api.post("/auth/verify-otp", { email: forgotEmail.trim(), otp });
      setResetPermissionToken(res.data.resetPermissionToken);
      setForgotSuccess("OTP verified! Set your new password below.");
      setStep(3);
    } catch (err: any) {
      setForgotError(err.response?.data?.error || "Invalid OTP. Please try again.");
    } finally { setIsLoading(false); }
  };

  const handleResetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setForgotError(""); setForgotSuccess("");
    if (!newPassword) { setForgotError("New password is required."); return; }
    if (passwordStrength.score < 5) {
      setForgotError(`Password must meet all requirements. Missing: ${passwordStrength.checks.filter(c => !c.met).map(c => c.label).join(", ")}`);
      return;
    }
    setIsLoading(true);
    try {
      await api.post("/auth/reset-password", { email: forgotEmail.trim(), resetPermissionToken, password: newPassword });
      setForgotSuccess("Password reset successfully!");
      if (forgotEmail.trim()) setEmail(forgotEmail.trim());
      setStep(4);
    } catch (err: any) {
      setForgotError(err.response?.data?.error || "Reset failed. Please try again.");
    } finally { setIsLoading(false); }
  };

  const resetForgotState = () => {
    if (forgotEmail.trim()) setEmail(forgotEmail.trim());
    setForgotMode(false); setStep(1); setForgotEmail(""); setOtp("");
    setResetPermissionToken(""); setNewPassword(""); setForgotError(""); setForgotSuccess("");
  };

  // ─── Render ──────────────────────────────────────────────────────
  return (
    <div className="min-h-screen w-full bg-[#050510] text-white flex relative overflow-hidden selection:bg-indigo-500/30">
      <AmbientBg />

      {/* ── LEFT — Branding Panel (desktop) ── */}
      <div className="hidden lg:flex flex-col justify-between w-[420px] xl:w-[480px] shrink-0 relative z-10 p-10 border-r border-white/[0.06]">
        {/* Logo */}
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="absolute inset-0 bg-indigo-500/50 rounded-2xl blur-xl scale-150" />
            <div className="relative w-11 h-11 rounded-2xl bg-gradient-to-br from-indigo-500 via-violet-500 to-cyan-500 flex items-center justify-center shadow-xl shadow-indigo-600/30 border border-white/20">
              <Sparkles className="h-5 w-5 text-white" />
            </div>
          </div>
          <div>
            <span className="font-extrabold text-xl text-white tracking-tight">Nexora</span>
            <div className="flex items-center gap-1 mt-0.5">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-[10px] text-emerald-400 font-semibold uppercase tracking-widest">All systems operational</span>
            </div>
          </div>
        </div>

        {/* Hero copy */}
        <div className="space-y-8">
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-semibold">
              <Zap className="h-3 w-3" />
              Your AI-Powered Workspace
            </div>
            <h1 className="text-4xl xl:text-5xl font-black leading-tight">
              <span className="text-white">Intelligence,</span>
              <br />
              <span className="bg-gradient-to-r from-indigo-400 via-violet-400 to-cyan-400 bg-clip-text text-transparent">
                Automated.
              </span>
            </h1>
            <p className="text-zinc-400 text-base leading-relaxed">
              11 autonomous AI agents that handle travel, stocks, career growth, research, and business automation — so you don't have to.
            </p>
          </div>

          {/* Feature list */}
          <div className="space-y-3">
            {[
              { icon: "🚀", text: "Deploy AI agents in seconds" },
              { icon: "📊", text: "Live stock intelligence & signals" },
              { icon: "✈️", text: "Multi-modal travel & booking AI" },
              { icon: "💬", text: "WhatsApp bot automation suite" },
            ].map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 + i * 0.08 }}
                className="flex items-center gap-3"
              >
                <div className="w-8 h-8 rounded-xl bg-white/[0.04] border border-white/[0.07] flex items-center justify-center text-sm shrink-0">
                  {item.icon}
                </div>
                <span className="text-zinc-300 text-sm">{item.text}</span>
              </motion.div>
            ))}
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-3 pt-2">
            {STATS.map((stat) => (
              <div key={stat.label} className="p-3 rounded-2xl bg-white/[0.03] border border-white/[0.06] text-center">
                <div className="text-xl font-black text-white">{stat.value}</div>
                <div className="text-[10px] text-zinc-500 mt-0.5 font-medium">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer trust marks */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-zinc-500 text-xs">
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
            <span>Enterprise-grade security · JWT · AES-256</span>
          </div>
          <div className="flex -space-x-2">
            {["A","B","C","D"].map((l) => (
              <div key={l} className="w-7 h-7 rounded-full border-2 border-zinc-900 bg-gradient-to-br from-indigo-600 to-violet-600 flex items-center justify-center text-[9px] font-bold text-white">
                {l}
              </div>
            ))}
            <div className="w-7 h-7 rounded-full border-2 border-zinc-900 bg-zinc-800 flex items-center justify-center text-[9px] font-semibold text-zinc-300 ml-1">
              +2k
            </div>
          </div>
        </div>
      </div>

      {/* ── RIGHT — Form Panel ── */}
      <div className="flex-1 flex flex-col items-center justify-center p-5 sm:p-8 relative z-10 overflow-y-auto">
        {/* Mobile logo */}
        <div className="flex lg:hidden items-center gap-2.5 mb-8">
          <div className="w-9 h-9 rounded-2xl bg-gradient-to-br from-indigo-500 via-violet-500 to-cyan-500 flex items-center justify-center shadow-lg shadow-indigo-500/25">
            <Sparkles className="h-5 w-5 text-white" />
          </div>
          <span className="font-extrabold text-xl text-white">Nexora</span>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="w-full max-w-[440px] bg-[#0b0c1b]/95 border border-white/20 rounded-3xl p-6 sm:p-8 shadow-2xl shadow-indigo-950/50 backdrop-blur-2xl"
        >
          <AnimatePresence mode="wait">
            {forgotMode ? (
              /* ──── FORGOT PASSWORD FLOW ──── */
              <motion.div
                key="forgot"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
                className="space-y-5"
              >
                {/* Header */}
                <div className="space-y-1.5">
                  <button
                    onClick={resetForgotState}
                    className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors flex items-center gap-1.5 mb-3"
                  >
                    ← Back to sign in
                  </button>
                  <h2 className="text-2xl font-bold text-white">Reset password</h2>
                  <p className="text-sm text-zinc-400">
                    {step === 1 && "Enter your email to receive a one-time password."}
                    {step === 2 && "We sent a 6-digit code to your email."}
                    {step === 3 && "Create a strong new password."}
                    {step === 4 && "You're all set! Sign in with your new password."}
                  </p>
                </div>

                {/* Step progress */}
                <div className="flex items-center gap-1.5">
                  {[1, 2, 3, 4].map((s) => (
                    <div key={s} className={`h-1 flex-1 rounded-full transition-all duration-500 ${step >= s ? "bg-indigo-500" : "bg-white/10"}`} />
                  ))}
                </div>

                {/* Error / Success */}
                {(forgotError || forgotSuccess) && (
                  <motion.div
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`flex items-start gap-3 p-3.5 rounded-xl border text-sm ${forgotError ? "bg-rose-500/10 border-rose-500/20 text-rose-300" : "bg-emerald-500/10 border-emerald-500/20 text-emerald-300"}`}
                  >
                    {forgotError ? <X className="h-4 w-4 mt-0.5 shrink-0" /> : <Check className="h-4 w-4 mt-0.5 shrink-0" />}
                    <span>{forgotError || forgotSuccess}</span>
                  </motion.div>
                )}

                {/* Step 1 — email */}
                {step === 1 && (
                  <form onSubmit={handleForgotSubmit} className="space-y-4">
                    <div className="space-y-1.5">
                      <Label className="text-xs font-medium text-zinc-400 uppercase tracking-wider">Email Address</Label>
                      <div className="relative">
                        <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500 pointer-events-none" />
                        <Input
                          type="email"
                          placeholder="you@example.com"
                          value={forgotEmail}
                          onChange={(e) => setForgotEmail(e.target.value)}
                          className="pl-10 h-11 bg-white/[0.04] border-white/10 text-white placeholder:text-zinc-600 focus:border-indigo-500/60 focus:bg-indigo-500/5 rounded-xl transition-all"
                          required
                        />
                      </div>
                    </div>
                    <Button type="submit" disabled={isLoading} className="w-full h-11 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-xl transition-all">
                      {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <>Send OTP <ArrowRight className="h-4 w-4 ml-1" /></>}
                    </Button>
                  </form>
                )}

                {/* Step 2 — OTP */}
                {step === 2 && (
                  <form onSubmit={handleOtpVerify} className="space-y-5">
                    <OtpInput value={otp} onChange={setOtp} />
                    <Button type="submit" disabled={isLoading || otp.length !== 6} className="w-full h-11 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-xl">
                      {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <>Verify OTP <ShieldCheck className="h-4 w-4 ml-1" /></>}
                    </Button>
                  </form>
                )}

                {/* Step 3 — new password */}
                {step === 3 && (
                  <form onSubmit={handleResetSubmit} className="space-y-4">
                    <div className="space-y-1.5">
                      <Label className="text-xs font-medium text-zinc-400 uppercase tracking-wider">New Password</Label>
                      <div className="relative">
                        <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
                        <Input
                          type={showNewPassword ? "text" : "password"}
                          placeholder="Create a strong password"
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          className="pl-10 pr-10 h-11 bg-white/[0.04] border-white/10 text-white placeholder:text-zinc-600 focus:border-indigo-500/60 rounded-xl transition-all"
                        />
                        <button type="button" onClick={() => setShowNewPassword(!showNewPassword)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300">
                          {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                      {newPassword && (
                        <div className="space-y-1.5 mt-2">
                          <div className="flex gap-1">
                            {Array.from({ length: 5 }).map((_, i) => (
                              <div key={i} className={`h-1 flex-1 rounded-full transition-all ${i < passwordStrength.score ? passwordStrength.color : "bg-white/10"}`} />
                            ))}
                          </div>
                          <div className="flex flex-wrap gap-1.5">
                            {passwordStrength.checks.map((c, i) => (
                              <span key={i} className={`text-[10px] px-2 py-0.5 rounded-full border flex items-center gap-1 ${c.met ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" : "bg-white/[0.03] border-white/10 text-zinc-600"}`}>
                                {c.met ? <Check className="h-2.5 w-2.5" /> : <X className="h-2.5 w-2.5" />}
                                {c.label}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                    <Button type="submit" disabled={isLoading} className="w-full h-11 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-xl">
                      {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <>Reset Password <Lock className="h-4 w-4 ml-1" /></>}
                    </Button>
                  </form>
                )}

                {/* Step 4 — success */}
                {step === 4 && (
                  <div className="text-center space-y-4 py-4">
                    <div className="w-16 h-16 mx-auto rounded-2xl bg-emerald-500/15 border border-emerald-500/25 flex items-center justify-center">
                      <CheckCircle2 className="h-8 w-8 text-emerald-400" />
                    </div>
                    <p className="text-zinc-300 text-sm">Password updated successfully.</p>
                    <Button onClick={resetForgotState} className="w-full h-11 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-xl">
                      Sign In Now
                    </Button>
                  </div>
                )}
              </motion.div>
            ) : (
              /* ──── MAIN LOGIN FORM ──── */
              <motion.div
                key="login"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.3 }}
                className="space-y-6"
              >
                {/* Header */}
                <div className="space-y-1.5">
                  <h2 className="text-3xl font-black text-white tracking-tight drop-shadow-sm">Welcome back</h2>
                  <p className="text-sm font-medium text-zinc-200">Sign in to your Nexora workspace</p>
                </div>

                {/* User type selector */}
                <div className="grid grid-cols-3 gap-2 p-1.5 rounded-2xl bg-zinc-900/80 border border-white/10 shadow-inner">
                  {USER_TYPES.map((type) => {
                    const Icon = type.icon;
                    const isActive = userType === type.id;
                    return (
                      <button
                        key={type.id}
                        onClick={() => handleQuickFill(type.id)}
                        className={`flex flex-col items-center gap-1.5 py-3 px-2 rounded-xl text-center transition-all duration-200 border ${
                          isActive
                            ? `${type.activeBg} shadow-lg ring-1 ring-white/20`
                            : "border-transparent text-zinc-300 hover:text-white hover:bg-white/[0.06]"
                        }`}
                      >
                        <div className={`p-1.5 rounded-lg ${isActive ? `bg-gradient-to-br ${type.gradient} bg-opacity-30` : "bg-white/[0.08]"}`}>
                          <Icon className={`h-4 w-4 ${isActive ? type.activeText : "text-zinc-300"}`} />
                        </div>
                        <div>
                          <div className={`text-[11px] font-bold leading-none ${isActive ? "text-white" : "text-zinc-200"}`}>{type.title}</div>
                          <div className="text-[10px] text-zinc-400 mt-1 font-medium">{type.subtitle}</div>
                        </div>
                      </button>
                    );
                  })}
                </div>

                {/* Error */}
                <AnimatePresence>
                  {error && (
                    <motion.div
                      initial={{ opacity: 0, y: -8, height: 0 }}
                      animate={{ opacity: 1, y: 0, height: "auto" }}
                      exit={{ opacity: 0, y: -8, height: 0 }}
                      className="flex items-start gap-3 p-3.5 rounded-xl bg-rose-500/20 border border-rose-500/40 text-rose-200 text-sm font-medium shadow-md"
                    >
                      <AlertCircle className="h-4 w-4 mt-0.5 shrink-0 text-rose-400" />
                      <span>{error}</span>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Form */}
                <form onSubmit={handleLogin} className="space-y-4">
                  {/* Email */}
                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold text-zinc-200 uppercase tracking-wider">Email or Username</Label>
                    <div className="relative group">
                      <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400 transition-colors group-focus-within:text-indigo-400 pointer-events-none" />
                      <Input
                        id="login-email"
                        type="text"
                        placeholder="kumar or you@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="pl-10 h-12 bg-zinc-900/90 border-white/20 text-white placeholder:text-zinc-500 focus:border-indigo-400 focus:bg-zinc-900 rounded-xl transition-all text-sm font-medium"
                        required
                        autoComplete="username"
                      />
                    </div>
                  </div>

                  {/* Password */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <Label className="text-xs font-bold text-zinc-200 uppercase tracking-wider">Password</Label>
                      <button
                        type="button"
                        onClick={() => { setForgotMode(true); setForgotEmail(email); }}
                        className="text-xs text-indigo-300 hover:text-indigo-200 transition-colors font-semibold"
                      >
                        Forgot password?
                      </button>
                    </div>
                    <div className="relative group">
                      <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400 transition-colors group-focus-within:text-indigo-400 pointer-events-none" />
                      <Input
                        id="login-password"
                        type={showPassword ? "text" : "password"}
                        placeholder="Your password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="pl-10 pr-10 h-12 bg-zinc-900/90 border-white/20 text-white placeholder:text-zinc-500 focus:border-indigo-400 focus:bg-zinc-900 rounded-xl transition-all text-sm font-medium"
                        required
                        autoComplete="current-password"
                      />
                      <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white transition-colors">
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Submit */}
                  <Button
                    id="login-submit"
                    type="submit"
                    disabled={isLoading}
                    className="w-full h-12 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-extrabold rounded-xl shadow-lg shadow-indigo-600/30 hover:shadow-indigo-600/50 transition-all duration-300 text-sm relative overflow-hidden group"
                  >
                    <span className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    {isLoading ? (
                      <span className="flex items-center gap-2"><Loader2 className="h-4 w-4 animate-spin" /> Signing in...</span>
                    ) : (
                      <span className="flex items-center gap-2">Sign In <ArrowRight className="h-4 w-4" /></span>
                    )}
                  </Button>
                </form>

                {/* Divider */}
                <div className="flex items-center gap-3">
                  <div className="flex-1 h-px bg-white/20" />
                  <span className="text-xs text-zinc-300 font-semibold">or continue with</span>
                  <div className="flex-1 h-px bg-white/20" />
                </div>

                {/* OAuth */}
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => handleOAuthLogin("google")}
                    disabled={isLoading}
                    className="flex items-center justify-center gap-2.5 h-11 rounded-xl border border-white/10 bg-white/[0.03] hover:bg-white/[0.06] text-zinc-300 text-sm font-semibold transition-all duration-200 hover:border-white/20"
                  >
                    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none">
                      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                    </svg>
                    Google
                  </button>
                  <button
                    onClick={() => handleOAuthLogin("github")}
                    disabled={isLoading}
                    className="flex items-center justify-center gap-2.5 h-11 rounded-xl border border-white/10 bg-white/[0.03] hover:bg-white/[0.06] text-zinc-300 text-sm font-semibold transition-all duration-200 hover:border-white/20"
                  >
                    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
                    </svg>
                    GitHub
                  </button>
                </div>

                {/* Sign up link */}
                <p className="text-center text-sm font-medium text-zinc-300">
                  New to Nexora?{" "}
                  <Link href="/register" className="text-indigo-300 hover:text-white font-bold transition-colors underline decoration-indigo-500/40 underline-offset-4">
                    Create a free account →
                  </Link>
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
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
                    <div className="text-sm font-bold text-white">Sign in with Google</div>
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
                  type="email"
                  placeholder="yourname@gmail.com"
                  value={customGoogleEmail}
                  onChange={(e) => setCustomGoogleEmail(e.target.value)}
                  className="h-11 bg-white/[0.04] border-white/10 text-white placeholder:text-zinc-600 rounded-xl focus:border-indigo-500/60"
                  autoFocus
                  onKeyDown={(e) => { if (e.key === "Enter") handleGoogleAuthSubmit(customGoogleEmail); }}
                />
              </div>
              <div className="flex gap-2.5">
                <Button variant="outline" onClick={() => setShowGoogleModal(false)} className="flex-1 h-10 border-white/10 text-zinc-400 hover:text-white hover:bg-white/5 rounded-xl text-sm">
                  Cancel
                </Button>
                <Button
                  onClick={() => handleGoogleAuthSubmit(customGoogleEmail)}
                  disabled={!customGoogleEmail.trim() || isLoading}
                  className="flex-1 h-10 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-xl text-sm"
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
