"use client";

import { AlertCircle, ChevronLeft, ClipboardList, Send } from "lucide-react";
import Link from "next/link";
import { use, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Avatar } from "@/components/avatar";
import { Spinner } from "@/components/spinner";
import { cn } from "@/lib/utils";

const POLL_MS = 5000;

type Message = {
  id: string;
  content: string;
  senderName: string;
  timestamp: string;
  isMine: boolean;
  // Set only on messages this client is still trying to deliver. A message from
  // the server is, by definition, sent.
  status?: "sending" | "failed";
};

type Peer = {
  name: string;
  avatarUrl: string | null;
  role: string;
};

type ThreadResponse = {
  peer?: Peer;
  messages: Message[];
  // Opaque: the id of the newest message the server has given us. We hand it
  // straight back on the next poll and never try to derive it ourselves.
  cursor: string | null;
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
  const [loading, setLoading] = useState(true);
  const bottomRef = useRef<HTMLDivElement>(null);

  // The server's cursor, handed back verbatim on the next poll. We never derive
  // it ourselves: it identifies a message by id, and only the database can
  // compare against that message's true created_at (a Postgres timestamp keeps
  // microseconds; a JS Date would silently floor them away and make every poll
  // re-fetch the last message forever). A ref, not state — updating it must not
  // trigger a re-render.
  const cursor = useRef<string | null>(null);

  const mergeServerMessages = useCallback((incoming: Message[]) => {
    if (incoming.length === 0) return;
    setMessages((prev) => {
      const incomingIds = new Set(incoming.map((m) => m.id));

      // A poll can race a send: the server may hand back a message whose
      // optimistic bubble is still on screen under a local id, which would
      // show the sent message twice. Match those by content, consuming one
      // echo per bubble so sending the same text twice still leaves two.
      const echoes = incoming.filter((m) => m.isMine).map((m) => m.content);

      const kept: Message[] = [];
      for (const m of prev) {
        if (incomingIds.has(m.id)) continue;
        if (m.status === "sending") {
          const i = echoes.indexOf(m.content);
          if (i !== -1) {
            echoes.splice(i, 1);
            continue;
          }
        }
        kept.push(m);
      }
      return [...kept, ...incoming];
    });
  }, []);

  const poll = useCallback(async () => {
    try {
      const url = cursor.current
        ? `/api/messages/${id}?after=${cursor.current}`
        : `/api/messages/${id}`;
      const res = await fetch(url);
      if (!res.ok) return;
      const data: ThreadResponse = await res.json();
      if (data.peer) setPeer(data.peer);
      mergeServerMessages(data.messages);
      if (data.cursor) cursor.current = data.cursor;
    } catch {
      // A dropped poll is not worth surfacing — the next one recovers.
    } finally {
      setLoading(false);
    }
  }, [id, mergeServerMessages]);

  useEffect(() => {
    poll();
    let timer: ReturnType<typeof setInterval> | null = null;

    // Polling a hidden tab burns the mobile data and battery of users on metered
    // connections for updates nobody is looking at. Stop while backgrounded and
    // catch up immediately on return.
    const start = () => {
      if (timer === null) timer = setInterval(poll, POLL_MS);
    };
    const stop = () => {
      if (timer !== null) {
        clearInterval(timer);
        timer = null;
      }
    };
    const onVisibility = () => {
      if (document.hidden) {
        stop();
      } else {
        poll();
        start();
      }
    };

    if (!document.hidden) start();
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      stop();
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [poll]);

  // Render order, which is not the same as arrival order.
  //
  // Delivered messages sort by the server's clock — the only clock both parties
  // share. Messages still in flight always sit at the bottom regardless of their
  // timestamp: that timestamp came from the sender's device, and a phone with a
  // skewed clock would otherwise drop its own message into the middle of the
  // history. It also stops a bubble from visibly jumping position when the
  // server finally echoes it back with a real timestamp.
  const ordered = useMemo(() => {
    const delivered = messages
      .filter((m) => !m.status)
      .sort((a, b) => a.timestamp.localeCompare(b.timestamp));
    const inFlight = messages.filter((m) => m.status);
    return [...delivered, ...inFlight];
  }, [messages]);

  // Follow the conversation only when it actually grows. Keying this on the
  // message count rather than the array means a poll that returns nothing no
  // longer yanks the view back to the bottom every few seconds.
  // biome-ignore lint/correctness/useExhaustiveDependencies: scrolls on new messages; the array identity itself is not a dep
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  // Local ids currently being POSTed. A ref, not state: two taps on "retry" can
  // both run before React re-renders, so a state flag would not have flipped in
  // time to stop the second — and a double send inserts two real rows, leaving a
  // permanent duplicate in the thread. The guard has to live somewhere that
  // updates synchronously.
  const inFlight = useRef<Set<string>>(new Set());

  const deliver = useCallback(
    async (localId: string, content: string) => {
      if (inFlight.current.has(localId)) return;
      inFlight.current.add(localId);
      try {
        const res = await fetch("/api/messages", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ mentorshipId: id, content }),
        });
        if (!res.ok) throw new Error(`Send failed: ${res.status}`);
        const saved: Message = await res.json();

        // Swap the optimistic bubble for the persisted row in place, so it keeps
        // its position and the list doesn't jump. If a poll already raced us and
        // merged this message, the bubble is gone and this is a no-op.
        setMessages((prev) =>
          prev.map((m) => (m.id === localId ? { ...saved, isMine: true } : m)),
        );
        // Deliberately not advancing the cursor here: only the server moves it,
        // and it can't know about this message until a poll asks. The next poll
        // will hand our own message back, and the id dedup above drops it.
      } catch {
        // Mark it, don't drop it: silently removing the bubble (or leaving it
        // looking sent) would tell the user a message went through when it did
        // not. They keep the text and can retry.
        setMessages((prev) =>
          prev.map((m) => (m.id === localId ? { ...m, status: "failed" } : m)),
        );
      } finally {
        inFlight.current.delete(localId);
      }
    },
    [id],
  );

  async function sendMessage() {
    const content = input.trim();
    if (!content || sending) return;
    setInput("");
    setSending(true);

    const localId = `local-${crypto.randomUUID()}`;
    setMessages((prev) => [
      ...prev,
      {
        id: localId,
        content,
        senderName: "You",
        timestamp: new Date().toISOString(),
        isMine: true,
        status: "sending",
      },
    ]);

    await deliver(localId, content);
    setSending(false);
  }

  function retry(msg: Message) {
    setMessages((prev) =>
      prev.map((m) => (m.id === msg.id ? { ...m, status: "sending" } : m)),
    );
    deliver(msg.id, msg.content);
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
        {loading && (
          <p className="mt-8 flex items-center justify-center gap-2 text-sm text-muted-foreground">
            <Spinner className="size-4" />
            Loading conversation…
          </p>
        )}
        {!loading && messages.length === 0 && (
          <p className="mt-8 text-center text-sm text-muted-foreground">
            No messages yet. Say hello!
          </p>
        )}
        <div className="space-y-4">
          {ordered.map((msg) => (
            <div
              key={msg.id}
              className={cn(
                "flex",
                msg.isMine ? "justify-end" : "justify-start",
              )}
            >
              <div className="max-w-[75%]">
                <div
                  className={cn(
                    "rounded-2xl px-4 py-3 text-sm transition-opacity",
                    msg.isMine
                      ? "rounded-br-sm bg-primary text-primary-foreground"
                      : "rounded-bl-sm border border-border bg-card text-foreground",
                    // Un-delivered messages read as provisional rather than sent.
                    msg.status === "sending" && "opacity-60",
                    msg.status === "failed" &&
                      "bg-destructive/10 text-foreground",
                  )}
                >
                  <p>{msg.content}</p>
                  <p
                    className={cn(
                      "mt-1 flex items-center gap-1 text-[10px]",
                      msg.isMine && msg.status !== "failed"
                        ? "text-primary-muted/70"
                        : "text-muted-foreground",
                    )}
                  >
                    {msg.status === "sending" ? (
                      <>
                        <Spinner className="size-2.5" />
                        Sending…
                      </>
                    ) : (
                      new Date(msg.timestamp).toLocaleTimeString("en-GB", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })
                    )}
                  </p>
                </div>
                {msg.status === "failed" && (
                  <button
                    type="button"
                    onClick={() => retry(msg)}
                    className="mt-1 flex items-center gap-1 text-[11px] font-semibold text-destructive hover:underline"
                  >
                    <AlertCircle className="size-3" />
                    Not sent — tap to retry
                  </button>
                )}
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
            aria-busy={sending}
            aria-label={sending ? "Sending message" : "Send message"}
            className="flex size-10 items-center justify-center rounded-full bg-primary text-primary-foreground disabled:opacity-40"
          >
            {sending ? (
              <Spinner className="size-4" />
            ) : (
              <Send className="size-4" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
