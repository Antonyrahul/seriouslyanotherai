import { LegalLayout } from "@/components/layout/legal-layout";
import { SITE_CONFIG } from "@/lib/constants/config";
import { Plus } from "lucide-react";
import Link from "next/link";

export default function AboutPage() {
  return (
    <LegalLayout>
      <div className="max-w-md mx-auto space-y-6">
        <div className="text-center">
          <h1 className="text-2xl font-semibold text-foreground mb-2">About</h1>
          <p className="text-sm text-muted-foreground">
            The story behind {SITE_CONFIG.title}
          </p>
        </div>

        <div className="space-y-4">
          {/* 
            TEMPLATE SECTION: Founder Introduction
            Customize this section with your own story and background
          */}
          <div className="border border-border rounded-lg p-4 bg-background">
            <h2 className="font-medium text-foreground mb-2">
              Hi, I&apos;m [Your Name Here]
            </h2>
            <p className="text-sm text-muted-foreground">
              {/* 
                TEMPLATE: Replace with your own introduction
                You can add links to your projects, social media, or company
              */}
              I&apos;m the founder...
            </p>
          </div>

          {/* 
            TEMPLATE SECTION: Motivation/Story
            Explain what inspired you to build this platform
          */}
          <div className="border border-border rounded-lg p-4 bg-background">
            <h2 className="font-medium text-foreground mb-2">The Motivation</h2>
            <p className="text-sm text-muted-foreground">
              {/* 
                TEMPLATE: Replace with your own motivation story
                Explain the problem you're solving and why you built this
              */}
              [Your motivation story here] - what inspired you to build this
              platform and what problem are you solving for your users?
            </p>
          </div>

          {/* 
            TEMPLATE SECTION: Result/Achievement
            Describe what you've built and its key features
          */}
          <div className="border border-border rounded-lg p-4 bg-background">
            <h2 className="font-medium text-foreground mb-2">The Result</h2>
            <p className="text-sm text-muted-foreground mb-3">
              {/* 
                TEMPLATE: Replace with your own achievement description
                Highlight the key features and benefits of your platform
              */}
              [Describe your platform] - what makes it unique and what are the
              key features that set it apart from alternatives?
            </p>
            <p className="text-sm text-muted-foreground">
              {/* 
                TEMPLATE: Optional - mention if you're planning to make this a boilerplate
                or any future plans for the project
              */}
              [Optional: Future plans or additional context about your project]
            </p>
          </div>

          {/* 
            TEMPLATE SECTION: Call to Action
            Encourage users to submit their tools or engage with your platform
          */}
          <div className="border border-border rounded-lg p-4 bg-background">
            <h2 className="font-medium text-foreground mb-2">
              Submit Your Tool
            </h2>
            <p className="text-sm text-muted-foreground mb-3">
              {/* 
                TEMPLATE: Customize the call-to-action text
                Encourage users to engage with your platform
              */}
              Share your creation with our community.
            </p>
            <Link
              href="/submit"
              className="bg-foreground text-background px-3 py-1.5 rounded-full text-sm font-medium hover:bg-foreground/90 transition-colors inline-flex items-center justify-center gap-1"
            >
              <Plus className="w-3 h-3" />
              Submit tool
            </Link>
          </div>
        </div>

        <div className="text-center pt-6 border-t border-border">
          <p className="text-xs text-muted-foreground">
            Built with{" "}
            <a
              href="https://findly.tools/boilerplate"
              target="_blank"
              rel="noopener"
              className="text-primary hover:underline"
            >
              Findly.tools Boilerplate
            </a>{" "}
            - A complete template for building tool discovery platforms
          </p>
        </div>
      </div>
    </LegalLayout>
  );
}
