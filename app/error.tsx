"use client"

import * as React from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div className="flex min-h-[60vh] items-center justify-center p-6">
      <Card className="max-w-md gap-3 p-6 text-center shadow-xs">
        <h2 className="text-sm font-bold text-rose-600">
          Something went wrong
        </h2>
        <p className="text-xs text-muted-foreground">
          {error.message || "An unexpected error occurred while rendering this view."}
        </p>
        <div className="pt-2">
          <Button
            size="sm"
            onClick={() => reset()}
            className="bg-[#405189] text-xs font-semibold text-white hover:bg-[#364574]"
          >
            Try Again
          </Button>
        </div>
      </Card>
    </div>
  )
}
