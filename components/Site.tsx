"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { Content, NAV, Page, Role, defaultContent, mergeContent } from "@/lib/content";
import RoleModal, { Tile } from "./RoleModal";
import { mountMotion } from "@/lib/motion";
import { Arrow, Chars, Heading, Letters, Roll, Words } from "./Text";
import { Visual } from "./Visuals";

const HIRES_FACES = true;

const HEADS: Record<Exclude<Page, "home">, { n: string; label: string; ghost: string; title: string; text: string }> = {
  experience: { n: "02", label: "Experience", ghost: "WORK", title: "Twenty years, fourteen roles", text: "From a mainframe at the Commission on Audit to digital channels across Asia. Tap any role for the full story." },
  skills: { n: "03", label: "Skills & certifications", ghost: "SKILLS", title: "The toolkit", text: "Seven databases, ten languages, and a shelf of certificates that kept growing after the degrees." },
  story: { n: "04", label: "Story", ghost: "JOEY", title: "The person behind the CV", text: "Degrees, interests, the places his support reached, a mini game, and the character sheet." },
};

const icons: Record<string, React.ReactNode> = {
  spark: <path d="M20 4v8M20 28v8M4 20h8M28 20h8M9 9l5 5M26 26l5 5M31 9l-5 5M14 26l-5 5" />,
  pulse: <path d="M3 21h8l3-8 5 16 4-12 3 4h11" />,
  compass: (
    <>
      <circle cx="20" cy="20" r="15" />
      <path d="m26 14-4 8-8 4 4-8z" />
    </>
  ),
};

function telHref(p: string) {
  return "tel:" + p.replace(/[^\d+]/g, "");
}

