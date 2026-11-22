"use client";

import ChatPanel, {
  type ChatConfig,
} from "@/components/chat-widget/chat-panel";
import { submitAnswers } from "@/lib/submit-answers";

type EmbedChatProps = {
  slug: string;
  config: ChatConfig;
};

export default function EmbedChat({ slug, config }: EmbedChatProps) {
  function handleClose() {
    // Tells widget.js (running on the host website) to close the panel
    window.parent.postMessage({ type: "formchat:close" }, "*");
  }

  return (
    <ChatPanel
      config={config}
      onClose={handleClose}
      onSubmit={(answers) => submitAnswers(slug, answers)}
    />
  );
}