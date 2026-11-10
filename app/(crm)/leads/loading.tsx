import { Card } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

export default function LeadsLoading() {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Skeleton className="h-5 w-32" />
        <Skeleton className="h-4 w-24" />
      </div>

      <Card className="gap-3 p-4 shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-3">
          <div className="flex items-center gap-2">
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-8 w-24" />
            <Skeleton className="h-8 w-28" />
          </div>
          <div className="flex items-center gap-2">
            <Skeleton className="h-8 w-32" />
            <Skeleton className="h-8 w-28" />
            <Skeleton className="h-8 w-28" />
          </div>
        </div>

        <div className="space-y-2.5 pt-1">
          {Array.from({ length: 10 }).map((_, idx) => (
            <div
              key={idx}
              className="grid grid-cols-12 items-center gap-3 border-b border-border/50 py-2"
            >
              <Skeleton className="col-span-1 h-4 w-6" />
              <Skeleton className="col-span-2 h-4 w-full" />
              <Skeleton className="col-span-2 h-4 w-full" />
              <Skeleton className="col-span-2 h-4 w-full" />
              <Skeleton className="col-span-2 h-5 w-24 rounded-full" />
              <Skeleton className="col-span-2 h-4 w-full" />
              <Skeleton className="col-span-1 h-6 w-12 justify-self-end" />
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}
