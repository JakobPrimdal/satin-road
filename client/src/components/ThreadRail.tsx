import { useLayoutEffect, useRef, useState } from "react";
import { Link } from "react-router";

export interface RailItem {
  key: string;
  to: string;
  label: string;
  active: boolean;
  badge?: number;
}

export function ThreadRail({ label, items }: { label: string; items: RailItem[] }) {
  const railRef = useRef<HTMLDivElement>(null);
  const [thread, setThread] = useState<{ left: number; width: number } | null>(null);
  const activeKey = items.find(item => item.active)?.key ?? null;
  const signature = items.map(item => `${item.key}:${item.label}:${item.badge ?? ""}`).join("|");

  useLayoutEffect(() => {
    const rail = railRef.current;
    const text = rail?.querySelector<HTMLElement>("[aria-current='page'] > [data-label]");
    if (!rail || !text) {
      setThread(null);
      return;
    }
    const measure = () => setThread({ left: text.offsetLeft, width: text.offsetWidth });
    measure();
    const visibleLeft = text.offsetLeft - rail.scrollLeft;
    if (visibleLeft < 0 || visibleLeft + text.offsetWidth > rail.clientWidth) {
      rail.scrollTo({ left: text.offsetLeft - 24, behavior: "smooth" });
    }
    const observer = new ResizeObserver(measure);
    observer.observe(rail);
    return () => observer.disconnect();
  }, [activeKey, signature]);

  return (
    <nav aria-label={label} className="mx-auto max-w-7xl px-4 sm:px-6">
      <div ref={railRef} className="no-scrollbar relative -mx-1 flex overflow-x-auto px-1">
        {items.map(item => (
          <Link
            key={item.key}
            to={item.to}
            aria-current={item.active ? "page" : undefined}
            className="flex shrink-0 items-center gap-2 px-3 py-3 text-sm whitespace-nowrap text-muted outline-none transition-colors first:pl-0 hover:text-fg focus-visible:text-fg focus-visible:underline focus-visible:underline-offset-4 aria-[current=page]:text-fg"
          >
            <span data-label>{item.label}</span>
            {item.badge !== undefined && item.badge > 0 && (
              <span className="grid h-[18px] min-w-[18px] place-items-center rounded-full bg-accent px-1 text-[11px] font-medium text-canvas">
                {item.badge}
              </span>
            )}
          </Link>
        ))}
        <span
          aria-hidden="true"
          className={`pointer-events-none absolute bottom-0 left-0 h-0.5 rounded-full bg-accent transition-[translate,width,opacity] duration-300 ease-out ${thread ? "opacity-100" : "opacity-0"}`}
          style={thread ? { width: thread.width, translate: `${thread.left}px 0` } : undefined}
        />
      </div>
    </nav>
  );
}
