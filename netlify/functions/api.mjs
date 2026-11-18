// Joey portfolio API: public content + contact form, and the password-protected CMS.
// Env: DATABASE_URL, ADMIN_PASSWORD, SESSION_SECRET
import { neon } from "@neondatabase/serverless";
import { createHash, createHmac, timingSafeEqual } from "node:crypto";

export const config = { path: "/api/*" };

const sql = neon(process.env.DATABASE_URL);
const SECRET = process.env.SESSION_SECRET || "";
const COOKIE = "jc_session";
const DAY = 86400;

const json = (body, status = 200, headers = {}) =>
  new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json", "cache-control": "no-store", ...headers } });

const sign = (v) => createHmac("sha256", SECRET).update(v).digest("base64url");
const safeEq = (a, b) => {
  const x = Buffer.from(String(a)), y = Buffer.from(String(b));
  return x.length === y.length && timingSafeEqual(x, y);
};
const ipHash = (req, ctx) => createHash("sha256").update((ctx?.ip || req.headers.get("x-nf-client-connection-ip") || "0") + SECRET).digest("hex").slice(0, 32);

function session(req) {
  const m = (req.headers.get("cookie") || "").match(new RegExp(`${COOKIE}=([^;]+)`));
  if (!m) return false;
  const [exp, sig] = decodeURIComponent(m[1]).split(".");
  return !!exp && !!sig && safeEq(sig, sign(exp)) && Number(exp) > Date.now() / 1000;
}

// same-origin + custom header on every state-changing admin call (CSRF)
function sameOrigin(req) {
  if (req.headers.get("x-cms") !== "1") return false;
  const origin = req.headers.get("origin");
  if (!origin) return true;
  try {
    return new URL(origin).host === new URL(req.url).host;
  } catch {
    return false;
  }
}

async function throttle(key, max, windowSec) {
  const rows = await sql`
    insert into jc_throttle (key, hits, window_start) values (${key}, 1, now())
    on conflict (key) do update set
      hits = case when jc_throttle.window_start < now() - make_interval(secs => ${windowSec}) then 1 else jc_throttle.hits + 1 end,
      window_start = case when jc_throttle.window_start < now() - make_interval(secs => ${windowSec}) then now() else jc_throttle.window_start end
    returning hits`;
  return rows[0].hits <= max;
}

const clean = (v, n) => String(v ?? "").replace(/\s+/g, " ").trim().slice(0, n);

export default async (req, ctx) => {
  const url = new URL(req.url);
  const route = url.pathname.replace(/^.*\/api\//, "").replace(/\/$/, "");
  const method = req.method;

  try {
    /* ---------- public ---------- */
    if (route === "content" && method === "GET") {
      const rows = await sql`select data, updated_at from jc_content where id = 'site'`;
      return json({ data: rows[0]?.data ?? null, updatedAt: rows[0]?.updated_at ?? null });
    }

    if (route === "contact" && method === "POST") {
      const b = await req.json().catch(() => ({}));
      if (b.company) return json({ ok: true }); // honeypot
      const name = clean(b.name, 120), email = clean(b.email, 200), topic = clean(b.topic, 80), message = String(b.message ?? "").trim().slice(0, 4000);
      if (!name || !message || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return json({ error: "Please fill in your name, a valid email and a message." }, 400);
      const ip = ipHash(req, ctx);
      if (!(await throttle(`contact:${ip}`, 5, 3600))) return json({ error: "Too many messages from here. Try again in an hour." }, 429);
      await sql`insert into jc_messages (name, email, topic, message, ip_hash) values (${name}, ${email}, ${topic}, ${message}, ${ip})`;
      return json({ ok: true });
    }

    /* ---------- CMS auth ---------- */
    if (route === "login" && method === "POST") {
      if (!sameOrigin(req)) return json({ error: "Bad origin" }, 403);
      const ip = ipHash(req, ctx);
      if (!(await throttle(`login:${ip}`, 8, 900))) return json({ error: "Too many attempts. Wait 15 minutes." }, 429);
      const { password } = await req.json().catch(() => ({}));
      if (!process.env.ADMIN_PASSWORD || !safeEq(createHash("sha256").update(String(password ?? "")).digest("hex"), createHash("sha256").update(process.env.ADMIN_PASSWORD).digest("hex")))
        return json({ error: "Wrong password" }, 401);
      const exp = String(Math.floor(Date.now() / 1000) + 7 * DAY);
      return json({ ok: true }, 200, { "set-cookie": `${COOKIE}=${encodeURIComponent(`${exp}.${sign(exp)}`)}; Path=/api; HttpOnly; Secure; SameSite=Strict; Max-Age=${7 * DAY}` });
    }
    if (route === "logout" && method === "POST") return json({ ok: true }, 200, { "set-cookie": `${COOKIE}=; Path=/api; HttpOnly; Secure; SameSite=Strict; Max-Age=0` });
    if (route === "me" && method === "GET") return json({ authed: session(req) });

    /* ---------- CMS (signed in) ---------- */
    if (!session(req)) return json({ error: "Sign in first" }, 401);
    if (method !== "GET" && !sameOrigin(req)) return json({ error: "Bad origin" }, 403);

    if (route === "content" && method === "PUT") {
      const text = await req.text();
      if (text.length > 900_000) return json({ error: "Content too large (keep photos under ~500 KB)" }, 413);
      let data;
      try {
        data = JSON.parse(text).data;
      } catch {
        return json({ error: "Invalid JSON" }, 400);
      }
      if (!data || typeof data !== "object" || !data.profile) return json({ error: "Missing profile" }, 400);
      const prev = await sql`select data from jc_content where id = 'site'`;
      if (prev[0]) {
        await sql`insert into jc_content_history (data) values (${JSON.stringify(prev[0].data)}::jsonb)`;
        await sql`delete from jc_content_history where id not in (select id from jc_content_history order by id desc limit 30)`;
      }
      const rows = await sql`insert into jc_content (id, data, updated_by) values ('site', ${JSON.stringify(data)}::jsonb, 'cms')
        on conflict (id) do update set data = excluded.data, updated_at = now(), updated_by = 'cms' returning updated_at`;
      return json({ ok: true, updatedAt: rows[0].updated_at });
    }

    if (route === "history" && method === "GET") {
      return json({ items: await sql`select id, saved_at from jc_content_history order by id desc limit 30` });
    }
    if (route.startsWith("history/") && method === "GET") {
      const rows = await sql`select data from jc_content_history where id = ${Number(route.split("/")[1]) || 0}`;
      return rows[0] ? json({ data: rows[0].data }) : json({ error: "Not found" }, 404);
    }

    if (route === "messages" && method === "GET") {
      return json({ items: await sql`select id, name, email, topic, message, read, created_at from jc_messages order by created_at desc limit 200` });
    }
    if (route.startsWith("messages/")) {
      const id = Number(route.split("/")[1]) || 0;
      if (method === "PATCH") {
        const { read } = await req.json().catch(() => ({}));
        await sql`update jc_messages set read = ${!!read} where id = ${id}`;
        return json({ ok: true });
      }
      if (method === "DELETE") {
        await sql`delete from jc_messages where id = ${id}`;
        return json({ ok: true });
      }
    }

    return json({ error: "Not found" }, 404);
  } catch (e) {
    console.error(e);
    return json({ error: "Server error" }, 500);
  }
};
