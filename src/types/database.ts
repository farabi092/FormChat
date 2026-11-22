export type FormStatus = "draft" | "published";

export type QuestionType =
  | "short_text"
  | "email"
  | "multiple_choice"
  | "yes_no";

export type Question = {
  id: string;
  type: QuestionType;
  label: string;
  required: boolean;
  options: string[];
};