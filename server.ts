import express from "express";
import path from "path";
import fs from "fs";
import crypto from "crypto";
import { createServer as createViteServer } from "vite";
import dotenv from "dotenv";
import { GoogleGenAI } from "@google/genai";
import { createClient } from "@supabase/supabase-js";

// Ensure global __dirname injected by tsx does not break CJS/ESM hybrid resolution in plugins
if ((globalThis as any).__dirname === ".") {
  delete (globalThis as any).__dirname;
}
if ((global as any).__dirname === ".") {
  delete (global as any).__dirname;
}

dotenv.config();

const PURCHASES_FILE = path.join(process.cwd(), "data", "purchases.json");

function getStoredPurchases(): Record<string, any> {
  try {
    if (!fs.existsSync(path.dirname(PURCHASES_FILE))) {
      fs.mkdirSync(path.dirname(PURCHASES_FILE), { recursive: true });
    }
    if (fs.existsSync(PURCHASES_FILE)) {
      const content = fs.readFileSync(PURCHASES_FILE, "utf-8");
      return JSON.parse(content || "{}");
    }
  } catch (err) {
    console.warn("[purchases store] Erro ao ler purchases.json:", err);
  }
  return {};
}

function saveStoredPurchase(email: string, data: any) {
  try {
    const key = email.trim().toLowerCase();
    const purchases = getStoredPurchases();
    purchases[key] = {
      ...(purchases[key] || {}),
      ...data,
      email: key,
      updated_at: new Date().toISOString()
    };
    if (!fs.existsSync(path.dirname(PURCHASES_FILE))) {
      fs.mkdirSync(path.dirname(PURCHASES_FILE), { recursive: true });
    }
    fs.writeFileSync(PURCHASES_FILE, JSON.stringify(purchases, null, 2), "utf-8");
    console.log(`[purchases store] Compra salva localmente para ${key}: plano ${data.plan_name}`);
  } catch (err) {
    console.warn("[purchases store] Erro ao salvar purchases.json:", err);
  }
}

export function getSupabaseServiceRoleKey(): string {
  const kAnon = (process.env.VITE_SUPABASE_ANON_KEY || "").trim();
  const kService = (process.env.SUPABASE_SERVICE_ROLE_KEY || "").trim();
  if (kService.startsWith("sb_secret_")) return kService;
  if (kAnon.startsWith("sb_secret_")) return kAnon;
  return kService || kAnon;
}

export function getSupabasePublishableKey(): string {
  const kAnon = (process.env.VITE_SUPABASE_ANON_KEY || "").trim();
  const kService = (process.env.SUPABASE_SERVICE_ROLE_KEY || "").trim();
  if (kAnon.startsWith("sb_publishable_")) return kAnon;
  if (kService.startsWith("sb_publishable_")) return kService;
  return kAnon || kService;
}

// ============================================================================
// Multi-Device Central User Store (Compartilhamento e Acesso Multi-Aparelho)
// ============================================================================
const USERS_FILE = path.join(process.cwd(), "data", "users.json");

export const PROTECTED_ACCOUNTS = [
  "dallia.avr@gmail.com",
  "cssanches@yahoo.com.br",
  "nathaliagsnati123@gmail.com",
  "nathaliagoncalvessilva1@gmail.com",
  "gabrieltmo0301@gmail.com"
];

export function isProtectedAccount(email?: string | null): boolean {
  if (!email) return false;
  const clean = email.trim().toLowerCase();
  return PROTECTED_ACCOUNTS.includes(clean);
}

export interface StoredUser {
  id: string;
  email: string;
  passwordHash: string;
  name?: string;
  avatar?: string;
  treatmentPreference?: string;
  plan?: string;
  leve_especial?: boolean;
  leve_vip?: boolean;
  lia_access?: boolean;
  confirmed: boolean;
  must_change_password?: boolean;
  first_access_completed?: boolean;
  created_at: string;
  updated_at: string;
}

function getStoredUsers(): Record<string, StoredUser> {
  try {
    if (!fs.existsSync(path.dirname(USERS_FILE))) {
      fs.mkdirSync(path.dirname(USERS_FILE), { recursive: true });
    }
    if (fs.existsSync(USERS_FILE)) {
      const content = fs.readFileSync(USERS_FILE, "utf-8");
      return JSON.parse(content || "{}");
    }
  } catch (err) {
    console.warn("[users store] Erro ao ler users.json:", err);
  }
  return {};
}

function saveStoredUser(user: StoredUser) {
  try {
    const key = user.email.trim().toLowerCase();
    const users = getStoredUsers();
    users[key] = {
      ...user,
      email: key,
      updated_at: new Date().toISOString()
    };
    if (!fs.existsSync(path.dirname(USERS_FILE))) {
      fs.mkdirSync(path.dirname(USERS_FILE), { recursive: true });
    }
    fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2), "utf-8");
  } catch (err) {
    console.warn("[users store] Erro ao salvar users.json:", err);
  }
}

function hashPassword(password: string): string {
  return crypto.createHash("sha256").update(password).digest("hex");
}

// ============================================================================
// Multi-Device Cloud Sync Store (Sincronização em tempo real entre dispositivos)
// ============================================================================
const USER_SYNC_DIR = path.join(process.cwd(), "data", "user_sync");
const USER_MAP_FILE = path.join(process.cwd(), "data", "user_sync_map.json");

function ensureUserSyncDir() {
  try {
    if (!fs.existsSync(USER_SYNC_DIR)) {
      fs.mkdirSync(USER_SYNC_DIR, { recursive: true });
    }
  } catch (err) {
    console.warn("[sync store] Erro ao criar diretório USER_SYNC_DIR:", err);
  }
}

// Inicializa diretório na subida do servidor
ensureUserSyncDir();

// Cache em memória para verificações instantâneas de versão e updatedAt (<1ms)
const syncCache = new Map<string, { updatedAt: number; version: number; filePath: string }>();

// SSE Subscribers para push em tempo real instantâneo (<50ms) entre dispositivos
interface SSESubscriber {
  id: string;
  deviceId?: string;
  res: any;
}
const sseSubscribers = new Map<string, Set<SSESubscriber>>();

function sanitizeSyncIdentifier(val: string): string {
  return (val || "").trim().toLowerCase().replace(/[^a-z0-9@._-]/g, "_");
}

function getUserSyncMapping(): Record<string, string> {
  try {
    if (fs.existsSync(USER_MAP_FILE)) {
      return JSON.parse(fs.readFileSync(USER_MAP_FILE, "utf-8") || "{}");
    }
  } catch {}
  return {};
}

function saveUserSyncMapping(mapping: Record<string, string>) {
  try {
    if (!fs.existsSync(path.dirname(USER_MAP_FILE))) {
      fs.mkdirSync(path.dirname(USER_MAP_FILE), { recursive: true });
    }
    fs.writeFileSync(USER_MAP_FILE, JSON.stringify(mapping, null, 2), "utf-8");
  } catch {}
}

function getSyncAccountKey(email?: string, userId?: string): string {
  const cleanEmail = email ? sanitizeSyncIdentifier(email) : "";
  const cleanId = userId ? sanitizeSyncIdentifier(userId) : "";
  const mapping = getUserSyncMapping();

  let primaryKey = cleanEmail || (cleanId ? mapping[cleanId] : "") || cleanId;
  if (!primaryKey) primaryKey = "anonymous";

  if (cleanId && cleanEmail && mapping[cleanId] !== cleanEmail) {
    mapping[cleanId] = cleanEmail;
    saveUserSyncMapping(mapping);
  }

  return primaryKey;
}

function getSyncFilePath(email?: string, userId?: string): string {
  ensureUserSyncDir();
  const key = getSyncAccountKey(email, userId);
  return path.join(USER_SYNC_DIR, `${key}.json`);
}

function broadcastSyncUpdate(accountKey: string, payload: {
  timestamp: number;
  version: number;
  sourceDeviceId?: string;
  data: any;
  email?: string;
  userId?: string;
}) {
  const keysToNotify = new Set<string>();
  if (accountKey) keysToNotify.add(accountKey);
  if (payload.email) keysToNotify.add(sanitizeSyncIdentifier(payload.email));
  if (payload.userId) keysToNotify.add(sanitizeSyncIdentifier(payload.userId));

  const mapping = getUserSyncMapping();
  if (payload.userId && mapping[payload.userId]) {
    keysToNotify.add(sanitizeSyncIdentifier(mapping[payload.userId]));
  }
  if (payload.email) {
    for (const [uid, em] of Object.entries(mapping)) {
      if (em.toLowerCase() === payload.email.toLowerCase()) {
        keysToNotify.add(sanitizeSyncIdentifier(uid));
      }
    }
  }

  const eventPayload = JSON.stringify({
    timestamp: payload.timestamp,
    version: payload.version,
    sourceDeviceId: payload.sourceDeviceId || "",
    data: payload.data
  });

  const sentSubs = new Set<SSESubscriber>();
  for (const key of keysToNotify) {
    const subs = sseSubscribers.get(key);
    if (subs) {
      for (const sub of Array.from(subs)) {
        if (sentSubs.has(sub)) continue;
        sentSubs.add(sub);
        try {
          sub.res.write(`event: sync-update\ndata: ${eventPayload}\n\n`);
        } catch {
          subs.delete(sub);
        }
      }
    }
  }
}

function mergeArrayById(existingArr: any[] = [], incomingArr: any[] = []): any[] {
  const e = Array.isArray(existingArr) ? existingArr : [];
  const i = Array.isArray(incomingArr) ? incomingArr : [];
  if (i.length === 0 && e.length > 0) return e;
  if (e.length === 0) return i;
  const map = new Map();
  e.forEach(item => { if (item?.id) map.set(item.id, item); });
  i.forEach(item => {
    if (item?.id) {
      const prev = map.get(item.id);
      map.set(item.id, prev ? { ...prev, ...item } : item);
    }
  });
  return Array.from(map.values());
}

