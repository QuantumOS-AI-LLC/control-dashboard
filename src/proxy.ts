import { auth } from "@/auth"
import { NextResponse } from "next/server"

export const proxy = auth((req) => {
  const { nextUrl } = req
  const isLoggedIn = !!req.auth
  const role = req.auth?.user?.role

  const isApiAuthRoute = nextUrl.pathname.startsWith("/api/auth")
  const isPublicRoute = nextUrl.pathname === "/" || nextUrl.pathname === "/onboard"
  const isAdminRoute = nextUrl.pathname.startsWith("/admin")
  const isEmployeeRoute = nextUrl.pathname.startsWith("/employee")

  if (isApiAuthRoute) return NextResponse.next()

  if (isPublicRoute) {
    if (isLoggedIn) {
      if (role === "ADMIN" || role === "MANAGER") {
        return NextResponse.redirect(new URL("/admin/dashboard", nextUrl))
      }
      // Everything else (CREW, FOREMAN, legacy EMPLOYEE) goes to employee dashboard
      return NextResponse.redirect(new URL("/employee/dashboard", nextUrl))
    }
    return NextResponse.next()
  }

  if (!isLoggedIn) {
    return NextResponse.redirect(new URL("/", nextUrl))
  }

  // Role Protection
  if (isAdminRoute && role !== "ADMIN" && role !== "MANAGER") {
    return NextResponse.redirect(new URL("/", nextUrl))
  }

  // Allow FOREMAN, CREW and legacy EMPLOYEE in employee routes
  if (isEmployeeRoute && role !== "FOREMAN" && role !== "CREW" && role !== "EMPLOYEE") {
    return NextResponse.redirect(new URL("/", nextUrl))
  }

  return NextResponse.next()
})

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
}
