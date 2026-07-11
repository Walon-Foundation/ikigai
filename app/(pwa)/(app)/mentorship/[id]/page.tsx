"use client";

import { ChevronLeft, ClipboardList, Send } from "lucide-react";
import Link from "next/link";
import { use, useEffect, useRef, useState } from "react";
import { Avatar } from "@/components/avatar";
import { cn } from "@/lib/utils";

type Message = {
  id: string;
  content: string;
  senderName: string;
  timestamp: string;
  isMine: boolean;
};

type Peer = {
  name: string;
  avatarUrl: string | null;
  role: string;
};

type ThreadResponse = {
  peer: Peer;
  messages: Message[];
};

export default function MentorshipChatPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [messages, setMessages] = useState<Message[]>([]);
  const [peer, setPeer] = useState<Peer | null>(null);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  async function loadMessages() {
    try {
      const res = await fetch(`/api/messages/${id}`);
      if (res.ok) {
        const data: ThreadResponse = await res.json();
        setMessages(data.messages);
        setPeer(data.peer);
      }
    } catch {
      // ignore network errors
    }
  }

  // biome-ignore lint/correctness/useExhaustiveDependencies: loadMessages is stable; id is the only meaningful dep
  useEffect(() => {
    loadMessages();
    const interval = setInterval(loadMessages, 5000);
    return () => clearInterval(interval);
  }, [id]);

  // biome-ignore lint/correctness/useExhaustiveDependencies: messages triggers scroll-to-bottom, not a dep of the callback
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function sendMessage() {
    if (!input.trim() || sending) return;
    const content = input.trim();
    setInput("");
    setSending(true);

    setMessages((prev) => [
      ...prev,
      {
        id: `opt-${Date.now()}`,
        content,
        senderName: "You",
        timestamp: new Date().toISOString(),
        isMine: true,
      },
    ]);

    try {
      await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mentorshipId: id, content }),
      });
      await loadMessages();
    } finally {
      setSending(false);
    }
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
        <Avatar
          name={peer?.name ?? "…"}
          src={peer?.avatarUrl ?? null}
          size={36}
        />
        <div>
          <p className="text-sm font-semibold text-foreground">
            {peer?.name ?? "Mentorship"}
          </p>
          <p className="text-xs text-muted-foreground capitalize">
            {peer?.role ? `Your ${peer.role}` : "Mentorship Chat"}
          </p>
        </div>
        <Link
          href={`/mentorship/${id}/plan`}
          aria-label="Shared plan and milestones"
          className="ml-auto flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-xs font-semibold text-foreground hover:border-primary/40"
        >
          <ClipboardList className="size-4" /> Plan
        </Link>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-6 pb-24">
        {messages.length === 0 && (
          <p className="mt-8 text-center text-sm text-muted-foreground">
            No messages yet. Say hello!
          </p>
        )}
        <div className="space-y-4">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={cn(
                "flex",
                msg.isMine ? "justify-end" : "justify-start",
              )}
            >
              <div
                className={cn(
                  "max-w-[75%] rounded-2xl px-4 py-3 text-sm",
                  msg.isMine
                    ? "rounded-br-sm bg-primary text-primary-foreground"
                    : "rounded-bl-sm border border-border bg-card text-foreground",
                )}
              >
                <p>{msg.content}</p>
                <p
                  className={cn(
                    "mt-1 text-[10px]",
                    msg.isMine
                      ? "text-primary-muted/70"
                      : "text-muted-foreground",
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
          <div ref={bottomRef} />
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
            type="button"
            onClick={sendMessage}
            disabled={!input.trim() || sending}
            className="flex size-10 items-center justify-center rounded-full bg-primary text-primary-foreground disabled:opacity-40"
          >
            <Send className="size-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
