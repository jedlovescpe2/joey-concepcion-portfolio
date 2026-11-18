import base from "@/content/site.json";

export type Content = typeof base;
export type Role = Content["roles"][number];
export const defaultContent: Content = base;

/** Merge saved CMS content over the bundled defaults so a missing key never breaks the page. */
export function mergeContent(saved: unknown): Content {
  if (!saved || typeof saved !== "object") return base;
  const s = saved as Record<string, unknown>;
  const out: Record<string, unknown> = { ...base };
  for (const k of Object.keys(base)) {
    const b = (base as Record<string, unknown>)[k];
    const v = s[k];
    if (v === undefined || v === null) continue;
    if (Array.isArray(b)) out[k] = Array.isArray(v) ? v : b;
    else if (typeof b === "object") out[k] = typeof v === "object" && !Array.isArray(v) ? { ...(b as object), ...(v as object) } : b;
    else out[k] = v;
  }
  return out as Content;
}

export const NAV = [
  { id: "about", label: "About" },
  { id: "work", label: "Career" },
  { id: "approach", label: "Approach" },
  { id: "experience", label: "Experience" },
  { id: "skills", label: "Skills" },
  { id: "certifications", label: "Certs" },
  { id: "education", label: "Education" },
  { id: "know", label: "Know me" },
  { id: "contact", label: "Contact" },
];
