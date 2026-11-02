import NextAuth from "next-auth"
import Credentials from "next-auth/providers/credentials"
import bcrypt from "bcryptjs"
import { prisma } from "@/lib/prisma"

export const { handlers, auth, signIn, signOut } = NextAuth((req) => {
  const isHttps =
    req?.headers?.get("x-forwarded-proto") === "https" ||
    req?.nextUrl?.protocol === "https:"

  return {
    trustHost: true,
    secret:
      process.env.AUTH_SECRET ||
      "df-crm-nextauth-super-secret-key-2026-hms-stack",
    session: {
      strategy: "jwt",
      maxAge: 30 * 24 * 60 * 60,
    },
    pages: {
      signIn: "/login",
    },
    cookies: isHttps
      ? {
          sessionToken: {
            name: "df_crm.session-token",
            options: {
              httpOnly: true,
              sameSite: "none",
              path: "/",
              secure: true,
            },
          },
          callbackUrl: {
            name: "df_crm.callback-url",
            options: {
              sameSite: "none",
              path: "/",
              secure: true,
            },
          },
          csrfToken: {
            name: "df_crm.csrf-token",
            options: {
              httpOnly: true,
              sameSite: "none",
              path: "/",
              secure: true,
            },
          },
        }
      : undefined,
    providers: [
      Credentials({
        name: "Credentials",
        credentials: {
          email: { label: "Email", type: "email" },
          password: { label: "Password", type: "password" },
        },
        async authorize(credentials) {
          const email = String(credentials?.email || "")
            .trim()
            .toLowerCase()
          const password = String(credentials?.password || "")

          if (!email || !password) return null

          const user = await prisma.users.findUnique({
            where: { email },
          })

          if (!user || user.status === 0) {
            return null
          }

          const normalizedHash = user.password.replace(/^\$2y\$/, "$2a$")
          const valid = await bcrypt.compare(password, normalizedHash)
          if (!valid) {
            return null
          }

          const roleUser = await prisma.role_users.findFirst({
            where: { user_id: user.id },
          })
          const role = roleUser
            ? await prisma.roles.findUnique({ where: { id: roleUser.role_id } })
            : null

          const reg = await prisma.registers.findFirst({
            where: { user_id: user.id },
          })

          const orgId = reg?.organization ? Number(reg.organization) : 1

          await prisma.users.update({
            where: { id: user.id },
            data: { last_login: new Date() },
          })

          try {
            await prisma.user_activity_logs.create({
              data: {
                organization_id: BigInt(orgId),
                user_id: BigInt(user.id),
                entity_type: "auth",
                entity_id: BigInt(user.id),
                action: "login_success",
                description: `${user.first_name || ""} ${user.last_name || ""} logged in`,
                created_at: new Date(),
              },
            })
          } catch {
            // Non-blocking activity log
          }

          return {
            id: String(user.id),
            email: user.email,
            name: `${user.first_name || ""} ${user.last_name || ""}`.trim() || user.email,
            firstName: user.first_name || "",
            lastName: user.last_name || "",
            roleSlug: role?.slug || "operater",
            roleName: role?.name || "Counsellor",
            organizationId: orgId,
            otherOrgs: reg?.other_org || "",
            avatar: reg?.avatar || "",
            memberSince: user.created_at
              ? user.created_at.toISOString()
              : new Date().toISOString(),
          }
        },
      }),
    ],
    callbacks: {
      async jwt({ token, user }) {
        if (user) {
          const u = user as unknown as Record<string, unknown>
          token.uid = u.id
          token.firstName = u.firstName
          token.lastName = u.lastName
          token.roleSlug = u.roleSlug
          token.roleName = u.roleName
          token.organizationId = u.organizationId
          token.otherOrgs = u.otherOrgs
          token.avatar = u.avatar
          token.memberSince = u.memberSince
        }
        return token
      },
      async session({ session, token }) {
        if (session.user) {
          const su = session.user as unknown as Record<string, unknown>
          su.id = String(token.uid || token.sub || "1")
          su.firstName = String(token.firstName || "")
          su.lastName = String(token.lastName || "")
          su.roleSlug = String(token.roleSlug || "operater")
          su.roleName = String(token.roleName || "Counsellor")
          su.organizationId = Number(token.organizationId || 1)
          su.otherOrgs = String(token.otherOrgs || "")
          su.avatar = String(token.avatar || "")
          su.memberSince = String(token.memberSince || "")
        }
        return session
      },
    },
  }
})
