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
      
      addToast({ type: "success", title: "Configuration Trained", description: "AI Agent trained with business profile successfully." });
      setIsSaved(true);
    } catch (e: unknown) {
      console.error(e);
      const err = e as { response?: { data?: { error?: string } }; message?: string };
      addToast({ type: "error", title: "Training Failed", description: err.response?.data?.error || err.message });
    }
  };

  return (
    <div className="space-y-6 text-white max-w-4xl mx-auto">
      {/* Back button */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" className="text-zinc-400 hover:text-white" asChild>
          <Link href="/whatsapp">
            <ArrowLeft className="h-4 w-4 mr-1.5" /> Back to Channels
          </Link>
        </Button>
      </div>

      {!isSaved ? (
        <div className="space-y-6">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-white flex items-center gap-2">
              WhatsApp AI Customizer <Sparkles className="h-5 w-5 text-indigo-400" />
            </h1>
            <p className="text-zinc-400 text-sm mt-1">
              Train the LLM models on your products, customer support hours, brand tone, and customized Q&As.
            </p>
          </div>

          <BusinessSetupWizard
            onSave={handleSave}
            initialData={savedData || undefined}
          />
        </div>
      ) : (
        <Card className="border border-white/10 bg-zinc-950/40 p-8 text-center max-w-xl mx-auto space-y-6 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 via-violet-500/0 to-cyan-500/5 blur-2xl pointer-events-none" />
          
          <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 mx-auto animate-bounce">
            <CheckCircle2 className="h-8 w-8" />
          </div>

          <div className="space-y-2 relative z-10">
            <h2 className="text-xl font-bold text-white">AI Agent Trained Successfully!</h2>
            <p className="text-zinc-400 text-sm leading-relaxed">
              Your business customization guidelines have been compiled. The AI chatbot model has loaded these policies and is ready to resolve customer queries for <strong className="text-white">{savedData?.businessName}</strong>.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 justify-center relative z-10 pt-2">
            <Button
              onClick={() => setIsSaved(false)}
              variant="outline"
              className="border-white/10 hover:bg-white/5 text-zinc-300"
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
