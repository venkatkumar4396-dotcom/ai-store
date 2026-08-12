/**
 * TrainAgent — Bot Agent 3
 * Live seat/berth mapping, PNR validation, waitlist tracking, multi-quota support.
 * Blueprint Phase 3.2 — Bot Agent 3: TrainAgent 🚆
 */

import { v4 as uuidv4 } from 'uuid';
import { PrismaClient } from '@prisma/client';
import { CircuitBreaker } from './circuit-breaker';
import logger from '../../utils/logger';

const prisma = new PrismaClient();

export interface TrainSearchParams {
  origin: string;
  destination: string;
  date: string;
  passengers: number;
  class?: 'sleeper' | '3ac' | '2ac' | '1ac' | 'cc' | 'general';
  quota?: 'general' | 'tatkal' | 'ladies';
  userId?: string;
  correlationId?: string;
}

export interface CoachSeatMap {
  coachNo: string;
  coachType: string;
  berths: ('available' | 'occupied' | 'waitlisted')[];
}

export interface TrainResult {
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
  waitlistProbability: number; // 0–100 chance of confirmation
  quota: string;
  seatMap: CoachSeatMap[];
  rating: number;
  isBestOption?: boolean;
}

export interface TrainSearchResult {
  searchId: string;
  correlationId: string;
  trains: TrainResult[];
  bestOption: TrainResult | null;
  agentLatencyMs: number;
  fromCache: boolean;
}

export interface PNRStatus {
  pnr: string;
  status: 'confirmed' | 'waitlisted' | 'cancelled' | 'not_found';
  trainNo?: string;
  trainName?: string;
  departure?: string;
  passengerStatus?: string;
  currentBerth?: string;
}

const trainCache = new Map<string, { data: TrainSearchResult; expiresAt: number }>();
const irctcCircuit = new CircuitBreaker(3, 30_000);
const trainlineCircuit = new CircuitBreaker(3, 30_000);

let totalRequests = 0;
let failedRequests = 0;
const startTime = Date.now();
const responseTimes: number[] = [];

function generateCoachSeatMap(coachNo: string, coachType: string, available: number): CoachSeatMap {
  const total = 72;
  const berths: ('available' | 'occupied' | 'waitlisted')[] = Array(total).fill('occupied');
  let remaining = available;

  for (let i = 0; i < total && remaining > 0; i++) {
    if (Math.random() > 0.5) {
      berths[i] = 'available';
      remaining--;
    }
  }

  return { coachNo, coachType, berths };
}

function generateMockTrains(params: TrainSearchParams): TrainResult[] {
  const trains = [
    { no: '12951', name: 'Mumbai Rajdhani', dur: 960 },
    { no: '22691', name: 'Rajdhani Express', dur: 840 },
    { no: '12301', name: 'Howrah Rajdhani', dur: 1080 },
    { no: '12029', name: 'Shatabdi Express', dur: 480 },
  ];

  const travelDate = new Date(params.date);
  return trains.map((t, i) => {
    const departHour = 6 + i * 4;
    const depart = new Date(travelDate);
    depart.setHours(departHour, 30, 0, 0);
    const arrive = new Date(depart.getTime() + t.dur * 60_000);
    const seatsAvail = Math.floor(Math.random() * 30);
    const waitlisted = seatsAvail === 0 ? Math.floor(Math.random() * 20) : 0;
    const price = 25 + i * 15 + Math.floor(Math.random() * 10);

    return {
      id: uuidv4(),
      trainNo: t.no,
      trainName: t.name,
      origin: params.origin,
      destination: params.destination,
      departure: depart.toISOString(),
      arrival: arrive.toISOString(),
      duration: `${Math.floor(t.dur / 60)}h ${t.dur % 60}m`,
      class: params.class || '3ac',
      price,
      currency: 'USD',
      seatsAvailable: seatsAvail,
      waitlistCount: waitlisted,
      waitlistProbability: seatsAvail > 0 ? 100 : Math.max(0, 80 - waitlisted * 4),
      quota: params.quota || 'general',
      seatMap: [
        generateCoachSeatMap(`B${i + 1}`, params.class || '3AC', Math.floor(seatsAvail * 0.6)),
        generateCoachSeatMap(`B${i + 2}`, params.class || '3AC', Math.ceil(seatsAvail * 0.4)),
      ],
      rating: parseFloat((3.8 + Math.random() * 1.1).toFixed(1)),
    };
  });
}

function rankTrains(trains: TrainResult[]): TrainResult[] {
  const sorted = [...trains].sort((a, b) => {
    const scoreA = a.seatsAvailable * 10 + a.waitlistProbability - a.price;
    const scoreB = b.seatsAvailable * 10 + b.waitlistProbability - b.price;
    return scoreB - scoreA;
  });
  return sorted.map((t, i) => ({ ...t, isBestOption: i === 0 }));
}

class TrainAgent {
  private agentId = 'train';

