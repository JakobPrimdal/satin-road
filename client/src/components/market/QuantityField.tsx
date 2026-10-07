import { useId } from "react";
import { NumberField } from "@base-ui/react/number-field";
import { MinusIcon, PlusIcon } from "@/components/icons";

interface QuantityFieldProps {
  value: number;
  onChange: (value: number) => void;
  max: number;
  label: string;
  hideLabel?: boolean;
  compact?: boolean;
  disabled?: boolean;
}

export function QuantityField({ value, onChange, max, label, hideLabel = false, compact = false, disabled = false }: QuantityFieldProps) {
  const id = useId();
  const stepper = `grid shrink-0 place-items-center text-muted outline-none transition-colors hover:text-fg focus-visible:text-fg data-disabled:text-line-strong ${compact ? "w-9" : "w-11"}`;

  return (
    <NumberField.Root
      id={id}
      value={value}
      onValueChange={next => onChange(Math.min(Math.max(next ?? 1, 1), Math.max(max, 1)))}
      min={1}
      max={Math.max(max, 1)}
      disabled={disabled}
      className="flex flex-col gap-1.5"
    >
      <label htmlFor={id} className={hideLabel ? "sr-only" : "text-[13px] text-muted"}>
        {label}
      </label>
      <NumberField.Group
        className={`flex items-stretch rounded-lg border border-line bg-field transition-[border-color,box-shadow] focus-within:border-accent/60 focus-within:ring-3 focus-within:ring-accent/10 hover:border-line-strong ${compact ? "h-9 w-28" : "h-11 w-36"}`}
      >
        <NumberField.Decrement className={stepper} aria-label={`Decrease ${label.toLowerCase()}`}>
          <MinusIcon className="size-4" />
        </NumberField.Decrement>
        <NumberField.Input className="w-full min-w-0 bg-transparent text-center text-[15px] text-fg caret-accent outline-none any-pointer-coarse:text-base" />
        <NumberField.Increment className={stepper} aria-label={`Increase ${label.toLowerCase()}`}>
          <PlusIcon className="size-4" />
        </NumberField.Increment>
      </NumberField.Group>
    </NumberField.Root>
  );
}
