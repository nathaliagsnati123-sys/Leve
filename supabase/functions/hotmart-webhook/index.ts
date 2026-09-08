// ============================================================================
// Supabase Edge Function: hotmart-webhook
// Versão Hotmart Webhook: 2.0.0
// Eventos suportados: CLUB_FIRST_ACCESS, PURCHASE_APPROVED, PURCHASE_COMPLETE,
//                     SUBSCRIPTION_PURCHASE_APPROVED, SWITCH_PLAN,
//                     PURCHASE_REFUNDED, PURCHASE_CHARGEBACK, PURCHASE_CANCELLED,
//                     PURCHASE_EXPIRED, SUBSCRIPTION_CANCELLATION
// ============================================================================

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-hotmart-hottok, hottok",
  "Access-Control-Allow-Methods": "POST, GET, OPTIONS"
};

serve(async (req: Request) => {
  // CORS Preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);

    // 1. Obter variáveis de ambiente seguras do Supabase
    const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
    const supabaseServiceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
    const expectedHottok = (
      Deno.env.get("HOTTOK") || 
      Deno.env.get("HOTMART_HOTTOK") || 
      ""
    ).trim();

    if (!supabaseUrl || !supabaseServiceRoleKey) {
      console.error("[hotmart-webhook] Variáveis SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY ausentes");
      return new Response(
        JSON.stringify({ error: "Configuração do servidor incompleta" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false }
    });

    // 2. Parsear corpo da requisição (JSON ou Form-Data)
    let body: any = {};
    const contentType = req.headers.get("content-type") || "";

    if (contentType.includes("application/json")) {
      body = await req.json();
    } else if (contentType.includes("application/x-www-form-urlencoded") || contentType.includes("multipart/form-data")) {
      const formData = await req.formData();
      const obj: Record<string, any> = {};
      formData.forEach((value, key) => {
        obj[key] = value;
      });
      body = obj;
    } else {
      try {
        const text = await req.text();
        body = JSON.parse(text);
      } catch {
        body = {};
      }
    }

    // 3. Validação do Hottok (Segurança)
    const incomingHottok = (
      req.headers.get("x-hotmart-hottok") ||
      req.headers.get("hottok") ||
      url.searchParams.get("hottok") ||
      body.hottok ||
      ""
    ).trim();

    if (expectedHottok && incomingHottok !== expectedHottok) {
      console.warn("[hotmart-webhook] Hottok inválido ou não fornecido");
      return new Response(
        JSON.stringify({ error: "Token Hottok inválido", status: "unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 4. Extração de informações do evento Hotmart v2.0.0
    const event = (body.event || body.event_type || "").toString().trim().toUpperCase();
    const data = body.data || body;

    console.log(`[hotmart-webhook] Recebido evento Hotmart v2: ${event}`);

    // Extrair dados do comprador (suporta buyer, user, student, subscriber)
    const buyer = data.buyer || data.user || data.student || data.subscriber || {};
    const buyerEmail = (
      buyer.email || 
      data.email || 
      data.buyer_email || 
      ""
    ).toString().trim().toLowerCase();

    const buyerName = buyer.name || data.name || "";

    if (!buyerEmail) {
      console.warn("[hotmart-webhook] E-mail do comprador não encontrado no payload");
      return new Response(
        JSON.stringify({ error: "E-mail do comprador não encontrado", status: "ignored" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Extrair dados da compra e da transação
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

    // 5. Determinar se é APROVAÇÃO (concessão) ou REVOGAÇÃO (cancelamento/reembolso)
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

    // 6. Identificar corretamente se é Especial, VIP Direto ou Upgrade para VIP
    // Códigos e Ofertas Oficiais da Hotmart:
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

    // Texto consolidado para análise de plano
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

    // Valor financeiro
    const priceValue = Number(
      purchase.price?.value ?? 
      data.price?.value ?? 
      purchase.price ?? 
      0
    );

    // 1. Identificação da oferta de UPGRADE (R$ 16,00 - Especial para VIP)
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

    // Preparar objeto de atualização dos entitlements
    let entitlementUpdate: {
      plan_name: string;
      leve_gratuito: boolean;
      leve_especial: boolean;
      leve_vip: boolean;
      lia_access: boolean;
      hotmart_status: string;
      hotmart_transaction_id: string;
    };

    if (isRevocationEvent && !isApprovalEvent) {
      console.log(`[hotmart-webhook] Revogando acesso de ${buyerEmail} (evento: ${event}, status: ${purchaseStatus})`);
      entitlementUpdate = {
        plan_name: "gratuito",
        leve_gratuito: true,
        leve_especial: false,
        leve_vip: false,
        lia_access: false,
        hotmart_status: purchaseStatus ? purchaseStatus.toLowerCase() : "revoked",
        hotmart_transaction_id: transactionId
      };
    } else if (isApprovalEvent) {
      if (isVipPurchase) {
        console.log(`[hotmart-webhook] Liberando LEVE VIP para ${buyerEmail} (transação: ${transactionId})`);
        entitlementUpdate = {
          plan_name: "vip",
          leve_gratuito: false,
          leve_especial: false,
          leve_vip: true,
          lia_access: true,
          hotmart_status: "approved",
          hotmart_transaction_id: transactionId
        };
      } else if (isSpecialPurchase) {
        console.log(`[hotmart-webhook] Liberando LEVE Especial para ${buyerEmail} (transação: ${transactionId})`);
        entitlementUpdate = {
          plan_name: "especial",
          leve_gratuito: false,
          leve_especial: true,
          leve_vip: false,
          lia_access: false,
          hotmart_status: "approved",
          hotmart_transaction_id: transactionId
        };
      } else {
        // Se for CLUB_FIRST_ACCESS sem produto especificado ou plano não detectado,
        // padrão seguro: Especial (nunca VIP por engano) ou verificar se é VIP por valor
        console.warn(`[hotmart-webhook] Produto não claramente identificado para ${buyerEmail}. Detalhes: text="${searchString}", price=${priceValue}`);
        entitlementUpdate = {
          plan_name: "especial",
          leve_gratuito: false,
          leve_especial: true,
          leve_vip: false,
          lia_access: false,
          hotmart_status: "approved",
          hotmart_transaction_id: transactionId
        };
      }
    } else {
      console.log(`[hotmart-webhook] Evento ignorado ou não conclusivo: ${event} para ${buyerEmail}`);
      return new Response(
        JSON.stringify({ status: "ignored", message: `Evento ${event} não altera permissões` }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 7. Localizar usuário no Supabase Auth por e-mail
    let userId: string | null = null;
    try {
      const { data: listData } = await supabaseAdmin.auth.admin.listUsers();
      const matchedUser = listData?.users?.find(
        (u) => u.email?.toLowerCase() === buyerEmail
      );
      if (matchedUser) {
        userId = matchedUser.id;
      }
    } catch (userErr) {
      console.warn("[hotmart-webhook] Erro ao listar auth.users:", userErr);
    }

    // 8. Buscar se já existe registro em user_entitlements por email ou user_id
    let existingRowId: string | null = null;
    try {
      let query = supabaseAdmin
        .from("user_entitlements")
        .select("id, user_id, email");

      if (userId) {
        query = query.or(`user_id.eq.${userId},email.ilike.${buyerEmail}`);
      } else {
        query = query.ilike("email", buyerEmail);
      }

      const { data: rows, error: selectErr } = await query;
      if (!selectErr && rows && rows.length > 0) {
        existingRowId = rows[0].id;
      }
    } catch (findErr) {
      console.warn("[hotmart-webhook] Erro ao buscar user_entitlements:", findErr);
    }

    // 9. Atualizar ou inserir na tabela user_entitlements
    if (existingRowId) {
      const { error: updateErr } = await supabaseAdmin
        .from("user_entitlements")
        .update({
          ...(userId ? { user_id: userId } : {}),
          email: buyerEmail,
          ...entitlementUpdate,
          updated_at: new Date().toISOString()
        })
        .eq("id", existingRowId);

      if (updateErr) {
        console.error("[hotmart-webhook] Erro no update de user_entitlements:", updateErr);
        throw updateErr;
      }
      console.log(`[hotmart-webhook] user_entitlements atualizado com sucesso para ${buyerEmail}`);
    } else {
      const { error: insertErr } = await supabaseAdmin
        .from("user_entitlements")
        .insert({
          user_id: userId,
          email: buyerEmail,
          ...entitlementUpdate,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });

      if (insertErr) {
        console.error("[hotmart-webhook] Erro no insert de user_entitlements:", insertErr);
        throw insertErr;
      }
      console.log(`[hotmart-webhook] Novo registro user_entitlements inserido com sucesso para ${buyerEmail}`);
    }

    return new Response(
      JSON.stringify({
        status: "success",
        event,
        email: buyerEmail,
        plan: entitlementUpdate.plan_name,
        entitlements: {
          leve_gratuito: entitlementUpdate.leve_gratuito,
          leve_especial: entitlementUpdate.leve_especial,
          leve_vip: entitlementUpdate.leve_vip,
          lia_access: entitlementUpdate.lia_access
        }
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err: any) {
    console.error("[hotmart-webhook] Exceção geral:", err);
    return new Response(
      JSON.stringify({ error: err.message || "Erro interno no processamento do webhook" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
