"use client";

import React, { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Compass,
  MapPin,
  Calendar,
  Users,
  User,
  DollarSign,
  Target,
  Settings,
  Send,
  RefreshCw,
  Globe,
  Utensils,
  Flame,
  Award,
  Sparkles,
  Search,
  BookOpen,
  Info,
  ChevronRight,
  TrendingUp,
  Map as MapIcon,
  Briefcase,
  HelpCircle,
  Play,
  CheckCircle2,
  AlertCircle,
  Loader2
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

import api from "@/lib/api";
import { useToast } from "@/components/ui/toaster";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// ── Types ──────────────────────────────────────────────────────────────────
interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

interface TripContext {
  origin?: string;
  destination?: string;
  coordinates?: { lat: number; lng: number };
  duration?: string;
  dates?: string;
  travelers?: string;
  budget?: string;
  style?: string;
  intent?: string;
  interests?: string[];
}

interface OllamaConfig {
  provider: "ollama" | "gemini";
  host: string;
  model: string;
}

type TabId = "chat" | "passport" | "map";

interface Specialization {
  id: string;
  name: string;
  emoji: string;
  tagline: string;
  color: string;
  themeColor: string;
  borderColor: string;
  glowColor: string;
  icon: React.ElementType;
  description: string;
  systemPromptAddendum: string;
  suggestions: string[];
}

// ── Specializations ────────────────────────────────────────────────────────
const SPECIALIZATIONS: Specialization[] = [
  {
    id: "general",
    name: "General Consultant",
    emoji: "🧭",
    tagline: "Your expert all-around travel companion",
    color: "from-indigo-600 to-violet-500",
    themeColor: "#6366f1",
    borderColor: "rgba(99, 102, 241, 0.3)",
    glowColor: "rgba(99, 102, 241, 0.15)",
    icon: Globe,
    description: "Perfect for balanced trips that blend must-see tourist landmarks, outdoor highlights, local culinary hubs, and scenic highlights.",
    systemPromptAddendum: "You are in General Travel Consultant mode. Provide balanced advice covering historical landmarks, local walks, main sights, and popular secrets. Maintain a warm, encouraging tone.",
    suggestions: [
      "I want to explore Paris for a week. Suggest an itinerary.",
      "Help me plan a 5-day sightseeing trip to Tokyo.",
      "What are the absolute must-visit highlights of Rome?"
    ]
  },
  {
    id: "foodie",
    name: "Culinary Explorer",
    emoji: "🍜",
    tagline: "Savor local gastronomy and food culture",
    color: "from-amber-500 to-rose-500",
    themeColor: "#f59e0b",
    borderColor: "rgba(245, 158, 11, 0.3)",
    glowColor: "rgba(245, 158, 11, 0.15)",
    icon: Utensils,
    description: "Focuses on gastro-tourism, street food markets, hidden local dining hotspots, traditional bakeries, and authentic kitchen tours.",
    systemPromptAddendum: "You are in Culinary Explorer mode. You have an immense passion for local cuisine, traditional dishes, street food, dining spots, wine tasting, and food history. Frame every destination recommendations around what to eat, where locals dine, traditional markets, and cooking classes.",
    suggestions: [
      "Plan a foodie trip around Kyoto for 4 days.",
      "Where are the best street food markets and local bites in Bangkok?",
      "Suggest a wine and culinary tour plan for Barcelona."
    ]
  },
  {
    id: "adventure",
    name: "Thrill Seeker",
    emoji: "🧗",
    tagline: "Outdoor expeditions and intense adventures",
    color: "from-emerald-500 to-teal-500",
    themeColor: "#10b981",
    borderColor: "rgba(16, 185, 129, 0.3)",
    glowColor: "rgba(16, 185, 129, 0.15)",
    icon: Flame,
    description: "Focuses on rugged hiking trails, wilderness parks, water sports (scuba/surf), peaks, active navigation, and off-grid wildlife tours.",
    systemPromptAddendum: "You are in Thrill Seeker mode. You focus on active tourism, high energy, outdoor hiking, scuba diving, rock climbing, national parks, and wild nature exploration. Keep recommendations physical, adventurous, and centered around sports or natural landmarks.",
    suggestions: [
      "I'm going to Bali for adventure and surf. Give me a 6-day plan.",
      "Suggest the best hiking trails and active routes in Iceland.",
      "Plan a wilderness safari and tracking trip in Kenya."
    ]
  },
  {
    id: "luxury",
    name: "VIP Concierge",
    emoji: "👑",
    tagline: "Indulge in premium service and high comfort",
    color: "from-yellow-400 to-amber-600",
    themeColor: "#eab308",
    borderColor: "rgba(234, 179, 8, 0.3)",
    glowColor: "rgba(234, 179, 8, 0.15)",
    icon: Award,
    description: "Focuses on 5-star boutiques, exclusive private tours, wellness spas, fine-dining bistros, and luxury transit coordination.",
    systemPromptAddendum: "You are in VIP Concierge mode. Your tone is elegant, polished, and highly professional. Focus recommendations on high-end boutique properties, private guides, Michelin-star establishments, wellness retreats, and premium comforts.",
    suggestions: [
      "Show me a luxury weekend itinerary for Paris.",
      "Plan an exclusive, high-end resort itinerary in Maldives.",
      "I want a premium private tour and villa schedule for Santorini."
    ]
  },
  {
    id: "budget",
    name: "Backpack Expert",
    emoji: "🎒",
    tagline: "Explore the world while keeping it affordable",
    color: "from-sky-500 to-blue-600",
    themeColor: "#0ea5e9",
    borderColor: "rgba(14, 165, 233, 0.3)",
    glowColor: "rgba(14, 165, 233, 0.15)",
    icon: Briefcase,
    description: "Focuses on social hostels, self-guided paths, free community sites, budget street stalls, and affordable public transit advice.",
    systemPromptAddendum: "You are in Backpack Expert mode. Focus recommendations on low-cost options, social hostels, public transportation hacks, free entry spots, delicious cheap street stalls, and smart value tips. Guide them on saving money without compromising on experiences.",
    suggestions: [
      "I'm backpacking Portugal for 10 days on a budget. Guide me.",
      "Suggest budget eats and free walks in London.",
      "How can I explore Vietnam cheaply for 2 weeks?"
    ]
  }
];

// ── Destination coordinates ───────────────────────────────────────────────
const DESTINATION_COORDS: Record<string, { lat: number; lng: number }> = {
  bali: { lat: -8.3405, lng: 115.092 },
  tokyo: { lat: 35.6762, lng: 139.6503 },
  paris: { lat: 48.8566, lng: 2.3522 },
  rome: { lat: 41.9028, lng: 12.4964 },
  santorini: { lat: 36.3932, lng: 25.4615 },
  barcelona: { lat: 41.3851, lng: 2.1734 },
  maldives: { lat: 3.2028, lng: 73.2207 },
  kyoto: { lat: 35.0116, lng: 135.7681 },
  dubai: { lat: 25.2048, lng: 55.2708 },
  "new york": { lat: 40.7128, lng: -74.006 },
  thailand: { lat: 15.87, lng: 100.9925 },
  bangkok: { lat: 13.7563, lng: 100.5018 },
  phuket: { lat: 7.8804, lng: 98.3922 },
  greece: { lat: 39.0742, lng: 21.8243 },
  athens: { lat: 37.9838, lng: 23.7275 },
  morocco: { lat: 31.7917, lng: -7.0926 },
  marrakesh: { lat: 31.6295, lng: -7.9811 },
  iceland: { lat: 64.9631, lng: -19.0208 },
  vietnam: { lat: 14.0583, lng: 108.2772 },
  peru: { lat: -9.19, lng: -75.0152 },
  lima: { lat: -12.0464, lng: -77.0428 },
  "machu picchu": { lat: -13.1631, lng: -72.545 },
  switzerland: { lat: 46.8182, lng: 8.2275 },
  kenya: { lat: -0.0236, lng: 37.9062 },
  nairobi: { lat: -1.2921, lng: 36.8219 },
  australia: { lat: -25.2744, lng: 133.7751 },
  sydney: { lat: -33.8688, lng: 151.2093 },
  mexico: { lat: 23.6345, lng: -102.5528 },
  "mexico city": { lat: 19.4326, lng: -99.1332 },
  london: { lat: 51.5074, lng: -0.1278 },
  amsterdam: { lat: 52.3676, lng: 4.9041 },
  singapore: { lat: 1.3521, lng: 103.8198 },
  "new zealand": { lat: -40.9006, lng: 174.886 },
  auckland: { lat: -36.8485, lng: 174.7633 },
  portugal: { lat: 39.3999, lng: -8.2245 },
  lisbon: { lat: 38.7169, lng: -9.1399 },
  istanbul: { lat: 41.0082, lng: 28.9784 },
  prague: { lat: 50.0755, lng: 14.4378 },
  venice: { lat: 45.4408, lng: 12.3155 },
  florence: { lat: 43.7696, lng: 11.2558 },
  madrid: { lat: 40.4168, lng: -3.7038 },
  berlin: { lat: 52.52, lng: 13.405 },
  munich: { lat: 48.1351, lng: 11.582 },
  vienna: { lat: 48.2082, lng: 16.3738 },
  budapest: { lat: 47.4979, lng: 19.0402 },
  cairo: { lat: 30.0444, lng: 31.2357 },
  "cape town": { lat: -33.9249, lng: 18.4241 },
  "rio de janeiro": { lat: -22.9068, lng: -43.1729 },
  "buenos aires": { lat: -34.6037, lng: -58.3816 },
  toronto: { lat: 43.6532, lng: -79.3832 },
  vancouver: { lat: 49.2827, lng: -123.1207 },
  mumbai: { lat: 19.076, lng: 72.8777 },
  delhi: { lat: 28.6139, lng: 77.209 },
  seoul: { lat: 37.5665, lng: 126.978 },
  shanghai: { lat: 31.2304, lng: 121.4737 },
  beijing: { lat: 39.9042, lng: 116.4074 },
  "hong kong": { lat: 22.3193, lng: 114.1694 },
  taipei: { lat: 25.033, lng: 121.5654 },
  hawaii: { lat: 19.8968, lng: -155.5828 }
};

function guessCoordinates(text: string): { lat: number; lng: number } | null {
  const lower = text.toLowerCase();
  for (const [key, coords] of Object.entries(DESTINATION_COORDS)) {
    if (lower.includes(key)) return coords;
  }
  return null;
}

function guessDestination(text: string): string | null {
  const lower = text.toLowerCase();
  for (const key of Object.keys(DESTINATION_COORDS)) {
    if (lower.includes(key)) return key.charAt(0).toUpperCase() + key.slice(1);
  }
  return null;
}

// ── System prompt builder ─────────────────────────────────────────────────
function buildSystemPrompt(specId: string) {
  const spec = SPECIALIZATIONS.find(s => s.id === specId) || SPECIALIZATIONS[0];
  
  return `You are Compass, an expert AI travel consultant with 20 years of experience crafting bespoke travel experiences. You think like a seasoned human travel advisor — warm, knowledgeable, and deeply personal.

SPECIALIZATION PROFILE:
${spec.systemPromptAddendum}

CORE BEHAVIOR:
- Never overwhelm with choices. Present 2–3 curated options maximum.
- Ask ONE question at a time to learn about the traveler.
- Always explain WHY you recommend something — connect it to what you know about them.
- Remember every preference shared and use it in future suggestions.
- Be proactive — suggest things they haven't thought to ask.
- Write naturally and conversationally, like a trusted friend who happens to be an expert.
- Keep responses SHORT on mobile — max 3 paragraphs unless building an itinerary.

CONVERSATION FLOW:
1. Start by warmly greeting and asking where they dream of going (or help them choose).
2. Ask about trip purpose/intent (honeymoon, adventure, relaxation, family, etc.)
3. Ask about duration and rough dates.
4. Ask about budget range (budget / mid-range / luxury).
5. Ask about travel style and interests (beaches, food, history, adventure, photography…).
6. Then: craft a personalized itinerary with morning/afternoon/evening activities, meals, estimated costs, and insider tips.

ITINERARY FORMAT (when building one):
Structure days clearly with emojis for visual scanning. Include:
- Morning: [activity + tip]
- Afternoon: [activity + tip]
- Evening: [meal/activity + tip]
- Insider tip: [something most tourists miss]
- Est. daily cost: [range]

WHEN USER ASKS TO CHANGE THINGS:
Adjust only what they ask. Preserve everything else. Say what you changed and why.

TONE: Warm, expert, never robotic. Use "you" not "the traveler". Occasional gentle enthusiasm is welcome. Never use bullet-point lists for casual conversation — only for itineraries.

Keep responses concise. Ask your next question naturally at the end of each response.`;
}

// ── Context extractor ──────────────────────────────────────────────────────
function extractContext(messages: Message[], prev: TripContext): TripContext {
  const text = messages.map(m => m.content).join(" ");
  const ctx: TripContext = { ...prev };
  
  if (!ctx.destination) {
    const d = guessDestination(text);
    if (d) {
      ctx.destination = d;
      ctx.coordinates = guessCoordinates(text) ?? undefined;
    }
  }

  if (!ctx.origin) {
    const fromMatch = text.match(/(?:from|starting in|out of)\s+([A-Za-z\s]{3,20})(?:\s+to|$)/i);
    if (fromMatch) {
      const guessed = guessDestination(fromMatch[1].trim());
      ctx.origin = guessed || fromMatch[1].trim();
    }
  }
  
  // Try to match duration like "5 days", "2 weeks", "3 nights"
  const dur = text.match(/(\d+)\s*(day|week|night)/i);
  if (dur && !ctx.duration) {
    const num = dur[1];
    const unit = dur[2];
    ctx.duration = `${num} ${unit}${parseInt(num) > 1 ? "s" : ""}`;
  }
  
  // Try to match dates like "in October", "June 15th", "next summer" or date pattern
  const datesMatch = text.match(/(january|february|march|april|may|june|july|august|september|october|november|december|summer|winter|spring|autumn)\s*(\d{4})?/i);
  if (datesMatch && !ctx.dates) {
    ctx.dates = datesMatch[0].charAt(0).toUpperCase() + datesMatch[0].slice(1);
  }
  
  if (!ctx.budget) {
    if (/luxury|high.end|splurge|five star|premium|comfort/i.test(text)) ctx.budget = "Luxury";
    else if (/budget|cheap|backpack|affordable|low cost/i.test(text)) ctx.budget = "Budget";
    else if (/mid.range|moderate|decent|reasonable/i.test(text)) ctx.budget = "Mid-range";
  }
  
  if (!ctx.intent) {
    if (/honeymoon|romantic|couple/i.test(text)) ctx.intent = "Honeymoon";
    else if (/adventure|thrill|climb|hiking|dive|trek/i.test(text)) ctx.intent = "Adventure";
    else if (/relax|unwind|peaceful|spa|beach|calm/i.test(text)) ctx.intent = "Relaxation";
    else if (/family|kids|children|parents/i.test(text)) ctx.intent = "Family";
    else if (/solo|alone|just me/i.test(text)) ctx.intent = "Solo";
    else if (/business|work|conference/i.test(text)) ctx.intent = "Business";
  }
  
  const map: Record<string, string> = {
    beach: "Beaches",
    food: "Food",
    history: "History",
    adventure: "Adventure",
    photography: "Photography",
    hiking: "Hiking",
    nightlife: "Nightlife",
    culture: "Culture",
    nature: "Nature",
    shopping: "Shopping",
    museum: "Museums",
    monument: "Landmarks",
    wine: "Wine Tasting",
    art: "Art & Galleries"
  };
  
  const found = Object.entries(map)
    .filter(([k]) => new RegExp(k, "i").test(text))
    .map(([, v]) => v);
    
  if (found.length) {
    ctx.interests = [...new Set([...(ctx.interests || []), ...found])];
  }
  
  if (!ctx.travelers) {
    const tm = text.match(/(\d+)\s*(people|person|traveler|adult)/i);
    if (tm) {
      ctx.travelers = `${tm[1]} ${tm[2]}`;
    } else if (/solo|alone|just me/i.test(text)) {
      ctx.travelers = "Solo traveler";
    } else if (/couple|two of us|my partner/i.test(text)) {
      ctx.travelers = "2 (Couple)";
    }
  }
  
  return ctx;
}

export default function CompassPage() {
  const { addToast } = useToast();
  const [activeTab, setActiveTab] = useState<TabId>("chat");
  const [specialization, setSpecialization] = useState<string>("general");
  
  // Config state
  const [config, setConfig] = useState<OllamaConfig>({
    provider: "gemini",
    host: "http://localhost:11434",
    model: "gemini-2.0-flash",
  });
  
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [tripContext, setTripContext] = useState<TripContext>({});
  const [debouncedMapUrl, setDebouncedMapUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!tripContext.destination) {
      setDebouncedMapUrl(null);
      return;
    }
    const timer = setTimeout(() => {
      setDebouncedMapUrl(`https://maps.google.com/maps?q=${encodeURIComponent(tripContext.destination!)}&z=11&output=embed`);
    }, 600);
    return () => clearTimeout(timer);
  }, [tripContext.destination]);
  
  // Streaming buffer state
  const [streamingContent, setStreamingContent] = useState("");
  const chatEndRef = useRef<HTMLDivElement>(null);
  
  // Load configuration from local storage
  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedConfig = localStorage.getItem("nexora_compass_config");
      if (savedConfig) {
        try {
          setConfig(JSON.parse(savedConfig));
        } catch (e) {
          console.error("Failed to parse config from localStorage", e);
        }
      }
    }
    
    // Seed initial message from Compass
    setMessages([
      {
        id: "init-1",
        role: "assistant",
        content: "Warm greetings! 🧭 I'm Compass, your personal AI travel consultant. Where in the world are you dreaming of traveling next? Let me know, or tell me what kind of trip you seek, and we'll craft the perfect journey together.",
        timestamp: new Date()
      }
    ]);
  }, []);

  // Save config helper
  const handleSaveConfig = (newConfig: OllamaConfig) => {
    setConfig(newConfig);
    if (typeof window !== "undefined") {
      localStorage.setItem("nexora_compass_config", JSON.stringify(newConfig));
    }
    addToast({
      type: "success",
      title: "Configuration Saved",
      description: `Switched provider to ${newConfig.provider === "ollama" ? "Local Ollama" : "Nexora Cloud (Gemini)"}.`
    });
    setIsSettingsOpen(false);
  };

  // Scroll chat window to bottom
  const scrollToBottom = useCallback(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, streamingContent, scrollToBottom]);

  // Handle switching specialization
  const handleSpecializationChange = (specId: string) => {
    setSpecialization(specId);
    const spec = SPECIALIZATIONS.find(s => s.id === specId);
    if (!spec) return;
    
    // Insert a contextual advisory message from the newly selected specialist
    const messageId = `spec-change-${Date.now()}`;
    const newMsg: Message = {
      id: messageId,
      role: "assistant",
      content: `*A travel expert steps forward: You are now planning with the **${spec.name}** specialization. ${spec.emoji}*\n\n"Hello! I'm ready to tailor this trip with a deep focus on ${spec.tagline.toLowerCase()}. Tell me: what aspect of this style are you most excited to incorporate into our plan?"`,
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, newMsg]);
    
    addToast({
      type: "info",
      title: `${spec.name} Activated`,
      description: `Compass specialization updated to: ${spec.name}.`
    });
  };

  // Main chat submit handler
  const handleSubmit = async (text: string) => {
    if (!text.trim() || isLoading) return;
    
    const userMsg: Message = {
      id: `msg-${Date.now()}-user`,
      role: "user",
      content: text,
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, userMsg]);
    setInputValue("");
    setIsLoading(true);
    setStreamingContent("");
    
    // Update passport context
    const nextContext = extractContext([...messages, userMsg], tripContext);
    setTripContext(nextContext);
    
    // Automatically switch tabs if a destination is detected and we are not on map/passport
    if (nextContext.destination && !tripContext.destination) {
      setActiveTab("map");
      addToast({
        type: "success",
        title: `Destination Detected: ${nextContext.destination}`,
        description: "Google Maps and Trip Passport synced."
      });
    }

    // Format chat history for AI request
    const promptHistory = [
      { role: "system", content: buildSystemPrompt(specialization) },
      ...messages.map(m => ({ role: m.role, content: m.content })),
      { role: "user", content: text }
    ];

    if (config.provider === "ollama") {
      // Direct stream local Ollama
      await requestOllama(promptHistory);
    } else {
      // Request Gemini through Nexora Backend
      await requestGeminiBackend(promptHistory);
    }
  };

  const handleUpdatePassportField = (key: keyof TripContext, value: string) => {
    setTripContext(prev => {
      const next = { ...prev, [key]: value };
      if (key === "destination") {
        next.coordinates = guessCoordinates(value) ?? undefined;
      }
      return next;
    });
  };

  const handleAddInterest = (interest: string) => {
    setTripContext(prev => {
      const interests = prev.interests || [];
      if (interests.includes(interest)) return prev;
      return { ...prev, interests: [...interests, interest] };
    });
  };

  const handleRemoveInterest = (interest: string) => {
    setTripContext(prev => {
      const interests = prev.interests || [];
      return { ...prev, interests: interests.filter(i => i !== interest) };
    });
  };

  const handleExecutePlan = async () => {
    if (!tripContext.destination) {
      addToast({
        type: "error",
        title: "Missing Destination",
        description: "Please specify a destination in your passport before generating the plan."
      });
      return;
    }

    const promptText = `Generate a complete trip plan and detailed daily itinerary based on my current passport details:
- Starting From (Origin): ${tripContext.origin || "unspecified origin"}
- Destination: ${tripContext.destination}
- Duration: ${tripContext.duration || "unspecified duration"}
- Travelers: ${tripContext.travelers || "1 person"}
- Budget: ${tripContext.budget || "mid-range"}
- Intent: ${tripContext.intent || "general sightseeing"}
- Dates: ${tripContext.dates || "flexible dates"}
- Interests: ${tripContext.interests?.join(", ") || "none specified yet"}

Please compile the full itinerary, suggest specific transit options (flights/trains) starting from my origin city, and structure the details.`;

    setActiveTab("chat");
    await handleSubmit(promptText);
  };

  // Direct Ollama Streaming from the client browser
  const requestOllama = async (history: { role: string; content: string }[]) => {
    let accumulatedContent = "";
    
    await streamOllama(
      config,
      history,
      (token) => {
        accumulatedContent += token;
        setStreamingContent(accumulatedContent);
      },
      () => {
        // Stream completed
        const botMsg: Message = {
          id: `msg-${Date.now()}-assistant`,
          role: "assistant",
          content: accumulatedContent,
          timestamp: new Date()
        };
        setMessages(prev => [...prev, botMsg]);
        setStreamingContent("");
        setIsLoading(false);
        // Refresh context
        setTripContext(prev => extractContext([botMsg], prev));
      },
      (errorMsg) => {
        setIsLoading(false);
        setStreamingContent("");
        addToast({
          type: "error",
          title: "Ollama Stream Error",
          description: errorMsg
        });
      }
    );
  };

  // Request Gemini backend API (returns complete content in one response)
  const requestGeminiBackend = async (history: { role: string; content: string }[]) => {
    try {
      const response = await api.post("/ai/chat", {
        messages: history,
        provider: "gemini",
        options: {
          model: config.model || "gemini-2.0-flash",
          temperature: 0.7
        }
      });
      
      const content = response.data?.content || "Sorry, I received an empty response.";
      
      const botMsg: Message = {
        id: `msg-${Date.now()}-assistant`,
        role: "assistant",
        content: content,
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, botMsg]);
      setIsLoading(false);
      
      // Refresh context
      setTripContext(prev => extractContext([botMsg], prev));
      
    } catch (e: any) {
      setIsLoading(false);
      const errMsg = e.response?.data?.error || e.message || "Failed to contact Gemini backend.";
      addToast({
        type: "error",
        title: "Nexora Cloud Chat Error",
        description: `${errMsg}. Verify backend server status or switch to local Ollama in settings.`
      });
    }
  };

  // Robust Ollama Stream Fetcher with buffer handling
  const streamOllama = async (
    cfg: OllamaConfig,
    history: { role: string; content: string }[],
    onToken: (t: string) => void,
    onDone: () => void,
    onError: (e: string) => void
  ) => {
    try {
      const res = await fetch(`${cfg.host}/api/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ model: cfg.model, messages: history, stream: true }),
      });
      
      if (!res.ok) {
        onError(`Ollama error ${res.status}: ${await res.text()}`);
        return;
      }
      
      const reader = res.body?.getReader();
      if (!reader) {
        onError("No response body received from local Ollama.");
        return;
      }
      
      const dec = new TextDecoder();
      let buffer = "";
      
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        buffer += dec.decode(value, { stream: true });
        const lines = buffer.split("\n");
        // Maintain the last line in the buffer as it might be incomplete
        buffer = lines.pop() || "";
        
        for (const line of lines) {
          if (!line.trim()) continue;
          try {
            const j = JSON.parse(line);
            if (j.message?.content) {
              onToken(j.message.content);
            }
            if (j.done) {
              onDone();
              return;
            }
          } catch {
            // Buffer split incomplete, skip parse and aggregate next stream
          }
        }
      }
      onDone();
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      onError(msg.includes("Failed to fetch")
        ? `Can't connect to Ollama at ${cfg.host}.\n\nRun: OLLAMA_ORIGINS=* ollama serve`
        : msg);
    }
  };

  const activeSpecData = useMemo(() => {
    return SPECIALIZATIONS.find(s => s.id === specialization) || SPECIALIZATIONS[0];
  }, [specialization]);

  const passportFields = [
    { label: "ORIGIN", value: tripContext.origin, icon: "🛫" },
    { label: "DESTINATION", value: tripContext.destination, icon: "📍" },
    { label: "DURATION", value: tripContext.duration, icon: "⏱️" },
    { label: "TRAVELERS", value: tripContext.travelers, icon: "👥" },
    { label: "BUDGET", value: tripContext.budget, icon: "💰" },
    { label: "INTENT", value: tripContext.intent, icon: "🎯" },
    { label: "DATES", value: tripContext.dates, icon: "🗓️" },
  ];
  
  const filledFieldsCount = passportFields.filter(f => f.value).length;
  const progressPercent = Math.round((filledFieldsCount / passportFields.length) * 100);

  const googleMapUrl = tripContext.coordinates
    ? `https://maps.google.com/maps?q=${tripContext.coordinates.lat},${tripContext.coordinates.lng}&z=11&output=embed`
    : null;

  return (
    <div className="space-y-6 text-zinc-100 pb-10">
      
      {/* ── Page Header ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/[0.06] pb-5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 via-indigo-600 to-violet-500 flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <Compass className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-white flex items-center gap-2">
              Compass Travel Advisor
              <Badge className="bg-indigo-600/20 text-indigo-400 hover:bg-indigo-600/30 border-indigo-500/20 text-xs">
                Active
              </Badge>
            </h1>
            <p className="text-zinc-400 text-xs mt-1">
              Bespoke travel designer with dynamic specializations and Google Maps sync.
            </p>
          </div>
        </div>

        {/* Configuration settings button */}
        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsSettingsOpen(true)}
          className="border-white/[0.08] bg-zinc-950/40 hover:bg-zinc-900 text-zinc-400 hover:text-white font-medium text-xs gap-1.5 h-9 shrink-0 self-start md:self-center"
        >
          <Settings className="h-4 w-4" />
          Config: {config.provider === "ollama" ? `Ollama (${config.model})` : `Gemini (${config.model})`}
        </Button>
      </div>

      {/* ── Specializations Selection Bar ── */}
      <div className="bg-zinc-950/20 border border-white/[0.06] rounded-2xl p-4">
        <div className="flex items-center gap-2 mb-3">
          <Sparkles className="h-4 w-4 text-amber-400" />
          <span className="text-xs font-bold uppercase tracking-wider text-zinc-400">Choose Compass's Specialization:</span>
        </div>
        
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {SPECIALIZATIONS.map((spec) => {
            const isActive = specialization === spec.id;
            
            return (
              <button
                key={spec.id}
                onClick={() => handleSpecializationChange(spec.id)}
                className={`relative flex flex-col items-start text-left p-3 rounded-xl border transition-all duration-300 group cursor-pointer overflow-hidden ${
                  isActive
                    ? `bg-gradient-to-br from-zinc-900 to-zinc-950 text-white`
                    : "bg-white/[0.02] border-white/[0.04] text-zinc-400 hover:bg-white/[0.04] hover:text-zinc-200"
                }`}
                style={{
                  borderColor: isActive ? spec.themeColor : "rgba(255, 255, 255, 0.04)",
                  boxShadow: isActive ? `0 0 16px ${spec.glowColor}` : "none"
                }}
              >
                {/* Visual glow indicator */}
                {isActive && (
                  <span
                    className={`absolute right-0 top-0 w-24 h-24 rounded-full blur-2xl opacity-10 bg-gradient-to-br ${spec.color}`}
                  />
                )}
                
                <div className="flex items-center gap-2 mb-1.5 relative z-10">
                  <span className={`text-xs font-bold ${isActive ? "text-white" : "text-zinc-300 group-hover:text-zinc-100"}`}>
                    {spec.name}
                  </span>
                </div>
                
                <span className="text-[10px] text-zinc-500 leading-tight line-clamp-2 relative z-10">
                  {spec.tagline}
                </span>
              </button>
            );
          })}
        </div>
        
        {/* Specialization Description */}
        <div className="mt-3 text-xs text-zinc-500 bg-white/[0.02] p-2 px-3 rounded-lg border border-white/[0.04]">
          <span className="font-semibold text-zinc-400">Current Advisor Role:</span> {activeSpecData.description}
        </div>
      </div>

      {/* ── Desktop Split Layout / Mobile Switcher ── */}
      {/* Desktop view */}
      <div className="hidden lg:grid grid-cols-12 gap-6 items-stretch">
        {/* Left Side: Chat Panel */}
        <div className="col-span-7 xl:col-span-8 flex flex-col bg-zinc-950/40 border border-white/[0.06] rounded-2xl overflow-hidden h-[640px]">
          {/* Panel Header */}
          <div className="px-5 py-4 border-b border-white/[0.06] bg-zinc-950/60 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div>
                <div className="text-sm font-semibold text-white">Compass {activeSpecData.name}</div>
                <div className="text-[11px] text-zinc-500">Local processing via {config.provider === "ollama" ? "Ollama" : "Google Gemini Cloud"}</div>
              </div>
            </div>
            
            {/* Quick stats indicator */}
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="border-white/10 text-zinc-400 bg-zinc-950/60 text-[10px]">
                {messages.length} Messages
              </Badge>
            </div>
          </div>

          {/* Chat Messages */}
          <div className="flex-1 overflow-y-auto p-5 space-y-4 custom-scrollbar">
            {messages.map((msg) => (
              <MessageBubble key={msg.id} msg={msg} />
            ))}
            
            {/* Streaming block */}
            {streamingContent && (
              <MessageBubble
                msg={{
                  id: "streaming",
                  role: "assistant",
                  content: streamingContent,
                  timestamp: new Date()
                }}
              />
            )}
            
            {isLoading && !streamingContent && <TypingDots />}
            
            <div ref={chatEndRef} />
          </div>

          {/* Suggestions Bar */}
          {messages.length === 1 && (
            <div className="px-5 py-2.5 border-t border-white/[0.04] bg-zinc-900/10">
              <div className="text-[10px] text-zinc-500 uppercase tracking-wider font-semibold mb-2">Suggested Prompts:</div>
              <div className="flex flex-wrap gap-2">
                {activeSpecData.suggestions.map((sug, i) => (
                  <button
                    key={i}
                    onClick={() => handleSubmit(sug)}
                    className="text-xs bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.06] hover:border-zinc-700 p-1.5 px-3 rounded-lg text-zinc-300 hover:text-white transition-all text-left truncate max-w-full cursor-pointer"
                  >
                    {sug}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Input Panel */}
          <div className="p-4 border-t border-white/[0.06] bg-zinc-950/60 flex items-center gap-2">
            <Input
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSubmit(inputValue)}
              placeholder={`Ask Compass (${activeSpecData.name}) anything...`}
              disabled={isLoading}
              className="bg-white/[0.03] border-white/[0.08] text-white placeholder-zinc-500 focus-visible:ring-indigo-500 flex-1 py-5"
            />
            <Button
              onClick={() => handleSubmit(inputValue)}
              disabled={isLoading || !inputValue.trim()}
              className="bg-indigo-600 hover:bg-indigo-500 text-white h-10 px-4 gap-1.5 rounded-xl cursor-pointer"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Right Side: Passport & Map Pane */}
        <div className="col-span-5 xl:col-span-4 flex flex-col bg-zinc-950/40 border border-white/[0.06] rounded-2xl overflow-hidden h-[640px]">
          <Tabs defaultValue="passport" className="flex-1 flex flex-col h-full">
            <TabsList className="bg-zinc-950/60 border-b border-white/[0.06] rounded-none p-1 flex justify-around">
              <TabsTrigger
                value="passport"
                className="flex-1 text-xs py-2.5 font-bold data-[state=active]:bg-white/[0.05] data-[state=active]:text-white hover:text-zinc-200 transition-all rounded-lg text-zinc-400"
              >
                <BookOpen className="h-4 w-4 mr-2" />
                Passport ({progressPercent}%)
              </TabsTrigger>
              <TabsTrigger
                value="map"
                className="flex-1 text-xs py-2.5 font-bold data-[state=active]:bg-white/[0.05] data-[state=active]:text-white hover:text-zinc-200 transition-all rounded-lg text-zinc-400"
              >
                <MapIcon className="h-4 w-4 mr-2" />
                Live Map
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="passport" className="flex-1 overflow-hidden m-0">
              <PassportPanel
                ctx={tripContext}
                pct={progressPercent}
                onChangeField={handleUpdatePassportField}
                onAddInterest={handleAddInterest}
                onRemoveInterest={handleRemoveInterest}
                onExecutePlan={handleExecutePlan}
                isExecuting={isLoading}
              />
            </TabsContent>
            
            <TabsContent value="map" className="flex-1 overflow-hidden m-0">
              <MapPanel ctx={tripContext} url={debouncedMapUrl} />
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Mobile view */}
      <div className="block lg:hidden">
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as TabId)} className="w-full">
          <TabsList className="w-full grid grid-cols-3 bg-zinc-950/60 border border-white/[0.06] rounded-xl p-1 mb-4">
            <TabsTrigger value="chat" className="text-xs py-2 font-bold rounded-lg data-[state=active]:bg-white/[0.05]">Chat</TabsTrigger>
            <TabsTrigger value="passport" className="text-xs py-2 font-bold rounded-lg data-[state=active]:bg-white/[0.05]">Passport</TabsTrigger>
            <TabsTrigger value="map" className="text-xs py-2 font-bold rounded-lg data-[state=active]:bg-white/[0.05]">Map</TabsTrigger>
          </TabsList>

          <TabsContent value="chat" className="bg-zinc-950/40 border border-white/[0.06] rounded-2xl overflow-hidden flex flex-col h-[520px] m-0">
            {/* Chat Body */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.map((msg) => (
                <MessageBubble key={msg.id} msg={msg} />
              ))}
              {streamingContent && (
                <MessageBubble
                  msg={{
                    id: "streaming",
                    role: "assistant",
                    content: streamingContent,
                    timestamp: new Date()
                  }}
                />
              )}
              {isLoading && !streamingContent && <TypingDots />}
              <div ref={chatEndRef} />
            </div>

            {/* Input */}
            <div className="p-3 border-t border-white/[0.06] bg-zinc-950/60 flex items-center gap-2">
              <Input
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSubmit(inputValue)}
                placeholder="Message Compass..."
                disabled={isLoading}
                className="bg-white/[0.03] border-white/[0.08] text-white focus-visible:ring-indigo-500 flex-1 h-9"
              />
              <Button
                onClick={() => handleSubmit(inputValue)}
                disabled={isLoading || !inputValue.trim()}
                className="bg-indigo-600 hover:bg-indigo-500 h-9 w-9 p-0 flex items-center justify-center rounded-lg animate-in"
              >
                <Send className="h-4.5 w-4.5" />
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="passport" className="bg-zinc-950/40 border border-white/[0.06] rounded-2xl overflow-hidden h-[520px] m-0">
            <PassportPanel
              ctx={tripContext}
              pct={progressPercent}
              onChangeField={handleUpdatePassportField}
              onAddInterest={handleAddInterest}
              onRemoveInterest={handleRemoveInterest}
              onExecutePlan={handleExecutePlan}
              isExecuting={isLoading}
            />
          </TabsContent>

          <TabsContent value="map" className="bg-zinc-950/40 border border-white/[0.06] rounded-2xl overflow-hidden h-[520px] m-0">
            <MapPanel ctx={tripContext} url={debouncedMapUrl} />
          </TabsContent>
        </Tabs>
      </div>

      {/* ── Settings Overlay Sheet (Modal) ── */}
      <AnimatePresence>
        {isSettingsOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="bg-zinc-950 border border-white/10 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl"
            >
              <div className="px-5 py-4 bg-zinc-900 border-b border-white/[0.06] flex items-center justify-between">
                <span className="font-extrabold text-sm text-zinc-100 flex items-center gap-1.5">
                  <Settings className="h-4 w-4 text-indigo-400" />
                  Compass Model Settings
                </span>
                <button
                  onClick={() => setIsSettingsOpen(false)}
                  className="text-zinc-500 hover:text-white text-xs cursor-pointer"
                >
                  ✕ Close
                </button>
              </div>

              <div className="p-5 space-y-4">
                {/* Provider Selector */}
                <div>
                  <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block mb-1.5">Provider</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => setConfig(prev => ({ ...prev, provider: "gemini" }))}
                      className={`py-2 px-3 text-xs font-bold border rounded-lg transition-all cursor-pointer ${
                        config.provider === "gemini"
                          ? "bg-indigo-600/10 border-indigo-500 text-indigo-400"
                          : "bg-white/[0.02] border-white/[0.06] text-zinc-400 hover:text-zinc-200"
                      }`}
                    >
                      Gemini Cloud
                    </button>
                    <button
                      onClick={() => setConfig(prev => ({ ...prev, provider: "ollama" }))}
                      className={`py-2 px-3 text-xs font-bold border rounded-lg transition-all cursor-pointer ${
                        config.provider === "ollama"
                          ? "bg-indigo-600/10 border-indigo-500 text-indigo-400"
                          : "bg-white/[0.02] border-white/[0.06] text-zinc-400 hover:text-zinc-200"
                      }`}
                    >
                      Local Ollama
                    </button>
                  </div>
                  <span className="text-[10px] text-zinc-500 mt-1 block">
                    {config.provider === "gemini"
                      ? "Uses Nexora backend's hosted Google Gemini. Perfect for quick setup."
                      : "Sends stream requests directly to your local computer's Ollama."}
                  </span>
                </div>

                {config.provider === "ollama" ? (
                  <>
                    {/* Host URL input */}
                    <div>
                      <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block mb-1.5">Ollama Host</label>
                      <Input
                        value={config.host}
                        onChange={(e) => setConfig(prev => ({ ...prev, host: e.target.value }))}
                        placeholder="http://localhost:11434"
                        className="bg-white/[0.03] border-white/[0.08] text-white focus-visible:ring-indigo-500 text-xs"
                      />
                    </div>
                    {/* Model selector input */}
                    <div>
                      <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block mb-1.5">Ollama Model</label>
                      <Input
                        value={config.model}
                        onChange={(e) => setConfig(prev => ({ ...prev, model: e.target.value }))}
                        placeholder="llama3, mistral, gemma2..."
                        className="bg-white/[0.03] border-white/[0.08] text-white focus-visible:ring-indigo-500 text-xs"
                      />
                    </div>
                  </>
                ) : (
                  <div>
                    <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block mb-1.5">Gemini Model</label>
                    <select
                      value={config.model}
                      onChange={(e) => setConfig(prev => ({ ...prev, model: e.target.value }))}
                      className="w-full bg-zinc-900 border border-white/[0.08] rounded-lg p-2.5 text-xs text-white outline-none focus:border-indigo-500"
                    >
                      <option value="gemini-2.0-flash">gemini-2.0-flash (Recommended)</option>
                      <option value="gemini-1.5-flash">gemini-1.5-flash</option>
                      <option value="gemini-1.5-pro">gemini-1.5-pro</option>
                    </select>
                  </div>
                )}
                
                {/* Connection Test Panel */}
                <div className="pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={async () => {
                      try {
                        if (config.provider === "ollama") {
                          const res = await fetch(`${config.host}/api/tags`);
                          if (res.ok) {
                            addToast({ type: "success", title: "Connection Success!", description: "Successfully pinged local Ollama service." });
                          } else {
                            throw new Error(`Service returned HTTP ${res.status}`);
                          }
                        } else {
                          const res = await api.get("/ai/providers");
                          const geminiAvailable = res.data?.find((p: any) => p.name === "gemini")?.isAvailable;
                          if (geminiAvailable) {
                            addToast({ type: "success", title: "Connection Success!", description: "Gemini AI router is active." });
                          } else {
                            addToast({ type: "warning", title: "API Standby", description: "Backend reached, but Gemini endpoint is not active." });
                          }
                        }
                      } catch (err: any) {
                        addToast({
                          type: "error",
                          title: "Connection Failed",
                          description: err.message || "Failed to reach AI Provider server."
                        });
                      }
                    }}
                    className="w-full border-white/10 hover:bg-white/[0.04] text-xs h-8 cursor-pointer"
                  >
                    ⚡ Test Server Connection
                  </Button>
                </div>

                {/* Save details */}
                <div className="pt-3 border-t border-white/[0.06] flex items-center justify-end gap-2">
                  <Button
                    variant="ghost"
                    onClick={() => setIsSettingsOpen(false)}
                    className="text-xs text-zinc-400 hover:text-white"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={() => handleSaveConfig(config)}
                    className="bg-indigo-600 hover:bg-indigo-500 text-xs px-4 h-9 cursor-pointer"
                  >
                    Save Changes
                  </Button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      
    </div>
  );
}

