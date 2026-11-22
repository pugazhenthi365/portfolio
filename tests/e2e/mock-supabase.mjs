/**
 * Minimal Supabase-compatible server for end-to-end tests (NOT for production).
 *
 * Implements just enough of GoTrue (password login, getUser, logout, refresh),
 * PostgREST (select/insert/update/delete with eq filters, order, limit, count,
 * single-object responses, rpc) and Storage (upload, list, remove, public
 * read) for this app — on top of a REAL PostgreSQL database with the real
 * migrations and RLS policies. Every request runs inside a transaction with
 * `SET LOCAL ROLE anon|authenticated` and the JWT subject, exactly like
 * PostgREST, so RLS decisions are genuine.
 *
 *   PGHOST=... PGPORT=... PGDATABASE=... node tests/e2e/mock-supabase.mjs
 */
import http from "node:http";
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import pg from "pg";

const PORT = Number(process.env.MOCK_PORT ?? 54321);
const SECRET = "e2e-test-secret-do-not-use";
const FILES = process.env.MOCK_FILES ?? "/tmp/mock-storage";
// Match PostgREST: dates/timestamps are returned as strings, not JS Date objects.
pg.types.setTypeParser(1082, (v) => v);
pg.types.setTypeParser(1114, (v) => v);
pg.types.setTypeParser(1184, (v) => new Date(v).toISOString());
const pool = new pg.Pool({ max: 8 });
fs.mkdirSync(FILES, { recursive: true });

const b64u = (b) => Buffer.from(b).toString("base64url");
function signJwt(payload) {
  const h = b64u(JSON.stringify({ alg: "HS256", typ: "JWT" }));
  const p = b64u(JSON.stringify(payload));
  const s = crypto.createHmac("sha256", SECRET).update(`${h}.${p}`).digest("base64url");
  return `${h}.${p}.${s}`;
}
function verifyJwt(token) {
  if (!token) return null;
  const [h, p, s] = token.split(".");
  if (!s) return null;
  const expected = crypto.createHmac("sha256", SECRET).update(`${h}.${p}`).digest("base64url");
  if (expected.length !== s.length || !crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(s))) return null;
  const claims = JSON.parse(Buffer.from(p, "base64url").toString());
  if (claims.exp && claims.exp < Date.now() / 1000) return null;
  return claims;
}
export const ANON_KEY = signJwt({ role: "anon", iss: "mock", exp: 4102444800 });

const send = (res, status, body, headers = {}) => {
  res.writeHead(status, { "content-type": "application/json", "access-control-allow-origin": "*", ...headers });
  res.end(body === undefined ? "" : typeof body === "string" ? body : JSON.stringify(body));
};
const ident = (s) => {
  if (!/^[a-z_][a-z0-9_]*$/.test(s)) throw Object.assign(new Error(`bad identifier ${s}`), { status: 400 });
  return `"${s}"`;
};
async function readBody(req) {
  const chunks = [];
  for await (const c of req) chunks.push(c);
  return Buffer.concat(chunks);
}

function claimsFrom(req) {
  const auth = req.headers.authorization?.replace(/^Bearer\s+/i, "");
  return verifyJwt(auth) ?? { role: "anon" };
}

async function asRole(claims, fn) {
  const client = await pool.connect();
  try {
    await client.query("begin");
    await client.query(`set local role ${claims.role === "authenticated" ? "authenticated" : "anon"}`);
    await client.query("select set_config('request.jwt.claim.sub', $1, true)", [claims.sub ?? ""]);
    const out = await fn(client);
    await client.query("commit");
    return out;
  } catch (e) {
    await client.query("rollback").catch(() => {});
    throw e;
  } finally {
    client.release();
  }
}

const sessions = new Map(); // refresh_token -> user

function makeSession(user) {
  const now = Math.floor(Date.now() / 1000);
  const access = signJwt({ sub: user.id, email: user.email, role: "authenticated", aud: "authenticated", exp: now + 3600, iat: now, session_id: crypto.randomUUID() });
  const refresh = crypto.randomBytes(16).toString("hex");
  sessions.set(refresh, user);
  return { access_token: access, token_type: "bearer", expires_in: 3600, expires_at: now + 3600, refresh_token: refresh, user };
}
const userObj = (row) => ({ id: row.id, aud: "authenticated", role: "authenticated", email: row.email, app_metadata: {}, user_metadata: {}, created_at: new Date().toISOString() });

