"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { signOut } from "next-auth/react"
import { useTheme } from "next-themes"
import { toast } from "sonner"
import type { SessionContext } from "@/lib/session"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarProvider,
  SidebarRail,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Separator } from "@/components/ui/separator"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"

interface NotificationItem {
  id: number
  type: "message" | "alert"
  title: string
  body?: string | null
  url?: string | null
  is_read: number
  created_at?: string | null
}

interface NavChild {
  label: string
  href?: string
  icon: string
  roles?: string[]
  action?: "open_customizer" | string
  children?: NavChild[]
}

interface NavGroup {
  id: string
  label: string
  icon: string
  roles: string[]
  children: NavChild[]
}

const SIDEBAR_GROUPS: NavGroup[] = [
  {
    id: "dashboard",
    label: "Dashboard",
    icon: "ri-dashboard-2-line",
    roles: ["root", "sadmin", "admin", "manager", "operater"],
    children: [
      { label: "Dashboard", href: "/dashboard", icon: "ri-user-star-line" },
    ],
  },
  {
    id: "leads",
    label: "Leads Manager",
    icon: "ri-contacts-book-line",
    roles: ["root", "sadmin", "admin", "manager", "operater"],
    children: [
      { label: "All Leads", href: "/leads", icon: "ri-list-check" },
      {
        label: "Follow-Up Calendar",
        href: "/calendar",
        icon: "ri-calendar-event-line",
      },
      {
        label: "Upload Logs",
        href: "/leads/upload/logs",
        icon: "ri-upload-cloud-2-line",
      },
      {
        label: "Test Lead API",
        href: "/test-lead-api",
        icon: "ri-code-s-slash-line",
        roles: ["root", "sadmin", "admin"],
      },
    ],
  },
  {
    id: "rawdata",
    label: "Raw Data",
    icon: "ri-database-2-line",
    roles: ["root", "sadmin", "admin"],
    children: [
      {
        label: "Upload Files",
        href: "/automation/raw-leads/uploads",
        icon: "ri-upload-cloud-2-line",
      },
      {
        label: "Raw Leads Panel",
        href: "/automation/raw-leads",
        icon: "ri-stack-line",
      },
      {
        label: "IVR Call Logs",
        href: "/automation/ivr",
        icon: "ri-phone-fill",
      },
      {
        label: "WhatsApp Logs",
        href: "/automation/whatsapp",
        icon: "ri-whatsapp-fill",
      },
      {
        label: "SMS Logs",
        href: "/automation/sms",
        icon: "ri-message-fill",
      },
      {
        label: "Verified Leads",
        href: "/automation/verified-leads",
        icon: "ri-checkbox-circle-line",
      },
      {
        label: "Rejected Leads",
        href: "/automation/rejected-leads",
        icon: "ri-close-circle-line",
      },
    ],
  },
  {
    id: "formdesk",
    label: "FormDesk",
    icon: "ri-pages-line",
    roles: ["root", "sadmin", "admin"],
    children: [
      { label: "Manage Forms", href: "/webforms", icon: "ri-file-list-3-line" },
      {
        label: "Landing Pages",
        href: "/landing-pages",
        icon: "ri-file-list-3-line",
      },
      {
        label: "Application Forms",
        href: "/application_forms",
        icon: "ri-booklet-line",
      },
    ],
  },
  {
    id: "institute",
    label: "Institute Manager",
    icon: "ri-school-line",
    roles: ["root", "sadmin", "admin", "manager"],
    children: [
      {
        label: "Institutes",
        href: "/institute-manager",
        icon: "ri-stack-line",
      },
      { label: "Courses", href: "/products", icon: "ri-book-open-line" },
    ],
  },
  {
    id: "marketing",
    label: "Marketing",
    icon: "ri-coupon-3-line",
    roles: ["root", "sadmin", "admin", "manager"],
    children: [
      { label: "Coupon List", href: "/coupons", icon: "ri-list-check-2" },
      {
        label: "Create Coupon",
        href: "/coupons/create",
        icon: "ri-add-circle-line",
      },
    ],
  },
  {
    id: "uac",
    label: "User Access Control",
    icon: "ri-shield-user-fill",
    roles: ["root", "sadmin", "admin"],
    children: [
      { label: "Manage Users", href: "/user", icon: "ri-user-line" },
      {
        label: "Manage Permissions",
        href: "/role",
        icon: "ri-lock-line",
        roles: ["root", "sadmin"],
      },
      { label: "Teams", href: "/teams", icon: "ri-team-line" },
      {
        label: "Designations",
        href: "/designations",
        icon: "ri-briefcase-line",
      },
      {
        label: "Organizations",
        href: "/organizations",
        icon: "ri-home-3-fill",
      },
    ],
  },
  {
    id: "masterdata",
    label: "Master Data",
    icon: "ri-database-2-line",
    roles: ["root", "sadmin", "admin"],
    children: [
      { label: "Pipelines", href: "/pipelines", icon: "ri-ancient-gate-line" },
      { label: "Lead Sources", href: "/sources", icon: "ri-links-line" },
      { label: "Lead Medium", href: "/types", icon: "ri-price-tag-2-line" },
      { label: "Attributes", href: "/attributes", icon: "ri-grid-line" },
      {
        label: "Webhooks",
        href: "/webhooks",
        icon: "ri-git-pull-request-line",
      },
      { label: "Campaigns", href: "/campaigns", icon: "ri-megaphone-line" },
      {
        label: "Marketing Events",
        href: "/marketing-events",
        icon: "ri-calendar-event-line",
      },
    ],
  },
  {
    id: "templates",
    label: "Template Manager",
    icon: "ri-folder-line",
    roles: ["root", "sadmin", "admin"],
    children: [
      {
        label: "Email Templates",
        href: "/email-templates",
        icon: "ri-mail-send-line",
      },
      {
        label: "WhatsApp Templates",
        href: "/whatsapp-templates",
        icon: "ri-whatsapp-line",
      },
      {
        label: "SMS Templates",
        href: "/message-templates",
        icon: "ri-chat-1-line",
      },
    ],
  },
  {
    id: "settings",
    label: "Settings",
    icon: "ri-settings-3-line",
    roles: ["root", "sadmin", "admin"],
    children: [
      {
        label: "Configuration",
        icon: "ri-tools-line",
        children: [
          {
            label: "General Settings",
            href: "/general-settings",
            icon: "ri-settings-4-line",
          },
          {
            label: "Graphics Settings",
            action: "open_customizer",
            icon: "ri-brush-line",
          },
          {
            label: "Email Settings",
            href: "/email-settings",
            icon: "ri-mail-settings-line",
          },
          {
            label: "WhatsApp Settings",
            href: "/whatsapp-settings",
            icon: "ri-whatsapp-line",
          },
          {
            label: "SMS Settings",
            href: "/sms-settings",
            icon: "ri-message-2-line",
          },
          {
            label: "IVR Settings",
            href: "/ivr-settings",
            icon: "ri-phone-line",
          },
        ],
      },
      {
        label: "Lead Settings",
        icon: "ri-list-settings-line",
        children: [
          {
            label: "Lead Settings",
            href: "/lead-settings/settings",
            icon: "ri-settings-3-line",
          },
          {
            label: "Lead Statuses",
            href: "/lead-settings/statuses",
            icon: "ri-checkbox-multiple-line",
          },
          {
            label: "Lead Sub-Statuses",
            href: "/lead-settings/sub-statuses",
            icon: "ri-node-tree",
          },
          {
            label: "Lead Distribution",
            href: "/lead-distribution",
            icon: "ri-git-branch-line",
          },
        ],
      },
      {
        label: "Lead Integrations",
        icon: "ri-plug-line",
        children: [
          {
            label: "Facebook Lead Ads",
            href: "/facebook",
            icon: "ri-facebook-circle-line",
          },
          {
            label: "Instagram Lead Ads",
            href: "/instagram",
            icon: "ri-instagram-line",
          },
          {
            label: "Google Lead Forms",
            href: "/google",
            icon: "ri-google-line",
          },
          { label: "Webhook Logs", href: "/logs", icon: "ri-file-list-3-line" },
        ],
      },
      {
        label: "Automation Rules",
        href: "/settings/automation",
        icon: "ri-robot-line",
      },
    ],
  },
  {
    id: "reports",
    label: "Reports",
    icon: "ri-bar-chart-grouped-line",
    roles: ["root", "sadmin", "admin", "manager"],
    children: [
      {
        label: "Lead Distribution Report",
        href: "/reports/lead-distribution",
        icon: "ri-git-branch-line",
      },
      {
        label: "Communication Report",
        href: "/reports/communications",
        icon: "ri-mail-send-line",
      },
    ],
  },
]

