/**
 * Class Reminder Email Template
 *
 * Sent 24 hours and/or 2 hours before a booked class.
 * Helps reduce no-shows with timely reminders.
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

interface ClassReminderEmailProps {
  // Studio info
  studioName: string;
  studioLogo?: string;
  studioAddress: string;
  // Member info
  memberName: string;
  // Class details
  title: string;
  instructor: string;
  dateTime: string;
  duration: string;
  location: string;
  isVirtual?: boolean;
  virtualLink?: string;
  // Timing
  hoursUntilClass: number;
  // Links
  calendarLink: string;
  cancelBookingLink: string;
  directionsLink?: string;
  // Policy
  cancellationDeadline: string;
}

export function ClassReminderEmail({
  studioName,
  studioLogo,
  studioAddress,
  memberName,
  title,
  instructor,
  dateTime,
  duration,
  location,
  isVirtual,
  virtualLink,
  hoursUntilClass,
  calendarLink,
  cancelBookingLink,
  directionsLink,
  cancellationDeadline,
}: ClassReminderEmailProps) {
  const urgencyMessage =
    hoursUntilClass <= 2
      ? "Starting soon!"
      : hoursUntilClass <= 24
        ? "Tomorrow"
        : "Coming up";

  return (
    <EmailLayout
      studioName={studioName}
      studioLogo={studioLogo}
      studioAddress={studioAddress}
      previewText={`Reminder: ${title} ${urgencyMessage.toLowerCase()} - ${dateTime}`}
    >
      {/* Time indicator */}
      <table width="100%" cellPadding="0" cellSpacing="0">
        <tr>
          <td align="center" style={{ paddingBottom: "16px" }}>
            <div
              style={{
                display: "inline-block",
                padding: "8px 16px",
                backgroundColor:
                  hoursUntilClass <= 2
                    ? `${emailColors.primary}20`
                    : `${emailColors.accent.lilac}40`,
                borderRadius: "9999px",
                fontSize: "14px",
                fontWeight: "600",
                color: hoursUntilClass <= 2 ? emailColors.primary : emailColors.text,
              }}
            >
              {hoursUntilClass <= 2
                ? `Starting in ${hoursUntilClass} hour${hoursUntilClass === 1 ? "" : "s"}`
                : hoursUntilClass <= 24
                  ? "Tomorrow"
                  : `In ${Math.round(hoursUntilClass / 24)} days`}
            </div>
          </td>
        </tr>
      </table>

      <EmailHeading as="h1">Class Reminder</EmailHeading>

      <EmailText>
        Hi {memberName}, just a friendly reminder about your upcoming class.
      </EmailText>

      {/* Class details card */}
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
            <EmailHeading as="h2">{title}</EmailHeading>

            <EmailInfoRow label="Instructor" value={instructor} />
            <EmailInfoRow label="Date & Time" value={dateTime} />
            <EmailInfoRow label="Duration" value={duration} />
            <EmailInfoRow
              label="Location"
              value={isVirtual ? "Virtual Class" : location}
            />
          </td>
        </tr>
      </table>

      {/* Primary action based on class type */}
      {isVirtual && virtualLink ? (
        <EmailButton href={virtualLink}>Join Virtual Class</EmailButton>
      ) : directionsLink ? (
        <EmailButton href={directionsLink}>Get Directions</EmailButton>
      ) : (
        <EmailButton href={calendarLink}>View in Calendar</EmailButton>
      )}

      <EmailDivider />

      {/* What to bring - contextual */}
      <EmailHeading as="h3">
        {isVirtual ? "Before You Join" : "What to Bring"}
      </EmailHeading>

      {isVirtual ? (
        <EmailText muted>
          Find a quiet space with room to move. Have your mat ready and test
          your camera/audio before class starts. The class link will be active 5
          minutes before start time.
        </EmailText>
      ) : (
        <EmailText muted>
          Please arrive 10-15 minutes early for check-in. Bring water, a towel,
          and wear comfortable clothing. We have mats available if you need one.
        </EmailText>
      )}

      <EmailDivider />

      {/* Cancel option */}
      <EmailText small muted>
        Can't make it? Please{" "}
        <a href={cancelBookingLink} style={{ color: emailColors.primary }}>
          cancel your booking
        </a>{" "}
        by {cancellationDeadline} to avoid any fees and free up the spot for
        others.
      </EmailText>
    </EmailLayout>
  );
}

// Example usage data for preview/testing
export const classReminderEmailExample: ClassReminderEmailProps = {
  studioName: "Lotus Flow Studio",
  studioAddress: "123 Yoga Lane, San Francisco, CA 94102",
  memberName: "Sarah",
  title: "Power Vinyasa Flow",
  instructor: "Maya Johnson",
  dateTime: "Thursday, Dec 12 at 6:00 PM",
  duration: "60 minutes",
  location: "Main Studio, Room A",
  hoursUntilClass: 24,
  calendarLink: "#",
  cancelBookingLink: "#",
  directionsLink: "#",
  cancellationDeadline: "4:00 PM today",
};
