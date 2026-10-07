import { useSyncExternalStore } from "react";

export interface SessionUser {
  userId: string;
  username: string;
  role: string;
}

export interface Session {
  token: string;
  user: SessionUser;
}

const KEY = "satin-road.session";
const listeners = new Set<() => void>();
let current: Session | null = read();

function read(): Session | null {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const session = JSON.parse(raw) as Session;
    return isExpired(session.token) ? null : session;
  } catch {
    return null;
  }
}

function isExpired(token: string): boolean {
  try {
    const payload = JSON.parse(atob(token.split(".")[1]!.replace(/-/g, "+").replace(/_/g, "/")));
    return typeof payload.exp === "number" && payload.exp * 1000 <= Date.now();
  } catch {
    return true;
  }
}

export function getSession(): Session | null {
  if (current && isExpired(current.token)) setSession(null);
  return current;
}

export function setSession(session: Session | null) {
  current = session;
  try {
    if (session) localStorage.setItem(KEY, JSON.stringify(session));
    else localStorage.removeItem(KEY);
  } catch {}
  listeners.forEach(listener => listener());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function useSession(): Session | null {
  return useSyncExternalStore(subscribe, () => current);
}

export function isAdmin(session: Session | null): boolean {
  return session?.user.role.toLowerCase() === "admin";
}
