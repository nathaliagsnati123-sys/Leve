// Supabase Edge Function: hotmart-webhook
// Fluxo: Hotmart -> Supabase -> user_entitlements

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-hotmart-hottok, hottok",
  "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
};

serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const url = new URL(req.url);
    const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
    const supabaseServiceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
    const expectedHottok = (Deno.env.get("HOTTOK") || Deno.env.get("HOTMART_HOTTOK") || "").trim();

    if (!supabaseUrl || !supabaseServiceRoleKey) {
      return new Response(JSON.stringify({ error: "Configuração do servidor incompleta" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false }
    });

    let body: any = {};
    const contentType = req.headers.get("content-type") || "";
    if (contentType.includes("application/json")) {
      body = await req.json();
    } else if (contentType.includes("application/x-www-form-urlencoded") || contentType.includes("multipart/form-data")) {
      const formData = await req.formData();
      const obj: Record<string, any> = {};
      formData.forEach((value, key) => { obj[key] = value; });
      body = obj;
    } else {
      try { body = JSON.parse(await req.text()); } catch { body = {}; }
    }

    const incomingHottok = (
      req.headers.get("x-hotmart-hottok") ||
      req.headers.get("hottok") ||
      url.searchParams.get("hottok") ||
      body.hottok || ""
    ).trim();

    if (expectedHottok && incomingHottok !== expectedHottok) {
      return new Response(JSON.stringify({ error: "Token Hottok inválido", status: "unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    const event = (body.event || body.event_type || "").toString().trim().toUpperCase();
    const data = body.data || body;
    const buyer = data.buyer || data.user || data.student || data.subscriber || {};
    const buyerEmail = (buyer.email || data.email || data.buyer_email || "").toString().trim().toLowerCase();
    const buyerName = (buyer.name || data.name || data.buyer_name || buyer.full_name || "").toString().trim();

    if (!buyerEmail) {
      return new Response(JSON.stringify({ error: "E-mail do comprador não encontrado", status: "ignored" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    const purchase = data.purchase || {};
    const subscription = data.subscription || {};
    const product = data.product || {};

    const transactionId = (
      purchase.transaction || data.transaction || subscription.subscriber?.code || body.id || ""
    ).toString();

    const purchaseStatus = (
      purchase.status || subscription.status || data.status || ""
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

    const rawOfferCode = (
      purchase.offer?.code ||
      data.offer?.code ||
      purchase.offer_code ||
      data.offer_code ||
      body.offer_code || ""
    ).toString().trim().toLowerCase();

    const searchString = [
      rawOfferCode,
      purchase.offer?.name,
      subscription.plan?.name,
      product.name,
      data.plan?.name,
      data.offer?.name,
      data.product_name,
      data.plan_name
    ].filter(Boolean).join(" ").toLowerCase();

    // Mapeamento exato dos códigos de oferta do LEVE:
    // - Upgrade Especial -> VIP: 0vzkb290
    // - VIP direto: foybxnsq
    // - Especial: nve7cj26
    const isUpgradeOffer = rawOfferCode === "0vzkb290" || searchString.includes("0vzkb290");
    const isDirectVipOffer = rawOfferCode === "foybxnsq" || searchString.includes("foybxnsq");
    const isVipPurchase = isUpgradeOffer || isDirectVipOffer || searchString.includes("vip");

    const isSpecialPurchase =
      !isVipPurchase && (
        rawOfferCode === "nve7cj26" ||
        searchString.includes("nve7cj26") ||
        searchString.includes("especial")
      );

    interface EntitlementValues {
      "leve gratuito": boolean;
      leve_especial: boolean;
      leve_vip: boolean;
      lia_access: boolean;
      hotmart_status: string;
      hotmart_transaction_id: string;
    }

    let entitlementValues: EntitlementValues;
    let planName: "gratuito" | "especial" | "vip";

    if (isRevocationEvent && !isApprovalEvent) {
      // Compra cancelada/reembolsada
      planName = "gratuito";
      entitlementValues = {
        "leve gratuito": true,
        leve_especial: false,
        leve_vip: false,
        lia_access: false,
        hotmart_status: purchaseStatus ? purchaseStatus.toLowerCase() : "revoked",
        hotmart_transaction_id: transactionId
      };
    } else if (isApprovalEvent) {
      if (isVipPurchase) {
        // VIP ou Upgrade Especial -> VIP (0vzkb290 / foybxnsq)
        planName = "vip";
        entitlementValues = {
          "leve gratuito": false,
          leve_especial: false,
          leve_vip: true,
          lia_access: true,
          hotmart_status: "approved",
          hotmart_transaction_id: transactionId
        };
      } else if (isSpecialPurchase) {
        // Especial (nve7cj26)
        planName = "especial";
        entitlementValues = {
          "leve gratuito": false,
          leve_especial: true,
          leve_vip: false,
          lia_access: false,
          hotmart_status: "approved",
          hotmart_transaction_id: transactionId
        };
      } else {
        // Oferta desconhecida
        return new Response(JSON.stringify({
          status: "error",
          message: "Compra recebida, mas a oferta não foi identificada.",
          email: buyerEmail,
          offer_code: rawOfferCode
        }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      }
    } else {
      return new Response(JSON.stringify({
        status: "ignored",
        message: `Evento ${event} não altera permissões`
      }), {
        status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    // Localizar ou criar o usuário no Supabase Auth sem duplicidade
    let userId: string | null = null;
    try {
      const { data: listData } = await supabaseAdmin.auth.admin.listUsers();
      const matchedUser = listData?.users?.find(
        (user) => user.email?.toLowerCase().trim() === buyerEmail
      );
      if (matchedUser) {
        userId = matchedUser.id;
      } else {
        const { data: createdData } = await supabaseAdmin.auth.admin.createUser({
          email: buyerEmail,
          email_confirm: true,
          user_metadata: {
            name: buyerName || undefined,
            full_name: buyerName || undefined,
            buyer_name: buyerName || undefined,
            email_verified: true
          }
        });
        if (createdData?.user) {
          userId = createdData.user.id;
        }
      }
    } catch (userErr) {
      console.warn("[hotmart-webhook] Erro ao buscar/criar usuário no Auth:", userErr);
    }

    if (!userId) {
      return new Response(JSON.stringify({
        error: "Não foi possível identificar ou registrar o usuário",
        email: buyerEmail
      }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    // Localizar registro existente em user_entitlements usando APENAS colunas válidas: user_id ou email_usuario
    let existingRowUserId: string | null = null;
    try {
      const { data: rowsByUser } = await supabaseAdmin
        .from("user_entitlements")
        .select("user_id")
        .eq("user_id", userId)
        .limit(1);

      if (rowsByUser && rowsByUser.length > 0 && rowsByUser[0]?.user_id) {
        existingRowUserId = rowsByUser[0].user_id;
      }

      if (!existingRowUserId) {
        const { data: rowsByEmail } = await supabaseAdmin
          .from("user_entitlements")
          .select("user_id")
          .eq("email_usuario", buyerEmail)
          .limit(1);

        if (rowsByEmail && rowsByEmail.length > 0 && rowsByEmail[0]?.user_id) {
          existingRowUserId = rowsByEmail[0].user_id;
        }
      }
    } catch (searchErr) {
      console.warn("[hotmart-webhook] Aviso ao consultar user_entitlements:", searchErr);
    }

    // Campos estritamente suportados pela tabela user_entitlements:
    // - user_id
    // - email_usuario
    // - "leve gratuito"
    // - leve_especial
    // - leve_vip
    // - lia_access
    // - hotmart_status
    // - hotmart_transaction_id
    // - updated_at
    const entitlementData = {
      user_id: userId,
      email_usuario: buyerEmail,
      "leve gratuito": entitlementValues["leve gratuito"],
      leve_especial: entitlementValues.leve_especial,
      leve_vip: entitlementValues.leve_vip,
      lia_access: entitlementValues.lia_access,
      hotmart_status: entitlementValues.hotmart_status,
      hotmart_transaction_id: entitlementValues.hotmart_transaction_id,
      updated_at: new Date().toISOString()
    };

    if (existingRowUserId) {
      // Atualiza o registro existente usando a chave user_id
      const { error: updateError } = await supabaseAdmin
        .from("user_entitlements")
        .update(entitlementData)
        .eq("user_id", existingRowUserId);

      if (updateError) {
        console.error("[hotmart-webhook] Erro ao atualizar user_entitlements:", updateError);
        return new Response(JSON.stringify({
          error: "Falha ao atualizar permissões na tabela user_entitlements",
          details: updateError.message
        }), {
          status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      }
    } else {
      // Insere um novo registro com user_id e email_usuario
      const { error: insertError } = await supabaseAdmin
        .from("user_entitlements")
        .insert(entitlementData);

      if (insertError) {
        console.error("[hotmart-webhook] Erro ao inserir user_entitlements:", insertError);
        return new Response(JSON.stringify({
          error: "Falha ao registrar permissões na tabela user_entitlements",
          details: insertError.message
        }), {
          status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      }
    }

    // Atualiza metadados no Supabase Auth para consistência imediata
    try {
      await supabaseAdmin.auth.admin.updateUserById(userId, {
        app_metadata: {
          plan: planName,
          "leve gratuito": entitlementValues["leve gratuito"],
          leve_especial: entitlementValues.leve_especial,
          leve_vip: entitlementValues.leve_vip,
          lia_access: entitlementValues.lia_access
        },
        user_metadata: {
          ...(buyerName ? { name: buyerName, full_name: buyerName } : {}),
          email_verified: true
        }
      });
    } catch (metaErr) {
      console.warn("[hotmart-webhook] Erro ao sincronizar app_metadata:", metaErr);
    }

    return new Response(JSON.stringify({
      status: "success",
      event,
      email: buyerEmail,
      plan: planName,
      entitlements: {
        "leve gratuito": entitlementValues["leve gratuito"],
        leve_especial: entitlementValues.leve_especial,
        leve_vip: entitlementValues.leve_vip,
        lia_access: entitlementValues.lia_access
      }
    }), {
      status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" }
    });

  } catch (err: any) {
    console.error("[hotmart-webhook] Exceção geral:", err);
    return new Response(JSON.stringify({
      error: err?.message || "Erro interno no processamento do webhook"
    }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }
});

