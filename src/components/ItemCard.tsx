import { Link } from "@tanstack/react-router";
import { Badge } from "@/components/ui/badge";
import { MapPin, Calendar } from "lucide-react";
import type { Database } from "@/integrations/supabase/types";

type Item = Database["public"]["Tables"]["items"]["Row"];

function formatRelative(dateStr: string): string {
  const date = new Date(dateStr);
  const diffMs = Date.now() - date.getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 60) return `${Math.max(mins, 1)}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return date.toLocaleDateString();
}

export function ItemCard({ item }: { item: Item }) {
  return (
    <Link
      to="/items/$itemId"
      params={{ itemId: item.id }}
      className="group block overflow-hidden rounded-xl border border-border bg-card shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md"
    >
      <div className="aspect-[4/3] overflow-hidden bg-muted">
        {item.photo_url ? (
          <img
            src={item.photo_url}
            alt={item.title}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-muted to-secondary text-muted-foreground">
            <span className="text-sm font-medium">No photo</span>
          </div>
        )}
      </div>
      <div className="space-y-3 p-4">
        <div className="flex items-start justify-between gap-2">
          <h3 className="line-clamp-1 text-base font-bold text-foreground">{item.title}</h3>
          <Badge
            variant="outline"
            className={
              item.type === "lost"
                ? "border-destructive/30 bg-destructive/10 text-destructive"
                : "border-accent/30 bg-accent-soft text-accent-foreground"
            }
          >
            {item.type === "lost" ? "Lost" : "Found"}
          </Badge>
        </div>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-xs text-muted-foreground">
          <span className="rounded-full bg-primary-soft px-2 py-0.5 font-semibold text-primary">
            {item.category}
          </span>
          <span className="flex items-center gap-1">
            <MapPin className="h-3 w-3" />
            <span className="line-clamp-1">{item.location}</span>
          </span>
          <span className="flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            {formatRelative(item.created_at)}
          </span>
        </div>
        {item.status === "resolved" && (
          <Badge variant="secondary" className="text-xs">
            ✓ Resolved
          </Badge>
        )}
      </div>
    </Link>
  );
}