function mergeDataServer(existing: any, incoming: any): any {
  if (!incoming || typeof incoming !== "object") return existing;
  if (!existing || typeof existing !== "object") return incoming;

  const incomingTasks = Array.isArray(incoming.tasks) ? incoming.tasks : [];
  const existingTasks = Array.isArray(existing.tasks) ? existing.tasks : [];
  const incomingHabits = Array.isArray(incoming.habits) ? incoming.habits : [];
  const existingHabits = Array.isArray(existing.habits) ? existing.habits : [];

  // Se o incoming não tem tarefas mas o existente tem, preserva as tarefas existentes
  let tasks = incomingTasks;
  if (incomingTasks.length === 0 && existingTasks.length > 0) {
    tasks = existingTasks;
  } else if (incomingTasks.length > 0 && existingTasks.length > 0) {
    const taskMap = new Map();
    existingTasks.forEach((t: any) => { if (t?.id) taskMap.set(t.id, t); });
    incomingTasks.forEach((t: any) => {
      if (t?.id) {
        const prev = taskMap.get(t.id);
        taskMap.set(t.id, prev ? { ...prev, ...t, completed: prev.completed || t.completed } : t);
      }
    });
    tasks = Array.from(taskMap.values());
  }

  // Hábitos
  let habits = incomingHabits;
  if (incomingHabits.length === 0 && existingHabits.length > 0) {
    habits = existingHabits;
  } else if (incomingHabits.length > 0 && existingHabits.length > 0) {
    const habitMap = new Map();
    existingHabits.forEach((h: any) => { if (h?.id) habitMap.set(h.id, h); });
    incomingHabits.forEach((h: any) => {
      if (h?.id) {
        const prev = habitMap.get(h.id);
        habitMap.set(h.id, prev ? { ...prev, ...h, history: { ...(prev.history || {}), ...(h.history || {}) } } : h);
      }
    });
    habits = Array.from(habitMap.values());
  }

  // Hidratação
  const hydration = { ...(existing.hydration || {}), ...(incoming.hydration || {}) };
  if (existing.hydration && incoming.hydration) {
    Object.keys(existing.hydration).forEach(k => {
      if (incoming.hydration[k]) {
        hydration[k] = {
          ...existing.hydration[k],
          ...incoming.hydration[k],
          amountMl: Math.max(existing.hydration[k].amountMl || 0, incoming.hydration[k].amountMl || 0)
        };
      }
    });
  }

  // Diário
  const journal = { ...(existing.journal || {}), ...(incoming.journal || {}) };

  // Orações, Devocionais, Metas, Finanças
  const prayers = mergeArrayById(existing.prayers, incoming.prayers);
  const devotionals = mergeArrayById(existing.devotionals, incoming.devotionals);
  const goals = mergeArrayById(existing.goals, incoming.goals);
  const bills = mergeArrayById(existing.bills, incoming.bills);
  const incomes = mergeArrayById(existing.incomes, incoming.incomes);
  const workoutRoutines = mergeArrayById(existing.workoutRoutines, incoming.workoutRoutines);
  const selfCareList = mergeArrayById(existing.selfCareList, incoming.selfCareList);

  const studies = {
    subjects: mergeArrayById(existing.studies?.subjects, incoming.studies?.subjects),
    summaries: mergeArrayById(existing.studies?.summaries, incoming.studies?.summaries)
  };

  const myLife = {
    books: mergeArrayById(existing.myLife?.books, incoming.myLife?.books),
    movies: mergeArrayById(existing.myLife?.movies, incoming.myLife?.movies),
    series: mergeArrayById(existing.myLife?.series, incoming.myLife?.series),
    hobbies: mergeArrayById(existing.myLife?.hobbies, incoming.myLife?.hobbies),
    places: mergeArrayById(existing.myLife?.places, incoming.myLife?.places),
    dreams: mergeArrayById(existing.myLife?.dreams, incoming.myLife?.dreams),
  };

  const user = {
    ...(existing.user || {}),
    ...(incoming.user || {}),
    name: (incoming.user?.name || "").trim() || existing.user?.name || "",
    avatar: incoming.user?.avatar || existing.user?.avatar || "🌿",
    treatmentPreference: incoming.user?.treatmentPreference || existing.user?.treatmentPreference || "feminino"
  };

  return {
    ...existing,
    ...incoming,
    user,
    tasks,
    habits,
    hydration,
    journal,
    prayers,
    devotionals,
    goals,
    bills,
    incomes,
    myLife,
    workoutRoutines,
    selfCareList,
    studies
  };
}

async function saveUserSyncToSupabase(
  userId?: string,
  email?: string,
  data?: any,
  updatedAt?: number,
  version?: number
): Promise<boolean> {
  const supabaseUrl = cleanSupabaseUrl(process.env.VITE_SUPABASE_URL);
  const serviceKey = getSupabaseServiceRoleKey();
  if (!supabaseUrl || !serviceKey || !data) return false;

  const origin = new URL(supabaseUrl).origin;
  try {
    let targetUserId = userId;

    if (!targetUserId && email) {
      const listRes = await fetch(`${origin}/auth/v1/admin/users`, {
        headers: { apikey: serviceKey, Authorization: `Bearer ${serviceKey}` }
      });
      if (listRes.ok) {
        const listData = await listRes.json();
        const found = (listData?.users || []).find(
          (u: any) => (u.email || "").toLowerCase() === email.toLowerCase()
        );
        if (found?.id) targetUserId = found.id;
      }
    }

    if (!targetUserId) return false;

    const patchRes = await fetch(`${origin}/auth/v1/admin/users/${targetUserId}`, {
      method: "PUT",
      headers: {
        apikey: serviceKey,
        Authorization: `Bearer ${serviceKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        user_metadata: {
          app_sync_data: data,
          app_sync_updated_at: updatedAt || Date.now(),
          app_sync_version: version || 1
        }
      })
    });

    return patchRes.ok;
  } catch (err: any) {
    console.warn("[saveUserSyncToSupabase] Falha ao persistir no Supabase:", err?.message || err);
    return false;
  }
}

async function fetchUserSyncFromSupabase(
  email?: string,
  userId?: string
): Promise<{
  data: any;
  updatedAt: number;
  version: number;
  email?: string;
  userId?: string;
} | null> {
  const supabaseUrl = cleanSupabaseUrl(process.env.VITE_SUPABASE_URL);
  const serviceKey = getSupabaseServiceRoleKey();
  if (!supabaseUrl || !serviceKey || (!email && !userId)) return null;

  const origin = new URL(supabaseUrl).origin;
  try {
    let targetUser: any = null;

    if (userId) {
      const res = await fetch(`${origin}/auth/v1/admin/users/${userId}`, {
        headers: { apikey: serviceKey, Authorization: `Bearer ${serviceKey}` }
      });
      if (res.ok) {
        targetUser = await res.json();
      }
    }

    if (!targetUser && email) {
      const listRes = await fetch(`${origin}/auth/v1/admin/users`, {
        headers: { apikey: serviceKey, Authorization: `Bearer ${serviceKey}` }
      });
      if (listRes.ok) {
        const listData = await listRes.json();
        targetUser = (listData?.users || []).find(
          (u: any) => (u.email || "").toLowerCase() === email.toLowerCase()
        );
      }
    }

    if (targetUser?.user_metadata?.app_sync_data) {
      return {
        data: targetUser.user_metadata.app_sync_data,
        updatedAt: Number(targetUser.user_metadata.app_sync_updated_at || Date.now()),
        version: Number(targetUser.user_metadata.app_sync_version || 1),
        email: targetUser.email || email,
        userId: targetUser.id || userId
      };
    }
  } catch (err: any) {
    console.warn("[fetchUserSyncFromSupabase] Falha ao buscar no Supabase:", err?.message || err);
  }
  return null;
}

function readUserSyncPayload(email?: string, userId?: string): {
  data: any;
  updatedAt: number;
  version: number;
  email?: string;
  userId?: string;
} | null {
  try {
    ensureUserSyncDir();
    const accountKey = getSyncAccountKey(email, userId);
    const filePath = getSyncFilePath(email, userId);
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, "utf-8");
      const parsed = JSON.parse(content || "{}");
      if (parsed && parsed.data) {
        syncCache.set(accountKey, {
          updatedAt: parsed.updatedAt || 0,
          version: parsed.version || 1,
          filePath
        });
        if (email) syncCache.set(email.trim().toLowerCase(), { updatedAt: parsed.updatedAt || 0, version: parsed.version || 1, filePath });
        if (userId) syncCache.set(userId.trim().toLowerCase(), { updatedAt: parsed.updatedAt || 0, version: parsed.version || 1, filePath });
        return parsed;
      }
    }
  } catch (err) {
    console.warn("[sync store] Erro ao ler dados de sincronização:", err);
  }
  return null;
}

function writeUserSyncPayload(
  payload: { email?: string; userId?: string; data: any; clientTimestamp?: number; deviceId?: string }
): { success: boolean; updatedAt: number; version: number; accountKey: string } {
  let tempFile: string | null = null;
  try {
    ensureUserSyncDir();
    const accountKey = getSyncAccountKey(payload.email, payload.userId);
    const filePath = getSyncFilePath(payload.email, payload.userId);
    let currentVersion = 1;
    let existing: any = null;

    if (fs.existsSync(filePath)) {
      try {
        existing = JSON.parse(fs.readFileSync(filePath, "utf-8"));
        if (existing?.version) {
          currentVersion = Number(existing.version) + 1;
        }
      } catch {}
    }

    // Prioriza os dados mais recentes enviados pelo dispositivo ativo.
    // Preserva integridade de dados (tarefas concluídas ou desmarcadas, exclusões e adições).
    let finalData = payload.data;
    if (!finalData && existing?.data) {
      finalData = existing.data;
    } else if (finalData && existing?.data) {
      if (!finalData.user?.name && existing.data.user?.name) {
        finalData.user = {
          ...existing.data.user,
          ...finalData.user,
          name: existing.data.user.name,
          treatmentPreference: finalData.user?.treatmentPreference || existing.data.user.treatmentPreference
        };
      }
    }

    if (finalData && Array.isArray(finalData.tasks)) {
      const todayIso = new Date().toISOString().split('T')[0];
      finalData.tasks = finalData.tasks.map((t: any) => ({
        ...t,
        id: t?.id || `task-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        title: t?.title || 'Nova Tarefa',
        date: (t?.date && typeof t.date === 'string' && t.date.trim()) ? t.date.trim() : todayIso,
        completed: Boolean(t?.completed)
      }));
    }

    const updatedAt = Date.now();
    const storedObject = {
      email: payload.email ? payload.email.trim().toLowerCase() : (existing?.email || ""),
      userId: payload.userId || existing?.userId || "",
      data: finalData,
      updatedAt,
      version: currentVersion,
      clientTimestamp: payload.clientTimestamp || updatedAt,
      deviceId: payload.deviceId || "unknown"
    };

    // Escrita atômica segura
    tempFile = `${filePath}.tmp.${Date.now()}`;
    fs.writeFileSync(tempFile, JSON.stringify(storedObject, null, 2), "utf-8");
    fs.renameSync(tempFile, filePath);
    tempFile = null;

    // Atualiza cache em memória
    syncCache.set(accountKey, { updatedAt, version: currentVersion, filePath });
    if (payload.email) {
      syncCache.set(payload.email.trim().toLowerCase(), { updatedAt, version: currentVersion, filePath });
    }
    if (payload.userId) {
      syncCache.set(payload.userId.trim().toLowerCase(), { updatedAt, version: currentVersion, filePath });
    }

    // Persiste também em segundo plano no Supabase Auth (banco central em nuvem compartilhado)
    saveUserSyncToSupabase(
      payload.userId || existing?.userId,
      payload.email || existing?.email,
      finalData,
      updatedAt,
      currentVersion
    ).catch(() => {});

    // Difunde imediatamente via SSE para todos os outros aparelhos conectados nesta mesma conta
    broadcastSyncUpdate(accountKey, {
      timestamp: updatedAt,
      version: currentVersion,
      sourceDeviceId: payload.deviceId,
      data: finalData,
      email: payload.email,
      userId: payload.userId
    });

    return { success: true, updatedAt, version: currentVersion, accountKey };
  } catch (err) {
    if (tempFile) {
      try {
        if (fs.existsSync(tempFile)) fs.unlinkSync(tempFile);
      } catch {}
    }
    console.error("[sync store] Erro ao gravar dados de sincronização:", err);
    return { success: false, updatedAt: 0, version: 0, accountKey: "" };
  }
}

