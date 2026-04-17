import NextAuth, { type DefaultSession } from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import { PrismaAdapter } from "@auth/prisma-adapter"
import { prisma } from "@/lib/prisma"

import { Role } from "@prisma/client"

declare module "next-auth" {
  interface Session {
    user: {
      id: string
      role: Role
    } & DefaultSession["user"]
  }
  interface User {
    role: Role
  }
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma) as any,
  session: { strategy: "jwt" },
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null

        const user = await prisma.user.findUnique({
          where: { email: credentials.email as string }
        })

        // For simplicity, we are statically verifying password here. Replace with bcrypt compare in prod.
        if (user && user.password === credentials.password) {
          // Only allow login if employee is ACTIVE
          if (user.employeeStatus !== "ACTIVE") {
            return null;
          }

          return {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role as "ADMIN" | "MANAGER" | "FOREMAN" | "CREW" | "EMPLOYEE"
          }
        }
        return null
      }
    })
  ],
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.role = user.role
        token.id = user.id
      }
      return token
    },
    session({ session, token }) {
      if (token.role && session.user) {
        session.user.role = token.role as "ADMIN" | "MANAGER" | "FOREMAN" | "CREW" | "EMPLOYEE"
        session.user.id = token.id as string
      }
      return session
    }
  },
  pages: {
    signIn: '/login',
  }
})
