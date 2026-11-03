import { Suspense } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { revalidatePath } from "next/cache";
import { supabaseAdmin } from "@/lib/supabase";
import { requireUser } from "@/lib/auth";
import { CATEGORIES } from "@/lib/checklist";

async function toggleTask(formData: FormData) {
  "use server";
  await requireUser();
  const id = Number(formData.get("id"));
  const done = formData.get("done") === "true";
  const hireId = Number(formData.get("hire_id"));
  // Server action je veřejný endpoint – ověř vstupy a omez update na úkol daného nováčka.
  if (!Number.isSafeInteger(id) || !Number.isSafeInteger(hireId)) return;
  const { error } = await supabaseAdmin()
    .from("pb_tasks")
    .update({ done: !done })
    .eq("id", id)
    .eq("hire_id", hireId);
  if (error) {
    console.error("Změna úkolu selhala:", error.message);
    throw new Error("Nepodařilo se uložit změnu");
  }
  revalidatePath(`/hire/${hireId}`);
  revalidatePath("/");
}

async function Detail({ params }: { params: Promise<{ id: string }> }) {
  await connection();
  await requireUser();
  const { id } = await params;
  const hireId = Number(id);
  if (!Number.isInteger(hireId)) notFound();

  const db = supabaseAdmin();
  const [{ data: hire }, { data: tasks }] = await Promise.all([
    db.from("pb_hires").select("id, name, position, start_date").eq("id", hireId).maybeSingle(),
    db.from("pb_tasks").select("id, category, title, done, sort").eq("hire_id", hireId).order("sort"),
  ]);
  if (!hire) notFound();

  const all = tasks ?? [];
  const doneCount = all.filter((t) => t.done).length;

  return (
    <>
      <h1 className="text-2xl font-bold">{hire.name}</h1>
      <p className="text-sm text-gray-500">
        {hire.position} · nástup {new Date(hire.start_date).toLocaleDateString("cs-CZ")}
      </p>
      <p className="mb-6 mt-1 text-sm">
        Hotovo {doneCount} z {all.length}
      </p>

      {CATEGORIES.map((c) => {
        const items = all.filter((t) => t.category === c.key);
        const d = items.filter((t) => t.done).length;
        return (
          <section key={c.key} className="mb-6">
            <h2 className="mb-2 font-semibold">
              {c.label} <span className="text-sm font-normal text-gray-500">({d}/{items.length})</span>
            </h2>
            <ul className="space-y-1">
              {items.map((t) => (
                <li key={t.id}>
                  <form action={toggleTask}>
                    <input type="hidden" name="id" value={t.id} />
                    <input type="hidden" name="done" value={String(t.done)} />
                    <input type="hidden" name="hire_id" value={hire.id} />
                    <button className="flex w-full items-center gap-3 rounded border px-3 py-2 text-left hover:bg-gray-50 dark:hover:bg-gray-900">
                      <span className={t.done ? "text-green-600" : "text-gray-400"}>{t.done ? "☑" : "☐"}</span>
                      <span className={t.done ? "text-gray-400 line-through" : ""}>{t.title}</span>
                    </button>
                  </form>
                </li>
              ))}
            </ul>
          </section>
        );
      })}
    </>
  );
}

export default function HirePage({ params }: { params: Promise<{ id: string }> }) {
  return (
    <main className="mx-auto max-w-2xl p-8">
      <Link href="/" className="mb-4 inline-block text-sm text-gray-500 hover:underline">
        ← Přehled
      </Link>
      <Suspense fallback={<p className="text-gray-400">Načítám…</p>}>
        <Detail params={params} />
      </Suspense>
    </main>
  );
}
