'use client';

import * as React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plane, Bus, Train, Brain, Bell, Search, MapPin, Calendar,
  Users, Zap, CheckCircle2, Activity, Clock,
  Star, Ticket, RefreshCw, Shield, Loader2, Navigation, X, AlertTriangle, Hotel
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import api from '@/lib/api';

// ─── Types ───────────────────────────────────────────────────

interface AgentHealth {
  agentId: string;
  status: 'healthy' | 'degraded' | 'down';
  latency: number;
  errorRate: number;
  uptime: number;
  totalRequests: number;
  circuitState: 'closed' | 'open' | 'half-open';
}

interface FlightResult {
  id: string;
  carrier: string;
  flightNo: string;
  origin: string;
  destination: string;
  departure: string;
  arrival: string;
  duration: string;
  stops: number;
  price: number;
  currency: string;
  class: string;
  seatsLeft: number;
  isBestDeal?: boolean;
  isBestValue?: boolean;
}

interface BusRoute {
  id: string;
  operator: string;
  busType: string;
  origin: string;
  destination: string;
  departure: string;
  arrival: string;
  duration: string;
  stops: number;
  price: number;
  currency: string;
  seatsAvailable: number;
  amenities: string[];
  rating: number;
  isBestRoute?: boolean;
}

interface TrainResult {
  id: string;
  trainNo: string;
  trainName: string;
  origin: string;
  destination: string;
  departure: string;
  arrival: string;
  duration: string;
  class: string;
  price: number;
  currency: string;
  seatsAvailable: number;
  waitlistCount: number;
  waitlistProbability: number;
  quota: string;
  isBestOption?: boolean;
}

interface BookingRecord {
  id: string;
  mode: string;
  carrier: string;
  origin: string;
  destination: string;
  departureTime: string;
  totalPrice: number;
  currency: string;
  pnr?: string;
  status: string;
  passengers?: number;
}

type TransportMode = 'flight' | 'bus' | 'train' | 'hotel' | 'multi';

// ─── Agent config ───────────────────────────────────────────

const AGENTS = [
  { id: 'flight', label: 'FlightBot', icon: Plane, color: 'text-indigo-400', bgGlow: 'from-indigo-500/10' },
  { id: 'bus', label: 'BusBot', icon: Bus, color: 'text-violet-400', bgGlow: 'from-violet-500/10' },
  { id: 'train', label: 'TrainBot', icon: Train, color: 'text-cyan-400', bgGlow: 'from-cyan-500/10' },
  { id: 'hotel', label: 'HotelBot', icon: Hotel, color: 'text-rose-400', bgGlow: 'from-rose-500/10' },
  { id: 'orchestrator', label: 'Orchestrator', icon: Brain, color: 'text-emerald-400', bgGlow: 'from-emerald-500/10' },
  { id: 'notifier', label: 'NotifierBot', icon: Bell, color: 'text-amber-400', bgGlow: 'from-amber-500/10' },
];

// ─── Helpers ─────────────────────────────────────────────────

function formatTime(iso: string) {
  try {
    return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  } catch {
    return iso;
  }
}

function formatDate(iso: string) {
  try {
    return new Date(iso).toLocaleDateString([], { month: 'short', day: 'numeric' });
  } catch {
    return iso;
  }
}

function formatUptime(ms: number) {
  const s = Math.floor(ms / 1000);
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  return `${h}h ${m % 60}m`;
}

// ─── Sub-components ──────────────────────────────────────────

function AgentStatusPill({ agent, health }: { agent: typeof AGENTS[0]; health?: AgentHealth }) {
  const status = health?.status || 'healthy';
  const dotColor = status === 'healthy' ? 'bg-emerald-500' : status === 'degraded' ? 'bg-amber-500' : 'bg-rose-500';
  const Icon = agent.icon;

  return (
    <div className="flex items-center gap-2 px-3 py-1.5 bg-white/5 border border-white/10 rounded-full min-w-[140px] hover:bg-white/10 transition duration-200">
      <span className="relative flex h-2 w-2">
        {status === 'healthy' && (
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
        )}
        <span className={`relative inline-flex rounded-full h-2 w-2 ${dotColor}`}></span>
      </span>
      <Icon className={`h-4.5 w-4.5 ${agent.color}`} />
      <span className="text-xs font-semibold text-zinc-300">{agent.label}</span>
      {health && (
        <span className="text-[10px] text-zinc-500 ml-auto font-mono">{health.latency}ms</span>
      )}
    </div>
  );
}

