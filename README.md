# Joey Concepcion · Portfolio

One-page portfolio for Joseph (Joey) Mandado Concepcion: IT professional, Digital Channel Lead and IT mentor.

- **Design:** MotionSites "Bold Portfolio Hero" (hero) + "Dark Portfolio" (3D career ring, arch scrub, zig-zag "How I work"), recoloured to Joey's olive/sage/ochre brand with Fraunces + Inter + Anton.
- **Motion:** Lenis smooth scroll, GSAP (letter-jump headings, rolling nav letters, word-by-word reading highlight, blur reveals, tilt cards), draggable 3D ring with inertia, sticky arch scrub with counters.
- **CMS:** `/admin/` — password sign-in, edit every section, photo upload, version history, contact-form inbox.
- **Backend:** Netlify Function `netlify/functions/api.mjs` + Neon Postgres (`jc_*` tables, `db/schema.sql`).

## Develop

```bash
npm install
cp .env.example .env.local   # DATABASE_URL, ADMIN_PASSWORD, SESSION_SECRET
node scripts/db-apply.mjs    # create tables, seed content/site.json if empty
netlify dev --port 3136 --target-port 3135 --command "npx next dev -p 3135"
```

## Deploy

```bash
npm run build
netlify deploy --prod --dir=out
```

Content in `content/site.json` is the bundled fallback; the live page loads the latest CMS copy from `/api/content`.
