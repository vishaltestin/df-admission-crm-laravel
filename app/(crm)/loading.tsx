import { Card } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

export default function CrmLoading() {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Skeleton className="h-5 w-40" />
        <Skeleton className="h-4 w-28" />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, idx) => (
          <Card key={idx} className="gap-2 p-4 shadow-xs">
            <Skeleton className="h-3.5 w-24" />
            <Skeleton className="h-7 w-20" />
            <Skeleton className="h-3 w-32" />
          </Card>
        ))}
      </div>

      <Card className="gap-4 p-4 shadow-xs">
        <div className="flex items-center justify-between border-b border-border pb-3">
          <Skeleton className="h-5 w-44" />
          <div className="flex gap-2">
            <Skeleton className="h-8 w-52" />
            <Skeleton className="h-8 w-28" />
          </div>
        </div>
        <div className="space-y-2.5">
          {Array.from({ length: 8 }).map((_, idx) => (
            <div key={idx} className="grid grid-cols-6 gap-3 py-1.5">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-20 justify-self-end" />
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}
