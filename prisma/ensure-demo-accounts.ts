import "dotenv/config"
import bcrypt from "bcryptjs"
import { prisma } from "../lib/prisma"

async function main() {
  const now = new Date()
  const hashAdmin = await bcrypt.hash("Admin@123", 10)
  const hashManager = await bcrypt.hash("Manager@123", 10)
  const hashUser = await bcrypt.hash("User@123", 10)

  const allPerms = JSON.stringify({
    "dashboard.view": true,
    "leads.view": true,
    "leads.create": true,
    "leads.edit": true,
    "leads.delete": true,
    "leads.bulk": true,
    "leads.export": true,
    "leads.reassign": true,
    "users.manage": true,
    "roles.manage": true,
    "settings.manage": true,
    "reports.view": true,
    "automation.manage": true,
    "templates.manage": true,
    "institutes.manage": true,
    "coupons.manage": true,
  })

  // Ensure roles exist & have clean permissions
  for (const r of [
    { slug: "root", name: "Root Base" },
    { slug: "sadmin", name: "Super Admin" },
    { slug: "admin", name: "Administrator" },
    { slug: "manager", name: "Admissions Manager" },
    { slug: "operater", name: "Counsellor / Operator" },
  ]) {
    const existing = await prisma.roles.findUnique({ where: { slug: r.slug } })
    if (!existing) {
      await prisma.roles.create({
        data: {
          slug: r.slug,
          name: r.name,
          permissions: allPerms,
          created_at: now,
          updated_at: now,
        },
      })
    }
  }

  const roles = await prisma.roles.findMany()
  const roleBySlug = new Map(roles.map((r) => [r.slug, r]))

  // Ensure documented demo accounts exist in Organization 1 (with multi-org access to 1,2)
  const demoUsers = [
    {
      email: "admin@dfcrm.com",
      first_name: "Super",
      last_name: "Admin",
      password: hashAdmin,
      roleSlug: "sadmin",
      mobile: "9810011111",
    },
    {
      email: "root@dfcrm.com",
      first_name: "Root",
      last_name: "Director",
      password: hashAdmin,
      roleSlug: "root",
      mobile: "9810022222",
    },
    {
      email: "orgadmin@dfcrm.com",
      first_name: "Campus",
      last_name: "Admin",
      password: hashAdmin,
      roleSlug: "admin",
      mobile: "9810033333",
    },
    {
      email: "manager@dfcrm.com",
      first_name: "Vikram",
      last_name: "Mehta",
      password: hashManager,
      roleSlug: "manager",
      mobile: "9810044444",
    },
    {
      email: "priya@dfcrm.com",
      first_name: "Priya",
      last_name: "Sharma",
      password: hashUser,
      roleSlug: "operater",
      mobile: "9810055555",
    },
    {
      email: "rahul@dfcrm.com",
      first_name: "Rahul",
      last_name: "Verma",
      password: hashUser,
      roleSlug: "operater",
      mobile: "9810066666",
    },
  ]

  for (const du of demoUsers) {
    let u = await prisma.users.findUnique({ where: { email: du.email } })
    if (!u) {
      u = await prisma.users.create({
        data: {
          email: du.email,
          password: du.password,
          first_name: du.first_name,
          last_name: du.last_name,
          status: 1,
          created_at: now,
          updated_at: now,
        },
      })
    }

    const role = roleBySlug.get(du.roleSlug)
    if (role) {
      const hasRole = await prisma.role_users.findFirst({
        where: { user_id: u.id },
      })
      if (!hasRole) {
        await prisma.role_users.create({
          data: {
            user_id: u.id,
            role_id: role.id,
            created_at: now,
            updated_at: now,
          },
        })
      }
    }

    const hasReg = await prisma.registers.findFirst({
      where: { user_id: u.id },
    })
    if (!hasReg) {
      await prisma.registers.create({
        data: {
          user_id: u.id,
          user_type: du.roleSlug,
          first_name: du.first_name,
          last_name: du.last_name,
          email: du.email,
          mobile: du.mobile,
          user_name: du.email.split("@")[0],
          organization: "1",
          other_org: "1,2",
          designation: "1",
          team: "1",
          status: 1,
          is_available_for_leads: 1,
          role: String(role?.id || 2),
          created_at: now,
          updated_at: now,
        },
      })
    }
  }

  // Seed custom attributes if empty in dem-data.txt
  if ((await prisma.attributes.count()) === 0) {
    await prisma.attributes.createMany({
      data: [
        {
          code: "entrance_exam_score",
          name: "Entrance Exam Score",
          type: "price",
          entity_type: "lead",
          sort_order: 1,
          validation: "numeric|min:0|max:800",
          is_required: false,
          is_unique: false,
          quick_add: true,
          organization_id: 1,
          created_at: now,
          updated_at: now,
        },
        {
          code: "hostel_preference",
          name: "Hostel Accommodation Required",
          type: "boolean",
          entity_type: "lead",
          sort_order: 2,
          validation: "boolean",
          is_required: false,
          is_unique: false,
          quick_add: true,
          organization_id: 1,
          created_at: now,
          updated_at: now,
        },
        {
          code: "guardian_phone",
          name: "Parent / Guardian Phone",
          type: "phone",
          entity_type: "lead",
          sort_order: 3,
          validation: "min:10|max:12",
          is_required: true,
          is_unique: false,
          quick_add: true,
          organization_id: 1,
          created_at: now,
          updated_at: now,
        },
        {
          code: "naac_accreditation_grade",
          name: "NAAC Accreditation Grade",
          type: "text",
          entity_type: "course",
          sort_order: 1,
          validation: "min:1|max:5",
          is_required: false,
          is_unique: false,
          quick_add: false,
          organization_id: 1,
          created_at: now,
          updated_at: now,
        },
      ],
    })
  }

  // Seed outgoing webhooks if empty in dem-data.txt
  if ((await prisma.webhooks.count()) === 0) {
    await prisma.webhooks.createMany({
      data: [
        {
          name: "ADTU ERP Admission Sync",
          entity_type: "leads",
          description: "Pushes verified student leads into University ERP portal",
          method: "post",
          end_point: "https://erp.adtu.in/api/v2/admissions/lead-sync",
          query_params: JSON.stringify([{ key: "source", value: "df_crm" }]),
          headers: JSON.stringify([
            { key: "Content-Type", value: "application/json" },
            { key: "X-API-Key", value: "adtu_live_sync_token" },
          ]),
          payload_type: "raw",
          raw_payload_type: "json",
          payload: JSON.stringify([
            { key: "lead_id", value: "{lead_id}" },
            { key: "student_name", value: "{lead_name}" },
            { key: "mobile", value: "{lead_mobile}" },
          ]),
          organization_id: 1,
          created_at: now,
          updated_at: now,
        },
      ],
    })
  }

  // Seed graphics_settings if empty
  if ((await prisma.graphics_settings.count()) === 0) {
    await prisma.graphics_settings.create({
      data: {
        organization_id: BigInt(1),
        theme_color: "#405189",
        sidebar_color: "#405189",
        navbar_color: "#ffffff",
        login_background: "/images/auth-one-bg.jpg",
        status: 1,
        created_at: now,
        updated_at: now,
      },
    })
  }

  // Ensure org 1 has at least one active lead_distribution_rules entry (dem-data.txt had org 51)
  if (
    (await prisma.lead_distribution_rules.count({
      where: { organization_id: BigInt(1) },
    })) === 0
  ) {
    const r = await prisma.lead_distribution_rules.create({
      data: {
        organization_id: BigInt(1),
        rule_name: "Default Campus Round-Robin Distribution",
        distribution_type: "random",
        is_active: true,
        created_at: now,
        updated_at: now,
      },
    })
    for (const uid of [2, 12, 13, 14]) {
      await prisma.lead_distribution_rule_items.create({
        data: {
          rule_id: r.id,
          assign_type: "user",
          user_id: BigInt(uid),
          percentage: 25,
          created_at: now,
          updated_at: now,
        },
      })
    }
  }

  console.log("Demo data & DF CRM accounts synchronized successfully.")
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
