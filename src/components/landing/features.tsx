const features = [
  {
    title: "Conversational forms",
    description:
      "Respondents answer one question at a time in a friendly chat interface that is easy on mobile.",
    paths: ["M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"],
  },
  {
    title: "Flexible question types",
    description:
      "Short text, email, multiple choice, and yes/no questions, each required or optional.",
    paths: [
      "M9 11l3 3L22 4",
      "M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11",
    ],
  },
  {
    title: "Publish and share",
    description:
      "Every published form gets its own public link. Unpublish at any time to stop collecting responses.",
    paths: [
      "M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20z",
      "M2 12h20",
      "M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z",
    ],
  },
  {
    title: "Embed anywhere",
    description:
      "Copy one script tag onto any website to add a floating chat launcher in your brand color.",
    paths: ["M16 18l6-6-6-6", "M8 6l-6 6 6 6"],
  },
  {
    title: "Response dashboard",
    description:
      "See totals, browse every submission, and inspect individual answers with timestamps.",
    paths: ["M18 20V10", "M12 20V4", "M6 20v-6"],
  },
  {
    title: "Secure by design",
    description:
      "Your data is protected by row level security, and public submissions are validated on the server.",
    paths: ["M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"],
  },
];

export default function Features() {
  return (
    <section id="features" className="scroll-mt-16 py-20">
      <div className="mx-auto max-w-6xl px-4">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-semibold tracking-tight">
            Everything you need to collect answers
          </h2>
          <p className="mt-3 text-muted">
            A focused set of tools to build, publish, and manage forms without
            the clutter.
          </p>
        </div>

        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature) => (
            <div
              key={feature.title}
              className="rounded-xl border border-border bg-white p-6"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  {feature.paths.map((d) => (
                    <path key={d} d={d} />
                  ))}
                </svg>
              </div>
              <h3 className="mt-4 font-semibold">{feature.title}</h3>
              <p className="mt-2 text-sm text-muted">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}