async function handleAuth(req, res, url) {
  const p = url.pathname.replace("/auth/v1", "");
  if (p === "/token") {
    const body = JSON.parse((await readBody(req)).toString() || "{}");
    if (url.searchParams.get("grant_type") === "password") {
      const { rows } = await pool.query("select id, email, password from auth.users where email = $1", [body.email]);
      const row = rows[0];
      if (!row || row.password !== crypto.createHash("sha256").update(body.password ?? "").digest("hex")) {
        return send(res, 400, { error: "invalid_grant", error_description: "Invalid login credentials", code: "invalid_credentials" });
      }
      return send(res, 200, makeSession(userObj(row)));
    }
    if (url.searchParams.get("grant_type") === "refresh_token") {
      const user = sessions.get(body.refresh_token);
      if (!user) return send(res, 400, { error: "invalid_grant", code: "refresh_token_not_found" });
      sessions.delete(body.refresh_token);
      return send(res, 200, makeSession(user));
    }
  }
  if (p === "/user") {
    const claims = claimsFrom(req);
    if (claims.role !== "authenticated") return send(res, 401, { code: 401, msg: "invalid JWT" });
    return send(res, 200, userObj({ id: claims.sub, email: claims.email }));
  }
  if (p === "/logout") return send(res, 204);
  if (p === "/.well-known/jwks.json") return send(res, 200, { keys: [] });
  if (p === "/signup") return send(res, 422, { code: "signup_disabled", msg: "Signups not allowed for this instance" });
  return send(res, 404, { msg: "not found" });
}

function buildWhere(params, values) {
  const clauses = [];
  for (const [k, v] of params) {
    if (["select", "order", "limit", "offset", "columns", "on_conflict"].includes(k)) continue;
    const m = /^(eq|neq|gt|lt|gte|lte|is)\.(.*)$/s.exec(v);
    if (!m) throw Object.assign(new Error(`unsupported filter ${k}=${v}`), { status: 400 });
    const ops = { eq: "=", neq: "<>", gt: ">", lt: "<", gte: ">=", lte: "<=" };
    if (m[1] === "is") clauses.push(`${ident(k)} is ${m[2] === "null" ? "null" : m[2] === "true" ? "true" : "false"}`);
    else {
      values.push(m[2]);
      clauses.push(`${ident(k)}::text ${ops[m[1]]} $${values.length}::text`);
    }
  }
  return clauses.length ? ` where ${clauses.join(" and ")}` : "";
}
const selectList = (s) => (!s || s === "*" ? "*" : s.split(",").map((c) => ident(c.trim())).join(", "));

