import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import FloatingChat from "@/components/chat-widget/floating-chat";
import type { ChatConfig } from "@/components/chat-widget/chat-panel";
import type { Question, QuestionType } from "@/types/database";

export const metadata = { title: "Chatbot preview | FormChat" };

type QuestionRow = {
  id: string;
  type: QuestionType;
  label: string;
  required: boolean;
  options: unknown;
};

export default async function PreviewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: form } = await supabase
    .from("forms")
    .select("id, title, welcome_message, completion_message, primary_color")
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

  const config: ChatConfig = {
    title: form.title,
    welcomeMessage: form.welcome_message,
    completionMessage: form.completion_message,
    primaryColor: form.primary_color,
    questions,
  };

  return (
    <div className="mx-auto max-w-2xl">
      <Link
        href={`/dashboard/forms/${form.id}/edit`}
        className="text-sm text-muted transition hover:text-foreground"
      >
        &larr; Back to editor
      </Link>

      <h1 className="mt-3 text-2xl font-semibold tracking-tight">
        Chatbot preview
      </h1>
      <p className="mt-1 text-sm text-muted">
        Click the chat button in the bottom-right corner to try{" "}
        <span className="font-medium text-foreground">{form.title}</span> the
        way your respondents will see it.
      </p>

      <ul className="mt-6 list-disc space-y-1 rounded-xl border border-border bg-white py-4 pl-8 pr-4 text-sm text-muted">
        <li>This preview uses the last saved version of your form.</li>
        <li>Responses entered here are not saved.</li>
        <li>
          To change the color or messages, edit the form, save, and reload this
          page.
        </li>
      </ul>

      <FloatingChat
        config={config}
        footnote="Preview only. Your answers were not saved."
      />
    </div>
  );
}