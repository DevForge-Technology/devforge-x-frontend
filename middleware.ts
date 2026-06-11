import { createServerClient } from "@supabase/ssr";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const publicPaths = ["/auth/login"];

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return req.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            res.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();
  const pathname = req.nextUrl.pathname;

  if (publicPaths.some((p) => pathname.startsWith(p))) {
    return res;
  }

  if (!user) {
    const redirectUrl = req.nextUrl.clone();
    redirectUrl.pathname = "/auth/login";
    return NextResponse.redirect(redirectUrl);
  }

  const role = user.user_metadata?.role as string | undefined;

  const adminOnlyPaths = ["/vendors", "/companies"];
  if (adminOnlyPaths.some((p) => pathname.startsWith(p))) {
    if (role !== "admin") {
      const redirectUrl = req.nextUrl.clone();
      redirectUrl.pathname = "/dashboard";
      return NextResponse.redirect(redirectUrl);
    }
  }

  const mustChangePassword = user.user_metadata?.must_change_password === true;

  if (mustChangePassword && pathname !== "/auth/set-password") {
    const redirectUrl = req.nextUrl.clone();
    redirectUrl.pathname = "/auth/set-password";
    return NextResponse.redirect(redirectUrl);
  }

  // if (!mustChangePassword && pathname === "/auth/set-password") {
  //   const redirectUrl = req.nextUrl.clone();
  //   redirectUrl.pathname = "/dashboard";
  //   return NextResponse.redirect(redirectUrl);
  // }

  // No redirect for vendors without lastUsedCompany, they default to first company gracefully

  return res;
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
