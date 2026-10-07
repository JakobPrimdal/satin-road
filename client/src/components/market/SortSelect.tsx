import { Select } from "@base-ui/react/select";
import { CheckIcon, ChevronDownIcon } from "@/components/icons";
import { sortOptions, type SortKey } from "@/lib/format";

export function SortSelect({ value, onChange }: { value: SortKey; onChange: (value: SortKey) => void }) {
  return (
    <Select.Root items={sortOptions} value={value} onValueChange={next => next && onChange(next)}>
      <div className="flex items-center gap-3">
        <Select.Label className="text-[13px] text-faint">Sort</Select.Label>
        <Select.Trigger className="flex h-9 items-center gap-2 rounded-lg border border-line bg-field pr-2.5 pl-3 text-sm text-fg outline-none transition-colors select-none hover:border-line-strong focus-visible:border-accent/60 focus-visible:ring-3 focus-visible:ring-accent/10 data-popup-open:border-line-strong">
          <Select.Value />
          <Select.Icon className="text-faint">
            <ChevronDownIcon className="size-4" />
          </Select.Icon>
        </Select.Trigger>
      </div>
      <Select.Portal>
        <Select.Positioner className="z-40 outline-none select-none" sideOffset={6} alignItemWithTrigger={false} align="end">
          <Select.Popup className="min-w-(--anchor-width) origin-(--transform-origin) rounded-lg border border-line-strong bg-raised p-1 shadow-[0_16px_40px_-12px_rgb(0_0_0/0.7)] outline-none transition-[scale,opacity] duration-150 ease-out data-ending-style:scale-[0.98] data-ending-style:opacity-0 data-starting-style:scale-[0.98] data-starting-style:opacity-0">
            <Select.List>
              {sortOptions.map(option => (
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
  );
}