export default function Site({ page = "home" }: { page?: Page }) {
  const [c, setC] = useState<Content>(defaultContent);
  const [ver, setVer] = useState(0);
  const root = useRef<HTMLDivElement>(null);
  const [menu, setMenu] = useState(false);
  const [modal, setModal] = useState<number | null>(null);
  const [toast, setToast] = useState("");
  const [fact, setFact] = useState(0);
  const [guess, setGuess] = useState<number | null>(null);
  const [sending, setSending] = useState(false);
  const [face, setFace] = useState(0);
  const [hat, setHat] = useState(0);
  const [zoom, setZoom] = useState<string | null>(null);

  // latest CMS content (the page ships with the bundled copy, then swaps in what the CMS saved)
  useEffect(() => {
    let off = false;
    fetch("/api/content", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((j) => {
        if (off || !j?.data) return;
        const next = mergeContent(j.data);
        if (JSON.stringify(next) !== JSON.stringify(defaultContent)) {
          setC(next);
          setVer((v) => v + 1);
        }
      })
      .catch(() => {});
    return () => {
      off = true;
    };
  }, []);

  const tiles: Tile[] = useMemo(
    () => [
      ...[...c.ladder.steps].reverse().map((s) => ({ when: s.when, title: s.title, org: c.ladder.org, industry: "Pharmaceuticals", points: [s.text], tags: (s as { tags?: string[] }).tags ?? [] })),
      ...c.roles.map((r: Role) => ({ when: r.when, title: r.title, org: r.org, industry: r.industry, points: r.points, tags: (r as { tags?: string[] }).tags ?? [] })),
    ],
    [c],
  );

  const openRole = useCallback((i: number) => setModal(i), []);

  useEffect(() => {
    if (!root.current) return;
    return mountMotion(root.current, { onTile: openRole });
  }, [ver, openRole, page]);

  // About: the portrait cycles through his expressions
  const faces = useMemo(() => [{ label: "Hi", image: c.profile.photo }, ...(c.profile.expressions ?? [])], [c]);
  useEffect(() => {
    // HIRES_FACES: only cycle the big frame when the expression images are full-size portraits
    if (!HIRES_FACES || page !== "home" || faces.length < 2) return;
    const id = window.setInterval(() => setFace((f) => (f + 1) % faces.length), 2800);
    return () => window.clearInterval(id);
  }, [page, faces.length, face]);

  // curtain + modal animations are driven from motion.ts helpers
  useEffect(() => {
    document.documentElement.classList.toggle("menu-open", menu);
    window.dispatchEvent(new CustomEvent("curtain", { detail: menu }));
  }, [menu]);
  useEffect(() => {
    window.dispatchEvent(new CustomEvent("modal", { detail: modal !== null || zoom !== null }));
    const k = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setModal(null);
        setMenu(false);
        setZoom(null);
      }
    };
    window.addEventListener("keydown", k);
    return () => window.removeEventListener("keydown", k);
  }, [modal, zoom]);

  const home = page === "home";
  // on the home page anchors scroll; elsewhere they go back to the home page section
  const href = (n: { id: string; route?: Page }) => (n.route ? `/${n.route}/` : n.id === "contact" || home ? `#${n.id}` : `/#${n.id}`);
  const roleIndex = (title: string) => tiles.findIndex((x) => x.title === title);

  const flash = (m: string) => {
    setToast(m);
    window.setTimeout(() => setToast(""), 4200);
  };

  async function send(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = e.currentTarget;
    const data = Object.fromEntries(new FormData(f).entries());
    setSending(true);
    try {
      const r = await fetch("/api/contact", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(data) });
      const j = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(j.error || "Could not send");
      f.reset();
      flash(`Thanks${data.name ? ", " + String(data.name).split(" ")[0] : ""}! Joey will get back to you soon.`);
    } catch (err) {
      flash(err instanceof Error ? err.message : "Could not send. Try LinkedIn instead.");
    } finally {
      setSending(false);
    }
  }

  const p = c.profile;
  const yr = new Date().getFullYear();
  const totalCountries = c.countries.reduce((n, r) => n + r.items.length, 0);

  return (
    <div ref={root} key={ver}>
      <div className="progress" />

      {/* ---------- one floating nav ---------- */}
      <header className="nav" data-theme="dark">
        {home ? (
          <a href="#top" className="brand" aria-label="Back to top">
            <b>✱</b> {p.first} {p.last}
          </a>
        ) : (
          <Link href="/" className="brand" aria-label="Home">
            <b>✱</b> {p.first} {p.last}
          </Link>
        )}
        <nav className="nav-links" aria-label="Sections">
          {NAV.slice(0, 7).map((n) =>
            n.route ? (
              <Link key={n.id} href={href(n)} className={page === n.route ? "here" : undefined} aria-current={page === n.route ? "page" : undefined}>
                <Roll text={n.label} />
              </Link>
            ) : (
              <a key={n.id} href={href(n)} data-link={home ? n.id : undefined}>
                <Roll text={n.label} />
              </a>
            ),
          )}
        </nav>
        <a href="#contact" className="nav-cta">
          <span className="t">Let&apos;s talk</span>
          <span className="dot">
            <Arrow size={13} />
          </span>
        </a>
        <button className="burger" aria-label="Open menu" aria-expanded={menu} onClick={() => setMenu(true)}>
          <span />
        </button>
      </header>

      <div className={`curtain${menu ? " open" : ""}`} aria-hidden={!menu}>
        <div className="top">
          <span className="lbl-mono">✱ {p.name}</span>
          <button className="close" aria-label="Close menu" onClick={() => setMenu(false)}>
            ×
          </button>
        </div>
        <nav className="cnav">
          {[
            { label: "On this page", items: NAV.filter((n) => !n.route) },
            { label: "Pages", items: NAV.filter((n) => n.route) },
          ].map((g) => (
            <div className="cgroup" key={g.label}>
              <h6>{g.label}</h6>
              {g.items.map((n) => {
                const i = [...NAV.filter((x) => !x.route), ...NAV.filter((x) => x.route)].indexOf(n);
                const inner = (
                  <>
                    <small>{String(i + 1).padStart(2, "0")}</small>
                    <span>{n.label}</span>
                    <em aria-hidden="true">{n.route ? "↗" : "→"}</em>
                  </>
                );
                return n.route ? (
                  <Link key={n.id} href={href(n)} onClick={() => setMenu(false)} tabIndex={menu ? 0 : -1} className={page === n.route ? "here" : undefined}>
                    {inner}
                  </Link>
                ) : (
                  <a key={n.id} href={href(n)} onClick={() => setMenu(false)} tabIndex={menu ? 0 : -1}>
                    {inner}
                  </a>
                );
              })}
            </div>
          ))}
        </nav>
        <div className="foot">
          <a href={p.linkedin} target="_blank" rel="noreferrer" tabIndex={menu ? 0 : -1}>
            LinkedIn ↗
          </a>
          {p.github && (
            <a href={p.github} target="_blank" rel="noreferrer" tabIndex={menu ? 0 : -1}>
              GitHub ↗
            </a>
          )}
          {p.email && <a href={`mailto:${p.email}`}>{p.email}</a>}
          {p.phone && <a href={telHref(p.phone)}>{p.phone}</a>}
          <span>{p.location}</span>
        </div>
      </div>

      <main>
        {!home && (
          <section id="top" className="page-head" data-nav="dark">
            <div className="ph-ghost" aria-hidden="true">
              {HEADS[page as Exclude<Page, "home">].ghost}
            </div>
            <div className="blob br" />
            <div className="wrap">
              <span className="lbl-mono">
                {HEADS[page as Exclude<Page, "home">].n} · {HEADS[page as Exclude<Page, "home">].label}
              </span>
              <h1>
                <Letters text={HEADS[page as Exclude<Page, "home">].title} />
              </h1>
              <div className="ph-sub">
                <p>{HEADS[page as Exclude<Page, "home">].text}</p>
                <div className="ph-links">
                  <Link href="/">← Home</Link>
                  {NAV.filter((n) => n.route && n.route !== page).map((n) => (
                    <Link key={n.id} href={href(n)}>
                      {n.label} →
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          </section>
        )}

        {home && (
          <>
        {/* ---------- HERO: Bold Portfolio Hero ---------- */}
        <section id="top" className="hero" data-nav="dark">
          <div className="hero-ghost" aria-hidden="true">
            <svg viewBox="0 0 1000 260">
              <text x="500" y="225" textAnchor="middle" fill="#fff" fontFamily="Anton, Impact, sans-serif" fontSize="270" letterSpacing="10">
                {p.short.toUpperCase()}
              </text>
            </svg>
          </div>
          <div className="blob br" />
          <div className="blob bl" />
          <div className="hero-top">
            <span className="pin">
              <i /> {p.availability}
            </span>
            <span>{p.location} · Since 2006</span>
          </div>
          <div className="hero-stage">
            <h1 aria-label={c.profile.heroWords.join(" ")}>
              <span className="w">
                <span className="hw">
                  <Letters text={c.profile.heroWords[0] ?? ""} />
                </span>
              </span>
            </h1>
            {c.profile.heroWords[1] && (
              <span className="hero-badge" aria-hidden="true">
                {c.profile.heroWords.slice(1).join(" ")}
              </span>
            )}
            <div className="hero-photo">
              <div className="brush" />
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={p.cutout || p.photo} alt={p.name} />
            </div>
            <div className="hero-float left hf">
              <span className="k">{"// "}{p.role.split(" · ")[1] || p.role}</span>
              {p.intro}
              <div>
                <a href="#contact" className="hire">
                  Text // Let&apos;s talk
                  <span className="circ">
                    <Arrow />
                  </span>
                </a>
              </div>
            </div>
            <div className="hero-float right hf">
              <small>{"// "}{p.role.split(" · ")[0]}</small>
              {p.tagline.split(" to ").map((s, i, a) => (
                <span key={i} style={{ display: "block" }}>
                  {s}
                  {i < a.length - 1 ? " to" : ""}
                </span>
              ))}
            </div>
          </div>
          <div className="brands" aria-label="Organisations Joey has worked with">
            <div className="track">
              {[...c.brands, ...c.brands].map((b, i) => (
                <span key={i} aria-hidden={i >= c.brands.length}>
                  {b}
                </span>
              ))}
            </div>
          </div>
        </section>

        {/* ---------- ABOUT (light): sticky portrait column that cycles his expressions ---------- */}
        <section id="about" className="band light" data-nav="light">
          <div className="wrap about-grid">
            <aside className="about-side">
              <div className="ph faces">
                {faces.map((f, i) => (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img key={f.image} src={f.image} alt={i === 0 ? `Portrait of ${p.name}` : `${p.short}, ${f.label.toLowerCase()}`} className={i === face ? "on" : undefined} />
                ))}
                <div className="tagline">{face === 0 ? "Hi, everyone!" : faces[face]?.label}</div>
              </div>
              <div className="face-row" role="tablist" aria-label="Expressions">
                {faces.map((f, i) => (
                  <button key={f.image} role="tab" aria-selected={i === face} className={i === face ? "on" : undefined} onClick={() => HIRES_FACES && setFace(i)} aria-label={f.label} title={f.label}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={f.image} alt="" />
                  </button>
                ))}
              </div>
              <div className="now-list">
                {p.now.map((n) => (
                  <div key={n.label}>
                    <small>{n.label}</small>
                    <span>{n.value}</span>
                  </div>
                ))}
              </div>
            </aside>
            <div>
              <div className="sec-head">
                <span className="lbl-mono">01 · About</span>
                <Heading text="Programmer, DBA, analyst, lead," em="and now mentor." />
              </div>
              <div className="prose">
                {c.about.paragraphs.map((t, i) => (
                  <p key={i} className="lit-text">
                    <Words text={t} />
                  </p>
                ))}
              </div>
              <div className="talk">
                <h4>Happy to talk about</h4>
                <ul>
                  {c.about.talkAbout.map((x) => (
                    <li key={x}>{x}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* ---------- MANY HATS: Learnly accordion ---------- */}
        <section id="hats" className="band hats" data-nav="light">
          <div className="wrap hats-grid">
            <div className="hats-left">
              <span className="lbl-mono">02 · Many hats</span>
              <h2 className="hats-title">
                <span className="m"><span className="ln">Build.</span></span>
                <span className="m"><span className="ln">Lead.</span></span>
                <span className="m"><span className="ln"><em>Teach.</em></span></span>
              </h2>
              <p className="hats-lead">{c.hats.lead}</p>
              <div className="hats-pick">
                <span>{c.hats.items[hat]?.hat}</span>
                <button
                  onClick={() => {
                    const i = roleIndex(c.hats.items[hat]?.role ?? "");
                    if (i >= 0) setModal(i);
                    else document.getElementById("contact")?.scrollIntoView({ behavior: "smooth" });
                  }}
                >
                  {c.hats.items[hat]?.role ? "See the role" : "Book a session"}
                </button>
              </div>
            </div>
            <div className="hats-row">
              {c.hats.items.map((h, i) => (
                <button
                  key={h.hat}
                  className={`hat${i === hat ? " on" : ""}`}
                  onMouseEnter={() => setHat(i)}
                  onFocus={() => setHat(i)}
                  onClick={() => {
                    // desktop: first click opens the card, second opens the story; phones show every card open, so one tap
                    if (i !== hat && !matchMedia("(max-width: 768px)").matches) return setHat(i);
                    setHat(i);
                    const r = h.role ? roleIndex(h.role) : -1;
                    if (r >= 0) setModal(r);
                    else document.getElementById("contact")?.scrollIntoView({ behavior: "smooth" });
                  }}
                  aria-expanded={i === hat}
                  aria-label={`${h.hat}, since ${h.since}`}
                  style={{ ["--i" as string]: i }}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={h.image} alt="" />
                  <span className="hat-ghost" aria-hidden="true">{h.since}</span>
                  <span className="hat-side" aria-hidden="true">
                    <span className="v">{h.hat}</span>
                  </span>
                  <span className="hat-body">
                    <span className="hat-top">
                      <span className="hat-title">{h.hat}</span>
                      <span className="hat-num">
                        <b>{h.years}</b>
                        <small>{h.years === "1" ? "year" : "years"}</small>
                      </span>
                    </span>
                    <span className="hat-text">{h.text}</span>
                    <span className="hat-cta">{h.role ? "Open the role →" : "Book mentoring →"}</span>
                  </span>
                </button>
              ))}
            </div>
          </div>
          <p className="hats-foot">{c.hats.title} <em>{c.hats.em}</em></p>
        </section>

        {/* ---------- CAREER RING: Dark Portfolio ribbon ---------- */}
        <section id="work" className="ring-sec dark" data-nav="dark">
          <div className="ring-head sec-head" style={{ margin: "0 auto 0" }}>
            <span className="lbl-mono" style={{ justifyContent: "center" }}>
              03 · Career
            </span>
            <Heading text={`${c.stats[1]?.value ?? 12} organisations,`} em="one career." />
            <p>Fourteen roles, from a mainframe in Manila to digital channels across a region. Drag the ring, then tap a card to see what I did there.</p>
          </div>
          <div className="ribbon" aria-label="Career roles carousel">
            <div className="persp">
              <div className="spinner">
                {tiles.map((r, i) => (
                  <div className="tile" key={i} data-i={i}>
                    <button className="card" data-open={i} aria-label={`${r.title}, ${r.org}`}>
                      <div>
                        <div className="when">{r.when}</div>
                      </div>
                      <div>
                        <h3>{r.title}</h3>
                        <div className="org">{r.org}</div>
                      </div>
                      <div className="row">
                        <span className="chip">{r.industry}</span>
                        <span className="more">Details →</span>
                      </div>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <p className="ring-hint">← Drag to spin · tap a card →</p>
        </section>

        {/* ---------- WHY ARCH: sticky scrub ---------- */}
        <section className="arch-sec" data-nav="dark" aria-label={c.arch.title}>
          <div className="arch-sticky">
            <div className="arch-frame">
              <div className="arch-grid" />
              <div className="arch-water" aria-hidden="true">
                20+
              </div>
              <svg className="arch-lines" viewBox="0 0 1440 900" aria-hidden="true">
                {[
                  ["M272 196H376L508 290", 508, 290],
                  ["M323 617H426L507 561", 507, 561],
                  ["M1086 196H1070L935 290", 935, 290],
                  ["M1086 617H1016L935 561", 935, 561],
                ].map(([d, x, y], i) => (
                  <g key={i} className="lead" data-i={i}>
                    <path d={d as string} />
                    <circle cx={x as number} cy={y as number} r={4.5} />
                  </g>
                ))}
              </svg>
              <div className="arch-bg" />
              <div className="arch-in">
                <div className="l">•&nbsp; {c.arch.label}</div>
                <h3>{c.arch.title}</h3>
                <p>{c.arch.text}</p>
                <div className="sig">{p.short}</div>
              </div>
              {c.stats.slice(0, 4).map((s, i) => (
                <div className="stat" key={i} data-i={i} data-v={s.value} data-pre={s.prefix} data-suf={s.suffix}>
                  <div className="n">
                    {s.prefix}
                    {s.value}
                    {s.suffix}
                  </div>
                  <div className="c">{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ---------- HOW I WORK: Dark Portfolio zig-zag ---------- */}
        <section id="approach" className="dark how" data-nav="dark">
          <div className="how-head">•&nbsp; 04 · How I work</div>
          <div className="sec-head" style={{ marginBottom: 0 }}>
            <Heading text="Twenty years of habits" em="worth teaching." />
          </div>
          {c.approach.map((s, i) => (
            <div className={`step${i % 2 ? " even" : ""}`} key={i}>
              <div className="media">
                <Visual kind={s.visual} />
              </div>
              <div className="txt">
                <span className="num">{String(i + 1).padStart(2, "0")}.</span>
                <h3>{s.title}</h3>
                <p>{s.text}</p>
              </div>
            </div>
          ))}
        </section>

          </>
        )}

        {page === "experience" && (
          <>
        {/* ---------- EXPERIENCE (light) ---------- */}
        <section id="experience" className="band light" data-nav="light" style={{ paddingTop: 80 }}>
          <div className="wrap">
            <div className="sec-head">
              <span className="lbl-mono">02 · Experience</span>
              <Heading text="From databases and batch jobs" em="to the classroom." />
              <p className="lit-text">
                <Words text="Two decades in IT across banking, payments, telecoms, energy, government and pharma, in Singapore and the Philippines." />
              </p>
            </div>

            <div className="now-card card">
              <div className="a">
                <span className="lbl-mono">{c.current.when}</span>
                <h3>{c.current.title}</h3>
                <div className="org">{c.current.org}</div>
                <p>{c.current.text}</p>
              </div>
              <div className="b">
                <div className="diag">
                  {c.current.tags.map((x) => (
                    <span key={x}>{x}</span>
                  ))}
                </div>
              </div>
            </div>

            <div className="ladder-head">
              <h3>{c.ladder.org}</h3>
              <span>{c.ladder.where}</span>
            </div>
            <div className="ladder">
              {c.ladder.steps.map((s) => (
                <button className="rung card" key={s.title} onClick={() => setModal(roleIndex(s.title))}>
                  <div className="when">{s.when}</div>
                  <h4>{s.title}</h4>
                  <p>{s.text}</p>
                  <span className="go">Story →</span>
                </button>
              ))}
            </div>
            <div className="ladder-cap">{c.ladder.caption}</div>

            <div className="ladder-head">
              <h3>Earlier roles</h3>
              <span>Click any role to see what I did there.</span>
            </div>
            <ul className="tl">
              <span className="draw" />
              {c.roles.map((r, i) => (
                <li key={i} onClick={() => setModal(roleIndex(r.title))} tabIndex={0} onKeyDown={(e) => e.key === "Enter" && setModal(roleIndex(r.title))}>
                  <span className="when">{r.when}</span>
                  <div>
                    <h4>{r.title}</h4>
                    <div className="org">{r.org}</div>
                  </div>
                  <span className="go">View →</span>
                </li>
              ))}
            </ul>
            <div className="chips">
              {c.industries.map((x) => (
                <span key={x}>{x}</span>
              ))}
            </div>
          </div>
        </section>

          </>
        )}

        {page === "skills" && (
          <>
        {/* ---------- SKILLS (light) ---------- */}
        <section id="skills" className="band light" data-nav="light" style={{ paddingTop: 80 }}>
          <div className="wrap">
            <div className="sec-head">
              <span className="lbl-mono">03 · Skills</span>
              <Heading text="Seven databases," em="ten languages." />
            </div>
            <div className="skills-grid">
              {c.skills.map((g) => (
                <div className="sk card" key={g.group}>
                  <h3>{g.group}</h3>
                  <div className="note">{g.note}</div>
                  <ul className="tags">
                    {g.items.map((x) => (
                      <li className="tag" key={x}>
                        <span>{x}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ---------- CERTIFICATIONS (dark) ---------- */}
        <section id="certifications" className="band dark" data-nav="dark">
          <div className="wrap">
            <div className="sec-head">
              <span className="lbl-mono">03 · Certifications</span>
              <Heading text="Still collecting" em="certificates." />
              <p className="lit-text">
                <Words text="Service management, agile delivery, UX and digital marketing, analytics and leadership. Learning never stopped after the degrees." />
              </p>
            </div>
            <div className="cert-groups">
              {c.certifications.map((g) => (
                <div className="cg" key={g.group}>
                  <h3>
                    {g.group}
                    <small>{g.items.length} credentials</small>
                  </h3>
                  <div className="cards">
                    {g.items.map((x) => (
                      <div className="card cert tilt" key={x.name}>
                        <span className="seal">✓</span>
                        <div className="yr">{x.year}</div>
                        <h4>{x.name}</h4>
                        <p>{x.issuer}</p>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

          </>
        )}

        {page === "story" && (
          <>
        {/* ---------- EDUCATION (light) ---------- */}
        <section id="education" className="band light" data-nav="light">
          <div className="wrap">
            <div className="sec-head">
              <span className="lbl-mono">04 · Education</span>
              <Heading text="Four degrees," em="one in progress." />
            </div>
            <div className="edu">
              {c.education.map((e) => (
                <div className="card" key={e.title}>
                  <div className={`when${e.when.length > 6 ? " sm" : ""}`}>{e.when}</div>
                  <h4>{e.title}</h4>
                  <p>{e.school}</p>
                  {e.note && <span className="badge">{e.note}</span>}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ---------- GET TO KNOW ME (dark) ---------- */}
        <section id="know" className="band dark" data-nav="dark">
          <div className="wrap">
            <div className="sec-head">
              <span className="lbl-mono">04 · Get to know me</span>
              <Heading text="Outside the" em="server room." />
              <p className="lit-text">
                <Words text="Outside work, I lean towards things that keep me learning and give me fresh perspective." />
              </p>
            </div>
            <div className="interests">
              {c.interests.map((x) => (
                <div className="int card tilt" key={x.title}>
                  <svg viewBox="0 0 40 40">{icons[x.icon] ?? icons.spark}</svg>
                  <h4>{x.title}</h4>
                  <p>{x.text}</p>
                </div>
              ))}
            </div>
            <div className="know-grid">
              <div className="panel card">
                <span className="lbl-mono">Then → now</span>
                <div className="thennow">
                  <div className="t">
                    <small>{c.thenNow.then.when}</small>
                    <h4>{c.thenNow.then.title}</h4>
                    <p>{c.thenNow.then.text}</p>
                  </div>
                  <span className="arr">→</span>
                  <div className="t">
                    <small>{c.thenNow.now.when}</small>
                    <h4>{c.thenNow.now.title}</h4>
                    <p>{c.thenNow.now.text}</p>
                  </div>
                </div>
                <div className="faq" style={{ marginTop: 26 }}>
                  {c.faq.map((f) => (
                    <details key={f.q}>
                      <summary>
                        {f.q} <i>+</i>
                      </summary>
                      <p>{f.a}</p>
                    </details>
                  ))}
                </div>
              </div>
              <div className="panel card countries">
                <span className="lbl-mono">Places my production support has reached</span>
                <div className="big count" data-v={totalCountries}>
                  {totalCountries}
                </div>
                {c.countries.map((r) => (
                  <div className="reg" key={r.region}>
                    <small>{r.region}</small>
                    <div>
                      {r.items.map((x) => (
                        <span key={x}>{x}</span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
              <div className="panel card game">
                <span className="lbl-mono">Mini game</span>
                <h3>Two truths and a lie</h3>
                <p style={{ color: "var(--mute)", marginBottom: 16, fontSize: 14.5 }}>Which one isn&apos;t true? Tap to guess.</p>
                {c.game.statements.map((s, i) => (
                  <button
                    key={i}
                    className={`opt${guess !== null ? (s.lie ? " lie" : " truth") : ""}`}
                    disabled={guess !== null}
                    onClick={() => setGuess(i)}
                  >
                    {s.text}
                  </button>
                ))}
                <div className="verdict" aria-live="polite">
                  {guess !== null ? (c.game.statements[guess]?.lie ? c.game.right : c.game.wrong) : ""}
                </div>
                {guess !== null && (
                  <button className="lbl-mono" style={{ color: "var(--ochre)", marginTop: 8 }} onClick={() => setGuess(null)}>
                    Play again ↺
                  </button>
                )}
              </div>
              <div className="panel card">
                <span className="lbl-mono">Fun fact</span>
                <p className="fact" aria-live="polite">
                  {c.facts[fact % c.facts.length]}
                </p>
                <div className="fact-row">
                  <small>
                    {(fact % c.facts.length) + 1} / {c.facts.length}
                  </small>
                  <button className="pill big" onClick={() => setFact((f) => f + 1)}>
                    <Chars text="Another fun fact" />
                    <span className="arr">→</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ---------- CHARACTER SHEET ---------- */}
        <section id="sheet" className="band light sheet-sec" data-nav="light">
          <div className="wrap">
            <div className="sec-head">
              <span className="lbl-mono">04 · {c.sheet.title}</span>
              <Heading text="Drawn like an" em="animated lead." />
              <p className="lit-text">
                <Words text={c.sheet.text} />
              </p>
            </div>
            <button className="sheet-main card" onClick={() => setZoom(c.sheet.image)} aria-label="Open the character sheet full size">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={c.sheet.image} alt={`Character sheet of ${p.name}: turnaround, expressions and palette`} loading="lazy" />
              <span className="zoom-hint">Tap to zoom ⤢</span>
            </button>
            <div className="sheet-faces">
              {(p.expressions ?? []).map((f) => (
                <button key={f.image} className="card tilt" onClick={() => setZoom(f.image)}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={f.image} alt={`${p.short}, ${f.label.toLowerCase()}`} loading="lazy" />
                  <span>{f.label}</span>
                </button>
              ))}
            </div>
          </div>
        </section>

          </>
        )}

        {/* ---------- CONTACT (Bold hero colours as the bookend) ---------- */}
        <section id="contact" className="band contact" data-nav="dark">
          <div className="blob bl" />
          <div className="blob br" />
          <div className="wrap">
            <div className="contact-grid">
              <div>
                <span className="lbl-mono" style={{ opacity: 0.85 }}>
                  05 · Contact
                </span>
                <h2 style={{ marginTop: 16 }}>
                  <Letters text={c.contact.title} />
                </h2>
                <p className="lead">{c.contact.text}</p>
                <div className="links">
                  {p.email && (
                    <a href={`mailto:${p.email}`}>
                      {p.email} <small>Email ↗</small>
                    </a>
                  )}
                  {p.phone && (
                    <a href={telHref(p.phone)}>
                      {p.phone} <small>Call ↗</small>
                    </a>
                  )}
                  <a href={p.linkedin} target="_blank" rel="noreferrer">
                    linkedin.com/in/joeymconcepcion <small>LinkedIn ↗</small>
                  </a>
                  {p.github && (
                    <a href={p.github} target="_blank" rel="noreferrer">
                      github.com/{p.github.split("/").filter(Boolean).pop()} <small>GitHub ↗</small>
                    </a>
                  )}
                  {p.instagram && (
                    <a href={p.instagram} target="_blank" rel="noreferrer">
                      @{p.instagram.split("/").filter(Boolean).pop()} <small>Instagram ↗</small>
                    </a>
                  )}
                </div>
              </div>
              <form className="form" onSubmit={send}>
                <label>
                  Name
                  <input name="name" required maxLength={120} autoComplete="name" />
                </label>
                <label>
                  Email
                  <input name="email" type="email" required maxLength={200} autoComplete="email" />
                </label>
                <label>
                  Topic
                  <select name="topic" defaultValue="Mentoring">
                    <option>Mentoring</option>
                    <option>Guest lecture or talk</option>
                    <option>Digital channels</option>
                    <option>Databases & production support</option>
                    <option>Just saying hi</option>
                  </select>
                </label>
                <label>
                  Message
                  <textarea name="message" required maxLength={4000} />
                </label>
                <input className="hp" name="company" tabIndex={-1} autoComplete="off" aria-hidden="true" />
                <button className="pill big" type="submit" disabled={sending}>
                  <Chars text={sending ? "Sending…" : "Send message"} />
                  <span className="arr">→</span>
                </button>
              </form>
            </div>
            <footer className="footer">
              <div className="logo">
                {p.first} {p.last}.<span className="sig">{p.short}</span>
              </div>
              <small>
                © {yr} — {p.location} · {p.role}
              </small>
              <a href="#top" className="up">
                Back to top ↑
              </a>
            </footer>
          </div>
        </section>
      </main>

      <RoleModal tiles={tiles} index={modal} onClose={() => setModal(null)} onGo={setModal} />

      {zoom && (
        <div className="zoom" role="dialog" aria-modal="true" aria-label="Image viewer" onClick={() => setZoom(null)} data-lenis-prevent>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={zoom} alt="" />
          <button className="rm-x" aria-label="Close" onClick={() => setZoom(null)}>
            ×
          </button>
        </div>
      )}

      <div className={`toast${toast ? " show" : ""}`} role="status">
        {toast}
      </div>
    </div>
  );
}
