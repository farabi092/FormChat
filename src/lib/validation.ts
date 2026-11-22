import type { Question } from "@/types/database";

export const MAX_TEXT_LENGTH = 500;
const MAX_EMAIL_LENGTH = 254;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export type AnswerCheck =
  | { ok: true; value: string }
  | { ok: false; error: string };

export function validateAnswer(
  question: Pick<Question, "type" | "required" | "options">,
  rawValue: string
): AnswerCheck {
  const value = rawValue.trim();

  if (value === "") {
    if (question.required) {
      return { ok: false, error: "This question is required." };
    }
    return { ok: true, value: "" };
  }

  switch (question.type) {
    case "short_text":
      if (value.length > MAX_TEXT_LENGTH) {
        return {
          ok: false,
          error: `Please keep your answer under ${MAX_TEXT_LENGTH} characters.`,
        };
      }
      return { ok: true, value };

    case "email":
      if (value.length > MAX_EMAIL_LENGTH || !EMAIL_PATTERN.test(value)) {
        return { ok: false, error: "Please enter a valid email address." };
      }
      return { ok: true, value };

    case "multiple_choice":
      if (!question.options.includes(value)) {
        return { ok: false, error: "Please choose one of the options." };
      }
      return { ok: true, value };

    case "yes_no":
      if (value !== "Yes" && value !== "No") {
        return { ok: false, error: "Please choose Yes or No." };
      }
      return { ok: true, value };

    default:
      return { ok: false, error: "Unsupported question type." };
  }
}