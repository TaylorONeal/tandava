import { spawn } from "node:child_process";

export const DISPOSABLE_MARKER = "tandava-stripe-smoke-disposable";

/** Reject remote targets and libpq connection overrides before any network activity. */
export function assertLocalTargets(env) {
  const http = /^http:\/\/(127\.0\.0\.1|localhost|\[::1\])(?::[0-9]+)?\/?$/;
  const database = /^postgres(?:ql)?:\/\/(?:[^\/@?#]+@)?(127\.0\.0\.1|localhost|\[::1\])(?::[0-9]+)?\/[A-Za-z0-9_]+$/;
  if (!http.test(env.SUPABASE_URL ?? "") || !database.test(env.SMOKE_DATABASE_URL ?? "")) {
    throw new Error("Stripe smoke requires disposable local Supabase HTTP and SMOKE_DATABASE_URL targets; hosted targets are refused.");
  }
  if (env.PGSERVICE || env.PGSERVICEFILE || env.PGHOSTADDR || env.PGHOST) {
    throw new Error("Stripe smoke refuses libpq host/service overrides.");
  }
}

// These operations exist only in the test runner, never as runtime RPCs/grants.
const queries = {
  preflight: `SELECT jsonb_build_object(
    'disposable', shobj_description(oid, 'pg_database') = '${DISPOSABLE_MARKER}',
    'scoped', NOT has_table_privilege('service_role', 'public.transactions', 'SELECT,INSERT,UPDATE,DELETE')
      AND NOT has_table_privilege('service_role', 'public.class_packs', 'SELECT,INSERT,UPDATE,DELETE')
  ) FROM pg_database WHERE datname = current_database();`,
  transactions: `WITH args AS (SELECT :'payload'::jsonb AS v)
    SELECT coalesce(jsonb_agg(to_jsonb(t) ORDER BY t.id), '[]'::jsonb)
    FROM public.transactions t, args WHERE
      (v->>'id' IS NULL OR t.id = (v->>'id')::uuid) AND
      (v->>'sessionId' IS NULL OR t.stripe_checkout_session_id = v->>'sessionId') AND
      (v->>'profileId' IS NULL OR t.profile_id = (v->>'profileId')::uuid);`,
  packs: `WITH args AS (SELECT :'payload'::jsonb AS v)
    SELECT coalesce(jsonb_agg(to_jsonb(p) ORDER BY p.id), '[]'::jsonb)
    FROM public.class_packs p, args WHERE
      (v->>'id' IS NULL OR p.id = (v->>'id')::uuid) AND
      (v->>'paymentIntentId' IS NULL OR p.stripe_payment_intent_id = v->>'paymentIntentId');`,
  sweep: `WITH args AS (SELECT :'payload'::jsonb AS v),
    packs AS (UPDATE public.class_packs SET classes_remaining = 0, status = 'exhausted'
      WHERE profile_id = (SELECT (v->>'profileId')::uuid FROM args)
        AND (status <> 'exhausted' OR classes_remaining > 0) RETURNING id),
    txns AS (UPDATE public.transactions SET status = 'refunded', refunded_amount_cents = amount_cents
      WHERE profile_id = (SELECT (v->>'profileId')::uuid FROM args) AND status <> 'refunded' RETURNING id)
    SELECT jsonb_build_object('packs', (SELECT count(*) FROM packs), 'transactions', (SELECT count(*) FROM txns));`,
  exhaustPacks: `WITH changed AS (UPDATE public.class_packs SET classes_remaining = 0, status = 'exhausted'
    WHERE id IN (SELECT jsonb_array_elements_text(:'payload'::jsonb->'ids')::uuid) RETURNING id)
    SELECT count(*) FROM changed;`,
  refundTransactions: `WITH args AS (SELECT :'payload'::jsonb AS v),
    changed AS (UPDATE public.transactions SET status = 'refunded',
      refunded_amount_cents = (SELECT (v->>'amountCents')::integer FROM args)
      WHERE stripe_checkout_session_id = (SELECT v->>'sessionId' FROM args) RETURNING id)
    SELECT count(*) FROM changed;`,
};

function execute(databaseUrl, operation, payload) {
  return new Promise((resolve, reject) => {
    // Do not inherit libpq overrides or put a connection secret in process arguments.
    const env = Object.fromEntries(Object.entries(process.env).filter(([key]) => !key.startsWith("PG")));
    const connection = new URL(databaseUrl);
    Object.assign(env, {
      PGHOST: connection.hostname.replace(/^\[|\]$/g, ""), PGPORT: connection.port || "5432",
      PGDATABASE: connection.pathname.slice(1), PGCONNECT_TIMEOUT: "5", PGAPPNAME: "tandava-stripe-smoke",
    });
    if (connection.username) env.PGUSER = decodeURIComponent(connection.username);
    if (connection.password) env.PGPASSWORD = decodeURIComponent(connection.password);
    const child = spawn("psql", ["-X", "-qAt", "-v", "ON_ERROR_STOP=1", "-v", `payload=${JSON.stringify(payload)}`], {
      env, stdio: ["pipe", "pipe", "pipe"], timeout: 20_000,
    });
    let output = "";
    child.stdout.on("data", (data) => { output += data; });
    // Do not echo DB connection details, private rows or SQL into public CI logs.
    child.stderr.resume();
    child.on("error", () => reject(new Error(`Local smoke database ${operation} could not start (psql required).`)));
    child.on("close", (code) => {
      if (code !== 0) return reject(new Error(`Local smoke database ${operation} failed.`));
      try { resolve(JSON.parse(output)); }
      catch { reject(new Error(`Local smoke database ${operation} returned invalid data.`)); }
    });
    child.stdin.on("error", () => {});
    child.stdin.end(`SET statement_timeout = '15s';\n${queries[operation]}`);
  });
}

export function createLocalStore(env, { executeImpl = execute } = {}) {
  assertLocalTargets(env);
  let ready = false;
  const invoke = (operation, payload) => {
    if (!ready) throw new Error("Local smoke database must pass preflight first.");
    return executeImpl(env.SMOKE_DATABASE_URL, operation, payload);
  };
  const filtered = (operation, filters, allowed) => {
    const entries = Object.entries(filters ?? {});
    if (!entries.length || entries.some(([key, value]) => !allowed.includes(key) || typeof value !== "string" || !value)) {
      throw new Error(`Local smoke ${operation} requires explicit valid filters.`);
    }
    return invoke(operation, filters);
  };
  return {
    async preflight() {
      ready = false;
      const result = await executeImpl(env.SMOKE_DATABASE_URL, "preflight", {});
      if (result?.disposable !== true || result?.scoped !== true) {
        throw new Error(`Local smoke database needs the ${DISPOSABLE_MARKER} database comment and scoped runtime grants.`);
      }
      ready = true;
    },
    transactions: (filters) => filtered("transactions", filters, ["id", "sessionId", "profileId"]),
    packs: (filters) => filtered("packs", filters, ["id", "paymentIntentId"]),
    sweep: (profileId) => filtered("sweep", { profileId }, ["profileId"]),
    exhaustPacks(ids) {
      if (!Array.isArray(ids) || !ids.length || ids.some((id) => typeof id !== "string" || !id)) throw new Error("Pack IDs required.");
      return invoke("exhaustPacks", { ids });
    },
    refundTransactions(sessionId, amountCents) {
      if (!/^cs_test_[A-Za-z0-9]+$/.test(sessionId) || !Number.isSafeInteger(amountCents) || amountCents < 0) throw new Error("Test session and refund amount required.");
      return invoke("refundTransactions", { sessionId, amountCents });
    },
  };
}
