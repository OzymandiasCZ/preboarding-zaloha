"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { isAllowed, supabaseAuth } from "@/lib/auth";

// Pošle magic link. Uživatele nevytváří (shouldCreateUser: false) – musí být pozván v Supabase.
// Odpověď je stejná pro povolené i nepovolené adresy (neprozrazuje, kdo má přístup).
export async function sendMagicLink(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  if (!email || email.length > 320) redirect("/login?error=email");

  if (isAllowed(email)) {
    const siteUrl = process.env.SITE_URL ?? (await headers()).get("origin");
    const supabase = await supabaseAuth();
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { shouldCreateUser: false, emailRedirectTo: `${siteUrl}/auth/callback` },
    });
    // Chybu (např. neexistující uživatel) jen logujeme bez e-mailu, uživateli ji neukazujeme.
    if (error) console.error("signInWithOtp selhalo:", error.message);
  }
  redirect("/login?sent=1");
}

export async function signOut() {
  const supabase = await supabaseAuth();
  await supabase.auth.signOut();
  redirect("/login");
}
