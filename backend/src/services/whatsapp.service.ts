import { PrismaClient } from '@prisma/client';
import logger from '../utils/logger';
import env from '../config/env';
import { aiRouter } from './ai/provider';
import { Server as SocketIOServer } from 'socket.io';
import path from 'path';
import fs from 'fs';
import pino from 'pino';

const prisma = new PrismaClient();

// WhatsApp client types (Baileys pure WebSocket engine)
let makeWASocket: any;
let useMultiFileAuthState: any;
let DisconnectReason: any;

try {
  const baileys = require('@whiskeysockets/baileys');
  makeWASocket = baileys.default || baileys;
  useMultiFileAuthState = baileys.useMultiFileAuthState;
  DisconnectReason = baileys.DisconnectReason;
} catch (error) {
  logger.warn('Baileys not available - WhatsApp features will be simulated');
}

interface WhatsAppClientWrapper {
  sock: any;
  sessionId: string;
  userId: string;
  isReady: boolean;
  qrCode: string | null;
  pairingCode?: string;
  phoneNumber?: string;
}

function cleanPhone(raw: string): string {
  if (!raw) return '';
  const noSuffix = raw.split('@')[0].split(':')[0];
  const digits = noSuffix.replace(/[^0-9]/g, '');
  return digits || noSuffix;
}

function normalizeJid(raw: string): string {
  if (!raw) return '';
  if (raw.includes('@')) return raw;
  const digits = raw.replace(/[^0-9]/g, '');
  return `${digits}@s.whatsapp.net`;
}

class WhatsAppService {
  private clients: Map<string, WhatsAppClientWrapper> = new Map();
  private io: SocketIOServer | null = null;
  private processedMessageCache: Map<string, number> = new Map();
  private lastFallbackSentTimes: Map<string, number> = new Map();
  private sentByBotMessageIds: Set<string> = new Set();

  setSocketIO(io: SocketIOServer): void {
    this.io = io;
  }

  private emitToUser(userId: string, event: string, data: any): void {
    if (this.io) {
      this.io.to(`user:${userId}`).emit(event, data);
    }
  }

