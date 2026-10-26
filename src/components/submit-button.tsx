"use client";
import { useFormStatus } from "react-dom";
import { ArrowRight, LoaderCircle } from "lucide-react";
export function SubmitButton({
  children,
  pendingLabel,
  disabled = false,
}: {
  children: React.ReactNode;
  pendingLabel: string;
  disabled?: boolean;
}) {
  const { pending } = useFormStatus();
  return (
    <button
      className="button"
      disabled={disabled || pending}
      aria-busy={pending}
    >
      {pending ? pendingLabel : children}
      {pending ? (
        <LoaderCircle size={17} className="pending-spinner" />
      ) : (
        <ArrowRight size={17} />
      )}
    </button>
  );
}