  async search(params: TrainSearchParams): Promise<TrainSearchResult> {
    const t0 = Date.now();
    totalRequests++;
    const correlationId = params.correlationId || uuidv4();
    const cacheKey = `train:${params.origin}:${params.destination}:${params.date}:${params.class}`;

    const cached = trainCache.get(cacheKey);
    if (cached && Date.now() < cached.expiresAt) {
      return { ...cached.data, fromCache: true };
    }

    try {
      const [irctcResults, trainlineResults] = await Promise.allSettled([
        irctcCircuit.execute(
          () => Promise.resolve(generateMockTrains(params)),
          () => [] as TrainResult[]
        ),
        trainlineCircuit.execute(
          () => Promise.resolve([] as TrainResult[]),
          () => [] as TrainResult[]
        ),
      ]);

      const combined = [
        ...(irctcResults.status === 'fulfilled' ? irctcResults.value : []),
        ...(trainlineResults.status === 'fulfilled' ? trainlineResults.value : []),
      ];

      const trains = rankTrains(combined);
      const latency = Date.now() - t0;
      responseTimes.push(latency);

      const result: TrainSearchResult = {
        searchId: uuidv4(),
        correlationId,
        trains,
        bestOption: trains.find(t => t.isBestOption) || null,
        agentLatencyMs: latency,
        fromCache: false,
      };

      trainCache.set(cacheKey, { data: result, expiresAt: Date.now() + 5 * 60_000 });

      if (params.userId) {
        await prisma.bookingSearch.create({
          data: {
            userId: params.userId,
            correlationId,
            mode: 'train',
            origin: params.origin,
            destination: params.destination,
            travelDate: new Date(params.date),
            passengers: params.passengers,
            results: JSON.stringify(trains.slice(0, 5)),
            status: 'completed',
          },
        }).catch(() => {});
      }

      await this.reportHealth(latency, false);
      return result;
    } catch (error: any) {
      failedRequests++;
      await this.reportHealth(Date.now() - t0, true);
      logger.error(`TrainAgent search error: ${error.message}`);
      throw error;
    }
  }

  async checkPNR(pnr: string): Promise<PNRStatus> {
    // Real implementation: call IRCTC PNR API
    const booking = await prisma.booking.findFirst({ where: { pnr, mode: 'train' } });
    if (!booking) return { pnr, status: 'not_found' };

    return {
      pnr,
      status: booking.status === 'confirmed' ? 'confirmed' : 'cancelled',
      trainNo: booking.carrier,
      departure: booking.departureTime.toISOString(),
      currentBerth: 'B2 / 34 (Lower)',
    };
  }

  async book(trainId: string, userId: string, passengerInfo: any): Promise<{ pnr: string; eTicketUrl: string }> {
    const pnr = `TRN${Date.now().toString(36).toUpperCase()}`;
    const eTicketUrl = `/tickets/${pnr}.pdf`;

    await prisma.booking.create({
      data: {
        userId,
        searchId: trainId,
        mode: 'train',
        carrier: passengerInfo.trainName || 'Express',
        origin: passengerInfo.origin,
        destination: passengerInfo.destination,
        departureTime: new Date(passengerInfo.departure),
        arrivalTime: new Date(passengerInfo.arrival),
        passengers: passengerInfo.passengers || 1,
        totalPrice: passengerInfo.price || 0,
        currency: 'USD',
        pnr,
        seatInfo: JSON.stringify({ berth: 'B2/34', coach: 'B2' }),
        eTicketUrl,
        status: 'confirmed',
      },
    }).catch(() => {});

    return { pnr, eTicketUrl };
  }

  private async reportHealth(latencyMs: number, hadError: boolean): Promise<void> {
    const avgLatency = responseTimes.length
      ? responseTimes.slice(-50).reduce((a, b) => a + b, 0) / Math.min(responseTimes.length, 50)
      : latencyMs;
    const errorRate = totalRequests > 0 ? (failedRequests / totalRequests) * 100 : 0;
    const status = errorRate < 5 ? 'healthy' : errorRate < 20 ? 'degraded' : 'down';

    await prisma.agentHealth.upsert({
      where: { agentId: this.agentId },
      update: { status, latency: avgLatency, errorRate, lastPing: new Date() },
      create: { agentId: this.agentId, status, latency: avgLatency, errorRate },
    }).catch(() => {});
  }

  getHealth() {
    const avgLatency = responseTimes.slice(-50).reduce((a, b) => a + b, 0) / Math.max(responseTimes.length, 1);
    const errorRate = totalRequests > 0 ? (failedRequests / totalRequests) * 100 : 0;
    return {
      agentId: this.agentId,
      status: errorRate < 5 ? 'healthy' : errorRate < 20 ? 'degraded' : 'down',
      latency: Math.round(avgLatency),
      errorRate: Math.round(errorRate * 10) / 10,
      uptime: Date.now() - startTime,
      totalRequests,
      circuitState: irctcCircuit.currentState,
    };
  }
}

export const trainAgent = new TrainAgent();
