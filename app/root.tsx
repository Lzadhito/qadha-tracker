import {
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  isRouteErrorResponse,
} from "react-router"
import { QueryClientProvider, QueryClient } from "@tanstack/react-query"
import { ThemeProvider } from "next-themes"
import { useTranslation } from "react-i18next"
import { Toaster } from "~/components/ui/sonner"
import { Skeleton } from "~/components/ui/skeleton"
import "~/lib/i18n"

import type { Route } from "./+types/root"
import "./app.css"

const queryClient = new QueryClient()

export const meta: Route.MetaFunction = () => [
  { title: "Qadha Tracker" },
  { name: "description", content: "Track your qadha prayers and fasts." },
]

export function Layout({ children }: { children: React.ReactNode }) {
  const { i18n } = useTranslation()
  return (
    <html lang={i18n.language ?? "en"} suppressHydrationWarning>
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="theme-color" content="#2d5a3d" />
        <link rel="manifest" href="/manifest.webmanifest" />
        <Meta />
        <Links />
      </head>
      <body>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <QueryClientProvider client={queryClient}>
            {children}
            <Toaster />
          </QueryClientProvider>
        </ThemeProvider>
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  )
}

export default function App() {
  return <Outlet />
}

export function HydrateFallback() {
  return (
    <div className="max-w-lg mx-auto px-4 py-6 space-y-2">
      <Skeleton className="h-4 w-24" />
      <Skeleton className="h-6 w-40 mb-4" />

      <div className="rounded-xl border border-border bg-card px-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="py-3 border-b border-border/40 last:border-0">
            <Skeleton className="h-4 w-24 mb-1" />
            <Skeleton className="h-3 w-32" />
          </div>
        ))}
      </div>

      <div className="my-4 h-px bg-border" />

      <div className="rounded-xl border border-border bg-card px-4">
        <div className="py-3">
          <Skeleton className="h-4 w-24 mb-1" />
          <Skeleton className="h-3 w-36" />
        </div>
      </div>
    </div>
  )
}

export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
  let message = "Oops!"
  let details = "An unexpected error occurred."
  let stack: string | undefined

  if (isRouteErrorResponse(error)) {
    message = error.status === 404 ? "404" : "Error"
    details =
      error.status === 404
        ? "The requested page could not be found."
        : error.statusText || details
  } else if (import.meta.env.DEV && error && error instanceof Error) {
    details = error.message
    stack = error.stack
  }

  return (
    <main className="container mx-auto p-4 pt-16">
      <h1>{message}</h1>
      <p>{details}</p>
      {stack && (
        <pre className="w-full overflow-x-auto p-4">
          <code>{stack}</code>
        </pre>
      )}
    </main>
  )
}
