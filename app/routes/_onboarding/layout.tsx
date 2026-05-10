import { Outlet, useLocation } from "react-router"
import { requireUnonboarded } from "~/lib/guards"

const STEPS = ["basics", "baligh", "prayers", "fasting", "menstruation", "review"]

export async function clientLoader() {
  return requireUnonboarded()
}

export default function OnboardingLayout() {
  const location = useLocation()
  const currentPath = location.pathname.split("/").pop() || ""
  const currentStep = STEPS.indexOf(currentPath)
  const progress = currentStep === -1 ? 0 : ((currentStep + 1) / STEPS.length) * 100

  return (
    <div className="min-h-screen bg-background">
      <div className="h-1 bg-muted">
        <div
          className="h-full bg-primary transition-all duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>
      <div className="max-w-2xl mx-auto px-4 py-8">
        <Outlet />
      </div>
    </div>
  )
}
