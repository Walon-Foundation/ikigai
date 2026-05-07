"use client";

import { use, useState } from "react";
import Link from "next/link";
import { ChevronLeft, Send } from "lucide-react";
import { cn } from "@/lib/utils";
import { MOCK_CHAT_MESSAGES, MOCK_MENTORSHIPS } from "@/lib/mock-data";

export default function MentorshipChatPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const mentorship = MOCK_MENTORSHIPS.find((m) => m.id === id) ?? MOCK_MENTORSHIPS[0];
  const [messages, setMessages] = useState(MOCK_CHAT_MESSAGES);
  const [input, setInput] = useState("");

  function sendMessage() {
    if (!input.trim()) return;
    setMessages((prev) => [
      ...prev,
      {
        id: `c${prev.length + 1}`,
        senderId: "u1",
        senderName: "Aminata Koroma",
        content: input.trim(),
        timestamp: new Date().toISOString(),
        isMine: true,
      },
    ]);
    setInput("");
  }

  return (
    <div className="flex h-screen flex-col bg-background">
      {/* Header */}
      <div className="flex items-center gap-3 border-b border-border bg-card px-4 py-3">
        <Link
          href="/mentorship"
          className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ChevronLeft className="size-4" />
        </Link>
        <div className="flex size-9 items-center justify-center rounded-full bg-primary-muted/30 font-display text-sm font-bold text-primary">
          DS
        </div>
        <div>
          <p className="text-sm font-semibold text-foreground">
            {mentorship.mentor.displayName}
          </p>
          <p className="text-xs text-muted-foreground">Mentor · Active</p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-6 pb-24">
        <div className="space-y-4">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={cn(
                "flex",
                msg.isMine ? "justify-end" : "justify-start"
              )}
            >
              <div
                className={cn(
                  "max-w-[75%] rounded-2xl px-4 py-3 text-sm",
                  msg.isMine
                    ? "rounded-br-sm bg-primary text-primary-foreground"
                    : "rounded-bl-sm bg-card border border-border text-foreground"
                )}
              >
                <p>{msg.content}</p>
                <p
                  className={cn(
                    "mt-1 text-[10px]",
                    msg.isMine
                      ? "text-primary-muted/70"
                      : "text-muted-foreground"
                  )}
                >
                  {new Date(msg.timestamp).toLocaleTimeString("en-GB", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Input */}
      <div className="fixed bottom-16 left-0 right-0 border-t border-border bg-card px-4 py-3">
        <div className="mx-auto flex max-w-2xl gap-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && sendMessage()}
            placeholder="Type a message..."
            className="flex-1 rounded-full border border-border bg-background px-4 py-2.5 text-sm outline-none focus:border-primary"
          />
          <button
            onClick={sendMessage}
            disabled={!input.trim()}
            className="flex size-10 items-center justify-center rounded-full bg-primary text-primary-foreground disabled:opacity-40"
          >
            <Send className="size-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
