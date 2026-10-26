"use client";
import { useFormStatus } from "react-dom";
import { LoaderCircle } from "lucide-react";
export function ActionButton({
  children,
  pendingLabel = "Saving…",
  className = "button small",
  ariaLabel,
  iconOnly = false,
}: {
  children: React.ReactNode;
  pendingLabel?: string;
  className?: string;
  ariaLabel?: string;
  iconOnly?: boolean;
}) {
  const { pending } = useFormStatus();
  return (
    <button
      className={className}
      disabled={pending}
      aria-label={pending ? pendingLabel : ariaLabel}
      aria-busy={pending}
    >
      {pending ? (
        <>
          <LoaderCircle size={15} className="pending-spinner" />
          <span className={iconOnly ? "sr-only" : undefined}>
            {pendingLabel}
          </span>
        </>
      ) : (
        children
      )}
    </button>
  );
}
