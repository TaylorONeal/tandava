/**
 * Purchase Receipt Email Template
 *
 * Sent immediately after a membership, class pack, or product purchase.
 * Serves as both confirmation and receipt for tax purposes.
 */

import {
  EmailLayout,
  EmailHeading,
  EmailText,
  EmailButton,
  EmailDivider,
  emailColors,
} from "../EmailLayout";

interface LineItem {
  name: string;
  description?: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

interface PurchaseReceiptEmailProps {
  // Studio info
  studioName: string;
  studioLogo?: string;
  studioAddress: string;
  // Member info
  memberName: string;
  memberEmail: string;
  // Transaction details
  orderId: string;
  orderDate: string;
  paymentMethod: string;
  paymentLast4?: string;
  // Line items
  items: LineItem[];
  subtotal: number;
  tax?: number;
  discount?: {
    code: string;
    amount: number;
  };
  total: number;
  // For memberships/packs
  activationDetails?: {
    startDate: string;
    endDate?: string;
    creditsIncluded?: number;
    renewalDate?: string;
    isAutoRenew?: boolean;
  };
  // Links
  viewAccountLink: string;
  browseClassesLink: string;
  manageSubscriptionLink?: string;
}

function formatCurrency(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

export function PurchaseReceiptEmail({
  studioName,
  studioLogo,
  studioAddress,
  memberName,
  memberEmail,
  orderId,
  orderDate,
  paymentMethod,
  paymentLast4,
  items,
  subtotal,
  tax,
  discount,
  total,
  activationDetails,
  viewAccountLink,
  browseClassesLink,
  manageSubscriptionLink,
}: PurchaseReceiptEmailProps) {
  return (
    <EmailLayout
      studioName={studioName}
      studioLogo={studioLogo}
      studioAddress={studioAddress}
      previewText={`Receipt for your ${studioName} purchase - Order #${orderId}`}
    >
      {/* Success indicator */}
      <table width="100%" cellPadding="0" cellSpacing="0">
        <tr>
          <td align="center" style={{ paddingBottom: "16px" }}>
            <div
              style={{
                display: "inline-block",
                width: "56px",
                height: "56px",
                backgroundColor: `${emailColors.accent.sage}33`,
                borderRadius: "50%",
                textAlign: "center" as const,
                lineHeight: "56px",
                fontSize: "28px",
              }}
            >
              &#x2713;
            </div>
          </td>
        </tr>
      </table>

      <EmailHeading as="h1">Thanks for your purchase!</EmailHeading>

      <EmailText>
        Hi {memberName}, here's your receipt. Keep this email for your records.
      </EmailText>

      {/* Order info */}
      <table
        width="100%"
        cellPadding="0"
        cellSpacing="0"
        style={{
          backgroundColor: "#F9FAFB",
          borderRadius: "12px",
          marginBottom: "24px",
        }}
      >
        <tr>
          <td style={{ padding: "16px 20px" }}>
            <table width="100%" cellPadding="0" cellSpacing="0">
              <tr>
                <td>
                  <span style={{ color: emailColors.muted, fontSize: "12px" }}>
                    ORDER NUMBER
                  </span>
                  <br />
                  <span style={{ fontWeight: "600" }}>#{orderId}</span>
                </td>
                <td style={{ textAlign: "right" as const }}>
                  <span style={{ color: emailColors.muted, fontSize: "12px" }}>
                    ORDER DATE
                  </span>
                  <br />
                  <span>{orderDate}</span>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>

      {/* Line items */}
      <table
        width="100%"
        cellPadding="0"
        cellSpacing="0"
        style={{ marginBottom: "16px" }}
      >
        <tr>
          <td
            style={{
              padding: "8px 0",
              borderBottom: `1px solid ${emailColors.border}`,
            }}
          >
            <strong>Item</strong>
          </td>
          <td
            style={{
              padding: "8px 0",
              borderBottom: `1px solid ${emailColors.border}`,
              textAlign: "right" as const,
            }}
          >
            <strong>Amount</strong>
          </td>
        </tr>
        {items.map((item, index) => (
          <tr key={index}>
            <td style={{ padding: "12px 0" }}>
              <span style={{ fontWeight: "500" }}>{item.name}</span>
              {item.description && (
                <>
                  <br />
                  <span style={{ color: emailColors.muted, fontSize: "14px" }}>
                    {item.description}
                  </span>
                </>
              )}
              {item.quantity > 1 && (
                <span style={{ color: emailColors.muted, fontSize: "14px" }}>
                  {" "}
                  x{item.quantity}
                </span>
              )}
            </td>
            <td
              style={{
                padding: "12px 0",
                textAlign: "right" as const,
                verticalAlign: "top",
              }}
            >
              {formatCurrency(item.total)}
            </td>
          </tr>
        ))}
      </table>

      {/* Totals */}
      <table
        width="100%"
        cellPadding="0"
        cellSpacing="0"
        style={{
          borderTop: `1px solid ${emailColors.border}`,
          marginBottom: "24px",
        }}
      >
        <tr>
          <td style={{ padding: "8px 0", color: emailColors.muted }}>
            Subtotal
          </td>
          <td style={{ padding: "8px 0", textAlign: "right" as const }}>
            {formatCurrency(subtotal)}
          </td>
        </tr>
        {discount && (
          <tr>
            <td style={{ padding: "8px 0", color: emailColors.primary }}>
              Discount ({discount.code})
            </td>
            <td
              style={{
                padding: "8px 0",
                textAlign: "right" as const,
                color: emailColors.primary,
              }}
            >
              -{formatCurrency(discount.amount)}
            </td>
          </tr>
        )}
        {tax !== undefined && (
          <tr>
            <td style={{ padding: "8px 0", color: emailColors.muted }}>Tax</td>
            <td style={{ padding: "8px 0", textAlign: "right" as const }}>
              {formatCurrency(tax)}
            </td>
          </tr>
        )}
        <tr>
          <td
            style={{
              padding: "12px 0",
              fontWeight: "600",
              fontSize: "18px",
              borderTop: `2px solid ${emailColors.border}`,
            }}
          >
            Total
          </td>
          <td
            style={{
              padding: "12px 0",
              textAlign: "right" as const,
              fontWeight: "600",
              fontSize: "18px",
              borderTop: `2px solid ${emailColors.border}`,
            }}
          >
            {formatCurrency(total)}
          </td>
        </tr>
      </table>

      {/* Payment method */}
      <EmailText small muted>
        Paid with {paymentMethod}
        {paymentLast4 && ` ending in ${paymentLast4}`}
      </EmailText>

      {/* Activation details for memberships/packs */}
      {activationDetails && (
        <>
          <EmailDivider />

          <EmailHeading as="h3">Your Plan Details</EmailHeading>

          <table
            width="100%"
            cellPadding="0"
            cellSpacing="0"
            style={{
              backgroundColor: `${emailColors.primary}10`,
              borderRadius: "12px",
              marginBottom: "16px",
            }}
          >
            <tr>
              <td style={{ padding: "16px 20px" }}>
                <table width="100%" cellPadding="0" cellSpacing="0">
                  <tr>
                    <td style={{ padding: "4px 0" }}>
                      <span style={{ color: emailColors.muted, fontSize: "14px" }}>
                        Start Date
                      </span>
                      <br />
                      <span style={{ fontWeight: "500" }}>
                        {activationDetails.startDate}
                      </span>
                    </td>
                  </tr>
                  {activationDetails.endDate && (
                    <tr>
                      <td style={{ padding: "4px 0" }}>
                        <span
                          style={{ color: emailColors.muted, fontSize: "14px" }}
                        >
                          Valid Until
                        </span>
                        <br />
                        <span style={{ fontWeight: "500" }}>
                          {activationDetails.endDate}
                        </span>
                      </td>
                    </tr>
                  )}
                  {activationDetails.creditsIncluded && (
                    <tr>
                      <td style={{ padding: "4px 0" }}>
                        <span
                          style={{ color: emailColors.muted, fontSize: "14px" }}
                        >
                          Classes Included
                        </span>
                        <br />
                        <span style={{ fontWeight: "500" }}>
                          {activationDetails.creditsIncluded} classes
                        </span>
                      </td>
                    </tr>
                  )}
                  {activationDetails.renewalDate && (
                    <tr>
                      <td style={{ padding: "4px 0" }}>
                        <span
                          style={{ color: emailColors.muted, fontSize: "14px" }}
                        >
                          {activationDetails.isAutoRenew
                            ? "Auto-renews on"
                            : "Expires on"}
                        </span>
                        <br />
                        <span style={{ fontWeight: "500" }}>
                          {activationDetails.renewalDate}
                        </span>
                      </td>
                    </tr>
                  )}
                </table>
              </td>
            </tr>
          </table>
        </>
      )}

      {/* Action buttons */}
      <EmailButton href={browseClassesLink}>Book a Class</EmailButton>

      {manageSubscriptionLink && (
        <EmailButton href={manageSubscriptionLink} variant="secondary">
          Manage Subscription
        </EmailButton>
      )}

      <EmailDivider />

      <EmailText small muted>
        Questions about this purchase? Reply to this email or visit{" "}
        <a href={viewAccountLink} style={{ color: emailColors.primary }}>
          your account
        </a>{" "}
        for details.
      </EmailText>
    </EmailLayout>
  );
}

// Example usage data for preview/testing
export const purchaseReceiptEmailExample: PurchaseReceiptEmailProps = {
  studioName: "Lotus Flow Studio",
  studioAddress: "123 Yoga Lane, San Francisco, CA 94102",
  memberName: "Sarah",
  memberEmail: "sarah@example.com",
  orderId: "TND-2024-1234",
  orderDate: "December 10, 2024",
  paymentMethod: "Visa",
  paymentLast4: "4242",
  items: [
    {
      name: "Unlimited Monthly Membership",
      description: "All classes, all locations",
      quantity: 1,
      unitPrice: 15900,
      total: 15900,
    },
  ],
  subtotal: 15900,
  tax: 1352,
  discount: {
    code: "NEWYEAR24",
    amount: 3180,
  },
  total: 14072,
  activationDetails: {
    startDate: "December 10, 2024",
    renewalDate: "January 10, 2025",
    isAutoRenew: true,
  },
  viewAccountLink: "#",
  browseClassesLink: "#",
  manageSubscriptionLink: "#",
};
