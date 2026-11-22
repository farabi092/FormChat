"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Question, QuestionType } from "@/types/database";
import QuestionPreview from "@/components/builder/question-preview";

type QuestionBuilderProps = {
  formId: string;
  initialQuestions: Question[];
  isPublished: boolean;
  primaryColor: string;
  welcomeMessage: string;
};

const MAX_QUESTIONS = 30;
const MAX_OPTIONS = 10;

const TYPE_LABELS: Record<QuestionType, string> = {
  short_text: "Short text",
  email: "Email",
  multiple_choice: "Multiple choice",
  yes_no: "Yes / No",
};

const TYPES = Object.keys(TYPE_LABELS) as QuestionType[];

function normalize(q: Question): Question {
  return {
    ...q,
    label: q.label.trim(),
    options:
      q.type === "multiple_choice"
        ? q.options.map((o) => o.trim()).filter(Boolean)
        : [],
  };
}

function validate(list: Question[]): string | null {
  for (let i = 0; i < list.length; i++) {
    const q = list[i];
    const n = i + 1;

    if (!q.label) {
      return `Question ${n}: please enter the question text.`;
    }

    if (q.type === "multiple_choice") {
      if (q.options.length < 2) {
        return `Question ${n}: add at least 2 options.`;
      }
      const lower = q.options.map((o) => o.toLowerCase());
      if (new Set(lower).size !== lower.length) {
        return `Question ${n}: options must be different from each other.`;
      }
    }
  }
  return null;
}