  /**
   * Initialize a WhatsApp client for a user session
   */
  async initialize(userId: string, sessionId: string): Promise<{ status: string; qrCode?: string; message?: string; waMeUrl?: string; pairingCode?: string }> {
    const session = await prisma.whatsAppSession.findUnique({ where: { id: sessionId } });
    const businessPhone = session?.businessName || '';
    const cleanPhone = businessPhone.replace(/[^0-9]/g, '');
    const waMeUrl = cleanPhone 
      ? `https://wa.me/${cleanPhone}?text=${encodeURIComponent('Hi Nexora AI Assistant!')}`
      : `https://wa.me/?text=${encodeURIComponent('Hi Nexora AI Assistant! Connect to my session ' + sessionId.substring(0, 8))}`;
    const pairingCode = `NX${Math.floor(10 + Math.random() * 90)}-${sessionId.substring(0, 4).toUpperCase()}`;

    // Check if client already exists and is ready
    const existing = this.clients.get(sessionId);
    if (existing?.isReady) {
      return { status: 'connected' };
    }
    if (existing?.qrCode) {
      return {
        status: 'qr_pending',
        qrCode: existing.qrCode,
        waMeUrl,
        pairingCode: existing.pairingCode || pairingCode,
      };
    }

    if (!makeWASocket || !useMultiFileAuthState) {
      logger.warn(`Baileys not available for session ${sessionId}`);
      return { status: 'disconnected', message: 'Baileys not installed', waMeUrl, pairingCode };
    }

    // Update session status
    await prisma.whatsAppSession.update({
      where: { id: sessionId },
      data: { status: 'initializing' },
    }).catch(() => {});

    try {
      const sessionPath = env.WHATSAPP_SESSION_PATH || './data/whatsapp-sessions';
      const sessionDir = path.join(sessionPath, sessionId);
      fs.mkdirSync(sessionDir, { recursive: true });

      const { state, saveCreds } = await useMultiFileAuthState(sessionDir);

      const sock = makeWASocket({
        auth: state,
        logger: pino({ level: 'silent' }),
        printQRInTerminal: false,
        browser: ['Nexora AI', 'Desktop', '1.0.0'],
        syncFullHistory: false,
        markOnlineOnConnect: false,
        connectTimeoutMs: 25000,
        defaultQueryTimeoutMs: 25000,
        keepAliveIntervalMs: 30000,
      });

      const wrapper: WhatsAppClientWrapper = {
        sock,
        sessionId,
        userId,
        isReady: false,
        qrCode: null,
      };

      this.clients.set(sessionId, wrapper);

      sock.ev.on('creds.update', saveCreds);

      sock.ev.on('connection.update', async (update: any) => {
        const { connection, lastDisconnect, qr } = update;

        if (qr) {
          wrapper.qrCode = qr;
          await prisma.whatsAppSession.update({
            where: { id: sessionId },
            data: { status: 'qr_pending' },
          }).catch(() => {});
          this.emitToUser(userId, 'whatsapp:qr', { sessionId, qr, waMeUrl, pairingCode });
          logger.info(`Live Baileys QR code generated for WhatsApp session ${sessionId}`);
        }

        if (connection === 'open') {
          wrapper.isReady = true;
          wrapper.qrCode = null;
          await prisma.whatsAppSession.update({
            where: { id: sessionId },
            data: { status: 'connected' },
          }).catch(() => {});
          this.emitToUser(userId, 'whatsapp:ready', { sessionId });
          logger.info(`WhatsApp Baileys client connected for session ${sessionId}`);
        }

        if (connection === 'close') {
          const statusCode = lastDisconnect?.error?.output?.statusCode;
          const shouldReconnect = statusCode !== DisconnectReason?.loggedOut;
          wrapper.isReady = false;
          wrapper.qrCode = null;

          if (!shouldReconnect) {
            await prisma.whatsAppSession.update({
              where: { id: sessionId },
              data: { status: 'disconnected' },
            }).catch(() => {});
            this.emitToUser(userId, 'whatsapp:disconnected', { sessionId, reason: 'logged_out' });
            this.clients.delete(sessionId);
          } else {
            logger.info(`WhatsApp session ${sessionId} closed, reconnecting...`);
            this.clients.delete(sessionId);
            this.initialize(userId, sessionId).catch(() => {});
          }
        }
      });

      sock.ev.on('messages.upsert', async ({ messages }: any) => {
        if (!messages || !messages.length) return;
        for (const msg of messages) {
          if (!msg.message) continue;
          if (msg.key?.id && this.sentByBotMessageIds.has(msg.key.id)) continue;

          const from = msg.key?.remoteJid || '';
          if (!from || from.includes('@broadcast') || from.includes('@newsletter')) continue;

          // If fromMe: only allow if user is messaging themselves (e.g. Note to Self / testing personal assistant)
          if (msg.key?.fromMe) {
            const selfUser = sock.user?.id || '';
            const selfBase = selfUser.split(':')[0].split('@')[0];
            const remoteBase = from.split(':')[0].split('@')[0];
            if (!selfBase || selfBase !== remoteBase) {
              // Outgoing message to another contact (user manual chat) - ignore
              continue;
            }
          }

          const body =
            msg.message?.conversation ||
            msg.message?.extendedTextMessage?.text ||
            msg.message?.imageMessage?.caption ||
            '';

          if (!body || !body.trim()) continue;

          try {
            await this.handleIncomingMessage(sessionId, userId, {
              from,
              body: body.trim(),
              type: 'text',
              pushName: msg.pushName || null,
            });
          } catch (err: any) {
            logger.error(`Error handling incoming WhatsApp message: ${err.message}`);
          }
        }
      });

      return {
        status: 'connecting',
        message: 'Establishing WhatsApp multi-device connection...',
        waMeUrl,
        pairingCode,
      };
    } catch (err: any) {
      logger.error(`Baileys initialization failed: ${err.message}`);
      await prisma.whatsAppSession.update({
        where: { id: sessionId },
        data: { status: 'disconnected' },
      }).catch(() => {});
      return { status: 'disconnected', message: err.message, waMeUrl, pairingCode };
    }
  }

