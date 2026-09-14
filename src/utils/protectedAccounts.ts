// Contas Protegidas do LEVE
// Estas contas são prioritárias/administrativas e JAMAIS devem sofrer bloqueio,
// restrição de acesso ou imposição forçada de troca de senha.

export const PROTECTED_ACCOUNTS = [
  'dallia.avr@gmail.com',
  'cssanches@yahoo.com.br',
  'nathaliagsnati123@gmail.com',
  'nathaliagoncalvessilva1@gmail.com',
  'gabrieltmo0301@gmail.com'
] as const;

export function isProtectedAccount(email?: string | null): boolean {
  if (!email || typeof email !== 'string') return false;
  const normalized = email.trim().toLowerCase();
  return PROTECTED_ACCOUNTS.some(protectedEmail => protectedEmail.toLowerCase() === normalized);
}
