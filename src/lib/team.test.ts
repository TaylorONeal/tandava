import { describe, expect, it } from "vitest";
import { assignmentNote, offboardingSummary, statusOf } from "./team";

describe("team page wording", () => {
  it("names the three statuses an owner sees", () => {
    expect(statusOf({ isActive: true, pending: true })).toBe("Invite sent");
    expect(statusOf({ isActive: true, pending: false })).toBe("Active");
    expect(statusOf({ isActive: false, pending: false })).toBe("Off");
  });

  it("shows a not-yet-assigned state for a teacher with no classes", () => {
    expect(assignmentNote({ role: "teacher", isActive: true, pending: false, upcomingClasses: 0 })).toBe("No classes assigned yet");
    expect(assignmentNote({ role: "teacher", isActive: true, pending: true, upcomingClasses: 0 })).toContain("before they sign in");
    expect(assignmentNote({ role: "teacher", isActive: true, pending: false, upcomingClasses: 1 })).toBe("1 upcoming class");
    expect(assignmentNote({ role: "front_desk", isActive: true, pending: false, upcomingClasses: 0 })).toBeNull();
    expect(assignmentNote({ role: "teacher", isActive: false, pending: false, upcomingClasses: 3 })).toBeNull();
  });

  it("tells the owner what turning someone off does, including class handover", () => {
    const lines = offboardingSummary({ name: "Devon Park", email: "d@studio.example", upcomingClasses: 3 });
    expect(lines[0]).toContain("loses access to your studio right away");
    expect(lines[1]).toContain("3 upcoming classes");
    expect(lines.join(" ")).toContain("team history");
    expect(offboardingSummary({ name: "", email: "d@studio.example", upcomingClasses: 0 })[1]).toContain("no upcoming classes");
  });
});
