import dotenv from 'dotenv';
dotenv.config();

import fs from 'fs';
import path from 'path';
import { BotUser, BotSettings, ActivityLog, BroadcastHistoryItem, MessageRequest, BotCommandsConfig, ChatMessage, VerificationChannel } from './types.js';
import { encryptSecret, decryptSecret } from './cryptoService.js';

export const DEFAULT_MINI_APP_URL = "https://marketify5.markafi189.workers.dev/";

export const DEFAULT_VERIFICATION_CHANNELS: VerificationChannel[] = [
  {
    id: '@Click2Cash_Site',
    title: '📢 চ্যানেল ১: Click2Cash',
    url: 'https://t.me/Click2Cash_Site'
  },
  {
    id: '@FlickCove_Top',
    title: '🎬 চ্যানেল ২: FlickCove',
    url: 'https://t.me/FlickCove_Top'
  },
  {
    id: '@download_apk_app',
    title: '📲 চ্যানেল ৩: Download.apk',
    url: 'https://t.me/download_apk_app'
  }
];

export const DEFAULT_VERIFY_PROMPT = `🔒 <b>বট ব্যবহার করতে আপনাকে চ্যানেলগুলোতে জয়েন করতে হবে।</b>

আপনি চ্যানেলে জয়েন করে নিচের <b>Verify</b> বাটনে চাপুন 👇`;

export const DEFAULT_VERIFY_SUCCESS = `✅ <b>ভেরিফিকেশন সম্পন্ন হয়েছে!</b>

আপনি এখন মিনি অ্যাপ ব্যবহার করতে পারেন 👇`;

export const DEFAULT_COMMANDS: BotCommandsConfig = {
  startReply: `*হ্যালো স্যার*\nআমাদের মিনি ওয়েবের মধ্যে সকল ধরনের বাংলাদেশী ও টিকটকারদের ভিডিও পাওয়া যায়। ভিডিও দেখতে নিচের মিনি ওয়েব বাটনে ক্লিক করুন 👇`,
  videoHelpReply: `আমাদের মিনি ওয়েবের মধ্যে সকল ধরনের ভিডিও পাওয়া যায়। মিনি ওয়েব ওপেন করে ওপরে সার্চ ইঞ্জিনে সার্চ করলেই ভিডিও পেয়ে যাবেন।`,
  newVideoReply: `আমাদের মিনি ওয়েবের মধ্যে প্রতিদিন নতুন নতুন সব ধরনের ভিডিও ও টিকটকারের ভিডিও শেয়ার করা হয়। এখনই নিচের মিনি ওয়েব বাটনে ক্লিক করে দেখুন 👇`,
  backupChannelReply: `কখনো ভিডিও মিস না করতে আমাদের মিনি ওয়েব ও ব্যাকআপ চ্যানেলে যুক্ত থাকুন। নিচের মিনি ওয়েব বাটনে ক্লিক করে সব নতুন ভিডিও দেখুন 👇`
};

import { initializeApp } from "firebase/app";

// Your web app's Firebase configuration
export const firebaseConfig = {
  apiKey: "AIzaSyD4Xgc0UfwaQ1HDe1bU8SdKhO8teU-Yppg",
  authDomain: "mariya-bot.firebaseapp.com",
  databaseURL: "https://mariya-bot-default-rtdb.firebaseio.com",
  projectId: "mariya-bot",
  storageBucket: "mariya-bot.firebasestorage.app",
  messagingSenderId: "72753058050",
  appId: "1:72753058050:web:54a92cc0a3618c8b4bf21b"
};

// Initialize Firebase
export const firebaseApp = initializeApp(firebaseConfig);

const RTDB_BASE_URL = firebaseConfig.databaseURL.replace(/\/+$/, '');

// Local persistent storage file path
const DATA_DIR = path.resolve(process.cwd(), 'data');
const STORAGE_FILE = path.join(DATA_DIR, 'bot_storage.json');

interface LocalStorageData {
  users: Record<string, BotUser>;
  settings: BotSettings;
  logs: ActivityLog[];
  broadcasts: BroadcastHistoryItem[];
  lastBroadcastNumber: number;
  requests: Record<string, MessageRequest>;
}

