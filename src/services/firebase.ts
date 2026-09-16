// Configuração do Firebase Client SDK para o LEVE
import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { 
  getAuth, 
  Auth, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut as firebaseSignOut, 
  sendPasswordResetEmail,
  onAuthStateChanged,
  User as FirebaseUser,
  updateProfile
} from 'firebase/auth';
import { 
  getFirestore, 
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
  Firestore, 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  collection, 
  query, 
  where, 
  getDocs,
  onSnapshot,
  serverTimestamp
} from 'firebase/firestore';
import firebaseConfigJson from '../../firebase-applet-config.json';
import { UserEntitlements } from './supabase';
import { AppData, TreatmentPreference } from '../types';

export const firebaseConfig = {
  apiKey: firebaseConfigJson.apiKey,
  authDomain: firebaseConfigJson.authDomain,
  projectId: firebaseConfigJson.projectId,
  storageBucket: firebaseConfigJson.storageBucket,
  messagingSenderId: firebaseConfigJson.messagingSenderId,
  appId: firebaseConfigJson.appId,
};

// Singleton initialization
export const app: FirebaseApp = !getApps().length ? initializeApp(firebaseConfig) : getApp();
export const auth: Auth = getAuth(app);

// Inicialização com persistência offline robusta para celular e computador
export const db: Firestore = (() => {
  const databaseId = firebaseConfigJson.firestoreDatabaseId || undefined;
  if (typeof window !== 'undefined') {
    try {
      return initializeFirestore(app, {
        localCache: persistentLocalCache({
          tabManager: persistentMultipleTabManager()
        })
      }, databaseId);
    } catch {
      return getFirestore(app, databaseId);
    }
  }
  return getFirestore(app, databaseId);
})();

// 3 contas de clientes ativas com acesso garantido e protegido
export const FOUNDING_CLIENT_EMAILS = [
  'dallia.avr@gmail.com',
  'nathaliagsnati123@gmail.com',
  'gabrieltmo0301@gmail.com'
];

export function isFoundingEmail(email?: string | null): boolean {
  if (!email) return false;
  return FOUNDING_CLIENT_EMAILS.includes(email.trim().toLowerCase());
}

/**
 * Autentica usuário com email e senha no Firebase Auth
 */
export async function firebaseSignIn(email: string, password: string) {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email.trim(), password);
    return { user: userCredential.user, error: null };
  } catch (error: any) {
    console.error('[Firebase Auth] Erro no login:', error);
    return { user: null, error: error.message || 'Erro ao realizar login.' };
  }
}

/**
 * Cadastra novo usuário no Firebase Auth
 */
export async function firebaseSignUp(
  email: string, 
  password: string, 
  name?: string,
  treatmentPreference?: TreatmentPreference,
  avatar?: string
) {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email.trim(), password);
    const user = userCredential.user;

    if (name || avatar) {
      try {
        await updateProfile(user, {
          displayName: name || undefined,
          photoURL: avatar || undefined
        });
      } catch (profErr) {
        console.warn('[Firebase Auth] Erro ao atualizar displayName:', profErr);
      }
    }

    // Cria perfil inicial no Firestore
    try {
      const userDocRef = doc(db, 'users', user.uid);
      await setDoc(userDocRef, {
        uid: user.uid,
        email: user.email?.toLowerCase(),
        name: name || '',
        avatar: avatar || '',
        treatmentPreference: treatmentPreference || 'voce',
        created_at: serverTimestamp(),
        updated_at: serverTimestamp()
      }, { merge: true });
    } catch (fsErr) {
      console.warn('[Firestore] Erro ao salvar perfil inicial:', fsErr);
    }

    // Se for uma das 4 contas prioritárias, já provisiona o entitlement VIP
    if (isFoundingEmail(user.email)) {
      try {
        const entRef = doc(db, 'user_entitlements', user.uid);
        await setDoc(entRef, {
          user_id: user.uid,
          email: user.email?.toLowerCase(),
          authorized: true,
          has_access: true,
          plan_name: 'vip',
          leve_gratuito: false,
          'leve gratuito': false,
          leve_especial: true,
          'leve especial': true,
          leve_vip: true,
          'leve vip': true,
          lia_access: true,
          hotmart_status: 'approved',
          updated_at: serverTimestamp()
        }, { merge: true });
      } catch (entErr) {
        console.warn('[Firestore] Erro ao registrar entitlements fundadores:', entErr);
      }
    }

    return { user, error: null };
  } catch (error: any) {
    console.error('[Firebase Auth] Erro no cadastro:', error);
    return { user: null, error: error.message || 'Erro ao cadastrar usuário.' };
  }
}