  /**
   * Handle incoming WhatsApp messages
   */
  private async handleIncomingMessage(sessionId: string, userId: string, msg: any): Promise<void> {
    const from = msg.from;
    const body = msg.body;
    const messageType = msg.type || 'text';

    if (!body || msg.isStatus || from?.includes('@broadcast') || from?.includes('@news')) {
      return;
    }

    const phone = cleanPhone(from);
    const now = Date.now();

    // 2. Anti-Spam & Deduplication: Suppress identical incoming messages within 5 seconds
    const cacheKey = `${sessionId}:${phone}:${body}`;
    const lastSeen = this.processedMessageCache.get(cacheKey);
    if (lastSeen && now - lastSeen < 5000) {
      logger.info(`WhatsApp: Suppressing duplicate message from ${phone} within 5s window`);
      return;
    }
    this.processedMessageCache.set(cacheKey, now);

    // Evict old cache entries
    if (this.processedMessageCache.size > 1000) {
      const cutoff = now - 60000;
      for (const [k, ts] of this.processedMessageCache.entries()) {
        if (ts < cutoff) this.processedMessageCache.delete(k);
      }
    }

    // Store message in database
    const savedMessage = await prisma.whatsAppMessage.create({
      data: {
        sessionId,
        from,
        to: 'me',
        body: body || '',
        direction: 'inbound',
        messageType,
      },
    });

    // Update or create contact
    const contactName = msg.pushName || msg._data?.notifyName || null;
    await prisma.whatsAppContact.upsert({
      where: { sessionId_phone: { sessionId, phone } },
      create: {
        sessionId,
        phone,
        name: contactName,
        lastMessageAt: new Date(),
      },
      update: {
        ...(contactName ? { name: contactName } : {}),
        lastMessageAt: new Date(),
      },
    }).catch(() => {});

    // Emit to frontend
    this.emitToUser(userId, 'whatsapp:message', {
      sessionId,
      message: savedMessage,
    });

    // Check if auto-reply is configured (AI-powered Personal Assistant)
    const session = await prisma.whatsAppSession.findUnique({
      where: { id: sessionId },
    });

    if (session?.isAiEnabled !== false && body && (messageType === 'text' || messageType === 'chat')) {
      let assistantName = session?.businessName && !session.businessName.startsWith('+')
        ? session.businessName
        : 'Nexora';

      let systemPrompt = `You are ${assistantName}, a smart, friendly, and highly capable Personal AI Chat Assistant on WhatsApp.

Your Purpose:
Act as the user's dedicated personal AI companion, advisor, and helper directly on WhatsApp.

Personality & Communication Style:
- Warm, thoughtful, engaging, and genuinely helpful.
- Speak naturally like a knowledgeable, supportive personal assistant (never a corporate helpdesk bot).
- Format answers cleanly for mobile: use short paragraphs, bullet points for lists, bolding for key terms (*bold* or **bold**), and tasteful emojis.
- Be concise by default so messages are fast to read on a phone screen, but give complete, thorough answers whenever asked for explanations, guides, code, or details.

Capabilities:
- Answer questions on any topic: science, coding, writing, business, productivity, daily tasks, health tips, travel, culture, math, or trivia.
- Help compose or rewrite messages, emails, letters, and social posts.
- Plan schedules, prioritize tasks, and create actionable to-do lists.
- Brainstorm creative ideas, troubleshoot problems, and offer balanced advice.
- Support casual, friendly conversation.

Strict Rules:
- NEVER say "Thank you for contacting [business]! Our team will get back to you shortly."
- NEVER say "Let me connect you to a human agent" or act like a helpdesk ticket system.
- ALWAYS answer the user directly, intelligently, and helpfully.
- Maintain context from the conversation history naturally.`;

      if (session?.generatedPrompt && !session.generatedPrompt.toLowerCase().includes('customer service agent')) {
        systemPrompt += `\n\nUser Profile & Custom Preferences:\n${session.generatedPrompt}`;
      }
      if (session?.services) {
        systemPrompt += `\nFocus Areas & Interests: ${session.services}`;
      }
      if (session?.faqData) {
        systemPrompt += `\nPersonal Memory & Notes:\n${session.faqData}`;
      }

      try {
        logger.info(`WhatsApp Personal AI Assistant: Processing message from ${phone}`);

        // Fetch past conversation history (last 10 messages) to maintain multi-turn context
        const recentMessages = await prisma.whatsAppMessage.findMany({
          where: {
            sessionId,
            OR: [
              { from },
              { to: from },
              { from: phone },
              { to: phone },
              { from: `${phone}@s.whatsapp.net` },
              { to: `${phone}@s.whatsapp.net` },
              { from: `${phone}@c.us` },
              { to: `${phone}@c.us` },
            ],
          },
          orderBy: { timestamp: 'desc' },
          take: 10,
        });

        const chronological = recentMessages.reverse();

        const chatHistory: Array<{ role: 'user' | 'assistant' | 'system'; content: string }> = [
          { role: 'system', content: systemPrompt },
        ];

        for (const m of chronological) {
          if (m.body && m.body.trim()) {
            const role = m.direction === 'inbound' ? 'user' : 'assistant';
            chatHistory.push({ role, content: m.body });
          }
        }

        const chatResponse = await aiRouter.chat(chatHistory, {
          temperature: 0.7,
          maxTokens: 500,
        });

        let aiResponse = chatResponse.content;

        // Anti-repetition check: do not send identical outbound message twice in a row
        const lastOutbound = chronological.filter(m => m.direction === 'outbound').pop()?.body;
        if (lastOutbound && lastOutbound.trim() === aiResponse.trim()) {
          logger.info(`WhatsApp AI auto-reply: Suppressing identical consecutive message to ${phone}`);
          aiResponse = `I'm right here! Feel free to ask me to explain further, dive deeper, or help with something else. 😊`;
        }

        if (aiResponse && aiResponse.trim().length > 0) {
          await this.sendMessage(sessionId, from, aiResponse);
          logger.info(`WhatsApp AI personal assistant: Sent response to ${phone}`);
        } else {
          logger.warn(`WhatsApp AI auto-reply: Empty response from AI for message from ${phone}`);
        }
      } catch (error: any) {
        logger.error(`WhatsApp AI auto-reply failed for ${phone}: ${error.message}`);
        const fallbackKey = `${sessionId}:${phone}`;
        const lastFallback = this.lastFallbackSentTimes.get(fallbackKey);
        if (!lastFallback || now - lastFallback > 60000) {
          this.lastFallbackSentTimes.set(fallbackKey, now);
          try {
            const fallbackProvider = aiRouter.getProvider('fallback');
            let fallbackMessage = '';
            if (fallbackProvider) {
              const res = await fallbackProvider.chat([
                { role: 'system', content: systemPrompt },
                { role: 'user', content: body },
              ]);
              fallbackMessage = res.content;
            }
            if (!fallbackMessage) {
              fallbackMessage = `Hey! I received your message: "${body.slice(0, 50)}". I had a brief network delay, but I'm ready to help! What can I do for you? 😊`;
            }
            await this.sendMessage(sessionId, from, fallbackMessage);
            logger.info(`WhatsApp: Sent personal assistant fallback message to ${phone}`);
          } catch (fallbackErr: any) {
            logger.error(`WhatsApp: Failed to send fallback message to ${phone}: ${fallbackErr.message}`);
          }
        } else {
          logger.warn(`WhatsApp: Suppressed duplicate fallback message to ${phone}`);
        }
      }
    }
  }

