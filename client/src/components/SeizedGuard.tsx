import { useEffect } from "react";
import { getMe } from "@/lib/api";
import { useSeized } from "@/lib/seized";
import { getSession, setSession } from "@/lib/session";
import { Wordmark } from "@/components/Logo";
export function SeizedGuard() {
    const seized = useSeized();
    useEffect(() => {
        let lastCheck = 0;
        const check = () => {
            if (!getSession() || Date.now() - lastCheck < 3000) return;
            lastCheck = Date.now();
            getMe().catch(() => {});
        };
        document.addEventListener("pointerdown", check, true);
        document.addEventListener("visibilitychange", check);
        return () => {
            document.removeEventListener("pointerdown", check, true);
            document.removeEventListener("visibilitychange", check);
        };
    }, []);

    if (!seized) return null;

    function logOut() {
        setSession(null);
        window.location.href = "/";
    }

    return (
        <div
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="seized-title"
            className="fixed inset-0 z-[100] flex items-center justify-center overflow-hidden px-6 py-10"
            style={{ background: "radial-gradient(circle at 25% 45%, #7a0d0d 0%, #3a0505 45%, #120202 100%)" }}
        >
            <div
                className="pointer-events-none absolute inset-0 opacity-20"
                style={{ backgroundImage: "repeating-linear-gradient(0deg, rgba(255,255,255,.06) 0 1px, transparent 1px 4px)" }}
            />

            <div className="relative grid w-full max-w-6xl items-center gap-10 md:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
                <div className="flex flex-col items-center gap-8">
                    <div className="relative grid size-64 place-items-center">
                        <div className="absolute inset-0 animate-[spin_18s_linear_infinite] rounded-full border-[10px] border-dashed border-red-500/40" />
                        <div className="absolute inset-6 rounded-full border-4 border-red-400/50 shadow-[0_0_60px_rgba(255,40,40,.6)]" />
                        <div className="absolute inset-12 animate-[spin_30s_linear_infinite_reverse] rounded-full border-2 border-dotted border-red-300/60" />
                        <WarningSign />
                    </div>
                </div>
                
                <div>
                    <h1 id="seized-title" className="text-4xl font-extrabold uppercase tracking-tight text-white drop-shadow-[0_2px_12px_rgba(255,0,0,.6)] md:text-5xl">
                        This vendor has been seized
                    </h1>
                    <div className="mt-6 space-y-4 rounded-md bg-black/45 p-6 text-[17px] leading-snug text-white/90 ring-1 ring-red-500/30">
                        <p>
                            This vendor account and all of its listings have been seized by the FBI following a raid on the Satin Road
                            marketplace. <strong className="text-white">Trading on this account is no longer possible.</strong>
                        </p>
                        <p>
                            Law enforcement has secured the account's listings and order history. Any attempt to continue selling will be
                            logged.
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={logOut}
                        className="mt-8 h-11 rounded-md border border-red-400/60 bg-red-600/20 px-6 text-[15px] font-medium text-white outline-none hover:bg-red-600/35 focus-visible:ring-2 focus-visible:ring-red-400"
                    >
                        Log out
                    </button>
                </div>
            </div>
        </div>
    );
}

function WarningSign() {
    return (
        <svg viewBox="0 0 100 90" className="relative w-28 drop-shadow-[0_0_18px_rgba(255,60,60,.9)]" aria-hidden="true">
            <path d="M50 4 L96 86 H4 Z" fill="#fff" stroke="#e11" strokeWidth="6" strokeLinejoin="round" />
            <rect x="45" y="30" width="10" height="32" rx="4" fill="#e11" />
            <circle cx="50" cy="72" r="6" fill="#e11" />
        </svg>
    );
}



