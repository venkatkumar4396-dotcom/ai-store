"use client";

import * as React from "react";
import { Plus, Trash, Check, ArrowRight, ArrowLeft, Bot, Sparkles, HelpCircle, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import type { BusinessSetupData } from "@/types";

interface BusinessSetupWizardProps {
  onSave: (data: BusinessSetupData) => void;
  initialData?: Partial<BusinessSetupData>;
}

export function BusinessSetupWizard({ onSave, initialData }: BusinessSetupWizardProps) {
  const [step, setStep] = React.useState(1);
  const totalSteps = 5;

  const [formData, setFormData] = React.useState<BusinessSetupData>({
    businessName: initialData?.businessName || "",
    industry: initialData?.industry || "",
    description: initialData?.description || "",
    services: initialData?.services || [],
    products: initialData?.products || [],
    brandVoice: initialData?.brandVoice || "friendly",
    greetingMessage: initialData?.greetingMessage || "Hello! Welcome to our store. How can I help you today?",
    faq: initialData?.faq || [{ question: "", answer: "" }],
    supportHours: initialData?.supportHours || "9 AM - 5 PM EST",
    supportEmail: initialData?.supportEmail || "",
    autoReply: initialData?.autoReply ?? true,
  });

  const [newProduct, setNewProduct] = React.useState("");
  const [newService, setNewService] = React.useState("");

  const updateField = <K extends keyof BusinessSetupData>(key: K, value: BusinessSetupData[K]) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  const addProduct = () => {
    if (newProduct.trim()) {
      updateField("products", [...formData.products, newProduct.trim()]);
      setNewProduct("");
    }
  };

  const removeProduct = (index: number) => {
    updateField("products", formData.products.filter((_, i) => i !== index));
  };

  const addService = () => {
    if (newService.trim()) {
      updateField("services", [...formData.services, newService.trim()]);
      setNewService("");
    }
  };

  const removeService = (index: number) => {
    updateField("services", formData.services.filter((_, i) => i !== index));
  };

  const addFaq = () => {
    updateField("faq", [...formData.faq, { question: "", answer: "" }]);
  };

  const removeFaq = (index: number) => {
    updateField("faq", formData.faq.filter((_, i) => i !== index));
  };

  const updateFaq = (index: number, key: "question" | "answer", value: string) => {
    const updated = formData.faq.map((item, i) => {
      if (i === index) {
        return { ...item, [key]: value };
      }
      return item;
    });
    updateField("faq", updated);
  };

  const nextStep = () => {
    setStep((prev) => Math.min(prev + 1, totalSteps));
  };

  const prevStep = () => {
    setStep((prev) => Math.max(prev - 1, 1));
  };

  const handleSubmit = () => {
    onSave(formData);
  };

  const progressPercentage = (step / totalSteps) * 100;

  return (
    <Card className="w-full border border-white/10 bg-zinc-950/40 relative">
      <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full blur-2xl pointer-events-none" />

      <CardHeader>
        <div className="flex items-center justify-between gap-4 mb-2">
          <div className="flex items-center gap-2 text-indigo-400">
            <Bot className="h-5 w-5" />
            <span className="text-sm font-semibold uppercase tracking-wider">AI Customizer</span>
          </div>
          <span className="text-xs text-zinc-500 font-medium">Step {step} of {totalSteps}</span>
        </div>
        <CardTitle className="text-xl text-white">Business AI Customization</CardTitle>
        <CardDescription className="text-zinc-400 text-sm">
          Train your WhatsApp Business AI Agent on your business profile, services, and FAQ.
        </CardDescription>
        <div className="pt-2">
          <Progress value={progressPercentage} className="h-1.5 bg-zinc-800" />
        </div>
      </CardHeader>

      <CardContent className="py-6 min-h-[350px]">
        {/* STEP 1: BUSINESS PROFILE */}
        {step === 1 && (
          <div className="space-y-4">
            <h3 className="text-base font-semibold text-white flex items-center gap-2 mb-2">
              <Sparkles className="h-4.5 w-4.5 text-indigo-400" />
              1. Business Profile
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="biz-name">Business Name</Label>
                <Input
                  id="biz-name"
                  value={formData.businessName}
                  onChange={(e) => updateField("businessName", e.target.value)}
                  placeholder="e.g. NexusForge Solutions"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="biz-industry">Industry</Label>
                <Input
                  id="biz-industry"
                  value={formData.industry}
                  onChange={(e) => updateField("industry", e.target.value)}
                  placeholder="e.g. Technology SaaS"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="biz-desc">Business Description</Label>
              <Textarea
                id="biz-desc"
                value={formData.description}
                onChange={(e) => updateField("description", e.target.value)}
                placeholder="Describe your company, what you sell, and your core values..."
                className="h-28"
              />
            </div>
          </div>
        )}

        {/* STEP 2: PRODUCTS & SERVICES */}
        {step === 2 && (
          <div className="space-y-6">
            <h3 className="text-base font-semibold text-white flex items-center gap-2">
              <Sparkles className="h-4.5 w-4.5 text-indigo-400" />
              2. Products & Services
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Products Setup */}
              <div className="space-y-3">
                <Label>Products Offered</Label>
                <div className="flex gap-2">
                  <Input
                    value={newProduct}
                    onChange={(e) => setNewProduct(e.target.value)}
                    placeholder="Add a product..."
                  />
                  <Button type="button" onClick={addProduct} size="icon" className="shrink-0 bg-zinc-800 hover:bg-zinc-700">
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                <div className="max-h-40 overflow-y-auto space-y-1.5 border border-white/5 bg-zinc-950/20 p-2 rounded-lg">
                  {formData.products.length === 0 ? (
                    <span className="text-xs text-zinc-500 block p-2">No products added.</span>
                  ) : (
                    formData.products.map((p, idx) => (
                      <div key={idx} className="flex items-center justify-between bg-white/5 px-3 py-1.5 rounded text-sm">
                        <span>{p}</span>
                        <button onClick={() => removeProduct(idx)} className="text-zinc-500 hover:text-rose-400">
                          <Trash className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Services Setup */}
              <div className="space-y-3">
                <Label>Services Offered</Label>
                <div className="flex gap-2">
                  <Input
                    value={newService}
                    onChange={(e) => setNewService(e.target.value)}
                    placeholder="Add a service..."
                  />
                  <Button type="button" onClick={addService} size="icon" className="shrink-0 bg-zinc-800 hover:bg-zinc-700">
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                <div className="max-h-40 overflow-y-auto space-y-1.5 border border-white/5 bg-zinc-950/20 p-2 rounded-lg">
                  {formData.services.length === 0 ? (
                    <span className="text-xs text-zinc-500 block p-2">No services added.</span>
                  ) : (
                    formData.services.map((s, idx) => (
                      <div key={idx} className="flex items-center justify-between bg-white/5 px-3 py-1.5 rounded text-sm">
                        <span>{s}</span>
                        <button onClick={() => removeService(idx)} className="text-zinc-500 hover:text-rose-400">
                          <Trash className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* STEP 3: BRAND VOICE & GREETING */}
        {step === 3 && (
          <div className="space-y-4">
            <h3 className="text-base font-semibold text-white flex items-center gap-2 mb-2">
              <Sparkles className="h-4.5 w-4.5 text-indigo-400" />
              3. AI Personality & Greetings
            </h3>
            <div className="space-y-1.5">
              <Label htmlFor="brand-voice">Brand Voice / Tone</Label>
              <Select
                value={formData.brandVoice}
                onValueChange={(val) => updateField("brandVoice", val as BusinessSetupData["brandVoice"])}
              >
                <SelectTrigger id="brand-voice" className="bg-white/5 border-white/10 text-white">
                  <SelectValue placeholder="Select a tone" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="professional">Professional & Formal</SelectItem>
                  <SelectItem value="friendly">Friendly & Welcoming</SelectItem>
                  <SelectItem value="casual">Casual & Relaxed</SelectItem>
                  <SelectItem value="formal">Informative & Analytical</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="greeting-msg">Greeting Message</Label>
              <Textarea
                id="greeting-msg"
                value={formData.greetingMessage}
                onChange={(e) => updateField("greetingMessage", e.target.value)}
                placeholder="Define what the AI says when a customer messages you for the first time..."
                className="h-24"
              />
            </div>
          </div>
        )}

        {/* STEP 4: FAQ BUILDER */}
        {step === 4 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between gap-4">
              <h3 className="text-base font-semibold text-white flex items-center gap-2">
                <HelpCircle className="h-4.5 w-4.5 text-indigo-400" />
                4. Knowledge Base (FAQ)
              </h3>
              <Button type="button" onClick={addFaq} variant="outline" className="h-8 border-indigo-500/20 text-indigo-400 hover:bg-indigo-500/10">
                <Plus className="h-3.5 w-3.5 mr-1" /> Add FAQ
              </Button>
            </div>
            <div className="max-h-72 overflow-y-auto space-y-4 pr-2">
              {formData.faq.map((item, idx) => (
                <div key={idx} className="p-3 bg-white/5 border border-white/5 rounded-lg space-y-2 relative">
                  <button
                    onClick={() => removeFaq(idx)}
                    className="absolute right-3 top-3 text-zinc-500 hover:text-rose-400"
                    title="Remove"
                  >
                    <Trash className="h-3.5 w-3.5" />
                  </button>
                  <div className="space-y-1">
                    <Label className="text-xs">Question {idx + 1}</Label>
                    <Input
                      value={item.question}
                      onChange={(e) => updateFaq(idx, "question", e.target.value)}
                      placeholder="e.g. What is your refund policy?"
                      className="h-8 text-xs"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Answer</Label>
                    <Textarea
                      value={item.answer}
                      onChange={(e) => updateFaq(idx, "answer", e.target.value)}
                      placeholder="Answer to train the AI with..."
                      className="h-16 text-xs"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* STEP 5: SCHEDULE & COMPLETION */}
        {step === 5 && (
          <div className="space-y-6">
            <h3 className="text-base font-semibold text-white flex items-center gap-2">
              <Sparkles className="h-4.5 w-4.5 text-indigo-400" />
              5. Live Auto-Replies & Schedule
            </h3>
            <div className="p-4 bg-indigo-600/10 border border-indigo-500/20 rounded-xl flex items-center justify-between gap-4">
              <div className="space-y-0.5">
                <span className="font-semibold text-sm text-white">Enable AI Agent Auto-replies</span>
                <p className="text-xs text-indigo-300">Allow AI to reply automatically when new chats are received.</p>
              </div>
              <Switch
                checked={formData.autoReply}
                onCheckedChange={(checked) => updateField("autoReply", checked)}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="support-hours">Support Hours</Label>
                <Input
                  id="support-hours"
                  value={formData.supportHours}
                  onChange={(e) => updateField("supportHours", e.target.value)}
                  placeholder="e.g. Mon-Fri 9:00 AM - 5:00 PM"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="support-email">Escalation Email</Label>
                <Input
                  id="support-email"
                  type="email"
                  value={formData.supportEmail}
                  onChange={(e) => updateField("supportEmail", e.target.value)}
                  placeholder="support@company.com"
                />
              </div>
            </div>
          </div>
        )}
      </CardContent>

      <CardFooter className="p-6 border-t border-white/5 flex items-center justify-between gap-4">
        <Button
          onClick={prevStep}
          disabled={step === 1}
          variant="outline"
          className="border-white/10 hover:bg-white/5 text-zinc-300"
        >
          <ArrowLeft className="h-4 w-4 mr-1.5" /> Back
        </Button>

        {step < totalSteps ? (
          <Button onClick={nextStep} className="bg-indigo-600 hover:bg-indigo-500 text-white">
            Next <ArrowRight className="h-4 w-4 ml-1.5" />
          </Button>
        ) : (
          <Button onClick={handleSubmit} className="bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/20">
            <Save className="h-4 w-4 mr-1.5" /> Save Configuration
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}
