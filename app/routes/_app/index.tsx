import { redirect } from "react-router"

export async function clientLoader() {
  throw redirect("/log")
}

export default function Index() {
  return null
}
