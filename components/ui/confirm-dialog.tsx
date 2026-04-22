"use client";

import { AlertTriangle, Info } from "lucide-react";
import { useTranslations } from "next-intl";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import { Button } from "@/components/ui/button";

type DialogTone = "default" | "danger" | "info";

export type ConfirmOptions = {
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  tone?: DialogTone;
};

export type AlertOptions = {
  title: string;
  description?: string;
  confirmLabel?: string;
  tone?: DialogTone;
};

export type PromptOptions = {
  title: string;
  description?: string;
  placeholder?: string;
  defaultValue?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  tone?: DialogTone;
  required?: boolean;
};

type InternalDialogState =
  | {
      kind: "confirm";
      options: ConfirmOptions;
      resolve: (ok: boolean) => void;
    }
  | {
      kind: "alert";
      options: AlertOptions;
      resolve: () => void;
    }
  | {
      kind: "prompt";
      options: PromptOptions;
      resolve: (value: string | null) => void;
    };

type DialogContextValue = {
  confirm: (options: ConfirmOptions) => Promise<boolean>;
  alert: (options: AlertOptions) => Promise<void>;
  prompt: (options: PromptOptions) => Promise<string | null>;
};

const DialogContext = createContext<DialogContextValue | null>(null);

export function DialogProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<InternalDialogState | null>(null);

  const confirm = useCallback(
    (options: ConfirmOptions) =>
      new Promise<boolean>((resolve) => {
        setState({ kind: "confirm", options, resolve });
      }),
    [],
  );

  const alert = useCallback(
    (options: AlertOptions) =>
      new Promise<void>((resolve) => {
        setState({ kind: "alert", options, resolve });
      }),
    [],
  );

  const prompt = useCallback(
    (options: PromptOptions) =>
      new Promise<string | null>((resolve) => {
        setState({ kind: "prompt", options, resolve });
      }),
    [],
  );

  const close = useCallback(
    (result: { ok: boolean; value?: string }) => {
      setState((prev) => {
        if (!prev) return null;
        if (prev.kind === "confirm") prev.resolve(result.ok);
        else if (prev.kind === "alert") prev.resolve();
        else prev.resolve(result.ok ? (result.value ?? "") : null);
        return null;
      });
    },
    [],
  );

  const value = useMemo(
    () => ({ confirm, alert, prompt }),
    [confirm, alert, prompt],
  );

  return (
    <DialogContext.Provider value={value}>
      {children}
      <DialogHost state={state} onClose={close} />
    </DialogContext.Provider>
  );
}

export function useConfirm() {
  const ctx = useContext(DialogContext);
  if (!ctx) throw new Error("useConfirm must be used inside <DialogProvider>");
  return ctx.confirm;
}

export function useAlert() {
  const ctx = useContext(DialogContext);
  if (!ctx) throw new Error("useAlert must be used inside <DialogProvider>");
  return ctx.alert;
}

export function usePrompt() {
  const ctx = useContext(DialogContext);
  if (!ctx) throw new Error("usePrompt must be used inside <DialogProvider>");
  return ctx.prompt;
}