async function syncPurchaseWithSupabaseAuth(
  supabaseUrl: string,
  serviceKey: string,
  buyerEmail: string,
  buyerName: string,
  entitlementUpdate: any
) {
  const origin = new URL(supabaseUrl).origin;
  try {
    const listRes = await fetch(`${origin}/auth/v1/admin/users`, {
      headers: {
        apikey: serviceKey,
        Authorization: `Bearer ${serviceKey}`
      }
    });

    let existingUser: any = null;
    if (listRes.ok) {
      const listData = await listRes.json();
      existingUser = (listData?.users || []).find(
        (u: any) => (u.email || "").toLowerCase() === buyerEmail.toLowerCase()
      );
    }

    const metadataToSet = {
      ...(existingUser?.user_metadata || {}),
      name: buyerName || existingUser?.user_metadata?.name || undefined,
      plan: entitlementUpdate.plan_name,
      plan_name: entitlementUpdate.plan_name,
      leve_especial: entitlementUpdate.leve_especial,
      leve_vip: entitlementUpdate.leve_vip,
      lia_access: entitlementUpdate.lia_access,
      hotmart_status: entitlementUpdate.hotmart_status,
      hotmart_transaction_id: entitlementUpdate.hotmart_transaction_id,
      email_verified: true
    };

    if (existingUser) {
      console.log(`[hotmart-sync] Atualizando usuário existente ${buyerEmail} para ${entitlementUpdate.plan_name}`);
      const updateRes = await fetch(`${origin}/auth/v1/admin/users/${existingUser.id}`, {
        method: "PUT",
        headers: {
          apikey: serviceKey,
          Authorization: `Bearer ${serviceKey}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          email_confirm: true,
          user_metadata: metadataToSet
        })
      });
      return { action: "updated", userId: existingUser.id, ok: updateRes.ok };
    } else {
      console.log(`[hotmart-sync] Criando usuário novo ${buyerEmail} com plano ${entitlementUpdate.plan_name}`);
      const createRes = await fetch(`${origin}/auth/v1/admin/users`, {
        method: "POST",
        headers: {
          apikey: serviceKey,
          Authorization: `Bearer ${serviceKey}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          email: buyerEmail,
          email_confirm: true,
          user_metadata: metadataToSet
        })
      });
      const createdData = await createRes.json();
      return { action: "created", userId: createdData?.id || null, ok: createRes.ok };
    }
  } catch (err: any) {
    console.warn("[hotmart-sync] Erro ao sincronizar com Supabase Auth:", err);
    return { action: "error", error: err?.message };
  }
}

function cleanSupabaseUrl(raw?: string | null): string {
  const fallback = "https://ozzlnqlhrythvjdrdgwe.supabase.co";
  if (!raw) return fallback;
  let cleaned = String(raw).trim();
  cleaned = cleaned.replace(/[\u200B-\u200D\uFEFF\u00A0]/g, "").trim();
  cleaned = cleaned.replace(/^(?:export\s+)?(?:VITE_)?SUPABASE_URL\s*[:=]\s*/i, "").trim();
  if ((cleaned.startsWith('"') && cleaned.endsWith('"')) || (cleaned.startsWith("'") && cleaned.endsWith("'"))) {
    cleaned = cleaned.slice(1, -1).trim();
  }
  if (cleaned.endsWith(";")) {
    cleaned = cleaned.slice(0, -1).trim();
  }
  try {
    const parsed = new URL(cleaned.startsWith("http") ? cleaned : `https://${cleaned}`);
    return parsed.origin;
  } catch {
    return fallback;
  }
}

let aiClient: GoogleGenAI | null = null;

function getAIClient(): GoogleGenAI | null {
  if (!aiClient && process.env.GEMINI_API_KEY) {
    aiClient = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  }
  return aiClient;
}

const SUPPORTED_GEMINI_MODELS = ["gemini-3.8-flash", "gemini-3.6-flash", "gemini-3.1-flash-lite"];

