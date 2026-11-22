"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { createClient } from "@/lib/supabase/client";

type FormValues = {
  id: string;
  title: string;
  description: string | null;
  welcome_message: string;
  completion_message: string;
  primary_color: string;
};

type FormSettingsProps = {
  mode: "create" | "edit";
  form?: FormValues;
};

const DEFAULT_WELCOME = "Hi there! I have a few quick questions for you.";
const DEFAULT_COMPLETION = "Thanks! Your response has been recorded.";
const DEFAULT_COLOR = "#4f46e5";

export default function FormSettings({ mode, form }: FormSettingsProps) {
  const router = useRouter();
  const isEdit = mode === "edit" && !!form;

  const [title, setTitle] = useState(form?.title ?? "");
  const [description, setDescription] = useState(form?.description ?? "");
  const [welcome, setWelcome] = useState(form?.welcome_message ?? DEFAULT_WELCOME);
  const [completion, setCompletion] = useState(
    form?.completion_message ?? DEFAULT_COMPLETION
  );
  const [color, setColor] = useState(form?.primary_color ?? DEFAULT_COLOR);

  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setNotice(null);

    const cleanTitle = title.trim();
    const cleanWelcome = welcome.trim();
    const cleanCompletion = completion.trim();

    if (!cleanTitle) {
      setError("Please enter a form title.");
      return;
    }
    if (!cleanWelcome || !cleanCompletion) {
      setError("The welcome and completion messages cannot be empty.");
      return;
    }
    if (!/^#[0-9a-fA-F]{6}$/.test(color)) {
      setError("Please choose a valid color.");
      return;
    }

    setLoading(true);
    const supabase = createClient();

    const values = {
      title: cleanTitle,
      description: description.trim() || null,
      welcome_message: cleanWelcome,
      completion_message: cleanCompletion,
      primary_color: color,
    };

    if (isEdit && form) {
      const { data, error: dbError } = await supabase
        .from("forms")
        .update(values)
        .eq("id", form.id)
        .select("id");

      if (dbError || !data || data.length === 0) {
        setError(dbError?.message ?? "Could not save your changes.");
        setLoading(false);
        return;
      }

      setNotice("Changes saved.");
      setLoading(false);
      router.refresh();
      return;
    }

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setError("Your session has expired. Please log in again.");
      setLoading(false);
      return;
    }

    const { data: created, error: createError } = await supabase
      .from("forms")
      .insert({ ...values, user_id: user.id })
      .select("id")
      .single();

    if (createError || !created) {
      setError(createError?.message ?? "Could not create the form.");
      setLoading(false);
      return;
    }

    router.push(`/dashboard/forms/${created.id}/edit`);
    router.refresh();
  }

  const inputClass =
    "mt-1 block w-full rounded-lg border border-border bg-white px-3 py-2 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20";

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-5 rounded-xl border border-border bg-white p-6"
    >
      <div>
        <label htmlFor="title" className="text-sm font-medium">
          Form title
        </label>
        <input
          id="title"
          type="text"
          required
          maxLength={120}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g. Customer feedback"
          className={inputClass}
        />
      </div>

      <div>
        <label htmlFor="description" className="text-sm font-medium">
          Description <span className="font-normal text-muted">(optional)</span>
        </label>
        <textarea
          id="description"
          rows={3}
          maxLength={500}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className={inputClass}
        />
      </div>

      <div>
        <label htmlFor="welcome" className="text-sm font-medium">
          Welcome message
        </label>
        <textarea
          id="welcome"
          rows={2}
          maxLength={300}
          value={welcome}
          onChange={(e) => setWelcome(e.target.value)}
          className={inputClass}
        />
      </div>

      <div>
        <label htmlFor="completion" className="text-sm font-medium">
          Completion message
        </label>
        <textarea
          id="completion"
          rows={2}
          maxLength={300}
          value={completion}
          onChange={(e) => setCompletion(e.target.value)}
          className={inputClass}
        />
      </div>

      <div>
        <label htmlFor="color" className="text-sm font-medium">
          Primary color
        </label>
        <div className="mt-1 flex items-center gap-3">
          <input
            id="color"
            type="color"
            value={color}
            onChange={(e) => setColor(e.target.value)}
            className="h-10 w-14 cursor-pointer rounded-lg border border-border bg-white p-1"
          />
          <span className="text-sm text-muted">{color}</span>
        </div>
      </div>

      <div className="rounded-lg border border-border bg-slate-50 p-4">
        <p className="text-xs font-medium text-muted">Preview</p>
        <div className="mt-2 max-w-xs rounded-2xl rounded-bl-sm border border-border bg-white px-3 py-2 text-sm shadow-sm">
          {welcome.trim() || "Your welcome message appears here."}
        </div>
        <span
          className="mt-3 inline-block rounded-full px-3 py-1 text-xs font-medium text-white"
          style={{ backgroundColor: color }}
        >
          Start
        </span>
      </div>

      {error && (
        <p
          role="alert"
          className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
        >
          {error}
        </p>
      )}

      {notice && (
        <p
          role="status"
          className="rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-700"
        >
          {notice}
        </p>
      )}

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={loading}
          className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? "Please wait..." : isEdit ? "Save changes" : "Create form"}
        </button>
        <Link
          href="/dashboard"
          className="rounded-lg px-3 py-2 text-sm font-medium text-muted transition hover:text-foreground"
        >
          {isEdit ? "Back to dashboard" : "Cancel"}
        </Link>
      </div>
    </form>
  );
}