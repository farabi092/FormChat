import ChatPanel, {
  type ChatConfig,
} from "@/components/chat-widget/chat-panel";

// A sample form for the demo. Visitors have no form of their own, so this one
// lives in code. Answers entered here are never stored.
const demoConfig: ChatConfig = {
  title: "FormChat demo",
  welcomeMessage:
    "Hi there! This is a demo of the chatbot your respondents will see.",
  completionMessage: "Thanks for trying the demo!",
  primaryColor: "#4f46e5",
  questions: [
    {
      id: "demo-name",
      type: "short_text",
      label: "What is your name?",
      required: true,
      options: [],
    },
    {
      id: "demo-email",
      type: "email",
      label: "What is your email address?",
      required: true,
      options: [],
    },
    {
      id: "demo-source",
      type: "multiple_choice",
      label: "How did you hear about us?",
      required: true,
      options: ["Search engine", "Social media", "A friend", "Other"],
    },
    {
      id: "demo-updates",
      type: "yes_no",
      label: "Would you like product updates?",
      required: false,
      options: [],
    },
  ],
};

export default function DemoSection() {
  return (
    <section id="demo" className="scroll-mt-16 py-20">
      <div className="mx-auto max-w-6xl px-4">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-semibold tracking-tight">
            Try the chatbot
          </h2>
          <p className="mt-3 text-muted">
            This is the experience your respondents will have. Go ahead and
            answer the questions.
          </p>
        </div>

        <div className="mx-auto mt-10 h-[520px] max-w-md">
          <ChatPanel
            config={demoConfig}
            footnote="This is a sample form. Your answers were not saved."
            className="rounded-2xl border border-border shadow-lg"
          />
        </div>
      </div>
    </section>
  );
}