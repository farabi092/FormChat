"use client";

import {
  Fragment,
  useEffect,
  useRef,
  useState,
  type FormEvent,
} from "react";
import type { Question } from "@/types/database";
import { validateAnswer, MAX_TEXT_LENGTH } from "@/lib/validation";
import { readableTextColor } from "@/lib/utils";

export type ChatConfig = {
  title: string;
  welcomeMessage: string;
  completionMessage: string;
  primaryColor: string;
  questions: Question[];
};

export type SubmitResult = { ok: boolean; error?: string };

type ChatPanelProps = {
  config: ChatConfig;
  // Called with the finished answers (question id -> value).
  // If omitted, the chat runs in preview mode and nothing is sent anywhere.
  onSubmit?: (answers: Record<string, string>) => Promise<SubmitResult>;
  footnote?: string;
  onClose?: () => void;
  visible?: boolean;
  className?: string;
};

type Status = "active" | "submitting" | "error" | "done";

function BotBubble({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex">
      <div className="max-w-[85%] break-words rounded-2xl rounded-bl-sm bg-slate-100 px-3 py-2 text-sm text-slate-900">
        {children}
      </div>
    </div>
  );
}

function UserBubble({
  children,
  background,
  color,
}: {
  children: React.ReactNode;
  background: string;
  color: string;
}) {
  return (
    <div className="flex justify-end">
      <div
        className="max-w-[85%] break-words rounded-2xl rounded-br-sm px-3 py-2 text-sm"
        style={{ backgroundColor: background, color }}
      >
        {children}
      </div>
    </div>
  );
}

