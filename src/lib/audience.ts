/**
 * One place for the three audiences' entry points.
 * Hosted studio owners sign up with intent=studio and land in the setup wizard.
 * See docs/plans/AUDIENCES_AND_COPY.md.
 */
export type SignupIntent = "student" | "studio";

export const STUDIO_ONBOARDING_PATH = "/manage/onboarding";
export const STUDIO_SIGNUP_HREF = `/auth/register?intent=studio&next=${encodeURIComponent(STUDIO_ONBOARDING_PATH)}`;

export function parseIntent(value: string | null | undefined): SignupIntent {
  return value === "studio" ? "studio" : "student";
}