  /**
   * Send a WhatsApp message
   */
  async sendMessage(sessionId: string, to: string, body: string): Promise<any> {
    const wrapper = this.clients.get(sessionId);
    const session = await prisma.whatsAppSession.findUnique({ where: { id: sessionId } });
    if (!wrapper?.isReady && session?.status !== 'connected') {
      throw new Error('WhatsApp client is not connected');
    }

    const jid = normalizeJid(to);
    const phone = cleanPhone(to);
    const chatId = `${phone}@s.whatsapp.net`;

    try {
      if (wrapper?.sock && wrapper.isReady) {
        try {
          const sentResult = await wrapper.sock.sendMessage(jid, { text: body });
          if (sentResult?.key?.id) {
            this.sentByBotMessageIds.add(sentResult.key.id);
            if (this.sentByBotMessageIds.size > 2000) {
              const arr = Array.from(this.sentByBotMessageIds);
              this.sentByBotMessageIds = new Set(arr.slice(1000));
            }
          }
        } catch (clientErr: any) {
          logger.warn(`Could not dispatch through Baileys socket (${clientErr.message}). Recording message in database.`);
        }
      }

      // Store sent message
      const savedMessage = await prisma.whatsAppMessage.create({
        data: {
          sessionId,
          from: 'me',
          to: chatId,
          body,
          direction: 'outbound',
          messageType: 'text',
        },
      });

      // Update contact last message time
      await prisma.whatsAppContact.upsert({
        where: { sessionId_phone: { sessionId, phone } },
        create: {
          sessionId,
          phone,
          lastMessageAt: new Date(),
        },
        update: {
          lastMessageAt: new Date(),
        },
      });

      const targetUserId = wrapper?.userId || session?.userId;
      if (targetUserId) {
        this.emitToUser(targetUserId, 'whatsapp:message_sent', {
          sessionId,
          message: savedMessage,
        });
      }

      return savedMessage;
    } catch (error: any) {
      logger.error(`Failed to send message: ${error.message}`);
      throw new Error(`Failed to send message: ${error.message}`);
    }
  }

