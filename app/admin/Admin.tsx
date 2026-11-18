"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Content, defaultContent, mergeContent } from "@/lib/content";
import "./admin.css";

type J = string | number | boolean | null | J[] | { [k: string]: J };
type Msg = { id: number; name: string; email: string; topic: string; message: string; read: boolean; created_at: string };

const api = (path: string, init: RequestInit = {}) =>
  fetch(`/api/${path}`, { ...init, credentials: "same-origin", headers: { "content-type": "application/json", "x-cms": "1", ...(init.headers || {}) } });

const SECTIONS: { key: keyof Content; label: string; hint: string }[] = [
  { key: "profile", label: "Profile & contact", hint: "Name, hero text, photo, email, phone and social links." },
  { key: "brands", label: "Logo strip", hint: "Organisations scrolling at the bottom of the hero." },
  { key: "about", label: "About", hint: "Bio paragraphs and talking points." },
  { key: "hats", label: "Many hats", hint: "Accordion cards on the home page. Role must match a role title exactly to open its story; leave it empty to link to Contact." },
  { key: "stats", label: "Numbers", hint: "The four counters in the arch section." },
  { key: "arch", label: "Arch card", hint: "Text inside the shrinking arch." },
  { key: "approach", label: "How I work", hint: "Four zig-zag rows. Visual: uml, code, terminal or chart." },
  { key: "current", label: "Current role", hint: "The teaching card at the top of Experience." },
  { key: "ladder", label: "Boehringer ladder", hint: "Four promotion steps." },
  { key: "roles", label: "Earlier roles", hint: "Timeline entries and ring cards with their bullet points." },
  { key: "industries", label: "Industries", hint: "Chips under the timeline." },
  { key: "skills", label: "Skills", hint: "Skill groups and pills." },
  { key: "certifications", label: "Certifications", hint: "Grouped certificate cards." },
  { key: "education", label: "Education", hint: "Degrees." },
  { key: "interests", label: "Interests", hint: "Icon: spark, pulse or compass." },
  { key: "thenNow", label: "Then → now", hint: "" },
  { key: "faq", label: "Q & A", hint: "" },
  { key: "countries", label: "Countries", hint: "Production-support reach by region." },
  { key: "game", label: "Two truths & a lie", hint: "Mark exactly one statement as the lie." },
  { key: "facts", label: "Fun facts", hint: "" },
  { key: "sheet", label: "Character sheet", hint: "Story page: the model sheet image and its caption." },
  { key: "contact", label: "Contact text", hint: "" },
];

const pretty = (k: string) => k.replace(/([A-Z])/g, " $1").replace(/^./, (c) => c.toUpperCase());
const blank = (v: J): J => (typeof v === "string" ? "" : typeof v === "number" ? 0 : typeof v === "boolean" ? false : Array.isArray(v) ? [] : v && typeof v === "object" ? Object.fromEntries(Object.entries(v).map(([k, x]) => [k, blank(x)])) : null);

async function toDataUrl(file: File, max = 900): Promise<string> {
  const img = await createImageBitmap(file);
  const r = Math.min(1, max / Math.max(img.width, img.height));
  const c = document.createElement("canvas");
  c.width = Math.round(img.width * r);
  c.height = Math.round(img.height * r);
  c.getContext("2d")!.drawImage(img, 0, 0, c.width, c.height);
  return c.toDataURL("image/jpeg", 0.82);
}

function Field({ k, v, set }: { k: string; v: J; set: (v: J) => void }) {
  if (k === "photo" && typeof v === "string") {
    return (
      <label className="f">
        <span>Photo</span>
        <div className="photo">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          {v && <img src={v} alt="" />}
          <div>
            <input type="file" accept="image/*" onChange={async (e) => e.target.files?.[0] && set(await toDataUrl(e.target.files[0]))} />
            <input value={v.startsWith("data:") ? "(uploaded image)" : v} onChange={(e) => set(e.target.value)} placeholder="/img/joey.jpg or https://…" />
          </div>
        </div>
      </label>
    );
  }
  if (typeof v === "boolean")
    return (
      <label className="f chk">
        <input type="checkbox" checked={v} onChange={(e) => set(e.target.checked)} /> <span>{pretty(k)}</span>
      </label>
    );
  if (typeof v === "number")
    return (
      <label className="f">
        <span>{pretty(k)}</span>
        <input type="number" value={v} onChange={(e) => set(Number(e.target.value))} />
      </label>
    );
  if (typeof v === "string" || v === null) {
    const s = v ?? "";
    const long = s.length > 70 || /text|paragraph|intro|a$|message/i.test(k);
    return (
      <label className="f">
        <span>{pretty(k)}</span>
        {long ? <textarea value={s} rows={Math.min(8, Math.max(2, Math.ceil(s.length / 80)))} onChange={(e) => set(e.target.value)} /> : <input value={s} onChange={(e) => set(e.target.value)} />}
      </label>
    );
  }
  if (Array.isArray(v)) return <List k={k} v={v} set={set} />;
  return (
    <fieldset className="obj">
      {k && <legend>{pretty(k)}</legend>}
      {Object.entries(v).map(([kk, vv]) => (
        <Field key={kk} k={kk} v={vv} set={(nv) => set({ ...v, [kk]: nv })} />
      ))}
    </fieldset>
  );
}

