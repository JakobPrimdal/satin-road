import { useState, type FormEvent } from "react";
import { Link } from "react-router";
import { useAdmin } from "@/components/admin/AdminData";
import { ActionButton, EmptyState, LoadingRows, PageHeader } from "@/components/admin/parts";
import { Button, Spinner } from "@/components/ui";
import { ApiError, createCategory, deleteCategory, updateCategory, type Category } from "@/lib/api";
import { plural } from "@/lib/format";

const inputClass =
  "h-10 w-full rounded-lg border border-line bg-field px-3 text-[15px] text-fg caret-accent outline-none transition-[border-color,box-shadow] placeholder:text-faint hover:border-line-strong focus:border-accent/60 focus:ring-3 focus:ring-accent/10 any-pointer-coarse:text-base";

function friendly(err: unknown): string {
  const message = err instanceof ApiError ? err.message : "Something went wrong.";
  const inUse = message.match(/because (\d+) product/);
  if (inUse) return `It's used by ${plural(Number(inUse[1]), "listing")}. Move or remove them first.`;
  return message;
}

export function AdminCategories() {
  const admin = useAdmin();
  const [name, setName] = useState("");
  const [adding, setAdding] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);

  if (admin.status === "loading") return <LoadingRows count={6} height="h-14" />;
  if (admin.status === "error") {
    return (
      <EmptyState title="Categories couldn't be loaded." body={admin.error ?? undefined}>
        <Button className="mt-6" onClick={admin.reload}>
          Try again
        </Button>
      </EmptyState>
    );
  }

  async function add(event: FormEvent) {
    event.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) {
      setAddError("Give the category a name.");
      return;
    }
    setAdding(true);
    setAddError(null);
    try {
      const created = await createCategory(trimmed);
      admin.setCategories(current => [...current, created].sort((a, b) => a.name.localeCompare(b.name)));
      setName("");
    } catch (err) {
      setAddError(friendly(err));
    } finally {
      setAdding(false);
    }
  }

  const counts = new Map<number, number>();
  admin.listings.forEach(p => counts.set(p.categoryId, (counts.get(p.categoryId) ?? 0) + 1));

  return (
    <>
      <title>Categories - Admin - Satin Road</title>
      <PageHeader title="Categories" description={plural(admin.categories.length, "category", "categories")} />

      <form onSubmit={add} className="mb-8 flex max-w-xl flex-col gap-1.5">
        <label htmlFor="new-category" className="text-[13px] text-muted">
          New category
        </label>
        <div className="flex gap-2">
          <input
            id="new-category"
            value={name}
            onChange={event => {
              setName(event.target.value);
              setAddError(null);
            }}
            placeholder="For example: Electronics"
            maxLength={255}
            className={inputClass.replace("h-10", "h-11")}
          />
          <Button type="submit" disabled={adding} className="shrink-0">
            {adding && <Spinner />}
            Add
          </Button>
        </div>
        {addError && <p className="text-[13px] text-danger">{addError}</p>}
      </form>

      {admin.categories.length === 0 ? (
        <EmptyState title="No categories yet." body="Vendors need at least one category before they can list anything." />
      ) : (
        <ul className="divide-y divide-line border-y border-line">
          {admin.categories.map(category => (
            <CategoryRow key={category.id} category={category} count={counts.get(category.id) ?? 0} />
          ))}
        </ul>
      )}
    </>
  );
}

function CategoryRow({ category, count }: { category: Category; count: number }) {
  const admin = useAdmin();
  const [mode, setMode] = useState<"view" | "rename" | "delete">("view");
  const [draft, setDraft] = useState(category.name);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function save(event: FormEvent) {
    event.preventDefault();
    const trimmed = draft.trim();
    if (!trimmed) return setError("Give the category a name.");
    if (trimmed === category.name) return setMode("view");
    setBusy(true);
    setError(null);
    try {
      const updated = await updateCategory(category.id, trimmed);
      admin.setCategories(current => current.map(c => (c.id === updated.id ? updated : c)).sort((a, b) => a.name.localeCompare(b.name)));
      setMode("view");
    } catch (err) {
      setError(friendly(err));
    } finally {
      setBusy(false);
    }
  }

  async function remove() {
    setBusy(true);
    setError(null);
    try {
      await deleteCategory(category.id);
      admin.setCategories(current => current.filter(c => c.id !== category.id));
    } catch (err) {
      setError(friendly(err));
      setMode("view");
      setBusy(false);
    }
  }

  return (
    <li className="py-3">
      {mode === "rename" ? (
        <form onSubmit={save} className="flex flex-wrap items-center gap-2">
          <label htmlFor={`category-${category.id}`} className="sr-only">
            New name for {category.name}
          </label>
          <input
            id={`category-${category.id}`}
            value={draft}
            onChange={event => setDraft(event.target.value)}
            onKeyDown={event => event.key === "Escape" && setMode("view")}
            autoFocus
            maxLength={255}
            className={`${inputClass} max-w-sm`}
          />
          <ActionButton type="submit" tone="primary" busy={busy}>
            Save
          </ActionButton>
          <ActionButton
            disabled={busy}
            onClick={() => {
              setDraft(category.name);
              setError(null);
              setMode("view");
            }}
          >
            Cancel
          </ActionButton>
        </form>
      ) : (
        <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-2">
          <div className="min-w-0">
            <Link
              to={`/market?category=${category.id}`}
              className="text-[15px] text-fg underline-offset-4 outline-none hover:underline focus-visible:underline"
            >
              {category.name}
            </Link>
            <span className="ml-3 text-[13px] text-muted">{plural(count, "listing")}</span>
          </div>
          <div className="flex items-center gap-1">
            {mode === "delete" ? (
              <>
                <span className="mr-1 text-[13px] text-muted">Delete {category.name}?</span>
                <ActionButton tone="danger" busy={busy} onClick={remove}>
                  Delete
                </ActionButton>
                <ActionButton disabled={busy} onClick={() => setMode("view")}>
                  Keep
                </ActionButton>
              </>
            ) : (
              <>
                <ActionButton onClick={() => setMode("rename")}>Rename</ActionButton>
                <ActionButton tone="danger" onClick={() => setMode("delete")}>
                  Delete
                </ActionButton>
              </>
            )}
          </div>
        </div>
      )}
      {error && <p className="mt-1.5 text-[13px] text-danger">{error}</p>}
    </li>
  );
}
