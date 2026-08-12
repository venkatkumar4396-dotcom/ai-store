/**
 * OrchestratorAgent — Bot Agent 4
 * Cross-platform coordination, parallel agent dispatch, conflict resolution,
 * WebSocket streaming, session management.
 * Blueprint Phase 3.2 — Bot Agent 4: OrchestratorAgent 🧠
 */

import { v4 as uuidv4 } from 'uuid';
import { PrismaClient } from '@prisma/client';
import { flightAgent, FlightSearchParams, FlightSearchResult } from './flight.agent';
import { busAgent, BusSearchParams, BusSearchResult } from './bus.agent';
import { trainAgent, TrainSearchParams, TrainSearchResult } from './train.agent';
import { hotelAgent, HotelSearchParams, HotelSearchResult } from './hotel.agent';
import { notifierAgent } from './notifier.agent';
import logger from '../../utils/logger';

const prisma = new PrismaClient();

export type TransportMode = 'flight' | 'bus' | 'train' | 'hotel' | 'multi';

export interface UnifiedSearchRequest {
  origin: string;
  destination: string;
  date: string;
  passengers: number;
  mode: TransportMode;
  class?: string;
  userId?: string;
  sessionId?: string;
}

export interface UnifiedSearchResult {
  correlationId: string;
  searchId: string;
  mode: TransportMode;
  flights?: FlightSearchResult;
  buses?: BusSearchResult;
  trains?: TrainSearchResult;
  hotels?: HotelSearchResult;
  totalResults: number;
  orchestratorLatencyMs: number;
  agentHealthSummary: Record<string, 'healthy' | 'degraded' | 'down'>;
  completedAt: string;
}

// Active search sessions for real-time streaming
const activeSessions = new Map<string, { userId: string; startedAt: number }>();

// WebSocket reference (injected from server)
let ioInstance: any = null;

export function setSocketIO(io: any) {
  ioInstance = io;
}

function emitToSession(sessionId: string, event: string, data: any) {
  if (ioInstance && sessionId) {
    ioInstance.to(sessionId).emit(event, data);
  }
}

const startTime = Date.now();
let totalSearches = 0;
let failedSearches = 0;
const responseTimes: number[] = [];

class OrchestratorAgent {
  private agentId = 'orchestrator';

  async search(request: UnifiedSearchRequest): Promise<UnifiedSearchResult> {
    const t0 = Date.now();
    totalSearches++;
    const correlationId = uuidv4();
    const searchId = uuidv4();

    logger.info(`OrchestratorAgent: Starting ${request.mode} search [${correlationId}]`);

    // Emit search start event
    if (request.sessionId) {
      emitToSession(request.sessionId, 'search:started', {
        correlationId,
        mode: request.mode,
        origin: request.origin,
        destination: request.destination,
      });
      activeSessions.set(request.sessionId, { userId: request.userId || '', startedAt: t0 });
    }

    const commonParams = {
      origin: request.origin,
      destination: request.destination,
      date: request.date,
      passengers: request.passengers,
      userId: request.userId,
      correlationId,
    };

    let flightResults: FlightSearchResult | undefined;
    let busResults: BusSearchResult | undefined;
    let trainResults: TrainSearchResult | undefined;
    let hotelResults: HotelSearchResult | undefined;

    try {
      if (request.mode === 'multi') {
        // Fan out all agents in parallel — blueprint Pattern: Promise.allSettled()
        const [flightR, busR, trainR, hotelR] = await Promise.allSettled([
          flightAgent.search(commonParams),
          busAgent.search(commonParams),
          trainAgent.search(commonParams),
          hotelAgent.search({
            destination: request.destination,
            checkIn: request.date,
            checkOut: new Date(new Date(request.date).getTime() + 86400000).toISOString().split('T')[0],
            guests: request.passengers,
            userId: request.userId,
            correlationId,
          }),
        ]);

        if (flightR.status === 'fulfilled') {
          flightResults = flightR.value;
          emitToSession(request.sessionId || '', 'agent:result', {
            agentId: 'flight',
            correlationId,
            resultCount: flightResults.flights.length,
          });
        }
        if (busR.status === 'fulfilled') {
          busResults = busR.value;
          emitToSession(request.sessionId || '', 'agent:result', {
            agentId: 'bus',
            correlationId,
            resultCount: busResults.routes.length,
          });
        }
        if (trainR.status === 'fulfilled') {
          trainResults = trainR.value;
          emitToSession(request.sessionId || '', 'agent:result', {
            agentId: 'train',
            correlationId,
            resultCount: trainResults.trains.length,
          });
        }
        if (hotelR.status === 'fulfilled') {
          hotelResults = hotelR.value;
          emitToSession(request.sessionId || '', 'agent:result', {
            agentId: 'hotel',
            correlationId,
            resultCount: hotelResults.hotels.length,
          });
        }
      } else if (request.mode === 'flight') {
        flightResults = await flightAgent.search(commonParams);
      } else if (request.mode === 'bus') {
        busResults = await busAgent.search(commonParams);
      } else if (request.mode === 'train') {
        trainResults = await trainAgent.search({
          ...commonParams,
          class: (request.class as any) || '3ac',
        });
      } else if (request.mode === 'hotel') {
        hotelResults = await hotelAgent.search({
          destination: request.destination,
          checkIn: request.date,
          checkOut: new Date(new Date(request.date).getTime() + 86400000).toISOString().split('T')[0],
          guests: request.passengers,
          userId: request.userId,
          correlationId,
        });
      }

      const totalResults =
        (flightResults?.flights.length || 0) +
        (busResults?.routes.length || 0) +
        (trainResults?.trains.length || 0) +
        (hotelResults?.hotels.length || 0);

      const orchestratorLatency = Date.now() - t0;
      responseTimes.push(orchestratorLatency);

      const result: UnifiedSearchResult = {
        correlationId,
        searchId,
        mode: request.mode,
        flights: flightResults,
        buses: busResults,
        trains: trainResults,
        hotels: hotelResults,
        totalResults,
        orchestratorLatencyMs: orchestratorLatency,
        agentHealthSummary: {
          flight: flightAgent.getHealth().status as 'healthy' | 'degraded' | 'down',
          bus: busAgent.getHealth().status as 'healthy' | 'degraded' | 'down',
          train: trainAgent.getHealth().status as 'healthy' | 'degraded' | 'down',
          hotel: hotelAgent.getHealth().status as 'healthy' | 'degraded' | 'down',
          orchestrator: 'healthy',
          notifier: 'healthy',
        },
        completedAt: new Date().toISOString(),
      };

      // Emit completion event
      emitToSession(request.sessionId || '', 'search:complete', {
        correlationId,
        totalResults,
        orchestratorLatencyMs: orchestratorLatency,
      });

      // Queue search-complete notification
      if (request.userId) {
        await notifierAgent.notify({
          userId: request.userId,
          type: 'search_complete',
          channel: 'in_app',
          title: 'Search Complete',
          body: `Found ${totalResults} options for ${request.origin} → ${request.destination}`,
          data: { correlationId, totalResults },
        });
      }

      await this.reportHealth(orchestratorLatency, false);
      return result;
    } catch (error: any) {
      failedSearches++;
      await this.reportHealth(Date.now() - t0, true);
      emitToSession(request.sessionId || '', 'search:error', { correlationId, error: error.message });
      logger.error(`OrchestratorAgent error: ${error.message}`);
      throw error;
    }
  }