async function generateGeminiContentWithFallback(ai: GoogleGenAI, params: { contents: any; config?: any }) {
  let lastError: any = null;
  for (const model of SUPPORTED_GEMINI_MODELS) {
    try {
      return await ai.models.generateContent({
        model,
        contents: params.contents,
        config: params.config
      });
    } catch (err: any) {
      lastError = err;
      console.warn(`[Gemini] Modelo ${model} falhou, tentando próximo modelo:`, err?.message || err);
    }
  }
  throw lastError;
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: "20mb" }));
  app.use(express.urlencoded({ limit: "20mb", extended: true }));

  // Health check
  app.get("/api/health", (_req, res) => {
    res.json({ status: "ok", service: "LEVE" });
  });

  // Supabase public configuration endpoint (detects and fixes inverted keys safely)
  app.get("/api/auth/config", (_req, res) => {
    const supabaseUrl = cleanSupabaseUrl(process.env.VITE_SUPABASE_URL);
    const publishableKey = getSupabasePublishableKey();

    res.json({
      supabaseUrl,
      supabaseAnonKey: publishableKey
    });
  });

  // Confirm user email endpoint (admin override to immediately unblock users)
  app.post("/api/auth/confirm-user", async (req, res) => {
    try {
      const email = (req.body?.email || "").trim().toLowerCase();
      if (!email) {
        return res.status(400).json({ error: "E-mail não fornecido" });
      }

      const isProtected = isProtectedAccount(email);
      const storedUsers = getStoredUsers();
      const localUser = storedUsers[email];

      // 0. Contas protegidas: confirmadas e ativadas imediatamente sem bloqueio
      if (isProtected) {
        if (localUser) {
          localUser.confirmed = true;
          localUser.plan = "vip";
          localUser.leve_vip = true;
          localUser.lia_access = true;
          saveStoredUser(localUser);
        }
        return res.json({
          success: true,
          message: "Conta protegida confirmada com sucesso! Você já pode entrar.",
          alreadyConfirmed: true
        });
      }

      // 1. Se o usuário estiver no banco local
      if (localUser) {
        const isFree = localUser.plan === "LEVE Gratuito" || (!localUser.leve_vip && !localUser.leve_especial && !isProtected);
        if (isFree && !isProtected) {
          return res.status(404).json({
            error: "Não encontramos uma conta com esse e-mail. Para acessar o LEVE, realize sua compra primeiro."
          });
        }

        localUser.confirmed = true;
        saveStoredUser(localUser);
        return res.json({
          success: true,
          message: "E-mail confirmado com sucesso! Você já pode entrar.",
          alreadyConfirmed: false
        });
      }

      // 2. Se não estiver no banco local, tenta via Supabase Admin API
      const supabaseUrl = cleanSupabaseUrl(process.env.VITE_SUPABASE_URL);
      const serviceKey = getSupabaseServiceRoleKey();

      if (!serviceKey || !supabaseUrl) {
        return res.status(404).json({
          error: "Não encontramos uma conta com esse e-mail. Para acessar o LEVE, realize sua compra primeiro."
        });
      }

      try {
        const origin = new URL(supabaseUrl).origin;
        const listRes = await fetch(`${origin}/auth/v1/admin/users`, {
          headers: {
            apikey: serviceKey,
            Authorization: `Bearer ${serviceKey}`
          }
        });

        if (!listRes.ok) {
          return res.status(400).json({
            error: "Não encontramos uma conta com esse e-mail. Para acessar o LEVE, realize sua compra primeiro."
          });
        }

        const listData = await listRes.json();
        const users: any[] = listData?.users || [];
        const user = users.find((u: any) => (u.email || "").toLowerCase() === email);

        if (!user) {
          return res.status(404).json({
            error: "Não encontramos uma conta com esse e-mail. Para acessar o LEVE, realize sua compra primeiro."
          });
        }

        // Bloqueio de contas gratuitas no Supabase
        const meta = user.user_metadata || {};
        const plan = meta.plan || meta.plan_name;
        const isFree = !isProtected && (plan === "LEVE Gratuito" || plan === "gratuito" || plan === "free" || (!meta.leve_vip && !meta.leve_especial));
        if (isFree) {
          return res.status(404).json({
            error: "Não encontramos uma conta com esse e-mail. Para acessar o LEVE, realize sua compra primeiro."
          });
        }

        // Se já está confirmado
        if (user.email_confirmed_at) {
          return res.json({ success: true, message: "E-mail já está confirmado e ativo!", alreadyConfirmed: true });
        }

        // Atualiza usuário para confirmado imediatamente
        const updateRes = await fetch(`${origin}/auth/v1/admin/users/${user.id}`, {
          method: "PUT",
          headers: {
            apikey: serviceKey,
            Authorization: `Bearer ${serviceKey}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            email_confirm: true,
            user_metadata: {
              ...(user.user_metadata || {}),
              email_verified: true
            }
          })
        });

        if (!updateRes.ok) {
          return res.status(400).json({ error: "Falha ao liberar e-mail do usuário no serviço de autenticação." });
        }

        console.log(`[confirm-user] Usuário ${email} ativado com sucesso.`);
        return res.json({ success: true, message: "E-mail confirmado com sucesso! Você já pode entrar." });
      } catch (supErr: any) {
        console.warn("[confirm-user] Erro ao comunicar com Supabase:", supErr);
        return res.status(400).json({
          error: "Não encontramos uma conta com esse e-mail. Para acessar o LEVE, realize sua compra primeiro."
        });
      }
    } catch (err: any) {
      console.error("[confirm-user] Exceção:", err);
      return res.status(400).json({ error: "Não encontramos uma conta com esse e-mail. Para acessar o LEVE, realize sua compra primeiro." });
    }
  });

  // Resend or generate confirmation link
  app.post("/api/auth/resend-confirmation", async (req, res) => {
    try {
      const email = (req.body?.email || "").trim().toLowerCase();
      if (!email) {
        return res.status(400).json({ error: "E-mail não fornecido" });
      }

      if (isProtectedAccount(email)) {
        return res.json({
          success: true,
          message: "Conta protegida ativa e confirmada! Você pode entrar diretamente com sua senha."
        });
      }

      const supabaseUrl = cleanSupabaseUrl(process.env.VITE_SUPABASE_URL);
      const serviceKey = getSupabaseServiceRoleKey();

      if (!serviceKey) {
        return res.status(500).json({ error: "Chave de serviço não configurada" });
      }

      const origin = new URL(supabaseUrl).origin;
      // Also confirm the user directly to guarantee they won't remain locked out
      const listRes = await fetch(`${origin}/auth/v1/admin/users`, {
        headers: {
          apikey: serviceKey,
          Authorization: `Bearer ${serviceKey}`
        }
      });

      if (listRes.ok) {
        const listData = await listRes.json();
        const user = (listData?.users || []).find((u: any) => (u.email || "").toLowerCase() === email);
        if (user) {
          await fetch(`${origin}/auth/v1/admin/users/${user.id}`, {
            method: "PUT",
            headers: {
              apikey: serviceKey,
              Authorization: `Bearer ${serviceKey}`,
              "Content-Type": "application/json"
            },
            body: JSON.stringify({
              email_confirm: true,
              user_metadata: {
                ...(user.user_metadata || {}),
                email_verified: true
              }
            })
          });
          return res.json({ success: true, message: "Acesso e e-mail liberados com sucesso! Você já pode entrar." });
        }
      }

      return res.json({ success: true, message: "Solicitação processada com sucesso." });
    } catch (err: any) {
      console.error("[resend-confirmation] Erro:", err);
      return res.status(500).json({ error: err?.message || "Erro ao processar reenviar confirmação" });
    }
  });

  // LEVIA Chat API endpoint (Gemini 3.8 Flash)
  // Endpoints para desbloqueio e autorização imediata de clientes pós-compra
  // ============================================================================

  // Claim account / Primeiro acesso pós-compra (define senha e ativa conta instantaneamente)
  app.post("/api/auth/claim-account", async (req, res) => {
    try {
      const email = (req.body?.email || "").trim().toLowerCase();
      const password = (req.body?.password || "").trim();
      const name = (req.body?.name || "").trim();

      if (!email || !password) {
        return res.status(400).json({ error: "E-mail e senha são obrigatórios" });
      }
      if (password.length < 6) {
        return res.status(400).json({ error: "A senha deve ter no mínimo 6 dígitos" });
      }

      const supabaseUrl = cleanSupabaseUrl(process.env.VITE_SUPABASE_URL);
      const serviceKey = getSupabaseServiceRoleKey();
      if (!serviceKey) {
        return res.status(500).json({ error: "Chave de serviço indisponível" });
      }

      const origin = new URL(supabaseUrl).origin;
      const listRes = await fetch(`${origin}/auth/v1/admin/users`, {
        headers: { apikey: serviceKey, Authorization: `Bearer ${serviceKey}` }
      });

      if (!listRes.ok) {
        return res.status(500).json({ error: "Erro ao consultar base de clientes" });
      }

      const listData = await listRes.json();
      const user = (listData?.users || []).find((u: any) => (u.email || "").toLowerCase() === email);

      // Verificar se há registro prévio de compra local
      const purchases = getStoredPurchases();
      const storedPurchase = purchases[email];

      if (!user) {
        // Usuário não existe ainda no Supabase Auth -> cria com a senha informada
        const metadata: Record<string, any> = {
          name: name || undefined,
          email_verified: true
        };
        if (storedPurchase) {
          metadata.plan = storedPurchase.plan_name;
          metadata.plan_name = storedPurchase.plan_name;
          metadata.leve_especial = storedPurchase.leve_especial;
          metadata.leve_vip = storedPurchase.leve_vip;
          metadata.lia_access = storedPurchase.lia_access;
        }

        const createRes = await fetch(`${origin}/auth/v1/admin/users`, {
          method: "POST",
          headers: {
            apikey: serviceKey,
            Authorization: `Bearer ${serviceKey}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            email,
            password,
            email_confirm: true,
            user_metadata: metadata
          })
        });

        if (!createRes.ok) {
          const errText = await createRes.text();
          return res.status(400).json({ error: "Erro ao criar conta: " + errText });
        }
        return res.json({ success: true, message: "Conta criada e liberada com sucesso!" });
      }

      // Usuário já existe (pré-criado pela Hotmart ou cadastro anterior):
      // Define a senha e garante email_confirm: true imediatamente!
      const userMetadata: Record<string, any> = {
        ...(user.user_metadata || {}),
        name: name || user.user_metadata?.name || undefined,
        email_verified: true
      };
      if (storedPurchase) {
        userMetadata.plan = storedPurchase.plan_name;
        userMetadata.plan_name = storedPurchase.plan_name;
        userMetadata.leve_especial = storedPurchase.leve_especial;
        userMetadata.leve_vip = storedPurchase.leve_vip;
        userMetadata.lia_access = storedPurchase.lia_access;
      }

      const updateRes = await fetch(`${origin}/auth/v1/admin/users/${user.id}`, {
        method: "PUT",
        headers: {
          apikey: serviceKey,
          Authorization: `Bearer ${serviceKey}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          password,
          email_confirm: true,
          user_metadata: userMetadata
        })
      });

      if (!updateRes.ok) {
        const errText = await updateRes.text();
        console.warn("[claim-account] Supabase retornou erro, salvando no banco local:", errText);
      }

      // Salva no banco de usuários central para que todos os aparelhos tenham acesso imediato
      const plan = storedPurchase?.plan_name || "LEVE Gratuito";
      const leve_especial = Boolean(storedPurchase?.leve_especial);
      const leve_vip = Boolean(storedPurchase?.leve_vip);
      const lia_access = Boolean(storedPurchase?.lia_access);

      const users = getStoredUsers();
      const existingUser = users[email];
      const userId = existingUser?.id || user?.id || crypto.randomUUID();

      saveStoredUser({
        id: userId,
        email,
        passwordHash: hashPassword(password),
        name: name || existingUser?.name || user?.user_metadata?.name || "",
        avatar: existingUser?.avatar || user?.user_metadata?.avatar || "🌿",
        treatmentPreference: existingUser?.treatmentPreference || "feminino",
        plan: existingUser?.plan || plan,
        leve_especial: existingUser?.leve_especial ?? leve_especial,
        leve_vip: existingUser?.leve_vip ?? leve_vip,
        lia_access: existingUser?.lia_access ?? lia_access,
        confirmed: true,
        created_at: existingUser?.created_at || new Date().toISOString(),
        updated_at: new Date().toISOString()
      });

      const mapping = getUserSyncMapping();
      mapping[userId] = email;
      saveUserSyncMapping(mapping);

      return res.json({ success: true, message: "Senha cadastrada e acesso liberado com sucesso!" });
    } catch (err: any) {
      console.error("[claim-account] Erro:", err);
      return res.status(500).json({ error: err?.message || "Erro interno ao ativar conta" });
    }
  });

  // 1. Cadastro centralizado - Compartilhado entre múltiplos dispositivos
  app.post("/api/auth/register", async (req, res) => {
    try {
      const email = (req.body?.email || "").trim().toLowerCase();
      const password = req.body?.password || "";
      const name = (req.body?.name || "").trim();
      const avatar = (req.body?.avatar || "🌿").trim();
      const treatmentPreference = req.body?.treatmentPreference || "feminino";

      if (!email || !password) {
        return res.status(400).json({ error: "E-mail e senha são obrigatórios." });
      }
      if (password.length < 6) {
        return res.status(400).json({ error: "A senha deve ter pelo menos 6 caracteres." });
      }

      const users = getStoredUsers();
      let user = users[email];

      const purchases = getStoredPurchases();
      const purchase = purchases[email];
      const plan = purchase?.plan_name || user?.plan || "LEVE Gratuito";
      const leve_especial = Boolean(purchase?.leve_especial || user?.leve_especial);
      const leve_vip = Boolean(purchase?.leve_vip || user?.leve_vip);
      const lia_access = Boolean(purchase?.lia_access || user?.lia_access);

      const userId = user?.id || crypto.randomUUID();
      const passwordHash = hashPassword(password);

      const updatedUser: StoredUser = {
        id: userId,
        email,
        passwordHash,
        name: name || user?.name || "",
        avatar: avatar || user?.avatar || "🌿",
        treatmentPreference: treatmentPreference || user?.treatmentPreference || "feminino",
        plan,
        leve_especial,
        leve_vip,
        lia_access,
        confirmed: true,
        created_at: user?.created_at || new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      saveStoredUser(updatedUser);

      // Mapeia userId para email
      const mapping = getUserSyncMapping();
      mapping[userId] = email;
      saveUserSyncMapping(mapping);

      const token = `leve_token_${crypto.randomBytes(24).toString("hex")}`;
      const session = {
        access_token: token,
        token_type: "bearer",
        expires_in: 3600 * 24 * 365,
        expires_at: Math.floor(Date.now() / 1000) + 3600 * 24 * 365,
        refresh_token: `leve_refresh_${crypto.randomBytes(24).toString("hex")}`,
        user: {
          id: userId,
          email,
          user_metadata: {
            name: updatedUser.name,
            full_name: updatedUser.name,
            avatar: updatedUser.avatar,
            treatment_preference: updatedUser.treatmentPreference,
            plan: updatedUser.plan,
            leve_especial: updatedUser.leve_especial,
            leve_vip: updatedUser.leve_vip,
            lia_access: updatedUser.lia_access
          }
        }
      };

      return res.json({
        success: true,
        user: session.user,
        session
      });
    } catch (err: any) {
      console.error("[register] Erro:", err);
      return res.status(500).json({ error: err?.message || "Erro ao processar cadastro." });
    }
  });

  // 2. Login centralizado - Qualquer dispositivo logado na mesma conta
  app.post("/api/auth/login", async (req, res) => {
    try {
      const email = (req.body?.email || "").trim().toLowerCase();
      const password = req.body?.password || "";

      if (!email || !password) {
        return res.status(400).json({ error: "E-mail e senha são obrigatórios." });
      }

      const users = getStoredUsers();
      const user = users[email];
      const pwdHash = hashPassword(password);

      const isProtected = isProtectedAccount(email);

      // 0. Contas protegidas (VIPs e administradores prioritários):
      // Acesso garantido instantaneamente em qualquer aparelho sem bloqueios ou exigência de compra.
      if (isProtected) {
        const purchases = getStoredPurchases();
        const existingPurchase = purchases[email];
        const userId = user?.id || existingPurchase?.user_id || `protected_${email.replace(/[^a-zA-Z0-9]/g, "_")}`;

        const updatedProtectedUser: StoredUser = {
          id: userId,
          email,
          passwordHash: pwdHash, // Salva a senha fornecida pelo cliente protegido
          name: user?.name || existingPurchase?.name || existingPurchase?.buyer_name || (email.split("@")[0]),
          avatar: user?.avatar || "🌿",
          treatmentPreference: user?.treatmentPreference || "feminino",
          plan: "vip",
          leve_especial: false,
          leve_vip: true,
          lia_access: true,
          confirmed: true,
          must_change_password: false,
          first_access_completed: true,
          created_at: user?.created_at || new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
        saveStoredUser(updatedProtectedUser);

        const mapping = getUserSyncMapping();
        mapping[userId] = email;
        saveUserSyncMapping(mapping);

        const token = `leve_token_${crypto.randomBytes(24).toString("hex")}`;
        const session = {
          access_token: token,
          token_type: "bearer",
          expires_in: 3600 * 24 * 365,
          expires_at: Math.floor(Date.now() / 1000) + 3600 * 24 * 365,
          refresh_token: `leve_refresh_${crypto.randomBytes(24).toString("hex")}`,
          user: {
            id: userId,
            email,
            user_metadata: {
              name: updatedProtectedUser.name,
              full_name: updatedProtectedUser.name,
              avatar: updatedProtectedUser.avatar,
              treatment_preference: updatedProtectedUser.treatmentPreference,
              plan: "vip",
              leve_especial: false,
              leve_vip: true,
              lia_access: true,
              must_change_password: false,
              first_access_completed: true
            }
          }
        };

        return res.json({
          success: true,
          user: session.user,
          session
        });
      }

      // 1. Se o usuário já existe localmente em users.json
      if (user) {
        // Bloqueio imediato de contas gratuitas ou de testes
        const isFree = user.plan === "LEVE Gratuito" || (!user.leve_vip && !user.leve_especial && !isProtected);
        if (isFree && !isProtected) {
          return res.status(404).json({
            error: "Não encontramos uma conta com esse e-mail. Para acessar o LEVE, realize sua compra primeiro."
          });
        }

        if (user.passwordHash === pwdHash || user.passwordHash === password) {
          if (user.passwordHash === password) {
            user.passwordHash = pwdHash;
            saveStoredUser(user);
          }

          const needsChange = !isProtected && (user.must_change_password === true || user.first_access_completed === false);

          const token = `leve_token_${crypto.randomBytes(24).toString("hex")}`;
          const session = {
            access_token: token,
            token_type: "bearer",
            expires_in: 3600 * 24 * 365,
            expires_at: Math.floor(Date.now() / 1000) + 3600 * 24 * 365,
            refresh_token: `leve_refresh_${crypto.randomBytes(24).toString("hex")}`,
            user: {
              id: user.id,
              email: user.email,
              user_metadata: {
                name: user.name,
                full_name: user.name,
                avatar: user.avatar,
                treatment_preference: user.treatmentPreference,
                plan: isProtected ? "vip" : user.plan,
                leve_especial: isProtected ? false : user.leve_especial,
                leve_vip: isProtected ? true : user.leve_vip,
                lia_access: isProtected ? true : user.lia_access,
                must_change_password: needsChange,
                first_access_completed: !needsChange
              }
            }
          };

          return res.json({
            success: true,
            user: session.user,
            session
          });
        }
      }

      // 2. Tenta autenticação no Supabase Auth com as credenciais fornecidas
      const supabaseUrl = cleanSupabaseUrl(process.env.VITE_SUPABASE_URL);
      const kAnon = (process.env.VITE_SUPABASE_ANON_KEY || "").trim();
      if (supabaseUrl && kAnon) {
        try {
          const origin = new URL(supabaseUrl).origin;
          const supRes = await fetch(`${origin}/auth/v1/token?grant_type=password`, {
            method: "POST",
            headers: {
              apikey: kAnon,
              "Content-Type": "application/json"
            },
            body: JSON.stringify({ email, password })
          });
          if (supRes.ok) {
            const supData = await supRes.json();
            if (supData?.user) {
              const meta = supData.user.user_metadata || {};
              const plan = meta.plan || meta.plan_name;
              const isFree = !isProtected && (plan === "LEVE Gratuito" || plan === "gratuito" || plan === "free" || (!meta.leve_vip && !meta.leve_especial));
              if (isFree) {
                return res.status(404).json({
                  error: "Não encontramos uma conta com esse e-mail. Para acessar o LEVE, realize sua compra primeiro."
                });
              }

              const needsChange = !isProtected && (meta.must_change_password === true || meta.first_access_completed === false);

              const migratedUser: StoredUser = {
                id: supData.user.id,
                email,
                passwordHash: pwdHash,
                name: supData.user.user_metadata?.name || "",
                avatar: supData.user.user_metadata?.avatar || "🌿",
                treatmentPreference: supData.user.user_metadata?.treatment_preference || "feminino",
                plan: isProtected ? "vip" : (supData.user.user_metadata?.plan || "vip"),
                leve_especial: isProtected ? false : Boolean(supData.user.user_metadata?.leve_especial),
                leve_vip: isProtected ? true : Boolean(supData.user.user_metadata?.leve_vip),
                lia_access: isProtected ? true : Boolean(supData.user.user_metadata?.lia_access),
                confirmed: true,
                must_change_password: needsChange,
                first_access_completed: !needsChange,
                created_at: supData.user.created_at || new Date().toISOString(),
                updated_at: new Date().toISOString()
              };
              saveStoredUser(migratedUser);

              return res.json({
                success: true,
                user: {
                  ...supData.user,
                  user_metadata: {
                    ...meta,
                    must_change_password: needsChange,
                    first_access_completed: !needsChange
                  }
                },
                session: supData
              });
            }
          }
        } catch {}
      }

      // 3. Se a autenticação falhou, verificar se a conta existe no Supabase Auth
      let foundSupabaseUser: any = null;
      const serviceKey = getSupabaseServiceRoleKey();
      if (serviceKey && supabaseUrl) {
        try {
          const origin = new URL(supabaseUrl).origin;
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 3000);
          const listRes = await fetch(`${origin}/auth/v1/admin/users`, {
            headers: {
              apikey: serviceKey,
              Authorization: `Bearer ${serviceKey}`
            },
            signal: controller.signal
          });
          clearTimeout(timeoutId);
          if (listRes.ok) {
            const listData = await listRes.json();
            foundSupabaseUser = Array.isArray(listData?.users) && listData.users.find(
              (u: any) => (u.email || "").trim().toLowerCase() === email
            );
          }
        } catch (errCheck) {
          console.warn("[login] Falha ao verificar existência de e-mail no Supabase:", errCheck);
        }
      }

      // Se o usuário existe no Supabase Auth
      if (foundSupabaseUser) {
        const meta = foundSupabaseUser.user_metadata || {};
        const plan = meta.plan || meta.plan_name;
        const isFree = !isProtected && (plan === "LEVE Gratuito" || plan === "gratuito" || plan === "free" || (!meta.leve_vip && !meta.leve_especial));
        if (isFree) {
          return res.status(404).json({
            error: "Não encontramos uma conta com esse e-mail. Para acessar o LEVE, realize sua compra primeiro."
          });
        }
        // É cliente pago, porém a senha está incorreta
        return res.status(401).json({ error: "E-mail ou senha incorretos. Por favor, verifique seus dados e tente novamente." });
      }

      // 4. Se não existe no Supabase Auth, checa se há compra paga legada (purchases.json)
      const purchases = getStoredPurchases();
      const purchase = purchases[email];

      // Somente permite acesso se for cliente com compra paga real (não gratuito)
      if (!user && purchase && purchase.plan_name && purchase.plan_name !== "LEVE Gratuito") {
        const newId = crypto.randomUUID();
        const newUser: StoredUser = {
          id: newId,
          email,
          passwordHash: pwdHash,
          name: purchase.name || purchase.buyer_name || "",
          avatar: "🌿",
          treatmentPreference: "feminino",
          plan: isProtected ? "vip" : purchase.plan_name,
          leve_especial: isProtected ? false : Boolean(purchase.leve_especial),
          leve_vip: isProtected ? true : Boolean(purchase.leve_vip),
          lia_access: isProtected ? true : Boolean(purchase.lia_access),
          confirmed: true,
          must_change_password: false,
          first_access_completed: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
        saveStoredUser(newUser);

        const mapping = getUserSyncMapping();
        mapping[newId] = email;
        saveUserSyncMapping(mapping);

        const token = `leve_token_${crypto.randomBytes(24).toString("hex")}`;
        const session = {
          access_token: token,
          token_type: "bearer",
          expires_in: 3600 * 24 * 365,
          expires_at: Math.floor(Date.now() / 1000) + 3600 * 24 * 365,
          refresh_token: `leve_refresh_${crypto.randomBytes(24).toString("hex")}`,
          user: {
            id: newId,
            email,
            user_metadata: {
              name: newUser.name,
              full_name: newUser.name,
              avatar: newUser.avatar,
              treatment_preference: newUser.treatmentPreference,
              plan: newUser.plan,
              leve_especial: newUser.leve_especial,
              leve_vip: newUser.leve_vip,
              lia_access: newUser.lia_access,
              must_change_password: false,
              first_access_completed: true
            }
          }
        };

        return res.json({
          success: true,
          user: session.user,
          session
        });
      }

      // 5. Se o usuário já existe e é pago/protegido, mas a senha não confere
      if (isProtected || (user && (user.plan !== "LEVE Gratuito" || user.leve_vip || user.leve_especial))) {
        return res.status(401).json({
          error: "E-mail ou senha incorretos. Por favor, verifique seus dados e tente novamente."
        });
      }

      // 6. Conta inexistente, de teste, gratuita ou sem compra paga
      return res.status(404).json({
        error: "Não encontramos uma conta com esse e-mail. Para acessar o LEVE, realize sua compra primeiro."
      });
    } catch (err: any) {
      console.error("[login] Erro:", err);
      return res.status(500).json({ error: err?.message || "Erro no login." });
    }
  });

  // 3. Concluir primeiro acesso e definir senha definitiva
  app.post("/api/auth/complete-first-access", async (req, res) => {
    try {
      const email = (req.body?.email || "").trim().toLowerCase();
      const newPassword = (req.body?.newPassword || "").trim();

      if (!email || !newPassword) {
        return res.status(400).json({ error: "E-mail e nova senha são obrigatórios." });
      }

      if (newPassword.length < 6) {
        return res.status(400).json({ error: "A nova senha deve ter no mínimo 6 caracteres." });
      }

      const users = getStoredUsers();
      let user = users[email];
      const pwdHash = hashPassword(newPassword);

      if (isProtectedAccount(email)) {
        if (user) {
          user.passwordHash = pwdHash;
          user.must_change_password = false;
          user.first_access_completed = true;
          user.plan = "vip";
          user.leve_vip = true;
          user.lia_access = true;
          user.confirmed = true;
          user.updated_at = new Date().toISOString();
          saveStoredUser(user);
        }
        return res.json({
          success: true,
          message: "Senha da conta protegida cadastrada com sucesso! Bem-vinda ao LEVE."
        });
      }

      if (user) {
        user.passwordHash = pwdHash;
        user.must_change_password = false;
        user.first_access_completed = true;
        user.updated_at = new Date().toISOString();
        saveStoredUser(user);
      } else {
        const purchases = getStoredPurchases();
        const purchase = purchases[email];
        const newId = crypto.randomUUID();
        const newUser: StoredUser = {
          id: newId,
          email,
          passwordHash: pwdHash,
          name: purchase?.name || purchase?.buyer_name || "",
          avatar: "🌿",
          treatmentPreference: "feminino",
          plan: "vip",
          leve_especial: false,
          leve_vip: true,
          lia_access: true,
          confirmed: true,
          must_change_password: false,
          first_access_completed: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
        saveStoredUser(newUser);
      }

      // Atualiza também no Supabase Auth caso o usuário exista lá
      const supabaseUrl = cleanSupabaseUrl(process.env.VITE_SUPABASE_URL);
      const serviceKey = getSupabaseServiceRoleKey();
      if (supabaseUrl && serviceKey) {
        try {
          const origin = new URL(supabaseUrl).origin;
          const listRes = await fetch(`${origin}/auth/v1/admin/users`, {
            headers: { apikey: serviceKey, Authorization: `Bearer ${serviceKey}` }
          });
          if (listRes.ok) {
            const listData = await listRes.json();
            const supUser = (listData?.users || []).find((u: any) => (u.email || "").toLowerCase() === email);
            if (supUser) {
              await fetch(`${origin}/auth/v1/admin/users/${supUser.id}`, {
                method: "PUT",
                headers: {
                  apikey: serviceKey,
                  Authorization: `Bearer ${serviceKey}`,
                  "Content-Type": "application/json"
                },
                body: JSON.stringify({
                  password: newPassword,
                  email_confirm: true,
                  user_metadata: {
                    ...(supUser.user_metadata || {}),
                    must_change_password: false,
                    first_access_completed: true,
                    require_password_change: false
                  }
                })
              });
            }
          }
        } catch (supErr) {
          console.warn("[complete-first-access] Aviso ao sincronizar com Supabase:", supErr);
        }
      }

      return res.json({
        success: true,
        message: "Senha definitiva cadastrada com sucesso! Bem-vinda ao LEVE."
      });
    } catch (err: any) {
      console.error("[complete-first-access] Erro:", err);
      return res.status(500).json({ error: err?.message || "Erro ao atualizar senha." });
    }
  });

  // Consulta de entitlements por e-mail ou userId com fallback em cascata
  app.get("/api/user/entitlements", async (req, res) => {
    try {
      const email = (req.query.email as string || "").trim().toLowerCase();
      const userId = (req.query.userId as string || "").trim();

      if (!email && !userId) {
        return res.status(400).json({ error: "E-mail ou userId é obrigatório" });
      }

      // 0. Contas protegidas têm acesso VIP imediato e garantido sem bloqueios
      if (isProtectedAccount(email)) {
        return res.json({
          email,
          plan_name: "vip",
          leve_gratuito: false,
          "leve gratuito": false,
          leve_especial: false,
          "leve especial": false,
          leve_vip: true,
          "leve vip": true,
          lia_access: true,
          hotmart_status: "approved",
          source: "protected_account",
          must_change_password: false,
          first_access_completed: true
        });
      }

      // 1. Checar store local persistente
      const purchases = getStoredPurchases();
      const local = email ? purchases[email] : Object.values(purchases).find((p: any) => p.user_id === userId);

      // 2. Checar store central de usuários
      const users = getStoredUsers();
      const userEntry = email ? users[email] : Object.values(users).find((u: any) => u.id === userId);

      // 3. Checar Supabase Auth Admin user_metadata
      const supabaseUrl = cleanSupabaseUrl(process.env.VITE_SUPABASE_URL);
      const serviceKey = getSupabaseServiceRoleKey();
      let authUserMeta: any = null;

      if (supabaseUrl && serviceKey) {
        try {
          const origin = new URL(supabaseUrl).origin;
          if (userId) {
            const uRes = await fetch(`${origin}/auth/v1/admin/users/${userId}`, {
              headers: { apikey: serviceKey, Authorization: `Bearer ${serviceKey}` }
            });
            if (uRes.ok) {
              const uData = await uRes.json();
              authUserMeta = uData?.user_metadata;
            }
          } else if (email) {
            const listRes = await fetch(`${origin}/auth/v1/admin/users`, {
              headers: { apikey: serviceKey, Authorization: `Bearer ${serviceKey}` }
            });
            if (listRes.ok) {
              const listData = await listRes.json();
              const found = (listData?.users || []).find((u: any) => (u.email || "").toLowerCase() === email);
              if (found) {
                authUserMeta = found.user_metadata;
              }
            }
          }
        } catch (authErr) {
          console.warn("[/api/user/entitlements] Erro ao consultar Supabase Auth:", authErr);
        }
      }

      // 4. Determinar o plano ativo
      const isVip = 
        local?.leve_vip === true || 
        local?.plan_name === "vip" || 
        userEntry?.leve_vip === true ||
        userEntry?.plan === "vip" ||
        authUserMeta?.leve_vip === true || 
        authUserMeta?.plan === "vip" || 
        authUserMeta?.plan_name === "vip";

      const isSpecial = 
        !isVip && (
          local?.leve_especial === true || 
          local?.plan_name === "especial" || 
          userEntry?.leve_especial === true ||
          userEntry?.plan === "especial" ||
          authUserMeta?.leve_especial === true || 
          authUserMeta?.plan === "especial" || 
          authUserMeta?.plan_name === "especial"
        );

      const planName = isVip ? "vip" : (isSpecial ? "especial" : "gratuito");

      return res.json({
        email,
        plan_name: planName,
        leve_gratuito: !isVip && !isSpecial,
        "leve gratuito": !isVip && !isSpecial,
        leve_especial: isSpecial,
        "leve especial": isSpecial,
        leve_vip: isVip,
        "leve vip": isVip,
        lia_access: isVip,
        hotmart_status: isVip || isSpecial ? "approved" : "gratuito",
        source: isVip || isSpecial ? (local ? "purchase_store" : (userEntry ? "users_store" : "supabase_auth")) : "default"
      });
    } catch (err: any) {
      return res.status(500).json({ error: err.message || "Erro interno" });
    }
  });

  // ============================================================================
  // Multi-Device Cloud Sync Endpoints (Sincronização em tempo real entre dispositivos)
  // ============================================================================

  // 1. Streaming em tempo real via Server-Sent Events (SSE) para atualização instantânea (<100ms)
  app.get("/api/sync/events", (req, res) => {
    const email = (req.query.email as string || "").trim().toLowerCase();
    const userId = (req.query.userId as string || "").trim();
    const deviceId = (req.query.deviceId as string || "").trim();

    if (!email && !userId) {
      return res.status(400).json({ error: "E-mail ou ID de usuário é necessário para streaming." });
    }

    const accountKey = getSyncAccountKey(email, userId);

    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache, no-transform");
    res.setHeader("Connection", "keep-alive");
    res.setHeader("X-Accel-Buffering", "no");
    res.flushHeaders();

    const subId = `sub_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
    const subscriber: SSESubscriber = { id: subId, deviceId, res };

    if (!sseSubscribers.has(accountKey)) {
      sseSubscribers.set(accountKey, new Set());
    }
    sseSubscribers.get(accountKey)!.add(subscriber);

    // Confirmação de conexão para o cliente
    res.write(`event: connected\ndata: ${JSON.stringify({ ok: true, accountKey, subId, timestamp: Date.now() })}\n\n`);

    // Heartbeat a cada 20s para manter proxies e firewalls abertos
    const pingInterval = setInterval(() => {
      try {
        res.write(`event: ping\ndata: ${Date.now()}\n\n`);
      } catch {
        clearInterval(pingInterval);
      }
    }, 20000);

    req.on("close", () => {
      clearInterval(pingInterval);
      const subs = sseSubscribers.get(accountKey);
      if (subs) {
        subs.delete(subscriber);
        if (subs.size === 0) {
          sseSubscribers.delete(accountKey);
        }
      }
    });
  });

  // 2. Salva/Atualiza dados do usuário na nuvem (chamado a cada alteração com debounce ultra-rápido)
  app.post("/api/sync/push", (req, res) => {
    try {
      const email = (req.body?.email || "").trim().toLowerCase();
      const userId = (req.body?.userId || "").trim();
      const data = req.body?.data;
      const clientTimestamp = req.body?.clientTimestamp || Date.now();
      const deviceId = req.body?.deviceId;

      if (!email && !userId) {
        return res.status(400).json({ error: "E-mail ou ID de usuário é obrigatório para sincronização." });
      }

      if (!data || typeof data !== "object" || !data.user || typeof data.user !== "object") {
        return res.status(400).json({ error: "Estrutura de dados inválida para sincronização." });
      }

      const result = writeUserSyncPayload({
        email,
        userId,
        data,
        clientTimestamp,
        deviceId
      });

      if (!result.success) {
        return res.status(500).json({ error: "Falha ao gravar dados na nuvem." });
      }

      // Persistência em nuvem segura via Supabase Auth Admin (não depende de tabelas REST customizadas)
      saveUserSyncToSupabase(userId, email, data, result.updatedAt, result.version).catch(() => {});

      return res.json({
        success: true,
        timestamp: result.updatedAt,
        version: result.version,
        accountKey: result.accountKey,
        message: "Dados salvos e sincronizados para todos os seus dispositivos."
      });
    } catch (err: any) {
      console.error("[api/sync/push] Erro:", err);
      return res.status(500).json({ error: err.message || "Erro interno ao sincronizar" });
    }
  });

  // 3. Obtém os dados mais recentes na nuvem (chamado ao abrir o app, ao logar, ou quando há update)
  app.get("/api/sync/pull", async (req, res) => {
    try {
      const email = (req.query.email as string || "").trim().toLowerCase();
      const userId = (req.query.userId as string || "").trim();
      const since = Number(req.query.since || 0);

      if (!email && !userId) {
        return res.status(400).json({ error: "E-mail ou ID de usuário é necessário para carregar dados." });
      }

      let payload = readUserSyncPayload(email, userId);

      // Se não encontrou no disco local (ex: novo container Cloud Run ou outro aparelho), busca no Supabase Auth
      if (!payload) {
        const cloudData = await fetchUserSyncFromSupabase(email, userId);
        if (cloudData && cloudData.data) {
          writeUserSyncPayload({
            email: cloudData.email || email,
            userId: cloudData.userId || userId,
            data: cloudData.data,
            clientTimestamp: cloudData.updatedAt,
            deviceId: "supabase_restore"
          });
          payload = cloudData;
        }
      }

      if (!payload) {
        return res.json({
          hasUpdates: false,
          data: null,
          timestamp: 0,
          version: 0,
          message: "Nenhum dado na nuvem ainda para esta conta."
        });
      }

      if (since > 0 && payload.updatedAt <= since) {
        return res.json({
          hasUpdates: false,
          timestamp: payload.updatedAt,
          version: payload.version
        });
      }

      return res.json({
        hasUpdates: true,
        data: payload.data,
        timestamp: payload.updatedAt,
        version: payload.version,
        email: payload.email,
        userId: payload.userId
      });
    } catch (err: any) {
      console.error("[api/sync/pull] Erro:", err);
      return res.status(500).json({ error: err.message || "Erro interno ao carregar dados" });
    }
  });

  // 4. Polling ultraleve (<1ms) para verificar se outro dispositivo alterou algo recentemente
  app.get("/api/sync/poll", (req, res) => {
    try {
      const email = (req.query.email as string || "").trim().toLowerCase();
      const userId = (req.query.userId as string || "").trim();
      const since = Number(req.query.since || 0);

      if (!email && !userId) {
        return res.status(400).json({ error: "E-mail ou ID de usuário é necessário para verificação." });
      }

      const accountKey = getSyncAccountKey(email, userId);
      const cached = syncCache.get(accountKey) || (email ? syncCache.get(email) : undefined) || (userId ? syncCache.get(userId) : undefined);

      let updatedAt = 0;
      let version = 0;

      if (cached) {
        updatedAt = cached.updatedAt;
        version = cached.version;
      } else {
        const payload = readUserSyncPayload(email, userId);
        if (payload) {
          updatedAt = payload.updatedAt;
          version = payload.version;
        }
      }

      const hasUpdates = updatedAt > since;
      return res.json({
        hasUpdates,
        timestamp: updatedAt,
        version
      });
    } catch (err: any) {
      return res.status(500).json({ error: err.message || "Erro no polling" });
    }
  });

  // LEVIA Chat API endpoint (Gemini 3.8 Flash)
  app.post("/api/levia/chat", async (req, res) => {
    try {
      const { message, history, contextData } = req.body;

      if (!message || typeof message !== "string") {
        return res.status(400).json({ error: "Mensagem inválida" });
      }

      const ai = getAIClient();
      if (!ai) {
        // Retorna indicação para usar motor local
        return res.json({ fallbackToLocal: true, reason: "GEMINI_API_KEY não configurada" });
      }

      const todayStr = new Date().toISOString().split("T")[0];
      const treatment = contextData?.user?.treatmentPreference || "nao_informar";
      const userName = contextData?.user?.name || "";

      const systemInstruction = `Você é a LEVIA, a assistente pessoal de organização exclusiva do aplicativo LEVE.
Conceito principal: “Você fala. A LEVIA organiza.”
Propósito principal: “Você não precisa lembrar de tudo. O LEVE lembra por você.” e “Tire da cabeça. Coloque em ordem.”

Sua função é receber o que o usuário está pensando, falando ou precisa fazer em linguagem natural e ajudar a estruturar isso em organização prática dentro do LEVE:
- tarefas
- hábitos
- compromissos
- metas
- notas
- organização da rotina
- itens de Minha Vida (livros, filmes, séries, hobbies, lugares, sonhos)

PERSONALIDADE:
- Inteligente, organizada, prática, gentil, natural, objetiva e acolhedora sem ser exageradamente informal.
- Não fale como um robô.
- Não use constantemente "amigo" ou "amiga".
- Preferência de tratamento do usuário: "${treatment}". Nome: "${userName || ''}".
  * Se "feminino": use tratamento feminino natural quando aplicável (ex: "pronta", "bem-vinda"). Evite repetições exaustivas de "amiga".
  * Se "masculino": use tratamento masculino natural quando aplicável (ex: "pronto", "bem-vindo"). Evite repetições exaustivas de "amigo".
  * Se "neutro" ou "nao_informar": utilize formulações neutras, acolhedoras e diretas, chamando pelo nome (ex: "Tudo bem?", "Como posso ajudar?", "Tudo organizado por aqui!"). NUNCA use "amigo", "amiga" nem termos marcados de gênero.
- Não aja como terapeuta, psicóloga ou médica. Nunca diagnostique problemas de saúde ou prescreva remédios.
- Idioma: Sempre responda em Português do Brasil (PT-BR).

REGRA DE OURO - CONFIRMAÇÃO OBRIGATÓRIA:
A LEVIA NUNCA deve criar, editar ou excluir dados silenciosamente.
Antes de qualquer alteração, SEMPRE proponha as ações claramente e pergunte se o usuário quer que salve.
Exemplo:
"Entendi. Posso organizar assim:
• Pagar a conta de luz — amanhã
• Estudar para a faculdade — hoje à noite

Quer que eu salve?"

REGRA DE PRIORIDADES:
- NUNCA marque uma tarefa como prioridade automaticamente (mesmo que seja urgente, com prazo próximo ou importante).
- O campo "isPriority" nas tarefas criadas pela LEVIA DEVE SER SEMPRE false por padrão.
- Se identificar algo que parece ser de extrema importância ou urgência, pergunte no texto: "Quer marcar isso como prioridade?". NUNCA marque automaticamente.

Ações possíveis para propor:
1. TAREFAS (type: 'create_task' | 'complete_task'): título, data (YYYY-MM-DD), horário (HH:mm), prioridade ('low'|'medium'|'high'), isPriority (sempre false por padrão), categoria ('Trabalho'|'Estudos'|'Casa'|'Pessoal'|'Saúde'|'Financeiro')
2. HÁBITOS (type: 'create_habit'): nome, frequência, período do dia
3. METAS (type: 'create_goal'): nome, categoria, etapas
4. CONTAS (type: 'create_bill'): nome, valor, data de vencimento
5. MINHA VIDA (type: 'add_my_life_book' | 'add_my_life_movie' | 'add_my_life_series' | 'add_my_life_hobby' | 'add_my_life_place' | 'add_my_life_dream')

Data de referência de hoje: ${todayStr}.

Responda OBRIGATORIAMENTE em JSON válido com esta estrutura exata:
{
  "reply": "Texto da resposta acolhedora da LEVIA explicando o que entendeu e perguntando se pode salvar",
  "proposedActions": [
    {
      "id": "act-1",
      "type": "create_task",
      "title": "Pagar a conta de luz",
      "categoryBadge": "Tarefa",
      "details": {
        "date": "YYYY-MM-DD",
        "displayDate": "Amanhã",
        "time": "19:00",
        "priority": "medium",
        "isPriority": false,
        "category": "Financeiro"
      },
      "payload": {
        "title": "Pagar a conta de luz",
        "date": "YYYY-MM-DD",
        "priority": "medium",
        "isPriority": false,
        "category": "Financeiro"
      }
    }
  ]
}`;

      const response = await generateGeminiContentWithFallback(ai, {
        contents: [
          {
            role: "user",
            parts: [{ text: `Mensagem do usuário: "${message}"` }]
          }
        ],
        config: {
          systemInstruction,
          responseMimeType: "application/json",
        },
      });

      const responseText = response.text || "{}";
      try {
        const parsed = JSON.parse(responseText);
        return res.json(parsed);
      } catch (parseError) {
        return res.json({
          reply: responseText.replace(/```json/g, "").replace(/```/g, "").trim(),
          proposedActions: []
        });
      }
    } catch (err: any) {
      console.error("Erro na rota /api/levia/chat:", err);
      // Fallback gracioso para que o cliente use o motor local
      return res.json({ fallbackToLocal: true, error: err.message });
    }
  });

  // ============================================================================
  // Tirar da Cabeça API endpoint (Espaço de acolhimento e escuta compassiva)
  // ============================================================================
  app.post("/api/tirar-da-cabeca", async (req, res) => {
    try {
      const { text, treatmentPreference, userName } = req.body;
      if (!text || typeof text !== "string" || !text.trim()) {
        return res.status(400).json({ error: "Texto vazio" });
      }

      const ai = getAIClient();
      if (!ai) {
        return res.json({ fallbackToLocal: true });
      }

      const systemInstruction = `Você é o acolhedor espaço "Tirar da Cabeça" do aplicativo LEVE.
Propósito: A pessoa acabou de colocar para fora aquilo que está pesando na mente dela ("Você não precisa organizar. Apenas escreva.").

REGRAS RÍGIDAS E INVIOLÁVEIS:
1. NÃO transforme o conteúdo em tarefas, metas, hábitos, prioridades ou compromissos.
2. NÃO aja como terapeuta, psicólogo ou médico.
3. NÃO faça diagnósticos nem utilize termos clínicos (como "ansiedade patológica", "depressão", "burnout", "transtorno", etc.).
4. A linguagem deve transmitir acolhimento caloroso, leveza, respeito e alívio genuíno.
5. Preferência de tratamento do usuário: "${treatmentPreference || 'nao_informar'}". Nome do usuário: "${userName || ''}".
   - Se "feminino": use tratamento feminino natural quando adequado (ex: querida, acolhida). Evite repetições excessivas.
   - Se "masculino": use tratamento masculino natural quando adequado.
   - Se "neutro" ou "nao_informar": use linguagem neutra, calorosa e gentil sem marcar gênero.

Retorne OBRIGATORIAMENTE um objeto JSON com esta estrutura exata:
{
  "mensagem": "Uma mensagem curta, acolhedora, bonita e contextualizada ao que a pessoa desabafou. Deve trazer acolhimento e alívio imediato.",
  "sugestao": "Uma sugestão simples e prática que possa ajudar naquele exato momento (ex: respirar fundo, tomar uma água, escolher só 1 pequena coisa e deixar o restante para depois)."
}`;

      const response = await generateGeminiContentWithFallback(ai, {
        contents: [
          {
            role: "user",
            parts: [{ text: `O que está pesando:\n"${text.trim()}"` }]
          }
        ],
        config: {
          systemInstruction,
          temperature: 0.7,
          responseMimeType: "application/json"
        }
      });

      const raw = response.text?.trim() || "{}";
      try {
        const parsed = JSON.parse(raw);
        return res.json({
          success: true,
          mensagem: parsed.mensagem,
          sugestao: parsed.sugestao
        });
      } catch {
        return res.json({ fallbackToLocal: true });
      }
    } catch (err: any) {
      console.warn("Erro ao gerar reflexão de Tirar da Cabeça:", err);
      return res.json({ fallbackToLocal: true });
    }
  });

  // ============================================================================
  // Hotmart Webhook Handler (Endpoint alternativo / proxy para a Edge Function)
  // Versão: 2.0.0 (CLUB_FIRST_ACCESS, PURCHASE_APPROVED, REFUNDS, etc.)
  // ============================================================================
  app.post("/api/hotmart-webhook", async (req, res) => {
    try {
      const expectedHottok = (
        process.env.HOTTOK || 
        process.env.HOTMART_HOTTOK || 
        ""
      ).trim();

      const incomingHottok = (
        (req.headers["x-hotmart-hottok"] as string) ||
        (req.headers["hottok"] as string) ||
        (req.query.hottok as string) ||
        req.body?.hottok ||
        ""
      ).trim();

      if (expectedHottok && incomingHottok !== expectedHottok) {
        console.warn("[server hotmart-webhook] Hottok inválido");
        return res.status(401).json({ error: "Token Hottok inválido", status: "unauthorized" });
      }

      const body = req.body || {};
      const event = (body.event || body.event_type || "").toString().trim().toUpperCase();
      const data = body.data || body;

      const buyer = data.buyer || data.user || data.student || data.subscriber || {};
      const buyerEmail = (
        buyer.email || 
        data.email || 
        data.buyer_email || 
        ""
      ).toString().trim().toLowerCase();

      if (!buyerEmail) {
        return res.status(400).json({ error: "E-mail do comprador não encontrado" });
      }

      const purchase = data.purchase || {};
      const subscription = data.subscription || {};
      const product = data.product || {};

      const transactionId = (
        purchase.transaction ||
        data.transaction ||
        subscription.subscriber?.code ||
        body.id ||
        ""
      ).toString();

      const purchaseStatus = (
        purchase.status || 
        subscription.status || 
        data.status || 
        ""
      ).toString().trim().toUpperCase();

      const isApprovalEvent = 
        event === "CLUB_FIRST_ACCESS" ||
        event === "PURCHASE_APPROVED" ||
        event === "PURCHASE_COMPLETE" ||
        event === "SUBSCRIPTION_PURCHASE_APPROVED" ||
        event === "SWITCH_PLAN" ||
        purchaseStatus === "APPROVED" ||
        purchaseStatus === "COMPLETE" ||
        purchaseStatus === "ACTIVE";

      const isRevocationEvent =
        event === "PURCHASE_REFUNDED" ||
        event === "PURCHASE_CHARGEBACK" ||
        event === "PURCHASE_CANCELLED" ||
        event === "PURCHASE_EXPIRED" ||
        event === "SUBSCRIPTION_CANCELLATION" ||
        event === "SUBSCRIPTION_EXPIRED" ||
        event === "DISPUTE" ||
        purchaseStatus === "REFUNDED" ||
        purchaseStatus === "CHARGEBACK" ||
        purchaseStatus === "CANCELLED" ||
        purchaseStatus === "EXPIRED";

      // Códigos e Ofertas Oficiais da Hotmart
      // 1. Upgrade LEVIA: 0vzkb290 (R$ 16,00) -> Concede VIP
      // 2. LEVE VIP Direto: foybxnsq (R$ 65,90) -> Concede VIP
      // 3. LEVE Especial: nve7cj26 (R$ 49,90) -> Concede Especial
      const rawOfferCode = (
        purchase.offer?.code ||
        data.offer?.code ||
        purchase.offer_code ||
        data.offer_code ||
        body.offer_code ||
        ""
      ).toString().trim().toLowerCase();

      const searchString = [
        rawOfferCode,
        purchase.offer?.name,
        subscription.plan?.name,
        product.name,
        data.plan?.name,
        data.offer?.name,
        data.product_name,
        data.plan_name,
        purchase.offer?.code
      ].filter(Boolean).join(" ").toLowerCase();

      const priceValue = Number(
        purchase.price?.value ?? 
        data.price?.value ?? 
        purchase.price ?? 
        0
      );

      // 1. Identificação da oferta de UPGRADE (R$ 16,00)
      // Concede VIP a partir do LEVE Especial. Identificado pelo código '0vzkb290' ou nome da oferta
      const isUpgradeOffer = 
        rawOfferCode === "0vzkb290" ||
        searchString.includes("0vzkb290") ||
        (searchString.includes("upgrade") && searchString.includes("levia")) ||
        (searchString.includes("upgrade") && searchString.includes("vip")) ||
        (searchString.includes("upgrade") && priceValue >= 10 && priceValue <= 25);

      // 2. Identificação da oferta VIP DIRETO (R$ 65,90)
      const isDirectVipOffer =
        rawOfferCode === "foybxnsq" ||
        searchString.includes("foybxnsq") ||
        (!isUpgradeOffer && (
          searchString.includes("vip") || 
          searchString.includes("completo") || 
          priceValue >= 59
        ));

      // Tanto a aprovação do Upgrade quanto do VIP Direto concedem o plano LEVE VIP
      const isVipPurchase = isUpgradeOffer || isDirectVipOffer;

      // 3. Identificação do LEVE ESPECIAL (R$ 49,90)
      const isSpecialPurchase = 
        !isVipPurchase && (
          rawOfferCode === "nve7cj26" ||
          searchString.includes("nve7cj26") ||
          searchString.includes("especial") || 
          searchString.includes("special") || 
          (priceValue >= 35 && priceValue < 59)
        );

      let entitlementUpdate: Record<string, any> = {
        plan_name: "especial",
        leve_gratuito: false,
        "leve gratuito": false,
        leve_especial: true,
        leve_vip: false,
        lia_access: false,
        hotmart_status: "approved",
        hotmart_transaction_id: transactionId
      };

      if (isRevocationEvent && !isApprovalEvent) {
        entitlementUpdate = {
          plan_name: "gratuito",
          leve_gratuito: true,
          "leve gratuito": true,
          leve_especial: false,
          leve_vip: false,
          lia_access: false,
          hotmart_status: purchaseStatus ? purchaseStatus.toLowerCase() : "revoked",
          hotmart_transaction_id: transactionId
        };
      } else if (isApprovalEvent) {
        if (isVipPurchase) {
          // Aprovado no VIP ou no Upgrade de R$ 16 -> Concede VIP total
          entitlementUpdate = {
            plan_name: "vip",
            leve_gratuito: false,
            "leve gratuito": false,
            leve_especial: false,
            leve_vip: true,
            lia_access: true,
            hotmart_status: "approved",
            hotmart_transaction_id: transactionId
          };
        } else {
          // Aprovado no LEVE Especial -> Todas as áreas liberadas, LEVIA bloqueada
          entitlementUpdate = {
            plan_name: "especial",
            leve_gratuito: false,
            "leve gratuito": false,
            leve_especial: true,
            leve_vip: false,
            lia_access: false,
            hotmart_status: "approved",
            hotmart_transaction_id: transactionId
          };
        }
      }

      // 1. Salvar no store persistente local imediatamente (garante disponibilidade 100% imediata)
      saveStoredPurchase(buyerEmail, entitlementUpdate);

      // 2. Se chaves do Supabase estiverem configuradas, sincroniza no Auth e na tabela
      const supabaseUrl = cleanSupabaseUrl(process.env.VITE_SUPABASE_URL);
      const supabaseServiceKey = getSupabaseServiceRoleKey();

      const buyerName = buyer.name || data.name || buyer.first_name || "";
      let authSyncResult: any = null;

      if (supabaseUrl && supabaseServiceKey) {
        // Cria usuário no Supabase Auth ou atualiza suas permissões e confirma e-mail imediatamente
        authSyncResult = await syncPurchaseWithSupabaseAuth(
          supabaseUrl, 
          supabaseServiceKey, 
          buyerEmail, 
          buyerName, 
          entitlementUpdate
        );

        // Também tenta registrar na tabela user_entitlements caso as permissões do banco estejam liberadas
        try {
          const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
            auth: { persistSession: false, autoRefreshToken: false }
          });

          const userId = authSyncResult?.userId || null;
          let existingId: string | null = null;
          try {
            let query = supabaseAdmin.from("user_entitlements").select("id, user_id, email, buyer_email");
            if (userId) {
              query = query.or(`user_id.eq.${userId},email.ilike.${buyerEmail},buyer_email.ilike.${buyerEmail}`);
            } else {
              query = query.or(`email.ilike.${buyerEmail},buyer_email.ilike.${buyerEmail}`);
            }
            const { data: rows } = await query;
            if (rows && rows.length > 0) existingId = rows[0].id;
          } catch {}

          if (existingId) {
            await supabaseAdmin
              .from("user_entitlements")
              .update({
                ...(userId ? { user_id: userId } : {}),
                buyer_name: buyerName || undefined,
                buyer_email: buyerEmail,
                email: buyerEmail,
                ...entitlementUpdate,
                updated_at: new Date().toISOString()
              })
              .eq("id", existingId);
          } else {
            await supabaseAdmin
              .from("user_entitlements")
              .insert({
                user_id: userId,
                buyer_name: buyerName || undefined,
                buyer_email: buyerEmail,
                email: buyerEmail,
                ...entitlementUpdate,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
              });
          }
        } catch (dbErr) {
          console.warn("[server hotmart-webhook] Aviso: tabela user_entitlements não pôde ser atualizada diretamente (Auth e Store local salvos):", dbErr);
        }
      }

      console.log(`[server hotmart-webhook] Compra processada com sucesso: ${buyerEmail} -> Plano ${entitlementUpdate.plan_name}`);

      return res.json({
        status: "success",
        event,
        email: buyerEmail,
        plan: entitlementUpdate.plan_name,
        entitlements: entitlementUpdate,
        authSync: authSyncResult
      });
    } catch (err: any) {
      console.error("[server hotmart-webhook] Erro:", err);
      return res.status(500).json({ error: err.message || "Erro interno" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