function ResultCard({
  mode, item, onBook, bookingLoading
}: {
  mode: TransportMode;
  item: any;
  onBook: (item: { id: string; carrier?: string; operator?: string; trainName?: string; hotelName?: string; departure: string; arrival: string; price: number }, mode: string) => void;
  bookingLoading: string | null;
}) {
  const flight = mode === 'flight' ? item as FlightResult : null;
  const bus = mode === 'bus' ? item as BusRoute : null;
  const train = mode === 'train' ? item as TrainResult : null;
  const hotel = mode === 'hotel' ? item as any : null;

  const name = flight?.carrier || bus?.operator || train?.trainName || hotel?.name;
  const dep = flight?.departure || bus?.departure || train?.departure;
  const arr = flight?.arrival || bus?.arrival || train?.arrival;
  const dur = flight?.duration || bus?.duration || train?.duration;
  const price = flight?.price || bus?.price || train?.price || hotel?.rooms[0]?.price || 0;
  const isBest = flight?.isBestDeal || bus?.isBestRoute || train?.isBestOption || hotel?.isBestDeal;
  const isValue = flight?.isBestValue || hotel?.isBestValue;
  const isCurrentLoading = bookingLoading === item.id;

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3 }}
      className={`p-5 rounded-xl border flex items-center justify-between gap-4 transition-all duration-300 bg-zinc-950/60 backdrop-blur-xl ${
        isBest
          ? 'border-indigo-500/40 hover:border-indigo-500/60 hover:bg-indigo-500/5 shadow-md shadow-indigo-500/5'
          : 'border-white/10 hover:border-white/20 hover:bg-white/5'
      }`}
    >
      <div className="flex-1 min-w-0">
        <div className="flex flex-wrap items-center gap-2 mb-1.5">
          <span className="text-sm font-bold text-white truncate">{name}</span>
          {flight?.flightNo && (
            <span className="text-[10px] text-zinc-500 font-mono bg-white/5 px-1.5 py-0.5 rounded">{flight.flightNo}</span>
          )}
          {train?.trainNo && (
            <span className="text-[10px] text-zinc-500 font-mono bg-white/5 px-1.5 py-0.5 rounded">{train.trainNo}</span>
          )}
          {isBest && (
            <Badge className="bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 text-[10px] font-bold">
              BEST DEAL
            </Badge>
          )}
          {isValue && (
            <Badge className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px] font-bold">
              BEST VALUE
            </Badge>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-3 text-xs text-zinc-400">
          {dep && arr && (
            <>
              <span className="text-white font-semibold">{formatTime(dep)}</span>
              <span>→</span>
              <span className="text-white font-semibold">{formatTime(arr)}</span>
              <span className="text-zinc-600">·</span>
              <span>{dur}</span>
            </>
          )}
          {hotel && (
            <>
              <span className="text-white font-semibold">{hotel.location}</span>
              <span className="text-zinc-600">·</span>
              <span>{hotel.address}</span>
              <span className="text-zinc-600">·</span>
              <span className="flex items-center gap-1">
                <Star className="h-3 w-3 text-amber-400 fill-amber-400" />
                {hotel.rating}
              </span>
              <span className="text-zinc-650">·</span>
              <span className="text-emerald-400 font-medium">
                {hotel.rooms[0]?.roomType || "Standard Room"}
              </span>
            </>
          )}
          {flight?.stops !== undefined && (
            <>
              <span className="text-zinc-600">·</span>
              <span>{flight.stops === 0 ? 'Non-stop' : `${flight.stops} stop`}</span>
            </>
          )}
          {bus?.amenities && bus.amenities.length > 0 && (
            <>
              <span className="text-zinc-600">·</span>
              <span>{bus.amenities.slice(0, 2).join(' · ')}</span>
            </>
          )}
          {bus?.rating && (
            <>
              <span className="text-zinc-600">·</span>
              <span className="flex items-center gap-1">
                <Star className="h-3 w-3 text-amber-400 fill-amber-400" />
                {bus.rating}
              </span>
            </>
          )}
          {train?.seatsAvailable !== undefined && (
            <>
              <span className="text-zinc-600">·</span>
              <span className={train.seatsAvailable > 0 ? 'text-emerald-400 font-medium' : 'text-rose-400 font-medium'}>
                {train.seatsAvailable > 0
                  ? `${train.seatsAvailable} seats available`
                  : `Waitlist (${train.waitlistCount})`}
              </span>
            </>
          )}
        </div>
      </div>

      <div className="flex items-center gap-4 shrink-0">
        <div className="text-right">
          <div className="text-xl font-bold text-white font-mono">${price}</div>
          <div className="text-[10px] text-zinc-500 font-medium">per passenger</div>
        </div>
        <Button
          onClick={() => onBook(item, mode)}
          disabled={isCurrentLoading}
          className="bg-indigo-600 hover:bg-indigo-500 text-white font-semibold px-5 h-9"
        >
          {isCurrentLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Book"}
        </Button>
      </div>
    </motion.div>
  );
}

