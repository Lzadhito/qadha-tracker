import { useState } from "react"
import { useNavigate } from "react-router"
import { requireOnboarded } from "~/lib/guards"
import { supabase } from "~/lib/supabase"
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
  const [exporting, setExporting] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const handleExport = async () => {
    setExporting(true)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return

      const uid = session.user.id
      const [profile, prayerPhases, prayerLedger, fastingPhases, fastingLedger] =
        await Promise.all([
          supabase.from("profiles").select("*").eq("user_id", uid).single(),
          supabase.from("prayer_phases").select("*").eq("user_id", uid),
          supabase.from("prayer_ledger").select("*").eq("user_id", uid),
          supabase.from("fasting_phases").select("*").eq("user_id", uid),
          supabase.from("fasting_ledger").select("*").eq("user_id", uid),
        ])

      const json = JSON.stringify(
        {
          exported_at: new Date().toISOString(),
          profile: profile.data,
          prayer_phases: prayerPhases.data,
          prayer_ledger: prayerLedger.data,
          fasting_phases: fastingPhases.data,
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
          ← Back
        </Button>
        <h1 className="text-xl font-bold">Data & Privacy</h1>
      </div>

      <div className="rounded-xl border border-border bg-card p-4 space-y-2 text-sm text-muted-foreground">
        <p>We store your prayer and fasting counts, phase configuration, and basic profile. Nothing else.</p>
        <p>We never ask why a prayer or fast was missed. No notes. No tracking. That is between you and Allah.</p>
        <p>Your data is encrypted at rest. Only you can read it.</p>
      </div>

      <Button
        className="w-full"
        variant="outline"
        onClick={handleExport}
        disabled={exporting}
      >
        {exporting ? "Exporting..." : "Export all data (JSON)"}
      </Button>

      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button variant="outline" className="w-full text-destructive border-destructive/50 hover:bg-destructive/10">
            Delete account & all data
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete account?</AlertDialogTitle>
            <AlertDialogDescription>
              This permanently deletes your account and all data — prayers, fasts, phases, profile. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteAccount}
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting ? "Deleting..." : "Delete everything"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
