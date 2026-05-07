"use client";

import { useState, useTransition } from "react";
import { BookOpen, Lock, Users, Globe, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import { saveJournalEntry } from "./actions";

type Visibility = "private" | "mentor_only" | "community";

const VISIBILITY_OPTIONS: { value: Visibility; label: string; icon: React.ElementType }[] = [
  { value: "private", label: "Private", icon: Lock },
  { value: "mentor_only", label: "Mentor Only", icon: Users },
  { value: "community", label: "Community", icon: Globe },
];

const CONCERN_KEYWORDS = ["hurt myself", "end it", "give up", "no reason to"];

function checkKeywords(text: string): boolean {
  return CONCERN_KEYWORDS.some((kw) => text.toLowerCase().includes(kw));
}

type Entry = {
  id: string;
  content: string;
  visibility: string;
  keywordFlag: boolean;
  createdAt: string;
};

export function JournalClient({ initialEntries }: { initialEntries: Entry[] }) {
  const [entries, setEntries] = useState<Entry[]>(initialEntries);
  const [newContent, setNewContent] = useState("");
  const [visibility, setVisibility] = useState<Visibility>("private");
  const [showWarning, setShowWarning] = useState(false);
  const [saved, setSaved] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleContentChange(val: string) {
    setNewContent(val);
    setShowWarning(checkKeywords(val));
  }

  function handleSave() {
    if (!newContent.trim() || isPending) return;
    const content = newContent.trim();
    const keywordFlag = checkKeywords(content);

    // Optimistic update
    const optimistic: Entry = {
      id: `opt-${Date.now()}`,
      content,
      visibility,
      keywordFlag,
      createdAt: new Date().toISOString(),
    };
    setEntries((prev) => [optimistic, ...prev]);
    setNewContent("");
    setShowWarning(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);

    startTransition(async () => {
      await saveJournalEntry({ content, visibility, keywordFlag });
    });
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-6">
      <div className="mb-6 flex items-center gap-3">
        <BookOpen className="size-6 text-primary" />
        <div>
          <h1 className="font-display text-2xl font-black text-foreground">Journal</h1>
          <p className="text-sm text-muted-foreground">Your private space to reflect and grow</p>
        </div>
      </div>

      {/* New Entry */}
      <div className="mb-6 rounded-2xl border border-border bg-card p-5">
        <p className="mb-3 text-sm font-semibold text-foreground">New Entry</p>
        <textarea
          value={newContent}
          onChange={(e) => handleContentChange(e.target.value)}
          placeholder="What's on your mind today?"
          rows={4}
          className="w-full resize-none rounded-xl border border-border bg-background px-4 py-3 text-sm text-foreground outline-none focus:border-primary placeholder:text-muted-foreground"
        />

        {showWarning && (
          <div className="mt-3 flex items-start gap-3 rounded-xl border border-earth/30 bg-earth-light/10 p-3">
            <AlertTriangle className="mt-0.5 size-4 shrink-0 text-earth" />
            <div>
              <p className="text-sm font-semibold text-earth">Are you okay?</p>
              <p className="text-xs text-muted-foreground">
                It sounds like you might be going through something difficult.{" "}
                <a href="/safety/help" className="underline text-primary">
                  View crisis resources →
                </a>
              </p>
            </div>
          </div>
        )}

        <div className="mt-3 flex gap-2">
          {VISIBILITY_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setVisibility(opt.value)}
              className={cn(
                "flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-all",
                visibility === opt.value
                  ? "border-primary bg-primary-muted/20 text-primary"
                  : "border-border text-muted-foreground hover:border-primary/40"
              )}
            >
              <opt.icon className="size-3" />
              {opt.label}
            </button>
          ))}
        </div>

        <div className="mt-4 flex items-center gap-3">
          <button
            onClick={handleSave}
            disabled={!newContent.trim() || isPending}
            className="rounded-full bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary-light disabled:opacity-40"
          >
            {saved ? "Saved ✓" : isPending ? "Saving..." : "Save Entry"}
          </button>
          {newContent && (
            <button
              onClick={() => { setNewContent(""); setShowWarning(false); }}
              className="text-sm text-muted-foreground hover:text-foreground"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Past Entries */}
      <div>
        <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Past Entries
        </p>
        {entries.length === 0 ? (
          <div className="rounded-2xl border border-border bg-card p-8 text-center text-sm text-muted-foreground">
            No entries yet. Start writing above.
          </div>
        ) : (
          <div className="space-y-3">
            {entries.map((entry) => {
              const visOpt = VISIBILITY_OPTIONS.find((v) => v.value === entry.visibility);
              return (
                <div key={entry.id} className="rounded-2xl border border-border bg-card p-5">
                  <div className="mb-2 flex items-center gap-2 text-xs text-muted-foreground">
                    <span>
                      {new Date(entry.createdAt).toLocaleDateString("en-GB", {
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                      })}
                    </span>
                    <span>·</span>
                    {visOpt && (
                      <span className="flex items-center gap-1 rounded-full bg-muted px-2 py-0.5">
                        <visOpt.icon className="size-2.5" />
                        {visOpt.label}
                      </span>
                    )}
                    {entry.keywordFlag && (
                      <span className="flex items-center gap-1 rounded-full bg-earth-light/20 px-2 py-0.5 text-earth">
                        <AlertTriangle className="size-2.5" />
                        Flagged
                      </span>
                    )}
                  </div>
                  <p className="text-sm leading-relaxed text-foreground">{entry.content}</p>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
