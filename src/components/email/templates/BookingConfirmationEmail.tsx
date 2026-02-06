/**
 * Booking Confirmation Email Template
 *
 * Sent immediately after a successful class/workshop/appointment booking.
 * Includes all details the member needs to attend.
 */

import {
  EmailLayout,
  EmailHeading,
  EmailText,
  EmailButton,
  EmailDivider,
  EmailInfoRow,
  emailColors,
} from "../EmailLayout";

interface BookingConfirmationEmailProps {
  // Studio info
  studioName: string;
  studioLogo?: string;
  studioAddress: string;
  // Member info
  memberName: string;
  // Booking details
  bookingType: "class" | "workshop" | "appointment";
  title: string;
  instructor: string;
  dateTime: string;
  duration: string;
  location: string;
  spotNumber?: number;
  // Links
  calendarLink: string;
  manageBookingLink: string;
  directionsLink?: string;
  // Policy
  cancellationPolicy: string;
}

export function BookingConfirmationEmail({
  studioName,
  studioLogo,
  studioAddress,
  memberName,
  bookingType,
  title,
  instructor,
  dateTime,
  duration,
  location,
  spotNumber,
  calendarLink,
  manageBookingLink,
  directionsLink,
  cancellationPolicy,
}: BookingConfirmationEmailProps) {
  const typeLabel = {
    class: "Class",
    workshop: "Workshop",
    appointment: "Appointment",
  }[bookingType];

  return (
    <EmailLayout
      studioName={studioName}
      studioLogo={studioLogo}
      studioAddress={studioAddress}
      previewText={`You're booked for ${title} on ${dateTime}`}
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
              {/* Checkmark */}
              &#x2713;
            </div>
          </td>
        </tr>
      </table>

      <EmailHeading as="h1">You're booked!</EmailHeading>

      <EmailText>
        Hi {memberName}, your {typeLabel.toLowerCase()} is confirmed. We look
        forward to seeing you.
      </EmailText>

      {/* Booking details card */}
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
          <td style={{ padding: "20px" }}>
            {/* Type badge */}
            <span
              style={{
                display: "inline-block",
                padding: "4px 12px",
                backgroundColor: emailColors.primary,
                color: "#FFFFFF",
                borderRadius: "9999px",
                fontSize: "12px",
                fontWeight: "600",
                marginBottom: "12px",
              }}
            >
              {typeLabel}
            </span>

            <EmailHeading as="h2">{title}</EmailHeading>

            <EmailInfoRow label="Instructor" value={instructor} />
            <EmailInfoRow label="Date & Time" value={dateTime} />
            <EmailInfoRow label="Duration" value={duration} />
            <EmailInfoRow label="Location" value={location} />
            {spotNumber && (
              <EmailInfoRow label="Spot Number" value={`#${spotNumber}`} />
            )}
          </td>
        </tr>
      </table>

      {/* Action buttons */}
      <EmailButton href={calendarLink}>Add to Calendar</EmailButton>

      {directionsLink && (
        <EmailButton href={directionsLink} variant="secondary">
          Get Directions
        </EmailButton>
      )}

      <EmailDivider />

      {/* What to bring section */}
      <EmailHeading as="h3">What to Bring</EmailHeading>
      <EmailText muted>
        Please arrive 10-15 minutes early for check-in. Bring water, a towel,
        and wear comfortable clothing. Mats are provided, but feel free to bring
        your own.
      </EmailText>

      <EmailDivider />

      {/* Cancellation policy */}
      <EmailText small muted>
        <strong>Cancellation Policy:</strong> {cancellationPolicy}
      </EmailText>

      <EmailText small muted>
        Need to make changes?{" "}
        <a href={manageBookingLink} style={{ color: emailColors.primary }}>
          Manage your booking
        </a>
      </EmailText>
    </EmailLayout>
  );
}

// Example usage data for preview/testing
export const bookingConfirmationEmailExample: BookingConfirmationEmailProps = {
  studioName: "Lotus Flow Studio",
  studioAddress: "123 Yoga Lane, San Francisco, CA 94102",
  memberName: "Sarah",
  bookingType: "class",
  title: "Power Vinyasa Flow",
  instructor: "Maya Johnson",
  dateTime: "Thursday, Dec 12 at 6:00 PM",
  duration: "60 minutes",
  location: "Main Studio, Room A",
  spotNumber: 12,
  calendarLink: "#",
  manageBookingLink: "#",
  directionsLink: "#",
  cancellationPolicy:
    "Free cancellation up to 2 hours before class. Late cancellations may result in a $10 fee or loss of a class credit.",
};
