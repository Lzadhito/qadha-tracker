import { QueryClient } from "@tanstack/react-query"

// Shared so non-React code (the outbox sync) can patch and invalidate the same cache.
export const queryClient = new QueryClient()
