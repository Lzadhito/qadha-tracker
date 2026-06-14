import { useState } from "react"
import { useNavigate } from "react-router"
import { useTranslation } from "react-i18next"
import { requireOnboarded } from "~/lib/guards"
import { supabase } from "~/lib/supabase"
import { getLocalProfile } from "~/lib/local-profile"
import { Button } from "~/components/ui/button"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "~/components/ui/alert-dialog"

export async function clientLoader() {
  return requireOnboarded()
}

export default function Data() {
  const navigate = useNavigate()
  const { t } = useTranslation()
  const [exporting, setExporting] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const handleExport = async () => {
    setExporting(true)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return

      const uid = session.user.id
      const [profile, prayerLedger, fastingLedger] =
        await Promise.all([
          supabase.from("profiles").select("*").eq("user_id", uid).single(),
          supabase.from("prayer_ledger").select("*").eq("user_id", uid),
          supabase.from("fasting_ledger").select("*").eq("user_id", uid),
        ])

      const json = JSON.stringify(
        {
          exported_at: new Date().toISOString(),
          local_profile: getLocalProfile(),
          profile: profile.data,
          prayer_ledger: prayerLedger.data,
          fasting_ledger: fastingLedger.data,
        },
        null,
        2
      )

      const blob = new Blob([json], { type: "application/json" })
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `qadha-tracker-export-${new Date().toISOString().slice(0, 10)}.json`
      a.click()
      URL.revokeObjectURL(url)
    } finally {
      setExporting(false)
    }
  }

  const handleDeleteAccount = async () => {
    setDeleting(true)
    try {
      // Call RPC to cascade-delete user data + auth.users row
      const { error } = await supabase.rpc("delete_account")
      if (error) throw error
      await supabase.auth.signOut()
      navigate("/auth/sign-in")
    } catch (err) {
      console.error(err)
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className="max-w-lg mx-auto px-4 py-6 space-y-6">
      <div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate("/settings")}
          className="mb-4"
        >
          ← {t("common.back")}
        </Button>
        <h1 className="text-xl font-bold">{t("data.title")}</h1>
      </div>

      <div className="rounded-xl border border-border bg-card p-4 space-y-2 text-sm text-muted-foreground">
        <p>{t("data.intro1")}</p>
        <p>{t("data.intro2")}</p>
        <p>{t("data.intro3")}</p>
      </div>

      <Button
        className="w-full"
        variant="outline"
        onClick={handleExport}
        disabled={exporting}
      >
        {exporting ? t("data.exporting") : t("data.export")}
      </Button>

      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button variant="outline" className="w-full text-destructive border-destructive/50 hover:bg-destructive/10">
            {t("data.deleteAccount")}
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("data.deleteConfirm")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("data.deleteDescription")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteAccount}
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting ? t("data.deleting") : t("data.deleteEverything")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
