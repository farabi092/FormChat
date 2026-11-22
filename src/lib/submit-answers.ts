import type { SubmitResult } from "@/components/chat-widget/chat-panel";

export async function submitAnswers(
  slug: string,
  answers: Record<string, string>
): Promise<SubmitResult> {
  const fallback = "We could not send your answers. Please try again.";

  try {
    const res = await fetch(
      `/api/public/forms/${encodeURIComponent(slug)}/submit`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answers }),
      }
    );

    if (res.ok) return { ok: true };

    let message = fallback;
    try {
      const data = await res.json();
      if (typeof data?.error === "string") message = data.error;
    } catch {
      // The response had no JSON body; keep the generic message
    }
    return { ok: false, error: message };
  } catch {
    return {
      ok: false,
      error: "Network error. Please check your connection and try again.",
    };
  }
}