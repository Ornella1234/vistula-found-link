import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Header } from "@/components/Header";
import { ItemCard } from "@/components/ItemCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sparkles, Search, Loader2, ArrowRight } from "lucide-react";
import { toast } from "sonner";
import logo from "@/assets/logo.png";
import type { Database } from "@/integrations/supabase/types";

type Item = Database["public"]["Tables"]["items"]["Row"];
type Hit = { item: Item; reason: string };

export const Route = createFileRoute("/ai-search")({
  component: AiSearchPage,
  head: () => ({
    meta: [
      { title: "AI Search — FoundIt" },
      {
        name: "description",
        content:
          "Type what you lost in your own words and we'll dig through the campus posts to find it.",
      },
    ],
  }),
});

// little prompts so people know what to type
const sampleQueries = [
  "I lost my black wallet near the library yesterday",
  "Anyone found a set of keys with a red keychain?",
  "Looking for a blue water bottle from the cafeteria",
];

function AiSearchPage() {
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [summary, setSummary] = useState<string | null>(null);
  const [hits, setHits] = useState<Hit[]>([]);
  const [didSearch, setDidSearch] = useState(false);

  async function doSearch(q: string) {
    const trimmed = q.trim();
    if (!trimmed) {
      toast.error("Type something first.");
      return;
    }

    setBusy(true);
    setSummary(null);
    setHits([]);
    setDidSearch(true);

    try {
      // pull the active posts so the AI has something to look through
      const { data: posts, error: postsError } = await supabase
        .from("items")
        .select("*")
        .eq("status", "active")
        .order("created_at", { ascending: false })
        .limit(200);

      if (postsError) throw postsError;
      if (!posts || posts.length === 0) {
        setSummary("Nothing's been posted yet.");
        return;
      }

      const { data, error } = await supabase.functions.invoke("ai-search", {
        body: { query: trimmed, items: posts },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      // map the IDs the AI gave back to the real post objects
      const lookup = new Map(posts.map((p) => [p.id, p]));
      const found: Hit[] = (data?.matches ?? [])
        .map((m: { id: string; reason: string }) => {
          const item = lookup.get(m.id);
          return item ? { item, reason: m.reason } : null;
        })
        .filter(Boolean) as Hit[];

      setHits(found);
      setSummary(typeof data?.summary === "string" ? data.summary : null);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Search didn't work, try again.");
    } finally {
      setBusy(false);
    }
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    void doSearch(text);
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <div className="container mx-auto px-4 py-10 sm:px-6 sm:py-16">
        {/* google-ish header with our logo */}
        <div className="mx-auto flex max-w-2xl flex-col items-center text-center">
          <img src={logo} alt="FoundIt" className="h-20 w-20 sm:h-24 sm:w-24" />
          <h1 className="mt-4 text-3xl font-extrabold tracking-tight sm:text-4xl">
            FoundIt <span className="text-primary">AI Search</span>
          </h1>
          <p className="mt-2 max-w-md text-sm text-muted-foreground sm:text-base">
            Just describe what you're after — we'll go through every active post on campus.
          </p>

          <form
            onSubmit={handleSubmit}
            className="mt-6 flex w-full items-center gap-2 rounded-full border border-border bg-card p-2 shadow-sm focus-within:ring-2 focus-within:ring-primary"
          >
            <Search className="ml-3 h-5 w-5 shrink-0 text-muted-foreground" />
            <Input
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="e.g. black iPhone lost in the library on Monday"
              className="flex-1 border-0 bg-transparent text-base shadow-none focus-visible:ring-0"
              disabled={busy}
            />
            <Button type="submit" size="lg" className="rounded-full font-semibold" disabled={busy}>
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
              <span className="ml-1.5 hidden sm:inline">{busy ? "Searching" : "Search"}</span>
            </Button>
          </form>

          {!didSearch && (
            <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
              {sampleQueries.map((q) => (
                <button
                  key={q}
                  type="button"
                  onClick={() => {
                    setText(q);
                    void doSearch(q);
                  }}
                  className="rounded-full border border-border bg-surface px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:border-primary hover:text-foreground"
                  disabled={busy}
                >
                  {q}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* results */}
        <div className="mx-auto mt-10 max-w-5xl">
          {busy && (
            <div className="flex flex-col items-center gap-3 py-12 text-muted-foreground">
              <Loader2 className="h-6 w-6 animate-spin" />
              <p className="text-sm">Going through the posts…</p>
            </div>
          )}

          {!busy && didSearch && summary && (
            <div className="mb-6 flex items-start gap-3 rounded-xl border border-primary/20 bg-primary-soft/50 p-4">
              <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
              <p className="text-sm text-foreground">{summary}</p>
            </div>
          )}

          {!busy && didSearch && hits.length === 0 && summary && (
            <div className="rounded-xl border border-dashed border-border bg-surface p-10 text-center">
              <h3 className="text-lg font-semibold">Nothing matched</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Try wording it differently, or post your lost item so others can keep an eye out.
              </p>
              <Link to="/report" search={{ type: "lost" }} className="mt-4 inline-block">
                <Button className="font-semibold">
                  Report a lost item <ArrowRight className="ml-1 h-4 w-4" />
                </Button>
              </Link>
            </div>
          )}

          {!busy && hits.length > 0 && (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {hits.map(({ item, reason }) => (
                <div key={item.id} className="space-y-2">
                  <ItemCard item={item} />
                  <p className="px-1 text-xs italic text-muted-foreground">
                    <span className="font-semibold not-italic text-primary">Why: </span>
                    {reason}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
