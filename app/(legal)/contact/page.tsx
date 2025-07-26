import { LegalLayout } from "@/components/layout/legal-layout";
import { SITE_CONFIG } from "@/lib/constants/config";

export default function ContactPage() {
  return (
    <LegalLayout>
      <div className="max-w-md mx-auto space-y-6">
        <div className="text-center">
          <h1 className="text-2xl font-semibold text-foreground mb-2">
            Contact
          </h1>
          <p className="text-sm text-muted-foreground">Get in touch</p>
        </div>

        <div className="space-y-4">
          <div className="border border-border rounded-lg p-4 bg-background">
            <h2 className="font-medium text-foreground mb-2">Email</h2>
            <a
              href={`mailto:${SITE_CONFIG.email}`}
              className="text-sm text-primary hover:underline"
            >
              {SITE_CONFIG.email}
            </a>
          </div>

          <div className="border border-border rounded-lg p-4 bg-background">
            <h2 className="font-medium text-foreground mb-2">X/Twitter</h2>
            <a
              href={SITE_CONFIG.x}
              target="_blank"
              rel="noopener"
              className="text-sm text-primary hover:underline"
            >
              {SITE_CONFIG.x}
            </a>
          </div>
        </div>
      </div>
    </LegalLayout>
  );
}
