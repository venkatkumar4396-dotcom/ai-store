import { PrismaClient } from '@prisma/client';
import { aiRouter } from './ai/provider';
import logger from '../utils/logger';
import { safeParseAIJson } from '../utils/json-utils';
import { randomUUID } from 'crypto';

const prisma = new PrismaClient();

// ── Mock Carrier Data ───────────────────────────────────────
const AIRLINES = [
  { code: 'NX', name: 'NexAir', rating: 4.5 },
  { code: 'SJ', name: 'SkyJet Express', rating: 4.2 },
  { code: 'QA', name: 'QuickAir', rating: 4.7 },
  { code: 'GA', name: 'GlobalAvia', rating: 4.0 },
  { code: 'SA', name: 'StarAlliance Air', rating: 4.8 },
];

const BUS_OPERATORS = [
  { code: 'EB', name: 'ExpressBus', rating: 4.3 },
  { code: 'CT', name: 'CityTransit', rating: 4.1 },
  { code: 'RT', name: 'RoadTripper', rating: 4.5 },
  { code: 'GR', name: 'GreenLine', rating: 4.0 },
];

const TRAIN_OPERATORS = [
  { code: 'HR', name: 'HighRail Express', rating: 4.6 },
  { code: 'MT', name: 'MetroTrain', rating: 4.2 },
  { code: 'NR', name: 'NationalRail', rating: 4.4 },
];

const CITIES = [
  'New York', 'Los Angeles', 'Chicago', 'San Francisco', 'Boston',
  'Miami', 'Seattle', 'Denver', 'Austin', 'Philadelphia',
  'London', 'Paris', 'Tokyo', 'Mumbai', 'Dubai',
  'Singapore', 'Sydney', 'Berlin', 'Toronto', 'Bangkok',
];

function generatePrice(base: number, variance: number): number {
  return Math.round((base + (Math.random() - 0.5) * variance) * 100) / 100;
}

function generateTime(baseHour: number): string {
  const hour = Math.min(23, Math.max(0, baseHour + Math.floor(Math.random() * 4 - 2)));
  const min = Math.floor(Math.random() * 4) * 15;
  return `${hour.toString().padStart(2, '0')}:${min.toString().padStart(2, '0')}`;
}

function addHours(time: string, hours: number, minutes: number = 0): string {
  const [h, m] = time.split(':').map(Number);
  const totalMin = h * 60 + m + hours * 60 + minutes;
  const newH = Math.floor(totalMin / 60) % 24;
  const newM = totalMin % 60;
  return `${newH.toString().padStart(2, '0')}:${newM.toString().padStart(2, '0')}`;
}

function generatePNR(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  return Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
}

// ── Service Class ───────────────────────────────────────────

export class TravelService {

  async searchFlights(userId: string, data: {
    origin: string;
    destination: string;
    date: string;
    passengers: number;
    travelClass?: string;
  }) {
    const { origin, destination, date, passengers, travelClass = 'economy' } = data;
    const classMultiplier = travelClass === 'business' ? 2.8 : travelClass === 'first' ? 4.5 : 1;

    const results = AIRLINES.map(airline => {
      const departTime = generateTime(6 + Math.floor(Math.random() * 14));
      const durationH = 2 + Math.floor(Math.random() * 8);
      const durationM = Math.floor(Math.random() * 4) * 15;
      const arriveTime = addHours(departTime, durationH, durationM);
      const stops = Math.random() > 0.6 ? Math.floor(Math.random() * 2) + 1 : 0;
      const basePrice = generatePrice(150 + durationH * 30, 100) * classMultiplier;

      return {
        id: randomUUID(),
        carrier: airline.name,
        carrierCode: airline.code,
        carrierRating: airline.rating,
        origin,
        destination,
        date,
        departureTime: departTime,
        arrivalTime: arriveTime,
        duration: `${durationH}h ${durationM}m`,
        stops,
        price: Math.round(basePrice * passengers * 100) / 100,
        pricePerPerson: Math.round(basePrice * 100) / 100,
        currency: 'USD',
        class: travelClass,
        seatsAvailable: Math.floor(Math.random() * 30) + 2,
        baggage: travelClass === 'economy' ? '1 carry-on' : '2 checked + 1 carry-on',
      };
    });

    results.sort((a, b) => a.price - b.price);

    const best = results[0];
    const fastest = [...results].sort((a, b) => {
      const parseD = (d: string) => { const [h, m] = d.replace('h', '').replace('m', '').split(' ').map(Number); return h * 60 + (m || 0); };
      return parseD(a.duration) - parseD(b.duration);
    })[0];

    // Log activity
    await prisma.agentActivityLog.create({
      data: {
        userId,
        agentId: 'travel',
        action: 'flight_search',
        description: `Searched flights: ${origin} → ${destination} on ${date} (${passengers} pax)`,
        reasoning: `Found ${results.length} flights. Best price: $${best.price}`,
      }
    });

    return {
      mode: 'flight',
      results,
      bestDeal: best,
      fastestRoute: fastest,
      totalResults: results.length,
      searchParams: { origin, destination, date, passengers, travelClass },
    };
  }

