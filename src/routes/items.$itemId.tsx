import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { ArrowLeft, MapPin, Calendar, Mail, CheckCircle2, Trash2, Loader2 } from "lucide-react";
import type { Database } from "@/integrations/supabase/types";

type Item = Database["public"]["Tables"]["items"]["Row"];
type Poster = { full_name: string | null; email: string | null };

export const Route = createFileRoute("/items/$itemId")({
  component: ItemDetailPage,
  head: () => ({
    meta: [{ title: "Item details — FoundIt" }],
  }),
});

function ItemDetailPage() {
  const { itemId } = Route.useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [item, setItem] = useState<Item | null>(null);
  const [poster, setPoster] = useState<Poster | null>(null);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState(false);

  useEffect(() => {
    void (async () => {
      setLoading(true);
      const { data: itemData } = await supabase
        .from("items")
        .select("*")
        .eq("id", itemId)
        .maybeSingle();
      if (itemData) {
        setItem(itemData);
        // Use security-definer RPC so contact info is exposed only for active items
        const { data: contact } = await supabase
          .rpc("get_item_contact", { _item_id: itemData.id })
          .maybeSingle();
        setPoster(contact ?? null);
      }
      setLoading(false);
    })();
  }, [itemId]);

  const isOwner = user?.id === item?.user_id;

  const markResolved = async () => {
    if (!item) return;
    setActing(true);
    const { error } = await supabase
      .from("items")
      .update({ status: "resolved" })
      .eq("id", item.id);
    setActing(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Marked as resolved! 🎉");
    setItem({ ...item, status: "resolved" });
  };

  const deleteItem = async () => {
    if (!item || !confirm("Delete this item? This cannot be undone.")) return;
    setActing(true);
    const { error } = await supabase.from("items").delete().eq("id", item.id);
    setActing(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Item deleted.");
    void navigate({ to: "/my-items" });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="flex h-64 items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  if (!item) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-16 text-center sm:px-6">
          <h1 className="text-2xl font-bold">Item not found</h1>
          <p className="mt-2 text-muted-foreground">It may have been removed.</p>
          <Link to="/browse" className="mt-6 inline-block">
            <Button>Back to browse</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container mx-auto max-w-4xl px-4 py-8 sm:px-6">
        <Link
          to="/browse"
          className="mb-6 inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" /> Back to browse
        </Link>

        <div className="grid gap-8 md:grid-cols-2">
          <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
            {item.photo_url ? (
              <img src={item.photo_url} alt={item.title} className="aspect-square w-full object-cover" />
            ) : (
              <div className="flex aspect-square items-center justify-center bg-gradient-to-br from-muted to-secondary text-muted-foreground">
                <span className="text-sm font-medium">No photo provided</span>
              </div>
            )}
          </div>

          <div className="space-y-6">
            <div>
              <div className="mb-3 flex items-center gap-2">
                <Badge
                  className={
                    item.type === "lost"
                      ? "border-destructive/30 bg-destructive/10 text-destructive"
                      : "border-accent/30 bg-accent-soft text-accent-foreground"
                  }
                  variant="outline"
                >
                  {item.type === "lost" ? "Lost item" : "Found item"}
                </Badge>
                {item.status === "resolved" && (
                  <Badge variant="secondary" className="gap-1">
                    <CheckCircle2 className="h-3 w-3" /> Resolved
                  </Badge>
                )}
              </div>
              <h1 className="text-3xl font-extrabold tracking-tight">{item.title}</h1>
              <span className="mt-3 inline-block rounded-full bg-primary-soft px-3 py-1 text-xs font-semibold text-primary">
                {item.category}
              </span>
            </div>

            <div className="space-y-3 rounded-xl border border-border bg-card p-5">
              <DetailRow icon={<MapPin className="h-4 w-4" />} label="Location" value={item.location} />
              <DetailRow
                icon={<Calendar className="h-4 w-4" />}
                label={item.type === "lost" ? "Lost on" : "Found on"}
                value={new Date(item.event_date).toLocaleDateString(undefined, {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              />
              {poster && (
                <DetailRow
                  icon={<Mail className="h-4 w-4" />}
                  label="Posted by"
                  value={
                    <span>
                      {poster.full_name ?? "A student"}
                      {poster.email && (
                        <a
                          href={`mailto:${poster.email}?subject=${encodeURIComponent(`FoundIt: ${item.title}`)}`}
                          className="ml-2 text-primary underline-offset-2 hover:underline"
                        >
                          {poster.email}
                        </a>
                      )}
                    </span>
                  }
                />
              )}
            </div>

            <div>
              <h2 className="mb-2 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                Description
              </h2>
              <p className="whitespace-pre-wrap leading-relaxed text-foreground">{item.description}</p>
            </div>

            {!isOwner && user && poster?.email && item.status === "active" && (
              <a
                href={`mailto:${poster.email}?subject=${encodeURIComponent(`FoundIt: ${item.title}`)}&body=${encodeURIComponent(`Hi! I'm contacting you about your "${item.title}" post on FoundIt.`)}`}
                className="block"
              >
                <Button size="lg" className="w-full font-semibold">
                  <Mail className="mr-2 h-4 w-4" />
                  Contact poster
                </Button>
              </a>
            )}

            {!user && (
              <Link to="/auth" className="block">
                <Button size="lg" className="w-full font-semibold">
                  Sign in to contact
                </Button>
              </Link>
            )}

            {isOwner && (
              <div className="flex flex-col gap-2 rounded-xl border border-dashed border-border bg-surface p-4">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  This is your post
                </p>
                <div className="flex gap-2">
                  {item.status === "active" && (
                    <Button onClick={markResolved} disabled={acting} className="flex-1 font-semibold">
                      {acting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      <CheckCircle2 className="mr-2 h-4 w-4" />
                      Mark resolved
                    </Button>
                  )}
                  <Button onClick={deleteItem} disabled={acting} variant="outline" className="text-destructive hover:text-destructive">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function DetailRow({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-3">
      <div className="mt-0.5 text-muted-foreground">{icon}</div>
      <div className="min-w-0 flex-1">
        <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          {label}
        </div>
        <div className="mt-0.5 text-sm text-foreground">{value}</div>
      </div>
    </div>
  );
}
