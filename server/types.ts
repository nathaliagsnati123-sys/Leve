export interface AccessCodeRecord {
  code: string;
  email: string;
  buyerName?: string;
  plan: 'vip' | 'especial';
  leve_vip: boolean;
  lia_access: boolean;
  status: 'active' | 'used' | 'revoked';
  createdAt: string;
  usedAt?: string | null;
  transactionId?: string;
  usedByUserId?: string;
}
