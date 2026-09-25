// Serviço de envio de e-mails via Resend - LEVE
import { Resend } from 'resend';

let resendClient: Resend | null = null;

function getResendClient(): Resend | null {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    return null;
  }
  if (!resendClient) {
    resendClient = new Resend(apiKey);
  }
  return resendClient;
}

export function getAccessCodeEmailHtml(code: string, buyerName: string, email: string): string {
  const displayName = buyerName ? buyerName.split(' ')[0] : 'Cliente';

  return `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Seu Código de Acesso ao LEVE</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1e293b;">
  <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #f8fafc; padding: 32px 16px;">
    <tr>
      <td align="center">
        <table width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width: 580px; background-color: #ffffff; border-radius: 20px; overflow: hidden; box-shadow: 0 10px 25px -5px rgba(0,0,0,0.05), 0 8px 10px -6px rgba(0,0,0,0.01); border: 1px solid #e2e8f0;">
          
          <!-- Header Suave -->
          <tr>
            <td style="background: linear-gradient(135deg, #059669 0%, #10b981 100%); padding: 36px 32px; text-align: center;">
              <span style="display: inline-block; font-size: 38px; margin-bottom: 8px;">🌿</span>
              <h1 style="margin: 0; color: #ffffff; font-size: 26px; font-weight: 700; letter-spacing: -0.5px;">LEVE</h1>
              <p style="margin: 6px 0 0 0; color: #d1fae5; font-size: 14px;">Cuidado Integral, Rotina & Mente Tranquila</p>
            </td>
          </tr>

          <!-- Corpo do E-mail -->
          <tr>
            <td style="padding: 36px 32px;">
              <h2 style="margin: 0 0 16px 0; color: #0f172a; font-size: 20px; font-weight: 600;">Olá, ${displayName}! 🌸</h2>
              
              <p style="margin: 0 0 20px 0; color: #475569; font-size: 15px; line-height: 1.6;">
                Sua compra foi confirmada com sucesso! Estamos muito felizes em receber você no LEVE.
              </p>

              <p style="margin: 0 0 24px 0; color: #475569; font-size: 15px; line-height: 1.6;">
                Para liberar seu acesso total (incluindo a inteligência artificial <strong>LEVIA</strong>), utilize o seu código de acesso exclusivo abaixo:
              </p>

              <!-- Caixa do Código -->
              <div style="background-color: #f0fdf4; border: 2px dashed #16a34a; border-radius: 14px; padding: 24px; text-align: center; margin: 28px 0;">
                <span style="display: block; font-size: 12px; font-weight: 700; color: #15803d; text-transform: uppercase; letter-spacing: 1.5px; margin-bottom: 8px;">
                  Seu Código de Primeiro Acesso
                </span>
                <span style="display: inline-block; font-size: 32px; font-weight: 800; color: #14532d; letter-spacing: 4px; font-family: monospace; background: #ffffff; padding: 8px 20px; border-radius: 8px; border: 1px solid #bbf7d0;">
                  ${code}
                </span>
                <p style="margin: 12px 0 0 0; font-size: 12px; color: #166534;">
                  E-mail vinculado: <strong>${email}</strong>
                </p>
              </div>

              <!-- Passo a Passo -->
              <div style="background-color: #f8fafc; border-radius: 12px; padding: 20px; margin-bottom: 28px; border: 1px solid #e2e8f0;">
                <h3 style="margin: 0 0 12px 0; color: #334155; font-size: 14px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">
                  Como ativar sua conta em 3 passos:
                </h3>
                <ol style="margin: 0; padding-left: 20px; color: #475569; font-size: 14px; line-height: 1.7;">
                  <li>Abra o LEVE no seu navegador ou aplicativo.</li>
                  <li>Clique na opção <strong>"Primeiro Acesso / Ativar com Código"</strong>.</li>
                  <li>Informe o seu e-mail, digite o código acima e crie sua senha pessoal.</li>
                </ol>
              </div>

              <!-- Mensagem de Apoio -->
              <p style="margin: 0; color: #64748b; font-size: 13px; line-height: 1.5; text-align: center;">
                Este código é de uso único. Caso precise de qualquer auxílio, estamos à disposição.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #f1f5f9; padding: 20px 32px; text-align: center; border-top: 1px solid #e2e8f0;">
              <p style="margin: 0; color: #94a3b8; font-size: 12px;">
                LEVE © 2026 — Seu espaço seguro de organização e tranquilidade.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;
}

export async function sendAccessCodeEmail(
  email: string,
  code: string,
  buyerName?: string
): Promise<{ success: boolean; id?: string; error?: string }> {
  const normalizedEmail = email.trim().toLowerCase();
  const apiKey = process.env.RESEND_API_KEY;
  const configuredFrom = process.env.RESEND_FROM_EMAIL || 'lucianagsantos24@gmail.com';

  console.log(`[resend] Preparando envio de código para ${normalizedEmail}...`);

  if (!apiKey) {
    console.warn(`[resend] AVISO: RESEND_API_KEY não configurada no ambiente. Código gerado: ${code} para ${normalizedEmail}. O código foi salvo no Firebase e banco local para ativação.`);
    return {
      success: false,
      error: 'RESEND_API_KEY não configurada no ambiente.'
    };
  }

  const resend = getResendClient();
  if (!resend) {
    return { success: false, error: 'Falha ao inicializar cliente Resend.' };
  }

  const html = getAccessCodeEmailHtml(code, buyerName || '', normalizedEmail);
  const subject = 'Seu código de acesso ao LEVE chegou! 🌿';

  try {
    // 1. Tenta envio com o remetente configurado (lucianagsantos24@gmail.com)
    let sendResult = await resend.emails.send({
      from: `LEVE <${configuredFrom}>`,
      to: [normalizedEmail],
      subject,
      html
    });

    if (sendResult.error) {
      console.warn('[resend] Retorno com erro ao enviar com remetente configurado:', sendResult.error);
      const errMsg = sendResult.error.message || '';

      // Se for restrição de domínio não verificado no plano padrão do Resend
      if (
        errMsg.toLowerCase().includes('domain') || 
        errMsg.toLowerCase().includes('from') || 
        errMsg.toLowerCase().includes('verify')
      ) {
        console.log('[resend] Tentando envio de contingência via onboarding@resend.dev...');
        sendResult = await resend.emails.send({
          from: 'LEVE <onboarding@resend.dev>',
          to: [normalizedEmail],
          subject,
          html
        });
      }
    }

    if (sendResult.error) {
      console.error('[resend] Falha final ao enviar e-mail:', sendResult.error);
      return {
        success: false,
        error: sendResult.error.message || 'Erro ao enviar e-mail via Resend'
      };
    }

    console.log(`[resend] E-mail de código enviado com sucesso para ${normalizedEmail}! ID: ${sendResult.data?.id}`);
    return {
      success: true,
      id: sendResult.data?.id
    };
  } catch (err: any) {
    console.error('[resend] Exceção ao enviar e-mail:', err);
    return {
      success: false,
      error: err?.message || 'Exceção ao enviar e-mail'
    };
  }
}
