import { useState } from "react";
import { ApiError, setProductApproval, type ApprovalStatus, type Product } from "@/lib/api";
import { useAdmin } from "./AdminData";

export function useApproval() {
  const admin = useAdmin();
  const [busy, setBusy] = useState<Record<number, ApprovalStatus | undefined>>({});
  const [errors, setErrors] = useState<Record<number, string | undefined>>({});

  async function setStatus(product: Product, status: ApprovalStatus): Promise<boolean> {
    setBusy(current => ({ ...current, [product.id]: status }));
    setErrors(current => ({ ...current, [product.id]: undefined }));
    try {
      await setProductApproval(product.id, status);
      admin.patchListing(product.id, { status });
      return true;
    } catch (err) {
      setErrors(current => ({ ...current, [product.id]: err instanceof ApiError ? err.message : "Something went wrong." }));
      return false;
    } finally {
      setBusy(current => ({ ...current, [product.id]: undefined }));
    }
  }

  return { setStatus, busy, errors };
}
