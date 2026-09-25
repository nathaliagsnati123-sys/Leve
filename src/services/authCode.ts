import { saveLocalAuthSession } from './supabase';
import { TreatmentPreference } from '../types';

export interface ValidateCodeResult {
  valid: boolean;
  buyerName?: string;
  plan?: string;
  email?: string;
  alreadyUsed?: boolean;
  error?: string;
}

export interface ActivateResult {
  success: boolean;
  message?: string;
  user?: any;
  session?: any;
  alreadyUsed?: boolean;
  error?: string;
}

export interface ResendCodeResult {
  success: boolean;
  message?: string;
  error?: string;
}

/**
 * Valida o código único de primeiro acesso recebido por e-mail.
 */
export async function validateAccessCodeApi(email: string, code: string): Promise<ValidateCodeResult> {
  try {
    const cleanEmail = email.trim().toLowerCase();
    const cleanCode = code.trim().toUpperCase();

    if (!cleanEmail || !cleanCode) {
      return { valid: false, error: 'Informe o e-mail da compra e o código de acesso recebido.' };
    }

    const res = await fetch('/api/auth/validate-code', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: cleanEmail, code: cleanCode })
    });

    const contentType = res.headers.get('content-type') || '';
    if (!contentType.includes('application/json')) {
      return { valid: false, error: 'Servidor temporariamente ocupado. Tente novamente em instantes.' };
    }

    const data = await res.json();
    if (!res.ok || !data.valid) {
      return {
        valid: false,
        alreadyUsed: data.alreadyUsed,
        error: data.error || 'Código de acesso inválido ou expirado.'
      };
    }

    return {
      valid: true,
      buyerName: data.buyerName,
      plan: data.plan,
      email: data.email
    };
  } catch (err: any) {
    console.error('[validateAccessCodeApi] Erro:', err);
    return { valid: false, error: err?.message || 'Falha na conexão com o servidor.' };
  }
}

/**
 * Ativa a conta com o código recebido, define a senha definitiva e faz login imediato.
 */
export async function activateWithCodeApi(
  email: string,
  code: string,
  password: string,
  name?: string,
  treatmentPreference: TreatmentPreference = 'feminino',
  avatar: string = '🌿'
): Promise<ActivateResult> {
  try {
    const cleanEmail = email.trim().toLowerCase();
    const cleanCode = code.trim().toUpperCase();
    const cleanPassword = password.trim();

    if (!cleanEmail || !cleanCode || !cleanPassword) {
      return { success: false, error: 'E-mail, código e senha são obrigatórios.' };
    }

    if (cleanPassword.length < 6) {
      return { success: false, error: 'A senha deve ter no mínimo 6 caracteres.' };
    }

    const res = await fetch('/api/auth/activate-with-code', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: cleanEmail,
        code: cleanCode,
        password: cleanPassword,
        name: name?.trim(),
        treatmentPreference,
        avatar
      })
    });

    const contentType = res.headers.get('content-type') || '';
    if (!contentType.includes('application/json')) {
      return { success: false, error: 'Serviço temporariamente ocupado. Tente novamente.' };
    }

    const data = await res.json();
    if (!res.ok || !data.success) {
      return {
        success: false,
        alreadyUsed: data.alreadyUsed,
        error: data.error || 'Não foi possível ativar sua conta. Verifique os dados digitados.'
      };
    }

    // Salva a sessão no cache local
    if (data.session) {
      saveLocalAuthSession(data.session);
    }

    return {
      success: true,
      message: data.message,
      user: data.user,
      session: data.session
    };
  } catch (err: any) {
    console.error('[activateWithCodeApi] Erro:', err);
    return { success: false, error: err?.message || 'Falha ao ativar conta.' };
  }
}

/**
 * Reenvia o código único de primeiro acesso para o e-mail cadastrado na compra.
 */
export async function resendAccessCodeApi(email: string): Promise<ResendCodeResult> {
  try {
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail) {
      return { success: false, error: 'Informe o e-mail da compra para reenviar o código.' };
    }

    const res = await fetch('/api/auth/resend-access-code', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: cleanEmail })
    });

    const contentType = res.headers.get('content-type') || '';
    if (!contentType.includes('application/json')) {
      return { success: false, error: 'Serviço temporariamente ocupado. Tente novamente em instantes.' };
    }

    const data = await res.json();
    if (!res.ok || !data.success) {
      return {
        success: false,
        error: data.error || 'Não foi possível reenviar o código para este e-mail.'
      };
    }

    return {
      success: true,
      message: data.message || 'Código reenviado com sucesso para o seu e-mail!'
    };
  } catch (err: any) {
    console.error('[resendAccessCodeApi] Erro:', err);
    return { success: false, error: err?.message || 'Falha ao reenviar código.' };
  }
}
