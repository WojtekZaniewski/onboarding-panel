import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const PROTECTED_PREFIXES = ["/panel", "/admin", "/opiekun"];
const ADMIN_PREFIX = "/admin";
const OPIEKUN_PREFIX = "/opiekun";

function envConfigured() {
  return (
    !!process.env.NEXT_PUBLIC_SUPABASE_URL &&
    !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
}

export async function updateSession(request: NextRequest) {
  // Tryb podglądu — bez Supabase wszystko działa jako gość, brak guardów.
  if (!envConfigured()) {
    return NextResponse.next({ request });
  }

  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const path = request.nextUrl.pathname;
  const isProtected = PROTECTED_PREFIXES.some((p) => path.startsWith(p));

  if (!user && isProtected) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", path);
    return NextResponse.redirect(url);
  }

  if (user && isProtected) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .maybeSingle();
    const role: "admin" | "opiekun" | "klient" =
      (profile?.role as "admin" | "opiekun" | "klient") ?? "klient";

    let denied = false;
    if (path.startsWith(ADMIN_PREFIX) && role !== "admin") denied = true;
    if (
      path.startsWith(OPIEKUN_PREFIX) &&
      role !== "opiekun" &&
      role !== "admin"
    )
      denied = true;

    if (denied) {
      const url = request.nextUrl.clone();
      url.pathname =
        role === "admin" ? "/admin" : role === "opiekun" ? "/opiekun" : "/panel";
      return NextResponse.redirect(url);
    }
  }

  return supabaseResponse;
}