// ── Typing dots component ──────────────────────────────────────────────────
function TypingDots() {
  return (
    <div className="flex items-start gap-3.5 animate-pulse">
      <div className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center shrink-0 mt-0.5 border border-white/[0.04]">
        <Compass className="h-4 w-4 text-zinc-400 animate-spin" />
      </div>
      <div className="bg-white/[0.04] border border-white/[0.06] rounded-2xl rounded-tl-sm px-4 py-3 flex gap-1.5 items-center justify-center">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="w-1.5 h-1.5 rounded-full bg-indigo-400 opacity-60 animate-bounce"
            style={{ animationDelay: `${i * 0.15}s` }}
          />
        ))}
      </div>
    </div>
  );
}

// ── Message Bubble component ────────────────────────────────────────────────
function MessageBubble({ msg }: { msg: Message }) {
  const isUser = msg.role === "user";
  
  return (
    <div className={`flex items-start gap-3.5 ${isUser ? "flex-row-reverse" : "flex-row"}`}>
      {/* Avatar */}
      <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 border mt-0.5 ${
        isUser
          ? "bg-zinc-800 border-white/[0.06] text-white"
          : "bg-gradient-to-tr from-indigo-600 to-violet-500 border-indigo-400/30 text-white"
      }`}>
        {isUser ? <User className="h-4 w-4 text-zinc-450" /> : <Compass className="h-4 w-4 text-white" />}
      </div>
      
      {/* Content wrapper */}
      <div className={`flex flex-col max-w-[85%] md:max-w-[75%] space-y-1 ${isUser ? "items-end" : "items-start"}`}>
        <div className={`p-3.5 px-4 rounded-2xl border text-sm leading-relaxed ${
          isUser
            ? "bg-indigo-600/10 border-indigo-500/20 rounded-tr-sm text-zinc-100"
            : "bg-white/[0.03] border-white/[0.06] rounded-tl-sm text-zinc-200"
        }`}>
          {/* Markdown renderer */}
          <div className="prose prose-invert max-w-none text-sm break-words whitespace-pre-line leading-relaxed prose-headings:text-white prose-p:text-zinc-200 prose-a:text-indigo-400">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {msg.content}
            </ReactMarkdown>
          </div>
        </div>
        <span className="text-[9px] text-zinc-600 font-medium tracking-tight">
          {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </span>
      </div>
    </div>
  );
}



// ── Passport Panel ─────────────────────────────────────────────────────────
function PassportPanel({
  ctx,
  pct,
  onChangeField,
  onAddInterest,
  onRemoveInterest,
  onExecutePlan,
  isExecuting
}: {
  ctx: TripContext;
  pct: number;
  onChangeField: (key: keyof TripContext, value: string) => void;
  onAddInterest: (interest: string) => void;
  onRemoveInterest: (interest: string) => void;
  onExecutePlan: () => void;
  isExecuting: boolean;
}) {
  return (
    <div className="p-5 flex flex-col h-full overflow-y-auto custom-scrollbar bg-zinc-950/40">
      
      {/* Header / Progress bar */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="font-extrabold text-sm tracking-wider text-zinc-300 flex items-center gap-1.5">
            <BookOpen className="h-4.5 w-4.5 text-indigo-400" /> TRIP PASSPORT
          </span>
          <Badge className="bg-indigo-600/10 text-indigo-400 hover:bg-indigo-600/15 border-indigo-500/10 font-bold text-[10px]">
            {pct}% Complete
          </Badge>
        </div>
        <Progress value={pct} className="h-1.5 bg-zinc-800" />
      </div>

      {/* Fields Grid */}
      <div className="grid grid-cols-2 gap-3 mb-5">
        
        {/* ORIGIN */}
        <div className={`p-3 rounded-xl border transition-all duration-300 ${ctx.origin ? "bg-indigo-600/[0.02] border-indigo-500/20" : "bg-white/[0.01] border-white/[0.04]"}`}>
          <div className="text-[9px] font-bold text-indigo-400/80 tracking-wider mb-1">
            FROM / ORIGIN 🛫
          </div>
          <Input
            value={ctx.origin || ""}
            placeholder="E.g., London, Boston..."
            onChange={(e) => onChangeField("origin", e.target.value)}
            className="bg-transparent border-none p-0 focus-visible:ring-0 focus-visible:ring-offset-0 text-xs font-semibold text-zinc-200 placeholder-zinc-600 h-5 w-full mt-0.5 truncate"
          />
        </div>
        
        {/* DESTINATION */}
        <div className={`p-3 rounded-xl border transition-all duration-300 ${ctx.destination ? "bg-indigo-600/[0.02] border-indigo-500/20" : "bg-white/[0.01] border-white/[0.04]"}`}>
          <div className="text-[9px] font-bold text-indigo-400/80 tracking-wider mb-1">
            DESTINATION 📍
          </div>
          <Input
            value={ctx.destination || ""}
            placeholder="E.g., Paris, Tokyo..."
            onChange={(e) => onChangeField("destination", e.target.value)}
            className="bg-transparent border-none p-0 focus-visible:ring-0 focus-visible:ring-offset-0 text-xs font-semibold text-zinc-200 placeholder-zinc-600 h-5 w-full mt-0.5 truncate"
          />
        </div>

        {/* DURATION */}
        <div className={`p-3 rounded-xl border transition-all duration-300 ${ctx.duration ? "bg-indigo-600/[0.02] border-indigo-500/20" : "bg-white/[0.01] border-white/[0.04]"}`}>
          <div className="text-[9px] font-bold text-indigo-400/80 tracking-wider mb-1">
            DURATION ⏱️
          </div>
          <Input
            value={ctx.duration || ""}
            placeholder="E.g., 5 days"
            onChange={(e) => onChangeField("duration", e.target.value)}
            className="bg-transparent border-none p-0 focus-visible:ring-0 focus-visible:ring-offset-0 text-xs font-semibold text-zinc-200 placeholder-zinc-600 h-5 w-full mt-0.5 truncate"
          />
        </div>

        {/* TRAVELERS */}
        <div className={`p-3 rounded-xl border transition-all duration-300 ${ctx.travelers ? "bg-indigo-600/[0.02] border-indigo-500/20" : "bg-white/[0.01] border-white/[0.04]"}`}>
          <div className="text-[9px] font-bold text-indigo-400/80 tracking-wider mb-1">
            TRAVELERS 👥
          </div>
          <Input
            value={ctx.travelers || ""}
            placeholder="E.g., 2 people"
            onChange={(e) => onChangeField("travelers", e.target.value)}
            className="bg-transparent border-none p-0 focus-visible:ring-0 focus-visible:ring-offset-0 text-xs font-semibold text-zinc-200 placeholder-zinc-650 h-5 w-full mt-0.5 truncate"
          />
        </div>

        {/* BUDGET */}
        <div className={`p-3 rounded-xl border transition-all duration-300 ${ctx.budget ? "bg-indigo-600/[0.02] border-indigo-500/20" : "bg-white/[0.01] border-white/[0.04]"}`}>
          <div className="text-[9px] font-bold text-indigo-400/80 tracking-wider mb-1">
            BUDGET 💰
          </div>
          <select
            value={ctx.budget || ""}
            onChange={(e) => onChangeField("budget", e.target.value)}
            className="bg-transparent border-none p-0 focus:outline-none text-xs font-semibold text-zinc-200 w-full h-5 mt-0.5"
          >
            <option value="" className="bg-zinc-950 text-zinc-600">Select budget...</option>
            <option value="Budget" className="bg-zinc-950 text-zinc-350">Budget</option>
            <option value="Mid-range" className="bg-zinc-950 text-zinc-350">Mid-range</option>
            <option value="Luxury" className="bg-zinc-950 text-zinc-350">Luxury</option>
          </select>
        </div>

        {/* INTENT */}
        <div className={`p-3 rounded-xl border transition-all duration-300 ${ctx.intent ? "bg-indigo-600/[0.02] border-indigo-500/20" : "bg-white/[0.01] border-white/[0.04]"}`}>
          <div className="text-[9px] font-bold text-indigo-400/80 tracking-wider mb-1">
            INTENT 🎯
          </div>
          <select
            value={ctx.intent || ""}
            onChange={(e) => onChangeField("intent", e.target.value)}
            className="bg-transparent border-none p-0 focus:outline-none text-xs font-semibold text-zinc-200 w-full h-5 mt-0.5"
          >
            <option value="" className="bg-zinc-950 text-zinc-600">Select intent...</option>
            <option value="Honeymoon" className="bg-zinc-950 text-zinc-350">Honeymoon</option>
            <option value="Adventure" className="bg-zinc-950 text-zinc-350">Adventure</option>
            <option value="Relaxation" className="bg-zinc-950 text-zinc-350">Relaxation</option>
            <option value="Family" className="bg-zinc-950 text-zinc-350">Family</option>
            <option value="Solo" className="bg-zinc-950 text-zinc-350">Solo</option>
            <option value="Business" className="bg-zinc-950 text-zinc-350">Business</option>
          </select>
        </div>

        {/* DATES */}
        <div className={`p-3 rounded-xl border transition-all duration-300 ${ctx.dates ? "bg-indigo-600/[0.02] border-indigo-500/20" : "bg-white/[0.01] border-white/[0.04]"}`}>
          <div className="text-[9px] font-bold text-indigo-400/80 tracking-wider mb-1">
            DATES 🗓️
          </div>
          <Input
            value={ctx.dates || ""}
            placeholder="E.g., March, summer..."
            onChange={(e) => onChangeField("dates", e.target.value)}
            className="bg-transparent border-none p-0 focus-visible:ring-0 focus-visible:ring-offset-0 text-xs font-semibold text-zinc-200 placeholder-zinc-655 h-5 w-full mt-0.5 truncate"
          />
        </div>

      </div>

      {/* Interests list */}
      <div className="mb-5 flex-1">
        <div className="text-[10px] font-bold text-zinc-400 tracking-wider mb-2">TRAVEL INTERESTS (CLICK TO REMOVE)</div>
        <div className="flex flex-wrap gap-1.5 mb-2.5">
          {(ctx.interests || []).map(interest => (
            <Badge
              key={interest}
              variant="outline"
              onClick={() => onRemoveInterest(interest)}
              className="bg-indigo-600/5 hover:bg-rose-500/10 text-indigo-450 hover:text-rose-450 border-indigo-500/20 hover:border-rose-500/20 font-bold text-[9px] p-1 px-2.5 rounded-full cursor-pointer transition-colors"
            >
              {interest} &times;
            </Badge>
          ))}
        </div>
        <Input
          placeholder="Add interest & press Enter..."
          onKeyDown={(e) => {
            if (e.key === "Enter" && e.currentTarget.value.trim()) {
              onAddInterest(e.currentTarget.value.trim());
              e.currentTarget.value = "";
            }
          }}
          className="bg-white/[0.02] border-white/[0.08] focus-visible:ring-indigo-500 text-xs h-8 text-zinc-200 placeholder-zinc-650 rounded-lg"
        />
      </div>

      {/* Execute Plan Button */}
      <Button
        onClick={onExecutePlan}
        disabled={isExecuting || !ctx.destination}
        className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-2.5 rounded-xl shadow-lg hover:shadow-indigo-500/20 transition-all duration-300 flex items-center justify-center gap-2 mt-4"
      >
        {isExecuting ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin text-white" />
            Executing Itinerary Plan...
          </>
        ) : (
          <>
            <Play className="h-4 w-4 text-white fill-current animate-pulse" />
            Execute Travel Plan
          </>
        )}
      </Button>
    </div>
  );
}

// ── Map Panel ──────────────────────────────────────────────────────────────
function MapPanel({ ctx, url }: { ctx: TripContext; url: string | null }) {
  return (
    <div className="flex flex-col h-full bg-zinc-950/40 relative">
      {ctx.destination && (
        <div className="p-3.5 bg-zinc-950 border-b border-white/[0.06] flex items-center gap-2">
          <MapPin className="h-4.5 w-4.5 text-indigo-400" />
          <div>
            <div className="text-xs font-bold text-white">{ctx.destination}</div>
            {ctx.coordinates && (
              <span className="text-[10px] text-zinc-500 font-medium">
                Lat: {ctx.coordinates.lat.toFixed(4)}, Lng: {ctx.coordinates.lng.toFixed(4)}
              </span>
            )}
          </div>
        </div>
      )}
      
      <div className="flex-1 w-full h-full relative min-h-[300px]">
        {url ? (
          <iframe
            src={url}
            title="Destination live coordinates sync"
            className="w-full h-full border-none absolute inset-0 filter invert opacity-80"
            loading="eager"
            referrerPolicy="no-referrer-when-downgrade"
          />
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center space-y-3">
            <div className="w-16 h-16 rounded-full bg-white/[0.02] border border-white/[0.04] flex items-center justify-center text-3xl opacity-40">
              <MapIcon className="h-8 w-8 text-zinc-600 mx-auto" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-zinc-300">Waiting for destination coordinates...</h4>
              <p className="text-xs text-zinc-500 max-w-xs mx-auto mt-1 leading-relaxed">
                Mention a destination (like Paris, Rome, Bali, or Tokyo) in the chat window, and Compass will sync the map live.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