const CRON_ITEMS = [
  {
    job: "auto-assign",
    label: "Run Auto Assign",
    prompt: "Distribute all untouched student leads across active counsellors now?",
    icon: "ri-refresh-line",
    colorClass: "text-amber-400",
  },
  {
    job: "auto-reassign",
    label: "Run Auto Reassign",
    prompt: "Check overdue follow-up leads against SLA rules and auto-reassign now?",
    icon: "ri-loop-left-line",
    colorClass: "text-rose-400",
  },
  {
    job: "raw-leads-process",
    label: "Process Raw Lead Uploads",
    prompt: "Promote confirmed raw leads into Leads Manager now?",
    icon: "ri-file-list-3-line",
    colorClass: "text-indigo-300",
  },
  {
    job: "send-sms",
    label: "Send Pending SMS",
    prompt: "Dispatch queued SMS broadcasts now?",
    icon: "ri-message-2-line",
    colorClass: "text-sky-300",
  },
  {
    job: "send-email",
    label: "Send Pending Email",
    prompt: "Dispatch queued Email broadcasts now?",
    icon: "ri-mail-send-line",
    colorClass: "text-emerald-300",
  },
  {
    job: "send-whatsapp",
    label: "Send Pending WhatsApp",
    prompt: "Dispatch queued WhatsApp messages now?",
    icon: "ri-whatsapp-line",
    colorClass: "text-emerald-300",
  },
  {
    job: "lead-uploads",
    label: "Process Uploads Leads Data",
    prompt: "Process pending CSV lead batches now?",
    icon: "ri-upload-cloud-2-line",
    colorClass: "text-indigo-300",
  },
]

