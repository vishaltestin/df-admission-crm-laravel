import { redirect } from "next/navigation"
import { getOptionalSessionContext } from "@/lib/session"
import { LoginView } from "@/components/auth/login-view"

export default async function LoginPage() {
  const ctx = await getOptionalSessionContext()
  if (ctx) {
    redirect("/dashboard")
  }
  return <LoginView />
}
