import Link from "next/link"

export function BreadcrumbBar({
  parent,
  title,
}: {
  parent: string
  title: string
}) {
  return (
    <div className="mb-4 flex flex-wrap items-center justify-between gap-2 border-b border-border/60 pb-3">
      <h4 className="text-[15px] font-bold uppercase tracking-wide text-foreground">
        {title}
      </h4>
      <ol className="flex items-center gap-1.5 text-[13px] text-muted-foreground">
        <li>
          <Link href="/dashboard" className="hover:text-[#405189]">
            {parent}
          </Link>
        </li>
        <li>
          <i className="ri-arrow-right-s-line align-middle text-sm" />
        </li>
        <li className="font-medium text-foreground">{title}</li>
      </ol>
    </div>
  )
}
