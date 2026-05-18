import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { publicEnv } from "@/lib/env";

// Page-level gate for the (admin) route group. Unauthenticated visitors
// are sent to /login. This is the page guard only — every admin Server
// Action additionally calls requireAdmin(), since actions are public
// POST endpoints that middleware does not authorise.
const ADMIN_PREFIXES = [
  "/dashboard",
  "/boekingen",
  "/leads",
  "/klanten",
  "/instellingen",
];

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();

  const supabase = createServerClient(
    publicEnv.NEXT_PUBLIC_SUPABASE_URL,
    publicEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return req.cookies.getAll();
        },
        setAll(cookiesToSet) {
          for (const { name, value, options } of cookiesToSet) {
            res.cookies.set(name, value, options);
          }
        },
      },
    },
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const path = req.nextUrl.pathname;
  const isAdmin = ADMIN_PREFIXES.some(
    (p) => path === p || path.startsWith(`${p}/`),
  );

  if (isAdmin && !user) {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    url.search = "";
    return NextResponse.redirect(url);
  }

  return res;
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/boekingen/:path*",
    "/leads/:path*",
    "/klanten/:path*",
    "/instellingen/:path*",
  ],
};
