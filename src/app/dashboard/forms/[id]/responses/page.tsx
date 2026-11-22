import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import LocalTime from "@/components/dashboard/local-time";

export const metadata = { title: "Responses | FormChat" };

const PAGE_SIZE = 20;

type SubmissionRow = { id: string; submitted_at: string };
type QuestionRow = { id: string; label: string };
type AnswerRow = { submission_id: string; question_id: string; value: string };

export default async function ResponsesPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ page?: string }>;
}) {
  const { id } = await params;
  const { page: pageParam } = await searchParams;

  const parsedPage = Number.parseInt(pageParam ?? "1", 10);
  const page = Number.isFinite(parsedPage) && parsedPage > 0 ? parsedPage : 1;

  const supabase = await createClient();

  const { data: form } = await supabase
    .from("forms")
    .select("id, title")
    .eq("id", id)
    .single();

  if (!form) {
    notFound();
  }

  const base = `/dashboard/forms/${form.id}/responses`;
  const from = (page - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

  const {
    data: submissionData,
    count,
    error,
  } = await supabase
    .from("submissions")
    .select("id, submitted_at", { count: "exact" })
    .eq("form_id", id)
    .order("submitted_at", { ascending: false })
    .range(from, to);

  // A page number past the end of the list: go back to the first page
  if (error && page > 1) {
    redirect(base);
  }

  const submissions = (submissionData ?? []) as unknown as SubmissionRow[];
  const total = count ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const { data: questionData } = await supabase
    .from("questions")
    .select("id, label")
    .eq("form_id", id)
    .order("position", { ascending: true });
  const questions = (questionData ?? []) as unknown as QuestionRow[];

  let answers: AnswerRow[] = [];
  if (submissions.length > 0) {
    const { data: answerData } = await supabase
      .from("answers")
      .select("submission_id, question_id, value")
      .in(
        "submission_id",
        submissions.map((s) => s.id)
      );
    answers = (answerData ?? []) as unknown as AnswerRow[];
  }

  // submission id -> (question id -> answer)
  const bySubmission = new Map<string, Map<string, string>>();
  for (const a of answers) {
    const map = bySubmission.get(a.submission_id) ?? new Map<string, string>();
    map.set(a.question_id, a.value);
    bySubmission.set(a.submission_id, map);
  }

  function previewFor(submissionId: string): string {
    const map = bySubmission.get(submissionId);
    if (!map) return "No answers";
    for (const q of questions) {
      const value = map.get(q.id);
      if (value) return `${q.label}: ${value}`;
    }
    return "No answers";
  }

  return (
    <div className="mx-auto max-w-3xl">
      <Link
        href="/dashboard"
        className="text-sm text-muted transition hover:text-foreground"
      >
        &larr; Back to dashboard
      </Link>

      <div className="mt-3 flex flex-wrap items-end justify-between gap-3">
        <div className="min-w-0">
          <h1 className="truncate text-2xl font-semibold tracking-tight">
            Responses
          </h1>
          <p className="mt-1 text-sm text-muted">
            {form.title} · {total} {total === 1 ? "response" : "responses"}
          </p>
        </div>
        <Link
          href={`/dashboard/forms/${form.id}/edit`}
          className="rounded-lg border border-border bg-white px-3 py-1.5 text-sm font-medium transition hover:bg-slate-50"
        >
          Edit form
        </Link>
      </div>

      {error ? (
        <p
          role="alert"
          className="mt-6 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
        >
          Could not load responses: {error.message}
        </p>
      ) : total === 0 ? (
        <div className="mt-6 rounded-xl border border-dashed border-border bg-white p-10 text-center">
          <p className="font-medium">No responses yet</p>
          <p className="mt-1 text-sm text-muted">
            Publish the form and share its link or embed code to start
            collecting responses.
          </p>
        </div>
      ) : (
        <>
          <ul className="mt-6 divide-y divide-border overflow-hidden rounded-xl border border-border bg-white">
            {submissions.map((submission, i) => (
              <li key={submission.id}>
                <Link
                  href={`${base}/${submission.id}`}
                  className="flex items-center justify-between gap-4 p-4 transition hover:bg-slate-50"
                >
                  <div className="min-w-0">
                    <p className="font-medium">
                      Response #{total - from - i}
                    </p>
                    <p className="mt-1 truncate text-sm text-muted">
                      {previewFor(submission.id)}
                    </p>
                  </div>
                  <span className="shrink-0 text-sm text-muted">
                    <LocalTime value={submission.submitted_at} />
                  </span>
                </Link>
              </li>
            ))}
          </ul>

          {totalPages > 1 && (
            <nav
              aria-label="Pagination"
              className="mt-4 flex items-center justify-between text-sm"
            >
              {page > 1 ? (
                <Link
                  href={`${base}?page=${page - 1}`}
                  className="rounded-lg border border-border bg-white px-3 py-1.5 font-medium transition hover:bg-slate-50"
                >
                  &larr; Newer
                </Link>
              ) : (
                <span />
              )}
              <span className="text-muted">
                Page {page} of {totalPages}
              </span>
              {page < totalPages ? (
                <Link
                  href={`${base}?page=${page + 1}`}
                  className="rounded-lg border border-border bg-white px-3 py-1.5 font-medium transition hover:bg-slate-50"
                >
                  Older &rarr;
                </Link>
              ) : (
                <span />
              )}
            </nav>
          )}
        </>
      )}
    </div>
  );
}