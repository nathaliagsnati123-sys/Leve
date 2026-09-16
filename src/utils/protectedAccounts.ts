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

export const PROTECTED_ACCOUNT_DETAILS: Record<string, { id: string; name: string; avatar: string }> = {
  'nathaliagsnati123@gmail.com': {
    id: '79e04a29-2e07-42f2-9953-b1bca7f423a0',
    name: 'Nathe',
    avatar: '🌸'
  },
  'dallia.avr@gmail.com': {
    id: 'd2eaa94a-de05-41fb-82fd-8a30fe4d2fde',
    name: 'Dallia',
    avatar: '🌿'
  },
  'cssanches@yahoo.com.br': {
    id: '057c6f68-e302-474f-acd0-95364307af84',
    name: 'CS Sanches',
    avatar: '🌿'
  },
  'gabrieltmo0301@gmail.com': {
    id: '0077125c-48b3-4b6c-9132-10819e4bf95b',
    name: 'Gabriel',
    avatar: '🌿'
  },
  'nathaliagoncalvessilva1@gmail.com': {
    id: 'protected_nathaliagoncalvessilva1_gmail_com',
    name: 'Nathalia',
    avatar: '🌿'
  }
};

export function getProtectedUserDetails(email: string) {
  const normalized = email.trim().toLowerCase();
  return PROTECTED_ACCOUNT_DETAILS[normalized] || {
    id: `protected_${normalized.replace(/[^a-zA-Z0-9]/g, '_')}`,
    name: normalized.split('@')[0],
    avatar: '🌿'
  };
}