const defaultSettings: BotSettings = {
  botToken: process.env.TELEGRAM_BOT_TOKEN || process.env.BOT_TOKEN || "enc:v1:e130efc0b5a6f3b820d9d342d1c6d1c9:deb6d56b1beb5c61088c8193e64397c1:99669aaaca118396aeca8c2307ffdbb1fad3f1ad282a772ef76369c45755111ff71ef0dc28ee4edb39151995f15d",
  botUsername: "mariya_2Bot",
  geminiApiKey: process.env.GEMINI_API_KEY || "enc:v1:7133ad9e41941a8af0f3a7d978c0435d:6549a3ed9de35c98ef8e7225d80dd9a5:d56a8b82a54e325a4ade1117c1d12df8b504cf24094493c8f4a718fe1787311a57c61fbfad355c255889653b8094ff63fada1dafe3",
  telegramGroupLink: "https://t.me/FlickCove_Top",
  whatsappBackupLink: "https://whatsapp.com/channel/0029Vb7fVTzDzgT78gexpV3V",
  welcomeMessage: "*হ্যালো স্যার*\nআমাদের মিনি ওয়েবের মধ্যে সকল ধরনের বাংলাদেশী ও টিকটকারদের ভিডিও পাওয়া যায়। ভিডিও দেখতে নিচের মিনি ওয়েব বাটনে ক্লিক করুন 👇",
  replyMode: "ai", // 'ai' = Gemini AI, 'static' = Admin fixed reply
  staticReplyMessage: "আমাদের মিনি ওয়েবের মধ্যে সকল ধরনের বাংলাদেশী ও টিকটকারদের ভিডিও পাওয়া যায়। ভিডিও দেখতে নিচের মিনি ওয়েব বাটনে ক্লিক করুন 👇",
  commands: DEFAULT_COMMANDS,
  aiSystemPrompt: `You are the official conversational AI representative of @mariya_2Bot.
Language: Natural Bengali (বাংলা).

RULES:
1. If the user asks about videos or what videos are available (ভিডিও সম্পর্কে জানতে চাইলে):
Always state:
"আমাদের মিনি ওয়েবের মধ্যে সকল ধরনের বাংলাদেশী ভিডিও ও টিকটকারদের ভিডিও পাওয়া যায়। নিচের মিনি ওয়েব বাটনে ক্লিক করলেই সব ভিডিও সরাসরি দেখতে পারবেন।"

2. If the user says they cannot find a video or asks how/where to search:
Always reply:
"আমাদের মিনি ওয়েবের ওপরে সার্চ ইঞ্জিন আছে, মিনি ওয়েব ওপেন করে সেখানে সার্চ করলেই আপনার কাঙ্ক্ষিত ভিডিও পেয়ে যাবেন।"

3. For ALL other messages:
Two-part reply:
- Part 1: Address their message politely in 1-2 friendly sentences.
- Part 2: Always mention that all kinds of videos are available in our Mini Web and invite them to open it using the Mini Web button below ("আমাদের মিনি ওয়েবের মধ্যে সকল ধরনের ভিডিও পাওয়া যায় — নিচের মিনি ওয়েব বাটনে ক্লিক করে সব ভিডিও দেখে নিন।").`,
  isPollingActive: true,
  broadcastDelaySeconds: 5,
  adminTelegramId: "5569819998",
  showInlineButtons: false,
  channelButtonText: "🎬 সব ভিডিও এখানে (Join)",
  whatsappButtonText: "📲 ব্যাকআপ চ্যানেল (WhatsApp)",
  messageRequestMode: "instant_reply",
  offlineNoticeMessage: "📩 আপনার বার্তাটি 'মেসেজ রিকোয়েস্ট' হিসেবে জমা হয়েছে। বট অনলাইনে আসামাত্রই আপনার বার্তার সঠিক উত্তর দেওয়া হবে। ধন্যবাদ!",
  onlineAutoReplyPending: true,
  requireChannelVerify: true,
  requiredChannelId: "@Click2Cash_Site",
  verificationExpirationHours: 24,
  verificationChannels: DEFAULT_VERIFICATION_CHANNELS,
  verifyPromptMessage: DEFAULT_VERIFY_PROMPT,
  verifySuccessMessage: DEFAULT_VERIFY_SUCCESS,
  autoDeleteOnUnverified: true,
  miniAppUrl: DEFAULT_MINI_APP_URL,
  miniAppButtonText: "🚀 ওপেন মিনি অ্যাপ"
};

