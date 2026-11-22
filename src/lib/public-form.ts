import { createAdminClient } from "@/lib/supabase/admin";
import type { ChatConfig } from "@/components/chat-widget/chat-panel";
import type { Question, QuestionType } from "@/types/database";

const SLUG_PATTERN = /^[a-z0-9]{6,40}$/i;

type QuestionRow = {
  id: string;
  type: QuestionType;
  label: string;
  required: boolean;
  options: unknown;
};

export type PublicForm = {
  formId: string;
  slug: string;
  config: ChatConfig;
};

export async function getPublishedForm(
  slug: string
): Promise<PublicForm | null> {
  if (!SLUG_PATTERN.test(slug)) return null;

  const supabase = createAdminClient();

  const { data: form, error } = await supabase
    .from("forms")
    .select(
      "id, slug, title, welcome_message, completion_message, primary_color"
    )
    .eq("slug", slug)
    .eq("status", "published")
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!form) return null;

  const { data: questionRows, error: questionsError } = await supabase
    .from("questions")
    .select("id, type, label, required, options")
    .eq("form_id", form.id)
    .order("position", { ascending: true });

  if (questionsError) throw new Error(questionsError.message);

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

  return {
    formId: form.id,
    slug: form.slug,
    
    config: {
      title: form.title,
      welcomeMessage: form.welcome_message,
      completionMessage: form.completion_message,
      primaryColor: form.primary_color,
      questions,
    },
  };
}