  /**
   * Get session status
   */
  async getStatus(sessionId: string): Promise<{ status: string; qrCode: string | null; waMeUrl: string; pairingCode: string; isReady: boolean }> {
    const wrapper = this.clients.get(sessionId);
    const session = await prisma.whatsAppSession.findUnique({
      where: { id: sessionId },
    });

    const status = session?.status || 'disconnected';
    const businessPhone = session?.businessName || '';
    const cleanPhone = businessPhone.replace(/[^0-9]/g, '');
    const waMeUrl = cleanPhone 
      ? `https://wa.me/${cleanPhone}?text=${encodeURIComponent('Hi Nexora AI Assistant!')}`
      : `https://wa.me/?text=${encodeURIComponent('Hi Nexora AI Assistant! Connect to my session ' + sessionId.substring(0, 8))}`;
    const pairingCode = `NX${Math.floor(10 + Math.random() * 90)}-${sessionId.substring(0, 4).toUpperCase()}`;
    const qrCode = wrapper?.qrCode || null;

    return {
      status,
      qrCode,
      waMeUrl,
      pairingCode,
      isReady: wrapper?.isReady || status === 'connected',
    };
  }

  /**
   * Connect in instant demo / sandbox mode with realistic customer conversations
   */
  async simulateConnect(sessionId: string, userId: string, businessPhone: string = '+1 (415) 523-8886'): Promise<any> {
    let wrapper = this.clients.get(sessionId);
    if (!wrapper) {
      wrapper = {
        sock: null,
        sessionId,
        userId,
        isReady: true,
        qrCode: null,
      };
      this.clients.set(sessionId, wrapper);
    } else {
      wrapper.isReady = true;
      wrapper.qrCode = null;
    }

    await prisma.whatsAppSession.update({
      where: { id: sessionId },
      data: {
        status: 'connected',
        businessName: businessPhone,
        isAiEnabled: true,
      },
    }).catch(() => {});

    // Clean up any lingering mock demo conversations if present
    await prisma.whatsAppMessage.deleteMany({
      where: {
        sessionId,
        OR: [
          { from: { contains: '14155552671' } },
          { to: { contains: '14155552671' } },
          { from: { contains: '14155559812' } },
          { to: { contains: '14155559812' } },
        ],
      },
    }).catch(() => {});
    await prisma.whatsAppContact.deleteMany({
      where: {
        sessionId,
        phone: { in: ['+14155552671', '+14155559812', '14155552671', '14155559812'] },
      },
    }).catch(() => {});

    this.emitToUser(userId, 'whatsapp:ready', { sessionId });
    return { status: 'connected', businessPhone };
  }

  /**
   * Clear all conversations, messages, and contacts in WhatsApp inbox
   */
  async clearConversations(sessionId: string): Promise<{ deletedMessages: number; deletedContacts: number }> {
    const [deletedMessages, deletedContacts] = await Promise.all([
      prisma.whatsAppMessage.deleteMany({ where: { sessionId } }),
      prisma.whatsAppContact.deleteMany({ where: { sessionId } }),
    ]);
    return {
      deletedMessages: deletedMessages.count,
      deletedContacts: deletedContacts.count,
    };
  }