async function handleRest(req, res, url) {
  const claims = claimsFrom(req);
  const rel = url.pathname.replace("/rest/v1/", "");
  const prefer = req.headers.prefer ?? "";
  const single = (req.headers.accept ?? "").includes("vnd.pgrst.object+json");

  if (rel.startsWith("rpc/")) {
    const fn = ident(rel.slice(4));
    const { rows } = await asRole(claims, (c) => c.query(`select public.${fn}() as result`));
    return send(res, 200, rows[0].result);
  }

  const table = `public.${ident(rel)}`;
  const params = url.searchParams;
  const values = [];

  if (req.method === "GET" || req.method === "HEAD") {
    let sql = `select ${selectList(params.get("select"))} from ${table}${buildWhere(params, values)}`;
    if (params.get("order")) {
      sql += " order by " + params.get("order").split(",").map((o) => {
        const [col, dir] = o.split(".");
        return `${ident(col)} ${dir === "desc" ? "desc" : "asc"}`;
      }).join(", ");
    }
    const countSql = `select count(*)::int as n from ${table}${buildWhere(params, [])}`;
    if (params.get("limit")) sql += ` limit ${Number(params.get("limit"))}`;
    const { rows, count } = await asRole(claims, async (c) => {
      const r = await c.query(sql, values);
      const n = /count=exact/.test(prefer) ? (await c.query(countSql, values)).rows[0].n : null;
      return { rows: r.rows, count: n };
    });
    const headers = count !== null ? { "content-range": `0-${Math.max(rows.length - 1, 0)}/${count}` } : {};
    if (req.method === "HEAD") return send(res, 200, undefined, headers);
    if (single) {
      if (rows.length !== 1) return send(res, 406, { code: "PGRST116", message: "JSON object requested, multiple (or no) rows returned", details: `${rows.length} rows` });
      return send(res, 200, rows[0], headers);
    }
    return send(res, 200, rows, headers);
  }

  const returning = /return=representation/.test(prefer) ? ` returning ${selectList(params.get("select"))}` : "";

  if (req.method === "POST") {
    const body = JSON.parse((await readBody(req)).toString());
    const rowsIn = Array.isArray(body) ? body : [body];
    const out = await asRole(claims, async (c) => {
      const all = [];
      for (const row of rowsIn) {
        const cols = Object.keys(row);
        const vals = cols.map((k) => row[k]);
        const r = await c.query(`insert into ${table} (${cols.map(ident).join(", ")}) values (${cols.map((_, i) => `$${i + 1}`).join(", ")})${returning}`, vals);
        all.push(...r.rows);
      }
      return all;
    });
    if (!returning) return send(res, 201);
    return send(res, 201, single ? out[0] : out);
  }

  if (req.method === "PATCH") {
    const body = JSON.parse((await readBody(req)).toString());
    const cols = Object.keys(body);
    cols.forEach((k) => values.push(body[k]));
    const set = cols.map((k, i) => `${ident(k)} = $${i + 1}`).join(", ");
    const sql = `update ${table} set ${set}${buildWhere(params, values)}${returning}`;
    const r = await asRole(claims, (c) => c.query(sql, values));
    const headers = /count=exact/.test(prefer) ? { "content-range": `*/${r.rowCount}` } : {};
    return returning ? send(res, 200, r.rows, headers) : send(res, 204, undefined, headers);
  }

  if (req.method === "DELETE") {
    const sql = `delete from ${table}${buildWhere(params, values)}${returning}`;
    const r = await asRole(claims, (c) => c.query(sql, values));
    const headers = /count=exact/.test(prefer) ? { "content-range": `*/${r.rowCount}` } : {};
    return returning ? send(res, 200, r.rows, headers) : send(res, 204, undefined, headers);
  }
  return send(res, 405, { message: "method not allowed" });
}

