import { notFound } from "next/navigation";
import { connection } from "next/server";
import EmbedChat from "@/components/chat-widget/embed-chat";
import { getPublishedForm } from "@/lib/public-form";

export const metadata = { title: "Chat | FormChat" };

export default async function EmbedPage({
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
    <div className="h-dvh">
      <EmbedChat slug={form.slug} config={form.config} />
    </div>
  );
}