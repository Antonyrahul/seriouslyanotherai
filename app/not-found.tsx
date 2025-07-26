import Link from "next/link";
import { ToolLayout } from "@/components/layout/tool-layout";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <ToolLayout>
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-6">
        <div className="space-y-3">
          <h1 className="text-4xl font-bold text-foreground">404</h1>
          <h2 className="text-2xl font-semibold text-muted-foreground">
            Tool Not Found
          </h2>
          <p className="text-muted-foreground">
            This tool doesn&apos;t exist or is not available.
          </p>
        </div>

        <div className="flex gap-4">
          <Button asChild>
            <Link href="/">Back to Home</Link>
          </Button>

          <Button variant="outline" asChild>
            <Link href="/submit">Submit a Tool</Link>
          </Button>
        </div>
      </div>
    </ToolLayout>
  );
}
