import { useState } from "react"
import { useNavigate, useParams } from "react-router"
import { requireOnboarded } from "~/lib/guards"
import { useDeleteEntry } from "~/lib/queries/use-history"
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

export default function HistoryEntry() {
  const { entryId } = useParams()
  const navigate = useNavigate()
  const deleteEntry = useDeleteEntry()

  // entryId = "prayer-<uuid>" or "fasting-<uuid>"
  const [obligation, id] = (entryId ?? "").split(/-(.+)/)

  const handleDelete = async () => {
    if (!id || (obligation !== "prayer" && obligation !== "fasting")) return
    await deleteEntry.mutateAsync({ id, obligation })
    navigate("/history")
  }

  return (
    <div className="max-w-lg mx-auto px-4 py-6">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => navigate("/history")}
        className="mb-4"
      >
        ← Back
      </Button>

      <h1 className="text-xl font-bold mb-6">Entry Detail</h1>

      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button variant="destructive" className="w-full">
            Delete entry
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this entry?</AlertDialogTitle>
            <AlertDialogDescription>
              Your remaining count will adjust accordingly. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleteEntry.isPending}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
