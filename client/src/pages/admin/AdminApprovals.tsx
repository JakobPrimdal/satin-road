import { useState } from "react";
import { Link } from "react-router";
import { useAdmin } from "@/components/admin/AdminData";
import { ActionButton, EmptyState, LoadingRows, PageHeader, Person, StatusPill } from "@/components/admin/parts";
import { useApproval } from "@/components/admin/useApproval";
import { ProductPhoto } from "@/components/market/ProductPhoto";
import { Button } from "@/components/ui";
import type { ApprovalStatus, Product } from "@/lib/api";
import { formatPrice, plural, primaryImage, stockLabel } from "@/lib/format";

export function AdminApprovals() {
  const admin = useAdmin();
  const approval = useApproval();
  const [decided, setDecided] = useState<Map<number, ApprovalStatus>>(new Map());

  if (admin.status === "loading") return <LoadingRows count={3} height="h-40" />;
  if (admin.status === "error") {
    return (
      <EmptyState title="Approvals couldn't be loaded." body={admin.error ?? undefined}>
        <Button className="mt-6" onClick={admin.reload}>
          Try again
        </Button>
      </EmptyState>
    );
  }

  const queue = admin.listings.filter(p => p.status === "Pending" || decided.has(p.id)).sort((a, b) => a.id - b.id);
  const waiting = queue.filter(p => p.status === "Pending").length;
  const approvedCount = [...decided.values()].filter(s => s === "Approved").length;
  const rejectedCount = decided.size - approvedCount;
  const tally = [
    approvedCount > 0 ? `${approvedCount} approved` : null,
    rejectedCount > 0 ? `${rejectedCount} rejected` : null,
  ]
    .filter(Boolean)
    .join(", ");

  async function decide(product: Product, status: ApprovalStatus) {
    if (await approval.setStatus(product, status)) {
      setDecided(current => new Map(current).set(product.id, status));
    }
  }

  async function undo(product: Product) {
    if (await approval.setStatus(product, "Pending")) {
      setDecided(current => {
        const next = new Map(current);
        next.delete(product.id);
        return next;
      });
    }
  }

  return (
    <>
      <title>Approvals - Admin - Satin Road</title>
      <PageHeader
        title="Approvals"
        description={waiting > 0 ? `${plural(waiting, "listing")} waiting, oldest first` : "You're all caught up."}
      >
        {tally && <p className="text-[13px] text-muted">{tally} this visit</p>}
      </PageHeader>

      {queue.length === 0 ? (
        <EmptyState title="Nothing is waiting for approval." body="New and edited listings show up here before buyers can see them." />
      ) : (
        <>
          <ul className="flex flex-col gap-4">
            {queue.map(product => (
              <ApprovalCard
                key={product.id}
                product={product}
                categoryName={admin.categoryName(product.categoryId)}
                decision={decided.get(product.id)}
                busy={approval.busy[product.id]}
                error={approval.errors[product.id]}
                onDecide={status => decide(product, status)}
                onUndo={() => undo(product)}
              />
            ))}
          </ul>
        </>
      )}
    </>
  );
}

function ApprovalCard({
  product,
  categoryName,
  decision,
  busy,
  error,
  onDecide,
  onUndo,
}: {
  product: Product;
  categoryName?: string;
  decision?: ApprovalStatus;
  busy?: ApprovalStatus;
  error?: string;
  onDecide: (status: ApprovalStatus) => void;
  onUndo: () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const long = product.description.length > 220;

  return (
    <li
      className={`grid gap-5 rounded-lg border p-4 transition-colors sm:grid-cols-[8rem_minmax(0,1fr)_auto] ${decision ? "border-line bg-transparent opacity-70" : "border-line bg-surface"}`}
    >
      <div className="relative">
        <ProductPhoto imageId={primaryImage(product)?.id} alt="" eager className="aspect-square w-32 rounded-md" />
        {product.images.length === 0 ? (
          <span className="absolute inset-x-1.5 bottom-1.5 rounded bg-canvas/85 px-1 py-0.5 text-center text-[11px] text-muted">
            No photos
          </span>
        ) : product.images.length > 1 ? (
          <span className="absolute right-1.5 bottom-1.5 rounded bg-canvas/85 px-1.5 py-0.5 text-[11px] text-fg">
            +{product.images.length - 1}
          </span>
        ) : null}
      </div>

      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
          <h2 className="text-[15px] font-medium">{product.title}</h2>
          {decision && <StatusPill status={decision} />}
        </div>
        <p className="mt-1 text-[13px] text-muted">
          {categoryName ?? "Uncategorized"}, {formatPrice(product.price)}, {stockLabel(product.stock).toLowerCase()}
        </p>
        <div className="mt-2">
          <Person id={product.vendorId} role="Vendor" link={false} />
        </div>
        {product.description ? (
          <p className={`mt-3 max-w-prose text-[15px] leading-relaxed whitespace-pre-line text-fg/85 ${expanded ? "" : "line-clamp-3"}`}>
            {product.description}
          </p>
        ) : (
          <p className="mt-3 text-[15px] text-faint">No description.</p>
        )}
        {long && (
          <button
            type="button"
            onClick={() => setExpanded(v => !v)}
            className="mt-1 rounded text-[13px] text-accent underline-offset-4 outline-none hover:underline focus-visible:underline"
          >
            {expanded ? "Show less" : "Show more"}
          </button>
        )}
        {error && <p className="mt-2 text-[13px] text-danger">{error}</p>}
      </div>

      <div className="flex items-start gap-1 sm:flex-col sm:items-end">
        {decision ? (
          <>
            {decision === "Approved" && (
              <Link
                to={`/market/product/${product.id}`}
                className="inline-flex h-8 items-center rounded-md px-2.5 text-[13px] text-accent underline-offset-4 outline-none hover:underline focus-visible:underline"
              >
                View in market
              </Link>
            )}
            <ActionButton busy={busy === "Pending"} onClick={onUndo}>
              Undo
            </ActionButton>
          </>
        ) : (
          <>
            <ActionButton tone="primary" busy={busy === "Approved"} disabled={!!busy} onClick={() => onDecide("Approved")}>
              Approve
            </ActionButton>
            <ActionButton tone="danger" busy={busy === "Rejected"} disabled={!!busy} onClick={() => onDecide("Rejected")}>
              Reject
            </ActionButton>
          </>
        )}
      </div>
    </li>
  );
}
