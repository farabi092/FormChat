import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import FormSettings from "@/components/dashboard/form-settings";
import SharePanel from "@/components/dashboard/share-panel";
import QuestionBuilder from "@/components/builder/question-builder";
import type { Question, QuestionType } from "@/types/database";

export const metadata = { title: "Edit form | FormChat" };

type QuestionRow = {
  id: string;
  type: QuestionType;
  label: string;
  required: boolean;
  options: unknown;
};

export default async function EditFormPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: form } = await supabase
    .from("forms")
    .select(
      "id, title, description, status, slug, welcome_message, completion_message, primary_color"
    )
    .eq("id", id)
    .single();

  if (!form) {
    notFound();
  }

  const { data: questionRows } = await supabase
    .from("questions")
    .select("id, type, label, required, options")
    .eq("form_id", id)
    .order("position", { ascending: true });

  const questions: Question[] = (
    (questionRows ?? []) as unknown as QuestionRow[]
  ).map((row) => ({
    id: row.id,
    type: row.type,
    label: row.label,
    required: row.required,
    options: Array.isArray(row.options)
      ? row.options.filter((o): o is string => typeof o === "string")
      : [],
  }));

  const isPublished = form.status === "published";

  return (
    <div className="mx-auto max-w-2xl">
      <Link
        href="/dashboard"
        className="text-sm text-muted transition hover:text-foreground"
      >
        &larr; Back to dashboard
      </Link>

      <div className="mt-3 flex flex-wrap items-center gap-3">
        <h1 className="truncate text-2xl font-semibold tracking-tight">
          Edit form
        </h1>
        <span
          className={`rounded-full px-2 py-0.5 text-xs font-medium ${
            isPublished
              ? "bg-green-100 text-green-700"
              : "bg-slate-100 text-slate-600"
          }`}
        >
          {isPublished ? "Published" : "Draft"}
        </span>
        <Link
          href={`/dashboard/forms/${form.id}/preview`}
          className="ml-auto rounded-lg border border-border bg-white px-3 py-1.5 text-sm font-medium transition hover:bg-slate-50"
        >
          Try the chatbot
        </Link>
      </div>

      <div className="mt-6">
        <SharePanel slug={form.slug} isPublished={isPublished} />
      </div>

      <div className="mt-6">
        <FormSettings mode="edit" form={form} />
      </div>

      <QuestionBuilder
        formId={form.id}
        initialQuestions={questions}
        isPublished={isPublished}
        primaryColor={form.primary_color}
        welcomeMessage={form.welcome_message}
      />
    </div>
  );
}