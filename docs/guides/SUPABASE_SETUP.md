# Supabase Setup Guide

How to set up Supabase for your Tandava installation.

---

## Overview

Tandava uses Supabase for:
- **Database** (PostgreSQL)
- **Authentication** (email, OAuth)
- **Row Level Security** (multi-tenant data isolation)
- **Storage** (file uploads, optional)

---

## 1. Create a Supabase Project

1. Go to [supabase.com](https://supabase.com) and sign in
2. Click "New Project"
3. Choose your organization
4. Enter project details:
   - **Name:** Your studio name (e.g., "tandava-mystudio")
   - **Database Password:** Save this somewhere secure
   - **Region:** Choose closest to your users
5. Click "Create new project"
6. Wait for provisioning (about 2 minutes)

---

## 2. Get Your API Keys

Once your project is ready:

1. Go to **Settings > API** in the Supabase dashboard
2. You'll see two keys:

| Key | Purpose | Expose to client? |
|-----|---------|-------------------|
| `anon` (public) | Client-side requests, respects RLS | Yes |
| `service_role` (secret) | Server-side, bypasses RLS | Never |

3. Copy the **Project URL** and **anon key**

---

## 3. Configure Environment Variables

Create a `.env.local` file in your Tandava root directory:

```bash
# Required for Supabase connection
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Set to false for production (true uses mock data)
VITE_DEMO_MODE=false

# Optional: Custom redirect after auth
VITE_AUTH_REDIRECT_URL=https://yourdomain.com
```

**Important:**
- Never commit `.env.local` to git
- The `VITE_` prefix exposes variables to the frontend
- The anon key is safe to expose (RLS protects data)

---

## 4. Run Database Migrations

Apply the Tandava schema to your Supabase database:

### Option A: Supabase CLI (Recommended)

```bash
# Install Supabase CLI
npm install -g supabase

# Link to your project
supabase link --project-ref your-project-id

# Push migrations
supabase db push
```

### Option B: Manual SQL

1. Go to **SQL Editor** in Supabase dashboard
2. Open each file in `supabase/migrations/` in order
3. Run each migration

---

## 5. Configure Authentication

### Enable Email Auth

1. Go to **Authentication > Providers**
2. Email should be enabled by default
3. Configure settings:

| Setting | Recommended Value |
|---------|-------------------|
| Enable email confirmations | Yes (production) / No (development) |
| Secure email change | Yes |
| Enable password recovery | Yes |

### Enable OAuth (Optional)

For Google, Apple, or other OAuth providers:

1. Go to **Authentication > Providers**
2. Click the provider you want
3. Enter your OAuth credentials
4. Add redirect URLs

---

## 6. Customize Email Templates

Supabase sends emails for signup confirmation, password reset, and magic links. Customize these with your studio branding.

### Access Templates

1. Go to **Authentication > Email Templates**
2. You'll see templates for:
   - Confirm signup
   - Invite user
   - Magic link
   - Change email address
   - Reset password

### Template Variables

Use these variables in your templates:

| Variable | Description |
|----------|-------------|
| `{{ .ConfirmationURL }}` | Link user clicks to confirm |
| `{{ .Token }}` | Raw token (if building custom flow) |
| `{{ .TokenHash }}` | Hashed token |
| `{{ .SiteURL }}` | Your app URL |
| `{{ .Email }}` | User's email address |

### Example: Branded Confirmation Email

**Subject:**
```
Welcome to [Your Studio Name]
```

**Body:**
```html
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
    .container { max-width: 600px; margin: 0 auto; padding: 40px 20px; }
    .logo { text-align: center; margin-bottom: 30px; }
    .button {
      display: inline-block;
      background: #1e293b;
      color: white;
      padding: 12px 24px;
      text-decoration: none;
      border-radius: 6px;
      margin: 20px 0;
    }
    .footer { color: #666; font-size: 14px; margin-top: 40px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="logo">
      <h1>[Your Studio Name]</h1>
    </div>

    <p>Welcome to [Your Studio Name]!</p>

    <p>Click the button below to confirm your email and complete your registration:</p>

    <p style="text-align: center;">
      <a href="{{ .ConfirmationURL }}" class="button">Confirm Email</a>
    </p>

    <p>Or copy this link into your browser:</p>
    <p style="word-break: break-all; color: #666;">{{ .ConfirmationURL }}</p>

    <div class="footer">
      <p>If you didn't create an account with us, you can ignore this email.</p>
      <p>[Your Studio Name]<br>
      [Your Address]<br>
      [Your City, State ZIP]</p>
    </div>
  </div>
</body>
</html>
```

### Example: Password Reset Email

**Subject:**
```
Reset your [Your Studio Name] password
```

**Body:**
```html
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
    .container { max-width: 600px; margin: 0 auto; padding: 40px 20px; }
    .button {
      display: inline-block;
      background: #1e293b;
      color: white;
      padding: 12px 24px;
      text-decoration: none;
      border-radius: 6px;
      margin: 20px 0;
    }
  </style>
</head>
<body>
  <div class="container">
    <h2>Reset Your Password</h2>

    <p>We received a request to reset your password for your [Your Studio Name] account.</p>

    <p style="text-align: center;">
      <a href="{{ .ConfirmationURL }}" class="button">Reset Password</a>
    </p>

    <p>This link expires in 24 hours.</p>

    <p style="color: #666;">If you didn't request this, you can safely ignore this email. Your password won't change.</p>
  </div>
</body>
</html>
```

### Branding Elements You Can Customize

| Element | Where to Change |
|---------|-----------------|
| Studio name | Replace `[Your Studio Name]` in templates |
| Logo | Add `<img>` tag with hosted logo URL |
| Colors | Edit CSS in template (button background, etc.) |
| Address/contact | Add to footer |
| Tone/voice | Rewrite copy to match your brand |

---

## 7. Configure URL Settings

1. Go to **Authentication > URL Configuration**
2. Set these values:

| Setting | Value |
|---------|-------|
| Site URL | Your production URL (e.g., `https://app.yourstudio.com`) |
| Redirect URLs | Add all valid redirect destinations |

For local development, add:
- `http://localhost:8080`
- `http://localhost:3000` (if using different port)

---

## 8. Test Your Setup

1. Start Tandava without demo mode:
   ```bash
   # Make sure VITE_DEMO_MODE=false in .env.local
   npm run dev
   ```

2. Try to sign up with a test email
3. Check that confirmation email arrives
4. Confirm and log in
5. Verify you can access protected routes

---

## Troubleshooting

### "Invalid API key"
- Check `VITE_SUPABASE_ANON_KEY` is correct
- Ensure no extra spaces or quotes
- Verify key matches your project URL

### Emails not sending
- Check **Authentication > Email Templates** for errors
- Verify SMTP settings if using custom provider
- Check spam folder
- In development, disable email confirmations

### "User already registered"
- Use password reset flow
- Or delete user from **Authentication > Users** (dev only)

### RLS blocking queries
- Check user has a `staff_profiles` record
- Verify RLS policies in **Database > Policies**
- Use Supabase dashboard to test queries as authenticated user

---

## Production Checklist

Before going live:

- [ ] Custom domain configured
- [ ] Email templates branded
- [ ] SMTP provider configured (for reliable delivery)
- [ ] Redirect URLs set correctly
- [ ] Email confirmations enabled
- [ ] Rate limiting reviewed
- [ ] Backup schedule set up

---

## Custom SMTP (Optional)

For better email deliverability, use a dedicated email service:

1. Go to **Project Settings > Auth**
2. Scroll to **SMTP Settings**
3. Enable custom SMTP
4. Enter your provider details:

| Provider | SMTP Host | Port |
|----------|-----------|------|
| SendGrid | smtp.sendgrid.net | 587 |
| Mailgun | smtp.mailgun.org | 587 |
| Postmark | smtp.postmarkapp.com | 587 |
| AWS SES | email-smtp.[region].amazonaws.com | 587 |

---

## Related Documentation

- [06-authentication.md](../developer/06-authentication.md) - Auth architecture and alternatives
- [Supabase Auth Docs](https://supabase.com/docs/guides/auth) - Official documentation
- [Supabase Email Templates](https://supabase.com/docs/guides/auth/auth-email-templates) - Template reference