let cachedStore: LocalStorageData | null = null;
let writeDebounceTimer: NodeJS.Timeout | null = null;

function ensureStorage(): LocalStorageData {
  if (cachedStore) {
    return cachedStore;
  }

  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }

  if (!fs.existsSync(STORAGE_FILE)) {
    const initialData: LocalStorageData = {
      users: {},
      settings: defaultSettings,
      requests: {},
      logs: [{
        id: 'init-1',
        timestamp: new Date().toISOString(),
        type: 'system',
        message: 'Bot Storage initialized successfully'
      }],
      broadcasts: [
        {
          id: 'bc-124',
          broadcastNumber: 124,
          title: '🎬 নতুন এক্সক্লুসিভ ভিডিও কালেকশন আপডেট!',
          message: 'সকল নতুন এবং আকর্ষণীয় ভিডিও পেতে আমাদের FlickCove চ্যানেলে জয়েন করুন।',
          totalUsers: 48520,
          sentCount: 47891,
          failedCount: 629,
          blockedCount: 510,
          percent: 100,
          startedAt: new Date(Date.now() - 86400000).toISOString(),
          completedAt: new Date(Date.now() - 86400000 + 1800000).toISOString(),
          status: 'completed',
          sentUserIdsCount: 47891
        }
      ],
      lastBroadcastNumber: 124
    };
    fs.writeFileSync(STORAGE_FILE, JSON.stringify(initialData, null, 2), 'utf-8');
    cachedStore = initialData;
    return initialData;
  }

  try {
    const raw = fs.readFileSync(STORAGE_FILE, 'utf-8');
    const parsed = JSON.parse(raw);
    if (!parsed.settings) parsed.settings = defaultSettings;
    if (!parsed.settings.messageRequestMode || parsed.settings.messageRequestMode === 'auto_queue_when_offline') {
      parsed.settings.messageRequestMode = 'instant_reply';
    }
    if (!parsed.settings.offlineNoticeMessage) parsed.settings.offlineNoticeMessage = defaultSettings.offlineNoticeMessage;
    if (parsed.settings.onlineAutoReplyPending === undefined) parsed.settings.onlineAutoReplyPending = true;
    if (!parsed.settings.commands) {
      parsed.settings.commands = DEFAULT_COMMANDS;
    } else {
      parsed.settings.commands = {
        ...DEFAULT_COMMANDS,
        ...parsed.settings.commands
      };
    }
    if (parsed.settings.requireChannelVerify === undefined) parsed.settings.requireChannelVerify = true;
    if (!Array.isArray(parsed.settings.verificationChannels) || parsed.settings.verificationChannels.length === 0) {
      parsed.settings.verificationChannels = DEFAULT_VERIFICATION_CHANNELS;
    }
    if (!parsed.settings.requiredChannelId) {
      parsed.settings.requiredChannelId = parsed.settings.verificationChannels[0]?.id || '@Click2Cash_Site';
    }
    if (typeof parsed.settings.verificationExpirationHours !== 'number' || parsed.settings.verificationExpirationHours < 0) {
      parsed.settings.verificationExpirationHours = 24;
    }
    if (!parsed.settings.verifyPromptMessage) parsed.settings.verifyPromptMessage = DEFAULT_VERIFY_PROMPT;
    if (!parsed.settings.verifySuccessMessage) parsed.settings.verifySuccessMessage = DEFAULT_VERIFY_SUCCESS;
    if (parsed.settings.autoDeleteOnUnverified === undefined) parsed.settings.autoDeleteOnUnverified = true;
    if (!parsed.settings.miniAppUrl || !String(parsed.settings.miniAppUrl).trim()) {
      parsed.settings.miniAppUrl = DEFAULT_MINI_APP_URL;
    }
    if (!parsed.settings.miniAppButtonText) parsed.settings.miniAppButtonText = '🚀 ওপেন মিনি অ্যাপ';

    if (!parsed.users) parsed.users = {};
    if (!parsed.requests) parsed.requests = {};
    if (!parsed.logs) parsed.logs = [];
    if (!Array.isArray(parsed.broadcasts)) {
      parsed.broadcasts = [
        {
          id: 'bc-124',
          broadcastNumber: 124,
          title: '🎬 নতুন এক্সক্লুসিভ ভিডিও কালেকশন আপডেট!',
          message: 'সকল নতুন এবং আকর্ষণীয় ভিডিও পেতে আমাদের FlickCove চ্যানেলে জয়েন করুন।',
          totalUsers: 48520,
          sentCount: 47891,
          failedCount: 629,
          blockedCount: 510,
          percent: 100,
          startedAt: new Date(Date.now() - 86400000).toISOString(),
          completedAt: new Date(Date.now() - 86400000 + 1800000).toISOString(),
          status: 'completed',
          sentUserIdsCount: 47891
        }
      ];
    }
    if (typeof parsed.lastBroadcastNumber !== 'number') {
      parsed.lastBroadcastNumber = 124;
    }

    cachedStore = parsed;
    return parsed;
  } catch (e) {
    const initialData: LocalStorageData = {
      users: {},
      settings: defaultSettings,
      requests: {},
      logs: [],
      broadcasts: [
        {
          id: 'bc-124',
          broadcastNumber: 124,
          title: '🎬 নতুন এক্সক্লুসিভ ভিডিও কালেকশন আপডেট!',
          message: 'সকল নতুন এবং আকর্ষণীয় ভিডিও পেতে আমাদের FlickCove চ্যানেলে জয়েন করুন।',
          totalUsers: 48520,
          sentCount: 47891,
          failedCount: 629,
          blockedCount: 510,
          percent: 100,
          startedAt: new Date(Date.now() - 86400000).toISOString(),
          completedAt: new Date(Date.now() - 86400000 + 1800000).toISOString(),
          status: 'completed',
          sentUserIdsCount: 47891
        }
      ],
      lastBroadcastNumber: 124
    };
    fs.writeFileSync(STORAGE_FILE, JSON.stringify(initialData, null, 2), 'utf-8');
    cachedStore = initialData;
    return initialData;
  }
}