function DialogHost({
  state,
  onClose,
}: {
  state: InternalDialogState | null;
  onClose: (result: { ok: boolean; value?: string }) => void;
}) {
  const t = useTranslations("common");
  const confirmBtnRef = useRef<HTMLButtonElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [inputValue, setInputValue] = useState("");

  useEffect(() => {
    if (!state) return;
    if (state.kind === "prompt") {
      setInputValue(state.options.defaultValue ?? "");
    }
  }, [state]);

  useEffect(() => {
    if (!state) return;
    const prevActive = document.activeElement as HTMLElement | null;
    const timer = window.setTimeout(() => {
      if (state.kind === "prompt") inputRef.current?.focus();
      else confirmBtnRef.current?.focus();
    }, 20);
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose({ ok: false });
      }
    }
    window.addEventListener("keydown", onKey);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("keydown", onKey);
      prevActive?.focus?.();
    };
  }, [state, onClose]);

  if (!state) return null;

  const { options } = state;
  const tone: DialogTone =
    options.tone ?? (state.kind === "alert" ? "info" : "default");

  const Icon = tone === "danger" ? AlertTriangle : tone === "info" ? Info : null;
  const iconColor =
    tone === "danger"
      ? "text-mdf-danger"
      : tone === "info"
        ? "text-mdf-info"
        : "text-mdf-fg-3";

  const confirmLabel =
    options.confirmLabel ??
    (state.kind === "alert"
      ? t("close")
      : state.kind === "prompt"
        ? t("confirm")
        : t("confirm"));

  const cancelLabel =
    "cancelLabel" in options && options.cancelLabel
      ? options.cancelLabel
      : t("cancel");

  const promptEmpty =
    state.kind === "prompt" &&
    (state.options.required ?? true) &&
    inputValue.trim().length === 0;

  function handleSubmit(e?: React.FormEvent) {
    e?.preventDefault();
    if (state?.kind === "prompt") {
      if ((state.options.required ?? true) && inputValue.trim().length === 0)
        return;
      onClose({ ok: true, value: inputValue });
    } else {
      onClose({ ok: true });
    }
  }

  const content = (
    <div
      className="fixed inset-0 z-[60] flex items-start justify-center bg-mdf-bg-overlay backdrop-blur-sm animate-in fade-in"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose({ ok: false });
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="mdf-confirm-title"
    >
      <form
        onSubmit={handleSubmit}
        className="mt-4 sm:mt-24 mx-3 sm:mx-0 w-full max-w-[calc(100vw-1.5rem)] sm:max-w-md rounded-[14px] border border-mdf-line-2 bg-mdf-bg-raised text-mdf-fg-1 p-5"
        style={{ boxShadow: "var(--mdf-shadow-modal)" }}
      >
        <div className="flex items-start gap-3">
          {Icon ? (
            <div
              className={`shrink-0 flex h-9 w-9 items-center justify-center rounded-full border border-mdf-line-2 ${iconColor}`}
              style={
                tone === "danger"
                  ? {
                      background:
                        "color-mix(in srgb, var(--mdf-danger) 10%, transparent)",
                    }
                  : tone === "info"
                    ? {
                        background:
                          "color-mix(in srgb, var(--mdf-info) 10%, transparent)",
                      }
                    : undefined
              }
            >
              <Icon size={18} strokeWidth={1.5} />
            </div>
          ) : null}
          <div className="min-w-0 flex-1">
            <h2
              id="mdf-confirm-title"
              className="text-mdf-fg-1"
              style={{
                fontFamily: "var(--mdf-font-display)",
                fontSize: "20px",
                lineHeight: 1.1,
                letterSpacing: "-0.01em",
              }}
            >
              {options.title}
            </h2>
            {options.description ? (
              <p className="mt-2 text-sm text-mdf-fg-2 leading-relaxed whitespace-pre-line">
                {options.description}
              </p>
            ) : null}
          </div>
        </div>

        {state.kind === "prompt" ? (
          <div className="mt-4">
            <input
              ref={inputRef}
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder={state.options.placeholder}
              className="w-full h-10 rounded-md border border-mdf-line-2 bg-mdf-bg-input text-mdf-fg-1 px-3 text-sm focus:outline-none focus:border-mdf-line-3"
            />
          </div>
        ) : null}

        <div className="mt-5 flex items-center justify-end gap-2">
          {state.kind !== "alert" ? (
            <Button
              type="button"
              variant="ghost"
              size="md"
              onClick={() => onClose({ ok: false })}
            >
              {cancelLabel}
            </Button>
          ) : null}
          <Button
            ref={confirmBtnRef}
            type="submit"
            variant={tone === "danger" ? "destructive-solid" : "default"}
            size="md"
            disabled={promptEmpty}
          >
            {confirmLabel}
          </Button>
        </div>
      </form>
    </div>
  );

  return content;
}
