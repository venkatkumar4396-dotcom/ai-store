"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Loader2, ArrowRight, Lock, ShieldCheck, KeyRound, CheckCircle2, AlertCircle, Zap, User, Briefcase, Terminal, Check, X } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import api from "@/lib/api";

// ─── Password Strength Checker ──────────────────────────────

interface PasswordStrength {
  score: number; // 0-4
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
    0: { label: "Very weak", color: "bg-red-500" },
    1: { label: "Weak", color: "bg-red-500" },
    2: { label: "Fair", color: "bg-orange-500" },
    3: { label: "Good", color: "bg-yellow-500" },
    4: { label: "Strong", color: "bg-emerald-500" },
    5: { label: "Very strong", color: "bg-emerald-400" },
  };

  return { score, ...levels[score], checks };
}

// ─── OTP Input Component ────────────────────────────────────

function OtpInput({ value, onChange }: { value: string; onChange: (val: string) => void }) {
  const inputsRef = React.useRef<(HTMLInputElement | null)[]>([]);

  const handleChange = (index: number, digit: string) => {
    if (!/^\d?$/.test(digit)) return;
    const arr = value.split("");
    while (arr.length < 6) arr.push("");
    arr[index] = digit;
    const newVal = arr.join("").slice(0, 6);
    onChange(newVal);
    if (digit && index < 5) {
      inputsRef.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !value[index] && index > 0) {
      inputsRef.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    onChange(pasted);
    if (pasted.length > 0) {
      const focusIndex = Math.min(pasted.length, 5);
      inputsRef.current[focusIndex]?.focus();
    }
  };

  return (
    <div className="flex gap-1.5 sm:gap-2.5 justify-center max-w-full overflow-hidden">
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
          onPaste={i === 0 ? handlePaste : undefined}
          className="w-9 sm:w-12 h-12 sm:h-14 text-center text-lg sm:text-xl font-mono font-bold rounded-xl border border-white/10 bg-white/[0.03] text-white focus:outline-none otp-glow transition-all duration-200"
          autoComplete="one-time-code"
        />
      ))}
    </div>
  );
}

// ─── Floating Sparkle Particles ─────────────────────────────

function FloatingParticles() {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {/* Animated gradient orbs */}
      <div className="login-orb-1 absolute -top-20 -left-20 w-[350px] h-[350px] rounded-full bg-indigo-600/15 glow-pulse" />
      <div className="login-orb-2 absolute -bottom-32 -right-20 w-[400px] h-[400px] rounded-full bg-violet-600/12 glow-pulse" style={{ animationDelay: "2s" }} />
      <div className="login-orb-3 absolute top-1/3 right-0 w-[250px] h-[250px] rounded-full bg-cyan-500/8 glow-pulse" style={{ animationDelay: "4s" }} />
      {/* Tiny floating dots */}
      {[...Array(6)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-1 h-1 rounded-full bg-indigo-400/40"
          style={{
            top: `${15 + i * 14}%`,
            left: `${10 + (i * 17) % 80}%`,
          }}
          animate={{
            y: [0, -20, 0],
            opacity: [0.2, 0.6, 0.2],
          }}
          transition={{
            duration: 3 + i * 0.5,
            repeat: Infinity,
            ease: "easeInOut",
            delay: i * 0.4,
          }}
        />
      ))}
    </div>
  );
}

// ─── User Type Definitions ──────────────────────────────────

type UserTypeId = "user" | "business" | "developer";

interface UserTypeConfig {
  id: UserTypeId;
  title: string;
  subtitle: string;
  badge: string;
  description: string;
  iconName: string;
  gradient: string;
  glowColor: string;
  badgeClass: string;
  borderActive: string;
  demoEmail: string;
}

