import { LegalLayout } from "@/components/layout/legal-layout";
import { SITE_CONFIG } from "@/lib/constants/config";
import Link from "next/link";

export default function PrivacyPage() {
  return (
    <LegalLayout>
      <div className="max-w-3xl mx-auto space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">
            Privacy Policy
          </h1>
          <p className="text-muted-foreground">
            Last updated: {new Date().toLocaleDateString()}
          </p>
        </div>

        <div className="prose prose-gray max-w-none space-y-8">
          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-foreground">
              1. Introduction
            </h2>
            <p className="text-foreground leading-relaxed">
              At {SITE_CONFIG.title} (&ldquo;we,&rdquo; &ldquo;our,&rdquo; or
              &ldquo;us&rdquo;), we are committed to protecting your privacy.
              This Privacy Policy explains how we collect, use, disclose, and
              safeguard your information when you visit our website and use our
              services.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-foreground">
              2. Information We Collect
            </h2>
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-medium text-foreground mb-2">
                  Account Information
                </h3>
                <p className="text-foreground leading-relaxed mb-3">
                  When you create an account, we collect information through
                  OAuth providers:
                </p>
                <ul className="list-disc pl-6 space-y-2 text-foreground">
                  <li>
                    Google OAuth: Name, email address, and profile picture
                  </li>
                  <li>
                    GitHub OAuth: Username, email address, and profile
                    information
                  </li>
                  <li>
                    Tool information when you submit tools to our directory
                  </li>
                </ul>
              </div>

              <div>
                <h3 className="text-lg font-medium text-foreground mb-2">
                  Analytics Information
                </h3>
                <p className="text-foreground leading-relaxed mb-3">
                  We use Plausible Analytics, a privacy-first and cookie-less
                  analytics service, to collect basic usage statistics:
                </p>
                <ul className="list-disc pl-6 space-y-2 text-foreground">
                  <li>Page views and referral sources</li>
                  <li>General location data (country-level only)</li>
                  <li>Device type and browser information</li>
                  <li>No personal data or individual tracking</li>
                </ul>
              </div>
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-foreground">
              3. How We Use Your Information
            </h2>
            <div className="space-y-3">
              <p className="text-foreground leading-relaxed">
                We use the information we collect for the following purposes:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-foreground">
                <li>Providing and maintaining our services</li>
                <li>Processing your transactions through Stripe</li>
                <li>Managing your tool submissions and account</li>
                <li>Improving our website and user experience</li>
                <li>Analyzing usage patterns with Plausible Analytics</li>
                <li>Ensuring security and preventing fraud</li>
                <li>Complying with legal obligations</li>
              </ul>
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-foreground">
              4. Third-Party Services
            </h2>
            <div className="space-y-3">
              <p className="text-foreground leading-relaxed">
                We integrate with the following third-party services:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-foreground">
                <li>
                  <strong>Google OAuth:</strong> For secure authentication
                  (Google&apos;s Privacy Policy applies)
                </li>
                <li>
                  <strong>GitHub OAuth:</strong> For secure authentication
                  (GitHub&apos;s Privacy Policy applies)
                </li>
                <li>
                  <strong>Stripe:</strong> For payment processing (Stripe&apos;s
                  Privacy Policy applies)
                </li>
                <li>
                  <strong>Plausible Analytics:</strong> For privacy-first
                  website analytics (no personal data collected)
                </li>
              </ul>
              <p className="text-foreground leading-relaxed">
                These services have their own privacy policies, and we encourage
                you to review them.
              </p>
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-foreground">
              5. Data Storage and Security
            </h2>
            <div className="space-y-3">
              <p className="text-foreground leading-relaxed">
                We implement appropriate security measures to protect your
                information:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-foreground">
                <li>
                  OAuth authentication ensures we don&apos;t store passwords
                </li>
                <li>Payment data is processed and stored securely by Stripe</li>
                <li>
                  Plausible Analytics collects no personal or identifiable data
                </li>
                <li>
                  We use secure hosting and encryption for data transmission
                </li>
              </ul>
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-foreground">
              6. Cookies and Tracking
            </h2>
            <div className="space-y-3">
              <p className="text-foreground leading-relaxed">
                Our approach to cookies and tracking:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-foreground">
                <li>
                  <strong>Essential Cookies:</strong> Required for
                  authentication and basic site functionality
                </li>
                <li>
                  <strong>No Analytics Cookies:</strong> Plausible Analytics is
                  cookie-less and respects privacy
                </li>
                <li>
                  <strong>No Marketing Cookies:</strong> We do not use cookies
                  for advertising or tracking
                </li>
                <li>
                  <strong>Payment Cookies:</strong> Stripe may use cookies for
                  payment processing
                </li>
              </ul>
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-foreground">
              7. Data Sharing
            </h2>
            <div className="space-y-3">
              <p className="text-foreground leading-relaxed">
                We may share your information only in the following
                circumstances:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-foreground">
                <li>
                  <strong>Service Providers:</strong> OAuth providers and Stripe
                  for their respective services
                </li>
                <li>
                  <strong>Legal Requirements:</strong> When required by law or
                  to protect our rights
                </li>
                <li>
                  <strong>With Your Consent:</strong> When you explicitly agree
                  to the sharing
                </li>
              </ul>
              <p className="text-foreground leading-relaxed mt-3">
                We do not sell, trade, or rent your personal information to
                third parties.
              </p>
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-foreground">
              8. Data Retention
            </h2>
            <p className="text-foreground leading-relaxed">
              We retain your personal information only for as long as necessary
              to fulfill the purposes outlined in this Privacy Policy. When you
              delete your account, we will remove your personal data, though
              some information may be retained for legal compliance.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-foreground">
              9. Your Rights
            </h2>
            <div className="space-y-3">
              <p className="text-foreground leading-relaxed">
                You have the following rights regarding your personal
                information:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-foreground">
                <li>
                  <strong>Access:</strong> Request a copy of the personal
                  information we hold about you
                </li>
                <li>
                  <strong>Correction:</strong> Request correction of inaccurate
                  or incomplete information
                </li>
                <li>
                  <strong>Deletion:</strong> Request deletion of your personal
                  information
                </li>
                <li>
                  <strong>Portability:</strong> Request transfer of your data to
                  another service
                </li>
              </ul>
              <p className="text-foreground leading-relaxed">
                To exercise these rights, please contact us using the
                information provided below.
              </p>
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-foreground">
              10. Children&apos;s Privacy
            </h2>
            <p className="text-foreground leading-relaxed">
              Our services are not intended for children under 13 years of age.
              We do not knowingly collect personal information from children
              under 13. If you are a parent or guardian and believe your child
              has provided us with personal information, please contact us.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-foreground">
              11. Changes to This Privacy Policy
            </h2>
            <p className="text-foreground leading-relaxed">
              We may update this Privacy Policy from time to time. We will
              notify you of any material changes by posting the new Privacy
              Policy on this page and updating the &ldquo;Last updated&rdquo;
              date.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-foreground">
              12. Contact Us
            </h2>
            <p className="text-foreground leading-relaxed">
              If you have any questions about this Privacy Policy or our data
              practices, please contact us at{" "}
              <Link href="/contact" className="text-primary hover:underline">
                our contact page
              </Link>
              .
            </p>
          </section>
        </div>
      </div>
    </LegalLayout>
  );
}
