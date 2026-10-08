import { useCallback, useEffect, useState } from "react";
import { useAdmin } from "@/components/admin/AdminData";
import { ActionButton, EmptyState, LoadingRows, PageHeader, Pagination, paginate, usePageParam } from "@/components/admin/parts";
import { SearchIcon } from "@/components/icons";
import { VendorMark } from "@/components/market/VendorMark";
import { Button } from "@/components/ui";
import { ApiError, getUsers, raidVendor, setUserBlocked, type AdminUser } from "@/lib/api";
import { plural } from "@/lib/format";
import { useSession } from "@/lib/session";

type Status = "active" | "blocked" | "seized";

const PAGE_SIZE = 20;

const statusOf = (user: AdminUser): Status => (user.isSeized ? "seized" : user.isBlocked ? "blocked" : "active");

const filters = [
    { value: "all", label: "All" },
    { value: "active", label: "Active" },
    { value: "blocked", label: "Blocked" },
    { value: "seized", label: "Seized" },
] as const;

const statusStyle: Record<Status, { label: string; className: string }> = {
    active: { label: "Active", className: "border-accent/30 text-accent" },
    blocked: { label: "Blocked", className: "border-danger/30 text-danger" },
    seized: { label: "Seized by FBI", className: "border-danger/40 text-danger" },
};

export function AdminUsers() {
    const session = useSession();
    const [users, setUsers] = useState<AdminUser[]>([]);
    const [state, setState] = useState<"loading" | "ready" | "error">("loading");
    const [error, setError] = useState<string | null>(null);
    const [filter, setFilter] = useState<(typeof filters)[number]["value"]>("all");
    const [query, setQuery] = useState("");
    const { page, resetPage } = usePageParam();

    const load = useCallback(async () => {
        try {
            setUsers(await getUsers());
            setState("ready");
        } catch (err) {
            setError(err instanceof ApiError ? err.message : "Something went wrong.");
            setState("error");
        }
    }, []);

    useEffect(() => {
        load();
    }, [load]);

    function replace(updated: AdminUser) {
        setUsers(current => current.map(u => (u.userId === updated.userId ? updated : u)));
    }

    if (state === "loading") return <LoadingRows count={5} />;
    if (state === "error") {
        return (
            <EmptyState title="Users couldn't be loaded." body={error ?? undefined}>
                <Button className="mt-6" onClick={load}>
                    Try again
                </Button>
            </EmptyState>
        );
    }

    const term = query.trim().toLowerCase();
    const matches = users.filter(u => !term || u.username.includes(term));
    const visible = filter === "all" ? matches : matches.filter(u => statusOf(u) === filter);
    const paged = paginate(visible, page, PAGE_SIZE);
    const countFor = (value: string) => (value === "all" ? matches.length : matches.filter(u => statusOf(u) === value).length);

    return (
        <>
            <title>Users - Admin - Satin Road</title>
            <PageHeader title="Users" description={plural(users.length, "user")} />

            <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
                <div role="group" aria-label="Filter by status" className="flex rounded-lg border border-line bg-surface p-1">
                    {filters.map(option => (
                        <button
                            key={option.value}
                            type="button"
                            aria-pressed={filter === option.value}
                            onClick={() => {
                                setFilter(option.value);
                                resetPage();
                            }}
                            className="flex h-8 items-center gap-1.5 rounded-md px-3 text-sm text-muted outline-none transition-colors hover:text-fg focus-visible:ring-2 focus-visible:ring-accent/40 aria-pressed:bg-raised aria-pressed:text-fg"
                        >
                            {option.label}
                            <span className="text-[12px] text-faint">{countFor(option.value)}</span>
                        </button>
                    ))}
                </div>
                <label className="relative flex w-full items-center sm:w-72">
                    <span className="sr-only">Search users</span>
                    <SearchIcon className="pointer-events-none absolute left-3 size-4 text-faint" />
                    <input
                        type="search"
                        value={query}
                        onChange={event => {
                            setQuery(event.target.value);
                            resetPage();
                        }}
                        placeholder="Search by username"
                        className="h-10 w-full rounded-lg border border-line bg-field pr-3 pl-9 text-sm text-fg caret-accent outline-none transition-[border-color,box-shadow] placeholder:text-faint hover:border-line-strong focus:border-accent/60 focus:ring-3 focus:ring-accent/10 any-pointer-coarse:text-base"
                    />
                </label>
            </div>

            {visible.length === 0 ? (
                <EmptyState title="No users match." body="Try another status or search." />
            ) : (
                <>
                    <ul className="divide-y divide-line border-y border-line">
                        {paged.items.map(user => (
                            <UserRow key={user.userId} user={user} isMe={user.userId === session?.user.userId} onChange={replace} />
                        ))}
                    </ul>
                    <Pagination paged={paged} noun="user" />
                </>
            )}
        </>
    );
}

