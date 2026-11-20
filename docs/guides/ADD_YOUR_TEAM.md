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

## When someone leaves, or their job changes

**Leaving.** On the Team page tap **Turn off** next to their name. You see what will happen before you confirm:

1. They lose access to your studio right away, on the web and in the app. Being signed in does not help them: every request checks that they are still active.
2. Upcoming classes and weekly slots they were due to teach change to **No teacher set**. Open **Schedule** and pick a new teacher.
3. Their past classes, check-ins and pay history stay in your records.
4. The change is written to **Team history** with your email and the time.

**Changing jobs.** Pick the new role in the dropdown next to their name, for example Admin to Teacher. The new access applies right away and the change, with the old and new role, goes in Team history.

**Coming back.** Tap **Turn on**. They keep their old email and password. Reassign their classes in Schedule.

**What you cannot do here.** The owner cannot be turned off or have their role changed, and you cannot change your own access.

**Team history** lists every add, invite resend, role change and removal, newest first. It cannot be edited from the app.

### Offboarding checklist

- [ ] Turn them off on the Team page the day they leave
- [ ] Reassign their classes in Schedule
- [ ] Check Team history shows the removal
- [ ] Change anything they knew that Tandava does not control: door codes, shared email or music logins, the front desk tablet passcode

## Good to know

- The app has no sign-up screen. Only people you add can sign in to your studio.
- Owners set up the studio on the web. The app is for running the day: schedule, roster, check-in.

## For maintainers

The Team page and the setup step both call the `onboarding` edge function (`staff_add`, `staff_list`, `staff_history`, `staff_set_active`, `staff_set_role`, `staff_resend`). It answers only an active owner. Role and access changes are written to `audit_logs` (category `staff`) before they are applied; if the record cannot be written, nothing changes. Access is enforced by the database: `my_staff_studio_ids()` and `get_my_effective_role()` read `is_active` on every request, so a removed person's open session has no studio access. Invite emails send people to `/auth/reset-confirm?invite=1`; that URL must be in the auth provider's allowed redirect list for the public site.