  async searchBuses(userId: string, data: {
    origin: string;
    destination: string;
    date: string;
    passengers: number;
  }) {
    const { origin, destination, date, passengers } = data;

    const results = BUS_OPERATORS.map(op => {
      const departTime = generateTime(5 + Math.floor(Math.random() * 16));
      const durationH = 3 + Math.floor(Math.random() * 10);
      const durationM = Math.floor(Math.random() * 4) * 15;
      const arriveTime = addHours(departTime, durationH, durationM);
      const basePrice = generatePrice(25 + durationH * 5, 30);

      return {
        id: randomUUID(),
        operator: op.name,
        operatorCode: op.code,
        operatorRating: op.rating,
        origin,
        destination,
        date,
        departureTime: departTime,
        arrivalTime: arriveTime,
        duration: `${durationH}h ${durationM}m`,
        busType: Math.random() > 0.5 ? 'AC Sleeper' : 'AC Seater',
        price: Math.round(basePrice * passengers * 100) / 100,
        pricePerPerson: Math.round(basePrice * 100) / 100,
        currency: 'USD',
        seatsAvailable: Math.floor(Math.random() * 20) + 3,
        amenities: ['WiFi', 'USB Charging', 'AC'].filter(() => Math.random() > 0.3),
      };
    });

    results.sort((a, b) => a.price - b.price);

    await prisma.agentActivityLog.create({
      data: {
        userId,
        agentId: 'travel',
        action: 'bus_search',
        description: `Searched buses: ${origin} → ${destination} on ${date} (${passengers} pax)`,
        reasoning: `Found ${results.length} routes. Best price: $${results[0].price}`,
      }
    });

    return {
      mode: 'bus',
      results,
      bestDeal: results[0],
      totalResults: results.length,
      searchParams: { origin, destination, date, passengers },
    };
  }

  async searchTrains(userId: string, data: {
    origin: string;
    destination: string;
    date: string;
    passengers: number;
    travelClass?: string;
  }) {
    const { origin, destination, date, passengers, travelClass = 'standard' } = data;
    const classMultiplier = travelClass === 'first' ? 2.2 : travelClass === 'business' ? 1.6 : 1;

    const results = TRAIN_OPERATORS.map(op => {
      const departTime = generateTime(6 + Math.floor(Math.random() * 14));
      const durationH = 2 + Math.floor(Math.random() * 6);
      const durationM = Math.floor(Math.random() * 4) * 15;
      const arriveTime = addHours(departTime, durationH, durationM);
      const basePrice = generatePrice(40 + durationH * 15, 40) * classMultiplier;
      const coachCount = Math.floor(Math.random() * 8) + 4;

      return {
        id: randomUUID(),
        operator: op.name,
        operatorCode: op.code,
        operatorRating: op.rating,
        trainNumber: `${op.code}${Math.floor(Math.random() * 9000) + 1000}`,
        origin,
        destination,
        date,
        departureTime: departTime,
        arrivalTime: arriveTime,
        duration: `${durationH}h ${durationM}m`,
        class: travelClass,
        price: Math.round(basePrice * passengers * 100) / 100,
        pricePerPerson: Math.round(basePrice * 100) / 100,
        currency: 'USD',
        seatsAvailable: Math.floor(Math.random() * 50) + 5,
        coaches: coachCount,
        platform: Math.floor(Math.random() * 12) + 1,
      };
    });

    results.sort((a, b) => a.price - b.price);

    await prisma.agentActivityLog.create({
      data: {
        userId,
        agentId: 'travel',
        action: 'train_search',
        description: `Searched trains: ${origin} → ${destination} on ${date} (${passengers} pax)`,
        reasoning: `Found ${results.length} trains. Best price: $${results[0].price}`,
      }
    });

    return {
      mode: 'train',
      results,
      bestDeal: results[0],
      totalResults: results.length,
      searchParams: { origin, destination, date, passengers, travelClass },
    };
  }

