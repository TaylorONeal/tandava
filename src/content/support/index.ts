/**
 * /support: the Support URL for the Tandava Studio App Store listing.
 * Plain answers to what staff ask at the door. Claim only what the app does.
 */
export interface SupportItem { q: string; a: string }

export const SUPPORT_SUMMARY = "Help for studio owners, front desk and teachers using Tandava Studio.";

export const SUPPORT_ITEMS: SupportItem[] = [
  {
    q: "How do I sign in?",
    a: "Use the email your studio invited you with. Forgot your password? Tap Forgot password on the sign-in screen and open the link in your email. Studio owners set up their studio on the web at tandavastudio.com.",
  },
  {
    q: "I'm new. How do I get in the first time?",
    a: "Your studio owner adds you by email. Open the email from Tandava, tap Accept invite and choose a password. Then open Tandava Studio and sign in with that email and password. No email? Check spam, then ask the owner to resend it.",
  },
  {
    q: "I own the studio. How do I add my staff?",
    a: "On the web at tandavastudio.com, open Manage, then Team, and tap Add team member. Enter their name, email and role. They get an invite email, choose a password and sign in to the app.",
  },
  {
    q: "The scanner won't open",
    a: "Tandava Studio needs camera access to scan passes. Turn it on in Settings > Tandava Studio > Camera on your iPhone. You can always check people in from the class roster instead.",
  },
  {
    q: "The scan says check-in isn't open",
    a: "Check-in opens 60 minutes before a class starts and closes when the class ends.",
  },
  {
    q: "The scan says the pass wasn't found",
    a: "The pass is for a booking you can't check in: another studio, or a class you don't teach. Owners, admins and front desk can check in any class at their studio. Teachers can check in the classes assigned to them.",
  },
  {
    q: "A member has no pass",
    a: "Open the class roster and tap Check in next to their name.",
  },
  {
    q: "Where does a member find their pass?",
    a: "In My Schedule, on the booked class, tap Check-in pass.",
  },
  {
    q: "Deleting your account or data",
    a: "Email us from the address on your account and we will delete or anonymize your data within 30 days, as the Privacy Policy describes.",
  },
];
