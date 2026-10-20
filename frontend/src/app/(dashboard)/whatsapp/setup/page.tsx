"use client";

import * as React from "react";
import { ArrowLeft, CheckCircle2, Sparkles, MessageCircle } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { BusinessSetupWizard } from "@/components/whatsapp/BusinessSetupWizard";
import api from "@/lib/api";
import type { BusinessSetupData } from "@/types";
import { useToast } from "@/components/ui/toaster";

export default function WhatsAppSetupWizardPage() {
  const { addToast } = useToast();
  const [isSaved, setIsSaved] = React.useState(false);
  const [savedData, setSavedData] = React.useState<BusinessSetupData | null>(null);

  React.useEffect(() => {
    // Check if initial training config exists
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("nexusforge_biz_setup");
      if (stored) {
        try {
          // eslint-disable-next-line react-hooks/set-state-in-effect
          setSavedData(JSON.parse(stored));
        } catch (e) {
          console.error(e);
        }
      }
    }
  }, []);

  const handleSave = async (data: BusinessSetupData) => {
    try {
      setSavedData(data);
      if (typeof window !== "undefined") {
        localStorage.setItem("nexusforge_biz_setup", JSON.stringify(data));
      }
      
      await api.post("/whatsapp/session/setup-business", {
        businessName: data.businessName,
        industry: data.industry,
        services: data.services,
        products: data.products,
        brandTone: data.brandVoice,
        faqData: data.faq.map(f => ({ question: f.question, answer: f.answer })),
        supportDetails: `Hours: ${data.supportHours}. Contact: ${data.supportEmail}. AutoReply: ${data.autoReply ? 'Enabled' : 'Disabled'}`,
        isAiEnabled: data.autoReply,
      });
      
      addToast({ type: "success", title: "Configuration Saved", description: "Personal AI Assistant profile trained and activated successfully." });
      setIsSaved(true);
    } catch (e: unknown) {
      console.error(e);
      const err = e as { response?: { data?: { error?: string } }; message?: string };
      addToast({ type: "error", title: "Setup Failed", description: err.response?.data?.error || err.message });
    }
  };

  return (
    <div className="space-y-6 text-slate-800 dark:text-white max-w-4xl mx-auto">
      {/* Back button */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" className="text-slate-600 hover:text-slate-900 dark:text-zinc-400 dark:hover:text-white" asChild>
          <Link href="/whatsapp">
            <ArrowLeft className="h-4 w-4 mr-1.5" /> Back to WhatsApp
          </Link>
        </Button>
      </div>

      {!isSaved ? (
        <div className="space-y-6">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
              WhatsApp Personal AI Assistant Setup <Sparkles className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
            </h1>
            <p className="text-slate-600 dark:text-zinc-400 text-sm mt-1">
              Customize your WhatsApp AI Assistant: name, personality tone, focus areas, custom notes, and auto-reply preferences.
            </p>
          </div>

          <BusinessSetupWizard
            onSave={handleSave}
            initialData={savedData || undefined}
          />
        </div>
      ) : (
        <Card className="border border-slate-200 dark:border-white/10 bg-white dark:bg-zinc-950/40 p-8 text-center max-w-xl mx-auto space-y-6 shadow-xl relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 via-violet-500/0 to-cyan-500/5 blur-2xl pointer-events-none" />
          
          <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400 mx-auto animate-bounce">
            <CheckCircle2 className="h-8 w-8" />
          </div>

          <div className="space-y-2 relative z-10">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">Personal AI Assistant Ready!</h2>
            <p className="text-slate-600 dark:text-zinc-400 text-sm leading-relaxed">
              Your personal assistant has been configured and trained. It will now assist you and respond directly on WhatsApp as <strong className="text-slate-900 dark:text-white">{savedData?.businessName || 'your Personal Assistant'}</strong>.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 justify-center relative z-10 pt-2">
            <Button
              onClick={() => setIsSaved(false)}
              variant="outline"
              className="border-slate-200 dark:border-white/10 hover:bg-slate-50 dark:hover:bg-white/5 text-slate-700 dark:text-zinc-300"
            >
              Reconfigure Profile
            </Button>
            <Button className="bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/15" asChild>
              <Link href="/whatsapp">
                <MessageCircle className="h-4.5 w-4.5 mr-1.5" /> Open Chat Channels
              </Link>
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
}