function VelzonSidebarBody({
  ctx,
  pathname,
  isDarkSidebar,
  filteredGroups,
  openGroups,
  setOpenGroups,
  openNested,
  setOpenNested,
  cronOpen,
  setCronOpen,
  setCustomizerOpen,
  setPendingCron,
}: {
  ctx: SessionContext
  pathname: string
  isDarkSidebar: boolean
  filteredGroups: NavGroup[]
  openGroups: Record<string, boolean>
  setOpenGroups: React.Dispatch<React.SetStateAction<Record<string, boolean>>>
  openNested: Record<string, boolean>
  setOpenNested: React.Dispatch<React.SetStateAction<Record<string, boolean>>>
  cronOpen: boolean
  setCronOpen: React.Dispatch<React.SetStateAction<boolean>>
  setCustomizerOpen: React.Dispatch<React.SetStateAction<boolean>>
  setPendingCron: React.Dispatch<
    React.SetStateAction<{ job: string; label: string; prompt: string } | null>
  >
}) {
  const { state, isMobile } = useSidebar()
  const isCollapsed = state === "collapsed" && !isMobile

  return (
    <>
      <SidebarHeader
        className={
          isCollapsed
            ? "h-[70px] items-center justify-center border-b border-sidebar-border p-0"
            : "h-[70px] justify-center border-b border-sidebar-border px-3"
        }
      >
        {isCollapsed ? (
          <Tooltip>
            <TooltipTrigger asChild>
              <Link
                href="/dashboard"
                aria-label="LMS CRM Dashboard"
                className="mx-auto flex size-9 items-center justify-center rounded-lg bg-[#0ab39c] text-sm font-bold text-white shadow-sm transition hover:scale-105"
              >
                DF
              </Link>
            </TooltipTrigger>
            <TooltipContent side="right">
              LMS CRM — {ctx.currentOrgName}
            </TooltipContent>
          </Tooltip>
        ) : (
          <Link
            href="/dashboard"
            className="flex min-w-0 items-center gap-2.5 overflow-hidden px-1"
          >
            <div className="flex size-8 shrink-0 items-center justify-center rounded-md bg-[#0ab39c] text-sm font-bold text-white shadow">
              DF
            </div>
            <div className="min-w-0 flex-1 text-left leading-tight">
              <div
                className={`truncate text-base font-bold tracking-tight ${
                  isDarkSidebar
                    ? "text-white"
                    : "text-[#405189] dark:text-white"
                }`}
              >
                LMS <span className="font-normal opacity-80">CRM</span>
              </div>
              <div className="truncate text-[10px] opacity-75">
                {ctx.currentOrgName}
              </div>
            </div>
          </Link>
        )}
      </SidebarHeader>

      <SidebarContent className="py-2">
        <SidebarGroup className={isCollapsed ? "items-center px-1.5" : ""}>
          {!isCollapsed && (
            <SidebarGroupLabel className="text-[10px] font-bold tracking-wider uppercase opacity-70">
              Menu
            </SidebarGroupLabel>
          )}
          <SidebarGroupContent>
            <SidebarMenu className={isCollapsed ? "items-center gap-1" : ""}>
              {filteredGroups.map((grp) => {
                const isGroupOpen = Boolean(openGroups[grp.id])
                const hasActiveChild = grp.children.some(
                  (ch) =>
                    (ch.href && pathname.startsWith(ch.href)) ||
                    ch.children?.some(
                      (sub) => sub.href && pathname.startsWith(sub.href)
                    )
                )

                if (isCollapsed) {
                  // Single direct link group (e.g. Dashboard)
                  if (
                    grp.children.length === 1 &&
                    grp.children[0].href &&
                    !grp.children[0].children
                  ) {
                    return (
                      <SidebarMenuItem key={grp.id}>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Link
                              href={grp.children[0].href}
                              className={`mx-auto flex size-10 items-center justify-center rounded-lg transition ${
                                hasActiveChild
                                  ? "bg-sidebar-accent text-sidebar-accent-foreground shadow-xs"
                                  : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                              }`}
                            >
                              <i className={`${grp.icon} text-lg leading-none`} />
                            </Link>
                          </TooltipTrigger>
                          <TooltipContent side="right">
                            {grp.label}
                          </TooltipContent>
                        </Tooltip>
                      </SidebarMenuItem>
                    )
                  }

                  // Multi-item group: Icon button + right-side DropdownMenu flyout!
                  return (
                    <SidebarMenuItem key={grp.id}>
                      <DropdownMenu>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <DropdownMenuTrigger asChild>
                              <button
                                type="button"
                                className={`mx-auto flex size-10 items-center justify-center rounded-lg transition outline-none ${
                                  hasActiveChild
                                    ? "bg-sidebar-accent text-sidebar-accent-foreground shadow-xs"
                                    : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                                }`}
                                aria-label={grp.label}
                              >
                                <i
                                  className={`${grp.icon} text-lg leading-none`}
                                />
                              </button>
                            </DropdownMenuTrigger>
                          </TooltipTrigger>
                          <TooltipContent side="right">
                            {grp.label}
                          </TooltipContent>
                        </Tooltip>
                        <DropdownMenuContent
                          side="right"
                          align="start"
                          sideOffset={10}
                          className="w-56 text-xs"
                        >
                          <DropdownMenuLabel className="text-xs font-bold text-[#405189]">
                            {grp.label}
                          </DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          {grp.children.map((child) => {
                            if (child.children) {
                              return (
                                <DropdownMenuSub key={child.label}>
                                  <DropdownMenuSubTrigger className="cursor-pointer gap-2 text-xs">
                                    <i className={child.icon} />
                                    <span>{child.label}</span>
                                  </DropdownMenuSubTrigger>
                                  <DropdownMenuSubContent className="w-52 text-xs">
                                    {child.children.map((sub) =>
                                      sub.action === "open_customizer" ? (
                                        <DropdownMenuItem
                                          key={sub.label}
                                          onClick={() =>
                                            setCustomizerOpen(true)
                                          }
                                          className="cursor-pointer gap-2 text-xs"
                                        >
                                          <i className={sub.icon} />
                                          <span>{sub.label}</span>
                                        </DropdownMenuItem>
                                      ) : (
                                        <DropdownMenuItem
                                          key={sub.label}
                                          asChild
                                          className="cursor-pointer gap-2 text-xs"
                                        >
                                          <Link href={sub.href || "#"}>
                                            <i className={sub.icon} />
                                            <span>{sub.label}</span>
                                          </Link>
                                        </DropdownMenuItem>
                                      )
                                    )}
                                  </DropdownMenuSubContent>
                                </DropdownMenuSub>
                              )
                            }
                            return (
                              <DropdownMenuItem
                                key={child.label}
                                asChild
                                className="cursor-pointer gap-2 text-xs"
                              >
                                <Link href={child.href || "#"}>
                                  <i className={child.icon} />
                                  <span>{child.label}</span>
                                </Link>
                              </DropdownMenuItem>
                            )
                          })}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </SidebarMenuItem>
                  )
                }

                return (
                  <Collapsible
                    key={grp.id}
                    open={isGroupOpen}
                    onOpenChange={(open) =>
                      setOpenGroups((prev) => ({ ...prev, [grp.id]: open }))
                    }
                    className="group/collapsible"
                  >
                    <SidebarMenuItem>
                      <CollapsibleTrigger asChild>
                        <SidebarMenuButton
                          isActive={hasActiveChild}
                          className="font-medium"
                        >
                          <i className={`${grp.icon} shrink-0 text-base`} />
                          <span className="truncate">{grp.label}</span>
                          <i
                            className={`ri-arrow-right-s-line ml-auto shrink-0 transition-transform duration-200 ${
                              isGroupOpen ? "rotate-90" : ""
                            }`}
                          />
                        </SidebarMenuButton>
                      </CollapsibleTrigger>

                      <CollapsibleContent>
                        <SidebarMenuSub>
                          {grp.children.map((child) => {
                            if (child.children) {
                              const nestedOpen = Boolean(
                                openNested[child.label]
                              )
                              return (
                                <Collapsible
                                  key={child.label}
                                  open={nestedOpen}
                                  onOpenChange={(o) =>
                                    setOpenNested((p) => ({
                                      ...p,
                                      [child.label]: o,
                                    }))
                                  }
                                >
                                  <SidebarMenuSubItem>
                                    <CollapsibleTrigger asChild>
                                      <SidebarMenuSubButton className="w-full cursor-pointer justify-between">
                                        <span className="flex min-w-0 items-center gap-2">
                                          <i
                                            className={`${child.icon} shrink-0`}
                                          />
                                          <span className="truncate">
                                            {child.label}
                                          </span>
                                        </span>
                                        <i
                                          className={`ri-arrow-right-s-line shrink-0 transition-transform ${
                                            nestedOpen ? "rotate-90" : ""
                                          }`}
                                        />
                                      </SidebarMenuSubButton>
                                    </CollapsibleTrigger>
                                    <CollapsibleContent>
                                      <div className="mt-0.5 space-y-0.5 border-l border-sidebar-border pl-3">
                                        {child.children.map((sub) => {
                                          if (
                                            sub.action === "open_customizer"
                                          ) {
                                            return (
                                              <SidebarMenuSubButton
                                                key={sub.label}
                                                onClick={() =>
                                                  setCustomizerOpen(true)
                                                }
                                                className="w-full cursor-pointer"
                                              >
                                                <i
                                                  className={`${sub.icon} shrink-0`}
                                                />
                                                <span className="truncate">
                                                  {sub.label}
                                                </span>
                                              </SidebarMenuSubButton>
                                            )
                                          }
                                          return (
                                            <SidebarMenuSubButton
                                              key={sub.label}
                                              asChild
                                              isActive={pathname === sub.href}
                                            >
                                              <Link href={sub.href || "#"}>
                                                <i
                                                  className={`${sub.icon} shrink-0`}
                                                />
                                                <span className="truncate">
                                                  {sub.label}
                                                </span>
                                              </Link>
                                            </SidebarMenuSubButton>
                                          )
                                        })}
                                      </div>
                                    </CollapsibleContent>
                                  </SidebarMenuSubItem>
                                </Collapsible>
                              )
                            }

                            const childActive = Boolean(
                              child.href &&
                                (pathname === child.href ||
                                  (child.href !== "/leads" &&
                                    pathname.startsWith(child.href)))
                            )

                            return (
                              <SidebarMenuSubItem key={child.label}>
                                <SidebarMenuSubButton
                                  asChild
                                  isActive={childActive}
                                >
                                  <Link href={child.href || "#"}>
                                    <i className={`${child.icon} shrink-0`} />
                                    <span className="truncate">
                                      {child.label}
                                    </span>
                                  </Link>
                                </SidebarMenuSubButton>
                              </SidebarMenuSubItem>
                            )
                          })}
                        </SidebarMenuSub>
                      </CollapsibleContent>
                    </SidebarMenuItem>
                  </Collapsible>
                )
              })}

              {/* CRON JOBS (root & sadmin) */}
              {(ctx.roleSlug === "root" || ctx.roleSlug === "sadmin") &&
                (isCollapsed ? (
                  <SidebarMenuItem>
                    <DropdownMenu>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <DropdownMenuTrigger asChild>
                            <button
                              type="button"
                              className="mx-auto flex size-10 items-center justify-center rounded-lg text-amber-400 transition hover:bg-sidebar-accent outline-none"
                              aria-label="Cron Jobs"
                            >
                              <i className="ri-restart-line text-lg leading-none" />
                            </button>
                          </DropdownMenuTrigger>
                        </TooltipTrigger>
                        <TooltipContent side="right">Cron Jobs</TooltipContent>
                      </Tooltip>
                      <DropdownMenuContent
                        side="right"
                        align="start"
                        sideOffset={10}
                        className="w-56 text-xs"
                      >
                        <DropdownMenuLabel className="text-xs font-bold text-[#405189]">
                          Cron Jobs
                        </DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        {CRON_ITEMS.map((item) => (
                          <DropdownMenuItem
                            key={item.job}
                            onClick={() => setPendingCron(item)}
                            className="cursor-pointer gap-2 text-xs"
                          >
                            <i className={`${item.icon} text-[#405189]`} />
                            <span>{item.label}</span>
                          </DropdownMenuItem>
                        ))}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </SidebarMenuItem>
                ) : (
                  <Collapsible open={cronOpen} onOpenChange={setCronOpen}>
                    <SidebarMenuItem>
                      <CollapsibleTrigger asChild>
                        <SidebarMenuButton className="font-medium">
                          <i className="ri-restart-line shrink-0 text-base text-amber-400" />
                          <span className="truncate">Cron Jobs</span>
                          <i
                            className={`ri-arrow-right-s-line ml-auto shrink-0 transition-transform ${
                              cronOpen ? "rotate-90" : ""
                            }`}
                          />
                        </SidebarMenuButton>
                      </CollapsibleTrigger>
                      <CollapsibleContent>
                        <SidebarMenuSub>
                          {CRON_ITEMS.map((item) => (
                            <SidebarMenuSubItem key={item.job}>
                              <SidebarMenuSubButton
                                onClick={() => setPendingCron(item)}
                                className="w-full cursor-pointer"
                              >
                                <i
                                  className={`${item.icon} ${item.colorClass} shrink-0`}
                                />
                                <span className="truncate">{item.label}</span>
                              </SidebarMenuSubButton>
                            </SidebarMenuSubItem>
                          ))}
                        </SidebarMenuSub>
                      </CollapsibleContent>
                    </SidebarMenuItem>
                  </Collapsible>
                ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border p-2">
        {isCollapsed ? (
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="mx-auto flex size-8 items-center justify-center rounded-full bg-[#0ab39c]/20">
                <span className="size-2.5 rounded-full bg-[#0ab39c]" />
              </div>
            </TooltipTrigger>
            <TooltipContent side="right">
              Role: {ctx.roleName} • Online
            </TooltipContent>
          </Tooltip>
        ) : (
          <div className="flex min-w-0 items-center justify-between gap-2 px-2 py-1 text-[11px] opacity-85">
            <span className="truncate">Role: {ctx.roleName}</span>
            <Badge
              variant="secondary"
              className="shrink-0 border-0 bg-[#0ab39c]/20 text-[10px] text-[#0ab39c]"
            >
              Online
            </Badge>
          </div>
        )}
      </SidebarFooter>
      <SidebarRail />
    </>
  )
}

export function AdminShell({
  ctx,
  children,
}: {
  ctx: SessionContext
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const router = useRouter()
  const { resolvedTheme, setTheme } = useTheme()

  // Layout & Theme Customizer states
  const [sidebarOpen, setSidebarOpen] = React.useState(true)
  const [sidebarTone, setSidebarTone] = React.useState<
    "light" | "dark" | "gradient"
  >("dark")
  const [layoutWidth, setLayoutWidth] = React.useState<"fluid" | "boxed">(
    "fluid"
  )
  const [customizerOpen, setCustomizerOpen] = React.useState(false)
  const [instPopoverOpen, setInstPopoverOpen] = React.useState(false)
  const [notiPopoverOpen, setNotiPopoverOpen] = React.useState(false)
  const [showBackTop, setShowBackTop] = React.useState(false)

  // Cron confirmation AlertDialog
  const [pendingCron, setPendingCron] = React.useState<{
    job: string
    label: string
    prompt: string
  } | null>(null)

  // Collapsible sidebar group states
  const [openGroups, setOpenGroups] = React.useState<Record<string, boolean>>({
    dashboard: true,
    leads: true,
  })
  const [openNested, setOpenNested] = React.useState<Record<string, boolean>>({
    Configuration: true,
    "Lead Settings": true,
  })
  const [cronOpen, setCronOpen] = React.useState(false)

  // Notifications state
  const [notiTab, setNotiTab] = React.useState<"all" | "message" | "alert">(
    "all"
  )
  const [unreadCount, setUnreadCount] = React.useState(0)
  const [totalNotiCount, setTotalNotiCount] = React.useState(0)
  const [notifications, setNotifications] = React.useState<NotificationItem[]>(
    []
  )
  const [selectedNotiIds, setSelectedNotiIds] = React.useState<number[]>([])

  React.useEffect(() => {
    try {
      const savedTone = localStorage.getItem("df_sidebar_tone") as
        | "light"
        | "dark"
        | "gradient"
        | null
      if (savedTone) setSidebarTone(savedTone)
      const savedCollapsed = localStorage.getItem("df_sidebar_collapsed")
      if (savedCollapsed === "1") setSidebarOpen(false)
    } catch {
      // ignore
    }
  }, [])

  React.useEffect(() => {
    for (const grp of SIDEBAR_GROUPS) {
      const match = grp.children.some(
        (ch) =>
          (ch.href && pathname.startsWith(ch.href)) ||
          ch.children?.some((sub) => sub.href && pathname.startsWith(sub.href))
      )
      if (match) {
        setOpenGroups((prev) => ({ ...prev, [grp.id]: true }))
      }
    }
  }, [pathname])

  React.useEffect(() => {
    const onScroll = () => setShowBackTop(window.scrollY > 220)
    window.addEventListener("scroll", onScroll)
    return () => window.removeEventListener("scroll", onScroll)
  }, [])

  const notiTabRef = React.useRef(notiTab)
  React.useEffect(() => {
    notiTabRef.current = notiTab
  }, [notiTab])

  const loadNotifications = React.useCallback(
    async (tab?: "all" | "message" | "alert") => {
      const targetTab = tab ?? notiTabRef.current
      try {
        const res = await fetch(`/api/notifications?type=${targetTab}`)
        if (!res.ok) return
        const data = await res.json()
        setUnreadCount(Number(data.unreadCount || 0))
        setTotalNotiCount(Number(data.totalCount || 0))
        setNotifications(Array.isArray(data.items) ? data.items : [])
      } catch {
        // ignore
      }
    },
    []
  )

  React.useEffect(() => {
    loadNotifications("all")
  }, [loadNotifications])

  async function handleSwitchInstitute(id: number | null) {
    setInstPopoverOpen(false)
    await fetch("/api/context", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(
        id ? { action: "switch_institute", id } : { action: "clear_institute" }
      ),
    })
    toast.success(id ? "Switched active institute" : "Viewing all institutes")
    router.refresh()
  }

  async function handleSwitchOrg(id: number) {
    await fetch("/api/context", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "switch_org", id }),
    })
    toast.success("Switched active organization")
    router.refresh()
  }

  async function handleMarkAllRead() {
    await fetch("/api/notifications", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "read_all" }),
    })
    setSelectedNotiIds([])
    await loadNotifications(notiTab)
    toast.success("All notifications marked as read")
  }

  async function handleMarkSelectedRead() {
    if (selectedNotiIds.length === 0) return
    await fetch("/api/notifications", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "read_bulk", ids: selectedNotiIds }),
    })
    setSelectedNotiIds([])
    await loadNotifications(notiTab)
    toast.success("Selected notifications marked as read")
  }

  async function executeConfirmedCron() {
    if (!pendingCron) return
    const { job } = pendingCron
    setPendingCron(null)
    const t = toast.loading("Running cron job...")
    try {
      const res = await fetch("/api/cron", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ job }),
      })
      const data = await res.json()
      toast.dismiss(t)
      toast.success(data.message || "Cron completed")
      router.refresh()
    } catch {
      toast.dismiss(t)
      toast.error("Failed to execute cron job")
    }
  }

  function toggleFullscreen() {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen?.().catch(() => {})
    } else {
      document.exitFullscreen?.().catch(() => {})
    }
  }

  const isDarkSidebar = sidebarTone === "dark" || sidebarTone === "gradient"

  const memberSinceFormatted = React.useMemo(() => {
    const d = new Date(ctx.memberSince)
    if (Number.isNaN(d.getTime())) return "2026"
    return d.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    })
  }, [ctx.memberSince])

  const filteredGroups = React.useMemo(
    () =>
      SIDEBAR_GROUPS.filter((g) => g.roles.includes(ctx.roleSlug)).map((g) => ({
        ...g,
        children: g.children.filter(
          (ch) => !ch.roles || ch.roles.includes(ctx.roleSlug)
        ),
      })),
    [ctx.roleSlug]
  )

  return (
    <div
      data-sidebar={sidebarTone === "light" ? "light" : "dark"}
      className="min-h-screen bg-[var(--vz-page-bg)]"
    >
      <SidebarProvider
        open={sidebarOpen}
        onOpenChange={(next) => {
          setSidebarOpen(next)
          try {
            localStorage.setItem("df_sidebar_collapsed", next ? "0" : "1")
          } catch {
            // ignore
          }
        }}
      >
        {/* ==================== SHADCN SIDEBAR (VELZON THEMED) ==================== */}
        <Sidebar
          collapsible="icon"
          className={
            sidebarTone === "gradient"
              ? "border-r-0 [&_[data-slot=sidebar-inner]]:bg-gradient-to-b [&_[data-slot=sidebar-inner]]:from-[#405189] [&_[data-slot=sidebar-inner]]:via-[#2a3866] [&_[data-slot=sidebar-inner]]:to-[#192342]"
              : ""
          }
        >
          <VelzonSidebarBody
            ctx={ctx}
            pathname={pathname}
            isDarkSidebar={isDarkSidebar}
            filteredGroups={filteredGroups}
            openGroups={openGroups}
            setOpenGroups={setOpenGroups}
            openNested={openNested}
            setOpenNested={setOpenNested}
            cronOpen={cronOpen}
            setCronOpen={setCronOpen}
            setCustomizerOpen={setCustomizerOpen}
            setPendingCron={setPendingCron}
          />
        </Sidebar>

        {/* ==================== SHADCN SIDEBAR INSET ==================== */}
        <SidebarInset className="flex min-h-screen min-w-0 max-w-full flex-col overflow-x-clip bg-[var(--vz-page-bg)]">
          {/* ==================== TOPBAR ==================== */}
          <header className="sticky top-0 z-30 flex h-[70px] min-w-0 items-center justify-between gap-2 border-b border-border bg-card px-4 shadow-xs lg:px-6">
            <div className="flex min-w-0 items-center gap-2.5">
              <SidebarTrigger className="size-9 shrink-0 text-muted-foreground hover:bg-muted hover:text-foreground" />

              {/* Organization Switcher DropdownMenu */}
              {ctx.organizations.length > 1 && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      className="hidden max-w-[220px] gap-1.5 text-xs sm:inline-flex"
                    >
                      <i className="ri-building-2-line shrink-0 text-[#405189]" />
                      <span className="truncate">
                        {ctx.organizations.find((o) => o.id === ctx.orgId)
                          ?.name || "Organization"}
                      </span>
                      <i className="ri-arrow-down-s-line shrink-0 opacity-70" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" className="w-64">
                    <DropdownMenuLabel className="text-xs text-muted-foreground">
                      Switch Organization
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    {ctx.organizations.map((org) => (
                      <DropdownMenuItem
                        key={org.id}
                        onClick={() => handleSwitchOrg(org.id)}
                        className="flex cursor-pointer items-center justify-between text-xs"
                      >
                        <span
                          className={
                            org.id === ctx.orgId
                              ? "font-semibold text-[#405189]"
                              : ""
                          }
                        >
                          {org.name}
                        </span>
                        {org.id === ctx.orgId && (
                          <i className="ri-check-line text-[#0ab39c]" />
                        )}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>

            {/* Right Toolbar */}
            <div className="flex shrink-0 items-center gap-1 sm:gap-2">
              {ctx.currentInstituteName && (
                <Badge
                  variant="outline"
                  className="mr-1 hidden max-w-[180px] truncate border-[#405189]/30 bg-[#405189]/5 text-xs font-semibold text-[#405189] md:inline-flex"
                >
                  <span className="truncate">{ctx.currentInstituteName}</span>
                </Badge>
              )}

              {/* Change Institute Popover */}
              {ctx.institutes.length > 1 && (
                <Popover
                  open={instPopoverOpen}
                  onOpenChange={setInstPopoverOpen}
                >
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <PopoverTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="rounded-full text-muted-foreground"
                          aria-label="Change Institute"
                        >
                          <i className="ri-school-line text-[20px]" />
                        </Button>
                      </PopoverTrigger>
                    </TooltipTrigger>
                    <TooltipContent>Change Institute</TooltipContent>
                  </Tooltip>
                  <PopoverContent align="end" className="w-80 p-0">
                    <div className="flex items-center justify-between border-b border-border px-4 py-3">
                      <h6 className="text-sm font-semibold">
                        Change Institute
                      </h6>
                      <Button
                        variant="link"
                        size="xs"
                        onClick={() => handleSwitchInstitute(null)}
                        className="text-[#405189]"
                      >
                        View All
                      </Button>
                    </div>
                    <div className="grid grid-cols-3 gap-2 p-3">
                      {ctx.institutes.map((inst) => (
                        <button
                          key={inst.id}
                          type="button"
                          onClick={() => handleSwitchInstitute(inst.id)}
                          className={`flex flex-col items-center justify-center rounded-md border p-2.5 text-center text-[11px] font-medium transition hover:bg-muted ${
                            ctx.currentInstituteId === inst.id
                              ? "border-[#405189] bg-[#405189]/10 text-[#405189]"
                              : "border-transparent"
                          }`}
                        >
                          <i className="ri-building-4-line mb-1 text-xl text-[#405189]" />
                          <span className="line-clamp-2 uppercase">
                            {inst.name}
                          </span>
                        </button>
                      ))}
                    </div>
                  </PopoverContent>
                </Popover>
              )}

              {/* Fullscreen Button with Tooltip */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={toggleFullscreen}
                    className="hidden rounded-full text-muted-foreground sm:inline-flex"
                  >
                    <i className="ri-fullscreen-line text-[20px]" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Toggle Fullscreen</TooltipContent>
              </Tooltip>

              {/* Light/Dark Mode Button with Tooltip */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() =>
                      setTheme(resolvedTheme === "dark" ? "light" : "dark")
                    }
                    className="rounded-full text-muted-foreground"
                  >
                    <i
                      className={
                        resolvedTheme === "dark"
                          ? "ri-sun-line text-[20px]"
                          : "ri-moon-line text-[20px]"
                      }
                    />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Toggle Light / Dark Mode</TooltipContent>
              </Tooltip>

              {/* Notifications Bell Popover with shadcn Tabs + ScrollArea + Checkbox */}
              <Popover
                open={notiPopoverOpen}
                onOpenChange={(open) => {
                  setNotiPopoverOpen(open)
                  if (open) loadNotifications(notiTab)
                }}
              >
                <PopoverTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="relative rounded-full text-muted-foreground"
                    aria-label="Notifications"
                  >
                    <i className="ri-notification-3-line text-[20px]" />
                    {unreadCount > 0 && (
                      <Badge className="absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#f06548] px-1 text-[10px] font-bold text-white border-0">
                        {unreadCount}
                      </Badge>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent align="end" className="w-80 sm:w-96 p-0 overflow-hidden">
                  <div className="bg-[#405189] px-4 pt-3 pb-2 text-white">
                    <div className="flex items-center justify-between">
                      <h6 className="text-sm font-semibold">Notifications</h6>
                      <Badge className="bg-white/20 text-white border-0 text-[11px]">
                        {unreadCount} New
                      </Badge>
                    </div>
                    <Tabs
                      value={notiTab}
                      onValueChange={(val) => {
                        const t = val as "all" | "message" | "alert"
                        setNotiTab(t)
                        loadNotifications(t)
                      }}
                      className="mt-2.5"
                    >
                      <TabsList className="h-7 bg-white/15 p-0.5">
                        <TabsTrigger
                          value="all"
                          className="text-xs text-white/80 data-active:bg-white data-active:text-[#405189]"
                        >
                          All ({totalNotiCount})
                        </TabsTrigger>
                        <TabsTrigger
                          value="message"
                          className="text-xs text-white/80 data-active:bg-white data-active:text-[#405189]"
                        >
                          Messages
                        </TabsTrigger>
                        <TabsTrigger
                          value="alert"
                          className="text-xs text-white/80 data-active:bg-white data-active:text-[#405189]"
                        >
                          Alerts
                        </TabsTrigger>
                      </TabsList>
                    </Tabs>
                  </div>

                  <ScrollArea className="h-72">
                    {notifications.length === 0 ? (
                      <div className="py-10 text-center text-xs text-muted-foreground">
                        <i className="ri-notification-off-line mb-1 block text-2xl opacity-50" />
                        No notifications in this tab
                      </div>
                    ) : (
                      <div className="divide-y divide-border">
                        {notifications.map((item) => {
                          const checked = selectedNotiIds.includes(item.id)
                          return (
                            <div
                              key={item.id}
                              className={`flex items-start gap-3 px-4 py-3 text-xs transition hover:bg-muted/50 ${
                                item.is_read === 0 ? "bg-[#405189]/5" : ""
                              }`}
                            >
                              <Checkbox
                                checked={checked}
                                onCheckedChange={(v) =>
                                  setSelectedNotiIds((prev) =>
                                    v
                                      ? [...prev, item.id]
                                      : prev.filter((x) => x !== item.id)
                                  )
                                }
                                className="mt-0.5"
                              />
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center justify-between gap-2">
                                  <span className="truncate font-semibold text-foreground">
                                    {item.title}
                                  </span>
                                  {item.is_read === 0 && (
                                    <span className="size-2 shrink-0 rounded-full bg-[#0ab39c]" />
                                  )}
                                </div>
                                {item.body && (
                                  <p className="mt-0.5 line-clamp-2 text-muted-foreground">
                                    {item.body}
                                  </p>
                                )}
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </ScrollArea>

                  <div className="flex items-center justify-between border-t border-border bg-muted/30 px-3 py-2 text-xs">
                    {selectedNotiIds.length > 0 ? (
                      <div className="flex items-center gap-2">
                        <span className="font-medium">
                          {selectedNotiIds.length} selected
                        </span>
                        <Button
                          size="xs"
                          variant="secondary"
                          onClick={handleMarkSelectedRead}
                        >
                          Mark Read
                        </Button>
                      </div>
                    ) : (
                      <span className="text-muted-foreground">
                        Notification Center
                      </span>
                    )}
                    <Button
                      size="xs"
                      variant="ghost"
                      onClick={handleMarkAllRead}
                      className="text-[#0ab39c] hover:text-[#0ab39c]"
                    >
                      Mark All Read <i className="ri-check-double-line ml-0.5" />
                    </Button>
                  </div>
                </PopoverContent>
              </Popover>

              {/* User Profile DropdownMenu with shadcn Avatar */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    type="button"
                    className="ml-1 flex items-center gap-2.5 rounded-md bg-muted/50 px-2.5 py-1.5 transition hover:bg-muted outline-none"
                  >
                    <Avatar className="size-8">
                      <AvatarFallback className="bg-[#405189] text-xs font-bold text-white">
                        {ctx.firstName.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="hidden text-left xl:block">
                      <div className="text-xs font-semibold text-foreground">
                        {ctx.fullName} [{ctx.roleName}]
                      </div>
                      <div className="text-[11px] text-muted-foreground">
                        Member since {memberSinceFormatted}
                      </div>
                    </div>
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-60">
                  <DropdownMenuLabel className="text-xs font-semibold text-muted-foreground">
                    Welcome {ctx.fullName} [{ctx.roleName}]!
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild className="cursor-pointer text-xs">
                    <Link href="/profile" className="flex items-center gap-2">
                      <i className="ri-user-settings-line text-sm text-muted-foreground" />
                      <span>My Profile & Password</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => setCustomizerOpen(true)}
                    className="cursor-pointer text-xs"
                  >
                    <i className="ri-brush-line text-sm text-muted-foreground" />
                    <span>Theme Customizer</span>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => signOut({ callbackUrl: "/login" })}
                    className="cursor-pointer text-xs text-[#f06548] focus:text-[#f06548]"
                  >
                    <i className="ri-shut-down-line text-sm" />
                    <span>Log out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </header>

          {/* ==================== MAIN PAGE CONTENT ==================== */}
          <div className="min-w-0 flex-1 p-4 lg:p-6">
            <div
              className={
                layoutWidth === "boxed"
                  ? "mx-auto w-full min-w-0 max-w-7xl"
                  : "w-full min-w-0"
              }
            >
              {children}
            </div>
          </div>

          {/* ==================== FOOTER ==================== */}
          <footer className="border-t border-border bg-card px-6 py-3.5 text-xs text-muted-foreground">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span>{new Date().getFullYear()} © LMS.</span>
              <span>Design & Develop by Digital Fueled IT Pvt. Ltd.</span>
            </div>
          </footer>
        </SidebarInset>
      </SidebarProvider>

      {/* ==================== FLOATING THEME CUSTOMIZER COG ==================== */}
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            type="button"
            size="icon-lg"
            onClick={() => setCustomizerOpen(true)}
            className="fixed right-5 bottom-16 z-40 hidden size-11 rounded-full bg-[#299cdb] text-white shadow-lg hover:bg-[#2389c2] md:inline-flex"
          >
            <i className="ri-settings-3-line animate-spin-slow text-xl" />
          </Button>
        </TooltipTrigger>
        <TooltipContent side="left">Theme Customizer</TooltipContent>
      </Tooltip>

      {/* ==================== BACK TO TOP BUTTON ==================== */}
      {showBackTop && (
        <Button
          type="button"
          size="icon"
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          className="fixed right-5 bottom-4 z-40 rounded bg-[#f06548] text-white shadow-md hover:bg-[#f06548]/90"
          aria-label="Back to top"
        >
          <i className="ri-arrow-up-line" />
        </Button>
      )}

      {/* ==================== SHADCN SHEET: THEME CUSTOMIZER ==================== */}
      <Sheet open={customizerOpen} onOpenChange={setCustomizerOpen}>
        <SheetContent side="right" className="flex w-full max-w-sm flex-col p-0">
          <SheetHeader className="bg-gradient-to-r from-[#405189] to-[#299cdb] px-5 py-4 text-white">
            <SheetTitle className="text-sm font-semibold text-white">
              Theme Customizer
            </SheetTitle>
            <SheetDescription className="text-xs text-white/80">
              Customize your Velzon CRM color scheme, sidebar & layout width.
            </SheetDescription>
          </SheetHeader>

          <div className="flex-1 space-y-6 overflow-y-auto p-5 text-sm">
            <div>
              <h6 className="text-xs font-bold tracking-wider uppercase">
                Color Scheme
              </h6>
              <p className="mb-2.5 text-xs text-muted-foreground">
                Choose Light or Dark Scheme (or press &apos;d&apos;).
              </p>
              <div className="grid grid-cols-2 gap-3">
                {(["light", "dark"] as const).map((mode) => (
                  <Button
                    key={mode}
                    type="button"
                    variant={resolvedTheme === mode ? "default" : "outline"}
                    onClick={() => setTheme(mode)}
                    className="capitalize"
                  >
                    <i
                      className={`mr-1.5 ${
                        mode === "light" ? "ri-sun-line" : "ri-moon-line"
                      }`}
                    />
                    {mode} Mode
                  </Button>
                ))}
              </div>
            </div>

            <Separator />

            <div>
              <h6 className="text-xs font-bold tracking-wider uppercase">
                Sidebar Color
              </h6>
              <p className="mb-2.5 text-xs text-muted-foreground">
                Choose Light, Dark Indigo, or Gradient sidebar.
              </p>
              <div className="grid grid-cols-3 gap-2">
                {(["light", "dark", "gradient"] as const).map((tone) => (
                  <Button
                    key={tone}
                    type="button"
                    size="sm"
                    variant={sidebarTone === tone ? "default" : "outline"}
                    onClick={() => {
                      setSidebarTone(tone)
                      localStorage.setItem("df_sidebar_tone", tone)
                    }}
                    className="capitalize"
                  >
                    {tone}
                  </Button>
                ))}
              </div>
            </div>

            <Separator />

            <div>
              <h6 className="text-xs font-bold tracking-wider uppercase">
                Sidebar Size
              </h6>
              <p className="mb-2.5 text-xs text-muted-foreground">
                Choose full menu or compact icon rail.
              </p>
              <div className="grid grid-cols-2 gap-3">
                <Button
                  type="button"
                  size="sm"
                  variant={sidebarOpen ? "default" : "outline"}
                  onClick={() => {
                    setSidebarOpen(true)
                    localStorage.setItem("df_sidebar_collapsed", "0")
                  }}
                >
                  Default (250px)
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant={!sidebarOpen ? "default" : "outline"}
                  onClick={() => {
                    setSidebarOpen(false)
                    localStorage.setItem("df_sidebar_collapsed", "1")
                  }}
                >
                  Small Icon View
                </Button>
              </div>
            </div>

            <Separator />

            <div>
              <h6 className="text-xs font-bold tracking-wider uppercase">
                Layout Width
              </h6>
              <div className="mt-2 grid grid-cols-2 gap-3">
                {(["fluid", "boxed"] as const).map((w) => (
                  <Button
                    key={w}
                    type="button"
                    size="sm"
                    variant={layoutWidth === w ? "default" : "outline"}
                    onClick={() => setLayoutWidth(w)}
                    className="capitalize"
                  >
                    {w}
                  </Button>
                ))}
              </div>
            </div>
          </div>

          <SheetFooter className="flex-row gap-2 border-t border-border p-4">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={() => {
                setTheme("light")
                setSidebarTone("dark")
                setSidebarOpen(true)
                setLayoutWidth("fluid")
                localStorage.setItem("df_sidebar_tone", "dark")
                localStorage.setItem("df_sidebar_collapsed", "0")
              }}
            >
              Reset
            </Button>
            <Button
              type="button"
              className="flex-1 bg-[#405189] text-white hover:bg-[#364574]"
              onClick={() => setCustomizerOpen(false)}
            >
              Apply & Close
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      {/* ==================== SHADCN ALERT DIALOG: CRON CONFIRMATION ==================== */}
      <AlertDialog
        open={Boolean(pendingCron)}
        onOpenChange={(open) => !open && setPendingCron(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{pendingCron?.label}</AlertDialogTitle>
            <AlertDialogDescription>
              {pendingCron?.prompt}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={executeConfirmedCron}
              className="bg-[#405189] text-white hover:bg-[#364574]"
            >
              Run Cron Now
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
