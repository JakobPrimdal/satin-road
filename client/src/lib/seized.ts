import { useSyncExternalStore } from "react";

let seized = false;
const listeners = new Set<() => void>();

export function markSeized() {
    if (seized) return;
    seized = true;
    listeners.forEach(listener => listener());
}

export function useSeized(): boolean {
    return useSyncExternalStore(
        listener => {
            listeners.add(listener);
            return () => listeners.delete(listener);
        },
        () => seized,
    );
}