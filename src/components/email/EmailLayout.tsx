/**
 * Base Email Layout Component
 *
 * This provides the foundational structure and styling for all studio emails.
 * Designed for compatibility with email clients while maintaining brand consistency.
 *
 * Usage: Wrap email content with this layout component.
 *
 * Design principles:
 * - Clean, professional aesthetic with brand colors
 * - Mobile-responsive (single column for small screens)
 * - High contrast for accessibility
 * - Minimal imagery to ensure fast loading
 */

import { ReactNode } from "react";

interface EmailLayoutProps {
  children: ReactNode;
  previewText?: string;
  studioName?: string;
  studioLogo?: string;
  studioAddress?: string;
  unsubscribeUrl?: string;
  webViewUrl?: string;
}

// Brand colors matching the app theme
const colors = {
  primary: "#D4A72C", // Yellow/Gold
  background: "#FAFAFA",
  surface: "#FFFFFF",
  text: "#1A1A1A",
  muted: "#6B7280",
  border: "#E5E7EB",
  accent: {
    sage: "#A8B5A2",
    lilac: "#C4B7D1",
    peach: "#F5D5C8",
  },
};

export function EmailLayout({
  children,
  previewText = "",
  studioName = "Your Studio",
  studioLogo,
  studioAddress,
  unsubscribeUrl = "#",
  webViewUrl,
}: EmailLayoutProps) {
  return (
    <html>
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <meta name="color-scheme" content="light" />
        <meta name="supported-color-schemes" content="light" />
        <title>{studioName}</title>
        {/* Preview text - hidden but shows in email clients */}
        {previewText && (
          <span style={{ display: "none", maxHeight: 0, overflow: "hidden" }}>
            {previewText}
            {/* Padding to prevent other content from showing */}
            {"\u00A0".repeat(150 - previewText.length)}
          </span>
        )}
        <style>
          {`
            /* Reset styles */
            body, table, td, p, a, li {
              -webkit-text-size-adjust: 100%;
              -ms-text-size-adjust: 100%;
            }
            table, td {
              mso-table-lspace: 0pt;
              mso-table-rspace: 0pt;
            }
            img {
              -ms-interpolation-mode: bicubic;
              border: 0;
              height: auto;
              line-height: 100%;
              outline: none;
              text-decoration: none;
            }
            /* Mobile responsive */
            @media only screen and (max-width: 600px) {
              .container {
                width: 100% !important;
                padding: 16px !important;
              }
              .content {
                padding: 24px 20px !important;
              }
              .button {
                display: block !important;
                width: 100% !important;
              }
            }
          `}
        </style>
      </head>
      <body
        style={{
          margin: 0,
          padding: 0,
          backgroundColor: colors.background,
          fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
          fontSize: "16px",
          lineHeight: "1.5",
          color: colors.text,
        }}
      >
        {/* Web view link */}
        {webViewUrl && (
          <table width="100%" cellPadding="0" cellSpacing="0" style={{ backgroundColor: colors.background }}>
            <tr>
              <td align="center" style={{ padding: "12px 16px" }}>
                <a
                  href={webViewUrl}
                  style={{ fontSize: "12px", color: colors.muted, textDecoration: "underline" }}
                >
                  View in browser
                </a>
              </td>
            </tr>
          </table>
        )}

        {/* Main container */}
        <table
          className="container"
          width="100%"
          cellPadding="0"
          cellSpacing="0"
          style={{ backgroundColor: colors.background }}
        >
          <tr>
            <td align="center" style={{ padding: "20px 16px 40px" }}>
              {/* Email content area */}
              <table
                width="600"
                cellPadding="0"
                cellSpacing="0"
                style={{
                  maxWidth: "600px",
                  width: "100%",
                }}
              >
                {/* Header */}
                <tr>
                  <td
                    align="center"
                    style={{
                      padding: "24px 0",
                    }}
                  >
                    {studioLogo ? (
                      <img
                        src={studioLogo}
                        alt={studioName}
                        height="40"
                        style={{ height: "40px", width: "auto" }}
                      />
                    ) : (
                      <span
                        style={{
                          fontSize: "24px",
                          fontWeight: "bold",
                          color: colors.text,
                        }}
                      >
                        {studioName}
                      </span>
                    )}
                  </td>
                </tr>

                {/* Main content card */}
                <tr>
                  <td>
                    <table
                      className="content"
                      width="100%"
                      cellPadding="0"
                      cellSpacing="0"
                      style={{
                        backgroundColor: colors.surface,
                        borderRadius: "16px",
                        overflow: "hidden",
                      }}
                    >
                      <tr>
                        <td style={{ padding: "32px" }}>{children}</td>
                      </tr>
                    </table>
                  </td>
                </tr>

                {/* Footer */}
                <tr>
                  <td
                    align="center"
                    style={{
                      padding: "32px 16px 16px",
                      color: colors.muted,
                      fontSize: "12px",
                    }}
                  >
                    <p style={{ margin: "0 0 8px" }}>{studioName}</p>
                    {studioAddress && (
                      <p style={{ margin: "0 0 16px" }}>{studioAddress}</p>
                    )}
                    <p style={{ margin: "0" }}>
                      <a
                        href={unsubscribeUrl}
                        style={{ color: colors.muted, textDecoration: "underline" }}
                      >
                        Unsubscribe
                      </a>
                      {" • "}
                      <a
                        href="#"
                        style={{ color: colors.muted, textDecoration: "underline" }}
                      >
                        Privacy Policy
                      </a>
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
    </html>
  );
}

