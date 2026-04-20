import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Header } from "@/components/Header";
import { ItemCard } from "@/components/ItemCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowRight, Search, MapPin, Sparkles } from "lucide-react";
import heroImg from "@/assets/hero-items.jpg";
import type { Database } from "@/integrations/supabase/types";

type Item = Database["public"]["Tables"]["items"]["Row"];

export const Route = createFileRoute("/")({
  component: HomePage,
  head: () => ({
    meta: [
      { title: "FoundIt — Vistula University Lost & Found" },
      {
        name: "description",
        content:
          "Lost something on campus? Found something? FoundIt connects Vistula University students and staff with their belongings.",
      },
    ],
  }),
});

function HomePage() {
  const [recentItems, setRecentItems] = useState<Item[]>([]);
  const [stats, setStats] = useState({ total: 0, resolved: 0 });
  const [search, setSearch] = useState("");

  useEffect(() => {
    void (async () => {
      const { data } = await supabase
        .from("items")
        .select("*")
        .eq("status", "active")
        .order("created_at", { ascending: false })
        .limit(6);
      if (data) setRecentItems(data);

      const [{ count: total }, { count: resolved }] = await Promise.all([
        supabase.from("items").select("*", { count: "exact", head: true }),
        supabase
          .from("items")
          .select("*", { count: "exact", head: true })
          .eq("status", "resolved"),
      ]);
      setStats({ total: total ?? 0, resolved: resolved ?? 0 });
    })();
  }, []);

  const reunionRate = stats.total > 0 ? Math.round((stats.resolved / stats.total) * 100) : 0;

  return (
    <div className="min-h-screen bg-background">
      <Header />

      {/* Hero */}
      <section className="relative overflow-hidden border-b border-border">
        <div className="container mx-auto grid gap-10 px-4 py-16 sm:px-6 md:py-24 lg:grid-cols-2 lg:gap-16">
          <div className="flex flex-col justify-center">
            <div className="mb-5 inline-flex w-fit items-center gap-2 rounded-full border border-border bg-surface px-3 py-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              <Sparkles className="h-3.5 w-3.5 text-accent" />
              For Vistula students & staff
            </div>
            <h1 className="text-balance text-4xl font-extrabold leading-[1.05] tracking-tight text-foreground sm:text-5xl md:text-6xl">
              Lost something? <span className="text-primary">Find it back.</span>
            </h1>
            <p className="mt-5 max-w-xl text-balance text-lg leading-relaxed text-muted-foreground">
              FoundIt is the official lost and found archive for Vistula University. Report what you
              lost, post what you found, and let's reunite belongings with their owners.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link to="/report" search={{ type: "lost" }}>
                <Button size="lg" className="font-semibold">
                  Report Lost Item
                  <ArrowRight className="ml-1 h-4 w-4" />
                </Button>
              </Link>
              <Link to="/report" search={{ type: "found" }}>
                <Button size="lg" variant="outline" className="border-accent bg-accent-soft font-semibold text-accent-foreground hover:bg-accent/20">
                  Report Found Item
                </Button>
              </Link>
            </div>
          </div>
          <div className="relative hidden lg:block">
            <div className="absolute inset-0 -z-10 rounded-3xl bg-gradient-to-br from-primary-soft to-accent-soft blur-3xl" />
            <img
              src={heroImg}
              alt="Lost items collection"
              width={1280}
              height={896}
              className="relative aspect-[4/3] w-full rounded-3xl border border-border object-cover shadow-2xl"
            />
          </div>
        </div>
      </section>

      {/* Search */}
      <section className="border-b border-border bg-surface py-10">
        <div className="container mx-auto px-4 sm:px-6">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              window.location.href = `/browse?q=${encodeURIComponent(search)}`;
            }}
            className="mx-auto flex max-w-3xl items-center gap-2 rounded-2xl border border-border bg-card p-2 shadow-sm focus-within:ring-2 focus-within:ring-primary"
          >
            <Search className="ml-3 h-5 w-5 shrink-0 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by item, location, or category..."
              className="flex-1 border-0 bg-transparent text-base shadow-none focus-visible:ring-0"
            />
            <Button type="submit" size="lg" className="font-semibold">
              Search
            </Button>
          </form>
        </div>
      </section>

      {/* Recent items */}
      <section className="container mx-auto px-4 py-16 sm:px-6">
        <div className="mb-8 flex items-end justify-between gap-4">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Recently reported</h2>
            <p className="mt-1 text-muted-foreground">Latest items posted across campus</p>
          </div>
          <Link to="/browse" className="hidden sm:block">
            <Button variant="ghost" className="font-semibold">
              View all <ArrowRight className="ml-1 h-4 w-4" />
            </Button>
          </Link>
        </div>

        {recentItems.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border bg-surface p-12 text-center">
            <MapPin className="mx-auto h-10 w-10 text-muted-foreground" />
            <h3 className="mt-4 text-lg font-semibold">No items yet</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Be the first to report a lost or found item.
            </p>
          </div>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {recentItems.map((item) => (
              <ItemCard key={item.id} item={item} />
            ))}
          </div>
        )}
      </section>

      {/* Stats */}
      <section className="border-y border-border bg-surface">
        <div className="container mx-auto grid grid-cols-3 gap-4 px-4 py-12 sm:px-6">
          <Stat value={stats.total.toLocaleString()} label="Items reported" />
          <Stat value={stats.resolved.toLocaleString()} label="Items reunited" accent />
          <Stat value={`${reunionRate}%`} label="Reunion rate" />
        </div>
      </section>

      <footer className="container mx-auto px-4 py-8 text-center text-sm text-muted-foreground sm:px-6">
        © {new Date().getFullYear()} FoundIt — Vistula University. Made with care for our campus.
      </footer>
    </div>
  );
}

function Stat({ value, label, accent }: { value: string; label: string; accent?: boolean }) {
  return (
    <div className="text-center">
      <div
        className={`text-3xl font-extrabold tabular-nums tracking-tight sm:text-5xl ${
          accent ? "text-accent" : "text-primary"
        }`}
      >
        {value}
      </div>
      <div className="mt-2 text-xs font-medium uppercase tracking-wider text-muted-foreground sm:text-sm">
        {label}
      </div>
    </div>
  );
}
