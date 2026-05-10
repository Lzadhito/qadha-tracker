import { redirect } from "react-router"

export async function clientLoader() {
  throw redirect("/auth/sign-in")
}

export default function SignUp() {
  return null
}