function UserRow({ user, isMe, onChange }: { user: AdminUser; isMe: boolean; onChange: (user: AdminUser) => void }) {
    const admin = useAdmin();
    const [busy, setBusy] = useState(false);
    const [confirmingSeize, setConfirmingSeize] = useState(false);
    const [seizing, setSeizing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const status = statusOf(user);
    const style = statusStyle[status];
    const canChange = !isMe && user.role !== "Admin" && status !== "seized";

    async function toggle() {
        setBusy(true);
        setError(null);
        try {
            onChange(await setUserBlocked(user.userId, !user.isBlocked));
        } catch (err) {
            setError(err instanceof ApiError ? err.message : "Something went wrong.");
        } finally {
            setBusy(false);
        }
    }

    async function seize() {
        setSeizing(true);
        setError(null);
        try {
            await raidVendor(user.userId);
            onChange({ ...user, isSeized: true });
            admin.reload();
        } catch (err) {
            setError(err instanceof ApiError ? err.message : "Something went wrong.");
        } finally {
            setSeizing(false);
            setConfirmingSeize(false);
        }
    }

    return (
        <li className="flex flex-wrap items-center gap-x-4 gap-y-2 py-4">
            <VendorMark vendorId={user.userId} className="size-10 rounded-md" />
            <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                    <span className="truncate text-[15px]">{user.username}</span>
                    {user.role === "Admin" && (
                        <span className="shrink-0 rounded border border-line-strong px-1.5 py-px text-[11px] text-muted">Admin</span>
                    )}
                    {isMe && <span className="text-[12px] text-faint">(you)</span>}
                    <span className={`shrink-0 rounded border px-1.5 py-px text-[11px] ${style.className}`}>{style.label}</span>
                </div>
                <p className="mt-1 text-[13px] text-muted">
                    {plural(user.listingCount, "listing")}, {plural(user.orderCount, "order")}
                </p>
                {error && <p className="mt-1 text-[13px] text-danger">{error}</p>}
            </div>
            {canChange &&
                (confirmingSeize ? (
                    <div className="flex flex-wrap items-center gap-1">
                        <span className="mr-1 text-[13px] text-muted">Seize {user.username}? This takes all their listings down and can't be undone.</span>
                        <ActionButton tone="danger" busy={seizing} onClick={seize}>
                            Seize
                        </ActionButton>
                        <ActionButton disabled={seizing} onClick={() => setConfirmingSeize(false)}>
                            Cancel
                        </ActionButton>
                    </div>
                ) : (
                    <div className="flex items-center gap-1">
                        <ActionButton tone={user.isBlocked ? "primary" : "danger"} busy={busy} onClick={toggle}>
                            {user.isBlocked ? "Unblock" : "Block"}
                        </ActionButton>
                        <ActionButton tone="danger" disabled={busy} onClick={() => setConfirmingSeize(true)}>
                            Seize
                        </ActionButton>
                    </div>
                ))}
        </li>
    );
}