/**
 * Envia email de redefinição de senha
 */
export async function firebaseResetPassword(email: string) {
  try {
    await sendPasswordResetEmail(auth, email.trim());
    return { success: true };
  } catch (error: any) {
    console.error('[Firebase Auth] Erro na redefinição:', error);
    return { success: false, error: error.message || 'Erro ao enviar link de redefinição.' };
  }
}

/**
 * Realiza logout
 */
export async function firebaseLogOut() {
  try {
    await firebaseSignOut(auth);
    return { success: true };
  } catch (error: any) {
    console.error('[Firebase Auth] Erro no logout:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Observa alterações de autenticação no Firebase Auth
 */
export function onFirebaseAuthStateChange(callback: (user: FirebaseUser | null) => void) {
  return onAuthStateChanged(auth, callback);
}

/**
 * Obtém o usuário atual do Firebase Auth
 */
export function getFirebaseCurrentUser(): FirebaseUser | null {
  return auth.currentUser;
}


/**
 * Busca entitlements no Firestore para o usuário
 */
export async function fetchFirebaseEntitlements(user: FirebaseUser | null): Promise<UserEntitlements | null> {
  if (!user) return null;
  const email = user.email?.toLowerCase().trim();

  // cssanches@yahoo.com.br foi reembolsada - NÃO dar acesso ativo no Firebase, manter dados intactos no Supabase como histórico
  if (email === 'cssanches@yahoo.com.br') {
    return {
      user_id: user.uid,
      email: email || '',
      authorized: false,
      has_access: false,
      plan_name: 'none',
      leve_gratuito: false,
      'leve gratuito': false,
      leve_especial: false,
      'leve especial': false,
      leve_vip: false,
      'leve vip': false,
      lia_access: false,
      hotmart_status: 'refunded'
    };
  }

  // As 3 contas prioritárias protegidas são sempre VIP autorizadas
  if (isFoundingEmail(email)) {
    return {
      user_id: user.uid,
      email: email || '',
      authorized: true,
      has_access: true,
      plan_name: 'vip',
      leve_gratuito: false,
      'leve gratuito': false,
      leve_especial: true,
      'leve especial': true,
      leve_vip: true,
      'leve vip': true,
      lia_access: true,
      hotmart_status: 'approved'
    };
  }

  try {
    // 1. Busca pelo ID do próprio usuário autenticado (isolamento estrito)
    const userDoc = await getDoc(doc(db, 'user_entitlements', user.uid));
    if (userDoc.exists()) {
      return userDoc.data() as UserEntitlements;
    }
  } catch (err) {
    console.warn('[Firestore] Aviso ao buscar user_entitlements:', err);
  }

  return null;
}

/**
 * Salva entitlements no Firestore para o usuário
 */
export async function saveFirebaseEntitlements(
  userId: string,
  entitlements: Partial<UserEntitlements>
): Promise<boolean> {
  try {
    const effectiveId = auth.currentUser?.uid || userId?.trim();
    if (!effectiveId) return false;

    const entRef = doc(db, 'user_entitlements', effectiveId);
    await setDoc(entRef, {
      user_id: effectiveId,
      ...entitlements,
      updated_at: serverTimestamp()
    }, { merge: true });
    return true;
  } catch (err) {
    console.warn('[Firestore] Erro ao salvar entitlements:', err);
    return false;
  }
}

/**
 * Salva e sincroniza dados do aplicativo no Firestore (com isolamento estrito)
 */
export async function syncAppDataToFirestore(userId?: string, email?: string, data?: AppData): Promise<boolean> {
  try {
    if (!data) return false;
    const effectiveId = auth.currentUser?.uid || userId?.trim();
    if (!effectiveId) return false;
    const cleanEmail = email?.trim().toLowerCase() || auth.currentUser?.email?.toLowerCase() || '';

    const docRef = doc(db, 'app_data', effectiveId);
    await setDoc(docRef, {
      user_id: effectiveId,
      email: cleanEmail,
      data: JSON.stringify(data),
      updated_at: serverTimestamp(),
      updated_at_ms: Date.now()
    }, { merge: true });
    return true;
  } catch (err) {
    console.warn('[Firestore] Erro ao sincronizar app_data:', err);
    return false;
  }
}

/**
 * Carrega dados do aplicativo a partir do Firestore (com isolamento estrito)
 */
export async function fetchAppDataFromFirestore(userId?: string, email?: string): Promise<AppData | null> {
  try {
    const effectiveId = auth.currentUser?.uid || userId?.trim();

    if (effectiveId) {
      const docRef = doc(db, 'app_data', effectiveId);
      const snap = await getDoc(docRef);
      if (snap.exists()) {
        const row = snap.data();
        if (row?.data) {
          const parsed = typeof row.data === 'string' ? JSON.parse(row.data) : row.data;
          return parsed;
        }
      }
    }
  } catch (err) {
    console.warn('[Firestore] Erro ao carregar app_data:', err);
  }
  return null;
}

/**
 * Observa alterações em tempo real dos dados do usuário no Firestore (CELULAR <-> COMPUTADOR)
 */
export function subscribeToAppDataFromFirestore(
  userId: string,
  onData: (data: AppData, timestamp: number) => void
): () => void {
  const effectiveId = auth.currentUser?.uid || userId?.trim();
  if (!effectiveId) return () => {};

  const docRef = doc(db, 'app_data', effectiveId);
  return onSnapshot(
    docRef,
    (snap) => {
      // Ignora escritas locais pendentes deste próprio dispositivo para evitar loops
      if (snap.metadata.hasPendingWrites) {
        return;
      }
      if (snap.exists()) {
        const row = snap.data();
        if (row?.data) {
          try {
            const parsed = typeof row.data === 'string' ? JSON.parse(row.data) : row.data;
            const ts = row.updated_at_ms || Date.now();
            onData(parsed, ts);
          } catch (e) {
            console.warn('[Firestore onSnapshot] Erro ao parsear dados remotos:', e);
          }
        }
      }
    },
    (err) => {
      console.warn('[Firestore onSnapshot] Listener:', err.message);
    }
  );
}

/**
 * Salva perfil do usuário no Firestore
 */
export async function saveFirebaseUserProfile(
  userId: string,
  profile: { name?: string; full_name?: string; avatar?: string; treatment_preference?: TreatmentPreference }
): Promise<{ success: boolean; error?: string }> {
  try {
    if (!userId) return { success: false, error: 'Usuário não identificado.' };
    const userDocRef = doc(db, 'users', userId);
    const updatePayload: Record<string, any> = {
      updated_at: serverTimestamp()
    };
    if (profile.name !== undefined) updatePayload.name = profile.name;
    if (profile.full_name !== undefined) updatePayload.full_name = profile.full_name;
    if (profile.avatar !== undefined) updatePayload.avatar = profile.avatar;
    if (profile.treatment_preference !== undefined) updatePayload.treatmentPreference = profile.treatment_preference;

    await setDoc(userDocRef, updatePayload, { merge: true });
    return { success: true };
  } catch (err: any) {
    console.warn('[Firestore] Erro ao salvar perfil:', err);
    return { success: false, error: err?.message };
  }
}

/**
 * Carrega perfil do usuário do Firestore
 */
export async function fetchFirebaseUserProfile(userId: string): Promise<{ data: any | null; error?: string }> {
  try {
    if (!userId) return { data: null };
    const userDocRef = doc(db, 'users', userId);
    const snap = await getDoc(userDocRef);
    if (snap.exists()) {
      return { data: snap.data() };
    }
  } catch (err: any) {
    console.warn('[Firestore] Erro ao carregar perfil:', err);
  }
  return { data: null };
}