async function handleStorage(req, res, url) {
  const claims = claimsFrom(req);
  const p = decodeURIComponent(url.pathname.replace("/storage/v1", ""));

  let m = /^\/object\/public\/([^/]+)\/(.+)$/.exec(p);
  if (m && req.method === "GET") {
    const { rows } = await pool.query("select public from storage.buckets where id = $1", [m[1]]);
    const file = path.join(FILES, m[1], m[2]);
    if (!rows[0]?.public || !fs.existsSync(file)) return send(res, 404, { message: "not found" });
    const meta = JSON.parse(fs.readFileSync(`${file}.meta.json`, "utf8"));
    res.writeHead(200, { "content-type": meta.mimetype });
    return fs.createReadStream(file).pipe(res);
  }

  m = /^\/object\/list\/([^/]+)$/.exec(p);
  if (m && req.method === "POST") {
    const body = JSON.parse((await readBody(req)).toString());
    const prefix = (body.prefix ?? "").replace(/\/$/, "");
    const rows = await asRole(claims, (c) =>
      c.query("select name, id::text, created_at from storage.objects where bucket_id = $1 and name like $2 order by created_at desc", [m[1], prefix ? `${prefix}/%` : "%"]),
    );
    const seen = new Map();
    for (const r of rows.rows) {
      const rest = prefix ? r.name.slice(prefix.length + 1) : r.name;
      const [head, ...tail] = rest.split("/");
      if (tail.length) {
        if (!seen.has(head)) seen.set(head, { name: head, id: null, created_at: null, metadata: null });
      } else {
        const file = path.join(FILES, m[1], r.name);
        const meta = fs.existsSync(`${file}.meta.json`) ? JSON.parse(fs.readFileSync(`${file}.meta.json`, "utf8")) : {};
        seen.set(head, { name: head, id: r.id, created_at: r.created_at, metadata: meta });
      }
    }
    return send(res, 200, [...seen.values()]);
  }

  m = /^\/object\/([^/]+)\/(.+)$/.exec(p);
  if (m && req.method === "POST") {
    const [, bucket, name] = m;
    const webReq = new Request(`http://x${url.pathname}`, { method: "POST", headers: req.headers, body: await readBody(req) });
    const form = await webReq.formData();
    const file = [...form.values()].find((v) => typeof v !== "string");
    const buf = Buffer.from(await file.arrayBuffer());
    const { rows: [b] } = await pool.query("select * from storage.buckets where id = $1", [bucket]);
    if (!b) return send(res, 400, { statusCode: "404", error: "Bucket not found", message: "Bucket not found" });
    if (b.file_size_limit && buf.length > Number(b.file_size_limit)) return send(res, 413, { statusCode: "413", error: "Payload too large", message: "The object exceeded the maximum allowed size" });
    if (b.allowed_mime_types && !b.allowed_mime_types.includes(file.type)) return send(res, 415, { statusCode: "415", error: "invalid_mime_type", message: `mime type ${file.type} is not supported` });
    try {
      await asRole(claims, (c) => c.query("insert into storage.objects (bucket_id, name, owner) values ($1, $2, $3)", [bucket, name, claims.sub ?? null]));
    } catch (e) {
      return send(res, 403, { statusCode: "403", error: "Unauthorized", message: "new row violates row-level security policy" });
    }
    const dest = path.join(FILES, bucket, name);
    fs.mkdirSync(path.dirname(dest), { recursive: true });
    fs.writeFileSync(dest, buf);
    fs.writeFileSync(`${dest}.meta.json`, JSON.stringify({ size: buf.length, mimetype: file.type }));
    return send(res, 200, { Key: `${bucket}/${name}`, Id: crypto.randomUUID() });
  }

  m = /^\/object\/([^/]+)$/.exec(p);
  if (m && req.method === "DELETE") {
    const { prefixes } = JSON.parse((await readBody(req)).toString());
    const r = await asRole(claims, (c) => c.query("delete from storage.objects where bucket_id = $1 and name = any($2) returning name", [m[1], prefixes]));
    for (const row of r.rows) {
      fs.rmSync(path.join(FILES, m[1], row.name), { force: true });
      fs.rmSync(path.join(FILES, m[1], `${row.name}.meta.json`), { force: true });
    }
    return send(res, 200, r.rows);
  }
  return send(res, 404, { message: "not found" });
}

http
  .createServer(async (req, res) => {
    const url = new URL(req.url, `http://localhost:${PORT}`);
    if (req.method === "OPTIONS") {
      res.writeHead(204, {
        "access-control-allow-origin": "*",
        "access-control-allow-headers": "*",
        "access-control-allow-methods": "GET,POST,PATCH,PUT,DELETE,HEAD,OPTIONS",
      });
      return res.end();
    }
    try {
      if (url.pathname.startsWith("/auth/v1")) return await handleAuth(req, res, url);
      if (url.pathname.startsWith("/rest/v1/")) return await handleRest(req, res, url);
      if (url.pathname.startsWith("/storage/v1")) return await handleStorage(req, res, url);
      send(res, 404, { message: "not found" });
    } catch (e) {
      const status = e.status ?? (e.code === "42501" ? (req.method === "GET" ? 401 : 403) : 400);
      send(res, status, { code: e.code ?? "PGRST000", message: e.message, details: e.detail ?? null, hint: null });
    }
  })
  .listen(PORT, () => {
    console.log(`mock supabase on http://localhost:${PORT}`);
    console.log(`ANON_KEY=${ANON_KEY}`);
  });