export default function QuestionBuilder({
  formId,
  initialQuestions,
  isPublished,
  primaryColor,
  welcomeMessage,
}: QuestionBuilderProps) {
  const [questions, setQuestions] = useState<Question[]>(initialQuestions);
  const [saved, setSaved] = useState<Question[]>(initialQuestions);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);

  const dirty = useMemo(
    () => JSON.stringify(questions) !== JSON.stringify(saved),
    [questions, saved]
  );

  // Warn before closing or refreshing the tab with unsaved changes
  useEffect(() => {
    if (!dirty) return;
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [dirty]);

  function change(updater: (prev: Question[]) => Question[]) {
    setQuestions(updater);
    setNotice(null);
  }

  function addQuestion(type: QuestionType) {
    const newQuestion: Question = {
      id: crypto.randomUUID(),
      type,
      label: "",
      required: true,
      options: type === "multiple_choice" ? ["Option 1", "Option 2"] : [],
    };
    change((prev) =>
      prev.length >= MAX_QUESTIONS ? prev : [...prev, newQuestion]
    );
  }

  function updateQuestion(id: string, patch: Partial<Question>) {
    change((prev) => prev.map((q) => (q.id === id ? { ...q, ...patch } : q)));
  }

  function changeType(id: string, type: QuestionType) {
    change((prev) =>
      prev.map((q) => {
        if (q.id !== id) return q;
        const options =
          type === "multiple_choice" && q.options.length < 2
            ? ["Option 1", "Option 2"]
            : q.options;
        return { ...q, type, options };
      })
    );
  }

  function moveQuestion(index: number, direction: -1 | 1) {
    change((prev) => {
      const target = index + direction;
      if (target < 0 || target >= prev.length) return prev;
      const next = [...prev];
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  }

  function removeQuestion(id: string) {
    change((prev) => prev.filter((q) => q.id !== id));
  }

  function setOption(id: string, optionIndex: number, value: string) {
    change((prev) =>
      prev.map((q) =>
        q.id === id
          ? {
              ...q,
              options: q.options.map((o, i) => (i === optionIndex ? value : o)),
            }
          : q
      )
    );
  }

  function addOption(id: string) {
    change((prev) =>
      prev.map((q) =>
        q.id === id && q.options.length < MAX_OPTIONS
          ? { ...q, options: [...q.options, ""] }
          : q
      )
    );
  }

  function removeOption(id: string, optionIndex: number) {
    change((prev) =>
      prev.map((q) =>
        q.id === id
          ? { ...q, options: q.options.filter((_, i) => i !== optionIndex) }
          : q
      )
    );
  }

  async function handleSave() {
    setError(null);
    setNotice(null);

    const cleaned = questions.map(normalize);

    const problem = validate(cleaned);
    if (problem) {
      setError(problem);
      return;
    }

    if (isPublished && cleaned.length === 0) {
      setError(
        "A published form needs at least one question. Unpublish the form first if you want to remove them all."
      );
      return;
    }

    const removedIds = saved
      .filter((s) => !cleaned.some((q) => q.id === s.id))
      .map((s) => s.id);

    if (removedIds.length > 0) {
      const confirmed = window.confirm(
        `Saving will permanently delete ${removedIds.length} question(s) and any responses already collected for them. Continue?`
      );
      if (!confirmed) return;
    }

    setSaving(true);
    const supabase = createClient();

    try {
      const rows = cleaned.map((q, index) => ({
        id: q.id,
        form_id: formId,
        type: q.type,
        label: q.label,
        required: q.required,
        options: q.options,
        position: index,
      }));

      if (rows.length > 0) {
        const { data, error: upsertError } = await supabase
          .from("questions")
          .upsert(rows, { onConflict: "id" })
          .select("id");

        if (upsertError || !data || data.length !== rows.length) {
          setError(upsertError?.message ?? "Could not save the questions.");
          return;
        }
      }

      if (removedIds.length > 0) {
        const { data, error: deleteError } = await supabase
          .from("questions")
          .delete()
          .eq("form_id", formId)
          .in("id", removedIds)
          .select("id");

        if (deleteError || !data || data.length !== removedIds.length) {
          setError(
            deleteError?.message ?? "Could not remove the deleted questions."
          );
          return;
        }
      }

      setQuestions(cleaned);
      setSaved(cleaned);
      setNotice("Questions saved.");
    } catch {
      setError("Something went wrong while saving. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  const inputClass =
    "block w-full rounded-lg border border-border bg-white px-3 py-2 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20";
  const iconButtonClass =
    "flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-white text-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40";
  const atMax = questions.length >= MAX_QUESTIONS;

  return (
    <section aria-labelledby="questions-heading" className="mt-8">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h2
            id="questions-heading"
            className="text-lg font-semibold tracking-tight"
          >
            Questions
          </h2>
          <p className="mt-1 text-sm text-muted">
            Respondents see the questions in this order, one at a time.
          </p>
        </div>
        <span className="shrink-0 text-sm text-muted">
          {questions.length} / {MAX_QUESTIONS}
        </span>
      </div>

      {questions.length === 0 ? (
        <div className="mt-4 rounded-xl border border-dashed border-border bg-white p-8 text-center">
          <p className="font-medium">No questions yet</p>
          <p className="mt-1 text-sm text-muted">
            Add your first question using the buttons below.
          </p>
        </div>
      ) : (
        <ol className="mt-4 space-y-4">
          {questions.map((q, index) => (
            <li
              key={q.id}
              className="rounded-xl border border-border bg-white p-4"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                    {index + 1}
                  </span>
                  <label htmlFor={`type-${q.id}`} className="sr-only">
                    Question {index + 1} type
                  </label>
                  <select
                    id={`type-${q.id}`}
                    value={q.type}
                    onChange={(e) =>
                      changeType(q.id, e.target.value as QuestionType)
                    }
                    className="rounded-lg border border-border bg-white px-2 py-1.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                  >
                    {TYPES.map((type) => (
                      <option key={type} value={type}>
                        {TYPE_LABELS[type]}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => moveQuestion(index, -1)}
                    disabled={index === 0}
                    aria-label={`Move question ${index + 1} up`}
                    title="Move up"
                    className={iconButtonClass}
                  >
                    &uarr;
                  </button>
                  <button
                    type="button"
                    onClick={() => moveQuestion(index, 1)}
                    disabled={index === questions.length - 1}
                    aria-label={`Move question ${index + 1} down`}
                    title="Move down"
                    className={iconButtonClass}
                  >
                    &darr;
                  </button>
                  <button
                    type="button"
                    onClick={() => removeQuestion(q.id)}
                    aria-label={`Delete question ${index + 1}`}
                    title="Delete"
                    className="flex h-8 items-center justify-center rounded-lg border border-red-200 bg-white px-2 text-sm font-medium text-red-700 transition hover:bg-red-50"
                  >
                    Delete
                  </button>
                </div>
              </div>

              <div className="mt-3">
                <label
                  htmlFor={`label-${q.id}`}
                  className="text-sm font-medium"
                >
                  Question text
                </label>
                <input
                  id={`label-${q.id}`}
                  type="text"
                  maxLength={200}
                  value={q.label}
                  onChange={(e) =>
                    updateQuestion(q.id, { label: e.target.value })
                  }
                  placeholder="e.g. What is your name?"
                  className={`${inputClass} mt-1`}
                />
              </div>

              {q.type === "email" && (
                <p className="mt-2 text-xs text-muted">
                  Respondents must enter a valid email address.
                </p>
              )}

              {q.type === "yes_no" && (
                <p className="mt-2 text-xs text-muted">
                  Respondents choose between Yes and No.
                </p>
              )}

              {q.type === "multiple_choice" && (
                <div className="mt-3">
                  <p className="text-sm font-medium">Options</p>
                  <ul className="mt-2 space-y-2">
                    {q.options.map((option, optionIndex) => (
                      <li
                        key={optionIndex}
                        className="flex items-center gap-2"
                      >
                        <input
                          type="text"
                          maxLength={100}
                          value={option}
                          onChange={(e) =>
                            setOption(q.id, optionIndex, e.target.value)
                          }
                          aria-label={`Option ${optionIndex + 1} for question ${index + 1}`}
                          placeholder={`Option ${optionIndex + 1}`}
                          className={inputClass}
                        />
                        <button
                          type="button"
                          onClick={() => removeOption(q.id, optionIndex)}
                          disabled={q.options.length <= 2}
                          aria-label={`Remove option ${optionIndex + 1} from question ${index + 1}`}
                          title="Remove option"
                          className={iconButtonClass}
                        >
                          &times;
                        </button>
                      </li>
                    ))}
                  </ul>
                  <button
                    type="button"
                    onClick={() => addOption(q.id)}
                    disabled={q.options.length >= MAX_OPTIONS}
                    className="mt-2 text-sm font-medium text-primary hover:underline disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    + Add option
                  </button>
                </div>
              )}

              <label className="mt-4 flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={q.required}
                  onChange={(e) =>
                    updateQuestion(q.id, { required: e.target.checked })
                  }
                  className="h-4 w-4 rounded border-border accent-primary"
                />
                Required
              </label>
            </li>
          ))}
        </ol>
      )}

      <div className="mt-4 rounded-xl border border-border bg-white p-4">
        <p className="text-sm font-medium">Add a question</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {TYPES.map((type) => (
            <button
              key={type}
              type="button"
              onClick={() => addQuestion(type)}
              disabled={atMax}
              className="rounded-lg border border-border bg-white px-3 py-1.5 text-sm font-medium transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              + {TYPE_LABELS[type]}
            </button>
          ))}
        </div>
        {atMax && (
          <p className="mt-2 text-xs text-muted">
            You have reached the limit of {MAX_QUESTIONS} questions.
          </p>
        )}
      </div>

      {showPreview && (
        <div className="mt-4">
          <QuestionPreview
            questions={questions}
            welcomeMessage={welcomeMessage}
            primaryColor={primaryColor}
          />
        </div>
      )}

      <div className="sticky bottom-4 z-10 mt-6 rounded-xl border border-border bg-white/95 p-3 shadow-sm backdrop-blur">
        {error && (
          <p
            role="alert"
            className="mb-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
          >
            {error}
          </p>
        )}
        {notice && (
          <p
            role="status"
            className="mb-3 rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-700"
          >
            {notice}
          </p>
        )}

        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-muted">
            {dirty ? "You have unsaved changes." : "All changes saved."}
          </p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowPreview((value) => !value)}
              className="rounded-lg border border-border bg-white px-4 py-2 text-sm font-medium transition hover:bg-slate-50"
            >
              {showPreview ? "Hide preview" : "Preview"}
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={saving || !dirty}
              className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving ? "Saving..." : "Save questions"}
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}