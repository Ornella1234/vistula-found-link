import { Link, useNavigate } from "@tanstack/react-router";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Sparkles, LogOut, User as UserIcon } from "lucide-react";
import logo from "@/assets/logo.png";

export function Header() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate({ to: "/" });
  };

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-surface/80 backdrop-blur supports-[backdrop-filter]:bg-surface/60">
      <div className="container mx-auto flex h-16 items-center justify-between px-4 sm:px-6">
        <Link to="/" className="flex items-center gap-2.5">
          <img src={logo} alt="FoundIt logo" className="h-9 w-9" />
          <div className="flex flex-col leading-none">
            <span className="text-base font-bold tracking-tight">FoundIt</span>
            <span className="hidden text-[10px] font-medium uppercase tracking-wider text-muted-foreground sm:inline">
              Vistula University
            </span>
          </div>
        </Link>

        <nav className="flex items-center gap-1 sm:gap-2">
          <Link
            to="/browse"
            className="hidden rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground sm:inline-block"
            activeProps={{ className: "text-foreground bg-muted" }}
          >
            Browse
          </Link>
          <Link
            to="/ai-search"
            className="hidden items-center gap-1.5 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground sm:inline-flex"
            activeProps={{ className: "text-foreground bg-muted" }}
          >
            <Sparkles className="h-4 w-4 text-primary" />
            AI Search
          </Link>
          {user ? (
            <>
              <Link to="/report">
                <Button size="sm" className="font-semibold">
                  Report Item
                </Button>
              </Link>
              <Link
                to="/my-items"
                className="hidden items-center gap-1.5 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground sm:inline-flex"
                activeProps={{ className: "text-foreground bg-muted" }}
              >
                <UserIcon className="h-4 w-4" />
                My Items
              </Link>
              <Button variant="ghost" size="icon" onClick={handleSignOut} aria-label="Sign out">
                <LogOut className="h-4 w-4" />
              </Button>
            </>
          ) : (
            <Link to="/auth">
              <Button size="sm" variant="default" className="font-semibold">
                Sign In
              </Button>
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