function writeStorage(data: LocalStorageData, immediate: boolean = false) {
  cachedStore = data;
  if (immediate) {
    try {
      fs.writeFileSync(STORAGE_FILE, JSON.stringify(data, null, 2), 'utf-8');
    } catch (err) {
      console.error('[Storage] Error writing storage file:', err);
    }
    return;
  }

  if (writeDebounceTimer) return;
  writeDebounceTimer = setTimeout(() => {
    writeDebounceTimer = null;
    try {
      if (cachedStore) {
        fs.writeFileSync(STORAGE_FILE, JSON.stringify(cachedStore, null, 2), 'utf-8');
      }
    } catch (err) {
      console.error('[Storage] Error debounced writing storage file:', err);
    }
  }, 1000);
}

// Background sync to Firebase Realtime Database
async function syncUserToFirebase(user: BotUser) {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3000);
    await fetch(`${RTDB_BASE_URL}/users/${user.id}.json`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: user.id, // Telegram Chat ID for broadcast
        username: user.username || '',
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        firstSeen: user.firstSeen,
        lastActive: user.lastActive,
        messageCount: user.messageCount,
        status: user.status,
        isChannelVerified: Boolean(user.isChannelVerified),
        verifiedAt: user.verifiedAt || ''
      }),
      signal: controller.signal
    });
    clearTimeout(timeout);
  } catch (e) {
    // Non-blocking sync failure ignored
  }
}

async function syncSettingsToFirebase(settings: BotSettings) {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3000);
    // Never write raw secrets to public Firebase RTDB
    const safeSettings = {
      ...settings,
      botToken: 'PROTECTED_IN_SERVER_ENV',
      geminiApiKey: 'PROTECTED_IN_SERVER_ENV'
    };
    await fetch(`${RTDB_BASE_URL}/settings.json`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(safeSettings),
      signal: controller.signal
    });
    clearTimeout(timeout);
  } catch (e) {}
}

async function deleteUserFromFirebase(id: number) {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3000);
    await fetch(`${RTDB_BASE_URL}/users/${id}.json`, {
      method: 'DELETE',
      signal: controller.signal
    });
    clearTimeout(timeout);
  } catch (e) {}
}

