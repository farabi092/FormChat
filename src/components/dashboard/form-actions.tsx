"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { FormStatus } from "@/types/database";

type FormActionsProps = {
  formId: string;
  title: string;
  status: FormStatus;
};

export default function FormActions({
  formId,
  title,
  status,
}: FormActionsProps) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isPublished = status === "published";

  async function handleTogglePublish() {
    setBusy(true);
    setError(null);
    const supabase = createClient();

    // A form must have at least one question before it can be published
    if (!isPublished) {
      const { count, error: countError } = await supabase
        .from("questions")
        .select("id", { count: "exact", head: true })
        .eq("form_id", formId);

      if (countError) {
        setError(countError.message);
        setBusy(false);
        return;
      }

      if (!count) {
        setError("Add at least one question before publishing.");
        setBusy(false);
        return;
      }
    }

    const { data, error: dbError } = await supabase
      .from("forms")
      .update({
        status: isPublished ? "draft" : "published",
        published_at: isPublished ? null : new Date().toISOString(),
      })
      .eq("id", formId)
      .select("id");

    if (dbError || !data || data.length === 0) {
      setError(dbError?.message ?? "Could not update the form.");
      setBusy(false);
      return;
    }

    setBusy(false);
    router.refresh();
  }

  async function handleDelete() {
    const confirmed = window.confirm(
      `Delete "${title}"?\n\nThis also deletes its questions and responses. This cannot be undone.`
    );
    if (!confirmed) return;

    setBusy(true);
    setError(null);
    const supabase = createClient();

    const { data, error: dbError } = await supabase
      .from("forms")
      .delete()
      .eq("id", formId)
      .select("id");

    if (dbError || !data || data.length === 0) {
      setError(dbError?.message ?? "Could not delete the form.");
      setBusy(false);
      return;
    }

    setBusy(false);
    router.refresh();
  }

  const buttonClass =
    "rounded-lg border border-border bg-white px-3 py-1.5 text-sm font-medium transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60";

  return (
    <div className="flex flex-col gap-1 sm:items-end">
      <div className="flex flex-wrap items-center gap-2">
        <Link
          href={`/dashboard/forms/${formId}/responses`}
          className={buttonClass}
        >
          Responses
        </Link>
        <Link href={`/dashboard/forms/${formId}/edit`} className={buttonClass}>
          Edit
        </Link>
        <button
          type="button"
          onClick={handleTogglePublish}
          disabled={busy}
          className={buttonClass}
        >
          {isPublished ? "Unpublish" : "Publish"}
        </button>
        <button
          type="button"
          onClick={handleDelete}
          disabled={busy}
          className="rounded-lg border border-red-200 bg-white px-3 py-1.5 text-sm font-medium text-red-700 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
        >
          Delete
        </button>
      </div>
      {error && (
        <p role="alert" className="text-sm text-red-700">
          {error}
        </p>
      )}
    </div>
  );
}