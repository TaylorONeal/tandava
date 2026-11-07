import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

type Row = Record<string, unknown>;
const mocks = vi.hoisted(() => ({
  handle: undefined as undefined | ((request: Request) => Promise<Response>),
  createClient: vi.fn(),
  retrieveAccount: vi.fn(),
  staff: [] as Row[],
  writes: [] as { table: string; values: Row }[],
}));

vi.mock("https://deno.land/std@0.168.0/http/server.ts", () => ({
  serve: (handle: (request: Request) => Promise<Response>) => { mocks.handle = handle; },
}));
vi.mock("https://esm.sh/@supabase/supabase-js@2", () => ({ createClient: mocks.createClient }));
vi.mock("https://esm.sh/stripe@14?target=deno", () => ({
  default: class { accounts = { retrieve: mocks.retrieveAccount }; },
}));

// Evaluate each handler's real lookup against staff fixtures, including all
// filters it actually supplies. Omitting an authorization predicate must fail.
function from(table: string) {
  let rows = table === "studio_staff" ? mocks.staff : table === "studios"
    ? [{ id: "studio-one", stripe_account_id: "acct_studio", stripe_onboarding_complete: true }]
    : [];
  const query = {
    select: () => query,
    eq: (key: string, value: unknown) => { rows = rows.filter((row) => row[key] === value); return query; },
    in: (key: string, values: unknown[]) => { rows = rows.filter((row) => values.includes(row[key])); return query; },
    limit: (count: number) => { rows = rows.slice(0, count); return query; },
    update: (values: Row) => { mocks.writes.push({ table, values }); return query; },
    insert: (values: Row) => { mocks.writes.push({ table, values }); return query; },
    maybeSingle: async () => ({ data: rows[0] ?? null, error: null }),
    single: async () => ({ data: rows[0] ?? null, error: null }),
    then: (resolve: (value: { data: Row[]; error: null }) => unknown) => Promise.resolve(resolve({ data: rows, error: null })),
  };
  return query;
}

const endpoints = [
  { name: "stripe-connect", body: { action: "status" }, denied: 403 },
  { name: "onboarding", body: { step: "branding", data: { primaryColor: "#000000" } }, denied: 409 },
  { name: "import-members", body: { records: [{ first_name: "Incomplete record" }] }, denied: 403 },
] as const;

async function invoke(name: string, body: unknown) {
  const modulePath = `../../supabase/functions/${name}/index.ts`;
  await import(modulePath);
  return mocks.handle!(new Request(`https://edge.example/${name}`, {
    method: "POST", body: JSON.stringify(body),
  }));
}

describe("staff access to privileged edge functions", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    mocks.writes = [];
    mocks.staff = [{ studio_id: "studio-one", profile_id: "caller", role: "owner", is_active: true }];
    vi.stubGlobal("Deno", { env: { get: () => "test-config" } });
    mocks.createClient
      .mockReturnValueOnce({ auth: { getUser: vi.fn().mockResolvedValue({ data: { user: { id: "caller" } } }) } })
      .mockReturnValueOnce({ from });
    mocks.retrieveAccount.mockResolvedValue({ details_submitted: true, charges_enabled: true });
  });

  afterEach(() => { vi.unstubAllGlobals(); });

  for (const endpoint of endpoints) {
    it(`${endpoint.name} denies inactive staff before any mutation or Stripe call`, async () => {
      mocks.staff[0].is_active = false;
      const response = await invoke(endpoint.name, endpoint.body);
      expect(response.status).toBe(endpoint.denied);
      expect(mocks.writes).toEqual([]);
      expect(mocks.retrieveAccount).not.toHaveBeenCalled();
    });

    it(`${endpoint.name} permits its existing active-owner flow`, async () => {
      const response = await invoke(endpoint.name, endpoint.body);
      expect(response.status).toBe(200);
      expect(mocks.writes.length).toBeGreaterThan(0);
    });

    it(`${endpoint.name} denies a teacher before any mutation`, async () => {
      mocks.staff[0].role = "teacher";
      const response = await invoke(endpoint.name, endpoint.body);
      expect(response.status).toBe(endpoint.denied);
      expect(mocks.writes).toEqual([]);
      expect(mocks.retrieveAccount).not.toHaveBeenCalled();
    });
  }

  it("member import cannot target another studio", async () => {
    const response = await invoke("import-members", { ...endpoints[2].body, studioId: "studio-other" });
    expect(response.status).toBe(403);
    expect(mocks.writes).toEqual([]);
  });
});
