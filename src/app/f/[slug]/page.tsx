import { notFound } from "next/navigation";
import { connection } from "next/server";
import PublicChat from "@/components/chat-widget/public-chat";
import { getPublishedForm } from "@/lib/public-form";

export const metadata = { title: "Form | FormChat" };

export default async function PublicFormPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  await connection();

  const { slug } = await params;
  const form = await getPublishedForm(slug);

  if (!form) {
    notFound();
  }

  return (
    <main className="flex min-h-dvh items-stretch justify-center sm:items-center sm:p-6">
      <div className="h-dvh w-full max-w-lg sm:h-[640px] sm:max-h-[calc(100dvh-3rem)]">
        <PublicChat
          slug={form.slug}
          config={form.config}
          className="sm:rounded-2xl sm:border sm:border-border sm:shadow-lg"
        />
      </div>
    </main>
  );
}