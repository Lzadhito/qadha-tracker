import { useState, useEffect } from "react"
import { Link, useNavigate } from "react-router"
import { useTheme } from "next-themes"
import { requireOnboarded } from "~/lib/guards"
import { signOut } from "~/lib/auth"
import { supabase } from "~/lib/supabase"
import { Button } from "~/components/ui/button"
import { Input } from "~/components/ui/input"
import { Label } from "~/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "~/components/ui/select"
import { Switch } from "~/components/ui/switch"
import { Separator } from "~/components/ui/separator"
import { Skeleton } from "~/components/ui/skeleton"
import { ChevronRight } from "lucide-react"
import { toast } from "sonner"

export async function clientLoader() {
  return requireOnboarded()
}

const LINKS = [
  { href: "/settings/phases", label: "My Phases" },
  { href: "/settings/data", label: "Data & Privacy" },
  { href: "/settings/about", label: "About" },
]

const LOCALES = [
  { value: "id", label: "Bahasa Indonesia" },
  { value: "en", label: "English" },
]

const TIMEZONES = [
  "Asia/Jakarta",
  "Asia/Makassar",
  "Asia/Jayapura",
  "Asia/Singapore",
  "Asia/Kuala_Lumpur",
]

export default function Settings() {
  const navigate = useNavigate()
  const { resolvedTheme, setTheme } = useTheme()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [displayName, setDisplayName] = useState("")
  const [locale, setLocale] = useState("id")
  const [timezone, setTimezone] = useState("Asia/Jakarta")

  useEffect(() => {
    async function load() {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return
      const { data } = await supabase
        .from("profiles")
        .select("display_name, locale, timezone")
        .eq("user_id", session.user.id)
        .maybeSingle()
      if (data) {
        setDisplayName(data.display_name ?? "")
        setLocale(data.locale ?? "id")
        setTimezone(data.timezone ?? "Asia/Jakarta")
      }
      setLoading(false)
    }
    load()
  }, [])

  const handleSave = async () => {
    setSaving(true)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return
      const { error } = await supabase
        .from("profiles")
        .update({ display_name: displayName || null, locale, timezone })
        .eq("user_id", session.user.id)
      if (error) throw error
      toast.success("Profile saved.")
    } catch {
      toast.error("Failed to save profile.")
    } finally {
      setSaving(false)
    }
  }

  const handleSignOut = async () => {
    await signOut()
    navigate("/auth/sign-in")
  }

  return (
    <div className="max-w-lg mx-auto px-4 py-6 space-y-6">
      <h1 className="text-xl font-bold">Settings</h1>

      {/* Profile */}
      <div className="space-y-4">
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Profile</h2>
        {loading ? (
          <div className="space-y-3">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        ) : (
          <div className="space-y-3">
            <div className="space-y-1">
              <Label>Display name (optional)</Label>
              <Input
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Your name"
              />
            </div>
            <div className="space-y-1">
              <Label>Language</Label>
              <Select value={locale} onValueChange={setLocale}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {LOCALES.map((l) => (
                    <SelectItem key={l.value} value={l.value}>{l.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Timezone</Label>
              <Select value={timezone} onValueChange={setTimezone}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {TIMEZONES.map((tz) => (
                    <SelectItem key={tz} value={tz}>{tz}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button onClick={handleSave} disabled={saving} className="w-full">
              {saving ? "Saving..." : "Save profile"}
            </Button>
          </div>
        )}
      </div>

      <Separator />

      {/* Appearance */}
      <div className="space-y-3">
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Appearance</h2>
        <div className="flex items-center justify-between">
          <Label htmlFor="dark-mode">Dark mode</Label>
          <Switch
            id="dark-mode"
            checked={resolvedTheme === "dark"}
            onCheckedChange={(checked) => setTheme(checked ? "dark" : "light")}
          />
        </div>
      </div>

      <Separator />

      {/* Nav links */}
      <div className="rounded-xl border border-border bg-card divide-y divide-border">
        {LINKS.map(({ href, label }) => (
          <Link
            key={href}
            to={href}
            className="flex items-center justify-between px-4 py-3 hover:bg-muted/50 transition-colors"
          >
            <span className="text-sm">{label}</span>
            <ChevronRight className="w-4 h-4 text-muted-foreground" />
          </Link>
        ))}
      </div>

      <Separator />

      <Button
        variant="outline"
        className="w-full text-destructive border-destructive/50 hover:bg-destructive/10"
        onClick={handleSignOut}
      >
        Sign out
      </Button>
    </div>
  )
}
