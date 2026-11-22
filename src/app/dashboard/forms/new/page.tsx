import FormSettings from "@/components/dashboard/form-settings";

export const metadata = { title: "New form | FormChat" };

export default function NewFormPage() {
  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="text-2xl font-semibold tracking-tight">Create a form</h1>
      <p className="mt-1 text-sm text-muted">
        Start with the basics. You will add questions in the next step.
      </p>
      <div className="mt-6">
        <FormSettings mode="create" />
      </div>
    </div>
  );
}