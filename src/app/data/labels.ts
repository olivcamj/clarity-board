// data/labels.ts — label key → display name + badge tone

import type { LabelDef, LabelKey } from "@/types/task";

export const LABELS: Record<LabelKey, LabelDef> = {
  design:   { name: "Design",   tone: "plum"  },
  frontend: { name: "Frontend", tone: "slate" },
  backend:  { name: "Backend",  tone: "ok"    },
  infra:    { name: "Infra",    tone: "warn"  },
  research: { name: "Research", tone: "info"  },
  bug:      { name: "Bug",      tone: "bad"   },
};

/** Person-id → display name. Replace with your real user lookup. */
export const PEOPLE_BY_ID: Record<string, string> = {
  u1: "Mira Cho",
  u2: "Alex Reyes",
  u3: "Jules Park",
  u4: "Noor Patel",
  u5: "Sam Ito",
  u6: "Devon Lee",
};

export const personName = (id: string): string => PEOPLE_BY_ID[id] ?? id;
