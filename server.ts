import express from "express";
import path from "path";
import fs from "fs";
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
}) {
  const subs = sseSubscribers.get(accountKey);
  if (!subs || subs.size === 0) return;

  const eventPayload = JSON.stringify({
    timestamp: payload.timestamp,
    version: payload.version,
    sourceDeviceId: payload.sourceDeviceId || "",
    data: payload.data
  });

  for (const sub of Array.from(subs)) {
    try {
      sub.res.write(`event: sync-update\ndata: ${eventPayload}\n\n`);
    } catch {
      subs.delete(sub);
    }
  }
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

    const updatedAt = Date.now();
    const storedObject = {
      email: payload.email ? payload.email.trim().toLowerCase() : (existing?.email || ""),
      userId: payload.userId || existing?.userId || "",
      data: payload.data,
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

    // Difunde imediatamente via SSE para todos os outros aparelhos conectados nesta mesma conta
    broadcastSyncUpdate(accountKey, {
      timestamp: updatedAt,
      version: currentVersion,
      sourceDeviceId: payload.deviceId,
      data: payload.data
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

  app.use(express.json({ limit: "5mb" }));

  // Health check
  app.get("/api/health", (_req, res) => {
    res.json({ status: "ok", service: "LEVE" });
  });

  // Supabase public configuration endpoint (detects and fixes inverted keys safely)
  app.get("/api/auth/config", (_req, res) => {
    const supabaseUrl = cleanSupabaseUrl(process.env.VITE_SUPABASE_URL);
    const kAnon = (process.env.VITE_SUPABASE_ANON_KEY || "").trim();
    const kService = (process.env.SUPABASE_SERVICE_ROLE_KEY || "").trim();

    // Determine the true publishable / anon key
    let publishableKey = "";
    if (kAnon.startsWith("sb_publishable_")) {
      publishableKey = kAnon;
    } else if (kService.startsWith("sb_publishable_")) {
      publishableKey = kService;
    } else if (kAnon) {
      publishableKey = kAnon;
    } else if (kService) {
      publishableKey = kService;
    }

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

      const supabaseUrl = cleanSupabaseUrl(process.env.VITE_SUPABASE_URL);
      const serviceKey = (process.env.SUPABASE_SERVICE_ROLE_KEY || "").trim();

      if (!serviceKey) {
        return res.status(500).json({ error: "Chave de serviço não configurada no servidor" });
      }

      const origin = new URL(supabaseUrl).origin;
      const listRes = await fetch(`${origin}/auth/v1/admin/users`, {
        headers: {
          apikey: serviceKey,
          Authorization: `Bearer ${serviceKey}`
        }
      });

      if (!listRes.ok) {
        const errText = await listRes.text();
        console.warn("[confirm-user] Erro ao listar usuários:", errText);
        return res.status(listRes.status).json({ error: "Falha ao consultar usuário no banco de dados" });
      }

      const listData = await listRes.json();
      const users: any[] = listData?.users || [];
      const user = users.find((u: any) => (u.email || "").toLowerCase() === email);

      if (!user) {
        return res.status(404).json({ error: "Nenhum cadastro encontrado com este e-mail" });
      }

      // Check if already confirmed
      if (user.email_confirmed_at) {
        return res.json({ success: true, message: "E-mail já está confirmado e ativo!", alreadyConfirmed: true });
      }

      // Update user to confirm email immediately
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
        const errText = await updateRes.text();
        console.warn("[confirm-user] Falha ao atualizar usuário:", errText);
        return res.status(500).json({ error: "Falha ao liberar e-mail do usuário" });
      }

      console.log(`[confirm-user] Usuário ${email} ativado com sucesso.`);
      return res.json({ success: true, message: "E-mail confirmado com sucesso! Você já pode entrar." });
    } catch (err: any) {
      console.error("[confirm-user] Exceção:", err);
      return res.status(500).json({ error: err?.message || "Erro interno ao confirmar usuário" });
    }
  });

  // Resend or generate confirmation link
  app.post("/api/auth/resend-confirmation", async (req, res) => {
    try {
      const email = (req.body?.email || "").trim().toLowerCase();
      if (!email) {
        return res.status(400).json({ error: "E-mail não fornecido" });
      }

      const supabaseUrl = cleanSupabaseUrl(process.env.VITE_SUPABASE_URL);
      const serviceKey = (process.env.SUPABASE_SERVICE_ROLE_KEY || "").trim();

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
      const serviceKey = (process.env.SUPABASE_SERVICE_ROLE_KEY || "").trim();
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
        return res.status(500).json({ error: "Erro ao ativar senha: " + errText });
      }

      return res.json({ success: true, message: "Senha cadastrada e acesso liberado com sucesso!" });
    } catch (err: any) {
      console.error("[claim-account] Erro:", err);
      return res.status(500).json({ error: err?.message || "Erro interno ao ativar conta" });
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

      // 1. Checar store local persistente
      const purchases = getStoredPurchases();
      const local = email ? purchases[email] : Object.values(purchases).find((p: any) => p.user_id === userId);

      // 2. Checar Supabase Auth Admin user_metadata
      const supabaseUrl = cleanSupabaseUrl(process.env.VITE_SUPABASE_URL);
      const serviceKey = (process.env.SUPABASE_SERVICE_ROLE_KEY || "").trim();
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

      // 3. Determinar o plano ativo
      const isVip = 
        local?.leve_vip === true || 
        local?.plan_name === "vip" || 
        authUserMeta?.leve_vip === true || 
        authUserMeta?.plan === "vip" || 
        authUserMeta?.plan_name === "vip";

      const isSpecial = 
        !isVip && (
          local?.leve_especial === true || 
          local?.plan_name === "especial" || 
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
        source: isVip || isSpecial ? (local ? "purchase_store" : "supabase_auth") : "default"
      });
    } catch (err: any) {
      return res.status(500).json({ error: err.message || "Erro interno" });
    }
  });

  // Liberação manual administrativa de cliente por e-mail
  app.post("/api/admin/manual-grant", async (req, res) => {
    try {
      const email = (req.body?.email || "").trim().toLowerCase();
      const plan = (req.body?.plan || "especial").trim().toLowerCase();
      const name = (req.body?.name || "").trim();

      if (!email) {
        return res.status(400).json({ error: "E-mail é obrigatório" });
      }

      const isVip = plan === "vip";
      const isSpecial = plan === "especial" || plan === "special";
      const isGratuito = !isVip && !isSpecial;

      const entitlementUpdate = {
        plan_name: isVip ? "vip" : (isSpecial ? "especial" : "gratuito"),
        leve_gratuito: isGratuito,
        "leve gratuito": isGratuito,
        leve_especial: isSpecial,
        "leve especial": isSpecial,
        leve_vip: isVip,
        "leve vip": isVip,
        lia_access: isVip,
        hotmart_status: isGratuito ? "gratuito" : "approved",
        hotmart_transaction_id: "MANUAL-" + Date.now()
      };

      saveStoredPurchase(email, entitlementUpdate);

      const supabaseUrl = cleanSupabaseUrl(process.env.VITE_SUPABASE_URL);
      const serviceKey = (process.env.SUPABASE_SERVICE_ROLE_KEY || "").trim();

      let syncResult = null;
      if (supabaseUrl && serviceKey) {
        syncResult = await syncPurchaseWithSupabaseAuth(supabaseUrl, serviceKey, email, name, entitlementUpdate);
        try {
          const supabaseAdmin = createClient(supabaseUrl, serviceKey, {
            auth: { persistSession: false, autoRefreshToken: false }
          });
          await supabaseAdmin.from("user_entitlements").upsert({
            email,
            ...entitlementUpdate,
            updated_at: new Date().toISOString()
          });
        } catch {}
      }

      return res.json({
        success: true,
        email,
        plan: entitlementUpdate.plan_name,
        entitlements: entitlementUpdate,
        syncResult
      });
    } catch (err: any) {
      return res.status(500).json({ error: err.message || "Erro interno" });
    }
  });

  // Status e diagnóstico do webhook Hotmart
  app.get("/api/admin/hotmart-status", (_req, res) => {
    const purchases = getStoredPurchases();
    const list = Object.values(purchases);
    const webhookUrl = "https://ais-pre-3jo2rpsiwzwzzqnatbx4af-827551377597.us-east1.run.app/api/hotmart-webhook";
    const hottokConfigured = Boolean(process.env.HOTTOK || process.env.HOTMART_HOTTOK);

    res.json({
      status: "online",
      webhookUrl,
      hottokConfigured,
      totalPurchasesStored: list.length,
      recentPurchases: list.slice(-10).reverse()
    });
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

      // Backup assíncrono em segundo plano para Supabase se configurado
      const supabaseUrl = cleanSupabaseUrl(process.env.VITE_SUPABASE_URL);
      const serviceKey = (process.env.SUPABASE_SERVICE_ROLE_KEY || "").trim();
      if (supabaseUrl && serviceKey && userId) {
        (async () => {
          try {
            const origin = new URL(supabaseUrl).origin;
            await fetch(`${origin}/rest/v1/leve_user_data`, {
              method: "POST",
              headers: {
                apikey: serviceKey,
                Authorization: `Bearer ${serviceKey}`,
                "Content-Type": "application/json",
                "Prefer": "resolution=merge-duplicates"
              },
              body: JSON.stringify({
                user_id: userId,
                data: data,
                updated_at: new Date().toISOString()
              })
            });
          } catch {}
        })();
      }

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

      // Se não encontrou no disco local, tenta buscar no Supabase como backup
      if (!payload) {
        const supabaseUrl = cleanSupabaseUrl(process.env.VITE_SUPABASE_URL);
        const serviceKey = (process.env.SUPABASE_SERVICE_ROLE_KEY || "").trim();
        if (supabaseUrl && serviceKey && userId) {
          try {
            const origin = new URL(supabaseUrl).origin;
            const supaRes = await fetch(`${origin}/rest/v1/leve_user_data?user_id=eq.${userId}&select=*`, {
              headers: {
                apikey: serviceKey,
                Authorization: `Bearer ${serviceKey}`
              }
            });
            if (supaRes.ok) {
              const rows = await supaRes.json();
              if (Array.isArray(rows) && rows.length > 0 && rows[0]?.data) {
                // Restaura para o disco local para acessos futuros instantâneos
                writeUserSyncPayload({
                  email,
                  userId,
                  data: rows[0].data,
                  clientTimestamp: new Date(rows[0].updated_at || Date.now()).getTime(),
                  deviceId: "supabase_restore"
                });
                payload = {
                  data: rows[0].data,
                  updatedAt: new Date(rows[0].updated_at || Date.now()).getTime(),
                  version: 1,
                  email,
                  userId
                };
              }
            }
          } catch {}
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
      const kAnon = (process.env.VITE_SUPABASE_ANON_KEY || "").trim();
      const kService = (process.env.SUPABASE_SERVICE_ROLE_KEY || "").trim();
      let supabaseServiceKey = "";
      if (kService.startsWith("sb_secret_")) {
        supabaseServiceKey = kService;
      } else if (kAnon.startsWith("sb_secret_")) {
        supabaseServiceKey = kAnon;
      } else {
        supabaseServiceKey = kService || kAnon;
      }

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
