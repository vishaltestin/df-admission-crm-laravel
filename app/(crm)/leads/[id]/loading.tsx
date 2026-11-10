import { Card } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

export default function LeadDetailLoading() {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Skeleton className="h-5 w-36" />
        <Skeleton className="h-4 w-24" />
      </div>

      <Card className="gap-2 p-3 shadow-xs">
        <div className="flex items-center justify-between">
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-36" />
        </div>
        <div className="flex gap-2 pt-1">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-8 flex-1 rounded" />
          ))}
        </div>
      </Card>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-12">
        <div className="space-y-4 xl:col-span-4">
          <Card className="items-center gap-3 p-4 shadow-xs">
            <Skeleton className="size-16 rounded-full" />
            <Skeleton className="h-5 w-36" />
            <Skeleton className="h-4 w-28" />
            <div className="grid w-full grid-cols-3 gap-2">
              <Skeleton className="h-12 rounded" />
              <Skeleton className="h-12 rounded" />
              <Skeleton className="h-12 rounded" />
            </div>
            <Skeleton className="h-9 w-full rounded" />
          </Card>

          <Card className="gap-2.5 p-4 shadow-xs">
            <Skeleton className="h-4 w-28" />
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="flex justify-between">
                <Skeleton className="h-3.5 w-24" />
                <Skeleton className="h-3.5 w-32" />
              </div>
            ))}
          </Card>

          <Card className="gap-2.5 p-4 shadow-xs">
            <div className="flex items-center justify-between">
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-7 w-36 rounded" />
            </div>
            <Skeleton className="h-2 w-full rounded-full" />
            <Skeleton className="h-8 w-full rounded" />
          </Card>
        </div>

        <div className="space-y-4 xl:col-span-8">
          <Card className="flex-row flex-wrap gap-2 p-3 shadow-xs">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-8 w-28 rounded" />
            ))}
          </Card>
          <Card className="gap-4 p-4 shadow-xs">
            <div className="flex gap-2 border-b border-border pb-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-7 w-24 rounded" />
              ))}
            </div>
            <div className="space-y-3">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="grid grid-cols-3 gap-4">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="col-span-2 h-4 w-full" />
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}
