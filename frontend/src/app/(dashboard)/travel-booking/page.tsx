"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plane,
  Bus,
  Train,
  Calendar,
  Users,
  Compass,
  Search,
  MapPin,
  Clock,
  Sparkles,
  Info,
  DollarSign,
  Ticket,
  AlertCircle,
  CheckCircle,
  Loader2,
  ChevronRight,
  ArrowRight,
  Shield,
  Star,
  Activity,
  History,
  AlertTriangle,
  X,
  Hotel
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import api from "@/lib/api";

interface TravelResult {
  id: string;
  carrier?: string;
  carrierCode?: string;
  carrierRating?: number;
  operator?: string;
  operatorCode?: string;
  operatorRating?: number;
  origin: string;
  destination: string;
  date: string;
  departureTime: string;
  arrivalTime: string;
  duration: string;
  stops?: number;
  busType?: string;
  trainNumber?: string;
  class?: string;
  price: number;
  pricePerPerson: number;
  currency: string;
  seatsAvailable: number;
  baggage?: string;
  amenities?: string[];
  platform?: number;
}

interface BookingHistoryItem {
  id: string;
  userId: string;
  agentId: string;
  action: string;
  description: string;
  reasoning: string;
  status?: string;
  timestamp: string;
}

interface TripPlanItineraryItem {
  day: number;
  title: string;
  activities: string[];
  transport: string;
  estimatedCost: number;
}

interface TripPlan {
  tripName: string;
  duration: string;
  destinations: string[];
  itinerary: TripPlanItineraryItem[];
  totalEstimatedBudget: number;
  tips: string[];
}

