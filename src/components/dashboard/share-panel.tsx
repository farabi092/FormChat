"use client";

import { useState, useSyncExternalStore } from "react";

type SharePanelProps = {
  slug: string;
  isPublished: boolean;
};

const subscribe = () => () => {};

export default function SharePanel({ slug, isPublished }: SharePanelProps) {
  // The site address (e.g. http://localhost:3000), read in the browser
  const origin = useSyncExternalStore(
    subscribe,
    () => window.location.origin,
    () => ""
  );
  const [copied, setCopied] = useState<"link" | "embed" | null>(null);

  const publicUrl = `${origin}/f/${slug}`;
  const embedCode = `<script src="${origin}/widget.js" data-form="${slug}" defer></script>`;

  async function copy(text: string, which: "link" | "embed") {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(which);
      setTimeout(() => setCopied(null), 2000);
    } catch {
      setCopied(null);
    }
  }

  const fieldClass =
    "block w-full rounded-lg border border-border bg-slate-50 px-3 py-2 font-mono text-xs text-slate-800 outline-none";
  const copyClass =
    "shrink-0 rounded-lg border border-border bg-white px-3 py-1.5 text-sm font-medium transition hover:bg-slate-50";

  if (!isPublished) {
    return (
      <section
        aria-labelledby="share-heading"
        className="rounded-xl border border-dashed border-border bg-white p-5"
      >
        <h2 id="share-heading" className="font-semibold tracking-tight">
          Share and embed
        </h2>
        <p className="mt-1 text-sm text-muted">
          This form is a draft. Publish it from the dashboard to get its public
          link and embed code.
        </p>
      </section>
    );
  }

  return (
    <section
      aria-labelledby="share-heading"
      className="space-y-5 rounded-xl border border-border bg-white p-5"
    >
      <div>
        <h2 id="share-heading" className="font-semibold tracking-tight">
          Share and embed
        </h2>
        <p className="mt-1 text-sm text-muted">
          Anyone with these can use your form. Unpublish the form to turn them
          off.
        </p>
      </div>

      <div>
        <label htmlFor="public-url" className="text-sm font-medium">
          Public link
        </label>
        <div className="mt-1 flex items-center gap-2">
          <input
            id="public-url"
            type="text"
            readOnly
            value={publicUrl}
            onFocus={(e) => e.currentTarget.select()}
            className={fieldClass}
          />
          <button
            type="button"
            onClick={() => copy(publicUrl, "link")}
            className={copyClass}
          >
            {copied === "link" ? "Copied" : "Copy"}
          </button>
        </div>
        <a
          href={`/f/${slug}`}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-2 inline-block text-sm font-medium text-primary hover:underline"
        >
          Open public page
        </a>
      </div>

      <div>
        <label htmlFor="embed-code" className="text-sm font-medium">
          Embed code
        </label>
        <p className="mt-1 text-xs text-muted">
          Paste this just before the closing &lt;/body&gt; tag of any web page.
        </p>
        <div className="mt-2 flex items-start gap-2">
          <textarea
            id="embed-code"
            readOnly
            rows={3}
            value={embedCode}
            onFocus={(e) => e.currentTarget.select()}
            className={`${fieldClass} resize-none`}
          />
          <button
            type="button"
            onClick={() => copy(embedCode, "embed")}
            className={copyClass}
          >
            {copied === "embed" ? "Copied" : "Copy"}
          </button>
        </div>
      </div>
    </section>
  );
}