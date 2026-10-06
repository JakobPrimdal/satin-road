import { useMemo } from "react";

function hash(value: string): number {
  let h = 2166136261;
  for (let i = 0; i < value.length; i++) {
    h ^= value.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export function VendorMark({ vendorId, className = "size-8" }: { vendorId: string; className?: string }) {
  const cells = useMemo(() => {
    let seed = hash(vendorId);
    const on: [number, number][] = [];
    for (let y = 0; y < 5; y++) {
      for (let x = 0; x < 3; x++) {
        seed = Math.imul(seed ^ (seed >>> 15), 2246822507) >>> 0;
        if (seed % 100 < 52) {
          on.push([x, y]);
          if (x < 2) on.push([4 - x, y]);
        }
      }
    }
    return on;
  }, [vendorId]);

  return (
    <svg viewBox="0 0 7 7" aria-hidden="true" className={`shrink-0 rounded-md bg-raised text-accent ${className}`}>
      {cells.map(([x, y]) => (
        <rect key={`${x}-${y}`} x={x + 1} y={y + 1} width="1" height="1" fill="currentColor" opacity={0.85} />
      ))}
    </svg>
  );
}