// Initial sync from Firebase Realtime Database on startup
(async function initFromFirebase() {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 4000);
    const res = await fetch(`${RTDB_BASE_URL}/users.json`, { signal: controller.signal });
    clearTimeout(timeout);
    if (res.ok) {
      const fbUsers = await res.json();
      if (fbUsers && typeof fbUsers === 'object') {
        const store = ensureStorage();
        let changed = false;
        for (const [key, val] of Object.entries(fbUsers)) {
          if (val && typeof val === 'object' && (val as any).id) {
            const u = val as BotUser;
            store.users[key] = {
              ...store.users[key],
              ...u
            };
            changed = true;
          }
        }
        if (changed) {
          writeStorage(store);
          console.log('[Firebase] Successfully synced users from Firebase Realtime Database');
        }
      }
    }

    // Sync message requests from Firebase
    const reqRes = await fetch(`${RTDB_BASE_URL}/message_requests.json`).catch(() => null);
    if (reqRes && reqRes.ok) {
      const fbRequests = await reqRes.json();
      if (fbRequests && typeof fbRequests === 'object') {
        const store = ensureStorage();
        if (!store.requests) store.requests = {};
        for (const [key, val] of Object.entries(fbRequests)) {
          if (val && typeof val === 'object' && (val as any).id) {
            store.requests[key] = {
              ...store.requests[key],
              ...(val as any)
            };
          }
        }
        writeStorage(store);
      }
    }

    // Sync settings from Firebase (excluding secret placeholders)
    const setRes = await fetch(`${RTDB_BASE_URL}/settings.json`).catch(() => null);
    if (setRes && setRes.ok) {
      const fbSettings = await setRes.json();
      if (fbSettings && typeof fbSettings === 'object') {
        const store = ensureStorage();
        const safeSettings = { ...fbSettings };
        if (safeSettings.botToken === 'PROTECTED_IN_SERVER_ENV' || !safeSettings.botToken) {
          delete safeSettings.botToken;
        }
        if (safeSettings.geminiApiKey === 'PROTECTED_IN_SERVER_ENV' || !safeSettings.geminiApiKey) {
          delete safeSettings.geminiApiKey;
        }
        store.settings = {
          ...store.settings,
          ...safeSettings
        };
        writeStorage(store, true);
        console.log('[Firebase] Successfully synced settings from Firebase Realtime Database');
      }
    }
  } catch (e) {
    // Ignore offline or transient failure
  }
})();

// User operations
export async function saveOrUpdateUser(user: Partial<BotUser> & { id: number }): Promise<BotUser> {
  const store = ensureStorage();
  const userIdStr = user.id.toString();
  const existing = store.users[userIdStr];

  const now = new Date().toISOString();
  const updatedUser: BotUser = {
    ...existing,
    id: user.id,
    username: user.username !== undefined ? user.username : (existing?.username || ''),
    firstName: user.firstName !== undefined ? user.firstName : (existing?.firstName || ''),
    lastName: user.lastName !== undefined ? user.lastName : (existing?.lastName || ''),
    firstSeen: existing?.firstSeen || now,
    lastActive: now,
    messageCount: (existing?.messageCount || 0) + (user.messageCount !== undefined ? user.messageCount : 1),
    status: user.status || existing?.status || 'active',
    isChannelVerified: user.isChannelVerified !== undefined ? user.isChannelVerified : existing?.isChannelVerified,
    verifiedAt: user.verifiedAt !== undefined ? user.verifiedAt : existing?.verifiedAt,
    trackedMessageIds: user.trackedMessageIds !== undefined ? user.trackedMessageIds : (existing?.trackedMessageIds || [])
  };

  store.users[userIdStr] = updatedUser;
  writeStorage(store);

  // Background non-blocking sync to Firebase Realtime Database
  syncUserToFirebase(updatedUser).catch(() => {});

  return updatedUser;
}

export async function trackChatMessageId(userId: number, messageId: number): Promise<void> {
  if (!userId || !messageId) return;
  const store = ensureStorage();
  const userIdStr = userId.toString();
  const user = store.users[userIdStr];
  if (!user) return;
  const existingIds = Array.isArray(user.trackedMessageIds) ? user.trackedMessageIds : [];
  if (!existingIds.includes(messageId)) {
    existingIds.push(messageId);
    user.trackedMessageIds = existingIds.slice(-200);
    writeStorage(store);
  }
}

