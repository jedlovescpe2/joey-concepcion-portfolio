// All motion for the one-page portfolio. Mounted once per content version; returns a cleanup.
// Heading effects are ported from jedllenado.com/cv (letter jump, nav roll, button ripple, word light-up, band reveal).
// The ring and the arch scrub follow the MotionSites "Dark Portfolio" spec.
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Lenis from "lenis";

type Opts = { onTile: (i: number) => void };
const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v));

export function mountMotion(root: HTMLElement, opts: Opts): () => void {
  gsap.registerPlugin(ScrollTrigger);
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const fine = window.matchMedia("(pointer:fine)").matches;
  const kills: (() => void)[] = [];
  const on = (el: EventTarget, ev: string, fn: EventListener, o?: AddEventListenerOptions) => {
    el.addEventListener(ev, fn, o);
    kills.push(() => el.removeEventListener(ev, fn, o));
  };
  const ctx = gsap.context(() => {}, root);
  const $ = <T extends Element = HTMLElement>(s: string) => Array.from(root.querySelectorAll<T & Element>(s)) as T[];

  /* ---------- smooth scroll + anchors ---------- */
  const lenis = reduced ? null : new Lenis({ duration: 1.15, smoothWheel: true });
  if (lenis) {
    lenis.on("scroll", ScrollTrigger.update);
    const tick = (t: number) => lenis.raf(t * 1000);
    gsap.ticker.add(tick);
    gsap.ticker.lagSmoothing(0);
    kills.push(() => {
      gsap.ticker.remove(tick);
      lenis.destroy();
    });
  }
  const go = (hash: string) => {
    const el = hash === "#top" ? document.body : document.querySelector(hash);
    if (!el) return;
    if (lenis) lenis.scrollTo(el as HTMLElement, { offset: 0, duration: 1.4 });
    else (el as HTMLElement).scrollIntoView({ behavior: "auto" });
  };
  on(document, "click", ((e: MouseEvent) => {
    const a = (e.target as HTMLElement).closest?.('a[href^="#"]') as HTMLAnchorElement | null;
    if (!a) return;
    const h = a.getAttribute("href")!;
    if (h.length < 2) return;
    e.preventDefault();
    history.replaceState(null, "", h === "#top" ? location.pathname : h);
    setTimeout(() => go(h), 30);
  }) as EventListener);
  if (location.hash.length > 1) setTimeout(() => go(location.hash), 400);

  /* ---------- nav: theme, active link, progress ---------- */
  const nav = root.querySelector<HTMLElement>(".nav")!;
  const bar = root.querySelector<HTMLElement>(".progress")!;
  const sections = $<HTMLElement>("[data-nav]");
  const links = $<HTMLAnchorElement>(".nav-links a");
  const onScroll = () => {
    const y = window.scrollY, max = document.documentElement.scrollHeight - innerHeight;
    bar.style.transform = `scaleX(${max > 0 ? y / max : 0})`;
    let theme = "dark";
    for (const s of sections) {
      const r = s.getBoundingClientRect();
      if (r.top <= 40 && r.bottom > 40) { theme = s.dataset.nav!; break; }
    }
    nav.dataset.theme = theme;
    let cur = "";
    for (const l of links) {
      const t = document.getElementById(l.dataset.link!);
      if (t && t.getBoundingClientRect().top < innerHeight * 0.4) cur = l.dataset.link!;
    }
    links.forEach((l) => l.classList.toggle("active", l.dataset.link === cur));
  };
  on(window, "scroll", onScroll, { passive: true });
  onScroll();

  /* nav letters roll up with an ochre twin */
  links.forEach((a) => {
    const tops = a.querySelectorAll(".c.top"), ghosts = a.querySelectorAll(".c.ghost");
    on(a, "mouseenter", () => {
      gsap.killTweensOf([tops, ghosts]);
      gsap.to([tops, ghosts], { yPercent: -100, duration: 0.45, ease: "power3.inOut", stagger: 0.022 });
    });
    on(a, "mouseleave", () => {
      gsap.killTweensOf([tops, ghosts]);
      gsap.to([tops, ghosts], { yPercent: 0, duration: 0.4, ease: "power3.inOut", stagger: { each: 0.018, from: "end" } });
    });
  });

  /* curtain menu */
  const curtain = root.querySelector<HTMLElement>(".curtain")!;
  on(window, "curtain", ((e: CustomEvent) => {
    const open = e.detail as boolean;
    if (open) lenis?.stop(); else lenis?.start();
    gsap.to(curtain, { clipPath: open ? "inset(0 0 0% 0)" : "inset(0 0 100% 0)", duration: reduced ? 0 : 0.8, ease: "power4.inOut" });
    if (open) gsap.fromTo(curtain.querySelectorAll("nav a span, nav a small"), { yPercent: 110 }, { yPercent: 0, duration: 0.8, ease: "power4.out", stagger: 0.035, delay: 0.25 });
  }) as EventListener);

  /* role popup (RoleModal animates itself; only pause smooth scroll here) */
  on(window, "modal", ((e: CustomEvent) => {
    if (e.detail) lenis?.stop(); else lenis?.start();
  }) as EventListener);

  /* ---------- hats accordion (Learnly) reveal ---------- */
  ctx.add(() => {
    if (reduced || !root.querySelector(".hats")) return;
    gsap.from(".hats .hat", { y: 90, opacity: 0, duration: 1, ease: "power4.out", stagger: 0.07, clearProps: "transform,opacity,translate,rotate,scale", onStart: () => root.querySelector(".hats-row")?.classList.add("revealing"), onComplete: () => root.querySelector(".hats-row")?.classList.remove("revealing"), scrollTrigger: { trigger: ".hats-row", start: "top 85%" } });
    gsap.from(".hats-title .ln", { yPercent: 105, duration: 1, ease: "power4.out", stagger: 0.1, scrollTrigger: { trigger: ".hats-title", start: "top 82%" } });
  });

  /* ---------- hero intro (Bold Portfolio Hero) ---------- */
  ctx.add(() => {
    if (reduced) return;
    if (!root.querySelector(".hero")) {
      // inner pages: banner intro instead of the hero
      const ph = gsap.timeline({ delay: 0.1 });
      ph.from(".page-head h1 .ltr", { yPercent: 110, duration: 0.9, ease: "power4.out", stagger: 0.025 })
        .from(".page-head .ph-sub > *", { opacity: 0, y: 18, duration: 0.8, ease: "power3.out", stagger: 0.08 }, 0.35)
        .from(".page-head .ph-ghost", { opacity: 0, scale: 0.9, duration: 1.4, ease: "power3.out" }, 0)
        .from(".nav", { opacity: 0, y: -20, duration: 0.8, ease: "power3.out" }, 0.2);
      gsap.to(".page-head .ph-ghost", { yPercent: 25, ease: "none", scrollTrigger: { trigger: ".page-head", start: "top top", end: "bottom top", scrub: true } });
      return;
    }
    const tl = gsap.timeline({ delay: 0.15 });
    tl.from(".hero h1 .hw", { yPercent: 110, duration: 1.1, ease: "power4.out", stagger: 0.12 })
      .from(".hero-badge", { opacity: 0, scale: 0.6, duration: 0.8, ease: "back.out(2)" }, 0.6)
      .from(".hero-photo", { opacity: 0, y: 40, scale: 0.92, duration: 1.2, ease: "power3.out" }, 0.35)
      .from(".hero-photo img", { scale: 1.25, duration: 1.8, ease: "power3.out" }, 0.35)
      .from(".hero .hf, .hero-top > *", { opacity: 0, y: 18, duration: 0.9, ease: "power3.out", stagger: 0.1 }, 0.7)
      .from(".brands", { opacity: 0, duration: 1 }, 1)
      .from(".nav", { opacity: 0, y: -20, duration: 0.8, ease: "power3.out" }, 0.3);
    // parallax on scroll out
    // headline + badge drift up and away from the portrait, so text never slides onto his face
    gsap.to(".hero h1", { yPercent: -35, opacity: 0.2, ease: "none", scrollTrigger: { trigger: ".hero", start: "top top", end: "bottom top", scrub: true } });
    gsap.to(".hero-badge", { y: () => -innerHeight * 0.3, opacity: 0, ease: "none", scrollTrigger: { trigger: ".hero", start: "top top", end: "60% top", scrub: true, invalidateOnRefresh: true } });
    gsap.to(".hero-photo", { yPercent: 6, ease: "none", scrollTrigger: { trigger: ".hero", start: "top top", end: "bottom top", scrub: true } });
    gsap.to(".hero-ghost", { scale: 1.15, opacity: 0.4, ease: "none", scrollTrigger: { trigger: ".hero", start: "top top", end: "bottom top", scrub: true } });
  });
  // the hero portrait leans toward the cursor
  const photo = root.querySelector<HTMLElement>(".hero-photo");
  const hero = root.querySelector<HTMLElement>(".hero");
  // keep the portrait's top (his hair) at least 18px below the "IN IT" badge, measured from layout (not transforms)
  const badge = root.querySelector<HTMLElement>(".hero-badge");
  if (photo && hero && badge) {
    const topIn = (el: HTMLElement) => {
      let y = 0, n: HTMLElement | null = el;
      while (n && n !== hero) { y += n.offsetTop; n = n.offsetParent as HTMLElement | null; }
      return y;
    };
    const fitPhoto = () => {
      photo.style.height = "";
      photo.style.marginTop = "";
      const over = topIn(badge) + badge.offsetHeight + 18 - topIn(photo);
      if (over <= 0) return;
      if (getComputedStyle(photo).position === "absolute") photo.style.height = `${Math.max(240, photo.offsetHeight - over)}px`;
      else photo.style.marginTop = `${parseFloat(getComputedStyle(photo).marginTop) + over}px`;
    };
    fitPhoto();
    document.fonts?.ready.then(fitPhoto);
    on(window, "resize", fitPhoto);
  }
  if (photo && hero && fine && !reduced) {
    on(hero, "mousemove", ((e: MouseEvent) => {
      const x = e.clientX / innerWidth - 0.5, y = e.clientY / innerHeight - 0.5;
      gsap.to(photo, { rotateY: x * 8, rotateX: -y * 8, x: x * 14, duration: 0.8, ease: "power3.out", transformPerspective: 900 });
      gsap.to(".blob.br", { x: x * 60, y: y * 40, duration: 1.2, ease: "power3.out" });
    }) as EventListener);
  }

  /* ---------- heading letters jump when hovered ---------- */
  $<HTMLElement>(".display .ltr, .hero h1 .ltr, .contact h2 .ltr").forEach((l) => {
    on(l, "mouseenter", () => {
      if (gsap.isTweening(l)) return;
      gsap.timeline()
        .to(l, { y: "-18%", scaleY: 1.08, scaleX: 0.94, skewX: -6, duration: 0.22, ease: "power2.out" })
        .to(l, { y: 0, scaleY: 1, scaleX: 1, skewX: 0, duration: 0.7, ease: "elastic.out(1,.45)" });
    });
  });

  /* buttons: letters ripple into italic, arrow pulses */
  $<HTMLElement>(".pill.big").forEach((btn) => {
    const chars = btn.querySelectorAll(".ch"), arr = btn.querySelector(".arr");
    let pulse: gsap.core.Tween | null = null;
    on(btn, "mouseenter", () => {
      gsap.killTweensOf(chars);
      gsap.fromTo(chars, { y: 0, skewX: 0 }, { y: -3, skewX: -14, duration: 0.28, ease: "power2.out", stagger: { each: 0.022, yoyo: true, repeat: 1 } });
      if (arr) pulse = gsap.to(arr, { x: 6, duration: 0.42, ease: "power1.inOut", yoyo: true, repeat: -1 });
    });
    on(btn, "mouseleave", () => {
      pulse?.kill();
      if (arr) gsap.to(arr, { x: 0, duration: 0.35 });
      gsap.to(chars, { y: 0, skewX: 0, duration: 0.3 });
    });
  });

  /* skill pills: spotlight + lean */
  if (fine) {
    $<HTMLElement>(".tag").forEach((li) => {
      on(li, "mousemove", ((ev: MouseEvent) => {
        const r = li.getBoundingClientRect();
        li.style.setProperty("--px", `${ev.clientX - r.left}px`);
        li.style.setProperty("--py", `${ev.clientY - r.top}px`);
        gsap.to(li, { x: (ev.clientX - r.left - r.width / 2) * 0.18, y: (ev.clientY - r.top - r.height / 2) * 0.25, duration: 0.35, ease: "power2.out" });
      }) as EventListener);
      on(li, "mouseleave", () => gsap.to(li, { x: 0, y: 0, duration: 0.5, ease: "elastic.out(1,.5)" }));
    });
    /* tilt cards */
    $<HTMLElement>(".tilt").forEach((card) => {
      on(card, "mousemove", ((e: MouseEvent) => {
        const r = card.getBoundingClientRect();
        const x = (e.clientX - r.left) / r.width - 0.5, y = (e.clientY - r.top) / r.height - 0.5;
        gsap.to(card, { rotateY: x * 10, rotateX: -y * 10, y: -4, duration: 0.4, ease: "power2.out", transformPerspective: 800 });
      }) as EventListener);
      on(card, "mouseleave", () => gsap.to(card, { rotateY: 0, rotateX: 0, y: 0, duration: 0.7, ease: "elastic.out(1,.5)" }));
    });
  }

  /* experience timeline: line draws as you scroll, entries light up */
  const tl = root.querySelector<HTMLElement>(".tl"), draw = root.querySelector<HTMLElement>(".tl .draw");
  const tlScroll = () => {
    if (!tl || !draw) return;
    const r = tl.getBoundingClientRect();
    draw.style.height = `${clamp((innerHeight * 0.75 - r.top) / r.height) * 100}%`;
  };
  on(window, "scroll", tlScroll, { passive: true });
  tlScroll();
  ctx.add(() => {
    $<HTMLElement>(".tl > li").forEach((it) => ScrollTrigger.create({ trigger: it, start: "top 62%", end: "bottom 38%", toggleClass: { targets: it, className: "lit" } }));
  });

  /* ---------- reveals ---------- */
  if (!reduced) {
    ctx.add(() => {
      // long text lights up word by word as you read
      $<HTMLElement>(".lit-text").forEach((p) => {
        gsap.fromTo(p.querySelectorAll(".rw"), { opacity: 0.18 }, { opacity: 1, ease: "none", stagger: 0.04, scrollTrigger: { trigger: p, start: "top 85%", end: "bottom 55%", scrub: 0.4 } });
      });
      // each band: heading, then cards, staggered in with a blur
      $<HTMLElement>(".band, .how, .ring-sec").forEach((band) => {
        const head = band.querySelectorAll(".sec-head > *, .how-head");
        const els = band.querySelectorAll(".card:not(.tile .card), .tl > li, .chips span, .ladder-cap");
        const t = gsap.timeline({ scrollTrigger: { trigger: band, start: "top 78%", once: true } });
        if (head.length) t.from(head, { y: 28, opacity: 0, duration: 0.8, ease: "power4.out", stagger: 0.09 });
        if (els.length) t.from(els, { y: 30, opacity: 0, filter: "blur(6px)", duration: 0.85, ease: "power4.out", stagger: 0.05, clearProps: "filter,opacity" }, "-=.5");
        const pills = band.querySelectorAll(".tag");
        if (pills.length) t.from(pills, { y: 14, opacity: 0, scale: 0.92, duration: 0.6, ease: "power4.out", stagger: 0.015, clearProps: "opacity,scale" }, "-=.6");
      });
      // photo drifts
      $<HTMLElement>(".ph img").forEach((img) => gsap.fromTo(img, { yPercent: -6 }, { yPercent: 0, ease: "none", scrollTrigger: { trigger: img.parentElement, start: "top bottom", end: "bottom top", scrub: true } }));
      // contact title letters drop in
      gsap.from(".contact h2 .ltr", { yPercent: 100, opacity: 0, rotate: 8, duration: 0.9, ease: "back.out(1.6)", stagger: 0.04, scrollTrigger: { trigger: ".contact", start: "top 70%", once: true } });
      // countries counter
      $<HTMLElement>(".count").forEach((el) => {
        const v = Number(el.dataset.v) || 0, o = { n: 0 };
        gsap.to(o, { n: v, duration: 1.6, ease: "power3.out", scrollTrigger: { trigger: el, start: "top 85%", once: true }, onUpdate: () => (el.textContent = String(Math.round(o.n))) });
      });
    });
  }
  // safety: anything a trigger missed becomes visible
  const safety = setTimeout(() => ScrollTrigger.refresh(), 1500);
  kills.push(() => clearTimeout(safety));

  /* ---------- career ring (Dark Portfolio ribbon) ---------- */
  const ribbon = root.querySelector<HTMLElement>(".ribbon");
  const spinner = root.querySelector<HTMLElement>(".ribbon .spinner");
  const tiles = $<HTMLElement>(".ribbon .tile");
  if (ribbon && spinner && tiles.length) {
    const N = tiles.length, step = 360 / N, TW = 640;
    let rot = 0, gap = 5, s = 1, visible = true, dragging = false, inertia = 0;
    const t0 = performance.now();
    const fit = () => {
      const W = ribbon.clientWidth, H = ribbon.clientHeight;
      s = innerWidth > 1023 ? Math.min(W / 1440, H / 700) * 1.25 : Math.min((H - 40) / 400, (W - 40) / 640, 1) * 1.7;
    };
    fit();
    on(window, "resize", fit);
    const place = () => {
      const R = (TW + gap) / (2 * Math.sin(((step / 2) * Math.PI) / 180));
      tiles.forEach((t, i) => (t.style.transform = `translate(-50%,-50%) rotateY(${i * step}deg) translateZ(${-R}px)`));
      spinner.style.transform = `translateZ(-470px) scale(${s}) rotateY(${rot}deg)`;
    };
    let last = performance.now(), raf = 0;
    const loop = (now: number) => {
      raf = requestAnimationFrame(loop);
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      if (!visible) return;
      const o = reduced ? 1 : 1 - Math.pow(1 - clamp((now - t0) / 3000), 3);
      gap = 500 + (5 - 500) * o;
      if (!dragging) {
        if (Math.abs(inertia) > 0.1) {
          rot -= inertia * 0.016;
          inertia *= 0.95;
        } else if (!reduced) rot += (100 + (5 - 100) * o) * dt;
      }
      place();
    };
    raf = requestAnimationFrame(loop);
    kills.push(() => cancelAnimationFrame(raf));
    const io = new IntersectionObserver(([e]) => (visible = e.isIntersecting), { threshold: 0 });
    io.observe(ribbon);
    kills.push(() => io.disconnect());

    let sx = 0, sr = 0, lx = 0, lt = 0, vel = 0, moved = 0, target: number | null = null;
    // 3D hit-testing returns the perspective wrapper, so find the front-facing card whose projected box holds the point
    const pick = (x: number, y: number) => {
      let best: number | null = null, bz = -2;
      tiles.forEach((t, i) => {
        const facing = Math.cos(((i * step + rot) * Math.PI) / 180);
        if (facing < 0.15) return;
        const r = t.getBoundingClientRect();
        if (x < r.left || x > r.right || y < r.top || y > r.bottom) return;
        if (facing > bz) { bz = facing; best = Number(t.querySelector<HTMLElement>("[data-open]")?.dataset.open ?? i); }
      });
      return best;
    };
    on(ribbon, "pointerdown", ((e: PointerEvent) => {
      dragging = true;
      inertia = 0;
      sx = lx = e.clientX;
      sr = rot;
      lt = performance.now();
      moved = 0;
      vel = 0;
      target = pick(e.clientX, e.clientY);
      ribbon.setPointerCapture(e.pointerId);
      ribbon.classList.add("dragging");
    }) as EventListener);
    on(ribbon, "pointermove", ((e: PointerEvent) => {
      if (!dragging) return;
      const now = performance.now();
      moved = Math.max(moved, Math.abs(e.clientX - sx));
      rot = sr - ((e.clientX - sx) * 0.35) / Math.max(s, 0.3);
      vel = (e.clientX - lx) / Math.max(1, now - lt);
      lx = e.clientX;
      lt = now;
    }) as EventListener);
    const up = (e: Event) => {
      if (!dragging) return;
      dragging = false;
      ribbon.classList.remove("dragging");
      try { ribbon.releasePointerCapture((e as PointerEvent).pointerId); } catch {}
      if (moved < 6 && target !== null) opts.onTile(target);
      else if (Math.abs(vel) > 0.01) inertia = vel * 200;
    };
    on(ribbon, "pointerup", up);
    on(ribbon, "pointercancel", up);
    // keyboard: the cards are buttons, so Enter opens them
    tiles.forEach((t) => {
      const b = t.querySelector<HTMLButtonElement>("[data-open]");
      if (b) on(b, "keydown", ((e: KeyboardEvent) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); opts.onTile(Number(b.dataset.open)); } }) as EventListener);
    });
  }

  /* ---------- arch: sticky scale-down + stats slide in and count ---------- */
  const archSec = root.querySelector<HTMLElement>(".arch-sec");
  if (archSec) {
    const frame = archSec.querySelector<HTMLElement>(".arch-frame")!;
    const bg = archSec.querySelector<HTMLElement>(".arch-bg")!;
    const stats = Array.from(archSec.querySelectorAll<HTMLElement>(".stat"));
    const leads = Array.from(archSec.querySelectorAll<SVGGElement>(".lead"));
    const ranges = [[0.3, 1.07], [0.462, 1.122], [0.683, 1.233], [0.8, 1.233]];
    const from = [-200, -200, 200, 200];
    const posD = [[102, 170], [102, 582], [1102, 168], [1102, 588]];
    const posM = [[18, 548], [205, 548], [18, 664], [205, 664]];
    const done = [false, false, false, false];
    const fmt = (el: HTMLElement, v: number) => (el.querySelector(".n")!.textContent = `${el.dataset.pre ?? ""}${v}${el.dataset.suf ?? ""}`);
    const layout = () => {
      const mob = innerWidth <= 1023;
      const k = mob ? Math.min(innerWidth / 390, innerHeight / 780) : Math.min(innerWidth / 1440, innerHeight / 900);
      frame.style.transform = `translate(-50%,-50%) scale(${k})`;
      stats.forEach((st, i) => {
        const [x, y] = (mob ? posM : posD)[i] ?? [0, 0];
        st.style.left = x + "px";
        st.style.top = y + "px";
      });
    };
    const P = (a: number, b: number) => {
      const y = window.scrollY, top = archSec.offsetTop, vh = innerHeight;
      return clamp((y - top - a * vh) / ((b - a) * vh));
    };
    const count = (st: HTMLElement) => {
      const v = Number(st.dataset.v) || 0, t1 = performance.now();
      const f = (n: number) => {
        const q = clamp((n - t1) / 1600);
        fmt(st, Math.round(v * (1 - Math.pow(1 - q, 3))));
        if (q < 1) requestAnimationFrame(f);
      };
      requestAnimationFrame(f);
    };
    let pending = false;
    const run = () => {
      pending = false;
      if (reduced) {
        bg.style.transform = "scale(1)";
        stats.forEach((st) => (st.style.opacity = "1"));
        return;
      }
      bg.style.transform = `scale(${10 + (1 - 10) * P(0.133, 1.233)})`;
      stats.forEach((st, i) => {
        const [a, b] = ranges[i] ?? [0.3, 1];
        const q = P(a, b);
        st.style.opacity = String(q);
        st.style.transform = `translate(${from[i] * (1 - q)}px, ${200 * (1 - q)}px)`;
        if (leads[i]) leads[i].style.opacity = String(Math.max(0, (q - 0.6) / 0.4));
        if (q > 0.85 && !done[i]) {
          done[i] = true;
          count(st);
        } else if (!done[i]) fmt(st, 0);
      });
    };
    const req = () => {
      if (!pending) {
        pending = true;
        requestAnimationFrame(run);
      }
    };
    layout();
    run();
    on(window, "scroll", req, { passive: true });
    on(window, "resize", () => { layout(); req(); });
  }

  /* ---------- how I work: parallax + appear + play panels only in view ---------- */
  const steps = $<HTMLElement>(".step");
  const stepIO = new IntersectionObserver((es) => es.forEach((e) => e.isIntersecting && e.target.classList.add("in")), { threshold: 0.5 });
  const playIO = new IntersectionObserver((es) => es.forEach((e) => e.target.classList.toggle("play", e.isIntersecting)), { threshold: 0 });
  steps.forEach((s) => {
    stepIO.observe(s);
    const m = s.querySelector(".media");
    if (m) playIO.observe(m);
  });
  kills.push(() => { stepIO.disconnect(); playIO.disconnect(); });
  if (!reduced) {
    const par = () => {
      const A = innerWidth <= 1023 ? 24 : 40 * (Math.min(innerWidth, 1680) / 1440);
      steps.forEach((s) => {
        const top = s.getBoundingClientRect().top + window.scrollY;
        const start = top - 0.1 * innerHeight - innerHeight;
        const q = clamp((window.scrollY - start) / (2 * innerHeight));
        const m = s.querySelector<HTMLElement>(".media");
        if (m) m.style.transform = `translateY(${(q - 0.5) * 2 * A}px)`;
      });
    };
    on(window, "scroll", par, { passive: true });
    par();
  }

  const refresh = () => ScrollTrigger.refresh();
  on(window, "load", refresh);
  document.fonts?.ready.then(refresh);

  return () => {
    kills.forEach((k) => k());
    ctx.revert();
    ScrollTrigger.getAll().forEach((t) => t.kill());
  };
}
