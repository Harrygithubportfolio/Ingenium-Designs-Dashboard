# Supabase Auth — Invite Flow Setup

This guide walks through configuring Supabase so you can invite users from the dashboard and they receive a branded welcome email, verify their email, set their password, and log in.

---

## 1. URL Configuration

Go to **Authentication > URL Configuration** in your Supabase dashboard.

| Setting | Value |
|---|---|
| **Site URL** | `http://localhost:3000` |
| **Redirect URLs** | `http://localhost:3000/auth/callback`, `http://localhost:3000/auth/confirm` |

> For production, update these to your live domain (e.g. `https://app.ingeniumdesigns.com`).

---

## 2. Email Provider Settings

Go to **Authentication > Providers > Email**.

| Setting | Value |
|---|---|
| **Enable Email provider** | ON |
| **Confirm email** | ON |
| **Secure email change** | ON |
| **Double confirm email changes** | Optional (recommended ON) |

---

## 3. Email Templates

Go to **Authentication > Email Templates**.

### Invite User Template

1. Select the **Invite User** tab
2. Set the **Subject** to: `You're invited to Life OS Dashboard`
3. Replace the **Body** with the contents of `supabase/email-templates/invite.html`

> The invite template links to `{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=invite`. This hits the app's `/auth/confirm` route which verifies the token and redirects to the set-password page.

### Confirm Signup Template

1. Select the **Confirm Signup** tab
2. Set the **Subject** to: `Confirm your email — Life OS`
3. Replace the **Body** with the contents of `supabase/email-templates/confirm.html`

> The confirm template links to `{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=email`. After verification, the user is redirected to the login page with a success message.

---

## 4. Inviting a User

1. Go to **Authentication > Users** in Supabase dashboard
2. Click **Invite user**
3. Enter their email address
4. Click **Invite**

The user will:
1. Receive the branded invite email
2. Click "Accept Invitation"
3. App verifies the token at `/auth/confirm` → creates session
4. Redirected to `/auth/set-password`
5. Set their password
6. Redirected to login page with success message
7. Sign in with their email + password

---

## 5. Email Rate Limits

Supabase's built-in email service has rate limits:
- **Free plan:** 3 emails per hour
- **Pro plan:** 100 emails per hour

For production use, configure a custom SMTP provider:

1. Go to **Project Settings > Authentication > SMTP Settings**
2. Enable **Custom SMTP**
3. Enter your SMTP credentials (e.g. from Resend, Postmark, SendGrid, or Mailgun)

---

## 6. Flow Diagram

```
Admin invites user (Supabase Dashboard)
        |
        v
User receives branded email
        |
        v
User clicks "Accept Invitation"
        |
        v
/auth/confirm verifies OTP token → creates session
        |
        v
Redirects to /auth/set-password
        |
        v
User sets their password
        |
        v
Redirected to /login with success message
        |
        v
User signs in with email + password
```