function List({ k, v, set }: { k: string; v: J[]; set: (v: J) => void }) {
  const move = (i: number, d: number) => {
    const a = [...v];
    const j = i + d;
    if (j < 0 || j >= a.length) return;
    [a[i], a[j]] = [a[j], a[i]];
    set(a);
  };
  const tmpl: J = v.length ? blank(v[0]) : "";
  const title = (x: J, i: number) => {
    if (x && typeof x === "object" && !Array.isArray(x)) {
      const f = (x.title ?? x.name ?? x.group ?? x.q ?? x.region ?? x.label ?? x.text) as J;
      return typeof f === "string" && f ? f : `Item ${i + 1}`;
    }
    return "";
  };
  const objects = v.some((x) => x && typeof x === "object");
  return (
    <div className="list">
      <div className="list-h">
        <span>{pretty(k)}</span>
        <small>{v.length} items</small>
      </div>
      {v.map((x, i) =>
        objects ? (
          <details className="item" key={i}>
            <summary>
              <b>{title(x, i)}</b>
              <span className="tools" onClick={(e) => e.preventDefault()}>
                <button onClick={() => move(i, -1)} title="Move up">↑</button>
                <button onClick={() => move(i, 1)} title="Move down">↓</button>
                <button className="del" onClick={() => confirm("Remove this item?") && set(v.filter((_, j) => j !== i))} title="Remove">✕</button>
              </span>
            </summary>
            <Field k="" v={x} set={(nv) => set(v.map((y, j) => (j === i ? nv : y)))} />
          </details>
        ) : (
          <div className="row" key={i}>
            <Field k={`${i + 1}`} v={x} set={(nv) => set(v.map((y, j) => (j === i ? nv : y)))} />
            <span className="tools">
              <button onClick={() => move(i, -1)}>↑</button>
              <button onClick={() => move(i, 1)}>↓</button>
              <button className="del" onClick={() => set(v.filter((_, j) => j !== i))}>✕</button>
            </span>
          </div>
        ),
      )}
      <button className="add" onClick={() => set([...v, tmpl])}>
        + Add
      </button>
    </div>
  );
}

