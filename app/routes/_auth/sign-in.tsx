import { useState } from "react"
import { useTranslation } from "react-i18next"
import { signInWithMagicLink, signInWithGoogle } from "~/lib/auth"
import { Button } from "~/components/ui/button"
import { Input } from "~/components/ui/input"
import { Card } from "~/components/ui/card"

export default function SignIn() {
  const { t } = useTranslation()
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
        <h1 className="text-2xl font-bold">{t("auth.title")}</h1>
        <p className="text-muted-foreground text-sm mt-1">
          {t("auth.subtitle")}
        </p>
      </div>

      {sent ? (
        <div className="text-center space-y-2">
          <p className="text-sm text-foreground/80">
            {t("auth.checkEmail")}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="email" className="text-sm font-medium">
              {t("auth.email")}
            </label>
            <Input
              id="email"
              type="email"
              placeholder={t("auth.emailPlaceholder")}
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
            {loading ? t("common.loading") : t("auth.sendMagicLink")}
          </Button>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-card px-2 text-muted-foreground">{t("common.or")}</span>
            </div>
          </div>

          <Button
            onClick={handleGoogle}
            disabled={loading}
            variant="outline"
            className="w-full"
          >
            {t("auth.continueGoogle")}
          </Button>
        </div>
      )}

      <p className="text-xs text-muted-foreground text-center">
        {t("auth.privacy")}
      </p>
    </Card>
  )
}
