import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import { getPublishedForm, type PublicForm } from "@/lib/public-form";
import { validateAnswer } from "@/lib/validation";
import { getClientIp, rateLimit } from "@/lib/rate-limit";

const MAX_BODY_BYTES = 20_000;

const bodySchema = z.object({
  answers: z.record(z.string(), z.string()),
});

function reply(
  body: Record<string, unknown>,
  status: number,
  extraHeaders: Record<string, string> = {}
) {
  return NextResponse.json(body, {
    status,
    headers: { "Cache-Control": "no-store", ...extraHeaders },
  });
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const ip = getClientIp(request);

  // 1. Rate limits: per visitor overall, and per visitor per form
  const overall = rateLimit(`ip:${ip}`, 60, 60 * 60 * 1000);
  const perForm = rateLimit(`form:${ip}:${slug.slice(0, 40)}`, 10, 10 * 60 * 1000);
  if (!overall.ok || !perForm.ok) {
    const retryAfter = Math.max(overall.retryAfter, perForm.retryAfter);
    return reply(
      { error: "Too many submissions. Please try again later." },
      429,
      { "Retry-After": String(retryAfter) }
    );
  }

  // 2. Body size limit
  const declared = Number(request.headers.get("content-length") ?? "0");
  if (declared > MAX_BODY_BYTES) {
    return reply({ error: "Request too large." }, 413);
  }

  let raw: string;
  try {
    raw = await request.text();
  } catch {
    return reply({ error: "Invalid request." }, 400);
  }
  if (raw.length > MAX_BODY_BYTES) {
    return reply({ error: "Request too large." }, 413);
  }

  // 3. Shape of the request
  let json: unknown;
  try {
    json = JSON.parse(raw);
  } catch {
    return reply({ error: "Invalid request." }, 400);
  }

  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return reply({ error: "Invalid request." }, 400);
  }
  const { answers } = parsed.data;

  // 4. Only published forms accept submissions
  let form: PublicForm | null;
  try {
    form = await getPublishedForm(slug);
  } catch {
    return reply({ error: "Server error. Please try again." }, 500);
  }

  if (!form) {
    return reply({ error: "This form is no longer accepting responses." }, 404);
  }

  const { questions } = form.config;
  if (questions.length === 0) {
    return reply({ error: "This form has no questions." }, 400);
  }

  // 5. Reject answers for questions that do not belong to this form
  const known = new Set(questions.map((q) => q.id));
  if (Object.keys(answers).some((key) => !known.has(key))) {
    return reply({ error: "Invalid request." }, 400);
  }

  // 6. Validate every question with the same rules the browser uses
  const rows: { question_id: string; value: string }[] = [];
  for (const question of questions) {
    const result = validateAnswer(question, answers[question.id] ?? "");
    if (!result.ok) {
      return reply({ error: `${question.label}: ${result.error}` }, 400);
    }
    if (result.value !== "") {
      rows.push({ question_id: question.id, value: result.value });
    }
  }

  if (rows.length === 0) {
    return reply({ error: "Please answer at least one question." }, 400);
  }

  // 7. Save the submission and its answers
  try {
    const supabase = createAdminClient();

    const { data: submission, error: submissionError } = await supabase
      .from("submissions")
      .insert({ form_id: form.formId })
      .select("id")
      .single();

    if (submissionError || !submission) {
      return reply({ error: "Could not save your answers." }, 500);
    }

    const { error: answersError } = await supabase
      .from("answers")
      .insert(rows.map((row) => ({ submission_id: submission.id, ...row })));

    if (answersError) {
      // Do not leave an empty submission behind
      await supabase.from("submissions").delete().eq("id", submission.id);
      return reply({ error: "Could not save your answers." }, 500);
    }

    return reply({ ok: true }, 201);
  } catch {
    return reply({ error: "Server error. Please try again." }, 500);
  }
}