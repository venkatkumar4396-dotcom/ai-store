export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  role: 'admin' | 'user' | 'developer';
  plan: 'free' | 'pro' | 'enterprise';
  createdAt: string;
  updatedAt: string;
}

export interface Bot {
  id: string;
  name: string;
  description: string;
  longDescription?: string;
  icon: string;
  category: BotCategory;
  rating: number;
  usageCount: number;
  price: number | 'free';
  status: 'active' | 'inactive' | 'beta';
  features: string[];
  author: string;
  version: string;
  standaloneUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export interface BotInstance {
  id: string;
  botId: string;
  userId: string;
  status: 'running' | 'stopped' | 'error' | 'configuring';
  config: Record<string, unknown>;
  metrics: BotMetrics;
  createdAt: string;
  updatedAt: string;
}

export interface BotMetrics {
  messagesProcessed: number;
  tasksCompleted: number;
  uptime: number;
  errorRate: number;
  avgResponseTime: number;
}

export type BotCategory =
  | 'automation'
  | 'communication'
  | 'analytics'
  | 'productivity'
  | 'customer-support'
  | 'marketing'
  | 'development'
  | 'finance';

export interface WhatsAppSession {
  id: string;
  userId: string;
  phoneNumber: string;
  status: 'connected' | 'disconnected' | 'connecting' | 'qr_pending';
  businessName: string;
  qrCode?: string;
  lastActive: string;
  createdAt: string;
}

export interface Message {
  id: string;
  sessionId: string;
  contactId: string;
  content: string;
  type: 'text' | 'image' | 'document' | 'audio' | 'video' | 'template';
  direction: 'incoming' | 'outgoing';
  status: 'sent' | 'delivered' | 'read' | 'failed';
  timestamp: string;
  metadata?: Record<string, unknown>;
}

export interface Contact {
  id: string;
  name: string;
  phoneNumber: string;
  avatar?: string;
  lastMessage?: string;
  lastMessageTime?: string;
  unreadCount: number;
  tags: string[];
}

export interface WhatsAppTemplate {
  id: string;
  name: string;
  content: string;
  category: string;
  status: 'approved' | 'pending' | 'rejected';
  language: string;
  variables: string[];
}

export interface FileTracker {
  id: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  path: string;
  status: 'monitoring' | 'paused' | 'archived';
  lastModified: string;
  changeCount: number;
  createdAt: string;
}

export interface FileActivity {
  id: string;
  fileId: string;
  action: 'created' | 'modified' | 'deleted' | 'renamed' | 'moved';
  description: string;
  user: string;
  timestamp: string;
  metadata?: Record<string, unknown>;
}

export interface AuditLog {
  id: string;
  action: string;
  resource: string;
  user: string;
  details: string;
  ip: string;
  timestamp: string;
}

export interface AIProvider {
  id: string;
  name: string;
  icon: string;
  models: AIModel[];
  status: 'active' | 'inactive';
}

export interface AIModel {
  id: string;
  name: string;
  providerId: string;
  maxTokens: number;
  costPer1kTokens: number;
  capabilities: string[];
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  model?: string;
  provider?: string;
  tokens?: number;
  latency?: number;
  cost?: number;
  timestamp: string;
}

export interface ApiKey {
  id: string;
  provider: string;
  key: string;
  name: string;
  isActive: boolean;
  lastUsed?: string;
  createdAt: string;
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  read: boolean;
  timestamp: string;
}

export interface ActivityItem {
  id: string;
  type: 'bot_activated' | 'message_sent' | 'file_changed' | 'api_call' | 'user_action';
  title: string;
  description: string;
  icon?: string;
  timestamp: string;
  metadata?: Record<string, unknown>;
}

export interface StatsData {
  label: string;
  value: number;
  change: number;
  changeType: 'increase' | 'decrease' | 'neutral';
  icon: string;
}

export interface BusinessSetupData {
  businessName: string;
  industry: string;
  description: string;
  services: string[];
  products: string[];
  brandVoice: 'professional' | 'friendly' | 'casual' | 'formal';
  greetingMessage: string;
  faq: { question: string; answer: string }[];
  supportHours: string;
  supportEmail: string;
  autoReply: boolean;
}