  async searchHotels(userId: string, data: {
    destination: string;
    date: string;
    passengers: number;
  }) {
    const { destination, date, passengers } = data;
    const hotelBrands = [
      { name: 'Grand Plaza Hotel', rating: 4.8, code: 'GP' },
      { name: 'Comfort Inn & Suites', rating: 4.1, code: 'CI' },
      { name: 'Radisson Blu Resort', rating: 4.6, code: 'RB' },
      { name: 'Holiday Inn Express', rating: 4.0, code: 'HI' },
      { name: 'The Ritz-Carlton', rating: 4.9, code: 'RC' },
    ];

    const results = hotelBrands.map((brand, i) => {
      const basePrice = 80 + i * 45 + Math.floor(Math.random() * 20);
      return {
        id: randomUUID(),
        carrier: brand.name,
        carrierCode: brand.code,
        carrierRating: brand.rating,
        origin: destination,
        destination,
        date,
        departureTime: 'Check-in: 12:00 PM',
        arrivalTime: 'Check-out: 11:00 AM',
        duration: '1 night',
        stops: 0,
        price: Math.round(basePrice * passengers * 100) / 100,
        pricePerPerson: basePrice,
        currency: 'USD',
        class: i % 2 === 0 ? 'Standard Room' : 'Deluxe Room',
        seatsAvailable: Math.floor(Math.random() * 8) + 1,
        baggage: 'Breakfast Included',
      };
    });

    results.sort((a, b) => a.price - b.price);

    await prisma.agentActivityLog.create({
      data: {
        userId,
        agentId: 'travel',
        action: 'hotel_search',
        description: `Searched hotels in ${destination} on ${date} (${passengers} guests)`,
        reasoning: `Found ${results.length} hotels. Best deal: ${results[0].carrier} ($${results[0].price})`,
      }
    });

    return {
      mode: 'hotel',
      results,
      bestDeal: results[0],
      totalResults: results.length,
      searchParams: { destination, date, passengers },
    };
  }

  async bookTicket(userId: string, data: {
    mode: string;
    resultId: string;
    origin: string;
    destination: string;
    date: string;
    passengers: number;
    carrier: string;
    price: number;
    departureTime: string;
    arrivalTime: string;
  }) {
    const pnr = generatePNR();

    let depDateTime = new Date(`${data.date}T${data.departureTime}:00`);
    let arrDateTime = new Date(`${data.date}T${data.arrivalTime}:00`);
    if (isNaN(depDateTime.getTime())) depDateTime = new Date();
    if (isNaN(arrDateTime.getTime())) arrDateTime = new Date();

    const booking = await prisma.booking.create({
      data: {
        userId,
        searchId: data.resultId,
        mode: data.mode,
        carrier: data.carrier,
        origin: data.origin,
        destination: data.destination,
        departureTime: depDateTime,
        arrivalTime: arrDateTime,
        passengers: data.passengers,
        totalPrice: data.price,
        currency: 'USD',
        pnr,
        status: 'confirmed',
      }
    });

    await prisma.agentActivityLog.create({
      data: {
        userId,
        agentId: 'travel',
        action: 'booking_confirmed',
        description: `Booked ${data.mode}: ${data.origin} → ${data.destination} on ${data.date}. PNR: ${pnr}. Total: $${data.price}`,
        reasoning: `Carrier: ${data.carrier}, Passengers: ${data.passengers}, Departure: ${data.departureTime}`,
      }
    });

    return {
      bookingId: booking.id,
      pnr,
      status: 'confirmed',
      mode: data.mode,
      carrier: data.carrier,
      origin: data.origin,
      destination: data.destination,
      date: data.date,
      departureTime: data.departureTime,
      arrivalTime: data.arrivalTime,
      passengers: data.passengers,
      totalPrice: data.price,
      currency: 'USD',
      eTicket: true,
      confirmedAt: booking.createdAt.toISOString(),
    };
  }

