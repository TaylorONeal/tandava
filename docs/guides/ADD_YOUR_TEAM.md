# Add your team

For studio owners. How teachers and front desk get into Tandava and the Tandava Studio app.

## The short version

1. On the web, open **Manage**, then **Team**, and tap **Add team member**.
2. Enter their name, email and role. Tap **Send invite**.
3. They open the email from Tandava, tap **Accept invite** and choose a password.
4. They open the **Tandava Studio** app and sign in with that email and password.

You can also add people during setup, in the **Add Your Team** step. Skipping it is fine; Team is always there.

## Roles

| Role | What they can do |
|---|---|
| Teacher | See their own classes and check in their own students |
| Front desk | Check people in at the door and look up members |
| Admin | Manage schedule, members and settings with you |
| Substitute | A teacher who can cover classes |

You stay the owner. The owner cannot be turned off from the Team page.

## What each status means

| Status | Meaning | What to do |
|---|---|---|
| Invite sent | They have not signed in yet | Ask them to check spam, or tap **Resend invite** |
| Active | They have signed in | Nothing |
| Off | You turned them off | Tap **Turn on** to bring them back |

## When something goes wrong

- **No email arrived.** Check spam, then tap **Resend invite**.
- **"This link has expired or was already used."** Invite links work once. They tap **Forgot password** on the sign-in screen, enter the invited email and choose a password from that email.
- **They already had a Tandava account.** No invite is sent. They sign in with their usual password and now see your studio.
- **Someone left.** Tap **Turn off** next to their name. They can no longer sign in to your studio. Their past classes and check-ins stay in your history.

## Good to know

- The app has no sign-up screen. Only people you add can sign in to your studio.
- Owners set up the studio on the web. The app is for running the day: schedule, roster, check-in.

## For maintainers

The Team page and the setup step both call the `onboarding` edge function (`staff_add`, `staff_list`, `staff_set_active`, `staff_resend`). It answers only an active owner. Invite emails send people to `/auth/reset-confirm?invite=1`; that URL must be in the auth provider's allowed redirect list for the public site.