export async function getTrackedChatMessageIds(userId: number): Promise<number[]> {
  const store = ensureStorage();
  const user = store.users[userId.toString()];
  return Array.isArray(user?.trackedMessageIds) ? [...user.trackedMessageIds] : [];
}

export async function replaceTrackedChatMessageIds(userId: number, messageIds: number[]): Promise<void> {
  const store = ensureStorage();
  const user = store.users[userId.toString()];
  if (!user) return;
  user.trackedMessageIds = messageIds.slice(-200);
  writeStorage(store);
}

export async function updateUserVerification(userId: number, isVerified: boolean): Promise<void> {
  const store = ensureStorage();
  const userIdStr = userId.toString();
  const user = store.users[userIdStr];
  if (!user) return;
  user.isChannelVerified = isVerified;
  if (isVerified) {
    user.verifiedAt = new Date().toISOString();
  }
  writeStorage(store);
  syncUserToFirebase(user).catch(() => {});
}

export async function clearUserChatHistory(userId: number): Promise<void> {
  const store = ensureStorage();
  const user = store.users[userId.toString()];
  if (!user) return;
  user.chatHistory = [];
  user.lastMessageSnippet = '🔒 চ্যানেল ভেরিফিকেশন পেন্ডিং (মেসেজ ডিলিটেড)';
  writeStorage(store);
}

export async function getAllUsers(): Promise<BotUser[]> {
  const store = ensureStorage();
  return Object.values(store.users).sort(
    (a, b) => new Date(b.lastActive).getTime() - new Date(a.lastActive).getTime()
  );
}

export async function appendChatMessage(
  userId: number, 
  sender: 'user' | 'bot' | 'admin', 
  text: string
): Promise<ChatMessage> {
  const store = ensureStorage();
  const userIdStr = userId.toString();
  let user = store.users[userIdStr];
  
  const msg: ChatMessage = {
    id: `msg-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    sender,
    text,
    timestamp: new Date().toISOString()
  };

  if (!user) {
    user = {
      id: userId,
      username: '',
      firstName: `User #${userId}`,
      lastName: '',
      firstSeen: msg.timestamp,
      lastActive: msg.timestamp,
      messageCount: 1,
      status: 'active',
      chatHistory: [msg],
      lastMessageSnippet: text.length > 120 ? text.substring(0, 120) + '...' : text,
      lastMessageTimestamp: msg.timestamp
    };
    store.users[userIdStr] = user;
  } else {
    if (!Array.isArray(user.chatHistory)) {
      user.chatHistory = [];
    }
    user.chatHistory.push(msg);
    // Keep last 50 messages per user to maintain clean, fast storage
    if (user.chatHistory.length > 50) {
      user.chatHistory = user.chatHistory.slice(-50);
    }
    user.lastMessageSnippet = text.length > 120 ? text.substring(0, 120) + '...' : text;
    user.lastMessageTimestamp = msg.timestamp;
    user.lastActive = msg.timestamp;
    if (sender === 'user') {
      user.messageCount = (user.messageCount || 0) + 1;
    }
  }

  writeStorage(store);
  syncUserToFirebase(user).catch(() => {});
  return msg;
}

export async function getUserMessages(userId: number): Promise<ChatMessage[]> {
  const store = ensureStorage();
  const user = store.users[userId.toString()];
  return (user?.chatHistory) || [];
}

export async function getPaginatedUsers(options: {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
}): Promise<{
  users: BotUser[];
  totalUsers: number;
  totalPages: number;
  currentPage: number;
}> {
  const store = ensureStorage();
  const all = Object.values(store.users);

  const search = (options.search || '').trim().toLowerCase();
  const status = options.status || 'all';

  let filtered = all;
  if (search) {
    filtered = filtered.filter(u => 
      (u.firstName && u.firstName.toLowerCase().includes(search)) ||
      (u.lastName && u.lastName.toLowerCase().includes(search)) ||
      (u.username && u.username.toLowerCase().includes(search)) ||
      u.id.toString().includes(search) ||
      (u.lastMessageSnippet && u.lastMessageSnippet.toLowerCase().includes(search))
    );
  }

  if (status !== 'all') {
    filtered = filtered.filter(u => u.status === status);
  }

  filtered.sort((a, b) => new Date(b.lastActive).getTime() - new Date(a.lastActive).getTime());

  const totalUsers = filtered.length;
  const limit = Math.max(1, Math.min(200, Number(options.limit) || 50));
  const totalPages = Math.ceil(totalUsers / limit) || 1;
  const page = Math.max(1, Math.min(totalPages, Number(options.page) || 1));
  const startIndex = (page - 1) * limit;
  const paginatedUsers = filtered.slice(startIndex, startIndex + limit);

  return {
    users: paginatedUsers,
    totalUsers,
    totalPages,
    currentPage: page
  };
}

