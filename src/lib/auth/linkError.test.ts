import { describe, expect, it } from "vitest";
import { readAuthLinkError } from "./linkError";

describe("readAuthLinkError", () => {
  it("reads an expired link from the hash", () => {
    const e = readAuthLinkError(
      "#error=access_denied&error_code=otp_expired&error_description=Email+link+is+invalid+or+has+expired",
      "",
    );
    expect(e).toEqual({ code: "otp_expired", description: "Email link is invalid or has expired", expired: true });
  });

  it("reads an error from the query string", () => {
    expect(readAuthLinkError("", "?error=server_error&error_description=boom")?.code).toBe("server_error");
  });

  it("returns null for a normal callback", () => {
    expect(readAuthLinkError("#access_token=abc&type=signup", "?next=%2Fdiscover")).toBeNull();
  });
});
