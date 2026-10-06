import { useEffect, useMemo, useRef, useState, type DragEvent } from "react";
import { Link, useNavigate, useParams } from "react-router";
import { Field } from "@base-ui/react/field";
import { Form } from "@base-ui/react/form";
import { Select } from "@base-ui/react/select";
import { CheckIcon, ChevronDownIcon, ChevronLeftIcon, PlusIcon } from "@/components/icons";
import { useMarket } from "@/components/market/MarketData";
import { ProductPhoto } from "@/components/market/ProductPhoto";
import { SubmitButton, TextAreaField, TextField, type Notice } from "@/components/ui";
import {
  ApiError,
  createProduct,
  deleteImage,
  getProduct,
  updateProduct,
  uploadImages,
  type ListingInput,
  type Product,
} from "@/lib/api";

type Load = { status: "loading" | "ready" | "missing"; product: Product | null };

export function ListingFormPage() {
  const { productId } = useParams();
  const editing = productId !== undefined;
  const id = Number(productId);
  const [load, setLoad] = useState<Load>({ status: editing ? "loading" : "ready", product: null });

  useEffect(() => {
    if (!editing) return;
    let active = true;
    getProduct(id)
      .then(product => active && setLoad({ status: "ready", product }))
      .catch(() => active && setLoad({ status: "missing", product: null }));
    return () => {
      active = false;
    };
  }, [editing, id]);

  return (
    <div className="mx-auto max-w-2xl">
      <title>{editing ? "Edit listing - Satin Road" : "New listing - Satin Road"}</title>
      <Link
        to="/market/listings"
        className="inline-flex items-center gap-1 rounded text-[13px] text-muted outline-none transition-colors hover:text-fg focus-visible:text-fg focus-visible:underline focus-visible:underline-offset-4"
      >
        <ChevronLeftIcon className="size-4" />
        My listings
      </Link>
      <h1 className="mt-6 text-[1.75rem] leading-tight font-medium tracking-tight">{editing ? "Edit listing" : "New listing"}</h1>
      <p className="mt-2 text-[15px] text-muted">
        {editing
          ? "Saving sends the listing back for approval. Buyers won't see it until an admin approves it again."
          : "Buyers see your listing once an admin approves it."}
      </p>

      {load.status === "loading" ? (
        <div className="mt-10 h-96 rounded-lg bg-surface" aria-hidden="true" />
      ) : load.status === "missing" ? (
        <p className="mt-10 rounded-lg border border-line px-6 py-16 text-center text-[15px] text-muted">
          This listing doesn't exist, or it isn't yours to edit.
        </p>
      ) : (
        <ListingForm product={load.product} />
      )}
    </div>
  );
}