// Reusable email components

export function EmailHeading({
  children,
  as = "h1",
}: {
  children: ReactNode;
  as?: "h1" | "h2" | "h3";
}) {
  const sizes = { h1: "24px", h2: "20px", h3: "16px" };
  const margins = { h1: "0 0 16px", h2: "0 0 12px", h3: "0 0 8px" };

  return (
    <p
      style={{
        margin: margins[as],
        fontSize: sizes[as],
        fontWeight: "600",
        lineHeight: "1.3",
        color: colors.text,
      }}
    >
      {children}
    </p>
  );
}

export function EmailText({
  children,
  muted = false,
  small = false,
}: {
  children: ReactNode;
  muted?: boolean;
  small?: boolean;
}) {
  return (
    <p
      style={{
        margin: "0 0 16px",
        fontSize: small ? "14px" : "16px",
        lineHeight: "1.6",
        color: muted ? colors.muted : colors.text,
      }}
    >
      {children}
    </p>
  );
}

export function EmailButton({
  href,
  children,
  variant = "primary",
}: {
  href: string;
  children: ReactNode;
  variant?: "primary" | "secondary";
}) {
  const isPrimary = variant === "primary";
  return (
    <table width="100%" cellPadding="0" cellSpacing="0">
      <tr>
        <td align="center" style={{ padding: "8px 0" }}>
          <a
            href={href}
            className="button"
            style={{
              display: "inline-block",
              padding: "14px 32px",
              backgroundColor: isPrimary ? colors.primary : "transparent",
              color: isPrimary ? "#FFFFFF" : colors.text,
              border: isPrimary ? "none" : `2px solid ${colors.border}`,
              borderRadius: "8px",
              fontSize: "16px",
              fontWeight: "600",
              textDecoration: "none",
              textAlign: "center" as const,
            }}
          >
            {children}
          </a>
        </td>
      </tr>
    </table>
  );
}

export function EmailDivider() {
  return (
    <table width="100%" cellPadding="0" cellSpacing="0">
      <tr>
        <td style={{ padding: "16px 0" }}>
          <div style={{ borderTop: `1px solid ${colors.border}` }} />
        </td>
      </tr>
    </table>
  );
}

export function EmailInfoRow({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon?: string;
}) {
  return (
    <table width="100%" cellPadding="0" cellSpacing="0">
      <tr>
        <td style={{ padding: "8px 0" }}>
          <span style={{ color: colors.muted, fontSize: "14px" }}>{label}</span>
          <br />
          <span style={{ fontWeight: "500" }}>
            {icon && <span style={{ marginRight: "8px" }}>{icon}</span>}
            {value}
          </span>
        </td>
      </tr>
    </table>
  );
}

export { colors as emailColors };
