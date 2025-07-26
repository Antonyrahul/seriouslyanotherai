import { LegalLayout } from "@/components/layout/legal-layout";
import { SITE_CONFIG } from "@/lib/constants/config";
import Link from "next/link";

export default function TermsPage() {
  return (
    <LegalLayout>
      <div className="max-w-3xl mx-auto space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">
            Terms of Service
          </h1>
          <p className="text-muted-foreground">
            Last updated: {new Date().toLocaleDateString()}
          </p>
        </div>

        <div className="prose prose-gray max-w-none space-y-8">
          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-foreground">
              1. Acceptance of Terms
            </h2>
            <p className="text-foreground leading-relaxed">
              By accessing and using {SITE_CONFIG.title} (&ldquo;the
              Service&rdquo;), you accept and agree to be bound by the terms and
              provision of this agreement. If you do not agree to abide by the
              above, please do not use this service.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-foreground">
              2. Description of Service
            </h2>
            <p className="text-foreground leading-relaxed">
              {SITE_CONFIG.title} is a directory platform that helps users
              discover and explore various tools for productivity, development,
              AI, and business purposes. We provide a curated collection of
              tools with detailed information.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-foreground">
              3. User Accounts
            </h2>
            <div className="space-y-3">
              <p className="text-foreground leading-relaxed">
                To submit tools or access certain features, you can create an
                account using Google or GitHub OAuth. You are responsible for:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-foreground">
                <li>Maintaining the confidentiality of your OAuth account</li>
                <li>All activities that occur under your account</li>
                <li>Ensuring your OAuth provider information is accurate</li>
                <li>Updating your information when necessary</li>
              </ul>
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-foreground">
              4. Tool Submissions
            </h2>
            <div className="space-y-3">
              <p className="text-foreground leading-relaxed">
                When submitting tools to our directory, you agree that:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-foreground">
                <li>You have the right to submit the tool information</li>
                <li>The information provided is accurate and not misleading</li>
                <li>
                  The tool does not violate any laws or third-party rights
                </li>
                <li>
                  We may moderate, edit, or remove submissions at our discretion
                </li>
              </ul>
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-foreground">
              5. Payments and Subscriptions
            </h2>
            <div className="space-y-3">
              <p className="text-foreground leading-relaxed">
                Payment processing is handled securely through Stripe:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-foreground">
                <li>
                  Subscription fees are charged in advance on a monthly or
                  yearly basis
                </li>
                <li>You can cancel your subscription at any time</li>
                <li>Refunds are handled according to our refund policy</li>
                <li>
                  We reserve the right to modify subscription plans and pricing
                </li>
                <li>
                  Payment data is processed securely by Stripe and not stored on
                  our servers
                </li>
              </ul>
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-foreground">
              6. Prohibited Content
            </h2>
            <div className="space-y-3">
              <p className="text-foreground leading-relaxed">
                The following types of content are strictly prohibited on our
                platform:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-foreground">
                <li>
                  Adult content, pornography, or sexually explicit materials
                </li>
                <li>Content promoting violence, hatred, or discrimination</li>
                <li>Content related to illegal activities or substances</li>
                <li>Gambling or betting tools and services</li>
                <li>Content that promotes self-harm or dangerous activities</li>
                <li>
                  Tools or services that violate intellectual property rights
                </li>
                <li>Spam, phishing, or malicious software</li>
                <li>
                  Content that impersonates others or misrepresents identity
                </li>
                <li>Promotional codes or offers for prohibited content</li>
              </ul>
              <p className="text-foreground leading-relaxed mt-3">
                We reserve the right to remove any content that violates these
                guidelines and may suspend or terminate accounts that repeatedly
                violate our policies.
              </p>
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-foreground">
              7. Prohibited Uses
            </h2>
            <div className="space-y-3">
              <p className="text-foreground leading-relaxed">
                You may not use our service:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-foreground">
                <li>
                  For any unlawful purpose or to solicit others to engage in
                  unlawful acts
                </li>
                <li>
                  To violate any international, federal, provincial, or state
                  regulations, rules, laws, or local ordinances
                </li>
                <li>
                  To infringe upon or violate our intellectual property rights
                  or the intellectual property rights of others
                </li>
                <li>
                  To harass, abuse, insult, harm, defame, slander, disparage,
                  intimidate, or discriminate
                </li>
                <li>To submit false or misleading information</li>
                <li>
                  To upload or transmit viruses or any other type of malicious
                  code
                </li>
              </ul>
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-foreground">
              8. Intellectual Property
            </h2>
            <p className="text-foreground leading-relaxed">
              The Service and its original content, features, and functionality
              are and will remain the exclusive property of {SITE_CONFIG.title}{" "}
              and its licensors. The Service is protected by copyright,
              trademark, and other laws.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-foreground">
              9. Privacy Policy
            </h2>
            <p className="text-foreground leading-relaxed">
              Your privacy is important to us. Please review our{" "}
              <Link href="/privacy" className="text-primary hover:underline">
                Privacy Policy
              </Link>
              , which also governs your use of the Service, to understand our
              practices.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-foreground">
              10. Disclaimer
            </h2>
            <p className="text-foreground leading-relaxed">
              The information on this website is provided on an &ldquo;as
              is&rdquo; basis. To the fullest extent permitted by law, this
              Company excludes all representations, warranties, and conditions
              relating to our website and the use of this website.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-foreground">
              11. Limitation of Liability
            </h2>
            <p className="text-foreground leading-relaxed">
              In no event shall {SITE_CONFIG.title}, nor its directors,
              employees, partners, agents, suppliers, or affiliates, be liable
              for any indirect, incidental, special, consequential, or punitive
              damages, including without limitation, loss of profits, data, use,
              goodwill, or other intangible losses.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-foreground">
              12. Termination
            </h2>
            <p className="text-foreground leading-relaxed">
              We may terminate or suspend your account and bar access to the
              Service immediately, without prior notice or liability, under our
              sole discretion, for any reason whatsoever and without limitation,
              including but not limited to a breach of the Terms.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-foreground">
              13. Changes to Terms
            </h2>
            <p className="text-foreground leading-relaxed">
              We reserve the right, at our sole discretion, to modify or replace
              these Terms at any time. If a revision is material, we will
              provide at least 30 days notice prior to any new terms taking
              effect.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-foreground">
              14. Contact Information
            </h2>
            <p className="text-foreground leading-relaxed">
              If you have any questions about these Terms of Service, please
              contact us at{" "}
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
