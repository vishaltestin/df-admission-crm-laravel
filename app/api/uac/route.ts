import { NextRequest, NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import { prisma } from "@/lib/prisma"
import { getOptionalSessionContext } from "@/lib/session"
import { serializeData } from "@/lib/serialize"

export async function GET(req: NextRequest) {
  const ctx = await getOptionalSessionContext()
  if (!ctx) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const entity =
    req.nextUrl.searchParams.get("entity") ||
    req.nextUrl.searchParams.get("type") ||
    req.nextUrl.searchParams.get("resource") ||
    "users"

  if (entity === "users") {
    const [users, registers, roleUsers, roles, orgs, desigs, institutes] =
      await Promise.all([
        prisma.users.findMany({ orderBy: { id: "desc" } }),
        prisma.registers.findMany(),
        prisma.role_users.findMany(),
        prisma.roles.findMany(),
        prisma.organizations.findMany({ orderBy: { id: "asc" } }),
        prisma.designation.findMany({ orderBy: { id: "asc" } }),
        prisma.institutes.findMany({
          where: { organization_id: BigInt(ctx.orgId) },
        }),
      ])

    const regMap = new Map(registers.map((r) => [r.user_id, r]))
    const ruMap = new Map(roleUsers.map((ru) => [ru.user_id, ru.role_id]))
    const roleMap = new Map(roles.map((r) => [r.id, r]))
    const orgMap = new Map(orgs.map((o) => [String(o.id), o.name || ""]))
    const desigMap = new Map(desigs.map((d) => [String(d.id), d.name || ""]))

    const items = users.map((u) => {
      const reg = regMap.get(u.id)
      const roleId = ruMap.get(u.id)
      const role = roleId ? roleMap.get(roleId) : undefined
      return {
        id: u.id,
        email: u.email,
        first_name: u.first_name || reg?.first_name || "",
        last_name: u.last_name || reg?.last_name || "",
        mobile: reg?.mobile || "-",
        location: u.location || reg?.address || "-",
        status: u.status ?? 1,
        last_login: u.last_login,
        created_at: u.created_at,
        permissions: u.permissions || "{}",
        organization_id: reg?.organization
          ? Number(reg.organization)
          : ctx.orgId,
        organization_name: reg?.organization
          ? orgMap.get(reg.organization) || "-"
          : "-",
        designation_id: reg?.designation ? Number(reg.designation) : null,
        designation_name: reg?.designation
          ? desigMap.get(reg.designation) || "Staff"
          : "Staff",
        role_id: role?.id || null,
        role_name: role?.name || "Counsellor",
        role_slug: role?.slug || "operater",
        is_available_for_leads: reg?.is_available_for_leads ?? 1,
      }
    })

    return NextResponse.json(
      serializeData({
        items,
        roles,
        organizations: orgs,
        designations: desigs,
        institutes,
      })
    )
  }

  if (entity === "roles") {
    const roles = await prisma.roles.findMany({ orderBy: { id: "asc" } })
    return NextResponse.json(serializeData({ items: roles }))
  }

  if (entity === "teams") {
    const isGlobal = ctx.roleSlug === "root" || ctx.roleSlug === "sadmin"
    const [teams, users, registers, organizations] = await Promise.all([
      prisma.teams.findMany({
        where: isGlobal ? undefined : { organization_id: ctx.orgId },
        orderBy: { id: "desc" },
      }),
      prisma.users.findMany({
        select: { id: true, first_name: true, last_name: true, email: true },
        orderBy: { id: "asc" },
      }),
      prisma.registers.findMany({
        select: { user_id: true, avatar: true, first_name: true, last_name: true },
      }),
      prisma.organizations.findMany({ orderBy: { id: "asc" } }),
    ])
    const regMap = new Map(registers.map((r) => [r.user_id, r]))
    const orgMap = new Map(organizations.map((o) => [o.id, o.name || "-"]))
    const enrichedUsers = users.map((u) => {
      const reg = regMap.get(u.id)
      const first = u.first_name || reg?.first_name || ""
      const last = u.last_name || reg?.last_name || ""
      return {
        ...u,
        first_name: first,
        last_name: last,
        name: `${first} ${last}`.trim() || u.email,
        avatar: reg?.avatar || null,
      }
    })
    const enrichedTeams = teams.map((t) => ({
      ...t,
      team_name: t.name || "",
      organization_name: orgMap.get(t.organization_id) || `Org #${t.organization_id}`,
    }))
    return NextResponse.json(
      serializeData({
        items: enrichedTeams,
        teams: enrichedTeams,
        users: enrichedUsers,
        organizations,
      })
    )
  }

  if (entity === "designations") {
    const isGlobal = ctx.roleSlug === "root" || ctx.roleSlug === "sadmin"
    const [items, organizations] = await Promise.all([
      prisma.designation.findMany({
        where: isGlobal ? undefined : { organization_id: ctx.orgId },
        orderBy: { id: "desc" },
      }),
      prisma.organizations.findMany({ orderBy: { id: "asc" } }),
    ])
    const orgMap = new Map(organizations.map((o) => [o.id, o.name || "-"]))
    const mapped = items.map((d) => ({
      ...d,
      organization_name:
        orgMap.get(d.organization_id) || `Org #${d.organization_id}`,
    }))
    return NextResponse.json(
      serializeData({
        items: mapped,
        designations: mapped,
        organizations,
      })
    )
  }

  if (entity === "organizations") {
    const [items, countries] = await Promise.all([
      prisma.organizations.findMany({ orderBy: { id: "desc" } }),
      prisma.countries.findMany({ orderBy: { name: "asc" } }),
    ])
    return NextResponse.json(
      serializeData({ items, organizations: items, countries })
    )
  }

  if (entity === "organization_detail") {
    const id = Number(req.nextUrl.searchParams.get("id") || 0)
    const organization = id
      ? await prisma.organizations.findUnique({ where: { id } })
      : null
    if (!organization) {
      return NextResponse.json({ organization: null }, { status: 404 })
    }
    const [leadsCount, institutes, regs, users] = await Promise.all([
      prisma.leads.count({ where: { organization_id: BigInt(id) } }),
      prisma.institutes.findMany({
        where: { organization_id: BigInt(id) },
        orderBy: { name: "asc" },
      }),
      prisma.registers.findMany({ where: { organization: String(id) } }),
      prisma.users.findMany({
        select: { id: true, first_name: true, last_name: true, email: true },
      }),
    ])
    const userMap = new Map(users.map((u) => [u.id, u]))
    const staff = regs.map((r) => {
      const u = userMap.get(r.user_id)
      return {
        id: r.user_id,
        first_name: u?.first_name || r.first_name || "",
        last_name: u?.last_name || r.last_name || "",
        email: u?.email || r.email || "-",
        mobile: r.mobile || "-",
      }
    })
    return NextResponse.json(
      serializeData({ organization, leadsCount, institutes, staff })
    )
  }

  if (entity === "role_permissions") {
    const id = Number(req.nextUrl.searchParams.get("id") || 0)
    const role = id ? await prisma.roles.findUnique({ where: { id } }) : null
    return NextResponse.json(serializeData({ role }))
  }

  if (entity === "user_permissions") {
    const id = Number(req.nextUrl.searchParams.get("id") || 0)
    const user = id ? await prisma.users.findUnique({ where: { id } }) : null
    return NextResponse.json(serializeData({ user }))
  }

  return NextResponse.json({ error: "Unknown entity" }, { status: 400 })
}

export async function POST(req: NextRequest) {
  const ctx = await getOptionalSessionContext()
  if (!ctx) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
  const body = await req.json()
  const entity = String(body.entity || body.type || body.resource || "users")
  const action = String(body.action || "create")
  const now = new Date()

  // ---------------- USERS ----------------
  if (entity === "users") {
    if (action === "create") {
      const email = String(body.email || "").trim().toLowerCase()
      const existing = await prisma.users.findUnique({ where: { email } })
      if (existing) {
        return NextResponse.json(
          { error: "Email already exists" },
          { status: 400 }
        )
      }

      const passwordHash = await bcrypt.hash(
        String(body.password || "User@123"),
        10
      )
      const user = await prisma.users.create({
        data: {
          email,
          password: passwordHash,
          first_name: String(body.first_name || ""),
          last_name: String(body.last_name || ""),
          location: body.location ? String(body.location) : null,
          status: 1,
          created_at: now,
          updated_at: now,
        },
      })

      const roleId = Number(body.role_id || 5)
      const role = await prisma.roles.findUnique({ where: { id: roleId } })
      await prisma.role_users.create({
        data: {
          user_id: user.id,
          role_id: roleId,
          created_at: now,
          updated_at: now,
        },
      })

      await prisma.activations.create({
        data: {
          user_id: user.id,
          code: `ACT_${user.id}_${Date.now()}`,
          completed: true,
          completed_at: now,
          created_at: now,
          updated_at: now,
        },
      })

      await prisma.registers.create({
        data: {
          user_id: user.id,
          user_type: role?.slug || "operater",
          first_name: user.first_name,
          last_name: user.last_name,
          email: user.email,
          mobile: body.mobile ? String(body.mobile).slice(0, 12) : null,
          user_name: email.split("@")[0],
          address: body.location ? String(body.location) : null,
          organization: String(body.organization_id || ctx.orgId),
          designation: body.designation_id ? String(body.designation_id) : null,
          status: 1,
          is_available_for_leads: body.is_available_for_leads === false ? 0 : 1,
          role: String(roleId),
          created_at: now,
          updated_at: now,
        },
      })

      return NextResponse.json(serializeData({ ok: true, user }))
    }

    if (action === "update" && body.id) {
      const userId = Number(body.id)
      const updateUser: Record<string, unknown> = {
        first_name: String(body.first_name || ""),
        last_name: String(body.last_name || ""),
        location: body.location ? String(body.location) : null,
        updated_at: now,
      }
      if (body.email) updateUser.email = String(body.email).trim().toLowerCase()
      if (body.password && String(body.password).trim().length >= 6) {
        updateUser.password = await bcrypt.hash(String(body.password), 10)
      }

      await prisma.users.update({
        where: { id: userId },
        data: updateUser,
      })

      if (body.role_id) {
        await prisma.role_users.deleteMany({ where: { user_id: userId } })
        await prisma.role_users.create({
          data: {
            user_id: userId,
            role_id: Number(body.role_id),
            created_at: now,
            updated_at: now,
          },
        })
      }

      const reg = await prisma.registers.findFirst({
        where: { user_id: userId },
      })
      if (reg) {
        await prisma.registers.update({
          where: { id: reg.id },
          data: {
            first_name: String(body.first_name || ""),
            last_name: String(body.last_name || ""),
            mobile: body.mobile ? String(body.mobile).slice(0, 12) : reg.mobile,
            organization: body.organization_id
              ? String(body.organization_id)
              : reg.organization,
            designation: body.designation_id
              ? String(body.designation_id)
              : reg.designation,
            is_available_for_leads:
              body.is_available_for_leads !== undefined
                ? Number(body.is_available_for_leads)
                : reg.is_available_for_leads,
            updated_at: now,
          },
        })
      }

      return NextResponse.json({ ok: true })
    }

    if (action === "toggle_status" && body.id) {
      const userId = Number(body.id)
      const u = await prisma.users.findUnique({ where: { id: userId } })
      const nextStatus = u?.status === 1 ? 0 : 1
      await prisma.users.update({
        where: { id: userId },
        data: { status: nextStatus, updated_at: now },
      })
      return NextResponse.json({ ok: true, status: nextStatus })
    }

    if (action === "save_permissions" && body.id) {
      await prisma.users.update({
        where: { id: Number(body.id) },
        data: {
          permissions: JSON.stringify(body.permissions || {}),
          updated_at: now,
        },
      })
      return NextResponse.json({ ok: true })
    }

    if (action === "delete" && body.id) {
      const userId = Number(body.id)
      await prisma.role_users.deleteMany({ where: { user_id: userId } })
      await prisma.registers.deleteMany({ where: { user_id: userId } })
      await prisma.users.delete({ where: { id: userId } })
      return NextResponse.json({ ok: true })
    }
  }

  // ---------------- ROLES ----------------
  if (entity === "roles") {
    if (action === "create") {
      const name = String(body.name || "").trim()
      const slug =
        String(body.slug || "")
          .trim()
          .toLowerCase() || name.toLowerCase().replace(/[^a-z0-9]+/g, "_")
      const role = await prisma.roles.create({
        data: {
          name,
          slug,
          permissions: JSON.stringify(body.permissions || {}),
          created_at: now,
          updated_at: now,
        },
      })
      return NextResponse.json(serializeData({ ok: true, role }))
    }

    if (action === "update" && body.id) {
      await prisma.roles.update({
        where: { id: Number(body.id) },
        data: {
          name: body.name ? String(body.name) : undefined,
          slug: body.slug ? String(body.slug) : undefined,
          permissions:
            body.permissions !== undefined
              ? JSON.stringify(body.permissions)
              : undefined,
          updated_at: now,
        },
      })
      return NextResponse.json({ ok: true })
    }

    if (action === "delete" && body.id) {
      await prisma.roles.delete({ where: { id: Number(body.id) } })
      return NextResponse.json({ ok: true })
    }
  }

  // ---------------- TEAMS ----------------
  if (entity === "teams") {
    const rawMembers = body.team_member ?? body.team_members ?? ""
    const members = Array.isArray(rawMembers)
      ? rawMembers.join(",")
      : String(rawMembers || "")
    const teamName = String(body.name || body.team_name || "").trim()
    const targetOrgId = body.organization_id
      ? Number(body.organization_id)
      : ctx.orgId

    if (action === "create") {
      const t = await prisma.teams.create({
        data: {
          name: teamName,
          organization_id: targetOrgId,
          status: Number(body.status ?? 1),
          created_by: ctx.userId,
          head: Number(body.head || ctx.userId),
          team_member: members,
          created_at: now,
          updated_at: now,
        },
      })
      return NextResponse.json(serializeData({ ok: true, team: t }))
    }
    if (action === "update" && body.id) {
      await prisma.teams.update({
        where: { id: Number(body.id) },
        data: {
          name: teamName,
          organization_id: targetOrgId,
          head: Number(body.head || ctx.userId),
          team_member: members,
          status: Number(body.status ?? 1),
          updated_at: now,
        },
      })
      return NextResponse.json({ ok: true })
    }
    if (action === "delete" && body.id) {
      await prisma.teams.delete({ where: { id: Number(body.id) } })
      return NextResponse.json({ ok: true })
    }
    if (action === "bulk_delete" && Array.isArray(body.ids)) {
      await prisma.teams.deleteMany({
        where: { id: { in: body.ids.map(Number) } },
      })
      return NextResponse.json({ ok: true })
    }
  }

  // ---------------- DESIGNATIONS ----------------
  if (entity === "designations") {
    const targetOrgId = body.organization_id
      ? Number(body.organization_id)
      : ctx.orgId
    if (action === "create") {
      const d = await prisma.designation.create({
        data: {
          name: String(body.name || "").trim(),
          status: Number(body.status ?? 1),
          organization_id: targetOrgId,
          created_by: ctx.userId,
          created_at: now,
        },
      })
      return NextResponse.json(serializeData({ ok: true, designation: d }))
    }
    if (action === "update" && body.id) {
      await prisma.designation.update({
        where: { id: Number(body.id) },
        data: {
          name: String(body.name || "").trim(),
          organization_id: targetOrgId,
          status: Number(body.status ?? 1),
        },
      })
      return NextResponse.json({ ok: true })
    }
    if (action === "delete" && body.id) {
      await prisma.designation.delete({ where: { id: Number(body.id) } })
      return NextResponse.json({ ok: true })
    }
    if (action === "bulk_delete" && Array.isArray(body.ids)) {
      await prisma.designation.deleteMany({
        where: { id: { in: body.ids.map(Number) } },
      })
      return NextResponse.json({ ok: true })
    }
  }

  // ---------------- ORGANIZATIONS ----------------
  if (entity === "organizations") {
    if (action === "create") {
      const o = await prisma.organizations.create({
        data: {
          name: String(body.name || "").trim(),
          email: body.email ? String(body.email) : null,
          mobile: body.mobile ? String(body.mobile) : null,
          address: body.address ? String(body.address) : null,
          city: body.city ? String(body.city) : null,
          state: body.state ? String(body.state) : null,
          zipcode: body.zipcode ? String(body.zipcode) : null,
          country: body.country ? String(body.country) : "India",
          logo: body.logo ? String(body.logo) : null,
          gst: body.gst ? String(body.gst) : null,
          status: Number(body.status ?? 1),
          created_by: ctx.userId,
          created_at: now,
        },
      })
      return NextResponse.json(serializeData({ ok: true, organization: o }))
    }
    if (action === "update" && body.id) {
      await prisma.organizations.update({
        where: { id: Number(body.id) },
        data: {
          name: String(body.name || "").trim(),
          email: body.email ? String(body.email) : undefined,
          mobile: body.mobile ? String(body.mobile) : null,
          address: body.address ? String(body.address) : null,
          city: body.city ? String(body.city) : null,
          state: body.state ? String(body.state) : null,
          zipcode: body.zipcode ? String(body.zipcode) : null,
          country: body.country ? String(body.country) : "India",
          logo: body.logo !== undefined ? (body.logo ? String(body.logo) : null) : undefined,
          gst: body.gst ? String(body.gst) : null,
          status: Number(body.status ?? 1),
        },
      })
      return NextResponse.json({ ok: true })
    }
    if (action === "delete" && body.id) {
      await prisma.organizations.delete({ where: { id: Number(body.id) } })
      return NextResponse.json({ ok: true })
    }
    if (action === "bulk_delete" && Array.isArray(body.ids)) {
      await prisma.organizations.deleteMany({
        where: { id: { in: body.ids.map(Number) } },
      })
      return NextResponse.json({ ok: true })
    }
  }

  if (entity === "role_permissions" && body.id) {
    await prisma.roles.update({
      where: { id: Number(body.id) },
      data: {
        permissions:
          typeof body.permissions === "string"
            ? body.permissions
            : JSON.stringify(body.permissions || {}),
        updated_at: now,
      },
    })
    return NextResponse.json({ ok: true })
  }

  if (entity === "user_permissions" && body.id) {
    await prisma.users.update({
      where: { id: Number(body.id) },
      data: {
        permissions:
          typeof body.permissions === "string"
            ? body.permissions
            : JSON.stringify(body.permissions || {}),
        updated_at: now,
      },
    })
    return NextResponse.json({ ok: true })
  }

  return NextResponse.json({ error: "Invalid request" }, { status: 400 })
  } catch (err) {
    const message = err instanceof Error ? err.message : "Operation failed"
    return NextResponse.json({ error: message }, { status: 400 })
  }
}
