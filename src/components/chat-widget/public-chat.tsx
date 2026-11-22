"use client";

import ChatPanel, {
  type ChatConfig,
} from "@/components/chat-widget/chat-panel";
import { submitAnswers } from "@/lib/submit-answers";

type PublicChatProps = {
  slug: string;
  config: ChatConfig;
  className?: string;
};

export default function PublicChat({
  slug,
  config,
  className,
}: PublicChatProps) {
  return (
    <ChatPanel
      config={config}
      onSubmit={(answers) => submitAnswers(slug, answers)}
      className={className}
    />
  );
}