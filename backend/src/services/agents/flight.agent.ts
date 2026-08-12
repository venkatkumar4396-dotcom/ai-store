/**
 * FlightAgent — Bot Agent 1
 * Multi-carrier fare aggregation, circuit breaker, route ranking, booking/PNR generation.
 * Blueprint Phase 3.2 — Bot Agent 1: FlightAgent 🛩️
 */

import { v4 as uuidv4 } from 'uuid';
import { PrismaClient } from '@prisma/client';
import { CircuitBreaker } from './circuit-breaker';
import logger from '../../utils/logger';

const prisma = new PrismaClient();

export interface FlightSearchParams {
  origin: string;        // IATA code or city
  destination: string;
  date: string;          // YYYY-MM-DD
  passengers: number;
  class?: 'economy' | 'business' | 'first';
  returnDate?: string;
  userId?: string;
  correlationId?: string;
  sessionId?: string;
}

export interface FlightResult {
  id: string;
  carrier: string;
  flightNo: string;
  origin: string;
  destination: string;
  departure: string;     // ISO datetime
  arrival: string;       // ISO datetime
  duration: string;      // e.g. "2h 45m"
  stops: number;
  price: number;
  currency: string;
  class: string;
  seatsLeft: number;
  isBestDeal?: boolean;
  isBestValue?: boolean;
}

export interface FlightSearchResult {
  searchId: string;
  correlationId: string;
  flights: FlightResult[];
  bestDeal: FlightResult | null;
  bestValue: FlightResult | null;
  agentLatencyMs: number;
  fromCache: boolean;
}

// In-memory cache: key → {data, expiresAt}
const searchCache = new Map<string, { data: FlightSearchResult; expiresAt: number }>();

// Circuit breakers per provider
const amadeusCircuit = new CircuitBreaker(3, 30_000);
const skyscannerCircuit = new CircuitBreaker(3, 30_000);

// Health metrics
let totalRequests = 0;
let failedRequests = 0;
const startTime = Date.now();
const responseTimes: number[] = [];

/** Generate rich mock flight data (production: replace with real API calls) */
function generateMockFlights(params: FlightSearchParams): FlightResult[] {
  const carriers = [
    { name: 'AirMax Express', code: 'AX' },
    { name: 'SkyJet Airways', code: 'SJ' },
    { name: 'QuickAir', code: 'QA' },
    { name: 'BlueSky Airlines', code: 'BS' },
    { name: 'GlobalWings', code: 'GW' },
  ];

  const travelDate = new Date(params.date);
  return carriers.map((carrier, i) => {
    const departHour = 6 + i * 2;
    const durationMins = 90 + i * 30;
    const depart = new Date(travelDate);
    depart.setHours(departHour, 0, 0, 0);
    const arrive = new Date(depart.getTime() + durationMins * 60_000);
    const basePrice = 80 + i * 23 + Math.floor(Math.random() * 20);

    return {
      id: uuidv4(),
      carrier: carrier.name,
      flightNo: `${carrier.code}${100 + i * 11}`,
      origin: params.origin.toUpperCase(),
      destination: params.destination.toUpperCase(),
      departure: depart.toISOString(),
      arrival: arrive.toISOString(),
      duration: `${Math.floor(durationMins / 60)}h ${durationMins % 60}m`,
      stops: i === 2 ? 1 : 0,
      price: basePrice,
      currency: 'USD',
      class: params.class || 'economy',
      seatsLeft: Math.floor(Math.random() * 12) + 1,
    };
  });
}

/** Rank flights and tag best deal / best value */
function rankFlights(flights: FlightResult[]): FlightResult[] {
  const sorted = [...flights].sort((a, b) => a.price - b.price);
  const lowestPrice = sorted[0]?.price;

  // Best value = lowest price-per-minute ratio
  const bestValueFlight = [...flights].sort((a, b) => {
    const durA = parseInt(a.duration) * 60;
    const durB = parseInt(b.duration) * 60;
    return a.price / durA - b.price / durB;
  })[0];

  return sorted.map(f => ({
    ...f,
    isBestDeal: f.price === lowestPrice,
    isBestValue: f.id === bestValueFlight?.id,
  }));
}

class FlightAgent {
  private agentId = 'flight';

  async search(params: FlightSearchParams): Promise<FlightSearchResult> {
    const t0 = Date.now();
    totalRequests++;

    const correlationId = params.correlationId || uuidv4();
    const cacheKey = `flight:${params.origin}:${params.destination}:${params.date}:${params.passengers}`;

    // Check cache (5-min TTL)
    const cached = searchCache.get(cacheKey);
    if (cached && Date.now() < cached.expiresAt) {
      return { ...cached.data, fromCache: true };
    }

    try {
      // Parallel fetch from providers (with circuit breakers)
      const [primaryResults, secondaryResults] = await Promise.allSettled([
        amadeusCircuit.execute(
          () => Promise.resolve(generateMockFlights(params)), // real: amadeus.search()
          () => [] as FlightResult[]
        ),
        skyscannerCircuit.execute(
          () => Promise.resolve([] as FlightResult[]),         // real: skyscanner.search()
          () => [] as FlightResult[]
        ),
      ]);

      const combined = [
        ...(primaryResults.status === 'fulfilled' ? primaryResults.value : []),
        ...(secondaryResults.status === 'fulfilled' ? secondaryResults.value : []),
      ];

      const flights = rankFlights(combined);
      const latency = Date.now() - t0;
      responseTimes.push(latency);

      const result: FlightSearchResult = {
        searchId: uuidv4(),
        correlationId,
        flights,
        bestDeal: flights.find(f => f.isBestDeal) || null,
        bestValue: flights.find(f => f.isBestValue) || null,
        agentLatencyMs: latency,
        fromCache: false,
      };

      // Cache results for 5 minutes
      searchCache.set(cacheKey, { data: result, expiresAt: Date.now() + 5 * 60_000 });

      // Persist search record
      if (params.userId) {
        await prisma.bookingSearch.create({
          data: {
            userId: params.userId,
            correlationId,
            mode: 'flight',
            origin: params.origin,
            destination: params.destination,
            travelDate: new Date(params.date),
            passengers: params.passengers,
            results: JSON.stringify(flights.slice(0, 5)),
            status: 'completed',
          },
        }).catch(() => {}); // non-blocking
      }

      await this.reportHealth(latency, false);
      return result;
    } catch (error: any) {
      failedRequests++;
      await this.reportHealth(Date.now() - t0, true);
      logger.error(`FlightAgent search error: ${error.message}`);
      throw error;
    }
  }

  async book(flightId: string, userId: string, passengerInfo: any): Promise<{ pnr: string; eTicketUrl: string }> {
    const pnr = `FL${Date.now().toString(36).toUpperCase()}`;
    const eTicketUrl = `/tickets/${pnr}.pdf`;

    await prisma.booking.create({
      data: {
        userId,
        searchId: flightId,
        mode: 'flight',
        carrier: passengerInfo.carrier || 'AirMax',
        origin: passengerInfo.origin,
        destination: passengerInfo.destination,
        departureTime: new Date(passengerInfo.departure),
        arrivalTime: new Date(passengerInfo.arrival),
        passengers: passengerInfo.passengers || 1,
        totalPrice: passengerInfo.price || 0,
        currency: 'USD',
        pnr,
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
      circuitState: amadeusCircuit.currentState,
    };
  }
}

export const flightAgent = new FlightAgent();
