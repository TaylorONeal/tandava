# Email System (Developer Guide)

## Architecture

Tandava uses a **provider-agnostic email interface** that supports swapping providers without code changes.

```
┌──────────────┐     ┌─────────────────┐     ┌──────────────────┐
│ Edge Function │────▶│ sendEmail()     │────▶│ Provider Adapter  │
│ (trigger)     │     │ (provider.ts)   │     │ (Resend/SG/SMTP) │
└──────────────┘     └─────────────────┘     └──────────────────┘
                              │
                     ┌────────▼────────┐
                     │   email_log     │
                     │   (Supabase)    │
                     └─────────────────┘
```

## Supported Providers

| Provider | Env Variable | Best For |
|----------|-------------|----------|
| **Resend** | `RESEND_API_KEY` | Modern API, great DX, generous free tier |
| **SendGrid** | `SENDGRID_API_KEY` | High-volume, enterprise features |
| **SMTP** | `SMTP_RELAY_URL` | AWS SES, Mailgun, self-hosted SMTP |
| **Console** | (default) | Development — logs to stdout |

## Configuration

Set the provider via Supabase secrets:

```bash
# Choose your provider
supabase secrets set EMAIL_PROVIDER=resend

# Provider-specific keys
supabase secrets set RESEND_API_KEY=re_abc123...

# Common settings
supabase secrets set EMAIL_FROM=noreply@yourstudio.com
supabase secrets set EMAIL_FROM_NAME="Your Studio"
```

## Templates

Templates are defined in `supabase/functions/email/templates.ts` as TypeScript functions. Each returns `{ subject, html, text }`.

| Template | Trigger | Data Required |
|----------|---------|---------------|
| `welcomeEmail` | User registration | firstName, appUrl |
| `bookingConfirmationEmail` | Successful booking | class details, studio, instructor |
| `bookingCancellationEmail` | Member cancels | class details, studio |
| `classReminderEmail` | Cron (24h, 1h before) | class details, timeUntil |
| `waitlistPromotedEmail` | Spot opens | class details, studio |
| `passwordResetEmail` | Password reset request | firstName, resetUrl |
| `studioInquiryNotificationEmail` | Anonymous inquiry | studio, sender, message |

## Design Principles

### Fire-and-forget
Email sends never block the user-facing operation. The `sendEmail()` function catches all errors and returns a result object — it never throws.

### Audit trail
Every email send (success or failure) is logged to the `email_log` table with the provider, template, status, and any error message.

### No template engine dependency
Templates use plain TypeScript template literals with inline CSS. This avoids a Handlebars/EJS/Pug dependency and keeps emails self-contained.

### Provider switching
Change `EMAIL_PROVIDER` and the relevant API key — no code changes, no redeployment of the frontend.

## Adding a New Template

1. Add a typed function in `supabase/functions/email/templates.ts`:

```typescript
export function myNewEmail(data: { name: string }): TemplateResult {
  return {
    subject: `Hello, ${data.name}`,
    html: layout(`<p>Hello ${data.name}</p>`),
    text: `Hello ${data.name}`,
  };
}
```

2. Use it from an Edge Function:

```typescript
import { sendEmail } from "./email/provider.ts";
import { myNewEmail } from "./email/templates.ts";

const template = myNewEmail({ name: "Sarah" });
const result = await sendEmail({ to: "sarah@example.com", ...template });
```

## Adding a New Provider

1. Create a factory function in `supabase/functions/email/provider.ts`:

```typescript
function createMyProvider(): EmailProviderAdapter {
  return {
    name: "myprovider",
    async send(message) {
      // Call your provider's API
      return { success: true, provider: "myprovider" };
    },
  };
}
```

2. Add it to the `getProvider()` switch statement.

3. Set `EMAIL_PROVIDER=myprovider` in your secrets.
