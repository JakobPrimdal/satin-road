import { useSyncExternalStore } from "react";

//  seized by the FBI or blocked by an admin
export type AccountLock = "seized" | "blocked" | null;

let lock: AccountLock = null;
const listeners = new Set<() => void>();

function setLock(next: Exclude<AccountLock, null>) {
    if (lock) return;
    lock = next;
    listeners.forEach(listener => listener());
}

export const markSeized = () => setLock("seized");
export const markBlocked = () => setLock("blocked");

export function useAccountLock(): AccountLock {
    return useSyncExternalStore(
        listener => {
            listeners.add(listener);
            return () => listeners.delete(listener);
        },
        () => lock,
    );
}