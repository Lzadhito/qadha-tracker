import { useNavigate } from "react-router"
import { requireOnboarded } from "~/lib/guards"
import { Button } from "~/components/ui/button"

export async function clientLoader() {
  return requireOnboarded()
}

export default function About() {
  const navigate = useNavigate()

  return (
    <div className="max-w-lg mx-auto px-4 py-6 space-y-6">
      <div>
        <Button variant="ghost" size="sm" onClick={() => navigate("/settings")} className="mb-4">
          ← Back
        </Button>
        <h1 className="text-xl font-bold">About</h1>
      </div>

      <div className="space-y-4 text-sm">
        <div>
          <h2 className="font-semibold mb-2">How we handle your data</h2>
          <p className="text-muted-foreground leading-relaxed">
            We store the count of prayers and fasts you owe, the dates you logged actions, and your basic profile. Nothing else.
          </p>
        </div>
        <div>
          <p className="text-muted-foreground leading-relaxed">
            We do not ask why a prayer or fast was missed. We do not store notes. We do not track patterns. That is between you and Allah.
          </p>
        </div>
        <div>
          <p className="text-muted-foreground leading-relaxed">
            Your data is encrypted at rest and only you can read it. You can export it or delete your account at any time from Settings → Data.
          </p>
        </div>
      </div>

      <div className="text-xs text-muted-foreground pt-4 border-t border-border">
        <p>Qadha Tracker v0.1.0</p>
        <p className="mt-1">Not a fiqh authority. Consult your own scholar for rulings.</p>
      </div>
    </div>
  )
}