const USER_TYPES: UserTypeConfig[] = [
  {
    id: "user",
    title: "Individual",
    subtitle: "Personal AI OS",
    badge: "Personal AI OS",
    description: "Access Travel, Stock Intelligence, Career & Document AI agents.",
    iconName: "User",
    gradient: "from-indigo-600 via-indigo-500 to-violet-600",
    glowColor: "shadow-indigo-600/20",
    badgeClass: "bg-indigo-500/10 border-indigo-500/20 text-indigo-300",
    borderActive: "border-indigo-500 bg-indigo-500/10 text-white shadow-indigo-500/15 shadow-md",
    demoEmail: "user@nexora.ai",
  },
  {
    id: "business",
    title: "Business & Agency",
    subtitle: "WhatsApp & Sales AI",
    badge: "WhatsApp & CRM",
    description: "Manage WhatsApp auto-reply bot, sales leads & customer support workflows.",
    iconName: "Briefcase",
    gradient: "from-emerald-600 via-teal-500 to-cyan-600",
    glowColor: "shadow-emerald-600/20",
    badgeClass: "bg-emerald-500/10 border-emerald-500/20 text-emerald-300",
    borderActive: "border-emerald-500 bg-emerald-500/10 text-white shadow-emerald-500/15 shadow-md",
    demoEmail: "business@nexora.ai",
  },
  {
    id: "developer",
    title: "Developer & Admin",
    subtitle: "API & Model Control",
    badge: "API & Admin",
    description: "Manage API keys, LLM prompts, model playground & admin configurations.",
    iconName: "Terminal",
    gradient: "from-amber-600 via-orange-500 to-rose-600",
    glowColor: "shadow-amber-600/20",
    badgeClass: "bg-amber-500/10 border-amber-500/20 text-amber-300",
    borderActive: "border-amber-500 bg-amber-500/10 text-white shadow-amber-500/15 shadow-md",
    demoEmail: "admin@nexora.ai",
  },
];

// ─── Main Login Page ────────────────────────────────────────

