"use client";

import { SidebarTrigger } from "@/components/ui/sidebar";
import { Logo } from "../logo";
import { authClient } from "@/lib/auth-client";
import Link from "next/link";

interface AppHeaderProps {
  showSidebarTrigger?: boolean;
}

export function AppHeader({ showSidebarTrigger = true }: AppHeaderProps) {
  const { data: session, isPending } = authClient.useSession();

  return (
    <header className="flex h-12 items-center justify-between p-6 bg-background">
      {/* Left side - Logo and sidebar trigger */}
      <div className="flex items-center gap-3">
        {/* Sidebar trigger - essential for mobile only */}
        {showSidebarTrigger && (
          <SidebarTrigger className="md:hidden hover:bg-muted/50 rounded-md transition-colors" />
        )}

        {/* Logo */}
        <Link href="/">
          <Logo />
        </Link>
      </div>

      {/* Right side - Action buttons */}
      <div className="flex items-center gap-3 sm:gap-4 md:gap-6">
        {/* Loading state */}
        {isPending && (
          <div className="flex items-center gap-4">
            <div className="w-12 h-4 bg-muted/50 rounded animate-pulse"></div>
            <div className="w-12 h-4 bg-muted/50 rounded animate-pulse"></div>
          </div>
        )}

        {/* Authenticated user */}
        {!isPending && session?.user && (
          <>
            <Link
              href="/advertise"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Advertise
            </Link>
            <Link
              href="/submit"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Submit
            </Link>
            <Link
              href="/profile"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Profile
            </Link>
          </>
        )}

        {/* Non-authenticated user */}
        {!isPending && !session?.user && (
          <>
            <Link
              href="/advertise"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Advertise
            </Link>
            <Link
              href="/sign-in"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Sign in
            </Link>
          </>
        )}
      </div>
    </header>
  );
}
