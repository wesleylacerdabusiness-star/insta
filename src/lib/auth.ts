export interface AuthUser {
  id: string;
  username: string;
  whatsapp: string;
  createdAt: string;
}

interface StoredAccount extends AuthUser {
  passwordHash: string;
}

interface SessionPayload {
  userId: string;
  username: string;
  whatsapp: string;
  expiresAt: number;
  nonce: string;
}

const VAULT_STORAGE_KEY = "instaspy_secure_vault_v1";
const SESSION_STORAGE_KEY = "instaspy_session_token_v1";
const ENCRYPTION_SALT = "INSTASPY_ENCRYPTION_KEY_2026_@#!";

function encryptData(text: string): string {
  try {
    const combined = text + "::" + ENCRYPTION_SALT;
    return btoa(encodeURIComponent(combined).split("").map((c, i) =>
      String.fromCharCode(c.charCodeAt(0) ^ (ENCRYPTION_SALT.charCodeAt(i % ENCRYPTION_SALT.length)))
    ).join(""));
  } catch {
    return btoa(text);
  }
}

function decryptData(ciphertext: string): string | null {
  try {
    const raw = atob(ciphertext);
    const decryptedCombined = raw.split("").map((c, i) =>
      String.fromCharCode(c.charCodeAt(0) ^ (ENCRYPTION_SALT.charCodeAt(i % ENCRYPTION_SALT.length)))
    ).join("");
    const decoded = decodeURIComponent(decryptedCombined);
    const parts = decoded.split("::");
    if (parts.length >= 2 && parts[1] === ENCRYPTION_SALT) {
      return parts[0] ?? null;
    }
    return null;
  } catch {
    return null;
  }
}

function hashPassword(password: string): string {
  let hash = 0;
  const str = password + "_SALT_" + ENCRYPTION_SALT;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0;
  }
  return hash.toString(16);
}

function getAccountsVault(): StoredAccount[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(VAULT_STORAGE_KEY);
    if (!raw) return [];
    const decrypted = decryptData(raw);
    if (!decrypted) return [];
    return JSON.parse(decrypted);
  } catch {
    return [];
  }
}

function saveAccountsVault(accounts: StoredAccount[]): void {
  if (typeof window === "undefined") return;
  try {
    const serialized = JSON.stringify(accounts);
    const encrypted = encryptData(serialized);
    localStorage.setItem(VAULT_STORAGE_KEY, encrypted);
  } catch (err) {
    console.error("Falha ao salvar conta no vault:", err);
  }
}

export function setAuthSession(user: AuthUser): void {
  if (typeof window === "undefined") return;
  try {
    const payload: SessionPayload = {
      userId: user.id,
      username: user.username,
      whatsapp: user.whatsapp,
      expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000,
      nonce: Math.random().toString(36).substring(2),
    };
    const encryptedToken = encryptData(JSON.stringify(payload));
    localStorage.setItem(SESSION_STORAGE_KEY, encryptedToken);

    document.cookie = `instaspy_auth=1; path=/; max-age=${7 * 24 * 60 * 60}; SameSite=Lax`;
  } catch (err) {
    console.error("Erro ao salvar sessão:", err);
  }
}

export function isAuthenticated(): boolean {
  if (typeof window === "undefined") return false;
  try {
    const token = localStorage.getItem(SESSION_STORAGE_KEY);
    if (!token) return false;
    const decrypted = decryptData(token);
    if (!decrypted) return false;
    const payload: SessionPayload = JSON.parse(decrypted);
    if (payload.expiresAt && Date.now() > payload.expiresAt) {
      logoutUser();
      return false;
    }
    return !!payload.username;
  } catch {
    return false;
  }
}

export function getCurrentUser(): AuthUser | null {
  if (typeof window === "undefined") return null;
  try {
    const token = localStorage.getItem(SESSION_STORAGE_KEY);
    if (!token) return null;
    const decrypted = decryptData(token);
    if (!decrypted) return null;
    const payload: SessionPayload = JSON.parse(decrypted);
    return {
      id: payload.userId,
      username: payload.username,
      whatsapp: payload.whatsapp,
      createdAt: new Date().toISOString(),
    };
  } catch {
    return null;
  }
}

export function registerUser(usernameRaw: string, whatsapp: string, password: string): { success: boolean; message?: string; user?: AuthUser } {
  const username = usernameRaw.trim().replace(/^@/, "").toLowerCase();
  if (!username) return { success: false, message: "Informe seu @ do Instagram." };
  if (!password || password.length < 4) return { success: false, message: "A senha deve ter no mínimo 4 caracteres." };

  const accounts = getAccountsVault();
  const existing = accounts.find((a) => a.username === username);

  if (existing) {
    const inputHash = hashPassword(password);
    if (existing.passwordHash === inputHash) {

      setAuthSession(existing);
      return { success: true, user: existing };
    }
    return {
      success: false,
      message: "Este usuário já está cadastrado. Por favor, acesse a aba 'Entrar' e digite sua senha cadastrada.",
    };
  }

  const newUser: StoredAccount = {
    id: "usr_" + Math.random().toString(36).substring(2, 9),
    username,
    whatsapp,
    passwordHash: hashPassword(password),
    createdAt: new Date().toISOString(),
  };

  accounts.push(newUser);
  saveAccountsVault(accounts);


  setAuthSession(newUser);

  return { success: true, user: newUser };
}

export function loginUser(usernameRaw: string, password: string): { success: boolean; message?: string; user?: AuthUser } {
  const username = usernameRaw.trim().replace(/^@/, "").toLowerCase();
  if (!username) return { success: false, message: "Informe seu @ do Instagram." };
  if (!password) return { success: false, message: "Informe sua senha de acesso." };

  const accounts = getAccountsVault();
  const account = accounts.find((a) => a.username === username);

  if (!account) {
    return {
      success: false,
      message: "Usuário não encontrado. Crie sua conta na aba 'Criar Conta' antes de entrar.",
    };
  }

  const inputHash = hashPassword(password);
  if (account.passwordHash !== inputHash) {
    return {
      success: false,
      message: "Senha incorreta. Digite exatamente a senha cadastrada na sua conta.",
    };
  }


  setAuthSession(account);
  return { success: true, user: account };
}

export function logoutUser(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(SESSION_STORAGE_KEY);
  document.cookie = "instaspy_auth=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
}