export default function Admin() {
  const [authed, setAuthed] = useState<boolean | null>(null);
  const [pw, setPw] = useState("");
  const [err, setErr] = useState("");
  const [data, setData] = useState<Content>(defaultContent);
  const [saved, setSaved] = useState("");
  const [tab, setTab] = useState<string>("profile");
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState("");
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [hist, setHist] = useState<{ id: number; saved_at: string }[]>([]);
  const dirty = useMemo(() => saved !== "" && JSON.stringify(data) !== saved, [data, saved]);

  const load = async () => {
    const r = await api("content");
    const j = await r.json();
    const d = mergeContent(j.data);
    setData(d);
    setSaved(JSON.stringify(d));
  };
  const loadMsgs = async () => {
    const r = await api("messages");
    if (r.ok) setMsgs((await r.json()).items);
  };

  useEffect(() => {
    api("me")
      .then((r) => r.json())
      .then((j) => {
        setAuthed(!!j.authed);
        if (j.authed) {
          load();
          loadMsgs();
        }
      })
      .catch(() => setAuthed(false));
  }, []);

  useEffect(() => {
    const h = (e: BeforeUnloadEvent) => {
      if (dirty) e.preventDefault();
    };
    window.addEventListener("beforeunload", h);
    return () => window.removeEventListener("beforeunload", h);
  }, [dirty]);

  const flash = (m: string) => {
    setNote(m);
    setTimeout(() => setNote(""), 3500);
  };

  async function login(e: React.FormEvent) {
    e.preventDefault();
    setErr("");
    const r = await api("login", { method: "POST", body: JSON.stringify({ password: pw }) });
    const j = await r.json();
    if (!r.ok) return setErr(j.error || "Could not sign in");
    setAuthed(true);
    setPw("");
    load();
    loadMsgs();
  }
  async function save() {
    setBusy(true);
    const r = await api("content", { method: "PUT", body: JSON.stringify({ data }) });
    const j = await r.json().catch(() => ({}));
    setBusy(false);
    if (!r.ok) return flash(j.error || "Save failed");
    setSaved(JSON.stringify(data));
    flash("Saved. The live site shows it on the next page load.");
  }
  async function logout() {
    await api("logout", { method: "POST" });
    setAuthed(false);
  }

  if (authed === null) return <div className="adm center">Loading…</div>;
  if (!authed)
    return (
      <div className="adm center">
        <form className="login" onSubmit={login}>
          <div className="brand">✱ Joey Concepcion</div>
          <h1>Portfolio CMS</h1>
          <label className="f">
            <span>Password</span>
            <input type="password" value={pw} onChange={(e) => setPw(e.target.value)} autoFocus autoComplete="current-password" />
          </label>
          {err && <p className="err">{err}</p>}
          <button className="btn">Sign in</button>
          <Link href="/" className="back">
            ← Back to the portfolio
          </Link>
        </form>
      </div>
    );

  const sec = SECTIONS.find((s) => s.key === tab);
  const unread = msgs.filter((m) => !m.read).length;

  return (
    <div className="adm">
      <aside>
        <div className="brand">✱ Joey CMS</div>
        <nav>
          {SECTIONS.map((s) => (
            <button key={s.key} className={tab === s.key ? "on" : ""} onClick={() => setTab(s.key)}>
              {s.label}
            </button>
          ))}
          <hr />
          <button className={tab === "messages" ? "on" : ""} onClick={() => (setTab("messages"), loadMsgs())}>
            Messages {unread ? <em>{unread}</em> : null}
          </button>
          <button
            className={tab === "history" ? "on" : ""}
            onClick={async () => {
              setTab("history");
              const r = await api("history");
              if (r.ok) setHist((await r.json()).items);
            }}
          >
            Version history
          </button>
          <button onClick={logout}>Sign out</button>
        </nav>
      </aside>
      <main>
        <header>
          <div>
            <h1>{sec?.label ?? (tab === "messages" ? "Messages" : "Version history")}</h1>
            {sec?.hint && <p>{sec.hint}</p>}
          </div>
          <div className="actions">
            <a className="btn ghost" href="/" target="_blank">
              View site ↗
            </a>
            {sec && (
              <button className="btn" disabled={!dirty || busy} onClick={save}>
                {busy ? "Saving…" : dirty ? "Save changes" : "Saved"}
              </button>
            )}
          </div>
        </header>

        {sec && (
          <div className="editor">
            <Field k="" v={data[sec.key] as unknown as J} set={(nv) => setData({ ...data, [sec.key]: nv } as Content)} />
          </div>
        )}

        {tab === "messages" && (
          <div className="msgs">
            {!msgs.length && <p className="empty">No messages yet. Messages from the contact form land here.</p>}
            {msgs.map((m) => (
              <article key={m.id} className={m.read ? "read" : ""}>
                <div className="mh">
                  <b>{m.name}</b> · <a href={`mailto:${m.email}`}>{m.email}</a> · <span>{m.topic}</span>
                  <time>{new Date(m.created_at).toLocaleString()}</time>
                </div>
                <p>{m.message}</p>
                <div className="tools">
                  <button
                    onClick={async () => {
                      await api(`messages/${m.id}`, { method: "PATCH", body: JSON.stringify({ read: !m.read }) });
                      loadMsgs();
                    }}
                  >
                    Mark {m.read ? "unread" : "read"}
                  </button>
                  <button
                    className="del"
                    onClick={async () => {
                      if (!confirm("Delete this message permanently?")) return;
                      await api(`messages/${m.id}`, { method: "DELETE" });
                      loadMsgs();
                    }}
                  >
                    Delete
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}

        {tab === "history" && (
          <div className="msgs">
            {!hist.length && <p className="empty">Every save keeps the previous version here (last 30).</p>}
            {hist.map((h) => (
              <article key={h.id}>
                <div className="mh">
                  <b>Version #{h.id}</b>
                  <time>{new Date(h.saved_at).toLocaleString()}</time>
                </div>
                <div className="tools">
                  <button
                    onClick={async () => {
                      const r = await api(`history/${h.id}`);
                      if (!r.ok) return;
                      setData(mergeContent((await r.json()).data));
                      setTab("profile");
                      flash("Version loaded into the editor. Save to make it live.");
                    }}
                  >
                    Load into editor
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </main>
      <div className={`note${note ? " show" : ""}`}>{note}</div>
    </div>
  );
}
