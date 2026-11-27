import { SEED_USERS, STORAGE_KEYS } from '../storage/seed.data.ts';
import { readStorage, removeStorage, writeStorage } from '../storage/storage.service.ts';
import type { AuthSession, DepartmentRole, UserAccount } from '../types/auth.types.ts';

export function ensureSeedUsers(): UserAccount[] {
  const existing = readStorage<UserAccount[]>(STORAGE_KEYS.USERS, []);
  if (existing.length > 0) return existing;
  writeStorage(STORAGE_KEYS.USERS, SEED_USERS);
  return SEED_USERS;
}

export function getDemoUsers(): UserAccount[] {
  return ensureSeedUsers();
}

export function getActiveSession(): AuthSession | null {
  return readStorage<AuthSession | null>(STORAGE_KEYS.SESSION, null);
}

export function loginWithCredentials(
  email: string,
  password: string,
): { ok: true; session: AuthSession } | { ok: false; error: string } {
  const users = ensureSeedUsers();
  const normalizedEmail = email.trim().toLowerCase();
  const found = users.find(
    (u) => u.email.toLowerCase() === normalizedEmail && u.password === password,
  );
  if (!found) {
    return { ok: false, error: 'Invalid email or password. Try a quick-fill department account below.' };
  }
  const session = createSession(found);
  writeStorage(STORAGE_KEYS.SESSION, session);
  return { ok: true, session };
}

export function loginAsRole(role: DepartmentRole): AuthSession | null {
  const users = ensureSeedUsers();
  const match = users.find((u) => u.role === role);
  if (!match) return null;
  const session = createSession(match);
  writeStorage(STORAGE_KEYS.SESSION, session);
  return session;
}

export function registerAccount(input: {
  name: string;
  email: string;
  password: string;
  role: DepartmentRole;
  location: 'Surabaya Plant' | 'HQ Corporate';
}): { ok: true; session: AuthSession } | { ok: false; error: string } {
  const name = input.name.trim();
  const email = input.email.trim().toLowerCase();
  if (!name || !email || input.password.length < 4) {
    return { ok: false, error: 'Please provide name, valid email, and password (min 4 chars).' };
  }

  const users = ensureSeedUsers();
  if (users.some((u) => u.email.toLowerCase() === email)) {
    return { ok: false, error: 'An account with this email already exists.' };
  }

  const newUser: UserAccount = {
    id: `usr-${Date.now()}`,
    name,
    email,
    password: input.password,
    role: input.role,
    location: input.location,
  };

  writeStorage(STORAGE_KEYS.USERS, [...users, newUser]);
  const session = createSession(newUser);
  writeStorage(STORAGE_KEYS.SESSION, session);
  return { ok: true, session };
}

export function logout(): void {
  removeStorage(STORAGE_KEYS.SESSION);
}

function createSession(user: UserAccount): AuthSession {
  return {
    userId: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    location: user.location,
    loggedInAt: new Date().toISOString(),
  };
}