  async book(params: {
    mode: 'flight' | 'bus' | 'train' | 'hotel';
    itemId: string;
    userId: string;
    passengerInfo: any;
  }): Promise<{ pnr: string; eTicketUrl: string; mode: string }> {
    let pnr: string;
    let eTicketUrl: string;

    if (params.mode === 'flight') {
      ({ pnr, eTicketUrl } = await flightAgent.book(params.itemId, params.userId, params.passengerInfo));
    } else if (params.mode === 'bus') {
      ({ pnr, eTicketUrl } = await busAgent.book(params.itemId, params.userId, params.passengerInfo));
    } else if (params.mode === 'train') {
      ({ pnr, eTicketUrl } = await trainAgent.book(params.itemId, params.userId, params.passengerInfo));
    } else {
      ({ pnr, eTicketUrl } = await hotelAgent.book(params.itemId, params.userId, params.passengerInfo));
    }

    // Send booking confirmation notification
    await notifierAgent.notify({
      userId: params.userId,
      type: 'booking_confirmed',
      channel: 'in_app',
      title: '✅ Booking Confirmed!',
      body: `Your ${params.mode} booking is confirmed. PNR: ${pnr}`,
      data: { pnr, eTicketUrl, mode: params.mode },
    });

    return { pnr, eTicketUrl, mode: params.mode };
  }

  async getAllAgentHealth() {
    const agents = [
      flightAgent.getHealth(),
      busAgent.getHealth(),
      trainAgent.getHealth(),
      hotelAgent.getHealth(),
      this.getHealth(),
      notifierAgent.getHealth(),
    ];
    return agents;
  }

  private async reportHealth(latencyMs: number, hadError: boolean): Promise<void> {
    const avgLatency = responseTimes.length
      ? responseTimes.slice(-50).reduce((a, b) => a + b, 0) / Math.min(responseTimes.length, 50)
      : latencyMs;
    const errorRate = totalSearches > 0 ? (failedSearches / totalSearches) * 100 : 0;
    const status = errorRate < 5 ? 'healthy' : errorRate < 20 ? 'degraded' : 'down';

    await prisma.agentHealth.upsert({
      where: { agentId: this.agentId },
      update: { status, latency: avgLatency, errorRate, lastPing: new Date() },
      create: { agentId: this.agentId, status, latency: avgLatency, errorRate },
    }).catch(() => { });
  }

  getHealth() {
    const avgLatency = responseTimes.slice(-50).reduce((a, b) => a + b, 0) / Math.max(responseTimes.length, 1);
    const errorRate = totalSearches > 0 ? (failedSearches / totalSearches) * 100 : 0;
    return {
      agentId: this.agentId,
      status: (errorRate < 5 ? 'healthy' : errorRate < 20 ? 'degraded' : 'down') as 'healthy' | 'degraded' | 'down',
      latency: Math.round(avgLatency),
      errorRate: Math.round(errorRate * 10) / 10,
      uptime: Date.now() - startTime,
      totalRequests: totalSearches,
      circuitState: 'closed' as const,
    };
  }
}

export const orchestratorAgent = new OrchestratorAgent();
