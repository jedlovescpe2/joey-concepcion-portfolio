"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Content, NAV, Role, defaultContent, mergeContent } from "@/lib/content";
import { mountMotion } from "@/lib/motion";
import { Arrow, Chars, Heading, Letters, Roll, Words } from "./Text";
import { Visual } from "./Visuals";

type Tile = { when: string; title: string; org: string; industry: string; points: string[] };

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

export default function Site() {
  const [c, setC] = useState<Content>(defaultContent);
  const [ver, setVer] = useState(0);
  const root = useRef<HTMLDivElement>(null);
  const [menu, setMenu] = useState(false);
  const [modal, setModal] = useState<number | null>(null);
  const [toast, setToast] = useState("");
  const [fact, setFact] = useState(0);
  const [guess, setGuess] = useState<number | null>(null);
  const [sending, setSending] = useState(false);

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
      ...[...c.ladder.steps].reverse().map((s) => ({ when: s.when, title: s.title, org: c.ladder.org, industry: "Pharmaceuticals", points: [s.text] })),
      ...c.roles.map((r: Role) => ({ when: r.when, title: r.title, org: r.org, industry: r.industry, points: r.points })),
    ],
    [c],
  );

  const openRole = useCallback((i: number) => setModal(i), []);

  useEffect(() => {
    if (!root.current) return;
    return mountMotion(root.current, { onTile: openRole });
  }, [ver, openRole]);

  // curtain + modal animations are driven from motion.ts helpers
  useEffect(() => {
    document.documentElement.classList.toggle("menu-open", menu);
    window.dispatchEvent(new CustomEvent("curtain", { detail: menu }));
  }, [menu]);
  useEffect(() => {
    window.dispatchEvent(new CustomEvent("modal", { detail: modal !== null }));
    const k = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setModal(null);
        setMenu(false);
      }
      if (modal !== null && e.key === "ArrowRight") setModal((m) => ((m ?? 0) + 1) % tiles.length);
      if (modal !== null && e.key === "ArrowLeft") setModal((m) => ((m ?? 0) - 1 + tiles.length) % tiles.length);
    };
    window.addEventListener("keydown", k);
    return () => window.removeEventListener("keydown", k);
  }, [modal, tiles.length]);

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
  const t = modal !== null ? tiles[modal] : null;
  const yr = new Date().getFullYear();
  const totalCountries = c.countries.reduce((n, r) => n + r.items.length, 0);

  return (
    <div ref={root} key={ver}>
      <div className="progress" />

      {/* ---------- one floating nav ---------- */}
      <header className="nav" data-theme="dark">
        <a href="#top" className="brand" aria-label="Back to top">
          <b>✱</b> {p.first} {p.last}
        </a>
        <nav className="nav-links" aria-label="Sections">
          {NAV.slice(0, 8).map((n) => (
            <a key={n.id} href={`#${n.id}`} data-link={n.id}>
              <Roll text={n.label} />
            </a>
          ))}
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
        <nav>
          {NAV.map((n, i) => (
            <a key={n.id} href={`#${n.id}`} onClick={() => setMenu(false)} tabIndex={menu ? 0 : -1}>
              <small>{String(i + 1).padStart(2, "0")}</small>
              <span>{n.label === "Certs" ? "Certifications" : n.label}</span>
            </a>
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

        {/* ---------- ABOUT (light) ---------- */}
        <section id="about" className="band light" data-nav="light">
          <div className="wrap about-grid">
            <div>
              <div className="ph">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={p.photo} alt={`Portrait of ${p.name}`} />
                <div className="tagline">Hi, everyone!</div>
              </div>
            </div>
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
              <div className="now-list">
                {p.now.map((n) => (
                  <div key={n.label}>
                    <small>{n.label}</small>
                    <span>{n.value}</span>
                  </div>
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

        {/* ---------- CAREER RING: Dark Portfolio ribbon ---------- */}
        <section id="work" className="ring-sec dark" data-nav="dark">
          <div className="ring-head sec-head" style={{ margin: "0 auto 0" }}>
            <span className="lbl-mono" style={{ justifyContent: "center" }}>
              02 · Career
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
          <div className="how-head">•&nbsp; 03 · How I work</div>
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

        {/* ---------- EXPERIENCE (light) ---------- */}
        <section id="experience" className="band light" data-nav="light">
          <div className="wrap">
            <div className="sec-head">
              <span className="lbl-mono">04 · Experience</span>
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
                <div className="rung card" key={s.title}>
                  <div className="when">{s.when}</div>
                  <h4>{s.title}</h4>
                  <p>{s.text}</p>
                </div>
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
                <li key={i} onClick={() => setModal(c.ladder.steps.length + i)} tabIndex={0} onKeyDown={(e) => e.key === "Enter" && setModal(c.ladder.steps.length + i)}>
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

        {/* ---------- SKILLS (light) ---------- */}
        <section id="skills" className="band light" data-nav="light" style={{ paddingTop: 80 }}>
          <div className="wrap">
            <div className="sec-head">
              <span className="lbl-mono">05 · Skills</span>
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
              <span className="lbl-mono">06 · Certifications</span>
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

        {/* ---------- EDUCATION (light) ---------- */}
        <section id="education" className="band light" data-nav="light">
          <div className="wrap">
            <div className="sec-head">
              <span className="lbl-mono">07 · Education</span>
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
              <span className="lbl-mono">08 · Get to know me</span>
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

        {/* ---------- CONTACT (Bold hero colours as the bookend) ---------- */}
        <section id="contact" className="band contact" data-nav="dark">
          <div className="blob bl" />
          <div className="blob br" />
          <div className="wrap">
            <div className="contact-grid">
              <div>
                <span className="lbl-mono" style={{ opacity: 0.85 }}>
                  09 · Contact
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

      {/* role popup */}
      <div className={`modal${t ? " open" : ""}`} onClick={(e) => e.target === e.currentTarget && setModal(null)} role="dialog" aria-modal="true" aria-hidden={!t}>
        {t && (
          <div className="box">
            <button className="x" aria-label="Close" onClick={() => setModal(null)}>
              ×
            </button>
            <div className="when">
              {t.when} · {t.industry}
            </div>
            <h3>{t.title}</h3>
            <div className="org">{t.org}</div>
            <ul>
              {t.points.map((x) => (
                <li key={x}>{x}</li>
              ))}
            </ul>
            <div className="nav2">
              <button onClick={() => setModal((m) => ((m ?? 0) - 1 + tiles.length) % tiles.length)}>← Previous</button>
              <button onClick={() => setModal((m) => ((m ?? 0) + 1) % tiles.length)}>Next →</button>
            </div>
          </div>
        )}
      </div>

      <div className={`toast${toast ? " show" : ""}`} role="status">
        {toast}
      </div>
    </div>
  );
}
