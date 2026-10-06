import { useState, type ComponentProps, type ReactNode } from "react";
import { Button as BaseButton } from "@base-ui/react/button";
import { Field } from "@base-ui/react/field";

const inputClass =
  "h-11 w-full rounded-lg border border-line bg-field px-3.5 text-[15px] text-fg caret-accent outline-none any-pointer-coarse:text-base transition-[border-color,box-shadow] placeholder:text-faint hover:border-line-strong focus:border-accent/60 focus:ring-3 focus:ring-accent/10 group-data-invalid:focus:border-line-strong group-data-invalid:focus:ring-danger/10";

export const threadClass = "pointer-events-none absolute inset-0 rounded-lg border-b-2";

interface TextFieldProps {
  name: string;
  label: string;
  hint?: string;
  validate?: ComponentProps<typeof Field.Root>["validate"];
  type?: string;
  autoComplete?: string;
  defaultValue?: string;
  placeholder?: string;
  inputMode?: "text" | "decimal" | "numeric";
}

function FieldFrame({ name, label, hint, validate, children }: TextFieldProps & { children: ReactNode }) {
  return (
    <Field.Root name={name} validate={validate} className="group flex flex-col gap-1.5">
      <div className="flex items-baseline justify-between gap-3">
        <Field.Label className="shrink-0 text-[13px] text-muted">{label}</Field.Label>
        <div className="grid min-w-0 text-right text-[13px]">
          {hint && (
            <Field.Description className="col-start-1 row-start-1 text-faint transition-opacity group-data-invalid:invisible group-data-invalid:opacity-0">
              {hint}
            </Field.Description>
          )}
          <Field.Error className="col-start-1 row-start-1 truncate text-danger animate-rise" />
        </div>
      </div>
      <div className="relative">
        {children}
        <span aria-hidden="true" className={`${threadClass} border-danger [clip-path:inset(0_100%_0_0)] transition-[clip-path] duration-300 ease-out group-data-invalid:[clip-path:inset(0)]`} />
      </div>
    </Field.Root>
  );
}

export function TextField({ type = "text", autoComplete, defaultValue, placeholder, inputMode, ...props }: TextFieldProps) {
  return (
    <FieldFrame {...props}>
      <Field.Control
        type={type}
        defaultValue={defaultValue}
        placeholder={placeholder}
        inputMode={inputMode}
        autoComplete={autoComplete}
        autoCapitalize="none"
        autoCorrect="off"
        spellCheck={false}
        className={inputClass}
      />
    </FieldFrame>
  );
}

export function TextAreaField({ defaultValue, maxLength, ...props }: TextFieldProps & { maxLength: number }) {
  const [length, setLength] = useState(defaultValue?.length ?? 0);

  return (
    <FieldFrame {...props} hint={`${length} / ${maxLength}`}>
      <Field.Control
        render={<textarea rows={6} />}
        defaultValue={defaultValue}
        onChange={event => setLength(event.target.value.length)}
        className={`${inputClass} h-auto min-h-36 resize-y py-3 leading-relaxed`}
      />
    </FieldFrame>
  );
}

export function PasswordField({ autoComplete, ...props }: Omit<TextFieldProps, "type">) {
  const [visible, setVisible] = useState(false);

  return (
    <FieldFrame {...props}>
      <Field.Control type={visible ? "text" : "password"} autoComplete={autoComplete} className={`${inputClass} pr-16`} />
      <button
        type="button"
        aria-label={visible ? "Hide password" : "Show password"}
        onMouseDown={e => e.preventDefault()}
        onClick={() => setVisible(v => !v)}
        className="absolute inset-y-0 right-0 px-3.5 text-[13px] text-faint underline-offset-4 outline-none transition-colors hover:text-fg focus-visible:text-fg focus-visible:underline"
      >
        {visible ? "Hide" : "Show"}
      </button>
    </FieldFrame>
  );
}

const buttonTones = {
  default: "bg-fg text-canvas hover:bg-white",
  danger: "bg-danger/8 text-danger ring-1 ring-inset ring-danger/30",
  success: "bg-accent/8 text-accent ring-1 ring-inset ring-accent/30",
};

export function Button({
  tone = "default",
  className = "",
  ...props
}: ComponentProps<typeof BaseButton> & { tone?: keyof typeof buttonTones }) {
  return (
    <BaseButton
      focusableWhenDisabled
      className={`inline-flex h-11 items-center justify-center gap-2 rounded-lg px-4 text-[15px] font-medium transition-[background-color,color,box-shadow,scale] duration-300 active:scale-[0.99] data-disabled:cursor-progress focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent ${buttonTones[tone]} ${className}`}
      {...props}
    />
  );
}

export interface Notice {
  tone: "danger" | "success";
  text: string;
}

export function SubmitButton({
  label,
  busy,
  notice,
  showNotice,
  onNoticeDone,
  className = "",
}: {
  label: string;
  busy: boolean;
  notice: Notice | null;
  showNotice: boolean;
  onNoticeDone: () => void;
  className?: string;
}) {
  const roll = "flex h-11 items-center justify-center gap-2 transition-[translate,opacity] duration-250 ease-[cubic-bezier(.2,.8,.2,1)]";
  const shown = showNotice && notice !== null;
  const threadColor = notice?.tone === "success" ? "border-accent" : "border-danger";

  return (
    <>
      <Button
        type="submit"
        disabled={busy}
        tone={shown ? notice.tone : "default"}
        className={`group/submit relative overflow-hidden ${className}`}
      >
        {shown && (
          <span
            aria-hidden="true"
            onAnimationEnd={onNoticeDone}
            className={`${threadClass} ${threadColor} animate-drain group-hover/submit:[animation-play-state:paused]`}
          />
        )}
        <span aria-hidden={shown} className={`${roll} ${shown ? "-translate-y-full opacity-0" : ""}`}>
          {busy && <Spinner />}
          {label}
        </span>
        <span
          aria-hidden={!shown}
          className={`${roll} absolute inset-x-4 top-0 ${shown ? "" : "translate-y-full opacity-0"}`}
        >
          <span className="truncate">{notice?.text}</span>
        </span>
      </Button>
      <span role="status" className="sr-only">
        {shown ? notice.text : ""}
      </span>
    </>
  );
}

export function Spinner() {
  return <span className="size-3.5 animate-spin rounded-full border-2 border-current border-r-transparent" />;
}
