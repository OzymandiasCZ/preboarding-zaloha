import { NextResponse, type NextRequest } from "next/server";
import { supabaseAuth } from "@/lib/auth";

// Cíl magic linku: vymění jednorázový kód za session (PKCE) a pošle uživatele na úvod.
// Redirect je vždy na "/" (žádný parametr `next` → žádný open redirect).
export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");
  const target = request.nextUrl.clone();
  target.search = "";

  if (code) {
    const supabase = await supabaseAuth();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      target.pathname = "/";
      return NextResponse.redirect(target);
    }
    console.error("Přihlášení přes odkaz selhalo:", error.message);
  }
  target.pathname = "/login";
  target.searchParams.set("error", "link");
  return NextResponse.redirect(target);
}
