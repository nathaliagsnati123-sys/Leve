// Gerenciador de Códigos Únicos de Acesso (Firebase Firestore + Store Local) - LEVE
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore, doc, setDoc, getDoc, updateDoc, Firestore } from 'firebase/firestore';
import { AccessCodeRecord } from './types';
import firebaseConfigJson from '../firebase-applet-config.json';

const ACCESS_CODES_FILE = path.join(process.cwd(), 'data', 'access_codes.json');

// Inicialização segura do Firebase Firestore no servidor
let firestoreDb: Firestore | null = null;

function getFirestoreDb(): Firestore | null {
  try {
    if (!firestoreDb) {
      const app = !getApps().length
        ? initializeApp({
            apiKey: firebaseConfigJson.apiKey,
            authDomain: firebaseConfigJson.authDomain,
            projectId: firebaseConfigJson.projectId,
            storageBucket: firebaseConfigJson.storageBucket,
            messagingSenderId: firebaseConfigJson.messagingSenderId,
            appId: firebaseConfigJson.appId
          })
        : getApp();

      firestoreDb = getFirestore(app, firebaseConfigJson.firestoreDatabaseId || undefined);
    }
    return firestoreDb;
  } catch (err) {
    console.warn('[firebase-server] Falha ao inicializar Firestore SDK:', err);
    return null;
  }
}

// -------------------------------------------------------------
// Persistência local (data/access_codes.json)
// -------------------------------------------------------------
export function getStoredAccessCodes(): Record<string, AccessCodeRecord> {
  try {
    if (fs.existsSync(ACCESS_CODES_FILE)) {
      const content = fs.readFileSync(ACCESS_CODES_FILE, 'utf-8');
      return JSON.parse(content || '{}');
    }
  } catch (err) {
    console.error('[access-codes] Erro ao ler access_codes.json:', err);
  }
  return {};
}

export function saveStoredAccessCodes(codes: Record<string, AccessCodeRecord>): void {
  try {
    const dir = path.dirname(ACCESS_CODES_FILE);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(ACCESS_CODES_FILE, JSON.stringify(codes, null, 2), 'utf-8');
  } catch (err) {
    console.error('[access-codes] Erro ao salvar access_codes.json:', err);
  }
}

// -------------------------------------------------------------
// Geração de Código Único e Seguro
// Formato: LEVE-XXXX-XXXX (ex: LEVE-8H3K-9R2M)
// Alfabeto sem caracteres ambíguos (sem 0/O, 1/I/L)
// -------------------------------------------------------------
const CHARS = '23456789ABCDEFGHJKMNPQRSTUVWXYZ';

export function generateAccessCode(): string {
  const bytes = crypto.randomBytes(8);
  let p1 = '';
  let p2 = '';
  for (let i = 0; i < 4; i++) {
    p1 += CHARS[bytes[i] % CHARS.length];
  }
  for (let i = 4; i < 8; i++) {
    p2 += CHARS[bytes[i] % CHARS.length];
  }
  return `LEVE-${p1}-${p2}`;
}

// -------------------------------------------------------------
// Criação e Registro no Firebase + Local
// -------------------------------------------------------------
export async function createAndSaveAccessCode(
  email: string,
  buyerName?: string,
  plan: 'vip' | 'especial' = 'vip',
  transactionId?: string
): Promise<AccessCodeRecord> {
  const normalizedEmail = email.trim().toLowerCase();
  const existingCodes = getStoredAccessCodes();

  // Verifica se já existe um código ativo para este e-mail
  const existingActive = Object.values(existingCodes).find(
    (c) => c.email.toLowerCase() === normalizedEmail && c.status === 'active'
  );

  let record: AccessCodeRecord;

  if (existingActive) {
    record = existingActive;
    if (buyerName && !record.buyerName) record.buyerName = buyerName;
    if (transactionId && !record.transactionId) record.transactionId = transactionId;
  } else {
    const code = generateAccessCode();
    record = {
      code,
      email: normalizedEmail,
      buyerName: buyerName || '',
      plan,
      leve_vip: true, // VIP total com LEVIA
      lia_access: true,
      status: 'active',
      createdAt: new Date().toISOString(),
      usedAt: null,
      transactionId: transactionId || ''
    };
  }

  // 1. Salva no arquivo local (garantia imediata)
  existingCodes[record.code] = record;
  saveStoredAccessCodes(existingCodes);

  // 2. Salva no Firebase Firestore
  try {
    const db = getFirestoreDb();
    if (db) {
      const codeRef = doc(db, 'access_codes', record.code);
      await setDoc(codeRef, {
        code: record.code,
        email: record.email,
        buyerName: record.buyerName || '',
        plan: record.plan,
        leve_vip: record.leve_vip,
        lia_access: record.lia_access,
        status: record.status,
        createdAt: record.createdAt,
        usedAt: record.usedAt || null,
        transactionId: record.transactionId || ''
      }, { merge: true });
      console.log(`[firebase] Código ${record.code} salvo no Firestore para ${record.email}`);
    }
  } catch (fbErr) {
    console.warn('[firebase] Aviso ao gravar código no Firestore (mantido localmente):', fbErr);
  }

  return record;
}

