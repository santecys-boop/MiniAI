import React from "react";
import { Msg } from "../types";
import { MessageItem } from "./MessageItem";

export type MessageListProps = {
  messages: Msg[];
  isLoading?: boolean;
  welcomeText: string;
  welcomeDone: boolean;
  chatEndRef: React.RefObject<HTMLDivElement | null>;
  onImageClick?: (url: string) => void;
};

export function MessageList({ messages, isLoading, welcomeText, welcomeDone, chatEndRef, onImageClick }: MessageListProps) {
  if (messages.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] px-4 select-none">
        <h2 className="text-[22px] font-semibold text-stone-900 text-center tracking-tight">
          {welcomeText}
          {!welcomeDone && (
            <span className="inline-block w-[2px] h-[1.1em] bg-stone-900 ml-0.5 align-middle animate-pulse" />
          )}
        </h2>
      </div>
    );
  }
  return (
    <div className="space-y-3">
      {messages.map((m, i) => (
        <MessageItem key={i} message={m} isStreaming={!!isLoading && i === messages.length - 1} onImageClick={onImageClick} />
      ))}
      <div ref={chatEndRef} />
    </div>
  );
}
