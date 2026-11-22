const steps = [
  {
    title: "Build your form",
    description:
      "Add a title, choose your questions, and set which ones are required.",
  },
  {
    title: "Customize the chatbot",
    description:
      "Write a welcome and completion message and pick your primary color.",
  },
  {
    title: "Publish and embed",
    description:
      "Publish to get a public link and a script tag you can paste into any website.",
  },
  {
    title: "Review responses",
    description:
      "Watch submissions arrive in your dashboard and open each one for details.",
  },
];

export default function HowItWorks() {
  return (
    <section
      id="how-it-works"
      className="scroll-mt-16 border-y border-border bg-white py-20"
    >
      <div className="mx-auto max-w-6xl px-4">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-semibold tracking-tight">
            How it works
          </h2>
          <p className="mt-3 text-muted">From idea to live form in four steps.</p>
        </div>

        <ol className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {steps.map((step, index) => (
            <li key={step.title}>
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-sm font-semibold text-white">
                {index + 1}
              </span>
              <h3 className="mt-4 font-semibold">{step.title}</h3>
              <p className="mt-2 text-sm text-muted">{step.description}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}