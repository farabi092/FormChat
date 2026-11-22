import type { Question } from "@/types/database";

type QuestionPreviewProps = {
  questions: Question[];
  welcomeMessage: string;
  primaryColor: string;
};

function Bubble({ children }: { children: React.ReactNode }) {
  return (
    <div className="max-w-[85%] rounded-2xl rounded-bl-sm bg-slate-100 px-3 py-2 text-sm">
      {children}
    </div>
  );
}

export default function QuestionPreview({
  questions,
  welcomeMessage,
  primaryColor,
}: QuestionPreviewProps) {
  const pillStyle = { borderColor: primaryColor, color: primaryColor };
  const pillClass =
    "rounded-full border bg-white px-3 py-1 text-sm font-medium";
  const inputClass =
    "w-full rounded-lg border border-border bg-slate-50 px-3 py-2 text-sm";

  return (
    <div className="rounded-xl border border-border bg-slate-50 p-4">
      <p className="text-xs font-medium text-muted">
        Preview (includes your unsaved question edits)
      </p>

      <div className="mx-auto mt-3 max-w-sm space-y-5 rounded-2xl border border-border bg-white p-4 shadow-sm">
        <Bubble>{welcomeMessage}</Bubble>

        {questions.length === 0 ? (
          <p className="text-sm text-muted">
            Add a question to see it appear here.
          </p>
        ) : (
          questions.map((q, index) => (
            <div key={q.id} className="space-y-2">
              <Bubble>
                {q.label.trim() ? (
                  q.label
                ) : (
                  <span className="italic text-muted">
                    Question {index + 1} has no text yet
                  </span>
                )}
                {!q.required && (
                  <span className="ml-1 text-xs text-muted">(optional)</span>
                )}
              </Bubble>

              {(q.type === "short_text" || q.type === "email") && (
                <input
                  type="text"
                  disabled
                  aria-label={`Answer for question ${index + 1}`}
                  placeholder={
                    q.type === "email" ? "name@example.com" : "Type your answer"
                  }
                  className={inputClass}
                />
              )}

              {q.type === "yes_no" && (
                <div className="flex flex-wrap gap-2">
                  {["Yes", "No"].map((label) => (
                    <button
                      key={label}
                      type="button"
                      disabled
                      style={pillStyle}
                      className={pillClass}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              )}

              {q.type === "multiple_choice" && (
                <div className="flex flex-wrap gap-2">
                  {q.options
                    .filter((option) => option.trim())
                    .map((option, optionIndex) => (
                      <button
                        key={optionIndex}
                        type="button"
                        disabled
                        style={pillStyle}
                        className={pillClass}
                      >
                        {option}
                      </button>
                    ))}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}