// -------------------------------------------------------------
// Busca de código (Local + Firebase Fallback)
// -------------------------------------------------------------
export async function getAccessCodeRecord(code: string): Promise<AccessCodeRecord | null> {
  const normalizedCode = code.trim().toUpperCase();
  const localCodes = getStoredAccessCodes();

  if (localCodes[normalizedCode]) {
    return localCodes[normalizedCode];
  }

  // Tenta buscar no Firebase se não estiver no arquivo local
  try {
    const db = getFirestoreDb();
    if (db) {
      const codeRef = doc(db, 'access_codes', normalizedCode);
      const snap = await getDoc(codeRef);
      if (snap.exists()) {
        const data = snap.data() as AccessCodeRecord;
        // Atualiza localmente
        localCodes[normalizedCode] = data;
        saveStoredAccessCodes(localCodes);
        return data;
      }
    }
  } catch (fbErr) {
    console.warn('[firebase] Erro ao buscar código no Firestore:', fbErr);
  }

  return null;
}

// -------------------------------------------------------------
// Validação do Código para um E-mail
// -------------------------------------------------------------
export async function validateAccessCode(
  email: string,
  code: string
): Promise<{
  valid: boolean;
  error?: string;
  record?: AccessCodeRecord;
  alreadyUsed?: boolean;
}> {
  const normalizedEmail = email.trim().toLowerCase();
  const normalizedCode = code.trim().toUpperCase();

  if (!normalizedEmail || !normalizedCode) {
    return { valid: false, error: 'E-mail e código de acesso são obrigatórios.' };
  }

  const record = await getAccessCodeRecord(normalizedCode);

  if (!record) {
    return {
      valid: false,
      error: 'Código de acesso não encontrado. Verifique os caracteres ou solicite o reenvio.'
    };
  }

  if (record.email.toLowerCase() !== normalizedEmail) {
    return {
      valid: false,
      error: 'Este código de acesso pertence a outro e-mail. Digite o e-mail exato utilizado na compra.'
    };
  }

  if (record.status === 'used') {
    return {
      valid: false,
      alreadyUsed: true,
      error: 'Este código de acesso já foi utilizado para ativar uma conta. Faça login com seu e-mail e senha na tela inicial.'
    };
  }

  if (record.status !== 'active') {
    return {
      valid: false,
      error: 'Este código de acesso não está ativo ou foi cancelado.'
    };
  }

  return { valid: true, record };
}

// -------------------------------------------------------------
// Invalidação do Código (Marca como Utilizado)
// -------------------------------------------------------------
export async function invalidateAccessCode(
  code: string,
  usedByUserId?: string
): Promise<void> {
  const normalizedCode = code.trim().toUpperCase();
  const localCodes = getStoredAccessCodes();

  if (localCodes[normalizedCode]) {
    localCodes[normalizedCode].status = 'used';
    localCodes[normalizedCode].usedAt = new Date().toISOString();
    if (usedByUserId) {
      localCodes[normalizedCode].usedByUserId = usedByUserId;
    }
    saveStoredAccessCodes(localCodes);
  }

  // Atualiza no Firestore
  try {
    const db = getFirestoreDb();
    if (db) {
      const codeRef = doc(db, 'access_codes', normalizedCode);
      await updateDoc(codeRef, {
        status: 'used',
        usedAt: new Date().toISOString(),
        ...(usedByUserId ? { usedByUserId } : {})
      });
      console.log(`[firebase] Código ${normalizedCode} invalidado (used) com sucesso.`);
    }
  } catch (fbErr) {
    console.warn('[firebase] Aviso ao invalidar código no Firestore:', fbErr);
  }
}

// -------------------------------------------------------------
// Busca código ativo por e-mail
// -------------------------------------------------------------
export function findActiveCodeForEmail(email: string): AccessCodeRecord | null {
  const normalized = email.trim().toLowerCase();
  const localCodes = getStoredAccessCodes();
  return (
    Object.values(localCodes).find(
      (c) => c.email.toLowerCase() === normalized && c.status === 'active'
    ) || null
  );
}

// Busca qualquer código (mesmo utilizado) por e-mail
export function findAnyCodeForEmail(email: string): AccessCodeRecord | null {
  const normalized = email.trim().toLowerCase();
  const localCodes = getStoredAccessCodes();
  return (
    Object.values(localCodes).find(
      (c) => c.email.toLowerCase() === normalized
    ) || null
  );
}
