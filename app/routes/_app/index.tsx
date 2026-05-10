import { redirect } from "react-router"
import { requireOnboarded } from "~/lib/guards"

export async function clientLoader() {
  await requireOnboarded()
  throw redirect("/log")
}

export default function Index() {
  return null
}
