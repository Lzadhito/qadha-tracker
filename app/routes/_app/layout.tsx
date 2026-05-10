import { Outlet, Link, useLocation } from "react-router"
import { BookOpen, History, Settings } from "lucide-react"

export default function AppLayout() {
  const location = useLocation()

  const navItems = [
    { href: "/log", label: "Log", icon: BookOpen },
    { href: "/history", label: "History", icon: History },
    { href: "/settings", label: "Settings", icon: Settings },
  ]

  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      {/* Desktop side nav */}
      <nav className="hidden md:flex md:flex-col md:w-64 md:border-r md:border-border md:bg-muted/30 md:p-4">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-primary">Qadha</h1>
        </div>
        <ul className="space-y-2">
          {navItems.map(({ href, label, icon: Icon }) => (
            <li key={href}>
              <Link
                to={href}
                className={`flex items-center gap-2 px-4 py-2 rounded transition-colors ${
                  location.pathname.startsWith(href)
                    ? "bg-primary/10 text-primary font-semibold"
                    : "hover:bg-muted text-foreground/70 hover:text-foreground"
                }`}
              >
                <Icon className="w-5 h-5" />
                {label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      {/* Main content */}
      <main className="flex-1 pb-20 md:pb-0">
        <Outlet />
      </main>

      {/* Mobile bottom nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 border-t border-border bg-background flex justify-around py-2">
        {navItems.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            to={href}
            className={`flex flex-col items-center gap-1 px-3 py-2 text-xs transition-colors ${
              location.pathname.startsWith(href)
                ? "text-primary"
                : "text-foreground/50 hover:text-foreground"
            }`}
          >
            <Icon className="w-5 h-5" />
            <span>{label}</span>
          </Link>
        ))}
      </nav>
    </div>
  )
}
