import { useEffect, useRef, useState } from "react";
import { Logo } from "@/components/Logo";
import { getImage } from "@/lib/api";

const loaded = new Map<number, string>();
const pending = new Map<number, Promise<string>>();

function loadImage(imageId: number): Promise<string> {
  const ready = loaded.get(imageId);
  if (ready) return Promise.resolve(ready);

  let request = pending.get(imageId);
  if (!request) {
    request = getImage(imageId)
      .then(blob => {
        const url = URL.createObjectURL(blob);
        loaded.set(imageId, url);
        return url;
      })
      .finally(() => pending.delete(imageId));
    pending.set(imageId, request);
  }
  return request;
}

interface ProductPhotoProps {
  imageId?: number;
  alt: string;
  className?: string;
  eager?: boolean;
}

export function ProductPhoto({ imageId, alt, className = "", eager = false }: ProductPhotoProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(eager);
  const [src, setSrc] = useState<string | null>(imageId ? (loaded.get(imageId) ?? null) : null);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    if (inView || !ref.current) return;
    const observer = new IntersectionObserver(
      entries => {
        if (entries.some(entry => entry.isIntersecting)) {
          setInView(true);
          observer.disconnect();
        }
      },
      { rootMargin: "300px" },
    );
    observer.observe(ref.current);
    return () => observer.disconnect();
  }, [inView]);

  useEffect(() => {
    if (!inView || !imageId) return;
    let active = true;
    setSrc(loaded.get(imageId) ?? null);
    loadImage(imageId)
      .then(url => active && setSrc(url))
      .catch(() => active && setSrc(null));
    return () => {
      active = false;
    };
  }, [inView, imageId]);

  return (
    <div ref={ref} className={`relative overflow-hidden bg-surface ${className}`}>
      <div className="absolute inset-0 grid place-items-center text-line-strong">
        <Logo className="size-10" />
      </div>
      {src && (
        <img
          src={src}
          alt={alt}
          onLoad={() => setShown(true)}
          className={`relative h-full w-full object-cover transition-opacity duration-300 ${shown ? "opacity-100" : "opacity-0"}`}
        />
      )}
    </div>
  );
}
