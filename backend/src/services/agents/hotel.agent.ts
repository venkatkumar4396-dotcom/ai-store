/**
 * HotelAgent — Bot Agent 6
 * Hotel searches, bookings, room layouts, caching, circuit breakers, and health checks.
 */

import { v4 as uuidv4 } from 'uuid';
import { PrismaClient } from '@prisma/client';
import { CircuitBreaker } from './circuit-breaker';
import logger from '../../utils/logger';

const prisma = new PrismaClient();

export interface HotelSearchParams {
  destination: string;    // City or region
  checkIn: string;        // YYYY-MM-DD
  checkOut: string;       // YYYY-MM-DD
  guests: number;
  rooms?: number;
  userId?: string;
  correlationId?: string;
}

export interface HotelRoom {
  id: string;
  roomType: string;       // e.g. "Deluxe Double", "Suite"
  price: number;
  currency: string;
  amenities: string[];
  breakfastIncluded: boolean;
  beds: number;
}

export interface HotelResult {
  id: string;
  name: string;
  location: string;
  rating: number;         // 1.0 - 5.0
  address: string;
  rooms: HotelRoom[];
  priceRange: string;     // e.g. "$100 - $250"
  imageUrl?: string;
  isBestDeal?: boolean;   // Tag for lowest price
  isBestValue?: boolean;  // Tag for best combination of rating/price
}

export interface HotelSearchResult {
  searchId: string;
  correlationId: string;
  hotels: HotelResult[];
  bestDeal: HotelResult | null;
  bestValue: HotelResult | null;
  agentLatencyMs: number;
  fromCache: boolean;
}

// In-memory cache with 5-minute TTL
const hotelCache = new Map<string, { data: HotelSearchResult; expiresAt: number }>();

// Circuit breakers for hotel providers
const bookingComCircuit = new CircuitBreaker(3, 30_000);
const expediaCircuit = new CircuitBreaker(3, 30_000);

// Monitoring metrics
let totalRequests = 0;
let failedRequests = 0;
const startTime = Date.now();
const responseTimes: number[] = [];

/** Generate rich mock hotel data */
function generateMockHotels(params: HotelSearchParams): HotelResult[] {
  const brandNames = [
    { name: 'Grand Plaza Hotel', location: params.destination, rating: 4.8 },
    { name: 'Comfort Inn & Suites', location: params.destination, rating: 4.1 },
    { name: 'Radisson Blu Resort', location: params.destination, rating: 4.6 },
    { name: 'Holiday Inn Express', location: params.destination, rating: 4.0 },
    { name: 'The Ritz-Carlton', location: params.destination, rating: 4.9 },
  ];

  return brandNames.map((hotel, i) => {
    const basePrice = 80 + i * 45 + Math.floor(Math.random() * 20);

    const rooms: HotelRoom[] = [
      {
        id: uuidv4(),
        roomType: 'Standard Room',
        price: basePrice,
        currency: 'USD',
        amenities: ['Free WiFi', 'Air Conditioning'],
        breakfastIncluded: i % 2 === 0,
        beds: 1,
      },
      {
        id: uuidv4(),
        roomType: 'Deluxe Room',
        price: Math.round(basePrice * 1.3),
        currency: 'USD',
        amenities: ['Free WiFi', 'Air Conditioning', 'Mini Bar', 'Ocean View'],
        breakfastIncluded: true,
        beds: 2,
      },
    ];

    return {
      id: uuidv4(),
      name: hotel.name,
      location: hotel.location,
      rating: hotel.rating,
      address: `${100 + i * 27} Main Street, ${hotel.location}`,
      rooms,
      priceRange: `$${basePrice} - $${Math.round(basePrice * 1.3)}`,
    };
  });
}

