import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

type Row = Record<string, unknown>;
const mocks = vi.hoisted(() => ({
  handle: undefined as undefined | ((request: Request) => Promise<Response>),
  createClient: vi.fn(),
  createUser: vi.fn(),
  profiles: [] as Row[],
  writes: [] as { table: string; operation: string; values: Row }[],
}));
vi.mock("https://deno.land/std@0.168.0/http/server.ts", () => ({
  serve: (handle: (request: Request) => Promise<Response>) => { mocks.handle = handle; },
}));
vi.mock("https://esm.sh/@supabase/supabase-js@2", () => ({ createClient: mocks.createClient }));

function from(table: string) {
  let rows: Row[] = table === "studio_staff"
    ? [{ studio_id: "importing-studio", profile_id: "owner", role: "owner", is_active: true }]
    : table === "profiles" ? mocks.profiles : table === "import_jobs" ? [{ id: "job" }] : [];
  const write = (operation: string, values: Row) => { mocks.writes.push({ table, operation, values }); return query; };
  const query = {
    select: () => query,
    eq: (key: string, value: unknown) => { rows = rows.filter((row) => row[key] === value); return query; },
    in: (key: string, values: unknown[]) => { rows = rows.filter((row) => values.includes(row[key])); return query; },
    limit: (count: number) => { rows = rows.slice(0, count); return query; },
    update: (values: Row) => write("update", values),
    insert: (values: Row) => write("insert", values),
    upsert: (values: Row) => write("upsert", values),
    maybeSingle: async () => ({ data: rows[0] ?? null, error: null }),
    single: async () => ({ data: rows[0] ?? null, error: null }),
    then: (resolve: (value: { data: Row[]; error: null }) => unknown) => Promise.resolve(resolve({ data: rows, error: null })),
  };
  return query;
}

async function importMember() {
  const modulePath = "../../supabase/functions/import-members/index.ts";
  await import(modulePath);
  return mocks.handle!(new Request("https://edge.example/import-members", {
    method: "POST", body: JSON.stringify({ studioId: "importing-studio", records: [{
      first_name: "Imported", last_name: "Member", email: "member@example.test", phone: "555-0100", date_of_birth: "2000-01-01",
    }] }),
  }));
}

describe("import preserves member-owned global profile data", () => {
  beforeEach(() => {
    vi.resetModules(); vi.clearAllMocks();
    mocks.writes = [];
    mocks.profiles = [{ id: "existing-member", email: "member@example.test", phone: "member-original" }];
    vi.stubGlobal("Deno", { env: { get: () => "test-config" } });
    mocks.createClient
      .mockReturnValueOnce({ auth: { getUser: vi.fn().mockResolvedValue({ data: { user: { id: "owner" } } }) } })
      .mockReturnValueOnce({ from, auth: { admin: { createUser: mocks.createUser } } });
    mocks.createUser.mockResolvedValue({ data: { user: { id: "new-member" } }, error: null });
  });
  afterEach(() => { vi.unstubAllGlobals(); });

  it("links an existing member to the importing studio without overwriting personal data", async () => {
    const response = await importMember();
    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({ success: 1, errors: [] });
    expect(mocks.writes.filter((write) => write.table === "profiles")).toEqual([]);
    expect(mocks.writes).toContainEqual({ table: "studio_members", operation: "upsert", values: {
      studio_id: "importing-studio", profile_id: "existing-member", notes: null, tags: [], source: "import",
    } });
    expect(mocks.createUser).not.toHaveBeenCalled();
  });

  it("sets imported contact fields on the new profile created by this import", async () => {
    mocks.profiles = [];
    const response = await importMember();
    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({ success: 1, errors: [] });
    expect(mocks.writes.filter((write) => write.table === "profiles")).toEqual([{
      table: "profiles", operation: "update", values: {
        phone: "555-0100", date_of_birth: "2000-01-01", pronouns: null,
        emergency_contact_name: null, emergency_contact_phone: null,
      },
    }]);
  });
});