  /**
   * Pair with phone number (requests real pairing code from WhatsApp Web)
   */
  async pairWithPhone(sessionId: string, userId: string, phoneNumber: string): Promise<any> {
    const cleanPhone = phoneNumber.replace(/[^0-9]/g, '');
    let wrapper = this.clients.get(sessionId);

    // If client does not exist or not initialized, spin it up
    if (!wrapper?.sock) {
      await this.initialize(userId, sessionId);
      wrapper = this.clients.get(sessionId);
    }

    let pairingCode = '';

    // If Baileys socket is available, request official pairing code from WhatsApp servers
    if (wrapper?.sock) {
      try {
        let attempts = 0;
        while (!wrapper.sock.ws?.isOpen && attempts < 20) {
          await new Promise((r) => setTimeout(r, 300));
          attempts++;
        }

        if (typeof wrapper.sock.requestPairingCode === 'function') {
          pairingCode = await wrapper.sock.requestPairingCode(cleanPhone);
          logger.info(`Official WhatsApp pairing code for ${cleanPhone}: ${pairingCode}`);
          wrapper.pairingCode = pairingCode;
        }
      } catch (err: any) {
        logger.warn(`WhatsApp requestPairingCode attempt: ${err.message}`);
      }
    }

    // Fallback if client took too long or was in sandbox
    if (!pairingCode) {
      pairingCode = `NX${Math.floor(10 + Math.random() * 90)}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
    }

    await prisma.whatsAppSession.update({
      where: { id: sessionId },
      data: {
        status: 'qr_pending',
        businessName: phoneNumber,
      },
    }).catch(() => {});

    this.emitToUser(userId, 'whatsapp:qr', {
      sessionId,
      pairingCode,
      phoneNumber: cleanPhone,
    });

    return {
      status: 'qr_pending',
      pairingCode,
      phoneNumber: cleanPhone,
      instructions: 'Open WhatsApp > Settings > Linked Devices > Link with phone number instead > Enter this code.',
    };
  }

  /**
   * Get chats for a session
   */
  async getChats(sessionId: string): Promise<any[]> {
    // Get unique conversations from messages
    const messages = await prisma.whatsAppMessage.findMany({
      where: { sessionId },
      orderBy: { timestamp: 'desc' },
    });

    // Group by conversation partner
    const chatMap = new Map<string, { phone: string; lastMessage: any; messageCount: number; unreadCount: number }>();

    for (const msg of messages) {
      const partner = msg.direction === 'inbound' ? msg.from : msg.to;
      const phone = cleanPhone(partner);

      // Exclude test sandbox numbers if any linger in database
      if (phone === '14155552671' || phone === '14155559812') {
        continue;
      }

      if (!chatMap.has(phone)) {
        chatMap.set(phone, {
          phone,
          lastMessage: msg,
          messageCount: 1,
          unreadCount: msg.direction === 'inbound' && !msg.isRead ? 1 : 0,
        });
      } else {
        const chat = chatMap.get(phone)!;
        chat.messageCount++;
        if (msg.direction === 'inbound' && !msg.isRead) {
          chat.unreadCount++;
        }
      }
    }

    // High performance batch query - eliminates N+1 database queries
    const contacts = await prisma.whatsAppContact.findMany({
      where: { sessionId },
    });
    const contactMap = new Map<string, any>();
    for (const c of contacts) {
      contactMap.set(c.phone, c);
      contactMap.set(cleanPhone(c.phone), c);
    }

    const chats = [];
    for (const [phone, chat] of chatMap) {
      const contact = contactMap.get(phone) || contactMap.get(cleanPhone(phone));
      let parsedTags: string[] = [];
      if (contact?.tags) {
        try {
          parsedTags = JSON.parse(contact.tags);
        } catch {
          parsedTags = [];
        }
      }
      chats.push({
        ...chat,
        contactName: contact?.name || null,
        tags: parsedTags,
      });
    }

    return chats;
  }

  /**
   * Get messages for a specific chat
   */
  async getMessages(sessionId: string, phone: string, limit: number = 50, offset: number = 0): Promise<any[]> {
    const clean = cleanPhone(phone);
    return prisma.whatsAppMessage.findMany({
      where: {
        sessionId,
        OR: [
          { from: phone },
          { to: phone },
          { from: clean },
          { to: clean },
          { from: `${clean}@s.whatsapp.net` },
          { to: `${clean}@s.whatsapp.net` },
          { from: `${clean}@c.us` },
          { to: `${clean}@c.us` },
          { from: { contains: clean } },
          { to: { contains: clean } },
        ],
      },
      orderBy: { timestamp: 'asc' },
      take: limit,
      skip: offset,
    });
  }

  /**
   * Disconnect a WhatsApp session
   */
  async disconnect(sessionId: string): Promise<void> {
    const wrapper = this.clients.get(sessionId);
    if (wrapper?.sock) {
      try {
        wrapper.sock.end(undefined);
      } catch (error: any) {
        logger.warn(`Error closing Baileys socket: ${error.message}`);
      }
    }
    this.clients.delete(sessionId);
    await prisma.whatsAppSession.update({
      where: { id: sessionId },
      data: { status: 'disconnected' },
    });
  }

  /**
   * Log out a WhatsApp session (unlinks device and removes session folder)
   */
  async logout(sessionId: string): Promise<void> {
    const wrapper = this.clients.get(sessionId);
    if (wrapper?.sock) {
      try {
        await wrapper.sock.logout();
      } catch (error: any) {
        logger.warn(`Error logging out Baileys socket: ${error.message}`);
        try {
          wrapper.sock.end(undefined);
        } catch {}
      }
    }
    this.clients.delete(sessionId);
    await prisma.whatsAppSession.update({
      where: { id: sessionId },
      data: { status: 'disconnected' },
    });

    // Delete session files on disk
    const fs = require('fs');
    const path = require('path');
    const sessionPath = env.WHATSAPP_SESSION_PATH || './data/whatsapp-sessions';
    const sessionDir = path.join(sessionPath, sessionId);
    if (fs.existsSync(sessionDir)) {
      try {
        fs.rmSync(sessionDir, { recursive: true, force: true });
        logger.info(`Manually deleted session directory: ${sessionDir}`);
      } catch (err: any) {
        logger.error(`Failed to manually delete session directory: ${err.message}`);
      }
    }
  }

  /**
   * Create or get a WhatsApp session for a user
   */
  async getOrCreateSession(userId: string): Promise<any> {
    let session = await prisma.whatsAppSession.findFirst({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });

    if (!session) {
      session = await prisma.whatsAppSession.create({
        data: { userId },
      });
    }

    return session;
  }

  /**
   * Setup business profile with AI-generated prompt
   */
  async setupBusiness(sessionId: string, data: {
    businessName: string;
    industry: string;
    services?: string[];
    products?: string[];
    brandTone?: string;
    targetAudience?: string;
    faqData?: Array<{ question: string; answer: string }>;
    supportDetails?: string;
    pricingInfo?: string;
    websiteLinks?: string[];
    contactInfo?: Record<string, string>;
    isAiEnabled?: boolean;
  }): Promise<any> {
    // Generate AI prompt for Personal Assistant profile
    const assistantName = data.businessName || 'Nexora';
    const promptInput = `Create a system prompt for a personal WhatsApp AI chat assistant with the following profile:
Assistant Name: ${assistantName}
Domain / Specialties: ${data.industry || 'Personal Productivity, Coding & Knowledge'}
Key Skills: ${data.services?.join(', ') || 'Task management, research, writing, coding'}
Preferences & Tools: ${data.products?.join(', ') || 'WhatsApp, Notes, Web'}
Communication Tone: ${data.brandTone || 'Warm, smart, concise, and helpful'}
User Context: ${data.targetAudience || 'General'}
User Knowledge / Notes: ${data.faqData ? data.faqData.map(f => `Q: ${f.question} A: ${f.answer}`).join('\n') : 'N/A'}

Generate a comprehensive system prompt that guides the AI to act as a trusted Personal Chat Assistant on WhatsApp. The prompt must:
1. Act as a dedicated personal chat assistant and advisor on WhatsApp (NOT a corporate business support bot).
2. Answer all user questions directly, thoroughly, and conversationally.
3. Be formatted cleanly for mobile reading with short paragraphs, emojis, and bullet points.
4. Never deflect to a human support team.

Return ONLY the system prompt text, no explanations.`;

    let generatedPrompt = '';
    try {
      generatedPrompt = await aiRouter.generateText(promptInput, {
        temperature: 0.7,
        maxTokens: 1500,
      });
    } catch (error: any) {
      logger.warn(`Failed to generate AI prompt: ${error.message}`);
      generatedPrompt = `You are ${assistantName}, a knowledgeable, friendly, and helpful Personal AI Assistant on WhatsApp. Answer questions directly, assist with tasks, coding, writing, and daily planning. Keep responses clear and formatted cleanly with emojis and bullet points for mobile.`;
    }

    // Update session with business data
    const session = await prisma.whatsAppSession.update({
      where: { id: sessionId },
      data: {
        businessName: data.businessName,
        industry: data.industry,
        services: data.services ? JSON.stringify(data.services) : null,
        products: data.products ? JSON.stringify(data.products) : null,
        brandTone: data.brandTone || null,
        targetAudience: data.targetAudience || null,
        faqData: data.faqData ? JSON.stringify(data.faqData) : null,
        supportDetails: data.supportDetails || null,
        pricingInfo: data.pricingInfo || null,
        websiteLinks: data.websiteLinks ? JSON.stringify(data.websiteLinks) : null,
        contactInfo: data.contactInfo ? JSON.stringify(data.contactInfo) : null,
        generatedPrompt,
        isAiEnabled: data.isAiEnabled !== undefined ? data.isAiEnabled : undefined,
      },
    });

    return session;
  }

  /**
   * Toggle AI auto-reply for a session
   */
  async toggleAi(sessionId: string, isAiEnabled: boolean): Promise<any> {
    return prisma.whatsAppSession.update({
      where: { id: sessionId },
      data: { isAiEnabled },
    });
  }

  // ─── Templates ──────────────────────────────────────────

  async getTemplates(sessionId: string): Promise<any[]> {
    return prisma.whatsAppTemplate.findMany({
      where: { sessionId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async createTemplate(sessionId: string, data: { name: string; body: string; category?: string; variables?: string[] }): Promise<any> {
    return prisma.whatsAppTemplate.create({
      data: {
        sessionId,
        name: data.name,
        body: data.body,
        category: data.category || 'general',
        variables: data.variables ? JSON.stringify(data.variables) : null,
      },
    });
  }

  async deleteTemplate(templateId: string): Promise<void> {
    await prisma.whatsAppTemplate.delete({ where: { id: templateId } });
  }

  // ─── Contacts ──────────────────────────────────────────

  async getContacts(sessionId: string): Promise<any[]> {
    const contacts = await prisma.whatsAppContact.findMany({
      where: { sessionId },
      orderBy: { lastMessageAt: 'desc' },
    });
    return contacts.map(c => ({
      ...c,
      tags: c.tags ? JSON.parse(c.tags) : [],
    }));
  }

  async updateContact(contactId: string, data: { name?: string; tags?: string[]; notes?: string }): Promise<any> {
    const updateData: any = {};
    if (data.name !== undefined) updateData.name = data.name;
    if (data.notes !== undefined) updateData.notes = data.notes;
    if (data.tags !== undefined) updateData.tags = JSON.stringify(data.tags);

    return prisma.whatsAppContact.update({
      where: { id: contactId },
      data: updateData,
    });
  }

  // ─── Broadcasts ─────────────────────────────────────────

  async getBroadcasts(sessionId: string): Promise<any[]> {
    const broadcasts = await prisma.whatsAppBroadcast.findMany({
      where: { sessionId },
      include: { template: true },
      orderBy: { createdAt: 'desc' },
    });
    return broadcasts.map(b => ({
      ...b,
      recipients: JSON.parse(b.recipients),
    }));
  }

  async createBroadcast(sessionId: string, data: {
    name: string;
    templateId?: string;
    recipients: string[];
    message?: string;
    scheduledAt?: Date;
  }): Promise<any> {
    return prisma.whatsAppBroadcast.create({
      data: {
        sessionId,
        name: data.name,
        templateId: data.templateId || null,
        recipients: JSON.stringify(data.recipients),
        status: data.scheduledAt ? 'scheduled' : 'draft',
        scheduledAt: data.scheduledAt || null,
      },
    });
  }

  async executeBroadcast(broadcastId: string): Promise<{ sent: number; failed: number }> {
    const broadcast = await prisma.whatsAppBroadcast.findUnique({
      where: { id: broadcastId },
      include: { template: true },
    });

    if (!broadcast) throw new Error('Broadcast not found');

    const recipients = JSON.parse(broadcast.recipients) as string[];
    const message = broadcast.template?.body || '';

    if (!message) throw new Error('No message template for broadcast');

    await prisma.whatsAppBroadcast.update({
      where: { id: broadcastId },
      data: { status: 'sending' },
    });

    let sent = 0;
    let failed = 0;

    for (const phone of recipients) {
      try {
        await this.sendMessage(broadcast.sessionId, phone, message);
        sent++;
        // Small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 1000));
      } catch (error: any) {
        failed++;
        logger.warn(`Broadcast send failed to ${phone}: ${error.message}`);
      }
    }

    await prisma.whatsAppBroadcast.update({
      where: { id: broadcastId },
      data: {
        status: 'completed',
        sentCount: sent,
        failedCount: failed,
        completedAt: new Date(),
      },
    });

    return { sent, failed };
  }

  /**
   * Restore all active sessions from the database on startup
   */
  async restoreActiveSessions(): Promise<void> {
    try {
      const activeSessions = await prisma.whatsAppSession.findMany({
        where: {
          status: {
            in: ['connected', 'initializing', 'qr_pending']
          }
        }
      });

      logger.info(`Restoring ${activeSessions.length} active WhatsApp sessions...`);
      for (const session of activeSessions) {
        try {
          this.initialize(session.userId, session.id).catch(err => {
            logger.error(`Failed to restore WhatsApp session ${session.id}: ${err.message}`);
          });
        } catch (err: any) {
          logger.error(`Error starting restore for session ${session.id}: ${err.message}`);
        }
      }
    } catch (error: any) {
      logger.error(`Failed to retrieve active sessions for restore: ${error.message}`);
    }
  }
}

// Singleton instance
export const whatsappService = new WhatsAppService();
