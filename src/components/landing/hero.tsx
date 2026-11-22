import Link from "next/link";

export default function Hero() {
  return (
    <section className="border-b border-border bg-gradient-to-b from-indigo-50/60 to-background">
      <div className="mx-auto max-w-3xl px-4 py-20 text-center sm:py-28">
        <span className="inline-block rounded-full border border-border bg-white px-3 py-1 text-xs font-medium text-muted">
          Forms that feel like conversations
        </span>

        <h1 className="mt-6 text-4xl font-semibold tracking-tight sm:text-5xl">
          Collect responses with a chatbot, not a boring form
        </h1>

        <p className="mx-auto mt-5 max-w-xl text-base text-muted sm:text-lg">
          Build a form in minutes, publish it, and let visitors answer one
          question at a time. Share a link or embed it on any website with a
          single script.
        </p>

        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link
            href="/signup"
            className="w-full rounded-lg bg-primary px-6 py-3 text-sm font-medium text-white transition hover:opacity-90 sm:w-auto"
          >
            Get started free
          </Link>
          <a
            href="#demo"
            className="w-full rounded-lg border border-border bg-white px-6 py-3 text-sm font-medium transition hover:bg-slate-50 sm:w-auto"
          >
            See the demo
          </a>
        </div>
      </div>
    </section>
  );
}