  async getBookingHistory(userId: string) {
    const bookings = await prisma.booking.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });

    return bookings.map(b => {
      const formattedDate = new Date(b.departureTime).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      });

      return {
        id: b.id,
        userId: b.userId,
        agentId: 'travel',
        action: b.status === 'cancelled' ? 'booking_cancelled' : 'booking_confirmed',
        description: `Booked ${b.mode}: ${b.origin} → ${b.destination} on ${formattedDate}. PNR: ${b.pnr}. Total: $${b.totalPrice}`,
        reasoning: `Carrier: ${b.carrier}, Passengers: ${b.passengers}, Status: ${b.status}`,
        timestamp: b.createdAt.toISOString(),
        status: b.status,
      };
    });
  }

  async cancelBooking(userId: string, bookingId: string) {
    const booking = await prisma.booking.findFirst({
      where: { id: bookingId, userId }
    });

    if (!booking) {
      throw new Error('Booking not found or access denied');
    }

    const updatedBooking = await prisma.booking.update({
      where: { id: bookingId },
      data: { status: 'cancelled' }
    });

    await prisma.agentActivityLog.create({
      data: {
        userId,
        agentId: 'travel',
        action: 'booking_cancelled',
        description: `Cancelled ${booking.mode} booking: ${booking.origin} → ${booking.destination}. PNR: ${booking.pnr}`,
        reasoning: `User requested cancellation for booking ID: ${bookingId}`,
      }
    });

    return updatedBooking;
  }

  async planTrip(userId: string, data: { description: string }) {
    const systemPrompt = `You are an expert travel planner. Based on the user's description, create a detailed trip plan.
Format your output as a JSON object:
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

    let result;
    try {
      const response = await aiRouter.chat([
        { role: 'system', content: systemPrompt },
        { role: 'user', content: data.description },
      ], { temperature: 0.4 });

      result = safeParseAIJson(response.content, 'trip planning');
    } catch (e: any) {
      logger.warn(`Trip planning AI failed: ${e.message}`);
      result = {
        tripName: 'Custom Trip',
        duration: '3 days',
        destinations: ['Destination 1', 'Destination 2'],
        itinerary: [
          { day: 1, title: 'Arrival & Exploration', activities: ['Check into hotel', 'Explore the area', 'Dinner at local restaurant'], transport: 'Flight + Taxi', estimatedCost: 300 },
          { day: 2, title: 'Full Day Tour', activities: ['Morning tour', 'Lunch break', 'Afternoon sightseeing', 'Evening entertainment'], transport: 'Local transit', estimatedCost: 150 },
          { day: 3, title: 'Departure', activities: ['Breakfast', 'Last-minute shopping', 'Airport transfer'], transport: 'Taxi + Flight', estimatedCost: 200 },
        ],
        totalEstimatedBudget: 650,
        tips: ['Book flights early for best prices', 'Carry a power bank for long trips', 'Download offline maps'],
      };
    }

    await prisma.agentActivityLog.create({
      data: {
        userId,
        agentId: 'travel',
        action: 'trip_planned',
        description: `AI generated trip plan: ${result.tripName}`,
        reasoning: `Budget: $${result.totalEstimatedBudget}, Duration: ${result.duration}`,
      }
    });

    return result;
  }
}

export const travelService = new TravelService();
