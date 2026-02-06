/**
 * Welcome Email Template
 *
 * Sent immediately after a new member creates an account.
 * Introduces the studio and guides them to book their first class.
 */

import {
  EmailLayout,
  EmailHeading,
  EmailText,
  EmailButton,
  EmailDivider,
  emailColors,
} from "../EmailLayout";

interface WelcomeEmailProps {
  // Studio info
  studioName: string;
  studioLogo?: string;
  studioAddress: string;
  // Member info
  memberName: string;
  // Links
  browseClassesLink: string;
  introOfferLink?: string;
  completeProfileLink: string;
  // Intro offer
  introOffer?: {
    title: string;
    description: string;
    expiresIn: string;
  };
}

export function WelcomeEmail({
  studioName,
  studioLogo,
  studioAddress,
  memberName,
  browseClassesLink,
  introOfferLink,
  completeProfileLink,
  introOffer,
}: WelcomeEmailProps) {
  return (
    <EmailLayout
      studioName={studioName}
      studioLogo={studioLogo}
      studioAddress={studioAddress}
      previewText={`Welcome to ${studioName} - Let's find your first class`}
    >
      {/* Welcome badge */}
      <table width="100%" cellPadding="0" cellSpacing="0">
        <tr>
          <td align="center" style={{ paddingBottom: "16px" }}>
            <div
              style={{
                display: "inline-block",
                width: "56px",
                height: "56px",
                backgroundColor: `${emailColors.accent.peach}66`,
                borderRadius: "50%",
                textAlign: "center" as const,
                lineHeight: "56px",
                fontSize: "28px",
              }}
            >
              {/* Wave emoji */}
              &#x1F44B;
            </div>
          </td>
        </tr>
      </table>

      <EmailHeading as="h1">Welcome, {memberName}!</EmailHeading>

      <EmailText>
        We're excited to have you join our community. Your account is all set up
        and ready for your first class.
      </EmailText>

      {/* Intro offer card (if applicable) */}
      {introOffer && (
        <table
          width="100%"
          cellPadding="0"
          cellSpacing="0"
          style={{
            backgroundColor: `${emailColors.primary}15`,
            borderRadius: "12px",
            marginBottom: "24px",
            border: `2px solid ${emailColors.primary}`,
          }}
        >
          <tr>
            <td style={{ padding: "20px" }}>
              <EmailHeading as="h2">{introOffer.title}</EmailHeading>
              <EmailText>{introOffer.description}</EmailText>
              <EmailText small muted>
                Offer expires in {introOffer.expiresIn}
              </EmailText>
              {introOfferLink && (
                <EmailButton href={introOfferLink}>Claim Offer</EmailButton>
              )}
            </td>
          </tr>
        </table>
      )}

      {/* Main CTA */}
      <EmailButton href={browseClassesLink}>Browse Classes</EmailButton>

      <EmailDivider />

      {/* Getting started tips */}
      <EmailHeading as="h3">Getting Started</EmailHeading>

      <table width="100%" cellPadding="0" cellSpacing="0">
        <tr>
          <td style={{ padding: "8px 0" }}>
            <table width="100%" cellPadding="0" cellSpacing="0">
              <tr>
                <td
                  width="32"
                  style={{
                    verticalAlign: "top",
                    paddingRight: "12px",
                  }}
                >
                  <div
                    style={{
                      width: "24px",
                      height: "24px",
                      borderRadius: "50%",
                      backgroundColor: emailColors.accent.sage,
                      textAlign: "center" as const,
                      lineHeight: "24px",
                      fontSize: "12px",
                      fontWeight: "600",
                      color: "#FFFFFF",
                    }}
                  >
                    1
                  </div>
                </td>
                <td>
                  <strong>Complete your profile</strong>
                  <br />
                  <span style={{ color: emailColors.muted, fontSize: "14px" }}>
                    Add your preferences so we can personalize recommendations
                  </span>
                </td>
              </tr>
            </table>
          </td>
        </tr>
        <tr>
          <td style={{ padding: "8px 0" }}>
            <table width="100%" cellPadding="0" cellSpacing="0">
              <tr>
                <td
                  width="32"
                  style={{
                    verticalAlign: "top",
                    paddingRight: "12px",
                  }}
                >
                  <div
                    style={{
                      width: "24px",
                      height: "24px",
                      borderRadius: "50%",
                      backgroundColor: emailColors.accent.sage,
                      textAlign: "center" as const,
                      lineHeight: "24px",
                      fontSize: "12px",
                      fontWeight: "600",
                      color: "#FFFFFF",
                    }}
                  >
                    2
                  </div>
                </td>
                <td>
                  <strong>Book your first class</strong>
                  <br />
                  <span style={{ color: emailColors.muted, fontSize: "14px" }}>
                    Browse our schedule and find a class that fits your level
                  </span>
                </td>
              </tr>
            </table>
          </td>
        </tr>
        <tr>
          <td style={{ padding: "8px 0" }}>
            <table width="100%" cellPadding="0" cellSpacing="0">
              <tr>
                <td
                  width="32"
                  style={{
                    verticalAlign: "top",
                    paddingRight: "12px",
                  }}
                >
                  <div
                    style={{
                      width: "24px",
                      height: "24px",
                      borderRadius: "50%",
                      backgroundColor: emailColors.accent.sage,
                      textAlign: "center" as const,
                      lineHeight: "24px",
                      fontSize: "12px",
                      fontWeight: "600",
                      color: "#FFFFFF",
                    }}
                  >
                    3
                  </div>
                </td>
                <td>
                  <strong>Arrive early</strong>
                  <br />
                  <span style={{ color: emailColors.muted, fontSize: "14px" }}>
                    Come 15 minutes early for check-in on your first visit
                  </span>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>

      <EmailDivider />

      <EmailText small muted>
        Questions? Reply to this email or visit our{" "}
        <a href="#" style={{ color: emailColors.primary }}>
          FAQ page
        </a>
        . We're here to help you get started.
      </EmailText>
    </EmailLayout>
  );
}

// Example usage data for preview/testing
export const welcomeEmailExample: WelcomeEmailProps = {
  studioName: "Lotus Flow Studio",
  studioAddress: "123 Yoga Lane, San Francisco, CA 94102",
  memberName: "Sarah",
  browseClassesLink: "#",
  completeProfileLink: "#",
  introOfferLink: "#",
  introOffer: {
    title: "New Member Special",
    description:
      "Enjoy your first week of unlimited classes for just $30. No commitment, just yoga.",
    expiresIn: "7 days",
  },
};
