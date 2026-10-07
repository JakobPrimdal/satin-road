import { useState } from "react";
import { Navigate, useSearchParams } from "react-router";
import { Form } from "@base-ui/react/form";
import { Tabs } from "@base-ui/react/tabs";
import { Wordmark } from "@/components/Logo";
import { PasswordField, SubmitButton, TextField, type Notice } from "@/components/ui";
import { ApiError, login, register } from "@/lib/api";
import { isAdmin, setSession, useSession } from "@/lib/session";

type Mode = "login" | "register";

const copy = {
  login: {
    title: "Welcome back",
    submit: "Sign in",
  },
  register: {
    title: "Create an account",
    submit: "Create account",
  },
};

export function AuthPage() {
  const [params, setParams] = useSearchParams();
  const mode: Mode = params.get("mode") === "register" ? "register" : "login";
  const session = useSession();

  if (session) return <Navigate to={isAdmin(session) ? "/admin" : "/market"} replace />;

  return (
    <div className="flex min-h-screen flex-col px-6">
      <title>{mode === "register" ? "Register - Satin Road" : "Sign in - Satin Road"}</title>
      <header className="flex h-16 items-center justify-between">
        <Wordmark />
        <span className="hidden font-mono text-xs text-faint sm:block">satinrd4kxq2hzv7.onion</span>
      </header>

      <main className="flex flex-1 justify-center pt-[max(2rem,8vh)] pb-16 sm:pt-[max(3rem,16vh)]">
        <Tabs.Root
          value={mode}
          onValueChange={value => setParams(value === "register" ? { mode: "register" } : {}, { replace: true })}
          className="w-full max-w-[22rem]"
        >
          <Tabs.List className="relative mb-10 grid grid-cols-2 rounded-lg border border-line bg-surface p-1">
            <Tabs.Tab value="login" className={tabClass}>
              Sign in
            </Tabs.Tab>
            <Tabs.Tab value="register" className={tabClass}>
              Register
            </Tabs.Tab>
            <Tabs.Indicator className="absolute top-1 bottom-1 left-0 w-(--active-tab-width) translate-x-(--active-tab-left) rounded-md bg-raised shadow-[inset_0_1px_0_rgb(255_255_255/0.04)] transition-[translate,width] duration-200 ease-out" />
          </Tabs.List>

          <Tabs.Panel value="login">
            <AuthForm mode="login" />
          </Tabs.Panel>
          <Tabs.Panel value="register">
            <AuthForm mode="register" />
          </Tabs.Panel>
        </Tabs.Root>
      </main>
    </div>
  );
}

const tabClass =
  "relative z-10 h-8 rounded-md text-sm text-muted outline-none transition-colors hover:text-fg data-active:text-fg focus-visible:ring-2 focus-visible:ring-accent/40";

function AuthForm({ mode }: { mode: Mode }) {
  const [busy, setBusy] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [notice, setNotice] = useState<Notice | null>(null);
  const [showNotice, setShowNotice] = useState(false);

  const isRegister = mode === "register";
  const text = copy[mode];

  async function onSubmit(values: Record<string, string>) {
    setShowNotice(false);
    setFieldErrors({});
    setBusy(true);
    let registered = false;
    try {
      const credentials = { username: values.username!.trim(), password: values.password! };
      if (isRegister) {
        await register(credentials);
        registered = true;
      }
      setSession(await login(credentials));
    } catch (err) {
      if (registered) {
        setNotice({ tone: "success", text: "Account created. Sign in to continue." });
        setShowNotice(true);
        return;
      }
      const message = err instanceof ApiError ? err.message : "Something went wrong.";
      const field = fieldFor(message);
      if (field) {
        setFieldErrors({ [field]: message });
      } else {
        setNotice({ tone: "danger", text: message });
        setShowNotice(true);
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <Form
      onFormSubmit={onSubmit}
      errors={fieldErrors}
      onChange={() => setShowNotice(false)}
      className="flex flex-col"
    >
      <h1 className="text-[1.75rem] font-medium leading-tight tracking-tight">{text.title}</h1>

      <div className="mt-8 flex flex-col gap-5">
        <TextField
          name="username"
          label="Username"
          autoComplete="username"
          hint={isRegister ? "3 to 30 characters." : undefined}
          validate={value => {
            const v = String(value ?? "").trim();
            if (!v) return "Enter a username.";
            if (isRegister && v.length < 3) return "Needs at least 3 characters.";
            if (isRegister && v.length > 30) return "Keep it to 30 characters or fewer.";
          }}
        />
        <PasswordField
          name="password"
          label="Password"
          autoComplete={isRegister ? "new-password" : "current-password"}
          validate={value => (value ? undefined : "Enter a password.")}
        />
        {isRegister && (
          <PasswordField
            name="confirm"
            label="Repeat password"
            autoComplete="new-password"
            validate={(value, values) => (value === values.password ? undefined : "Passwords don't match.")}
          />
        )}
      </div>

      <SubmitButton
        label={text.submit}
        busy={busy}
        notice={notice}
        showNotice={showNotice}
        onNoticeDone={() => setShowNotice(false)}
        className="mt-8"
      />
    </Form>
  );
}

function fieldFor(message: string): string | undefined {
  if (/^username\b/i.test(message)) return "username";
  if (/^password\b/i.test(message)) return "password";
}