export async function getUserById(id: number): Promise<BotUser | null> {
  const store = ensureStorage();
  return store.users[id.toString()] || null;
}

export async function deleteUser(id: number): Promise<boolean> {
  const store = ensureStorage();
  delete store.users[id.toString()];
  writeStorage(store);

  deleteUserFromFirebase(id).catch(() => {});
  return true;
}

// Settings operations
export async function getSettings(): Promise<BotSettings> {
  const store = ensureStorage();
  let token = (process.env.TELEGRAM_BOT_TOKEN && process.env.TELEGRAM_BOT_TOKEN.trim()) || 
              (process.env.BOT_TOKEN && process.env.BOT_TOKEN.trim()) || 
              store.settings.botToken || 
              defaultSettings.botToken || "";
  
  // Decrypt if AES-256 encrypted
  if (token.startsWith('enc:v1:')) {
    token = decryptSecret(token);
  }

  let geminiKey = (process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY.trim()) || 
                  store.settings.geminiApiKey || 
                  defaultSettings.geminiApiKey || "";
  if (geminiKey.startsWith('enc:v1:')) {
    geminiKey = decryptSecret(geminiKey);
  }

  return {
    ...store.settings,
    botToken: token,
    geminiApiKey: geminiKey
  };
}

export async function updateSettings(newSettings: Partial<BotSettings>): Promise<BotSettings> {
  const store = ensureStorage();
  const cleanSettings = { ...newSettings };

  // Never overwrite secrets with masked placeholders, bullets, or empty strings
  if (cleanSettings.botToken !== undefined) {
    const t = cleanSettings.botToken.trim();
    if (!t || t.includes('•') || t.includes('*') || t === 'PROTECTED_IN_SERVER_ENV') {
      delete cleanSettings.botToken;
    } else {
      // Store on disk encrypted with AES-256-GCM
      cleanSettings.botToken = encryptSecret(t);
    }
  }

  if (cleanSettings.geminiApiKey !== undefined) {
    const k = cleanSettings.geminiApiKey.trim();
    if (!k || k.includes('•') || k.includes('*') || k === 'PROTECTED_IN_SERVER_ENV') {
      delete cleanSettings.geminiApiKey;
    } else {
      cleanSettings.geminiApiKey = encryptSecret(k);
    }
  }

  store.settings = {
    ...store.settings,
    ...cleanSettings
  };
  writeStorage(store, true);

  // Sync to Firebase with secrets masked
  syncSettingsToFirebase(store.settings).catch(() => {});

  return getSettings();
}

// Logs operations
export async function addActivityLog(log: Omit<ActivityLog, 'id' | 'timestamp'>): Promise<ActivityLog> {
  const store = ensureStorage();
  const entry: ActivityLog = {
    id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    timestamp: new Date().toISOString(),
    ...log
  };
  store.logs.unshift(entry);
  if (store.logs.length > 300) {
    store.logs = store.logs.slice(0, 300);
  }
  writeStorage(store);
  return entry;
}

export async function getActivityLogs(limit = 100): Promise<ActivityLog[]> {
  const store = ensureStorage();
  return store.logs.slice(0, limit);
}

// Broadcast History & Duplicate Tracking
export async function getBroadcastHistory(): Promise<BroadcastHistoryItem[]> {
  const store = ensureStorage();
  return store.broadcasts || [];
}

