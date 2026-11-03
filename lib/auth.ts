import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createServerClient } from "@supabase/ssr";
import type { User } from "@supabase/supabase-js";
import { isEmailAllowed } from "@/lib/allowlist";

// Supabase klient s anon/publishable klíčem a session v cookies – jen pro autentizaci.
export async function supabaseAuth() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) throw new Error("Chybí NEXT_PUBLIC_SUPABASE_URL nebo NEXT_PUBLIC_SUPABASE_ANON_KEY");
  const cookieStore = await cookies();
  return createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
        } catch {
          // Volání ze server komponenty – cookies nelze zapsat; session obnovuje proxy.ts.
        }
      },
    },
  });
}

export function isAllowed(email: string | null | undefined): boolean {
  return isEmailAllowed(email, process.env.ALLOWED_EMAILS, process.env.ALLOWED_EMAIL_DOMAINS);
}

/**
 * Jediná autorizační brána: musí ji zavolat KAŽDÁ stránka s daty nováčků a KAŽDÁ
 * server action PŘED použitím supabaseAdmin() (service_role obchází RLS).
 * Nepřihlášený → /login, přihlášený mimo allowlist → /login?error=forbidden.
 */
export async function requireUser(): Promise<User> {
  const supabase = await supabaseAuth();
  // getUser() ověřuje token proti Supabase Auth (na rozdíl od getSession()).
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  if (!isAllowed(user.email)) redirect("/login?error=forbidden");
  return user;
}
