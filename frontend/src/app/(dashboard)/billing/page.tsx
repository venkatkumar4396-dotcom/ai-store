"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  CreditCard,
  CheckCircle,
  AlertCircle,
  Loader2,
  DollarSign,
  Zap,
  Sparkles,
  Info,
  XCircle,
  ShieldAlert,
  ArrowRight,
  TrendingUp,
  Award
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import api from "@/lib/api";

interface Subscription {
  id: string;
  plan: string;
  status: string;
  currentPeriodEnd?: string;
}

export default function BillingPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [sub, setSub] = React.useState<Subscription | null>(null);
  const [isLoading, setIsLoading] = React.useState(false);
  const [isProcessingCheckout, setIsProcessingCheckout] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [successMsg, setSuccessMsg] = React.useState<string | null>(null);

  React.useEffect(() => {
    loadSubscription();
    handleUrlCheckoutVerification();
  }, [searchParams]);

  const loadSubscription = async () => {
    setIsLoading(true);
    try {
      const res = await api.get("/payments/subscription");
      setSub(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUrlCheckoutVerification = async () => {
    const status = searchParams.get("checkout_status");
    const sessionId = searchParams.get("session_id");
    const plan = searchParams.get("plan");

    if (status === "success" && sessionId && plan) {
      setIsProcessingCheckout(true);
      setError(null);
      try {
        const res = await api.post("/payments/confirm-checkout", {
          sessionId,
          plan
        });
        setSub(res.data);
        setSuccessMsg(`Upgraded plan to ${plan.toUpperCase()} successfully!`);
        // Remove query parameters
        router.replace("/billing");
      } catch (err: any) {
        setError(err.response?.data?.error || "Could not confirm subscription upgrade.");
      } finally {
        setIsProcessingCheckout(false);
      }
    }
  };

  const handleUpgrade = async (targetPlan: string) => {
    setIsProcessingCheckout(true);
    setError(null);
    setSuccessMsg(null);
    try {
      const res = await api.post("/create-checkout", { plan: targetPlan });
      if (res.data.url) {
        // Redirect to mock Stripe url (which calls back to /billing with parameters)
        router.push(res.data.url);
      }
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to initiate subscription process.");
      setIsProcessingCheckout(false);
    }
  };

  const handleCancel = async () => {
    setIsLoading(true);
    setError(null);
    setSuccessMsg(null);
    try {
      const res = await api.post("/payments/cancel");
      setSub(res.data);
      setSuccessMsg("Subscription cancelled. downgraded back to Free tier.");
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to cancel subscription.");
    } finally {
      setIsLoading(false);
    }
  };

  const activePlan = sub?.plan || "free";
  const renewDate = sub?.currentPeriodEnd
    ? new Date(sub.currentPeriodEnd).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
    : null;

  return (
    <div className="space-y-8 pb-10">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-indigo-400 via-violet-400 to-cyan-400 bg-clip-text text-transparent flex items-center gap-2.5">
            Billing & Subscriptions <CreditCard className="h-6 w-6 text-indigo-400 animate-pulse" />
          </h1>
          <p className="text-zinc-400 text-sm mt-1">
            Manage your subscription tiers, check renewals, and explore Premium developer features.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge className="bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 px-3 py-1.5 rounded-lg flex items-center gap-1.5 font-mono text-xs">
            100% Free Autonomous Tiers
          </Badge>
        </div>
      </div>

      <AnimatePresence>
        {isProcessingCheckout && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="p-4 rounded-xl border border-indigo-500/20 bg-indigo-950/20 backdrop-blur-md flex items-center gap-3"
          >
            <Loader2 className="h-5 w-5 animate-spin text-indigo-400" />
            <span className="text-sm font-semibold text-zinc-300">Syncing with Stripe payment registers...</span>
          </motion.div>
        )}

        {successMsg && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="p-4 rounded-xl border border-emerald-500/20 bg-emerald-950/20 backdrop-blur-md flex items-center gap-3 text-emerald-400"
          >
            <CheckCircle className="h-5 w-5 animate-bounce" />
            <span className="text-sm font-semibold">{successMsg}</span>
          </motion.div>
        )}

        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="p-4 rounded-xl border border-rose-500/20 bg-rose-950/20 backdrop-blur-md flex items-center gap-3 text-rose-400"
          >
            <XCircle className="h-5 w-5" />
            <span className="text-sm font-semibold">{error}</span>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column: Current Plan */}
        <div className="lg:col-span-1">
          <Card className="bg-zinc-950/40 border-zinc-900 backdrop-blur-md relative overflow-hidden h-full">
            <div className="absolute top-0 right-0 h-32 w-32 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none" />
            <CardHeader className="pb-3 border-b border-zinc-900/60">
              <CardTitle className="text-base font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                Current Status
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6 space-y-6">
              <div className="space-y-1">
                <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Active Plan</span>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-3xl font-black text-white capitalize">{activePlan}</span>
                  <Badge className="bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 font-bold uppercase text-[9px] px-1.5 py-0.5 rounded">
                    {sub?.status === "active" ? "Active" : "Trial"}
                  </Badge>
                </div>
              </div>

              {renewDate && (
                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Renewal Date</span>
                  <p className="text-sm font-semibold text-zinc-300 mt-0.5">{renewDate}</p>
                  <p className="text-[10px] text-zinc-500 italic mt-0.5">Recurring subscription handled autonomously.</p>
                </div>
              )}

              <div className="border-t border-zinc-900 pt-5 space-y-4">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-zinc-400">Monthly Cost:</span>
                  <span className="font-mono font-bold text-white">
                    {activePlan === "free" ? "$0.00" : activePlan === "pro" ? "$49.00" : "$99.00"}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-zinc-400">Total Billed:</span>
                  <span className="font-mono font-bold text-white">$0.00 (Developer Trial Mode)</span>
                </div>
              </div>

              {activePlan !== "free" && (
                <Button
                  onClick={handleCancel}
                  disabled={isLoading}
                  variant="outline"
                  className="w-full bg-transparent border-rose-500/20 hover:bg-rose-500/10 text-rose-400 hover:text-rose-300 text-xs font-semibold rounded-lg py-2"
                >
                  Cancel Plan
                </Button>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right column: Upgrade Options */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="bg-zinc-950/40 border-zinc-900 backdrop-blur-md">
            <CardHeader className="pb-3 border-b border-zinc-900/60">
              <CardTitle className="text-base font-bold text-white">Platform Subscriptions</CardTitle>
              <CardDescription>
                Toggle workspace capacities. Upgrades are free inside this demo sandbox environment.
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                {/* Free plan column */}
                <div className="p-4 rounded-xl bg-zinc-900/15 border border-zinc-900 space-y-4 flex flex-col justify-between">
                  <div className="space-y-2">
                    <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Starter</span>
                    <h3 className="text-xl font-bold text-white">Free Plan</h3>
                    <p className="text-[10px] text-zinc-400 leading-normal">Ideal for casual developers auditing agent automations.</p>
                    <div className="flex items-baseline gap-1 mt-2">
                      <span className="text-2xl font-black text-white">$0</span>
                      <span className="text-[10px] text-zinc-500">/ mo</span>
                    </div>
                  </div>
                  <div className="space-y-3 pt-3 border-t border-zinc-900/60 text-[10px] text-zinc-400 flex-1">
                    <p>• Access to 5 core AI agents</p>
                    <p>• Standard query limitations</p>
                    <p>• Basic workspace logging</p>
                  </div>
                  <Button
                    disabled={activePlan === "free" || isProcessingCheckout}
                    className="w-full bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-white text-xs font-semibold rounded-lg h-9"
                  >
                    {activePlan === "free" ? "Active Plan" : "Downgrade"}
                  </Button>
                </div>

                {/* Pro plan column */}
                <div className="p-4 rounded-xl bg-indigo-950/5 border border-indigo-500/10 space-y-4 flex flex-col justify-between relative overflow-hidden">
                  <div className="absolute top-0 right-0 bg-indigo-500/10 border-l border-b border-indigo-500/20 text-indigo-400 px-2 py-0.5 rounded-bl text-[8px] font-black uppercase tracking-wider">
                    Popular
                  </div>
                  <div className="space-y-2">
                    <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider">Grow</span>
                    <h3 className="text-xl font-bold text-white">Pro Plan</h3>
                    <p className="text-[10px] text-zinc-400 leading-normal">Optimized parameters for small offices and startups.</p>
                    <div className="flex items-baseline gap-1 mt-2">
                      <span className="text-2xl font-black text-white">$49</span>
                      <span className="text-[10px] text-zinc-500">/ mo</span>
                    </div>
                  </div>
                  <div className="space-y-3 pt-3 border-t border-zinc-900/60 text-[10px] text-zinc-300 flex-1">
                    <p>• Unlimited queries & rate limits</p>
                    <p>• Custom WhatsApp automations</p>
                    <p>• Travel agent confirmations</p>
                    <p>• Document summaries & exports</p>
                  </div>
                  <Button
                    onClick={() => handleUpgrade("pro")}
                    disabled={activePlan === "pro" || isProcessingCheckout}
                    className="w-full bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-lg h-9 shadow-md shadow-indigo-600/10 cursor-pointer"
                  >
                    {activePlan === "pro" ? "Active Plan" : "Upgrade Free"}
                  </Button>
                </div>

                {/* Premium plan column */}
                <div className="p-4 rounded-xl bg-zinc-900/15 border border-zinc-900 space-y-4 flex flex-col justify-between">
                  <div className="space-y-2">
                    <span className="text-[10px] font-bold text-cyan-400 uppercase tracking-wider">Enterprise</span>
                    <h3 className="text-xl font-bold text-white">Premium</h3>
                    <p className="text-[10px] text-zinc-400 leading-normal">Autonomous clusters for dedicated corporate agencies.</p>
                    <div className="flex items-baseline gap-1 mt-2">
                      <span className="text-2xl font-black text-white">$99</span>
                      <span className="text-[10px] text-zinc-500">/ mo</span>
                    </div>
                  </div>
                  <div className="space-y-3 pt-3 border-t border-zinc-900/60 text-[10px] text-zinc-400 flex-1">
                    <p>• Multi-agent pipeline clustering</p>
                    <p>• Dedicated hosting endpoints</p>
                    <p>• Advanced document layout analysis</p>
                    <p>• Priority webhook queues</p>
                  </div>
                  <Button
                    onClick={() => handleUpgrade("premium")}
                    disabled={activePlan === "premium" || isProcessingCheckout}
                    className="w-full bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-white text-xs font-semibold rounded-lg h-9 cursor-pointer"
                  >
                    {activePlan === "premium" ? "Active Plan" : "Upgrade Free"}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
