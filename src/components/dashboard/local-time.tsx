"use client";

import { useSyncExternalStore } from "react";

const subscribe = () => () => {};

export default function LocalTime({ value }: { value: string }) {
  const text = useSyncExternalStore(
    subscribe,
    () =>
      new Date(value).toLocaleString(undefined, {
        dateStyle: "medium",
        timeStyle: "short",
      }),
    () => ""
  );

  return <time dateTime={value}>{text || "…"}</time>;
}