export default function ChatPanel({
  config,
  onSubmit,
  footnote,
  onClose,
  visible = true,
  className = "",
}: ChatPanelProps) {
  const { questions, primaryColor } = config;
  const textColor = readableTextColor(primaryColor);

  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [status, setStatus] = useState<Status>("active");
  const [text, setText] = useState("");
  const [fieldError, setFieldError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const listRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const current: Question | undefined = questions[index];
  const isTextQuestion =
    status === "active" &&
    !!current &&
    (current.type === "short_text" || current.type === "email");

  // Keep the newest message in view (scrolls only the chat, never the page)
  useEffect(() => {
    const el = listRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [index, status, fieldError, visible]);

  // Focus the next text box after each answer (not on the very first question,
  // so the demo does not pop up a keyboard as soon as the page loads)
  useEffect(() => {
    if (index === 0) return;
    inputRef.current?.focus({ preventScroll: true });
  }, [index, status]);

  async function sendAnswers(finalAnswers: Record<string, string>) {
    // Skipped optional questions are left out
    const payload = Object.fromEntries(
      Object.entries(finalAnswers).filter(([, value]) => value !== "")
    );

    if (!onSubmit) {
      setStatus("done");
      return;
    }

    setStatus("submitting");
    setSubmitError(null);

    try {
      const result = await onSubmit(payload);
      if (result.ok) {
        setStatus("done");
      } else {
        setSubmitError(
          result.error ?? "We could not send your answers. Please try again."
        );
        setStatus("error");
      }
    } catch {
      setSubmitError("We could not send your answers. Please try again.");
      setStatus("error");
    }
  }

  function answer(raw: string) {
    if (status !== "active" || !current) return;

    const result = validateAnswer(current, raw);
    if (!result.ok) {
      setFieldError(result.error);
      return;
    }

    const next = { ...answers, [current.id]: result.value };
    setAnswers(next);
    setText("");
    setFieldError(null);
    setIndex(index + 1);

    if (index + 1 >= questions.length) {
      void sendAnswers(next);
    }
  }

  function handleTextSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    answer(text);
  }

  function restart() {
    setIndex(0);
    setAnswers({});
    setStatus("active");
    setText("");
    setFieldError(null);
    setSubmitError(null);
  }

  const optionClass =
    "rounded-lg border-2 bg-white px-3 py-2 text-sm font-medium text-slate-900 transition hover:bg-slate-50";
  const headerButtonClass =
    "flex h-8 w-8 items-center justify-center rounded-lg text-lg transition hover:bg-black/10 disabled:cursor-not-allowed disabled:opacity-40";

  return (
    <div
      className={`flex h-full w-full flex-col overflow-hidden bg-white ${className}`}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between gap-2 px-4 py-3"
        style={{ backgroundColor: primaryColor, color: textColor }}
      >
        <p className="truncate text-sm font-semibold">{config.title}</p>
        <div className="flex shrink-0 items-center gap-1">
          <button
            type="button"
            onClick={restart}
            disabled={status === "submitting"}
            aria-label="Restart conversation"
            title="Restart"
            className={headerButtonClass}
          >
            &#8635;
          </button>
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              aria-label="Close chat"
              title="Close"
              className={headerButtonClass}
            >
              &times;
            </button>
          )}
        </div>
      </div>

      {/* Conversation */}
      <div
        ref={listRef}
        role="log"
        aria-live="polite"
        className="flex-1 space-y-3 overflow-y-auto p-4"
      >
        <BotBubble>{config.welcomeMessage}</BotBubble>

        {questions.length === 0 && (
          <BotBubble>This form has no questions yet.</BotBubble>
        )}

        {questions.slice(0, index).map((q) => (
          <Fragment key={q.id}>
            <BotBubble>{q.label}</BotBubble>
            <UserBubble background={primaryColor} color={textColor}>
              {answers[q.id] ? (
                answers[q.id]
              ) : (
                <span className="italic opacity-80">Skipped</span>
              )}
            </UserBubble>
          </Fragment>
        ))}

        {status === "active" && current && (
          <BotBubble>
            {current.label}
            {!current.required && (
              <span className="ml-1 text-xs text-slate-500">(optional)</span>
            )}
          </BotBubble>
        )}

        {status === "submitting" && <BotBubble>Sending your answers...</BotBubble>}

        {status === "error" && (
          <BotBubble>
            <span role="alert">{submitError}</span>
          </BotBubble>
        )}

        {status === "done" && <BotBubble>{config.completionMessage}</BotBubble>}
      </div>

      {/* Input area */}
      <div className="border-t border-border bg-white p-3">
        {status === "active" && current && (
          <div className="space-y-2">
            {current.type === "yes_no" && (
              <div className="flex gap-2">
                {["Yes", "No"].map((label) => (
                  <button
                    key={label}
                    type="button"
                    onClick={() => answer(label)}
                    style={{ borderColor: primaryColor }}
                    className={`${optionClass} flex-1`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            )}

            {current.type === "multiple_choice" && (
              <div className="flex max-h-48 flex-col gap-2 overflow-y-auto">
                {current.options.map((option) => (
                  <button
                    key={option}
                    type="button"
                    onClick={() => answer(option)}
                    style={{ borderColor: primaryColor }}
                    className={`${optionClass} w-full break-words text-left`}
                  >
                    {option}
                  </button>
                ))}
              </div>
            )}

            {isTextQuestion && (
              <form
                key={current.id}
                onSubmit={handleTextSubmit}
                noValidate
                className="flex gap-2"
              >
                <input
                  ref={inputRef}
                  type={current.type === "email" ? "email" : "text"}
                  autoComplete={current.type === "email" ? "email" : "off"}
                  maxLength={MAX_TEXT_LENGTH}
                  value={text}
                  onChange={(e) => {
                    setText(e.target.value);
                    setFieldError(null);
                  }}
                  aria-label={current.label}
                  aria-invalid={fieldError ? true : undefined}
                  placeholder={
                    current.type === "email"
                      ? "name@example.com"
                      : "Type your answer"
                  }
                  className="min-w-0 flex-1 rounded-lg border border-border bg-white px-3 py-2 text-base text-slate-900 outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
                />
                <button
                  type="submit"
                  className="shrink-0 rounded-lg px-4 py-2 text-sm font-medium transition hover:opacity-90"
                  style={{ backgroundColor: primaryColor, color: textColor }}
                >
                  Send
                </button>
              </form>
            )}

            {fieldError && (
              <p role="alert" className="text-sm text-red-700">
                {fieldError}
              </p>
            )}

            {!current.required && (
              <button
                type="button"
                onClick={() => answer("")}
                className="text-sm font-medium text-slate-500 hover:text-slate-900 hover:underline"
              >
                Skip this question
              </button>
            )}
          </div>
        )}

        {status === "submitting" && (
          <p className="text-sm text-slate-500">Please wait...</p>
        )}

        {status === "error" && (
          <button
            type="button"
            onClick={() => void sendAnswers(answers)}
            className="w-full rounded-lg px-4 py-2 text-sm font-medium transition hover:opacity-90"
            style={{ backgroundColor: primaryColor, color: textColor }}
          >
            Try again
          </button>
        )}

        {status === "done" && (
          <div className="space-y-2">
            {footnote && <p className="text-xs text-slate-500">{footnote}</p>}
            <button
              type="button"
              onClick={restart}
              className="text-sm font-medium text-slate-500 hover:text-slate-900 hover:underline"
            >
              Start over
            </button>
          </div>
        )}
      </div>
    </div>
  );
}