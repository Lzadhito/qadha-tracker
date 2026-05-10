import { type RouteConfig, layout, route, index } from "@react-router/dev/routes"

export default [
  // Auth routes
  layout("routes/_auth/layout.tsx", [
    route("auth/sign-in", "routes/_auth/sign-in.tsx"),
    route("auth/sign-up", "routes/_auth/sign-up.tsx"),
    route("auth/callback", "routes/_auth/callback.tsx"),
  ]),

  // Onboarding routes
  layout("routes/_onboarding/layout.tsx", [
    route("onboarding/basics", "routes/_onboarding/basics.tsx"),
    route("onboarding/baligh", "routes/_onboarding/baligh.tsx"),
    route("onboarding/prayers", "routes/_onboarding/prayers.tsx"),
    route("onboarding/fasting", "routes/_onboarding/fasting.tsx"),
    route("onboarding/menstruation", "routes/_onboarding/menstruation.tsx"),
    route("onboarding/review", "routes/_onboarding/review.tsx"),
  ]),

  // App routes (protected, onboarded)
  layout("routes/_app/layout.tsx", [
    index("routes/_app/index.tsx"),
    route("log", "routes/_app/log.tsx"),
    route("history", "routes/_app/history/layout.tsx", [
      index("routes/_app/history/index.tsx"),
      route(":entryId", "routes/_app/history/$entry.tsx"),
    ]),
    route("settings", "routes/_app/settings/layout.tsx", [
      index("routes/_app/settings/index.tsx"),
      route("phases", "routes/_app/settings/phases.tsx"),
      route("data", "routes/_app/settings/data.tsx"),
      route("about", "routes/_app/settings/about.tsx"),
    ]),
  ]),
] satisfies RouteConfig