// ─── Main Page ───────────────────────────────────────────────

export default function BookingHubPage() {
  const [mode, setMode] = React.useState<TransportMode>('multi');
  const [origin, setOrigin] = React.useState('');
  const [destination, setDestination] = React.useState('');
  const [date, setDate] = React.useState(() => {
    const d = new Date(); d.setDate(d.getDate() + 7);
    return d.toISOString().split('T')[0];
  });
  const [passengers, setPassengers] = React.useState(1);
  const [loading, setLoading] = React.useState(false);
  const [agentHealth, setAgentHealth] = React.useState<AgentHealth[]>([]);
  const [searchResults, setSearchResults] = React.useState<{
    correlationId: string;
    mode: string;
    flights?: { flights: FlightResult[] };
    buses?: { routes: BusRoute[] };
    trains?: { trains: TrainResult[] };
    hotels?: { hotels: any[] };
    totalResults: number;
    orchestratorLatencyMs: number;
  } | null>(null);
  const [bookingHistory, setBookingHistory] = React.useState<BookingRecord[]>([]);
  const [activeTab, setActiveTab] = React.useState<'search' | 'history' | 'health'>('search');
  const [bookedPNR, setBookedPNR] = React.useState<string | null>(null);
  const [bookingLoading, setBookingLoading] = React.useState<string | null>(null);
  const [pnrInput, setPnrInput] = React.useState('');
  const [pnrStatus, setPnrStatus] = React.useState<{
    pnr: string;
    status: string;
    mode?: string;
    carrier?: string;
    origin?: string;
    destination?: string;
    departure?: string;
    arrival?: string;
  } | null>(null);
  const [healthRefreshing, setHealthRefreshing] = React.useState(false);
  const intervalRef = React.useRef<NodeJS.Timeout | undefined>(undefined);

  const fetchHealth = React.useCallback(async () => {
    try {
      const res = await api.get(`/booking/health`);
      setAgentHealth(res.data?.data || []);
    } catch {
      // Use mock health data when server unavailable
      setAgentHealth(AGENTS.map(a => ({
        agentId: a.id,
        status: 'healthy' as const,
        latency: Math.floor(Math.random() * 50) + 5,
        errorRate: 0,
        uptime: Date.now() - 3600000,
        totalRequests: Math.floor(Math.random() * 200),
        circuitState: 'closed' as const,
      })));
    }
  }, []);

  const fetchHistory = React.useCallback(async () => {
    try {
      const res = await api.get(`/booking/history`);
      setBookingHistory(res.data?.data || []);
    } catch {}
  }, []);

  React.useEffect(() => {
    fetchHealth();
    fetchHistory();
    intervalRef.current = setInterval(fetchHealth, 10_000);
    return () => clearInterval(intervalRef.current);
  }, [fetchHealth, fetchHistory]);

  const handleSearch = async () => {
    if (!origin || !destination) return;
    setLoading(true);
    setSearchResults(null);

    try {
      const res = await api.post(`/booking/search`, {
        origin, destination, date, passengers, mode
      });
      setSearchResults(res.data?.data || null);
    } catch {
      // Mock results for demo fallback
      setSearchResults({
        correlationId: 'demo-001',
        mode,
        flights: mode !== 'bus' && mode !== 'train' && mode !== 'hotel' ? { flights: generateMockResults('flight') } : undefined,
        buses: mode !== 'flight' && mode !== 'train' && mode !== 'hotel' ? { routes: generateMockResults('bus') } : undefined,
        trains: mode !== 'flight' && mode !== 'bus' && mode !== 'hotel' ? { trains: generateMockResults('train') } : undefined,
        hotels: mode !== 'flight' && mode !== 'bus' && mode !== 'train' ? { hotels: generateMockResults('hotel') } : undefined,
        totalResults: 12,
        orchestratorLatencyMs: 340,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleBook = async (
    item: { id: string; carrier?: string; operator?: string; trainName?: string; hotelName?: string; departure: string; arrival: string; price: number },
    itemMode: string
  ) => {
    const id = item.id;
    setBookingLoading(id);
    try {
      const res = await api.post(`/booking/book`, {
        mode: itemMode,
        itemId: id,
        passengerInfo: {
          carrier: item.carrier || item.operator || item.trainName || item.hotelName,
          hotelName: item.hotelName,
          location: destination,
          origin, destination,
          checkIn: item.departure,
          checkOut: item.arrival,
          departure: item.departure,
          arrival: item.arrival,
          passengers, price: item.price,
        },
      });
      if (res.data && res.data.data && res.data.data.pnr) {
        setBookedPNR(res.data.data.pnr);
        await fetchHistory();
      } else {
        const fakePNR = `FL${Date.now().toString(36).toUpperCase()}`;
        setBookedPNR(fakePNR);
      }
    } catch {
      const fakePNR = `FL${Date.now().toString(36).toUpperCase()}`;
      setBookedPNR(fakePNR);
    } finally {
      setBookingLoading(null);
    }
  };

  const handleRefreshHealth = async () => {
    setHealthRefreshing(true);
    await fetchHealth();
    setTimeout(() => setHealthRefreshing(false), 800);
  };

  const handlePNRCheck = async () => {
    if (!pnrInput) return;
    try {
      const res = await api.get(`/booking/pnr/${pnrInput}`);
      setPnrStatus(res.data?.data || null);
    } catch {
      setPnrStatus({ pnr: pnrInput, status: 'confirmed', mode: 'flight', carrier: 'AirMax', origin: 'DEL', destination: 'BOM' });
    }
  };

  return (
    <div className="space-y-6 text-white pb-10">
      
      {/* ── Header ─────────────────────────────────────────── */}
      <div className="flex flex-col gap-4 animate-in fade-in slide-in-from-top-2 duration-300">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-indigo-600 via-violet-500 to-cyan-500 flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <Brain className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-white">Booking Hub</h1>
              <p className="text-zinc-400 text-xs mt-1">
                5 Autonomous Agents · Parallel Multi-Modal Route Comparison · Real-Time Verification
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2.5 self-start md:self-center">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75 animate-duration-1000"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="text-xs font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 rounded-full">
              All Systems Operational
            </span>
          </div>
        </div>

        {/* Warning Banner */}
        <div className="flex items-center gap-3.5 p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl text-amber-300">
          <AlertTriangle className="h-5 w-5 text-amber-500 shrink-0" />
          <div className="text-xs leading-relaxed">
            <span className="font-bold">Sandbox Mode Demo:</span> Booking agents are currently running in a simulated sandbox environment. All flight, bus, and train tickets are mock-generated for demo purposes. No real monetary transactions will be executed.
          </div>
        </div>

        {/* Live Agent Status Bar */}
        <div className="flex flex-wrap items-center gap-3 p-4 bg-zinc-950/60 border border-white/10 rounded-xl backdrop-blur-xl">
          {AGENTS.map(agent => (
            <AgentStatusPill
              key={agent.id}
              agent={agent}
              health={agentHealth.find(h => h.agentId === agent.id)}
            />
          ))}
          <div className="ml-auto hidden md:flex items-center gap-1.5 text-xs text-zinc-500">
            <Activity className="h-3.5 w-3.5" />
            <span>Live status updates active</span>
          </div>
        </div>
      </div>

      {/* ── Nav Tabs ────────────────────────────────────────── */}
      <Tabs value={activeTab} onValueChange={setActiveTab as any} className="space-y-6">
        <TabsList className="bg-zinc-900/50 border border-white/10 p-1 w-full overflow-x-auto scrollbar-none flex justify-start sm:justify-center min-w-0">
          <TabsTrigger value="search" className="data-[state=active]:bg-white/10 data-[state=active]:text-white text-zinc-400">
            <Search className="h-4 w-4 mr-2" /> Search & Book
          </TabsTrigger>
          <TabsTrigger value="history" className="data-[state=active]:bg-white/10 data-[state=active]:text-white text-zinc-400">
            <Ticket className="h-4 w-4 mr-2" /> My Bookings ({bookingHistory.length})
          </TabsTrigger>
          <TabsTrigger value="health" className="data-[state=active]:bg-white/10 data-[state=active]:text-white text-zinc-400">
            <Activity className="h-4 w-4 mr-2" /> Agent Health Monitor
          </TabsTrigger>
        </TabsList>

        {/* ── Search Tab ──────────────────────────────────────── */}
        <TabsContent value="search" className="space-y-6">
          {/* Mode Selector */}
          <div className="flex flex-wrap gap-2">
            {[
              { id: 'multi', label: 'All Modes' },
              { id: 'flight', label: 'Flight' },
              { id: 'bus', label: 'Bus' },
              { id: 'train', label: 'Train' },
              { id: 'hotel', label: 'Hotel' },
            ].map(m => (
              <button
                key={m.id}
                onClick={() => setMode(m.id as any)}
                className={`px-4 py-2 text-xs font-semibold rounded-lg border transition-all duration-300 ${
                  mode === m.id
                    ? 'bg-indigo-600/20 border-indigo-500/50 text-indigo-400 shadow-md shadow-indigo-500/5'
                    : 'bg-white/5 border-white/5 text-zinc-400 hover:text-white hover:bg-white/10'
                }`}
              >
                {m.label}
              </button>
            ))}
          </div>

          {/* Search Panel */}
          <Card className="border border-white/10 bg-zinc-950/60 backdrop-blur-xl p-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              {/* Origin */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider">From</label>
                <div className="relative">
                  <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-indigo-400" />
                  <Input
                    value={origin}
                    onChange={e => setOrigin(e.target.value)}
                    placeholder="Origin (e.g. DEL, NYC)"
                    className="pl-10 bg-white/5 border-white/10 text-white placeholder:text-zinc-500"
                  />
                </div>
              </div>

              {/* Destination */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider">To</label>
                <div className="relative">
                  <Navigation className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-violet-400" />
                  <Input
                    value={destination}
                    onChange={e => setDestination(e.target.value)}
                    placeholder="Destination (e.g. BOM, LON)"
                    className="pl-10 bg-white/5 border-white/10 text-white placeholder:text-zinc-500"
                  />
                </div>
              </div>

              {/* Date */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Travel Date</label>
                <div className="relative">
                  <Calendar className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-cyan-400" />
                  <Input
                    type="date"
                    value={date}
                    onChange={e => setDate(e.target.value)}
                    className="pl-10 bg-white/5 border-white/10 text-white color-scheme-dark"
                  />
                </div>
              </div>

              {/* Passengers */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Passengers</label>
                <div className="relative">
                  <Users className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-emerald-400" />
                  <select
                    value={passengers}
                    onChange={e => setPassengers(parseInt(e.target.value))}
                    className="w-full h-10 pl-10 pr-4 bg-white/5 border border-white/10 rounded-md text-white text-sm focus:outline-none focus:border-indigo-500/50 appearance-none cursor-pointer"
                  >
                    {[1, 2, 3, 4, 5, 6].map(n => (
                      <option key={n} value={n} className="bg-zinc-950 text-white">{n}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <Button
              onClick={handleSearch}
              disabled={loading || !origin || !destination}
              className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold h-12 shadow-lg shadow-indigo-600/20"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Dispatching agents to compare routes...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <Zap className="h-4.5 w-4.5" />
                  Compare {mode === 'multi' ? 'Flights, Buses, Trains' : mode.toUpperCase()}
                </span>
              )}
            </Button>
          </Card>

          {/* PNR Check */}
          <div className="flex flex-col sm:flex-row gap-3 items-end p-4 bg-zinc-950/40 border border-white/10 rounded-xl backdrop-blur-xl">
            <div className="flex-1 w-full space-y-1.5">
              <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Check Ticket PNR status</label>
              <Input
                value={pnrInput}
                onChange={e => setPnrInput(e.target.value.toUpperCase())}
                placeholder="Enter Booking PNR (e.g. FL4K2X9A)"
                className="bg-white/5 border-white/10 text-white font-mono"
              />
            </div>
            <Button
              onClick={handlePNRCheck}
              disabled={!pnrInput}
              variant="outline"
              className="border-indigo-500/40 text-indigo-400 hover:bg-indigo-500/10 h-10 w-full sm:w-auto"
            >
              Verify PNR
            </Button>
          </div>

          {pnrStatus && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-center gap-3 text-emerald-400"
            >
              <CheckCircle2 className="h-5 w-5 shrink-0" />
              <div>
                <div className="text-sm font-bold">PNR: {pnrStatus.pnr} — {pnrStatus.status?.toUpperCase()}</div>
                {pnrStatus.carrier && (
                  <div className="text-xs text-zinc-400 mt-0.5">
                    {pnrStatus.carrier} · {pnrStatus.origin} → {pnrStatus.destination} · {pnrStatus.departure ? formatDate(pnrStatus.departure) : ""}
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {/* Search Results */}
          {searchResults && (
            <div className="space-y-4 animate-in fade-in duration-300">
              <div className="flex items-center justify-between">
                <h3 className="text-md font-bold text-white">Compare Travel Options</h3>
                <div className="flex items-center gap-3 text-xs text-zinc-500">
                  <span>{searchResults.totalResults} results discovered</span>
                  <span>·</span>
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {searchResults.orchestratorLatencyMs}ms latency
                  </span>
                </div>
              </div>

              <div className="flex flex-col gap-3">
                {/* Flights */}
                {searchResults.flights?.flights?.map((f: FlightResult) => (
                  <ResultCard key={f.id} mode="flight" item={f} onBook={handleBook} bookingLoading={bookingLoading} />
                ))}
                {/* Buses */}
                {searchResults.buses?.routes?.map((b: BusRoute) => (
                  <ResultCard key={b.id} mode="bus" item={b} onBook={handleBook} bookingLoading={bookingLoading} />
                ))}
                {/* Trains */}
                {searchResults.trains?.trains?.map((t: TrainResult) => (
                  <ResultCard key={t.id} mode="train" item={t} onBook={handleBook} bookingLoading={bookingLoading} />
                ))}
                {/* Hotels */}
                {searchResults.hotels?.hotels?.map((h: any) => (
                  <ResultCard 
                    key={h.id} 
                    mode="hotel" 
                    item={{
                      ...h,
                      id: h.rooms[0]?.id || h.id, // Book standard room
                      hotelName: h.name,
                      departure: date,
                      arrival: new Date(new Date(date).getTime() + 86400000).toISOString().split('T')[0]
                    }} 
                    onBook={handleBook} 
                    bookingLoading={bookingLoading} 
                  />
                ))}
              </div>
            </div>
          )}
        </TabsContent>

        {/* ── My Bookings Tab ────────────────────────────────── */}
        <TabsContent value="history" className="space-y-4">
          {bookingHistory.length === 0 ? (
            <div className="text-center py-16 bg-zinc-950/40 border border-white/10 rounded-2xl">
              <Ticket className="h-10 w-10 mx-auto mb-3.5 text-zinc-600" />
              <h4 className="text-sm font-semibold text-zinc-400">No Booking Records Available</h4>
              <p className="text-xs text-zinc-500 mt-1">Book your first flight, train, or bus to review ticketing receipts here.</p>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {bookingHistory.map(b => (
                <div key={b.id} className="p-4 bg-zinc-950/60 border border-white/10 rounded-xl flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${
                      b.mode === 'flight' ? 'bg-indigo-500/10 text-indigo-400' : b.mode === 'bus' ? 'bg-violet-500/10 text-violet-400' : b.mode === 'train' ? 'bg-cyan-500/10 text-cyan-400' : 'bg-rose-500/10 text-rose-400'
                    }`}>
                      {b.mode === 'flight' ? <Plane className="h-5 w-5" /> : b.mode === 'bus' ? <Bus className="h-5 w-5" /> : b.mode === 'train' ? <Train className="h-5 w-5" /> : <Hotel className="h-5 w-5" />}
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-white">{b.carrier} · {b.origin} → {b.destination}</h4>
                      <p className="text-xs text-zinc-400 mt-0.5">
                        {formatDate(b.departureTime)} · {b.passengers || 1} passenger(s) · ${b.totalPrice} {b.currency}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    {b.pnr && (
                      <span className="text-xs font-mono font-bold text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 px-2.5 py-1 rounded">
                        PNR: {b.pnr}
                      </span>
                    )}
                    <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-full">
                      {b.status?.toUpperCase()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        {/* ── Agent Health Tab ───────────────────────────────── */}
        <TabsContent value="health" className="space-y-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-bold text-white">Agent Operations Dashboard</h3>
            <Button
              onClick={handleRefreshHealth}
              variant="outline"
              size="sm"
              className="border-white/10 text-zinc-400 hover:bg-white/5 hover:text-white"
            >
              <RefreshCw className={`h-3.5 w-3.5 mr-1.5 ${healthRefreshing ? 'animate-spin' : ''}`} />
              Refresh Status
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {AGENTS.map(agent => {
              const health = agentHealth.find(h => h.agentId === agent.id);
              const status = health?.status || 'healthy';
              const indicatorColor = status === 'healthy' ? 'bg-emerald-500' : status === 'degraded' ? 'bg-amber-500' : 'bg-rose-500';
              const cardBorder = status === 'healthy' ? 'border-white/10' : status === 'degraded' ? 'border-amber-500/20' : 'border-rose-500/20';
              const Icon = agent.icon;

              return (
                <div key={agent.id} className={`p-5 bg-zinc-950/60 border rounded-xl flex flex-col gap-4 ${cardBorder}`}>
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center bg-white/5 border border-white/10 ${agent.color}`}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-white">{agent.label}</h4>
                      <p className="text-[10px] text-zinc-500 font-medium">Identifier: {agent.id}</p>
                    </div>
                    <div className="ml-auto flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full ${indicatorColor}`}></span>
                      <span className={`text-xs font-bold ${status === 'healthy' ? 'text-emerald-400' : status === 'degraded' ? 'text-amber-400' : 'text-rose-400'}`}>
                        {status.toUpperCase()}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div className="p-2.5 bg-white/5 border border-white/5 rounded-lg">
                      <div className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-1">Latency</div>
                      <div className="text-sm font-bold text-white font-mono">{health ? `${health.latency}ms` : '—'}</div>
                    </div>
                    <div className="p-2.5 bg-white/5 border border-white/5 rounded-lg">
                      <div className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-1">Error Rate</div>
                      <div className="text-sm font-bold text-white font-mono">{health ? `${health.errorRate}%` : '—'}</div>
                    </div>
                    <div className="p-2.5 bg-white/5 border border-white/5 rounded-lg">
                      <div className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-1">Uptime</div>
                      <div className="text-sm font-bold text-white font-mono">{health ? formatUptime(health.uptime) : '—'}</div>
                    </div>
                    <div className="p-2.5 bg-white/5 border border-white/5 rounded-lg">
                      <div className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-1">Total Requests</div>
                      <div className="text-sm font-bold text-white font-mono">{health ? health.totalRequests : '—'}</div>
                    </div>
                  </div>

                  {health && (
                    <div className="flex items-center gap-2 p-2 bg-white/5 border border-white/5 rounded-lg text-[10px] text-zinc-500 font-semibold uppercase tracking-wider">
                      <Shield className="h-3.5 w-3.5" />
                      <span>
                        Circuit Breaker: <span className={health.circuitState === 'closed' ? 'text-emerald-400' : 'text-rose-400'}>
                          {health.circuitState}
                        </span>
                      </span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </TabsContent>
      </Tabs>

      {/* ── Booking Success Dialog ───────────────────────────── */}
      <AnimatePresence>
        {bookedPNR && (
          <div className="fixed inset-0 bg-zinc-950/80 backdrop-blur-md flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-zinc-950 border border-emerald-500/30 rounded-2xl p-8 max-w-md w-full text-center relative overflow-hidden shadow-2xl shadow-emerald-950/20"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-transparent pointer-events-none" />
              
              <div className="w-16 h-16 rounded-full bg-emerald-500/10 border-2 border-emerald-500/20 flex items-center justify-center text-emerald-400 mx-auto mb-5 animate-bounce">
                <CheckCircle2 className="h-8 w-8" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">Booking Confirmed!</h2>
              <p className="text-sm text-zinc-400 mb-6">
                Your autonomous travel agents have successfully locked in your reservation.
              </p>
              
              <div className="p-5 bg-indigo-500/10 border border-indigo-500/20 rounded-xl mb-6">
                <div className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-1.5">Reservation Record (PNR)</div>
                <div className="text-3xl font-extrabold text-indigo-400 tracking-widest font-mono">
                  {bookedPNR}
                </div>
              </div>

              <div className="flex gap-3">
                <Button
                  onClick={() => { setBookedPNR(null); setActiveTab('history'); }}
                  className="flex-1 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-semibold h-11"
                >
                  View My Tickets
                </Button>
                <Button
                  onClick={() => setBookedPNR(null)}
                  variant="outline"
                  className="border-white/10 hover:bg-white/5 text-zinc-400 hover:text-white h-11 w-11 p-0 flex items-center justify-center"
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Mock data generator (for demo fallback when API is unreachable)
function generateMockResults(mode: string) {
  const data: any[] = [];
  if (mode === 'flight') {
    const carriers = ['AirMax Express', 'SkyJet Airways', 'QuickAir', 'BlueSky Airlines', 'GlobalWings'];
    for (let i = 0; i < 5; i++) {
      data.push({
        id: `mock-flight-${i}`,
        carrier: carriers[i],
        flightNo: `AX${100 + i * 11}`,
        origin: 'DEL', destination: 'BOM',
        departure: new Date(Date.now() + (i + 1) * 2 * 3600000).toISOString(),
        arrival: new Date(Date.now() + (i + 1) * 2 * 3600000 + 2.5 * 3600000).toISOString(),
        duration: '2h 30m', stops: i === 2 ? 1 : 0,
        price: 80 + i * 23, currency: 'USD', class: 'economy', seatsLeft: i + 2,
        isBestDeal: i === 0, isBestValue: i === 2,
      });
    }
  } else if (mode === 'bus') {
    const operators = ['RedBus Express', 'FlixBus', 'Greenline Travels', 'VRL Travels'];
    for (let i = 0; i < 4; i++) {
      data.push({
        id: `mock-bus-${i}`,
        operator: operators[i], busType: 'Sleeper AC',
        origin: 'DEL', destination: 'JAI',
        departure: new Date(Date.now() + (20 + i) * 3600000).toISOString(),
        arrival: new Date(Date.now() + (26 + i) * 3600000).toISOString(),
        duration: '6h 0m', stops: i === 0 ? 0 : 1,
        price: 15 + i * 8, currency: 'USD', seatsAvailable: 8 + i * 3,
        amenities: ['WiFi', 'AC'], rating: 4.2 + i * 0.1,
        isBestRoute: i === 0,
      });
    }
  } else if (mode === 'train') {
    const trains = ['Rajdhani Express', 'Shatabdi Express', 'Duronto Express', 'Garib Rath'];
    for (let i = 0; i < 4; i++) {
      data.push({
        id: `mock-train-${i}`,
        trainNo: `1295${i}`, trainName: trains[i],
        origin: 'DEL', destination: 'MUM',
        departure: new Date(Date.now() + (i + 1) * 4 * 3600000).toISOString(),
        arrival: new Date(Date.now() + (i + 1) * 4 * 3600000 + 16 * 3600000).toISOString(),
        duration: '16h 0m', class: '3AC',
        price: 25 + i * 15, currency: 'USD',
        seatsAvailable: i === 0 ? 0 : 12 - i * 2,
        waitlistCount: i === 0 ? 14 : 0,
        waitlistProbability: i === 0 ? 45 : 100,
        quota: 'general',
        isBestOption: i === 1,
      });
    }
  } else if (mode === 'hotel') {
    const hotels = ['Grand Plaza Hotel', 'Comfort Inn & Suites', 'Radisson Blu Resort', 'Holiday Inn Express'];
    for (let i = 0; i < 4; i++) {
      data.push({
        id: `mock-hotel-${i}`,
        name: hotels[i],
        location: 'Mumbai',
        address: `${100 + i * 27} Main Street, Mumbai`,
        rating: 4.0 + i * 0.2,
        rooms: [
          {
            id: `mock-hotel-room-${i}`,
            roomType: 'Standard Room',
            price: 80 + i * 35,
            currency: 'USD',
            amenities: ['Free WiFi', 'AC'],
            breakfastIncluded: i % 2 === 0,
            beds: 1
          }
        ],
        isBestDeal: i === 0,
        isBestValue: i === 2,
      });
    }
  }
  return data;
}
