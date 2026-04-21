import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { zodValidator, fallback } from "@tanstack/zod-adapter";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Header } from "@/components/Header";
import { ItemCard } from "@/components/ItemCard";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CATEGORIES, LOCATIONS } from "@/lib/constants";
import { Search, SlidersHorizontal } from "lucide-react";
import type { Database } from "@/integrations/supabase/types";

type Item = Database["public"]["Tables"]["items"]["Row"];

const browseSearchSchema = z.object({
  q: fallback(z.string(), "").default(""),
});

export const Route = createFileRoute("/browse")({
  validateSearch: zodValidator(browseSearchSchema),
  component: BrowsePage,
  head: () => ({
    meta: [
      { title: "Browse items — FoundIt" },
      { name: "description", content: "Search lost and found items reported across Vistula University." },
    ],
  }),
});

function BrowsePage() {
  const { q: initialQ } = Route.useSearch();
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState(initialQ);
  const [type, setType] = useState<"all" | "lost" | "found">("all");
  const [category, setCategory] = useState<string>("all");
  const [location, setLocation] = useState<string>("all");
  const [status, setStatus] = useState<"active" | "all">("active");

  useEffect(() => {
    void (async () => {
      setLoading(true);
      const { data } = await supabase
        .from("items")
        .select("*")
        .order("created_at", { ascending: false });
      if (data) setItems(data);
      setLoading(false);
    })();
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return items.filter((it) => {
      if (status === "active" && it.status !== "active") return false;
      if (type !== "all" && it.type !== type) return false;
      if (category !== "all" && it.category !== category) return false;
      if (location !== "all" && it.location !== location) return false;
      if (
        q &&
        !it.title.toLowerCase().includes(q) &&
        !it.description.toLowerCase().includes(q) &&
        !it.location.toLowerCase().includes(q) &&
        !it.category.toLowerCase().includes(q)
      ) {
        return false;
      }
      return true;
    });
  }, [items, query, type, category, location, status]);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container mx-auto px-4 py-8 sm:px-6">
        <div className="mb-6">
          <h1 className="text-3xl font-extrabold tracking-tight">Browse items</h1>
          <p className="mt-1 text-muted-foreground">
            {filtered.length} {filtered.length === 1 ? "item" : "items"} found
          </p>
        </div>

        <div className="mb-6 rounded-xl border border-border bg-card p-4 shadow-sm">
          <div className="relative mb-4">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by keyword, location, category..."
              className="pl-10"
            />
          </div>
          <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
            <SlidersHorizontal className="h-4 w-4" />
            Filters
          </div>
          <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Select value={type} onValueChange={(v) => setType(v as typeof type)}>
              <SelectTrigger><SelectValue placeholder="Type" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All types</SelectItem>
                <SelectItem value="lost">Lost</SelectItem>
                <SelectItem value="found">Found</SelectItem>
              </SelectContent>
            </Select>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger><SelectValue placeholder="Category" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All categories</SelectItem>
                {CATEGORIES.map((c) => (
                  <SelectItem key={c} value={c}>{c}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={location} onValueChange={setLocation}>
              <SelectTrigger><SelectValue placeholder="Location" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All locations</SelectItem>
                {LOCATIONS.map((l) => (
                  <SelectItem key={l} value={l}>{l}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={status} onValueChange={(v) => setStatus(v as typeof status)}>
              <SelectTrigger><SelectValue placeholder="Status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Active only</SelectItem>
                <SelectItem value="all">Include resolved</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {loading ? (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="aspect-[4/3] animate-pulse rounded-xl bg-muted" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border bg-surface p-12 text-center">
            <h3 className="text-lg font-semibold">No items match your filters</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Try adjusting your search or clearing filters.
            </p>
          </div>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((item) => (
              <ItemCard key={item.id} item={item} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
