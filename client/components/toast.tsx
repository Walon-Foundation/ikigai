"use client";

import { AlertCircle, CheckCircle2, Info, X } from "lucide-react";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { cn } from "@/lib/utils";

// Transient feedback for things that just happened.
//
// Hand-rolled rather than pulled from radix-ui (which is already a dependency
// and does export Toast). Radix brings swipe gestures, focus management and a
// hotkey — roughly 10KB gzipped of behaviour a status message doesn't need —
// and this mounts in the PWA layout, so it lands on every screen. The people
// using this app pay for their bytes. This is the same idea in about a tenth
// of the size.
//
// A toast is the right tool only when the result of an action is somewhere the
// user isn't. Completing a task grows a tree on another page; saving a profile
// closes the form that would have shown the confirmation. Where a message can
// sit next to the thing it's about — a failed send with text to preserve, a
// form listing what's missing — inline is better, and those stay inline.

type ToastVariant = "success" | "error" | "info";

type Toast = {
  id: number;
  title: string;
  description?: string;
  variant: ToastVariant;
};

type ToastInput = {
  title: string;
  description?: string;
  variant?: ToastVariant;
};

const ToastContext = createContext<((t: ToastInput) => void) | null>(null);

/** Fires a toast. Safe to call from anywhere under ToastProvider. */
export function useToast() {
  const toast = useContext(ToastContext);
  if (!toast) {
    throw new Error("useToast must be used inside <ToastProvider>");
  }
  return toast;
}

// Errors linger: they usually mean something needs doing, and four seconds is
// not long enough to read one and decide.
const DURATION: Record<ToastVariant, number> = {
  success: 4_000,
  info: 5_000,
  error: 8_000,
};

const ICONS: Record<ToastVariant, React.ElementType> = {
  success: CheckCircle2,
  error: AlertCircle,
  info: Info,
};

const STYLES: Record<ToastVariant, string> = {
  success: "border-primary/40 bg-card",
  error: "border-destructive/40 bg-card",
  info: "border-border bg-card",
};

const ICON_STYLES: Record<ToastVariant, string> = {
  success: "text-primary",
  error: "text-destructive",
  info: "text-muted-foreground",
};

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const nextId = useRef(0);
  // Every pending dismissal, so unmount doesn't leave timers running against
  // a component that's gone.
  const timers = useRef(new Set<ReturnType<typeof setTimeout>>());

  useEffect(() => {
    const pending = timers.current;
    return () => {
      for (const t of pending) clearTimeout(t);
      pending.clear();
    };
  }, []);

  const dismiss = useCallback((id: number) => {
    setToasts((current) => current.filter((t) => t.id !== id));
  }, []);

  const toast = useCallback(
    ({ title, description, variant = "success" }: ToastInput) => {
      const id = nextId.current++;
      setToasts((current) => {
        const next = [...current, { id, title, description, variant }];
        // Three is enough to notice; a stack taller than that on a phone is a
        // wall, not a notification.
        return next.slice(-3);
      });

      const timer = setTimeout(() => {
        timers.current.delete(timer);
        dismiss(id);
      }, DURATION[variant]);
      timers.current.add(timer);
    },
    [dismiss],
  );

  // Stable so consumers holding it don't re-render on every toast.
  const value = useMemo(() => toast, [toast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      {/* Clears the bottom nav (64px) on mobile; the nav is gone at lg. */}
      <div className="pointer-events-none fixed inset-x-4 bottom-20 z-50 flex flex-col gap-2 lg:inset-x-auto lg:bottom-6 lg:right-6 lg:w-80">
        {toasts.map((t) => (
          <ToastItem key={t.id} toast={t} onDismiss={() => dismiss(t.id)} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

function ToastItem({
  toast,
  onDismiss,
}: {
  toast: Toast;
  onDismiss: () => void;
}) {
  const Icon = ICONS[toast.variant];
  const isError = toast.variant === "error";

  const body = (
    <div className="flex items-start gap-3">
      <Icon
        className={cn("mt-0.5 size-4 shrink-0", ICON_STYLES[toast.variant])}
      />
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-foreground">{toast.title}</p>
        {toast.description && (
          <p className="mt-0.5 text-xs text-muted-foreground">
            {toast.description}
          </p>
        )}
      </div>
      <button
        type="button"
        onClick={onDismiss}
        aria-label="Dismiss"
        className="shrink-0 text-muted-foreground hover:text-foreground"
      >
        <X className="size-4" />
      </button>
    </div>
  );

  const className = cn(
    "pointer-events-auto animate-fade-up rounded-2xl border p-4 shadow-lg",
    STYLES[toast.variant],
  );

  // An error is announced immediately; a success waits for a gap in whatever
  // the screen reader is already saying. role="alert" is assertive, <output> is
  // polite — the distinction is the whole point of having two.
  return isError ? (
    <div role="alert" className={className}>
      {body}
    </div>
  ) : (
    <output className={cn(className, "block")}>{body}</output>
  );
}
