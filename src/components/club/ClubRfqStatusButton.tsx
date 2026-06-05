"use client";

import { useFormStatus } from "react-dom";
import { closeRfqAction, reopenRfqAction } from "@/app/actions/rfq";

// Tiny client form — toggles the RFQ between OPEN and CLOSED. Used on the
// /club/rfqs list and (later) on the detail page.
export function ClubRfqStatusButton({
  rfqId,
  open,
  closeLabel,
  reopenLabel,
  confirmText,
}: {
  rfqId: string;
  open: boolean;
  closeLabel: string;
  reopenLabel: string;
  confirmText: string;
}) {
  const action = open ? closeRfqAction.bind(null, rfqId) : reopenRfqAction.bind(null, rfqId);
  return (
    <form
      action={action}
      onSubmit={(e) => {
        if (open && !confirm(confirmText)) e.preventDefault();
      }}
    >
      <SubmitBtn label={open ? closeLabel : reopenLabel} danger={open} />
    </form>
  );
}

function SubmitBtn({ label, danger }: { label: string; danger: boolean }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className={`text-xs font-semibold underline-offset-2 transition hover:underline disabled:opacity-50 ${
        danger ? "text-red-600 hover:text-red-700" : "text-[var(--color-pitch-700)]"
      }`}
    >
      {label}
    </button>
  );
}
