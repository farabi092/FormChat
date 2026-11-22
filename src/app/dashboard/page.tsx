import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import FormActions from "@/components/dashboard/form-actions";
import type { FormStatus } from "@/types/database";

type FormRow = {
  id: string;
  title: string;
  description: string | null;
  status: FormStatus;
  updated_at: string;
  submissions: { count: number }[];
};

function formatDate(value: string) {
  return new Date(value).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default async function DashboardPage() {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("forms")
    .select("id, title, description, status, updated_at, submissions(count)")
    .order("updated_at", { ascending: false });

  const forms = (data ?? []) as unknown as FormRow[];
  const responseCount = (form: FormRow) => form.submissions?.[0]?.count ?? 0;

  const totalForms = forms.length;
  const publishedForms = forms.filter((f) => f.status === "published").length;
  const totalResponses = forms.reduce((sum, f) => sum + responseCount(f), 0);

  const stats = [
    { label: "Total forms", value: totalForms },
    { label: "Published", value: publishedForms },
    { label: "Total responses", value: totalResponses },
  ];

  return (
    <div>
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
          <p className="mt-1 text-sm text-muted">
            Create forms, publish them, and track responses.
          </p>
        </div>
        <Link
          href="/dashboard/forms/new"
          className="shrink-0 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white transition hover:opacity-90"
        >
          New form
        </Link>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="rounded-xl border border-border bg-white p-5"
          >
            <p className="text-sm text-muted">{stat.label}</p>
            <p className="mt-1 text-3xl font-semibold tracking-tight">
              {stat.value}
            </p>
          </div>
        ))}
      </div>

      <h2 className="mt-10 text-lg font-semibold tracking-tight">Your forms</h2>

      {error ? (
        <p
          role="alert"
          className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
        >
          Could not load your forms: {error.message}
        </p>
      ) : forms.length === 0 ? (
        <div className="mt-4 rounded-xl border border-dashed border-border bg-white p-10 text-center">
          <p className="font-medium">No forms yet</p>
          <p className="mt-1 text-sm text-muted">
            Create your first form to get started.
          </p>
          <Link
            href="/dashboard/forms/new"
            className="mt-4 inline-block rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white transition hover:opacity-90"
          >
            Create a form
          </Link>
        </div>
      ) : (
        <ul className="mt-4 divide-y divide-border rounded-xl border border-border bg-white">
          {forms.map((form) => {
            const count = responseCount(form);
            const isPublished = form.status === "published";

            return (
              <li
                key={form.id}
                className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <Link
                      href={`/dashboard/forms/${form.id}/edit`}
                      className="truncate font-medium hover:underline"
                    >
                      {form.title}
                    </Link>
                    <span
                      className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${
                        isPublished
                          ? "bg-green-100 text-green-700"
                          : "bg-slate-100 text-slate-600"
                      }`}
                    >
                      {isPublished ? "Published" : "Draft"}
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-muted">
                    {count} {count === 1 ? "response" : "responses"} · Updated{" "}
                    {formatDate(form.updated_at)}
                  </p>
                </div>

                <FormActions
                  formId={form.id}
                  title={form.title}
                  status={form.status}
                />
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}