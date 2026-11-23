import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

type Row = Record<string, unknown>;
const mocks = vi.hoisted(() => ({
  handle: undefined as undefined | ((request: Request) => Promise<Response>),
  createClient: vi.fn(),
  invite: vi.fn(),
  createUser: vi.fn(),
  staff: [] as Row[],
  profiles: [] as Row[],
  writes: [] as { table: string; operation: string; values: Row }[],
}));

vi.mock("https://deno.land/std@0.168.0/http/server.ts", () => ({
  serve: (handle: (request: Request) => Promise<Response>) => { mocks.handle = handle; },
}));
vi.mock("https://esm.sh/@supabase/supabase-js@2", () => ({ createClient: mocks.createClient }));
vi.mock("https://esm.sh/stripe@14?target=deno", () => ({ default: class {} }));

function from(table: string) {
  let rows: Row[] = table === "studio_staff" ? mocks.staff : table === "profiles" ? mocks.profiles : [];
  const write = (operation: string, values: Row) => { mocks.writes.push({ table, operation, values }); return query; };
  const query = {
    select: () => query,
    eq: (key: string, value: unknown) => { rows = rows.filter((row) => row[key] === value); return query; },
    in: (key: string, values: unknown[]) => { rows = rows.filter((row) => values.includes(row[key])); return query; },
    order: () => query,
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

async function addStaff(email: string) {
  await import("../../supabase/functions/onboarding/index.ts");
  return mocks.handle!(new Request("https://edge.example/onboarding", {
    method: "POST",
    body: JSON.stringify({ step: "staff_add", data: { staff: [{ name: "Some One", email, role: "teacher" }] } }),
  }));
}

describe("adding a teammate never claims someone else's account", () => {
  beforeEach(() => {
    vi.resetModules(); vi.clearAllMocks();
    mocks.writes = [];
    mocks.staff = [{ id: "row-owner", studio_id: "studio-one", profile_id: "owner", role: "owner", is_active: true }];
    mocks.profiles = [{ id: "existing-person", email: "person@example.test" }];
    vi.stubGlobal("Deno", { env: { get: () => "test-config" } });
    mocks.createClient
      .mockReturnValueOnce({ auth: { getUser: vi.fn().mockResolvedValue({ data: { user: { id: "owner" } } }) } })
      .mockReturnValueOnce({ from, auth: { admin: { inviteUserByEmail: mocks.invite, createUser: mocks.createUser } } });
    mocks.invite.mockResolvedValue({ data: { user: { id: "new-person" } }, error: null });
  });
  afterEach(() => { vi.unstubAllGlobals(); });

  it("does not link an existing account that is not on this team", async () => {
    const response = await addStaff("person@example.test");
    expect(response.status).toBe(500);
    expect(mocks.writes.filter((w) => w.table === "studio_staff")).toEqual([]);
    expect(mocks.invite).not.toHaveBeenCalled();
  });

  it("still updates someone already on this studio's team", async () => {
    mocks.staff.push({ id: "row-2", studio_id: "studio-one", profile_id: "existing-person", role: "teacher", is_active: false });
    const response = await addStaff("person@example.test");
    expect(response.status).toBe(200);
    expect(mocks.writes.some((w) => w.table === "studio_staff" && w.operation === "upsert")).toBe(true);
  });

  it("still invites a new email", async () => {
    const response = await addStaff("new@example.test");
    expect(response.status).toBe(200);
    expect(mocks.invite).toHaveBeenCalledTimes(1);
  });
});
