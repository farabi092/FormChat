import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import LocalTime from "@/components/dashboard/local-time";

export const metadata = { title: "Response | FormChat" };

type QuestionRow = { id: string; label: string };
type AnswerRow = { question_id: string; value: string };

export default async function ResponseDetailPage({
  params,
}: {
  params: Promise<{ id: string; submissionId: string }>;
}) {
  const { id, submissionId } = await params;
  const supabase = await createClient();

  const { data: form } = await supabase
    .from("forms")
    .select("id, title")
    .eq("id", id)
    .single();

  if (!form) {
    notFound();
  }

  const { data: submission } = await supabase
    .from("submissions")
    .select("id, submitted_at")
    .eq("id", submissionId)
    .eq("form_id", id)
    .single();

  if (!submission) {
    notFound();
  }

  const { data: questionData } = await supabase
    .from("questions")
    .select("id, label")
    .eq("form_id", id)
    .order("position", { ascending: true });
  const questions = (questionData ?? []) as unknown as QuestionRow[];

  const { data: answerData } = await supabase
    .from("answers")
    .select("question_id, value")
    .eq("submission_id", submissionId);
  const answers = (answerData ?? []) as unknown as AnswerRow[];

  const valueByQuestion = new Map(answers.map((a) => [a.question_id, a.value]));

  return (
    <div className="mx-auto max-w-2xl">
      <Link
        href={`/dashboard/forms/${form.id}/responses`}
        className="text-sm text-muted transition hover:text-foreground"
      >
        &larr; Back to responses
      </Link>

      <h1 className="mt-3 text-2xl font-semibold tracking-tight">Response</h1>
      <p className="mt-1 text-sm text-muted">
        {form.title} · Submitted{" "}
        <LocalTime value={submission.submitted_at} />
      </p>
      <p className="mt-1 break-all text-xs text-muted">ID: {submission.id}</p>

      <dl className="mt-6 divide-y divide-border rounded-xl border border-border bg-white px-5">
        {questions.map((question) => {
          const value = valueByQuestion.get(question.id);
          return (
            <div key={question.id} className="py-4">
              <dt className="text-sm text-muted">{question.label}</dt>
              <dd className="mt-1 whitespace-pre-wrap break-words">
                {value ? (
                  value
                ) : (
                  <span className="italic text-muted">Not answered</span>
                )}
              </dd>
            </div>
          );
        })}
      </dl>
    </div>
  );
}