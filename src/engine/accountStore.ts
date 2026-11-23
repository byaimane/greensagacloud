import { supabase } from '../lib/supabaseClient';

export interface PlayerAccount {
  id: string;
  username: string;
  email: string;
  shirtColor: string;
  hatColor: string;
  createdAt: string;
  cloudLinked: boolean;
}

interface StoredLocalAccount extends PlayerAccount {
  passwordHash: string;
}

const ACCOUNTS_KEY = 'greensaga_accounts_v1';
const SESSION_KEY = 'greensaga_current_account_v1';

function simpleHash(pw: string): string {
  let h = 5381;
  for (let i = 0; i < pw.length; i++) {
    h = (h * 33) ^ pw.charCodeAt(i);
  }
  return `gs_${(h >>> 0).toString(16)}`;
}

function loadLocalAccounts(): StoredLocalAccount[] {
  try {
    const raw = localStorage.getItem(ACCOUNTS_KEY);
    return raw ? (JSON.parse(raw) as StoredLocalAccount[]) : [];
  } catch {
    return [];
  }
}

function saveLocalAccounts(list: StoredLocalAccount[]): void {
  try {
    localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(list));
  } catch {
    // ignore quota
  }
}

export function getCurrentAccount(): PlayerAccount | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    return raw ? (JSON.parse(raw) as PlayerAccount) : null;
  } catch {
    return null;
  }
}

export function saveCurrentAccount(acc: PlayerAccount | null): void {
  try {
    if (!acc) localStorage.removeItem(SESSION_KEY);
    else localStorage.setItem(SESSION_KEY, JSON.stringify(acc));
  } catch {
    // ignore
  }
}

export async function registerPlayerAccount(params: {
  username: string;
  email: string;
  password: string;
  shirtColor: string;
  hatColor: string;
}): Promise<{ ok: boolean; account?: PlayerAccount; error?: string }> {
  const username = params.username.trim();
  const email = params.email.trim().toLowerCase();
  const password = params.password;

  if (username.length < 2) return { ok: false, error: 'Username must be at least 2 characters.' };
  if (!email.includes('@')) return { ok: false, error: 'Please enter a valid email address.' };
  if (password.length < 6) return { ok: false, error: 'Password must be at least 6 characters.' };

  const localList = loadLocalAccounts();
  if (localList.some((a) => a.email === email)) {
    return { ok: false, error: 'An account with this email already exists. Try signing in!' };
  }

  let cloudId: string | null = null;
  let cloudLinked = false;
  try {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { username } },
    });
    if (!error && data.user) {
      cloudId = data.user.id;
      cloudLinked = true;
    }
  } catch {
    // Seamless local fallback
  }

  const newAcc: StoredLocalAccount = {
    id: cloudId || `acc_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`,
    username,
    email,
    shirtColor: params.shirtColor,
    hatColor: params.hatColor,
    createdAt: new Date().toISOString().slice(0, 10),
    cloudLinked,
    passwordHash: simpleHash(password),
  };

  saveLocalAccounts([...localList, newAcc]);
  const publicAcc: PlayerAccount = {
    id: newAcc.id,
    username: newAcc.username,
    email: newAcc.email,
    shirtColor: newAcc.shirtColor,
    hatColor: newAcc.hatColor,
    createdAt: newAcc.createdAt,
    cloudLinked: newAcc.cloudLinked,
  };
  saveCurrentAccount(publicAcc);
  return { ok: true, account: publicAcc };
}

export async function loginPlayerAccount(
  emailInput: string,
  password: string
): Promise<{ ok: boolean; account?: PlayerAccount; error?: string }> {
  const email = emailInput.trim().toLowerCase();
  if (!email || !password) return { ok: false, error: 'Enter your email and password.' };

  // 1. Check local account store first
  const localList = loadLocalAccounts();
  const match = localList.find((a) => a.email === email);
  if (match) {
    if (match.passwordHash !== simpleHash(password)) {
      return { ok: false, error: 'Incorrect password.' };
    }
    const publicAcc: PlayerAccount = {
      id: match.id,
      username: match.username,
      email: match.email,
      shirtColor: match.shirtColor,
      hatColor: match.hatColor,
      createdAt: match.createdAt,
      cloudLinked: match.cloudLinked,
    };
    saveCurrentAccount(publicAcc);
    return { ok: true, account: publicAcc };
  }

  // 2. Try Supabase Auth sign-in
  try {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (!error && data.user) {
      const publicAcc: PlayerAccount = {
        id: data.user.id,
        username: (data.user.user_metadata?.username as string) || email.split('@')[0],
        email,
        shirtColor: '#ef4444',
        hatColor: '#facc15',
        createdAt: new Date().toISOString().slice(0, 10),
        cloudLinked: true,
      };
      saveCurrentAccount(publicAcc);
      return { ok: true, account: publicAcc };
    }
  } catch {
    // ignore
  }

  return { ok: false, error: 'No account found with that email. Create a free account first!' };
}

export async function signOutPlayerAccount(): Promise<void> {
  saveCurrentAccount(null);
  try {
    await supabase.auth.signOut();
  } catch {
    // ignore
  }
}