function ListingForm({ product }: { product: Product | null }) {
  const navigate = useNavigate();
  const market = useMarket();
  const [categoryId, setCategoryId] = useState<number | null>(product?.categoryId ?? null);
  const [removedImages, setRemovedImages] = useState<number[]>([]);
  const [files, setFiles] = useState<File[]>([]);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<Notice | null>(null);
  const [showNotice, setShowNotice] = useState(false);

  const categories = market.categories.map(c => ({ value: c.id, label: c.name }));

  async function submit(values: Record<string, string>) {
    setShowNotice(false);
    setFieldErrors({});
    const input: ListingInput = {
      title: values.title!.trim(),
      description: (values.description ?? "").trim(),
      price: parsePrice(values.price!)!,
      stock: Number(values.stock),
      categoryId: categoryId!,
    };

    setBusy(true);
    try {
      const saved = product ? await updateProduct(product.id, input) : await createProduct(input);
      for (const imageId of removedImages) await deleteImage(imageId);
      if (files.length > 0) await uploadImages(saved.id, files);
      market.reload();
      navigate("/market/listings", {
        state: { flash: product ? `Saved "${saved.title}". It's waiting for approval.` : `Listed "${saved.title}". It's waiting for approval.` },
      });
    } catch (err) {
      const message = err instanceof ApiError ? err.message : "Something went wrong.";
      const field = fieldFor(message);
      if (field) setFieldErrors({ [field]: message });
      else {
        setNotice({ tone: "danger", text: message });
        setShowNotice(true);
      }
      setBusy(false);
    }
  }

  return (
    <Form onFormSubmit={submit} errors={fieldErrors} onChange={() => setShowNotice(false)} className="mt-10 flex flex-col gap-6">
      <TextField
        name="title"
        label="Title"
        defaultValue={product?.title}
        validate={value => {
          const v = String(value ?? "").trim();
          if (!v) return "Give the listing a title.";
          if (v.length > 100) return "Keep it to 100 characters or fewer.";
        }}
      />

      <TextAreaField
        name="description"
        label="Description"
        maxLength={2000}
        defaultValue={product?.description}
        validate={value => (String(value ?? "").length > 2000 ? "Keep it to 2,000 characters or fewer." : undefined)}
      />

      <div className="grid gap-6 sm:grid-cols-2">
        <TextField
          name="price"
          label="Price"
          hint="In BTC"
          inputMode="decimal"
          placeholder="0.00"
          defaultValue={product ? String(product.price) : undefined}
          validate={value => {
            const price = parsePrice(String(value ?? ""));
            if (price === null) return "Enter a price, like 0.25.";
            if (price <= 0) return "The price has to be above 0.";
          }}
        />
        <TextField
          name="stock"
          label="In stock"
          inputMode="numeric"
          placeholder="0"
          defaultValue={product ? String(product.stock) : undefined}
          validate={value => {
            const v = String(value ?? "").trim();
            if (!/^\d+$/.test(v)) return "Enter a whole number, 0 or more.";
          }}
        />
      </div>

      <CategoryField
        value={categoryId}
        onChange={setCategoryId}
        options={categories}
      />

      <Photos
        product={product}
        removed={removedImages}
        onToggleRemoved={imageId =>
          setRemovedImages(current => (current.includes(imageId) ? current.filter(i => i !== imageId) : [...current, imageId]))
        }
        files={files}
        onFilesChange={setFiles}
      />

      <SubmitButton
        label={product ? "Save changes" : "Create listing"}
        busy={busy}
        notice={notice}
        showNotice={showNotice}
        onNoticeDone={() => setShowNotice(false)}
        className="mt-2"
      />
    </Form>
  );
}

function CategoryField({
  value,
  onChange,
  options,
}: {
  value: number | null;
  onChange: (value: number | null) => void;
  options: { value: number; label: string }[];
}) {
  return (
    <Field.Root name="category" validate={() => (value === null ? "Choose a category." : undefined)} className="group flex flex-col gap-1.5">
      <div className="flex items-baseline justify-between gap-3">
        <Field.Label className="text-[13px] text-muted">Category</Field.Label>
        <Field.Error className="truncate text-[13px] text-danger animate-rise" />
      </div>
      <Select.Root items={options} value={value} onValueChange={next => onChange(next)}>
        <Select.Trigger className="flex h-11 w-full items-center justify-between gap-2 rounded-lg border border-line bg-field px-3.5 text-[15px] text-fg outline-none transition-[border-color,box-shadow] select-none hover:border-line-strong focus-visible:border-accent/60 focus-visible:ring-3 focus-visible:ring-accent/10 data-popup-open:border-line-strong group-data-invalid:border-danger/50">
          <Select.Value placeholder="Choose a category" className="data-placeholder:text-faint" />
          <Select.Icon className="text-faint">
            <ChevronDownIcon className="size-4" />
          </Select.Icon>
        </Select.Trigger>
        <Select.Portal>
          <Select.Positioner className="z-40 outline-none select-none" sideOffset={6} alignItemWithTrigger={false}>
            <Select.Popup className="max-h-(--available-height) min-w-(--anchor-width) overflow-y-auto rounded-lg border border-line-strong bg-raised p-1 shadow-[0_16px_40px_-12px_rgb(0_0_0/0.7)] outline-none">
              <Select.List>
                {options.map(option => (
                  <Select.Item
                    key={option.value}
                    value={option.value}
                    className="grid cursor-default grid-cols-[1rem_1fr] items-center gap-2 rounded-md py-2 pr-4 pl-2 text-sm text-muted outline-none select-none data-highlighted:bg-field data-highlighted:text-fg data-selected:text-fg"
                  >
                    <Select.ItemIndicator className="col-start-1 text-accent">
                      <CheckIcon className="size-4" />
                    </Select.ItemIndicator>
                    <Select.ItemText className="col-start-2">{option.label}</Select.ItemText>
                  </Select.Item>
                ))}
              </Select.List>
            </Select.Popup>
          </Select.Positioner>
        </Select.Portal>
      </Select.Root>
    </Field.Root>
  );
}

