import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Privacy Policy | Ingenium Designs Dashboard',
  description: 'Privacy policy for the Ingenium Designs Dashboard application.',
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen w-full bg-surface text-heading">
      <div className="mx-auto max-w-3xl px-6 py-12 md:py-16">
        {/* Header */}
        <div className="mb-10">
          <Link
            href="/calendar"
            className="mb-6 inline-flex items-center gap-2 text-sm text-sub transition-colors hover:text-heading"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6" /></svg>
            Back to Dashboard
          </Link>
          <h1 className="text-3xl font-bold tracking-tight md:text-4xl">Privacy Policy</h1>
          <p className="mt-2 text-sm text-sub">Last updated: 15 February 2026</p>
        </div>

        {/* Content */}
        <div className="space-y-8 text-sub leading-relaxed [&_h2]:mb-3 [&_h2]:text-xl [&_h2]:font-semibold [&_h2]:text-heading [&_h3]:mb-2 [&_h3]:text-lg [&_h3]:font-medium [&_h3]:text-heading [&_ul]:ml-5 [&_ul]:list-disc [&_ul]:space-y-1">
          <section>
            <h2>1. Introduction</h2>
            <p>
              Ingenium Designs Dashboard (&quot;we&quot;, &quot;our&quot;, &quot;the Service&quot;) is a personal
              productivity dashboard operated by Ingenium Designs. This Privacy Policy explains how we
              collect, use, store, and protect your information when you use our Service.
            </p>
          </section>

          <section>
            <h2>2. Information We Collect</h2>

            <h3>Account Information</h3>
            <p>When you create an account, we collect:</p>
            <ul>
              <li>Email address</li>
              <li>Display name (if provided)</li>
              <li>Authentication credentials (managed securely by Supabase)</li>
            </ul>

            <h3>Dashboard Data</h3>
            <p>
              Data you enter into the dashboard — including fitness schedules, nutrition logs, goals,
              and calendar events — is stored in our database and associated with your account.
            </p>

            <h3>Google Calendar Data</h3>
            <p>
              If you choose to connect your Google Calendar, we access and store:
            </p>
            <ul>
              <li>Calendar event titles, dates, times, locations, and descriptions</li>
              <li>OAuth tokens (encrypted at rest using AES-256-GCM encryption) to maintain your connection</li>
            </ul>
            <p className="mt-2">
              We only access events from your primary Google Calendar. We do not access contacts,
              emails, or any other Google services.
            </p>
          </section>

          <section>
            <h2>3. How We Use Your Information</h2>
            <p>We use your information solely to:</p>
            <ul>
              <li>Provide and maintain the dashboard Service</li>
              <li>Display your calendar events alongside locally created events</li>
              <li>Sync events between the dashboard and Google Calendar (two-way sync)</li>
              <li>Authenticate your identity and protect your account</li>
            </ul>
            <p className="mt-2">
              We do <strong className="text-heading">not</strong> sell, share, or disclose your personal data
              to third parties for marketing or advertising purposes.
            </p>
          </section>

          <section>
            <h2>4. Data Storage and Security</h2>
            <ul>
              <li>All data is stored in Supabase with Row Level Security (RLS) enabled — you can only access your own data</li>
              <li>Google OAuth tokens are encrypted using AES-256-GCM before storage</li>
              <li>All connections to the Service use HTTPS encryption in transit</li>
              <li>We do not store your Google password — authentication is handled entirely through Google&apos;s secure OAuth 2.0 flow</li>
            </ul>
          </section>

          <section>
            <h2>5. Google Calendar Integration</h2>
            <p>
              Our use of Google Calendar data complies with the{' '}
              <a
                href="https://developers.google.com/terms/api-services-user-data-policy"
                target="_blank"
                rel="noopener noreferrer"
                className="text-accent underline underline-offset-2 hover:text-accent"
              >
                Google API Services User Data Policy
              </a>
              , including the Limited Use requirements.
            </p>
            <p className="mt-2">Specifically:</p>
            <ul>
              <li>We only request access to Google Calendar events (the minimum scope required)</li>
              <li>Calendar data is used solely to display and sync events within the dashboard</li>
              <li>We do not transfer your Google data to third parties</li>
              <li>We do not use your Google data for advertising or profiling</li>
              <li>You can disconnect Google Calendar at any time from the calendar page, which deactivates the connection and stops all syncing</li>
            </ul>
          </section>

          <section>
            <h2>6. Your Rights and Controls</h2>
            <p>You have the right to:</p>
            <ul>
              <li><strong className="text-heading">Disconnect Google Calendar</strong> — removes the active connection and stops syncing</li>
              <li><strong className="text-heading">Delete your data</strong> — contact us to request full deletion of your account and all associated data</li>
              <li><strong className="text-heading">Revoke Google access</strong> — you can also revoke access directly from your{' '}
                <a
                  href="https://myaccount.google.com/permissions"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-accent underline underline-offset-2 hover:text-accent"
                >
                  Google Account permissions
                </a>
              </li>
              <li><strong className="text-heading">Access your data</strong> — all your data is visible within the dashboard at all times</li>
            </ul>
          </section>

          <section>
            <h2>7. Data Retention</h2>
            <p>
              We retain your data for as long as your account is active. If you request account
              deletion, all associated data — including calendar events, OAuth tokens, and sync
              logs — will be permanently deleted within 30 days.
            </p>
          </section>

          <section>
            <h2>8. Cookies and Tracking</h2>
            <p>
              We use essential session cookies for authentication only. We do not use analytics
              cookies, tracking pixels, or any third-party tracking services.
            </p>
          </section>

          <section>
            <h2>9. Changes to This Policy</h2>
            <p>
              We may update this Privacy Policy from time to time. Any changes will be reflected on
              this page with an updated &quot;Last updated&quot; date. Continued use of the Service
              after changes constitutes acceptance of the updated policy.
            </p>
          </section>

          <section>
            <h2>10. Contact</h2>
            <p>
              If you have questions about this Privacy Policy or wish to exercise your data rights,
              please contact us at:{' '}
              <a
                href="mailto:support@ingeniumdesigns.co.uk"
                className="text-accent underline underline-offset-2 hover:text-accent"
              >
                support@ingeniumdesigns.co.uk
              </a>
            </p>
          </section>
        </div>

        {/* Footer */}
        <div className="mt-12 border-t border-edge pt-6 text-sm text-dim">
          <p>&copy; 2026 Ingenium Designs. All rights reserved.</p>
          <div className="mt-2 flex gap-4">
            <Link href="/privacy" className="text-sub hover:text-heading">Privacy Policy</Link>
            <Link href="/terms" className="text-sub hover:text-heading">Terms &amp; Conditions</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