/** Rank hotels and tag best deal / best value */
function rankHotels(hotels: HotelResult[]): HotelResult[] {
  if (hotels.length === 0) return [];

  // Sort by lowest standard room price to find the best deal
  const sortedByPrice = [...hotels].sort((a, b) => {
    const priceA = a.rooms[0]?.price || Infinity;
    const priceB = b.rooms[0]?.price || Infinity;
    return priceA - priceB;
  });
  const lowestPriceHotel = sortedByPrice[0];

  // Best value is higher rating-to-price ratio
  const bestValueHotel = [...hotels].sort((a, b) => {
    const scoreA = a.rating / (a.rooms[0]?.price || 1);
    const scoreB = b.rating / (b.rooms[0]?.price || 1);
    return scoreB - scoreA;
  })[0];

  return hotels.map(h => ({
    ...h,
    isBestDeal: h.id === lowestPriceHotel?.id,
    isBestValue: h.id === bestValueHotel?.id,
  }));
}

class HotelAgent {
  private agentId = 'hotel';

  async search(params: HotelSearchParams): Promise<HotelSearchResult> {
    const t0 = Date.now();
    totalRequests++;

    const correlationId = params.correlationId || uuidv4();
    const cacheKey = `hotel:${params.destination}:${params.checkIn}:${params.checkOut}:${params.guests}`;

    // Cache hit lookup
    const cached = hotelCache.get(cacheKey);
    if (cached && Date.now() < cached.expiresAt) {
      return { ...cached.data, fromCache: true };
    }

    try {
      // Parallel execution from providers with Circuit Breakers
      const [bookingComResults, expediaResults] = await Promise.allSettled([
        bookingComCircuit.execute(
          () => Promise.resolve(generateMockHotels(params)),
          () => [] as HotelResult[]
        ),
        expediaCircuit.execute(
          () => Promise.resolve([] as HotelResult[]),
          () => [] as HotelResult[]
        ),
      ]);

      const combined = [
        ...(bookingComResults.status === 'fulfilled' ? bookingComResults.value : []),
        ...(expediaResults.status === 'fulfilled' ? expediaResults.value : []),
      ];

      const hotels = rankHotels(combined);
      const latency = Date.now() - t0;
      responseTimes.push(latency);

      const result: HotelSearchResult = {
        searchId: uuidv4(),
        correlationId,
        hotels,
        bestDeal: hotels.find(h => h.isBestDeal) || null,
        bestValue: hotels.find(h => h.isBestValue) || null,
        agentLatencyMs: latency,
        fromCache: false,
      };

      // Set Cache (5 min TTL)
      hotelCache.set(cacheKey, { data: result, expiresAt: Date.now() + 5 * 60_000 });

      // Save search results database record
      if (params.userId) {
        await prisma.bookingSearch.create({
          data: {
            userId: params.userId,
            correlationId,
            mode: 'hotel',
            origin: params.destination, // for hotels, destination acts as destination search
            destination: params.destination,
            travelDate: new Date(params.checkIn),
            passengers: params.guests,
            results: JSON.stringify(hotels.slice(0, 5)),
            status: 'completed',
          },
        }).catch(() => {});
      }

      await this.reportHealth(latency, false);
      return result;
    } catch (error: any) {
      failedRequests++;
      await this.reportHealth(Date.now() - t0, true);
      logger.error(`HotelAgent search error: ${error.message}`);
      throw error;
    }
  }

  async book(roomId: string, userId: string, passengerInfo: any): Promise<{ pnr: string; eTicketUrl: string }> {
    const pnr = `HTL${Date.now().toString(36).toUpperCase()}`;
    const eTicketUrl = `/tickets/${pnr}.pdf`;

    // Persist booking record
    await prisma.booking.create({
      data: {
        userId,
        searchId: roomId,
        mode: 'hotel',
        carrier: passengerInfo.hotelName || 'Grand Plaza Hotel',
        origin: passengerInfo.location || 'NYC',
        destination: passengerInfo.location || 'NYC',
        departureTime: new Date(passengerInfo.checkIn || Date.now()),
        arrivalTime: new Date(passengerInfo.checkOut || Date.now() + 86400000),
        passengers: passengerInfo.guests || 1,
        totalPrice: passengerInfo.price || 120,
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
      circuitState: bookingComCircuit.currentState,
    };
  }
}

export const hotelAgent = new HotelAgent();