function Photos({
  product,
  removed,
  onToggleRemoved,
  files,
  onFilesChange,
}: {
  product: Product | null;
  removed: number[];
  onToggleRemoved: (imageId: number) => void;
  files: File[];
  onFilesChange: (files: File[]) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const previews = useMemo(() => files.map(file => URL.createObjectURL(file)), [files]);

  useEffect(() => () => previews.forEach(url => URL.revokeObjectURL(url)), [previews]);

  function addFiles(list: FileList | null) {
    const images = Array.from(list ?? []).filter(file => file.type.startsWith("image/"));
    if (images.length > 0) onFilesChange([...files, ...images]);
  }

  function onDrop(event: DragEvent) {
    event.preventDefault();
    setDragging(false);
    addFiles(event.dataTransfer.files);
  }

  const existing = product?.images ?? [];
  const tile = "relative aspect-square overflow-hidden rounded-md";

  return (
    <fieldset className="flex flex-col gap-1.5">
      <div className="flex items-baseline justify-between gap-3">
        <legend className="text-[13px] text-muted">Photos</legend>
        <span className="text-[13px] text-faint">The first photo is the cover</span>
      </div>
      <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
        {existing.map(image => {
          const isRemoved = removed.includes(image.id);
          return (
            <div key={image.id} className={tile}>
              <ProductPhoto imageId={image.id} alt="" className={`h-full transition-opacity ${isRemoved ? "opacity-25" : ""}`} />
              <button type="button" onClick={() => onToggleRemoved(image.id)} className={photoButtonClass}>
                {isRemoved ? "Undo" : "Remove"}
              </button>
            </div>
          );
        })}
        {files.map((file, index) => (
          <div key={`${file.name}-${index}`} className={tile}>
            <img src={previews[index]} alt="" className="h-full w-full object-cover" />
            <button type="button" onClick={() => onFilesChange(files.filter((_, i) => i !== index))} className={photoButtonClass}>
              Remove
            </button>
          </div>
        ))}
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          onDragOver={event => {
            event.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={onDrop}
          className={`${tile} grid place-items-center border border-dashed text-[13px] text-muted outline-none transition-colors hover:border-line-strong hover:text-fg focus-visible:border-accent/60 focus-visible:text-fg ${dragging ? "border-accent/60 bg-accent/5 text-fg" : "border-line-strong"}`}
        >
          <span className="flex flex-col items-center gap-1.5">
            <PlusIcon className="size-5" />
            Add photos
          </span>
        </button>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        hidden
        onChange={event => {
          addFiles(event.target.files);
          event.target.value = "";
        }}
      />
      {product && product.status !== "Approved" && existing.length > 0 && (
        <p className="text-[13px] text-faint">Photos of listings waiting for approval can't be shown until they're approved.</p>
      )}
    </fieldset>
  );
}

const photoButtonClass =
  "absolute inset-x-1.5 bottom-1.5 rounded-md bg-canvas/80 py-1 text-[12px] text-fg outline-none transition-colors hover:bg-canvas focus-visible:ring-2 focus-visible:ring-accent/40";

function parsePrice(raw: string): number | null {
  const normalized = raw.trim().replace(",", ".");
  if (!/^\d+(\.\d{1,8})?$/.test(normalized)) return null;
  return Number(normalized);
}

function fieldFor(message: string): string | undefined {
  if (/title/i.test(message)) return "title";
  if (/description/i.test(message)) return "description";
  if (/^price/i.test(message)) return "price";
  if (/^stock/i.test(message)) return "stock";
  if (/category/i.test(message)) return "category";
}
