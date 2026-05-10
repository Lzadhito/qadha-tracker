import { useState } from "react"
import { signInWithMagicLink, signInWithGoogle } from "~/lib/auth"
import { Button } from "~/components/ui/button"
import { Input } from "~/components/ui/input"
import { Card } from "~/components/ui/card"

export default function SignIn() {
  const [email, setEmail] = useState("")
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)

  const handleMagicLink = async () => {
    setLoading(true)
    const { error } = await signInWithMagicLink(email)
    setLoading(false)
    if (!error) {
      setSent(true)
    }
  }

  const handleGoogle = async () => {
    setLoading(true)
    const { error } = await signInWithGoogle()
    setLoading(false)
    if (error) console.error(error)
  }

  return (
    <Card className="p-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Qadha Tracker</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Track your qadha journey
        </p>
      </div>

      {sent ? (
        <div className="text-center space-y-2">
          <p className="text-sm text-foreground/80">
            Check your email for a magic link to sign in.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="email" className="text-sm font-medium">
              Email
            </label>
            <Input
              id="email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
            />
          </div>

          <Button
            onClick={handleMagicLink}
            disabled={loading || !email}
            className="w-full"
          >
            {loading ? "Loading..." : "Send magic link"}
          </Button>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-card px-2 text-muted-foreground">Or</span>
            </div>
          </div>

          <Button
            onClick={handleGoogle}
            disabled={loading}
            variant="outline"
            className="w-full"
          >
            Continue with Google
          </Button>
        </div>
      )}

      <p className="text-xs text-muted-foreground text-center">
        By continuing, you agree to our privacy policy.
      </p>
    </Card>
  )
}
