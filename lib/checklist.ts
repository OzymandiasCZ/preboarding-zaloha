export const CATEGORIES = [
  { key: "documents", label: "Dokumenty" },
  { key: "equipment", label: "Vybavení" },
  { key: "access", label: "Přístupy" },
  { key: "first_day", label: "První den" },
] as const;

export type Category = (typeof CATEGORIES)[number]["key"];

// Výchozí checklist, který se vytvoří při zadání nováčka.
export const TEMPLATE: Record<Category, string[]> = {
  documents: [
    "Podepsaná pracovní smlouva",
    "Osobní dotazník",
    "Potvrzení o zaměstnání v předchozím období",
    "Poučení o bezpečnosti práce",
  ],
  equipment: ["Notebook", "Mobilní telefon", "Monitor a periferie", "Přístupová karta do budovy"],
  access: ["Firemní e-mail", "Chat a kalendář", "Přístup do interních systémů", "Přístup k týmovým složkám"],
  first_day: ["Uvítací e-mail s instrukcemi", "Mentor / buddy určen", "Plán prvního týdne", "Úvodní schůzka s týmem"],
};