export async function getNextBroadcastNumber(): Promise<number> {
  const store = ensureStorage();
  const currentNum = typeof store.lastBroadcastNumber === 'number' ? store.lastBroadcastNumber : 124;
  const nextNum = currentNum + 1;
  store.lastBroadcastNumber = nextNum;
  writeStorage(store, true);
  return nextNum;
}

export async function saveBroadcastHistoryItem(item: BroadcastHistoryItem): Promise<void> {
  const store = ensureStorage();
  if (!store.broadcasts) {
    store.broadcasts = [];
  }
  const existingIdx = store.broadcasts.findIndex((b) => b.id === item.id);
  if (existingIdx >= 0) {
    store.broadcasts[existingIdx] = item;
  } else {
    store.broadcasts.unshift(item);
  }
  if (store.broadcasts.length > 50) {
    store.broadcasts = store.broadcasts.slice(0, 50);
  }
  writeStorage(store, true);
}

export async function deleteBroadcastHistoryItem(id: string): Promise<boolean> {
  const store = ensureStorage();
  if (!store.broadcasts) return false;
  store.broadcasts = store.broadcasts.filter((b) => b.id !== id);
  writeStorage(store, true);
  return true;
}

// Message Requests operations (মেসেজ রিকোয়েস্ট & অফলাইন কিউ ম্যানেজমেন্ট)
async function syncMessageRequestToFirebase(req: MessageRequest) {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3000);
    await fetch(`${RTDB_BASE_URL}/message_requests/${req.id}.json`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(req),
      signal: controller.signal
    });
    clearTimeout(timeout);
  } catch (e) {}
}

async function deleteRequestFromFirebase(id: string) {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3000);
    await fetch(`${RTDB_BASE_URL}/message_requests/${id}.json`, {
      method: 'DELETE',
      signal: controller.signal
    });
    clearTimeout(timeout);
  } catch (e) {}
}

export async function saveMessageRequest(req: Omit<MessageRequest, 'id' | 'receivedAt'> & { id?: string; receivedAt?: string }): Promise<MessageRequest> {
  const store = ensureStorage();
  if (!store.requests) store.requests = {};
  const id = req.id || `req-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
  const item: MessageRequest = {
    id,
    userId: req.userId,
    chatId: req.chatId,
    username: req.username || '',
    firstName: req.firstName || '',
    lastName: req.lastName || '',
    messageText: req.messageText || '',
    receivedAt: req.receivedAt || new Date().toISOString(),
    status: req.status || 'pending',
    replyText: req.replyText,
    repliedAt: req.repliedAt,
    repliedBy: req.repliedBy,
    isOfflineMessage: req.isOfflineMessage ?? false
  };

  store.requests[id] = item;
  writeStorage(store);

  syncMessageRequestToFirebase(item).catch(() => {});
  return item;
}

export async function getAllMessageRequests(): Promise<MessageRequest[]> {
  const store = ensureStorage();
  return Object.values(store.requests || {}).sort(
    (a, b) => new Date(b.receivedAt).getTime() - new Date(a.receivedAt).getTime()
  );
}

export async function getPendingMessageRequests(): Promise<MessageRequest[]> {
  const store = ensureStorage();
  return Object.values(store.requests || {})
    .filter(r => r.status === 'pending')
    .sort((a, b) => new Date(a.receivedAt).getTime() - new Date(b.receivedAt).getTime());
}

export async function updateMessageRequest(id: string, updates: Partial<MessageRequest>): Promise<MessageRequest | null> {
  const store = ensureStorage();
  if (!store.requests || !store.requests[id]) return null;
  const updated: MessageRequest = {
    ...store.requests[id],
    ...updates
  };
  store.requests[id] = updated;
  writeStorage(store, true);
  syncMessageRequestToFirebase(updated).catch(() => {});
  return updated;
}

export async function deleteMessageRequest(id: string): Promise<boolean> {
  const store = ensureStorage();
  if (!store.requests || !store.requests[id]) return false;
  delete store.requests[id];
  writeStorage(store, true);
  deleteRequestFromFirebase(id).catch(() => {});
  return true;
}

export async function clearAllMessageRequests(): Promise<boolean> {
  const store = ensureStorage();
  store.requests = {};
  writeStorage(store, true);
  try {
    await fetch(`${RTDB_BASE_URL}/message_requests.json`, { method: 'DELETE' });
  } catch (e) {}
  return true;
}