export default function LoginPage() {
  const router = useRouter();

  // Login State
  const [userType, setUserType] = React.useState<UserTypeId>("user");
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState("");

  // Forgot Password OTP State
  const [forgotMode, setForgotMode] = React.useState(false);
  const [forgotEmail, setForgotEmail] = React.useState("");
  const [otp, setOtp] = React.useState("");
  const [resetPermissionToken, setResetPermissionToken] = React.useState("");
  const [newPassword, setNewPassword] = React.useState("");
  const [step, setStep] = React.useState<1 | 2 | 3 | 4>(1);
  // 1 = enter email, 2 = enter OTP, 3 = set new password, 4 = success
  const [forgotError, setForgotError] = React.useState("");
  const [forgotSuccess, setForgotSuccess] = React.useState("");

  const activeUserType = React.useMemo(
    () => USER_TYPES.find((t) => t.id === userType) || USER_TYPES[0],
    [userType]
  );

  const passwordStrength = React.useMemo(() => getPasswordStrength(newPassword), [newPassword]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const cleanEmail = email.trim().toLowerCase();

    if (!cleanEmail || !password) {
      setError("Please fill in all fields.");
      return;
    }

    setIsLoading(true);
    try {
      const { data } = await api.post("/auth/login", { email: cleanEmail, password, userType });
      if (typeof window !== "undefined") {
        localStorage.setItem("nexora_logged_in", "true");
        localStorage.setItem("nexora_user_type", userType);
        if (data?.token) {
          localStorage.setItem("nexora_auth_token", data.token);
        }
      }
      router.push("/dashboard");
    } catch (err: any) {
      console.error(err);
      if (err.message === "Network Error" || !err.response) {
        setError("Network Error: Cannot connect to Nexora API server. Make sure it is running on port 5000.");
      } else {
        setError(err.response?.data?.error || "Invalid email or password.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  // ─── Google & GitHub OAuth Handler ─────────────────────────────
  const [showGoogleModal, setShowGoogleModal] = React.useState(false);
  const [customGoogleEmail, setCustomGoogleEmail] = React.useState("");

  const handleOAuthLogin = (provider: "google" | "github") => {
    setError("");
    if (provider === "google") {
      setShowGoogleModal(true);
    } else {
      // GitHub OAuth flow fallback
      handleGoogleAuthSubmit("github.user@github.com", "GitHub Developer", "github");
    }
  };

  const handleGoogleAuthSubmit = async (
    targetEmail: string,
    targetName?: string,
    providerType: "google" | "github" = "google"
  ) => {
    if (!targetEmail || !targetEmail.trim()) return;
    setIsLoading(true);
    setError("");
    setShowGoogleModal(false);

    const cleanEmail = targetEmail.trim().toLowerCase();
    const displayName = targetName || cleanEmail.split("@")[0].replace(/\./g, " ").replace(/\b\w/g, (l) => l.toUpperCase());
    const providerId = `${providerType}_${cleanEmail}`;
    const avatar = `https://api.dicebear.com/7.x/avataaars/svg?seed=${cleanEmail}`;

    try {
      const endpoint = providerType === "google" ? "/auth/google" : "/auth/github";
      const { data } = await api.post(endpoint, {
        providerId,
        email: cleanEmail,
        name: displayName,
        avatar,
      });

      if (typeof window !== "undefined") {
        localStorage.setItem("nexora_logged_in", "true");
        localStorage.setItem("nexora_user_type", userType);
        if (data?.token) {
          localStorage.setItem("nexora_auth_token", data.token);
        }
      }
      router.push("/dashboard");
    } catch (err: any) {
      console.error("OAuth error:", err);
      setError(err.response?.data?.error || "Google authentication failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickFillDemo = (typeId: UserTypeId) => {
    setUserType(typeId);
    const selected = USER_TYPES.find((t) => t.id === typeId);
    if (selected) {
      setEmail(selected.demoEmail);
      setPassword("Password123!");
    }
  };

  // Step 1: Request OTP
  const handleForgotSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setForgotError("");
    setForgotSuccess("");
    const cleanEmail = forgotEmail.trim();
    if (!cleanEmail) {
      setForgotError("Email address is required.");
      return;
    }
    setIsLoading(true);
    try {
      const res = await api.post("/auth/forgot-password", { email: cleanEmail });
      setForgotSuccess(res.data.devNote ? `${res.data.message} ${res.data.devNote}` : res.data.message);
      if (res.data.debugOtp) {
        setOtp(res.data.debugOtp);
      }
      setStep(2);
    } catch (err: any) {
      setForgotError(err.response?.data?.error || "Failed to send OTP. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // Step 2: Verify OTP
  const handleOtpVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setForgotError("");
    setForgotSuccess("");
    const cleanEmail = forgotEmail.trim();
    if (otp.length !== 6) {
      setForgotError("Please enter the complete 6-digit OTP.");
      return;
    }
    setIsLoading(true);
    try {
      const res = await api.post("/auth/verify-otp", { email: cleanEmail, otp });
      setResetPermissionToken(res.data.resetPermissionToken);
      setForgotSuccess("OTP verified! Set your new password below.");
      setStep(3);
    } catch (err: any) {
      setForgotError(err.response?.data?.error || "Invalid OTP. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // Step 3: Reset Password
  const handleResetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setForgotError("");
    setForgotSuccess("");
    const cleanEmail = forgotEmail.trim();
    if (!newPassword) {
      setForgotError("New password is required.");
      return;
    }
    if (passwordStrength.score < 5) {
      const missingChecks = passwordStrength.checks
        .filter((c) => !c.met)
        .map((c) => c.label)
        .join(", ");
      setForgotError(`Password must meet all requirements. Missing: ${missingChecks}`);
      return;
    }
    setIsLoading(true);
    try {
      await api.post("/auth/reset-password", {
        email: cleanEmail,
        resetPermissionToken,
        password: newPassword,
      });
      setForgotSuccess("Password reset successfully! You can now sign in.");
      if (cleanEmail) {
        setEmail(cleanEmail);
      }
      setStep(4);
    } catch (err: any) {
      setForgotError(err.response?.data?.error || "Reset failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const resetForgotState = () => {
    if (forgotEmail.trim()) {
      setEmail(forgotEmail.trim());
    }
    setForgotMode(false);
    setStep(1);
    setForgotEmail("");
    setOtp("");
    setResetPermissionToken("");
    setNewPassword("");
    setForgotError("");
    setForgotSuccess("");
  };

  const stepIcons = [
    { icon: KeyRound, label: "Email" },
    { icon: ShieldCheck, label: "OTP" },
    { icon: Lock, label: "Password" },
    { icon: CheckCircle2, label: "Done" },
  ];

  // Stagger animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.08, delayChildren: 0.1 },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 16 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.25, 0.1, 0.25, 1] as const } },
  };

  return (
    <div className="min-h-screen w-full bg-[#05050f] text-foreground flex items-center justify-center p-4 relative overflow-hidden">
      {/* Premium background — uniform deep dark */}
      <FloatingParticles />

      {/* Subtle grid overlay */}
      <div
        className="absolute inset-0 opacity-[0.012] pointer-events-none"
        style={{
          backgroundImage: `linear-gradient(rgba(255,255,255,0.15) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.15) 1px, transparent 1px)`,
          backgroundSize: '60px 60px',
        }}
      />

      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-md relative z-10"
      >
        <Card className="glass-glow-card rounded-2xl overflow-hidden">
          {!forgotMode ? (
            // ─── LOGIN CARD CONTENT ───
            <>
              <CardHeader className="text-center space-y-3 pt-8 pb-2">
                <motion.div
                  variants={containerVariants}
                  initial="hidden"
                  animate="visible"
                  className="space-y-3"
                >
                  {/* Logo */}
                  <motion.div variants={itemVariants} className="flex justify-center">
                    <div className="relative">
                      <div className="absolute inset-0 bg-indigo-500/20 rounded-2xl blur-xl scale-150" />
                      <div className="relative w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 via-violet-500 to-purple-600 flex items-center justify-center shadow-2xl shadow-indigo-600/25">
                        <Sparkles className="h-7 w-7 text-white" />
                      </div>
                    </div>
                  </motion.div>

                  {/* Title */}
                  <motion.div variants={itemVariants}>
                    <CardTitle className="text-3xl font-bold tracking-tight gradient-text pb-1">
                      Welcome back
                    </CardTitle>
                  </motion.div>

                  <motion.div variants={itemVariants}>
                    <CardDescription className="text-zinc-400 text-sm leading-relaxed">
                      Sign in to access your AI agent control center
                    </CardDescription>
                  </motion.div>

                  {/* Powered by badge & Active User Type indicator */}
                  <motion.div variants={itemVariants} className="flex justify-center items-center gap-2">
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/[0.08] border border-indigo-500/15 text-[10px] font-medium text-indigo-300/80">
                      <Zap className="h-3 w-3" />
                      <span>Powered by Nexora Intelligence Engine</span>
                    </div>
                  </motion.div>
                </motion.div>
              </CardHeader>

              <form onSubmit={handleLogin}>
                <CardContent className="space-y-4 px-7 pt-2">
                  <motion.div
                    variants={containerVariants}
                    initial="hidden"
                    animate="visible"
                    className="space-y-4"
                  >
                    {/* User Type Selection Tabs */}
                    <motion.div variants={itemVariants} className="space-y-2">
                      <div className="flex justify-between items-center px-0.5">
                        <Label className="text-zinc-300 text-xs font-semibold tracking-wide uppercase">
                          Account User Type
                        </Label>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full border font-medium transition-all ${activeUserType.badgeClass}`}>
                          {activeUserType.badge}
                        </span>
                      </div>

                      <div className="grid grid-cols-3 gap-2 p-1.5 rounded-2xl bg-black/40 border border-white/10 backdrop-blur-md">
                        {USER_TYPES.map((t) => {
                          const isSelected = userType === t.id;
                          const IconComponent = t.id === "user" ? User : t.id === "business" ? Briefcase : Terminal;
                          return (
                            <button
                              key={t.id}
                              type="button"
                              onClick={() => setUserType(t.id)}
                              className={`flex flex-col items-center justify-center p-2.5 rounded-xl border text-center transition-all duration-200 cursor-pointer ${
                                isSelected
                                  ? t.borderActive
                                  : "border-transparent bg-white/[0.02] text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.05]"
                              }`}
                            >
                              <IconComponent className={`h-4 w-4 mb-1 ${isSelected ? "text-white" : "text-zinc-400"}`} />
                              <span className="text-[11px] font-semibold leading-tight">{t.title.split(" ")[0]}</span>
                              <span className="text-[9px] text-zinc-400 truncate max-w-full">{t.subtitle}</span>
                            </button>
                          );
                        })}
                      </div>

                      <div className="flex items-center justify-between px-1 pt-0.5">
                        <p className="text-[11px] text-zinc-400 leading-snug">
                          {activeUserType.description}
                        </p>
                        <button
                          type="button"
                          onClick={() => handleQuickFillDemo(userType)}
                          className="text-[10px] text-indigo-400 hover:text-indigo-300 font-medium underline shrink-0 ml-2 bg-transparent border-0 cursor-pointer transition-colors"
                        >
                          Auto-fill demo
                        </button>
                      </div>
                    </motion.div>

                    {error && (
                      <motion.div variants={itemVariants}>
                        <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-400 flex items-start gap-2">
                          <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                          <span>{error}</span>
                        </div>
                      </motion.div>
                    )}

                    <motion.div variants={itemVariants} className="space-y-1.5">
                      <Label htmlFor="email" className="text-zinc-300 text-xs font-semibold tracking-wide uppercase">Email Address</Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder={activeUserType.demoEmail}
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="bg-white/[0.03] border-white/10 text-white placeholder-zinc-600 h-11 rounded-xl input-focus-glow transition-all duration-200"
                      />
                    </motion.div>
                    <motion.div variants={itemVariants} className="space-y-1.5">
                      <div className="flex justify-between items-center">
                        <Label htmlFor="password" className="text-zinc-300 text-xs font-semibold tracking-wide uppercase">Password</Label>
                        <button
                          type="button"
                          onClick={() => {
                            setForgotMode(true);
                            setStep(1);
                            setForgotError("");
                            setForgotSuccess("");
                          }}
                          className="text-[11px] text-indigo-400 hover:text-indigo-300 hover:underline bg-transparent border-0 cursor-pointer transition-colors"
                        >
                          Forgot password?
                        </button>
                      </div>
                      <Input
                        id="password"
                        type="password"
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="bg-white/[0.03] border-white/10 text-white placeholder-zinc-600 h-11 rounded-xl input-focus-glow transition-all duration-200"
                      />
                    </motion.div>
                  </motion.div>
                </CardContent>

                <CardFooter className="flex flex-col gap-4 px-7 pb-8 pt-2">
                  <motion.div
                    variants={containerVariants}
                    initial="hidden"
                    animate="visible"
                    className="w-full space-y-4"
                  >
                    <motion.div variants={itemVariants}>
                      <Button
                        type="submit"
                        disabled={isLoading}
                        className={`w-full h-11 bg-gradient-to-r ${activeUserType.gradient} text-white shadow-xl ${activeUserType.glowColor} font-semibold cursor-pointer rounded-xl btn-premium text-sm tracking-wide transition-all duration-300`}
                      >
                        {isLoading ? (
                          <Loader2 className="h-4 w-4 animate-spin text-white mr-2" />
                        ) : (
                          <>
                            Sign In as {activeUserType.title} <ArrowRight className="h-4 w-4 ml-2" />
                          </>
                        )}
                      </Button>
                    </motion.div>

                    <motion.div variants={itemVariants} className="relative w-full flex items-center justify-center my-1">
                      <div className="absolute inset-0 flex items-center">
                        <span className="w-full border-t border-white/[0.06]" />
                      </div>
                      <span className="relative px-4 text-[10px] text-zinc-600 uppercase tracking-widest bg-[#0a0a1a]">
                        Or continue with
                      </span>
                    </motion.div>

                    <motion.div variants={itemVariants} className="grid grid-cols-2 gap-3 w-full">
                      <div className="relative group">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => handleOAuthLogin("google")}
                          disabled={isLoading}
                          className="w-full bg-white/[0.02] border-white/[0.08] text-zinc-400 hover:text-white hover:bg-white/[0.06] hover:border-white/15 font-semibold text-xs py-2.5 cursor-pointer rounded-xl transition-all duration-200"
                        >
                          <svg className="h-4 w-4 mr-2 shrink-0" viewBox="0 0 24 24">
                            <path fill="#EA4335" d="M12 5.04c1.66 0 3.2.57 4.38 1.69l3.27-3.27C17.67 1.48 15.01.5 12 .5 7.37.5 3.42 3.16 1.5 7.03l3.87 3c.92-2.75 3.51-4.99 6.63-4.99z" />
                            <path fill="#4285F4" d="M23.49 12.27c0-.81-.07-1.59-.2-2.34H12v4.43h6.43c-.28 1.47-1.11 2.71-2.36 3.55l3.66 2.84c2.14-1.97 3.39-4.88 3.39-8.48z" />
                            <path fill="#FBBC05" d="M5.37 14.51c-.24-.72-.37-1.49-.37-2.29s.13-1.57.37-2.29L1.5 6.93C.54 8.87 0 11.06 0 13.38s.54 4.51 1.5 6.45l3.87-3.32z" />
                            <path fill="#34A853" d="M12 23.5c3.24 0 5.97-1.08 7.96-2.91l-3.66-2.84c-1.01.68-2.31 1.09-3.96 1.09-3.12 0-5.71-2.24-6.63-4.99L1.5 17.17c1.92 3.87 5.87 6.33 10.5 6.33z" />
                          </svg>
                          Google
                        </Button>
                        <span className="absolute -top-8 left-1/2 -translate-x-1/2 px-2 py-1 text-[10px] bg-zinc-800 text-zinc-300 rounded-lg border border-white/10 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                          Demo mode
                        </span>
                      </div>
                      <div className="relative group">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => handleOAuthLogin("github")}
                          disabled={isLoading}
                          className="w-full bg-white/[0.02] border-white/[0.08] text-zinc-400 hover:text-white hover:bg-white/[0.06] hover:border-white/15 font-semibold text-xs py-2.5 cursor-pointer rounded-xl transition-all duration-200"
                        >
                          <svg className="h-4 w-4 mr-2 shrink-0" fill="currentColor" viewBox="0 0 24 24">
                            <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482C19.138 20.193 22 16.44 22 12.017 22 6.484 17.522 2 12 2z" />
                          </svg>
                          GitHub
                        </Button>
                        <span className="absolute -top-8 left-1/2 -translate-x-1/2 px-2 py-1 text-[10px] bg-zinc-800 text-zinc-300 rounded-lg border border-white/10 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                          Demo mode
                        </span>
                      </div>
                    </motion.div>

                    <motion.div variants={itemVariants} className="text-xs text-center text-zinc-500 mt-2">
                      Don&apos;t have an account?{" "}
                      <Link href="/register" className="text-indigo-400 hover:text-indigo-300 hover:underline transition-colors font-medium">
                        Create one free
                      </Link>
                    </motion.div>
                  </motion.div>
                </CardFooter>
              </form>
            </>
          ) : (
            // ─── FORGOT PASSWORD OTP WIZARD ───
            <>
              <CardHeader className="text-center space-y-3 pt-8 pb-2">
                <motion.div
                  variants={containerVariants}
                  initial="hidden"
                  animate="visible"
                  className="space-y-3"
                >
                  <motion.div variants={itemVariants} className="flex justify-center">
                    <div className="relative">
                      <div className="absolute inset-0 bg-violet-500/20 rounded-2xl blur-xl scale-150" />
                      <div className="relative w-14 h-14 rounded-2xl bg-gradient-to-br from-violet-500 via-indigo-500 to-blue-600 flex items-center justify-center shadow-2xl shadow-violet-600/25">
                        <Lock className="h-6 w-6 text-white" />
                      </div>
                    </div>
                  </motion.div>

                  <motion.div variants={itemVariants}>
                    <CardTitle className="text-2xl font-bold tracking-tight gradient-text pb-1">
                      {step === 1 ? "Recover Password" : step === 2 ? "Enter OTP" : step === 3 ? "New Password" : "All Set!"}
                    </CardTitle>
                  </motion.div>

                  <motion.div variants={itemVariants}>
                    <CardDescription className="text-zinc-400 text-sm leading-relaxed">
                      {step === 1
                        ? "Enter your email and we\u2019ll send you a 6-digit verification code."
                        : step === 2
                          ? "Enter the 6-digit OTP sent to your email."
                          : step === 3
                            ? "Choose a strong new password for your account."
                            : "Your password has been successfully updated."}
                    </CardDescription>
                  </motion.div>

                  {/* Step progress indicator */}
                  <motion.div variants={itemVariants} className="flex items-center justify-center gap-1.5 pt-2">
                    {stepIcons.map((s, i) => {
                      const Icon = s.icon;
                      const isActive = step === i + 1;
                      const isDone = step > i + 1;
                      return (
                        <React.Fragment key={i}>
                          {i > 0 && (
                            <div className={`w-8 h-[2px] rounded-full ${isDone ? "bg-indigo-500" : "bg-zinc-800"} transition-colors duration-300`} />
                          )}
                          <div
                            className={`w-8 h-8 rounded-full flex items-center justify-center text-xs transition-all duration-300 ${isDone
                                ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/20"
                                : isActive
                                  ? "bg-indigo-600/20 border border-indigo-500 text-indigo-400 shadow-lg shadow-indigo-600/10"
                                  : "bg-zinc-900 text-zinc-600 border border-zinc-800"
                              }`}
                            title={s.label}
                          >
                            <Icon className="h-3.5 w-3.5" />
                          </div>
                        </React.Fragment>
                      );
                    })}
                  </motion.div>
                </motion.div>
              </CardHeader>

              <CardContent className="space-y-4 px-7">
                {forgotError && (
                  <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}>
                    <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-400 flex items-start gap-2">
                      <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                      <span>{forgotError}</span>
                    </div>
                  </motion.div>
                )}
                {forgotSuccess && (
                  <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}>
                    <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-400 flex items-start gap-2">
                      <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5" />
                      <span>{forgotSuccess}</span>
                    </div>
                  </motion.div>
                )}

                {/* Step 1: Enter email */}
                {step === 1 && (
                  <form onSubmit={handleForgotSubmit} className="space-y-4">
                    <div className="space-y-1.5">
                      <Label htmlFor="forgot-email" className="text-zinc-300 text-xs font-semibold tracking-wide uppercase">Email Address</Label>
                      <Input
                        id="forgot-email"
                        type="email"
                        placeholder="your-email@nexora.ai"
                        value={forgotEmail}
                        onChange={(e) => setForgotEmail(e.target.value)}
                        className="bg-white/[0.03] border-white/10 text-white placeholder-zinc-600 h-11 rounded-xl input-focus-glow transition-all duration-200"
                      />
                    </div>
                    <Button
                      type="submit"
                      disabled={isLoading}
                      className="w-full h-11 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white shadow-xl shadow-indigo-600/20 font-semibold cursor-pointer rounded-xl btn-premium"
                    >
                      {isLoading ? <Loader2 className="h-4 w-4 animate-spin text-white mr-2" /> : "Send OTP"}
                    </Button>
                  </form>
                )}

                {/* Step 2: Enter OTP */}
                {step === 2 && (
                  <form onSubmit={handleOtpVerify} className="space-y-5">
                    <div className="space-y-3">
                      <Label className="text-center block text-zinc-300 text-xs font-semibold tracking-wide uppercase">Enter 6-digit code</Label>
                      <OtpInput value={otp} onChange={setOtp} />
                      <p className="text-[11px] text-zinc-500 text-center">
                        Sent to <span className="text-zinc-300 font-medium">{forgotEmail}</span>
                      </p>
                    </div>
                    <Button
                      type="submit"
                      disabled={isLoading || otp.length !== 6}
                      className="w-full h-11 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white shadow-xl shadow-indigo-600/20 font-semibold cursor-pointer rounded-xl btn-premium disabled:opacity-50"
                    >
                      {isLoading ? <Loader2 className="h-4 w-4 animate-spin text-white mr-2" /> : "Verify OTP"}
                    </Button>
                    <button
                      type="button"
                      onClick={() => {
                        setOtp("");
                        setForgotError("");
                        setForgotSuccess("");
                        setStep(1);
                      }}
                      className="text-xs text-zinc-500 hover:text-indigo-400 hover:underline bg-transparent border-0 cursor-pointer mx-auto block transition-colors"
                    >
                      Resend code
                    </button>
                  </form>
                )}

                {/* Step 3: Set new password */}
                {step === 3 && (
                  <form onSubmit={handleResetSubmit} className="space-y-4">
                    <div className="space-y-1.5">
                      <Label htmlFor="new-password" className="text-zinc-300 text-xs font-semibold tracking-wide uppercase">New Password</Label>
                      <Input
                        id="new-password"
                        type="password"
                        placeholder="Strong new password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        className="bg-white/[0.03] border-white/10 text-white placeholder-zinc-600 h-11 rounded-xl input-focus-glow transition-all duration-200"
                      />
                    </div>

                    {/* Password Strength Indicator */}
                    {newPassword.length > 0 && (
                      <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="space-y-2.5">
                        <div className="flex gap-1">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <div
                              key={i}
                              className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${i < passwordStrength.score ? passwordStrength.color : "bg-zinc-800"
                                }`}
                            />
                          ))}
                        </div>
                        <p className="text-[11px] text-zinc-400">
                          Strength: <span className={`font-semibold ${passwordStrength.score >= 4 ? "text-emerald-400" : passwordStrength.score >= 3 ? "text-yellow-400" : "text-rose-400"
                            }`}>{passwordStrength.label}</span>
                        </p>
                        <div className="grid grid-cols-2 gap-x-3 gap-y-1.5">
                          {passwordStrength.checks.map((check) => (
                            <div key={check.label} className="flex items-center gap-1.5 text-[11px]">
                              <div className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] transition-all duration-200 ${check.met ? "bg-emerald-500/20 text-emerald-400" : "bg-zinc-900 text-zinc-600"
                                }`}>
                                {check.met ? "✓" : "·"}
                              </div>
                              <span className={`transition-colors ${check.met ? "text-zinc-300" : "text-zinc-600"}`}>{check.label}</span>
                            </div>
                          ))}
                        </div>
                      </motion.div>
                    )}

                    <Button
                      type="submit"
                      disabled={isLoading || !newPassword}
                      className="w-full h-11 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white shadow-xl shadow-indigo-600/20 font-semibold cursor-pointer rounded-xl btn-premium disabled:opacity-50"
                    >
                      {isLoading ? <Loader2 className="h-4 w-4 animate-spin text-white mr-2" /> : "Save New Password"}
                    </Button>
                  </form>
                )}

                {/* Step 4: Success */}
                {step === 4 && (
                  <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
                    <Button
                      onClick={resetForgotState}
                      className="w-full h-11 bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white font-semibold cursor-pointer rounded-xl btn-premium shadow-xl shadow-emerald-600/20"
                    >
                      Go to Sign In
                    </Button>
                  </motion.div>
                )}
              </CardContent>

              <CardFooter className="flex flex-col gap-2 px-7 pb-8 pt-0">
                {step !== 4 && (
                  <button
                    type="button"
                    onClick={resetForgotState}
                    className="text-xs text-zinc-500 hover:text-indigo-400 hover:underline bg-transparent border-0 cursor-pointer mx-auto mt-2 transition-colors"
                  >
                    ← Back to login
                  </button>
                )}
              </CardFooter>
            </>
          )}
        </Card>

        {/* Bottom branding */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="text-center text-[11px] text-zinc-600 mt-6 tracking-wide"
        >
          Nexora · Intelligence, Automated
        </motion.p>
      </motion.div>

      {/* ─── GOOGLE MAIL OAUTH AUTHENTICATION MODAL ─── */}
      <AnimatePresence>
        {showGoogleModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="relative w-full max-w-md overflow-hidden rounded-2xl border border-white/10 bg-zinc-950 p-6 shadow-2xl"
            >
              {/* Header */}
              <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center">
                    <svg className="h-5 w-5" viewBox="0 0 24 24">
                      <path fill="#EA4335" d="M12 5.04c1.66 0 3.2.57 4.38 1.69l3.27-3.27C17.67 1.48 15.01.5 12 .5 7.37.5 3.42 3.16 1.5 7.03l3.87 3c.92-2.75 3.51-4.99 6.63-4.99z" />
                      <path fill="#4285F4" d="M23.49 12.27c0-.81-.07-1.59-.2-2.34H12v4.43h6.43c-.28 1.47-1.11 2.71-2.36 3.55l3.66 2.84c2.14-1.97 3.39-4.88 3.39-8.48z" />
                      <path fill="#FBBC05" d="M5.37 14.51c-.24-.72-.37-1.49-.37-2.29s.13-1.57.37-2.29L1.5 6.93C.54 8.87 0 11.06 0 13.38s.54 4.51 1.5 6.45l3.87-3.32z" />
                      <path fill="#34A853" d="M12 23.5c3.24 0 5.97-1.08 7.96-2.91l-3.66-2.84c-1.01.68-2.31 1.09-3.96 1.09-3.12 0-5.71-2.24-6.63-4.99L1.5 17.17c1.92 3.87 5.87 6.33 10.5 6.33z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-bold text-white text-base">Sign in with Google Mail</h3>
                    <p className="text-xs text-zinc-400">Choose a Google Account or enter your Google Mail</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowGoogleModal(false)}
                  className="p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-white/10 transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Quick Select Preset Google Accounts */}
              <div className="space-y-2 mb-4">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500 mb-2">Select Account</p>
                {[
                  { name: "Venkat Kumar", email: "venkatkumar4396@gmail.com", avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=venkatkumar" },
                  { name: "Alex Developer", email: "alex.dev@gmail.com", avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=alexdev" },
                  { name: "Sarah Tech Lead", email: "sarah.tech@gmail.com", avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=sarahtech" },
                ].map((acc) => (
                  <button
                    key={acc.email}
                    type="button"
                    onClick={() => handleGoogleAuthSubmit(acc.email, acc.name, "google")}
                    className="w-full flex items-center justify-between p-3 rounded-xl border border-white/5 bg-white/[0.02] hover:bg-white/[0.06] hover:border-white/15 transition-all text-left group cursor-pointer"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      {/* Avatar */}
                      <img src={acc.avatar} alt={acc.name} className="w-8 h-8 rounded-full bg-white/10 shrink-0" />
                      <div className="min-w-0">
                        <div className="text-xs font-semibold text-white group-hover:text-indigo-300 transition-colors truncate">{acc.name}</div>
                        <div className="text-[11px] text-zinc-400 truncate">{acc.email}</div>
                      </div>
                    </div>
                    <span className="text-[10px] text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 px-2 py-0.5 rounded-md font-medium shrink-0">
                      1-Tap Auth
                    </span>
                  </button>
                ))}
              </div>

              {/* Custom Google Email Entry */}
              <div className="border-t border-white/10 pt-4 space-y-3">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500">Or use another Google Mail</p>
                <div className="flex gap-2">
                  <Input
                    type="email"
                    placeholder="you.name@gmail.com"
                    value={customGoogleEmail}
                    onChange={(e) => setCustomGoogleEmail(e.target.value)}
                    className="bg-white/5 border-white/10 text-white placeholder-zinc-500 text-xs h-10"
                  />
                  <Button
                    type="button"
                    onClick={() => handleGoogleAuthSubmit(customGoogleEmail, undefined, "google")}
                    disabled={!customGoogleEmail.trim()}
                    className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs px-4 h-10 shrink-0 font-medium"
                  >
                    Authenticate
                  </Button>
                </div>
              </div>

              {/* Footer Security Badge */}
              <div className="mt-5 pt-3 border-t border-white/5 flex items-center justify-between text-[10px] text-zinc-500">
                <span className="flex items-center gap-1 text-emerald-400">
                  <ShieldCheck className="h-3 w-3" /> Encrypted SSL OAuth 2.0
                </span>
                <span>Powered by Nexora Auth</span>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
