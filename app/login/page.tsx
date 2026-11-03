import { Suspense } from "react";
import { sendMagicLink, signOut } from "@/app/auth/actions";

const MESSAGES: Record<string, { text: string; tone: string }> = {
  sent: { text: "Pokud má tato adresa přístup, poslali jsme na ni přihlašovací odkaz.", tone: "text-green-700" },
  forbidden: { text: "Tento účet nemá do aplikace přístup.", tone: "text-red-600" },
  link: { text: "Odkaz je neplatný nebo vypršel (otevři ho ve stejném prohlížeči). Zkus to znovu.", tone: "text-red-600" },
  email: { text: "Zadej platný e-mail.", tone: "text-red-600" },
};

async function Status({ searchParams }: { searchParams: Promise<{ sent?: string; error?: string }> }) {
  const sp = await searchParams;
  const key = sp.sent ? "sent" : sp.error && sp.error in MESSAGES ? sp.error : null;
  if (!key) return null;
  const m = MESSAGES[key];
  return (
    <div className="mb-4">
      <p className={`text-sm ${m.tone}`}>{m.text}</p>
      {key === "forbidden" && (
        <form action={signOut} className="mt-2">
          <button className="text-sm underline">Odhlásit</button>
        </form>
      )}
    </div>
  );
}

export default function LoginPage({ searchParams }: PageProps<"/login">) {
  return (
    <main className="mx-auto max-w-sm p-8">
      <h1 className="mb-1 text-2xl font-bold">Preboarding</h1>
      <p className="mb-6 text-sm text-gray-500">Přihlášení odkazem do e-mailu.</p>
      <Suspense fallback={null}>
        <Status searchParams={searchParams as Promise<{ sent?: string; error?: string }>} />
      </Suspense>
      <form action={sendMagicLink} className="grid gap-2">
        <input
          name="email"
          type="email"
          required
          maxLength={320}
          autoComplete="email"
          placeholder="tvuj.email@example.com"
          className="rounded border px-3 py-2"
        />
        <button className="rounded bg-black px-4 py-2 text-white dark:bg-white dark:text-black">Poslat odkaz</button>
      </form>
    </main>
  );
}
