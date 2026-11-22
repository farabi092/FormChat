"use client";

import { useState } from "react";
import ChatPanel, {
  type ChatConfig,
  type SubmitResult,
} from "@/components/chat-widget/chat-panel";
import { readableTextColor } from "@/lib/utils";

type FloatingChatProps = {
  config: ChatConfig;
  onSubmit?: (answers: Record<string, string>) => Promise<SubmitResult>;
  footnote?: string;
  defaultOpen?: boolean;
};

export default function FloatingChat({
  config,
  onSubmit,
  footnote,
  defaultOpen = false,
}: FloatingChatProps) {
  const [open, setOpen] = useState(defaultOpen);
  const textColor = readableTextColor(config.primaryColor);

  return (
    <>
      <div
        role="dialog"
        aria-label={config.title}
        className={
          open
            ? "fixed inset-0 z-50 sm:inset-auto sm:bottom-24 sm:right-5 sm:h-[560px] sm:max-h-[calc(100vh-7rem)] sm:w-[380px]"
            : "hidden"
        }
      >
        <ChatPanel
          config={config}
          onSubmit={onSubmit}
          footnote={footnote}
          visible={open}
          onClose={() => setOpen(false)}
          className="shadow-xl sm:rounded-2xl sm:border sm:border-border"
        />
      </div>

      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-label={open ? "Close chat" : "Open chat"}
        aria-expanded={open}
        className={`fixed bottom-5 right-5 z-50 h-14 w-14 items-center justify-center rounded-full shadow-lg transition hover:scale-105 ${
          open ? "hidden sm:flex" : "flex"
        }`}
        style={{ backgroundColor: config.primaryColor, color: textColor }}
      >
        {open ? (
          <svg
            width="22"
            height="22"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M18 6L6 18" />
            <path d="M6 6l12 12" />
          </svg>
        ) : (
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          </svg>
        )}
      </button>
    </>
  );
}