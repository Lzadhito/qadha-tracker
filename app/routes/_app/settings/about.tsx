import { useNavigate } from "react-router"
import { useTranslation } from "react-i18next"
import { requireOnboarded } from "~/lib/guards"
import { Button } from "~/components/ui/button"

export async function clientLoader() {
  return requireOnboarded()
}

export default function About() {
  const navigate = useNavigate()
  const { t } = useTranslation()

  return (
    <div className="max-w-lg mx-auto px-4 py-6 space-y-6">
      <div>
        <Button variant="ghost" size="sm" onClick={() => navigate("/settings")} className="mb-4">
          ← {t("common.back")}
        </Button>
        <h1 className="text-xl font-bold">{t("about.title")}</h1>
      </div>

      <div className="space-y-4 text-sm">
        <div>
          <h2 className="font-semibold mb-2">{t("about.howWeHandle")}</h2>
          <p className="text-muted-foreground leading-relaxed">
            {t("about.p1")}
          </p>
        </div>
        <div>
          <p className="text-muted-foreground leading-relaxed">
            {t("about.p2")}
          </p>
        </div>
        <div>
          <p className="text-muted-foreground leading-relaxed">
            {t("about.p3")}
          </p>
        </div>
      </div>

      <div className="text-xs text-muted-foreground pt-4 border-t border-border">
        <p>{t("about.version")}</p>
        <p className="mt-1">{t("about.disclaimer")}</p>
      </div>
    </div>
  )
}
