"use client";

import { useEffect, useLayoutEffect, useRef } from "react";
import gsap from "gsap";

export type Tile = { when: string; title: string; org: string; industry: string; points: string[]; tags: string[] };

const START = 2006, END = 2026;
function span(when: string) {
  const ys = (when.match(/\d{4}/g) || []).map(Number);
  const a = ys[0] ?? START;
  const b = /present/i.test(when) ? END : ys[ys.length - 1] ?? a;
  return [a, b];
}
const initials = (org: string) =>
  org
    .split(/[ ,]+/)
    .filter((w) => /^[A-Z]/.test(w) && !/^(via|of|the|and)$/i.test(w))
    .slice(0, 2)
    .map((w) => w[0])
    .join("");

export default function RoleModal({ tiles, index, onClose, onGo }: { tiles: Tile[]; index: number | null; onClose: () => void; onGo: (i: number) => void }) {
  const wrap = useRef<HTMLDivElement>(null);
  const card = useRef<HTMLDivElement>(null);
  const body = useRef<HTMLDivElement>(null);
  const dir = useRef(1);
  const last = useRef<number | null>(null);
  const open = index !== null;
  const n = tiles.length;
  const t = open ? tiles[index!] : null;

  const go = (d: number) => {
    if (index === null) return;
    dir.current = d;
    onGo((index + d + n) % n);
  };

  // open / close
  useEffect(() => {
    const el = wrap.current, c = card.current;
    if (!el || !c) return;
    const mobile = innerWidth < 760;
    if (open) {
      gsap.to(el, { autoAlpha: 1, duration: 0.3, ease: "power2.out" });
      if (last.current === null)
        gsap.fromTo(c, mobile ? { yPercent: 100 } : { y: 60, scale: 0.92, opacity: 0, rotateX: 8 }, mobile ? { yPercent: 0, duration: 0.6, ease: "power4.out" } : { y: 0, scale: 1, opacity: 1, rotateX: 0, duration: 0.7, ease: "power4.out", transformPerspective: 1200 });
    } else if (last.current !== null) {
      gsap.to(c, mobile ? { yPercent: 100, duration: 0.4, ease: "power3.in" } : { y: 40, opacity: 0, scale: 0.96, duration: 0.3, ease: "power2.in" });
      gsap.to(el, { autoAlpha: 0, duration: 0.35, delay: 0.1 });
    }
    last.current = open ? index : null;
  }, [open, index]);

  // content change: slide + stagger
  useLayoutEffect(() => {
    if (!open || !body.current) return;
    const b = body.current;
    const ctx = gsap.context(() => {
      gsap.fromTo(".rm-side .big, .rm-side .meta > *", { y: 24, opacity: 0 }, { y: 0, opacity: 1, duration: 0.6, ease: "power3.out", stagger: 0.05 });
      gsap.fromTo(".rm-bar i", { scaleX: 0 }, { scaleX: 1, duration: 0.9, ease: "power3.out", delay: 0.15 });
      gsap.fromTo(".rm-bar b", { left: "0%" }, { left: "var(--to)", duration: 0.9, ease: "power3.out", delay: 0.15 });
      gsap.fromTo(".rm-main h3, .rm-main .org", { x: 40 * dir.current, opacity: 0 }, { x: 0, opacity: 1, duration: 0.6, ease: "power3.out", stagger: 0.06 });
      gsap.fromTo(".rm-main li", { x: 30 * dir.current, opacity: 0 }, { x: 0, opacity: 1, duration: 0.55, ease: "power3.out", stagger: 0.07, delay: 0.12 });
      gsap.fromTo(".rm-tags span", { y: 12, opacity: 0, scale: 0.9 }, { y: 0, opacity: 1, scale: 1, duration: 0.45, ease: "back.out(2)", stagger: 0.04, delay: 0.3 });
    }, b);
    return () => ctx.revert();
  }, [open, index]);

  // keyboard
  useEffect(() => {
    if (!open) return;
    const k = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") go(1);
      if (e.key === "ArrowLeft") go(-1);
    };
    window.addEventListener("keydown", k);
    return () => window.removeEventListener("keydown", k);
  });

  // swipe left/right to change role, drag down to close (bottom sheet on phones)
  const sx = useRef(0), sy = useRef(0), drag = useRef(false);
  const onDown = (e: React.PointerEvent) => {
    if ((e.target as HTMLElement).closest("button")) return;
    drag.current = true;
    sx.current = e.clientX;
    sy.current = e.clientY;
  };
  const onMove = (e: React.PointerEvent) => {
    if (!drag.current || !card.current) return;
    const dy = e.clientY - sy.current;
    if (innerWidth < 760 && dy > 0) gsap.set(card.current, { y: dy });
  };
  const onUp = (e: React.PointerEvent) => {
    if (!drag.current) return;
    drag.current = false;
    const dx = e.clientX - sx.current, dy = e.clientY - sy.current;
    if (innerWidth < 760 && dy > 110) return onClose();
    if (card.current) gsap.to(card.current, { y: 0, duration: 0.3 });
    if (Math.abs(dx) > 70 && Math.abs(dx) > Math.abs(dy)) go(dx < 0 ? 1 : -1);
  };

  const [a, b] = t ? span(t.when) : [START, END];
  const from = ((a - START) / (END - START)) * 100;
  const to = ((Math.max(b, a + 0.4) - START) / (END - START)) * 100;
  const prev = open ? tiles[(index! - 1 + n) % n] : null;
  const next = open ? tiles[(index! + 1) % n] : null;

  return (
    <div ref={wrap} className="rm" style={{ visibility: "hidden", opacity: 0 }} onClick={(e) => e.target === e.currentTarget && onClose()} role="dialog" aria-modal="true" aria-hidden={!open} aria-label={t ? `${t.title}, ${t.org}` : undefined}>
      <div ref={card} className="rm-card" data-lenis-prevent onPointerDown={onDown} onPointerMove={onMove} onPointerUp={onUp} onPointerCancel={onUp}>
        <span className="rm-grab" aria-hidden="true" />
        <button className="rm-x" aria-label="Close" onClick={onClose}>
          ×
        </button>
        {t && (
          <div ref={body} className="rm-body" key={index}>
            <aside className="rm-side">
              <div className="meta">
                <span className="idx">
                  {String(index! + 1).padStart(2, "0")} <i>/ {String(n).padStart(2, "0")}</i>
                </span>
                <span className="mono">{initials(t.org) || "✱"}</span>
              </div>
              <div className="big">{a === b ? a : `${a}–${b === END && /present/i.test(t.when) ? "now" : String(b).slice(2)}`}</div>
              <div className="meta">
                <span className="when">{t.when}</span>
                <span className="chip">{t.industry}</span>
              </div>
              <div className="rm-bar" style={{ ["--from" as string]: `${from}%`, ["--to" as string]: `${to}%` }} aria-label={`Career position ${a} to ${b}`}>
                <i style={{ left: `${from}%`, width: `${Math.max(1.5, to - from)}%` }} />
                <b />
                <small>
                  <span>2006</span>
                  <span>2026</span>
                </small>
              </div>
            </aside>
            <div className="rm-main">
              <h3>{t.title}</h3>
              <div className="org">{t.org}</div>
              <ul>
                {t.points.map((x) => (
                  <li key={x}>{x}</li>
                ))}
              </ul>
              {t.tags?.length > 0 && (
                <div className="rm-tags">
                  <small>Skills in play</small>
                  <div>
                    {t.tags.map((x) => (
                      <span key={x}>{x}</span>
                    ))}
                  </div>
                </div>
              )}
              <div className="rm-nav">
                <button onClick={() => go(-1)}>
                  <small>← Previous</small>
                  <b>{prev?.title}</b>
                </button>
                <button onClick={() => go(1)} className="r">
                  <small>Next →</small>
                  <b>{next?.title}</b>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
