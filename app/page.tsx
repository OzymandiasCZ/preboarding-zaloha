import { Suspense } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { CATEGORIES, TEMPLATE } from "@/lib/checklist";

async function createHire(formData: FormData) {
  "use server";
  const name = String(formData.get("name") ?? "").trim();
  const position = String(formData.get("position") ?? "").trim();
  const startDate = String(formData.get("start_date") ?? "");
  if (!name || !position || !startDate) return;
  // Server action je veřejný endpoint – validace nesmí spoléhat na atributy formuláře.
  if (name.length > 200 || position.length > 200) return;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(startDate) || Number.isNaN(Date.parse(startDate))) return;

  const db = supabaseAdmin();
  const { data: hire, error } = await db
    .from("pb_hires")
    .insert({ name, position, start_date: startDate })
    .select("id")
    .single();
  if (error || !hire) {
    console.error("Uložení nováčka selhalo:", error?.message);
    throw new Error("Nepodařilo se uložit nováčka");
  }

  const tasks = CATEGORIES.flatMap((c) =>
    TEMPLATE[c.key].map((title, i) => ({ hire_id: hire.id, category: c.key, title, sort: i })),
  );
  const { error: tasksError } = await db.from("pb_tasks").insert(tasks);
  if (tasksError) {
    console.error("Vytvoření checklistu selhalo:", tasksError.message);
    throw new Error("Nepodařilo se vytvořit checklist");
  }

  redirect(`/hire/${hire.id}`);
}

async function Overview() {
  await connection();
  const db = supabaseAdmin();
  const [{ data: hires, error }, { data: tasks }] = await Promise.all([
    db.from("pb_hires").select("id, name, position, start_date").order("start_date", { ascending: true }),
    db.from("pb_tasks").select("hire_id, done"),
  ]);
  if (error) {
    console.error("Načtení přehledu selhalo:", error.message);
    return <p className="text-red-600">Nepodařilo se načíst přehled.</p>;
  }
  if (!hires?.length) return <p className="text-gray-500">Zatím tu nikdo není. Zadej prvního nováčka.</p>;

  const total = new Map<number, number>();
  const done = new Map<number, number>();
  for (const t of tasks ?? []) {
    total.set(t.hire_id, (total.get(t.hire_id) ?? 0) + 1);
    if (t.done) done.set(t.hire_id, (done.get(t.hire_id) ?? 0) + 1);
  }

  return (
    <ul className="space-y-3">
      {hires.map((h) => {
        const t = total.get(h.id) ?? 0;
        const d = done.get(h.id) ?? 0;
        const pct = t ? Math.round((d / t) * 100) : 0;
        return (
          <li key={h.id}>
            <Link href={`/hire/${h.id}`} className="block rounded border p-4 hover:bg-gray-50 dark:hover:bg-gray-900">
              <div className="flex items-baseline justify-between">
                <span className="font-semibold">{h.name}</span>
                <span className="text-sm text-gray-500">
                  nástup {new Date(h.start_date).toLocaleDateString("cs-CZ")}
                </span>
              </div>
              <div className="text-sm text-gray-500">{h.position}</div>
              <div className="mt-3 h-2 rounded bg-gray-200 dark:bg-gray-800">
                <div className="h-2 rounded bg-green-600" style={{ width: `${pct}%` }} />
              </div>
              <div className="mt-1 text-xs text-gray-500">
                {d} z {t} hotovo ({pct} %)
              </div>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

export default function Home() {
  return (
    <main className="mx-auto max-w-2xl p-8">
      <h1 className="text-2xl font-bold">Preboarding</h1>
      <p className="mb-1 text-sm text-gray-500">Přehled nováčků a stavu jejich příprav na nástup.</p>
      <p className="mb-6 text-xs text-amber-600">Demo: zadávej jen smyšlená data, žádné osobní údaje.</p>

      <form action={createHire} className="mb-8 grid gap-2 rounded border p-4 sm:grid-cols-4">
        <input name="name" required placeholder="Jméno nováčka" className="rounded border px-3 py-2 sm:col-span-2" />
        <input name="position" required placeholder="Pozice" className="rounded border px-3 py-2" />
        <input name="start_date" type="date" required className="rounded border px-3 py-2" />
        <button className="rounded bg-black px-4 py-2 text-white sm:col-span-4 dark:bg-white dark:text-black">
          Zadat nováčka a vytvořit checklist
        </button>
      </form>

      <Suspense fallback={<p className="text-gray-400">Načítám…</p>}>
        <Overview />
      </Suspense>
    </main>
  );
}
