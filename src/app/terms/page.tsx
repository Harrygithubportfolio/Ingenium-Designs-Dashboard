import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Terms & Conditions | Ingenium Designs Dashboard',
  description: 'Terms and conditions for the Ingenium Designs Dashboard application.',
};

export default function TermsPage() {
  return (
    <div className="min-h-screen w-full bg-[#0f0f14] text-white">
      <div className="mx-auto max-w-3xl px-6 py-12 md:py-16">
        {/* Header */}
        <div className="mb-10">
          <Link
            href="/calendar"
            className="mb-6 inline-flex items-center gap-2 text-sm text-gray-400 transition-colors hover:text-white"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6" /></svg>
            Back to Dashboard
          </Link>
          <h1 className="text-3xl font-bold tracking-tight md:text-4xl">Terms &amp; Conditions</h1>
          <p className="mt-2 text-sm text-gray-400">Last updated: 15 February 2026</p>
        </div>

        {/* Content */}
        <div className="space-y-8 text-gray-300 leading-relaxed [&_h2]:mb-3 [&_h2]:text-xl [&_h2]:font-semibold [&_h2]:text-white [&_h3]:mb-2 [&_h3]:text-lg [&_h3]:font-medium [&_h3]:text-white [&_ul]:ml-5 [&_ul]:list-disc [&_ul]:space-y-1">
          <section>
            <h2>1. Agreement to Terms</h2>
            <p>
              By accessing or using the Ingenium Designs Dashboard (&quot;the Service&quot;), you agree to
              be bound by these Terms &amp; Conditions. If you do not agree to these terms, please do
              not use the Service.
            </p>
          </section>

          <section>
            <h2>2. Description of Service</h2>
            <p>
              The Ingenium Designs Dashboard is a personal productivity platform that provides tools
              for goal tracking, fitness planning, nutrition logging, and calendar management. The
              Service includes optional integration with third-party services such as Google Calendar.
            </p>
          </section>

          <section>
            <h2>3. Account Registration</h2>
            <ul>
              <li>You must provide accurate and complete information when creating an account</li>
              <li>You are responsible for maintaining the security of your account credentials</li>
              <li>You must notify us immediately of any unauthorised access to your account</li>
              <li>You must be at least 16 years of age to use the Service</li>
            </ul>
          </section>

          <section>
            <h2>4. Acceptable Use</h2>
            <p>You agree not to:</p>
            <ul>
              <li>Use the Service for any unlawful purpose</li>
              <li>Attempt to gain unauthorised access to any part of the Service</li>
              <li>Interfere with or disrupt the Service or its infrastructure</li>
              <li>Use automated systems (bots, scrapers) to access the Service without permission</li>
              <li>Share your account credentials with others</li>
            </ul>
          </section>

          <section>
            <h2>5. Your Data</h2>
            <p>
              You retain ownership of all data you input into the Service. By using the Service, you
              grant us a limited licence to store, process, and display your data solely for the
              purpose of providing the Service to you. Our handling of your data is governed by our{' '}
              <Link href="/privacy" className="text-[#3b82f6] underline underline-offset-2 hover:text-[#60a5fa]">
                Privacy Policy
              </Link>.
            </p>
          </section>

          <section>
            <h2>6. Third-Party Integrations</h2>

            <h3>Google Calendar</h3>
            <p>
              If you connect your Google Calendar to the Service:
            </p>
            <ul>
              <li>You authorise us to read and write calendar events on your behalf</li>
              <li>You can revoke this access at any time through the dashboard or through your Google Account settings</li>
              <li>We are not responsible for any changes made to your Google Calendar data through the sync process — we recommend maintaining your own backups</li>
              <li>Google&apos;s own Terms of Service and Privacy Policy also apply to your use of Google Calendar</li>
            </ul>
          </section>

          <section>
            <h2>7. Service Availability</h2>
            <ul>
              <li>We aim to provide reliable access to the Service but do not guarantee uninterrupted availability</li>
              <li>We may perform maintenance, updates, or improvements that temporarily affect access</li>
              <li>Third-party integrations (e.g. Google Calendar) depend on those providers&apos; availability and are outside our control</li>
            </ul>
          </section>

          <section>
            <h2>8. Limitation of Liability</h2>
            <p>
              The Service is provided &quot;as is&quot; without warranties of any kind, whether express or
              implied. To the maximum extent permitted by law:
            </p>
            <ul>
              <li>We are not liable for any indirect, incidental, or consequential damages arising from your use of the Service</li>
              <li>We are not responsible for data loss — while we take reasonable precautions to protect your data, we recommend maintaining your own backups</li>
              <li>Our total liability shall not exceed the amount you have paid for the Service (if any)</li>
            </ul>
          </section>

          <section>
            <h2>9. Account Termination</h2>
            <ul>
              <li>You may delete your account at any time by contacting us</li>
              <li>We reserve the right to suspend or terminate accounts that violate these terms</li>
              <li>Upon termination, your data will be deleted in accordance with our Privacy Policy</li>
            </ul>
          </section>

          <section>
            <h2>10. Intellectual Property</h2>
            <p>
              The Service, including its design, code, and branding, is the property of Ingenium
              Designs. You may not copy, modify, distribute, or reverse-engineer any part of the
              Service without our prior written consent.
            </p>
          </section>

          <section>
            <h2>11. Changes to These Terms</h2>
            <p>
              We may update these Terms &amp; Conditions from time to time. Changes will be reflected
              on this page with an updated date. Continued use of the Service after changes
              constitutes acceptance of the revised terms.
            </p>
          </section>

          <section>
            <h2>12. Governing Law</h2>
            <p>
              These terms are governed by and construed in accordance with the laws of England and
              Wales. Any disputes shall be subject to the exclusive jurisdiction of the courts of
              England and Wales.
            </p>
          </section>

          <section>
            <h2>13. Contact</h2>
            <p>
              If you have questions about these Terms &amp; Conditions, please contact us at:{' '}
              <a
                href="mailto:support@ingeniumdesigns.co.uk"
                className="text-[#3b82f6] underline underline-offset-2 hover:text-[#60a5fa]"
              >
                support@ingeniumdesigns.co.uk
              </a>
            </p>
          </section>
        </div>

        {/* Footer */}
        <div className="mt-12 border-t border-[#2a2a33] pt-6 text-sm text-gray-500">
          <p>&copy; 2026 Ingenium Designs. All rights reserved.</p>
          <div className="mt-2 flex gap-4">
            <Link href="/privacy" className="text-gray-400 hover:text-white">Privacy Policy</Link>
            <Link href="/terms" className="text-gray-400 hover:text-white">Terms &amp; Conditions</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
