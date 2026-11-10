import Link from "next/link"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

export default function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/30 p-6">
      <Card className="max-w-md gap-3 p-8 text-center shadow-sm">
        <div className="text-4xl font-extrabold text-[#405189]">404</div>
        <h2 className="text-base font-bold">Page Not Found</h2>
        <p className="text-xs text-muted-foreground">
          The requested CRM resource or page could not be found.
        </p>
        <div className="pt-2">
          <Button
            asChild
            size="sm"
            className="bg-[#405189] text-xs font-semibold text-white hover:bg-[#364574]"
          >
            <Link href="/dashboard">Return to Dashboard</Link>
          </Button>
        </div>
      </Card>
    </div>
  )
}
