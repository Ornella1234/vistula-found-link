import { Outlet, createRootRoute, HeadContent, Scripts, Link } from "@tanstack/react-router";
import { Toaster } from "@/components/ui/sonner";
import { AuthProvider } from "@/contexts/AuthContext";

import appCss from "../styles.css?url";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Page not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          The page you're looking for doesn't exist.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "FoundIt — Vistula University Lost & Found" },
      {
        name: "description",
        content:
          "Report lost items, browse what's been found, and reconnect with your belongings at Vistula University.",
      },
      { property: "og:title", content: "FoundIt — Vistula University Lost & Found" },
      {
        property: "og:description",
        content: "Report lost items and reunite belongings with their owners on campus.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "FoundIt — Vistula University Lost & Found" },
      { name: "description", content: "FoundIt: Vistula's Lost & Found is a web application for managing lost and found items at Vistula University." },
      { property: "og:description", content: "FoundIt: Vistula's Lost & Found is a web application for managing lost and found items at Vistula University." },
      { name: "twitter:description", content: "FoundIt: Vistula's Lost & Found is a web application for managing lost and found items at Vistula University." },
      { property: "og:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/99711b1d-1f37-4d6c-9c36-957165fc23a6/id-preview-4515ccce--af13897e-d7e1-4120-9203-064baf7ba75e.lovable.app-1776766477219.png" },
      { name: "twitter:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/99711b1d-1f37-4d6c-9c36-957165fc23a6/id-preview-4515ccce--af13897e-d7e1-4120-9203-064baf7ba75e.lovable.app-1776766477219.png" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,600;9..40,700;9..40,800&display=swap",
      },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
});

function RootShell({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  return (
    <AuthProvider>
      <Outlet />
      <Toaster />
    </AuthProvider>
  );
}
