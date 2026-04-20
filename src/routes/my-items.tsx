import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Header } from "@/components/Header";
import { ItemCard } from "@/components/ItemCard";
import { Button } from "@/components/ui/button";
import { Loader2, Plus, Inbox } from "lucide-react";
import type { Database } from "@/integrations/supabase/types";

type Item = Database["public"]["Tables"]["items"]["Row"];

export const Route = createFileRoute("/my-items")({
  component: MyItemsPage,
  head: () => ({
    meta: [{ title: "My items — FoundIt" }],
  }),
});

function MyItemsPage() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      void navigate({ to: "/auth" });
      return;
    }
    if (!user) return;
    void (async () => {
      setLoading(true);
      const { data } = await supabase
        .from("items")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      if (data) setItems(data);
      setLoading(false);
    })();
  }, [user, authLoading, navigate]);

  const active = items.filter((i) => i.status === "active");
  const resolved = items.filter((i) => i.status === "resolved");

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container mx-auto px-4 py-8 sm:px-6">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight">My items</h1>
            <p className="mt-1 text-muted-foreground">Posts you've reported on FoundIt</p>
          </div>
          <Link to="/report" search={{ type: "lost" }}>
            <Button className="font-semibold">
              <Plus className="mr-1 h-4 w-4" /> New report
            </Button>
          </Link>
        </div>

        {loading ? (
          <div className="flex h-64 items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : items.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border bg-surface p-12 text-center">
            <Inbox className="mx-auto h-10 w-10 text-muted-foreground" />
            <h3 className="mt-4 text-lg font-semibold">No reports yet</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              When you report a lost or found item, it'll appear here.
            </p>
            <Link to="/report" search={{ type: "lost" }} className="mt-6 inline-block">
              <Button>Report your first item</Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-10">
            <Section title="Active" count={active.length}>
              {active.length > 0 ? (
                <Grid items={active} />
              ) : (
                <p className="text-sm text-muted-foreground">No active items.</p>
              )}
            </Section>

            {resolved.length > 0 && (
              <Section title="Resolved" count={resolved.length}>
                <Grid items={resolved} />
              </Section>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function Section({
  title,
  count,
  children,
}: {
  title: string;
  count: number;
  children: React.ReactNode;
}) {
  return (
    <section>
      <h2 className="mb-4 flex items-center gap-2 text-xl font-bold tracking-tight">
        {title}
        <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-semibold text-muted-foreground">
          {count}
        </span>
      </h2>
      {children}
    </section>
  );
}

function Grid({ items }: { items: Item[] }) {
  return (
    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {items.map((item) => (
        <ItemCard key={item.id} item={item} />
      ))}
    </div>
  );
}