export default function TravelBookingPage() {
  const [mode, setMode] = React.useState<"flight" | "bus" | "train" | "hotel">("flight");
  const [origin, setOrigin] = React.useState("");
  const [destination, setDestination] = React.useState("");
  const [date, setDate] = React.useState("");
  const [passengers, setPassengers] = React.useState("1");
  const [travelClass, setTravelClass] = React.useState("economy");

  const [isSearching, setIsSearching] = React.useState(false);
  const [searchResults, setSearchResults] = React.useState<TravelResult[]>([]);
  const [bestDeal, setBestDeal] = React.useState<TravelResult | null>(null);
  const [fastestRoute, setFastestRoute] = React.useState<TravelResult | null>(null);
  const [searchInitiated, setSearchInitiated] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  // Booking process
  const [selectedTicket, setSelectedTicket] = React.useState<TravelResult | null>(null);
  const [isBooking, setIsBooking] = React.useState(false);
  const [bookingConfirmed, setBookingConfirmed] = React.useState<any | null>(null);
  const [bookingDialogOpen, setBookingDialogOpen] = React.useState(false);
  const [successDialogOpen, setSuccessDialogOpen] = React.useState(false);

  // Booking history
  const [bookingHistory, setBookingHistory] = React.useState<BookingHistoryItem[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = React.useState(false);

  // AI Trip planner
  const [plannerDestination, setPlannerDestination] = React.useState("");
  const [plannerDuration, setPlannerDuration] = React.useState("5");
  const [plannerBudget, setPlannerBudget] = React.useState("1500");
  const [plannerTransport, setPlannerTransport] = React.useState("train");
  const [plannerInterests, setPlannerInterests] = React.useState("");
  const [isPlanning, setIsPlanning] = React.useState(false);
  const [tripPlan, setTripPlan] = React.useState<TripPlan | null>(null);
  const [plannerError, setPlannerError] = React.useState<string | null>(null);

  const [mainTab, setMainTab] = React.useState("search");
  const [cancellingId, setCancellingId] = React.useState<string | null>(null);

  // Chat-based travel planning states
  const [plannerMode, setPlannerMode] = React.useState<"form" | "chat">("form");
  const [chatMessages, setChatMessages] = React.useState<Array<{ role: "user" | "assistant" | "system"; content: string }>>([
    {
      role: "assistant",
      content: "Hello! I am your AI Travel Agent. Tell me about your dream trip (destination, duration, budget, interests) or ask me questions, and we'll build your plan together!"
    }
  ]);
  const [chatInput, setChatInput] = React.useState("");
  const [chatLoading, setChatLoading] = React.useState(false);

  React.useEffect(() => {
    loadBookingHistory();
    // Default search parameters
    const today = new Date();
    today.setDate(today.getDate() + 7);
    setDate(today.toISOString().split("T")[0]);
    setOrigin("New York");
    setDestination("London");
  }, []);

  const handleSearchFromItinerary = (dayItem: any, plan: any) => {
    const transportStr = (dayItem.transport || "").toLowerCase();
    let searchMode: "flight" | "bus" | "train" | "hotel" = "flight";
    if (transportStr.includes("train")) {
      searchMode = "train";
    } else if (transportStr.includes("bus")) {
      searchMode = "bus";
    } else if (transportStr.includes("hotel") || transportStr.includes("stay")) {
      searchMode = "hotel";
    }

    const searchOrigin = plan.destinations[0] || "New York";
    const searchDestination = plan.destinations[dayItem.day - 1] || plan.destinations[plan.destinations.length - 1] || "London";

    setMode(searchMode);
    setOrigin(searchOrigin);
    setDestination(searchDestination);
    
    const today = new Date();
    today.setDate(today.getDate() + 7);
    setDate(today.toISOString().split("T")[0]);

    setMainTab("search");
  };

  const handleCancelBooking = async (bookingId: string) => {
    if (!confirm("Are you sure you want to cancel this booking?")) return;
    setCancellingId(bookingId);
    try {
      await api.post("/agents/travel/cancel", { bookingId });
      loadBookingHistory();
    } catch (err: any) {
      alert(err.response?.data?.error || "Failed to cancel booking. Please try again.");
    } finally {
      setCancellingId(null);
    }
  };

  const handleSendChatMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || chatLoading) return;

    const userMsg = chatInput.trim();
    setChatInput("");
    
    const newMessages = [...chatMessages, { role: "user" as const, content: userMsg }];
    setChatMessages(newMessages);
    setChatLoading(true);
    setPlannerError(null);

    const systemPrompt = `You are a helpful travel planner agent. Chat with the user to refine their trip plan. Once you collect details like destination, duration, budget, and interests, provide a detailed response. 
    
At the end of your response (or when they ask to finalize/generate the plan), you MUST output a JSON block matching the exact trip plan schema so that the frontend can render their visual timeline. The JSON block should be formatted between \`\`\`json and \`\`\` code fences.

JSON Structure:
{
  "tripName": "Name of the trip",
  "duration": "X days",
  "destinations": ["City1", "City2"],
  "itinerary": [
    { "day": 1, "title": "Day title", "activities": ["Activity 1", "Activity 2"], "transport": "Mode of transport", "estimatedCost": 100 }
  ],
  "totalEstimatedBudget": 1500,
  "tips": ["Tip 1", "Tip 2"]
}`;

    try {
      const apiMessages = newMessages.map(m => ({
        role: m.role,
        content: m.content
      }));

      const res = await api.post("/ai/chat", {
        messages: apiMessages,
        options: {
          systemPrompt,
          temperature: 0.6
        }
      });

      const reply = res.data?.content || "I couldn't process that request.";
      setChatMessages(prev => [...prev, { role: "assistant", content: reply }]);

      // Attempt to extract JSON itinerary if present
      const jsonRegex = /```json\s*([\s\S]*?)\s*```/;
      const match = reply.match(jsonRegex);
      
      let parsedJson = null;
      if (match && match[1]) {
        try {
          parsedJson = JSON.parse(match[1].trim());
        } catch (e) {
          console.error("Could not parse JSON from regex match", e);
        }
      } else {
        const bracketsRegex = /\{[\s\S]*\}/;
        const fallbackMatch = reply.match(bracketsRegex);
        if (fallbackMatch) {
          try {
            parsedJson = JSON.parse(fallbackMatch[0].trim());
          } catch (e) {}
        }
      }

      if (parsedJson && parsedJson.tripName && parsedJson.itinerary) {
        setTripPlan(parsedJson);
        try {
          await api.post("/agents/travel/plan", { 
            description: `Planned via chat: ${parsedJson.tripName} (${parsedJson.duration})` 
          });
        } catch (err) {
          console.error("Failed to log activity", err);
        }
      }
    } catch (err: any) {
      setPlannerError(err.response?.data?.error || "AI agent failed to reply. Please try again.");
    } finally {
      setChatLoading(false);
    }
  };

  async function loadBookingHistory() {
    setIsLoadingHistory(true);
    try {
      const res = await api.get("/agents/travel/bookings");
      setBookingHistory(res.data || []);
    } catch (err) {
      console.error("Could not load booking history", err);
    } finally {
      setIsLoadingHistory(false);
    }
  }

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if ((mode !== "hotel" && !origin.trim()) || !destination.trim() || !date) {
      setError("Please fill in travel details.");
      return;
    }
    setIsSearching(true);
    setSearchInitiated(true);
    setError(null);
    setSearchResults([]);
    setBestDeal(null);
    setFastestRoute(null);

    try {
      const res = await api.post("/agents/travel/search", {
        mode,
        origin: mode === "hotel" ? destination : origin,
        destination,
        date,
        passengers: Number(passengers),
        travelClass
      });
      setSearchResults(res.data.results || []);
      setBestDeal(res.data.bestDeal || null);
      setFastestRoute(res.data.fastestRoute || null);
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to search travel options. Please try again.");
    } finally {
      setIsSearching(false);
    }
  };

  const handleOpenBooking = (ticket: TravelResult) => {
    setSelectedTicket(ticket);
    setBookingDialogOpen(true);
  };

  const handleConfirmBooking = async () => {
    if (!selectedTicket) return;
    setIsBooking(true);
    try {
      const carrier = selectedTicket.carrier || selectedTicket.operator || "Nexora Transport";
      const res = await api.post("/agents/travel/book", {
        mode,
        resultId: selectedTicket.id,
        origin: selectedTicket.origin,
        destination: selectedTicket.destination,
        date: selectedTicket.date,
        passengers: Number(passengers),
        carrier,
        price: selectedTicket.price,
        departureTime: selectedTicket.departureTime,
        arrivalTime: selectedTicket.arrivalTime
      });
      setBookingConfirmed(res.data);
      setBookingDialogOpen(false);
      setSuccessDialogOpen(true);
      loadBookingHistory();
    } catch (err: any) {
      setError(err.response?.data?.error || "Booking failed. Please try again.");
    } finally {
      setIsBooking(false);
    }
  };

  const handleGenerateTripPlan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!plannerDestination.trim()) {
      setPlannerError("Please enter your destination.");
      return;
    }
    setIsPlanning(true);
    setPlannerError(null);
    setTripPlan(null);

    const constructedDescription = `Plan a ${plannerDuration}-day trip to ${plannerDestination}. Budget: $${plannerBudget}. Preferred transport mode: ${plannerTransport}. Interests and activities: ${plannerInterests || "general sightseeing, local food, and exploring landmarks"}.`;

    try {
      const res = await api.post("/agents/travel/plan", { description: constructedDescription });
      setTripPlan(res.data);
    } catch (err: any) {
      setPlannerError(err.response?.data?.error || "Could not generate trip plan. Please try again.");
    } finally {
      setIsPlanning(false);
    }
  };

  return (
    <div className="space-y-8 pb-10">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-indigo-400 via-violet-400 to-cyan-400 bg-clip-text text-transparent flex items-center gap-2.5">
            Travel Booking Agent <Sparkles className="h-6 w-6 text-indigo-400 animate-pulse" />
          </h1>
          <p className="text-zinc-400 text-sm mt-1">
            Compare prices across flights, buses, and trains, and design customized itineraries using AI.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge className="bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 px-3 py-1.5 rounded-lg flex items-center gap-1.5">
            <Shield className="h-4 w-4" /> 100% Free Autonomous Bookings
          </Badge>
        </div>
      </div>

      {/* Warning Banner */}
      <div className="flex items-center gap-3.5 p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl text-amber-300">
        <AlertTriangle className="h-5 w-5 text-amber-500 shrink-0" />
        <div className="text-xs leading-relaxed">
          <span className="font-bold">Sandbox Mode Demo:</span> Booking agents are currently running in a simulated sandbox environment. All flight, bus, and train tickets are mock-generated for demo purposes. No real monetary transactions will be executed.
        </div>
      </div>

      <Tabs value={mainTab} onValueChange={setMainTab} className="w-full">
        <TabsList className="bg-zinc-900/60 border border-zinc-800/80 p-1 rounded-xl mb-6 w-full overflow-x-auto scrollbar-none flex justify-start sm:justify-center min-w-0">
          <TabsTrigger value="search" className="rounded-lg data-[state=active]:bg-zinc-800 text-sm py-2">
            <Search className="h-4 w-4 mr-2" /> Search & Book
          </TabsTrigger>
          <TabsTrigger value="planner" className="rounded-lg data-[state=active]:bg-zinc-800 text-sm py-2">
            <Compass className="h-4 w-4 mr-2" /> AI Trip Planner
          </TabsTrigger>
          <TabsTrigger value="history" className="rounded-lg data-[state=active]:bg-zinc-800 text-sm py-2">
            <History className="h-4 w-4 mr-2" /> Booking Logs
          </TabsTrigger>
        </TabsList>

        {/* SEARCH AND BOOK TAB */}
        <TabsContent value="search" className="space-y-6 outline-none">
          <Card className="bg-zinc-950/40 border-zinc-900 backdrop-blur-md">
            <CardHeader className="border-b border-zinc-900/80">
              <CardTitle className="text-lg font-semibold text-white">Find Your Connection</CardTitle>
              <CardDescription>Select your mode of transportation and fill travel details.</CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              {/* Transport mode selector icons */}
              <div className="grid grid-cols-4 gap-3 mb-6">
                {[
                  { key: "flight", label: "Flights", icon: Plane, color: "from-indigo-600/30 to-indigo-500/10 border-indigo-500/30 text-indigo-400" },
                  { key: "bus", label: "Buses", icon: Bus, color: "from-violet-600/30 to-violet-500/10 border-violet-500/30 text-violet-400" },
                  { key: "train", label: "Trains", icon: Train, color: "from-cyan-600/30 to-cyan-500/10 border-cyan-500/30 text-cyan-400" },
                  { key: "hotel", label: "Hotels", icon: Hotel, color: "from-rose-600/30 to-rose-500/10 border-rose-500/30 text-rose-400" },
                ].map((item) => {
                  const Icon = item.icon;
                  const isActive = mode === item.key;
                  return (
                    <button
                      key={item.key}
                      onClick={() => setMode(item.key as any)}
                      className={`flex flex-col items-center justify-center py-4 rounded-xl border text-center transition-all ${
                        isActive
                          ? `${item.color} bg-gradient-to-b scale-[1.02] shadow-[0_0_15px_rgba(99,102,241,0.15)]`
                          : "bg-zinc-900/30 border-zinc-800/80 text-zinc-400 hover:text-white hover:bg-zinc-900/50"
                      }`}
                    >
                      <Icon className="h-6 w-6 mb-2" />
                      <span className="text-xs font-semibold">{item.label}</span>
                    </button>
                  );
                })}
              </div>

              {/* Search Form */}
              <form onSubmit={handleSearch} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {mode !== "hotel" ? (
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-zinc-400 flex items-center gap-1.5">
                        <MapPin className="h-3.5 w-3.5" /> From
                      </label>
                      <Input
                        placeholder="Origin city"
                        value={origin}
                        onChange={(e) => setOrigin(e.target.value)}
                        className="bg-zinc-900/40 border-zinc-800 focus-visible:ring-indigo-500 text-white rounded-lg"
                      />
                    </div>
                  ) : (
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-zinc-400 flex items-center gap-1.5">
                        <Hotel className="h-3.5 w-3.5" /> Stay Type
                      </label>
                      <Input
                        placeholder="e.g. Hotel, Resort, Guest House"
                        disabled
                        value="All Hotel Stays"
                        className="bg-zinc-900/20 border-zinc-900 text-zinc-500 rounded-lg select-none"
                      />
                    </div>
                  )}

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-zinc-400 flex items-center gap-1.5">
                      <MapPin className="h-3.5 w-3.5" /> To
                    </label>
                    <Input
                      placeholder="Destination city"
                      value={destination}
                      onChange={(e) => setDestination(e.target.value)}
                      className="bg-zinc-900/40 border-zinc-800 focus-visible:ring-indigo-500 text-white rounded-lg"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-zinc-400 flex items-center gap-1.5">
                      <Calendar className="h-3.5 w-3.5" /> Date
                    </label>
                    <Input
                      type="date"
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      className="bg-zinc-900/40 border-zinc-800 focus-visible:ring-indigo-500 text-white rounded-lg"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-zinc-400 flex items-center gap-1.5">
                        <Users className="h-3.5 w-3.5" /> {mode === "hotel" ? "Guests" : "Passengers"}
                      </label>
                      <select
                        value={passengers}
                        onChange={(e) => setPassengers(e.target.value)}
                        className="w-full h-10 px-3 bg-zinc-900/40 border border-zinc-800 rounded-lg text-sm text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                      >
                        {[1, 2, 3, 4, 5, 6].map((num) => (
                          <option key={num} value={num.toString()} className="bg-zinc-950">
                            {num}
                          </option>
                        ))}
                      </select>
                    </div>

                    {(mode === "flight" || mode === "train") && (
                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-zinc-400 flex items-center gap-1.5">
                          <Activity className="h-3.5 w-3.5" /> Class
                        </label>
                        <select
                          value={travelClass}
                          onChange={(e) => setTravelClass(e.target.value)}
                          className="w-full h-10 px-3 bg-zinc-900/40 border border-zinc-800 rounded-lg text-sm text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                        >
                          <option value="economy" className="bg-zinc-950">Economy</option>
                          <option value="business" className="bg-zinc-950">Business</option>
                          <option value="first" className="bg-zinc-950">First Class</option>
                        </select>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex justify-end pt-2">
                  <Button
                    type="submit"
                    disabled={isSearching}
                    className="bg-indigo-600 hover:bg-indigo-500 text-white font-semibold px-6 py-2.5 rounded-lg shadow-lg hover:shadow-indigo-500/20 transition-all duration-300"
                  >
                    {isSearching ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" /> Searching Rates...
                      </>
                    ) : (
                      <>
                        <Search className="h-4 w-4 mr-2" /> Find Best Option
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          {error && (
            <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 px-4 py-3 rounded-lg flex items-start gap-2.5">
              <AlertCircle className="h-5 w-5 mt-0.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Search Results */}
          {searchInitiated && !isSearching && (
            <div className="space-y-6">
              {searchResults.length === 0 ? (
                <Card className="bg-zinc-950/40 border-zinc-900 py-12 text-center">
                  <CardContent className="space-y-3">
                    <div className="h-12 w-12 rounded-full bg-zinc-900 flex items-center justify-center mx-auto text-zinc-500">
                      {mode === "flight" ? <Plane className="h-6 w-6" /> : mode === "bus" ? <Bus className="h-6 w-6" /> : <Train className="h-6 w-6" />}
                    </div>
                    <h3 className="text-lg font-semibold text-white">No travel plans found</h3>
                    <p className="text-zinc-400 text-sm max-w-sm mx-auto">
                      We couldn't find any direct {mode} routes for {origin} to {destination} on the selected date.
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-4">
                  {/* Highlighting best value & fastest routes */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {bestDeal && (
                      <Card className="bg-gradient-to-r from-emerald-950/30 to-zinc-950/30 border-emerald-500/20 hover:border-emerald-500/40 transition-colors">
                        <CardHeader className="pb-2">
                          <Badge className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 w-fit">
                            Best Value
                          </Badge>
                        </CardHeader>
                        <CardContent>
                          <div className="flex justify-between items-center">
                            <div>
                              <p className="font-semibold text-white">{bestDeal.carrier || bestDeal.operator}</p>
                              <p className="text-xs text-zinc-400">{bestDeal.departureTime} → {bestDeal.arrivalTime} ({bestDeal.duration})</p>
                            </div>
                            <div className="text-right">
                              <p className="text-2xl font-bold text-emerald-400">${bestDeal.price}</p>
                              <p className="text-[10px] text-zinc-500">Total for {passengers} pax</p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    )}

                    {fastestRoute && (
                      <Card className="bg-gradient-to-r from-indigo-950/30 to-zinc-950/30 border-indigo-500/20 hover:border-indigo-500/40 transition-colors">
                        <CardHeader className="pb-2">
                          <Badge className="bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 w-fit">
                            Fastest Route
                          </Badge>
                        </CardHeader>
                        <CardContent>
                          <div className="flex justify-between items-center">
                            <div>
                              <p className="font-semibold text-white">{fastestRoute.carrier || fastestRoute.operator}</p>
                              <p className="text-xs text-zinc-400">{fastestRoute.departureTime} → {fastestRoute.arrivalTime} ({fastestRoute.duration})</p>
                            </div>
                            <div className="text-right">
                              <p className="text-2xl font-bold text-indigo-400">${fastestRoute.price}</p>
                              <p className="text-[10px] text-zinc-500">{fastestRoute.stops !== undefined ? `${fastestRoute.stops} stops` : "Direct"}</p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    )}
                  </div>

                  <h3 className="text-lg font-bold text-white pt-2">Available Deals</h3>

                  {/* Results List */}
                  <div className="space-y-3">
                    {searchResults.map((ticket) => {
                      const carrierName = ticket.carrier || ticket.operator || "Carrier";
                      const rating = ticket.carrierRating || ticket.operatorRating || 4.2;

                      return (
                        <div
                          key={ticket.id}
                          className="bg-zinc-950/30 border border-zinc-900 hover:border-zinc-800 rounded-xl p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4 transition-all duration-200"
                        >
                          {/* Carrier details */}
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-lg bg-zinc-900 border border-zinc-850 flex items-center justify-center text-zinc-400 font-bold tracking-wider">
                              {ticket.carrierCode || ticket.operatorCode || "TR"}
                            </div>
                            <div>
                              <h4 className="font-bold text-white text-base leading-tight">{carrierName}</h4>
                              <div className="flex items-center gap-1 mt-1 text-xs text-zinc-400">
                                <span className="flex items-center text-amber-500">
                                  <Star className="h-3 w-3 fill-current mr-0.5" />
                                  {rating}
                                </span>
                                <span>•</span>
                                <span>{ticket.class ? `${ticket.class.charAt(0).toUpperCase()}${ticket.class.slice(1)}` : ticket.busType || "Standard"}</span>
                              </div>
                            </div>
                          </div>

                          {/* Time breakdown */}
                          <div className="grid grid-cols-3 items-center gap-4 text-center max-w-sm w-full">
                            <div className="text-left md:text-center">
                              <p className="text-lg font-bold text-white">{ticket.departureTime}</p>
                              <p className="text-xs text-zinc-500 font-medium">{ticket.origin}</p>
                            </div>
                            <div className="relative flex flex-col items-center justify-center">
                              <span className="text-[10px] text-zinc-500 font-mono mb-1">{ticket.duration}</span>
                              <div className="w-full flex items-center justify-center">
                                <div className="h-[2px] bg-zinc-800 w-full relative">
                                  {/* Dot in middle for stops */}
                                  {ticket.stops !== undefined && ticket.stops > 0 && (
                                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-1.5 h-1.5 bg-indigo-500 rounded-full" />
                                  )}
                                </div>
                                <ArrowRight className="h-3 w-3 text-zinc-700 -ml-1.5 shrink-0" />
                              </div>
                              <span className="text-[10px] text-zinc-500 mt-1 font-mono">
                                {ticket.stops !== undefined ? (ticket.stops === 0 ? "Non-stop" : `${ticket.stops} stop${ticket.stops > 1 ? "s" : ""}`) : "Direct"}
                              </span>
                            </div>
                            <div className="text-right md:text-center">
                              <p className="text-lg font-bold text-white">{ticket.arrivalTime}</p>
                              <p className="text-xs text-zinc-500 font-medium">{ticket.destination}</p>
                            </div>
                          </div>

                          {/* Details & pricing */}
                          <div className="flex items-center justify-between lg:justify-end gap-6 border-t lg:border-t-0 border-zinc-900 pt-4 lg:pt-0">
                            <div className="text-left lg:text-right">
                              <p className="text-2xl font-black text-white">${ticket.price}</p>
                              <p className="text-xs text-zinc-400">${ticket.pricePerPerson} / traveler</p>
                              <p className="text-[10px] text-emerald-400/80 font-mono mt-0.5">{ticket.seatsAvailable} seats left</p>
                            </div>
                            <Button
                              onClick={() => handleOpenBooking(ticket)}
                              className="bg-indigo-600/20 hover:bg-indigo-600 border border-indigo-500/30 text-indigo-300 hover:text-white font-semibold transition-all rounded-lg text-sm px-4 py-2 shrink-0"
                            >
                              Book Free
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}
        </TabsContent>

        {/* AI TRIP PLANNER TAB */}
        <TabsContent value="planner" className="space-y-6 outline-none">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1 space-y-6">
              <Card className="bg-zinc-950/40 border-zinc-900 backdrop-blur-md">
                <CardHeader>
                  <CardTitle className="text-lg font-semibold text-white flex items-center gap-2">
                        <Sparkles className="h-5 w-5 text-indigo-400 animate-pulse" /> AI Agent Planner
                  </CardTitle>
                  <CardDescription>
                    Describe your dream trip. Our agent will plan custom stops, activities, budgets, and safety guidelines.
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-3">
                  {/* Mode Selector */}
                  <div className="flex bg-zinc-900/60 p-1 rounded-xl mb-4 border border-zinc-800/80">
                    <button
                      type="button"
                      onClick={() => setPlannerMode("form")}
                      className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                        plannerMode === "form"
                          ? "bg-indigo-600 text-white shadow-sm"
                          : "text-zinc-400 hover:text-white"
                      }`}
                    >
                      Manual Form
                    </button>
                    <button
                      type="button"
                      onClick={() => setPlannerMode("chat")}
                      className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                        plannerMode === "chat"
                          ? "bg-indigo-600 text-white shadow-sm"
                          : "text-zinc-400 hover:text-white"
                      }`}
                    >
                      Chat Agent
                    </button>
                  </div>

                  {plannerMode === "form" ? (
                    <form onSubmit={handleGenerateTripPlan} className="space-y-4">
                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-zinc-400 flex items-center gap-1.5">
                          <MapPin className="h-3.5 w-3.5 text-indigo-400" /> Destination(s)
                        </label>
                        <Input
                          placeholder="E.g., Tokyo & Kyoto, Paris, or Hawaii"
                          value={plannerDestination}
                          onChange={(e) => setPlannerDestination(e.target.value)}
                          className="bg-zinc-900/40 border-zinc-800 focus-visible:ring-indigo-500 text-white rounded-lg animate-fade-in"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                          <label className="text-xs font-semibold text-zinc-400 flex items-center gap-1.5">
                            <Clock className="h-3.5 w-3.5 text-indigo-400" /> Duration (Days)
                          </label>
                          <select
                            value={plannerDuration}
                            onChange={(e) => setPlannerDuration(e.target.value)}
                            className="w-full h-10 px-3 bg-zinc-900/40 border border-zinc-800 rounded-lg text-sm text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                          >
                            {[1, 2, 3, 4, 5, 7, 10, 14, 21].map((num) => (
                              <option key={num} value={num.toString()} className="bg-zinc-950">
                                {num} {num === 1 ? "Day" : "Days"}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-xs font-semibold text-zinc-400 flex items-center gap-1.5">
                            <DollarSign className="h-3.5 w-3.5 text-indigo-400" /> Budget ($)
                          </label>
                          <Input
                            type="number"
                            placeholder="E.g., 1500"
                            value={plannerBudget}
                            onChange={(e) => setPlannerBudget(e.target.value)}
                            className="bg-zinc-900/40 border-zinc-800 focus-visible:ring-indigo-500 text-white rounded-lg"
                          />
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-zinc-400 flex items-center gap-1.5">
                          <Plane className="h-3.5 w-3.5 text-indigo-400" /> Preferred Transport
                        </label>
                        <select
                          value={plannerTransport}
                          onChange={(e) => setPlannerTransport(e.target.value)}
                          className="w-full h-10 px-3 bg-zinc-900/40 border border-zinc-800 rounded-lg text-sm text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                        >
                          <option value="flight" className="bg-zinc-950">Flight</option>
                          <option value="train" className="bg-zinc-950">Train</option>
                          <option value="bus" className="bg-zinc-950">Bus</option>
                          <option value="car rental" className="bg-zinc-950">Car Rental / Driving</option>
                          <option value="any" className="bg-zinc-950">Any Mode</option>
                        </select>
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-zinc-400 flex items-center gap-1.5">
                          <Sparkles className="h-3.5 w-3.5 text-indigo-400" /> Interests & Travel Style
                        </label>
                        <Input
                          placeholder="E.g., Food tours, museums, historic sites, beaches"
                          value={plannerInterests}
                          onChange={(e) => setPlannerInterests(e.target.value)}
                          className="bg-zinc-900/40 border-zinc-800 focus-visible:ring-indigo-500 text-white rounded-lg"
                        />
                      </div>

                      <Button
                        type="submit"
                        disabled={isPlanning}
                        className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-2.5 rounded-xl shadow-lg hover:shadow-indigo-500/20 transition-all duration-300 mt-2"
                      >
                        {isPlanning ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" /> Sequencing Itinerary...
                          </>
                        ) : (
                          <>
                            <Sparkles className="h-4 w-4 mr-2" /> Plan My Trip
                          </>
                        )}
                      </Button>
                    </form>
                  ) : (
                    <div className="space-y-4 animate-fade-in">
                      {/* Chat Window */}
                      <div className="h-[320px] overflow-y-auto border border-zinc-850 bg-zinc-950/60 rounded-xl p-3.5 space-y-3.5 scrollbar-thin flex flex-col">
                        {chatMessages.map((msg, i) => {
                          const isAi = msg.role === "assistant";
                          const displayContent = msg.content.split("```json")[0].trim();
                          
                          if (!displayContent) return null;

                          return (
                            <div
                              key={i}
                              className={`flex ${isAi ? "justify-start" : "justify-end"}`}
                            >
                              <div
                                className={`max-w-[90%] rounded-2xl px-3.5 py-2 text-xs leading-relaxed ${
                                  isAi
                                    ? "bg-zinc-900 border border-zinc-850 text-zinc-300 rounded-tl-none"
                                    : "bg-indigo-600 text-white rounded-tr-none"
                                }`}
                              >
                                <p className="whitespace-pre-wrap">{displayContent}</p>
                              </div>
                            </div>
                          );
                        })}
                        {chatLoading && (
                          <div className="flex justify-start">
                            <div className="bg-zinc-900 border border-zinc-850 text-zinc-300 rounded-2xl rounded-tl-none px-3.5 py-2 text-xs flex items-center gap-1.5">
                              <Loader2 className="h-3 w-3 animate-spin text-indigo-400" />
                              Agent is planning...
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Input form */}
                      <form onSubmit={handleSendChatMessage} className="flex gap-2">
                        <Input
                          placeholder="Ask or tell agent..."
                          value={chatInput}
                          onChange={(e) => setChatInput(e.target.value)}
                          disabled={chatLoading}
                          className="bg-zinc-900/40 border-zinc-800 focus-visible:ring-indigo-500 text-white rounded-lg flex-1 text-xs h-9"
                        />
                        <Button
                          type="submit"
                          disabled={chatLoading || !chatInput.trim()}
                          className="bg-indigo-600 hover:bg-indigo-500 text-white h-9 px-4 text-xs font-semibold rounded-lg shrink-0"
                        >
                          Send
                        </Button>
                      </form>
                    </div>
                  )}
                </CardContent>
              </Card>

              {plannerError && (
                <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 px-4 py-3 rounded-xl flex items-start gap-2.5">
                  <AlertCircle className="h-5 w-5 mt-0.5 shrink-0" />
                  <span>{plannerError}</span>
                </div>
              )}
            </div>

            {/* AI Trip Planner Output */}
            <div className="lg:col-span-2">
              <AnimatePresence mode="wait">
                {isPlanning && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="flex flex-col items-center justify-center p-12 text-center h-full bg-zinc-950/20 border border-zinc-900 rounded-xl"
                  >
                    <div className="relative mb-6">
                      <div className="h-16 w-16 rounded-full border-t-2 border-indigo-500 animate-spin" />
                      <div className="absolute inset-0 flex items-center justify-center">
                        <Compass className="h-6 w-6 text-indigo-400 animate-pulse" />
                      </div>
                    </div>
                    <h3 className="text-lg font-bold text-white">Synthesizing Travel Agent Intelligence...</h3>
                    <p className="text-zinc-400 text-sm max-w-sm mt-2">
                      Cross-referencing logistics, hotel locations, transportation routes, and budget parameters to formulate the ultimate travel guide.
                    </p>
                  </motion.div>
                )}

                {!isPlanning && !tripPlan && (
                  <div className="flex flex-col items-center justify-center p-12 text-center h-full bg-zinc-950/10 border border-zinc-900 border-dashed rounded-xl">
                    <Compass className="h-12 w-12 text-zinc-600 mb-4" />
                    <h3 className="text-base font-semibold text-zinc-300">Your trip itinerary will generate here</h3>
                    <p className="text-zinc-500 text-xs max-w-xs mt-1.5">
                      Submit details on the left panel to begin. The AI will outline days, calculate costs, and suggest flight codes.
                    </p>
                  </div>
                )}

                {!isPlanning && tripPlan && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-6"
                  >
                    {/* Plan Summary */}
                    <Card className="bg-gradient-to-r from-indigo-950/15 via-zinc-950/40 to-cyan-950/15 border-zinc-900">
                      <CardHeader className="pb-4">
                        <div className="flex justify-between items-start gap-4">
                          <div>
                            <CardTitle className="text-2xl font-black text-white">{tripPlan.tripName}</CardTitle>
                            <div className="flex flex-wrap gap-2 mt-2">
                              {tripPlan.destinations.map((dest, i) => (
                                <Badge key={i} className="bg-zinc-800 text-zinc-300 hover:bg-zinc-800 border-none">
                                  {dest}
                                </Badge>
                              ))}
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-[10px] text-zinc-500 uppercase tracking-wider font-bold">Estimated Cost</p>
                            <p className="text-3xl font-black text-emerald-400">${tripPlan.totalEstimatedBudget}</p>
                            <Badge className="bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 mt-1 font-mono text-[10px]">
                              {tripPlan.duration} Plan
                            </Badge>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="border-t border-zinc-900/60 pt-4">
                        <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2.5">Travel Recommendations</h4>
                        <ul className="space-y-2">
                          {tripPlan.tips.map((tip, idx) => (
                            <li key={idx} className="text-xs text-zinc-300 flex items-start gap-2">
                              <Info className="h-4 w-4 text-cyan-400 shrink-0 mt-0.5" />
                              <span>{tip}</span>
                            </li>
                          ))}
                        </ul>
                      </CardContent>
                    </Card>

                    {/* Itinerary Timeline */}
                    <div className="space-y-4">
                      <h3 className="text-lg font-bold text-white flex items-center gap-2">
                        Day-by-Day Journey <Clock className="h-4 w-4 text-zinc-500" />
                      </h3>

                      <div className="relative pl-6 border-l-2 border-zinc-900 space-y-6">
                        {tripPlan.itinerary.map((dayItem, index) => (
                          <div key={index} className="relative">
                            {/* Dot on line */}
                            <div className="absolute -left-[31px] top-1.5 h-4 w-4 rounded-full bg-zinc-950 border-2 border-indigo-500 flex items-center justify-center">
                              <div className="h-1.5 w-1.5 rounded-full bg-indigo-500 animate-pulse" />
                            </div>

                            <Card className="bg-zinc-950/40 border-zinc-900">
                              <CardHeader className="pb-3 flex flex-row items-center justify-between">
                                <div>
                                  <Badge className="bg-indigo-500/10 text-indigo-400 border-none mr-2 font-black">
                                    Day {dayItem.day}
                                  </Badge>
                                  <span className="font-bold text-white text-base">{dayItem.title}</span>
                                </div>
                                <span className="text-xs font-mono text-emerald-400 font-bold bg-emerald-500/5 px-2.5 py-1 rounded-md border border-emerald-500/10">
                                  ${dayItem.estimatedCost} est.
                                </span>
                              </CardHeader>
                              <CardContent className="space-y-3">
                                <div>
                                  <h5 className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-1.5">Scheduled Events</h5>
                                  <ul className="space-y-1.5">
                                    {dayItem.activities.map((act, actIdx) => (
                                      <li key={actIdx} className="text-xs text-zinc-300 flex items-center gap-2">
                                        <ChevronRight className="h-3.5 w-3.5 text-zinc-500" />
                                        {act}
                                      </li>
                                    ))}
                                  </ul>
                                </div>

                                <div className="flex items-center justify-between gap-1.5 text-xs text-zinc-400 pt-2 border-t border-zinc-900/50">
                                  <div className="flex items-center gap-1.5">
                                    <Plane className="h-3.5 w-3.5 text-zinc-500" />
                                    <span>Transport suggestion: <strong>{dayItem.transport}</strong></span>
                                  </div>
                                  {dayItem.transport && (
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      onClick={() => handleSearchFromItinerary(dayItem, tripPlan)}
                                      className="h-7 text-xs text-indigo-400 hover:text-white hover:bg-indigo-600/20 font-bold"
                                    >
                                      <Search className="h-3 w-3 mr-1" /> Search Rates
                                    </Button>
                                  )}
                                </div>
                              </CardContent>
                            </Card>
                          </div>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </TabsContent>

        {/* BOOKING HISTORY TAB */}
        <TabsContent value="history" className="space-y-6 outline-none">
          <Card className="bg-zinc-950/40 border-zinc-900 backdrop-blur-md">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-white">Your Booking Log</CardTitle>
              <CardDescription>View all travel reservations handled autonomously by Nexora.</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingHistory ? (
                <div className="flex justify-center items-center py-12">
                  <Loader2 className="h-6 w-6 animate-spin text-indigo-400" />
                </div>
              ) : bookingHistory.length === 0 ? (
                <div className="text-center py-12 text-zinc-500">
                  <Ticket className="h-12 w-12 mx-auto mb-3 opacity-20" />
                  <p className="text-sm">No reservations found yet.</p>
                  <p className="text-xs text-zinc-600 mt-1">Bookings you complete on the "Search" tab will register here.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {bookingHistory.map((item) => {
                    const dateStr = new Date(item.timestamp).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit"
                    });

                    const isCancelled = item.status === "cancelled";

                    return (
                      <div
                        key={item.id}
                        className="p-4 rounded-xl bg-zinc-900/30 border border-zinc-900 hover:border-zinc-800 transition-colors"
                      >
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              {isCancelled ? (
                                <Badge className="bg-rose-500/10 text-rose-400 border border-rose-500/20 px-2 py-0.5 rounded text-[10px] uppercase font-bold">
                                  Cancelled
                                </Badge>
                              ) : (
                                <Badge className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded text-[10px] uppercase font-bold">
                                  Confirmed
                                </Badge>
                              )}
                              <span className="text-xs font-mono text-zinc-500">{item.id.slice(0, 8)}</span>
                            </div>
                            <p className="text-sm font-semibold text-white">{item.description}</p>
                            <p className="text-xs text-zinc-400">{item.reasoning}</p>
                          </div>
                          <div className="flex items-center gap-4 text-left md:text-right shrink-0">
                            <span className="text-xs text-zinc-500 font-mono">{dateStr}</span>
                            {!isCancelled && (
                              <Button
                                size="sm"
                                variant="outline"
                                disabled={cancellingId === item.id}
                                onClick={() => handleCancelBooking(item.id)}
                                className="border-rose-500/30 text-rose-400 hover:bg-rose-500 hover:text-white transition-all text-xs font-semibold px-3 h-8 rounded-lg"
                              >
                                {cancellingId === item.id ? (
                                  <Loader2 className="h-3 w-3 animate-spin mr-1.5" />
                                ) : null}
                                Cancel
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* CONFIRM BOOKING DIALOG */}
      <Dialog open={bookingDialogOpen} onOpenChange={setBookingDialogOpen}>
        <DialogContent className="bg-zinc-950 border border-zinc-850 text-white rounded-2xl max-w-md w-[95%]">
          <DialogHeader>
            <DialogTitle className="text-xl font-extrabold text-white flex items-center gap-2">
              <Ticket className="h-5 w-5 text-indigo-400" /> Confirm Free Booking
            </DialogTitle>
            <DialogDescription className="text-zinc-400 text-xs">
              Confirm your choice below. All tickets booked through Nexora are completely free.
            </DialogDescription>
          </DialogHeader>

          {selectedTicket && (
            <div className="space-y-6 my-4">
              <div className="bg-zinc-900/50 p-4 rounded-xl border border-zinc-850 space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Carrier / Operator</span>
                  <span className="text-sm font-bold text-white">{selectedTicket.carrier || selectedTicket.operator}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Route</span>
                  <span className="text-sm font-bold text-white">{selectedTicket.origin} → {selectedTicket.destination}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Date</span>
                  <span className="text-sm font-bold text-white">{selectedTicket.date}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Departure Time</span>
                  <span className="text-sm font-bold text-white">{selectedTicket.departureTime}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Travelers</span>
                  <span className="text-sm font-bold text-white">{passengers} Passengers</span>
                </div>
                <div className="flex justify-between items-center pt-2.5 border-t border-zinc-800">
                  <span className="text-xs font-bold text-indigo-400 uppercase tracking-wider">Calculated Fare</span>
                  <span className="text-base font-extrabold text-indigo-400">${selectedTicket.price} USD</span>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <Button
                  onClick={() => setBookingDialogOpen(false)}
                  variant="outline"
                  className="bg-transparent border-zinc-800 text-zinc-400 hover:bg-zinc-900/50 hover:text-white"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleConfirmBooking}
                  disabled={isBooking}
                  className="bg-indigo-600 hover:bg-indigo-500 text-white font-semibold"
                >
                  {isBooking ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" /> Verifying...
                    </>
                  ) : (
                    "Confirm Booking"
                  )}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* SUCCESS E-TICKET DIALOG */}
      <Dialog open={successDialogOpen} onOpenChange={setSuccessDialogOpen}>
        <DialogContent className="bg-zinc-950 border border-zinc-850 text-white rounded-3xl max-w-lg w-[95%] p-0 overflow-hidden">
          <div className="p-6 bg-gradient-to-br from-indigo-950/40 via-zinc-950 to-zinc-950 space-y-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20 text-emerald-400">
                <CheckCircle className="h-5 w-5 animate-bounce" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white leading-tight">Reservation Autonomous & Confirmed!</h3>
                <p className="text-xs text-zinc-400">Ticket issued autonomously by Nexora booking bots.</p>
              </div>
            </div>
          </div>

          {bookingConfirmed && (
            <div className="px-6 pb-6 space-y-6">
              {/* E-Ticket design */}
              <div className="relative bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden shadow-2xl">
                {/* Dotted Tear Line */}
                <div className="absolute left-0 right-0 top-[65%] border-t border-dashed border-zinc-800 flex items-center justify-between px-0">
                  <div className="h-4 w-4 rounded-full bg-zinc-950 -mt-2 -ml-2 border-r border-zinc-800" />
                  <div className="h-4 w-4 rounded-full bg-zinc-950 -mt-2 -mr-2 border-l border-zinc-800" />
                </div>

                {/* Top Section of ticket */}
                <div className="p-5 pb-8 space-y-5">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-black tracking-widest text-indigo-400 uppercase">
                      Nexora Digital Pass
                    </span>
                    <span className="text-xs font-mono font-bold text-white bg-zinc-800 px-2 py-0.5 rounded">
                      PNR: {bookingConfirmed.pnr}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-[10px] text-zinc-500 uppercase tracking-wider font-bold">Origin</p>
                      <p className="text-base font-bold text-white mt-0.5">{bookingConfirmed.origin}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-zinc-500 uppercase tracking-wider font-bold">Destination</p>
                      <p className="text-base font-bold text-white mt-0.5">{bookingConfirmed.destination}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-zinc-500 uppercase tracking-wider font-bold">Depart Date</p>
                      <p className="text-sm font-bold text-white mt-0.5">{bookingConfirmed.date}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-zinc-500 uppercase tracking-wider font-bold">Departure Time</p>
                      <p className="text-sm font-bold text-white mt-0.5">{bookingConfirmed.departureTime}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-3 border-t border-zinc-850 pt-4">
                    <div>
                      <p className="text-[10px] text-zinc-500 uppercase tracking-wider font-bold">Operator</p>
                      <p className="text-xs font-bold text-white mt-0.5 truncate">{bookingConfirmed.carrier}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-zinc-500 uppercase tracking-wider font-bold">Mode</p>
                      <p className="text-xs font-bold text-white mt-0.5 uppercase">{bookingConfirmed.mode}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-zinc-500 uppercase tracking-wider font-bold">Travelers</p>
                      <p className="text-xs font-bold text-white mt-0.5">{bookingConfirmed.passengers} Pax</p>
                    </div>
                  </div>
                </div>

                {/* Bottom Section of ticket (stub) */}
                <div className="p-5 pt-8 bg-zinc-900/40 flex items-center justify-between gap-4">
                  <div>
                    <p className="text-[10px] text-zinc-500 uppercase tracking-wider font-bold">Total Price</p>
                    <p className="text-2xl font-black text-indigo-400">${bookingConfirmed.totalPrice} USD</p>
                    <span className="text-[9px] text-emerald-400 font-mono">100% DISCOUNTED</span>
                  </div>

                  {/* Simulated barcode */}
                  <div className="flex flex-col items-end gap-1">
                    <div className="flex gap-[2px] items-center h-8 bg-white/5 p-1 rounded">
                      {[1, 2, 1, 3, 2, 1, 4, 2, 1, 3, 1, 2, 1].map((w, idx) => (
                        <div key={idx} className="bg-white h-full" style={{ width: `${w}px` }} />
                      ))}
                    </div>
                    <span className="text-[8px] font-mono text-zinc-500">NEX-{bookingConfirmed.pnr}</span>
                  </div>
                </div>
              </div>

              <div className="flex justify-center">
                <Button
                  onClick={() => setSuccessDialogOpen(false)}
                  className="bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-white font-semibold rounded-xl px-6"
                >
                  Close Receipt
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
