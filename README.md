# LMS - Admin & Dashboard (`df-laravel-crm` → `hms` Next.js 16 Stack)

Complete 1:1 conversion of **[vishaltestin/df-laravel-crm](https://github.com/vishaltestin/df-laravel-crm)** (Laravel 12 + Cartalyst Sentinel + Velzon Bootstrap 5 Admin CRM) into the exact modern architecture and tech stack of **[vishaltestin/hms](https://github.com/vishaltestin/hms)**.

## Target Tech Stack (`hms` Parity)
- **Framework**: Next.js `16.3.6` (App Router, Turbopack, Server & Client Components)
- **Runtime / UI**: React `19.3.0`, TypeScript `5`, Tailwind CSS `v4`, `@tanstack/react-table` (`^8.21.3` — reusable `DataTable` in `components/ui/data-table.tsx` + 30-column `useReactTable` in `LeadsManagerClient`), full 24-primitive `shadcn/ui` (`radix-nova` — `Sidebar`, `Dialog`, `AlertDialog`, `Sheet`, `DropdownMenu`, `Popover`, `Tabs`, `Table`, `Card`, `Badge`, `Switch`, `Checkbox`, `Tooltip`, `Collapsible`, `ScrollArea`, `Avatar`, `Input`, `Textarea`, `Label`, `Button`, `Select`, `Separator`, `Skeleton`) in `components/ui/*` themed with the Velzon CRM palette (`#405189` navy sidebar, `#0ab39c` accents), Remix Icons (`remixicon`), Sonner Toasts, Recharts
- **ORM & Database**: Prisma `7.10.0` (`prisma-client` generator to `./generated/prisma` + `@prisma/adapter-mariadb`) backed by **MySQL / MariaDB (`df_crm`)** with all **94 CRM tables**
- **Authentication & RBAC**: NextAuth v5 (`next-auth@5.0.0-beta.32` Credentials provider + `bcryptjs`) replacing Cartalyst Sentinel (`users`, `roles`, `role_users`, `registers`, `user_activity_logs`)

## Completed Modules (Phase 1 Core CRM + Phase 2 Full Parity)
- **Velzon Admin Shell & Multi-Tenancy**: Collapsible `#405189` sidebar (full brand in expanded mode, centered `DF` monogram + right-side `DropdownMenu` submenu flyouts in collapsed mode), Organization Switcher (`sadmin`/`root`), Institute Switcher, Availability Toggle, Notifications Bell, Fullscreen, Light/Dark theme, and Root Cron Triggers.
- **Dashboard (`/dashboard`)**: KPI summary cards, Leads Funnel, Source Breakdown, Counsellor Allocation, and Activity Feed.
- **Leads Manager (`/leads`, `/leads/create`, `/leads/[id]`, `/leads/upload`, `/leads/upload/logs`)**: Multi-criteria filter drawer, Saved Filters, Column Visibility Settings, P/S/T Duplicate Badges, Bulk Assign/Status/Delete/Export CSV, and 10-tab 360° Lead Detail workspace (Timeline, Notes, Follow-up Events, WhatsApp/SMS/Email/Call Logs, Documents, Applications, Coupons, Student Queries/Tickets).
- **UAC & Academic Hierarchy (`/user`, `/role`, `/teams`, `/designations`, `/organizations`, `/institute-manager`, `/products`)**: Role permissions, Team trees, 3-level Institute → Program → Course manager.
- **Master Data & Distribution (`/pipelines`, `/sources`, `/types`, `/attributes`, `/campaigns`, `/marketing-events`, `/webhooks`, `/lead-distribution`, `/lead-settings/*`)**: Multi-stage Pipeline Builder, Round-Robin Lead Distribution Engine + Live Simulator, and Role × Field Privacy/Export Matrix (`lead_settings`).
- **FormDesk & Student Portals (`/webforms`, `/landing-pages`, `/landing-pages/[id]/sections`, `/lp/[slug]`, `/webform/[form_id]`, `/application_forms`, `/application_form_submissions/[id]`, `/application_form_show/[code]/[lead_id]`)**:
  - **WebForms**: Conversion metrics (`Views` / `Submissions` / `Conversion %`), Embed Code (`<iframe>`), and Custom Fields Builder (`web_form_attributes`).
  - **Landing Pages**: JSON Section Builder (`hero`, `features`, `faqs`, `cta`) rendered dynamically on `/lp/[slug]`.
  - **Application Forms**: Fee + GST setup, Submissions Viewer, and Public Student Admission Portal with live Coupon Code redemption.
- **Coupons (`/coupons`, `/coupons/create`, `/coupons/[id]/edit`, `/coupons/[id]/usage`)**: Flat & percentage scholarship coupons + Usage Audit Logs (`coupon_usages`).
- **Raw Data & Automation (`/automation/*`, `/settings/automation`)**: CSV upload + sample CSV, Outbound IVR trigger, manual Convert to CRM Lead, and Workflow Automation Rules.
- **Settings, Ad Integrations & Reports (`/general-settings`, `/graphics-settings`, `/email-settings`, `/sms-settings`, `/whatsapp-settings`, `/ivr-settings`, `/facebook`, `/instagram`, `/google`, `/logs`, `/reports/lead-distribution`, `/reports/communications`)**:
  - 2-column Velzon settings forms wired to dedicated Prisma models (`general_settings`, `graphics_settings`, `email_settings` + Test SMTP, `sms_settings` + Send Test SMS, `whatsapp_settings`, `ivr_settings` + Test Connection & API Notes).
  - Meta (Facebook/Instagram) & Google Lead Form integrations with live Webhook receiver (`POST /api/webhook/[provider]`) + Simulate Test Webhook button + pretty-printed JSON Webhook Logs (`/logs`).
  - 2-card Lead Distribution Report (`By Rule Type` & `By User`) and filterable Communication Report with Message Viewer modal.

## Demo Login Credentials (Seeded in `df_crm`)

| Role | Email | Password | Access Scope |
| :--- | :--- | :--- | :--- |
| **Super Admin (`sadmin`)** | `admin@dfcrm.com` | `Admin@123` | Multi-Organization & Multi-Institute full access |
| **Root Admin (`root`)** | `root@dfcrm.com` | `Admin@123` | System-wide Root access + Cron Job Triggers |
| **Org Admin (`admin`)** | `orgadmin@dfcrm.com` | `Admin@123` | Organization-wide full CRM access |
| **Admissions Manager (`manager`)** | `manager@dfcrm.com` | `Manager@123` | Team & Counsellor Leads + Reports |
| **Counsellor (`operater`)** | `priya@dfcrm.com` | `User@123` | Assigned Student Leads & Follow-ups |
| **Counsellor (`operater`)** | `rahul@dfcrm.com` | `User@123` | Assigned Student Leads & Follow-ups |

### Sample Coupons for Lead & Public Application Testing
- `EARLY2026` — Flat ₹500 scholarship waiver
- `MERIT25` — 25% discount (up to ₹750)
- `FREEAPP` — 100% application fee waiver

## Scripts & Migrations
```bash
npm run db:generate                         # Generate Prisma 7 client (./generated/prisma)
npx prisma migrate dev --name init_df_crm   # Create & apply Prisma migration in dev
npx prisma migrate deploy                   # Apply migrations in production
npm run db:seed                             # Seed organizations, roles, users, institutes & leads
npm run dev                                 # Start Next.js 16 dev server
npm run build                               # Build production Next.js 16 bundle
npm run start                               # Start production Next.js 16 server
npm run typecheck                           # Run full TypeScript + Next.js route type check
npm run lint                                # Run ESLint
```
