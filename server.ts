import express from "express";
import path from "path";
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
    const supabaseUrl = (process.env.VITE_SUPABASE_URL || "https://ozzlnqlhrythvjdrdgwe.supabase.co").trim();
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

      // Se chave de serviço estiver disponível, sincroniza com o banco
      const supabaseUrl = process.env.VITE_SUPABASE_URL || "https://ozzlnqlhrythvjdrdgwe.supabase.co";
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

      if (supabaseUrl && supabaseServiceKey) {
        const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
          auth: { persistSession: false, autoRefreshToken: false }
        });

        // Buscar usuário em auth.users
        let userId: string | null = null;
        try {
          const { data: listData } = await supabaseAdmin.auth.admin.listUsers();
          const matched = listData?.users?.find((u) => u.email?.toLowerCase() === buyerEmail);
          if (matched) userId = matched.id;
        } catch {}

        // Buscar registro em user_entitlements
        let existingId: string | null = null;
        try {
          let query = supabaseAdmin.from("user_entitlements").select("id, user_id, email");
          if (userId) {
            query = query.or(`user_id.eq.${userId},email.ilike.${buyerEmail}`);
          } else {
            query = query.ilike("email", buyerEmail);
          }
          const { data: rows } = await query;
          if (rows && rows.length > 0) existingId = rows[0].id;
        } catch {}

        if (existingId) {
          await supabaseAdmin
            .from("user_entitlements")
            .update({
              ...(userId ? { user_id: userId } : {}),
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
              email: buyerEmail,
              ...entitlementUpdate,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            });
        }
      }

      return res.json({
        status: "success",
        event,
        email: buyerEmail,
        plan: entitlementUpdate.plan_name,
        entitlements: entitlementUpdate
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
