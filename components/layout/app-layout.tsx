"use client";

import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "./app-sidebar";
import { AppHeader } from "./app-header";
import { SITE_CONFIG } from "@/lib/constants/config";
import Link from "next/link";
import { Plus } from "lucide-react";
import { Footer } from "./footer";

interface AppLayoutProps {
  children: React.ReactNode;
  activeCategory?: string;
  showHero?: boolean;
}

export function AppLayout({
  children,
  activeCategory,
  showHero = false,
}: AppLayoutProps) {
  return (
    <SidebarProvider defaultOpen={true}>
      <div className="flex h-screen w-full bg-background">
        <AppSidebar activeCategory={activeCategory} />
        <SidebarInset className="flex-1">
          <main className="flex-1 overflow-auto flex flex-col">
            <AppHeader />
            <div className="flex-1 p-6">
              {showHero && (
                <div className="mb-6">
                  <h1 className="text-lg mb-1 text-foreground">
                    {SITE_CONFIG.description}
                  </h1>
                  <p className="text-sm text-muted-foreground mb-4">
                    {SITE_CONFIG.tagline}
                  </p>
                  <div className="flex items-center gap-3">
                    <Link
                      href="/submit"
                      className="border border-border bg-background px-3 py-1.5 rounded-md text-sm font-medium hover:bg-muted/50 transition-colors inline-flex items-center justify-center gap-1"
                    >
                      <Plus className="w-3 h-3" />
                      Submit tool
                    </Link>
                  </div>
                </div>
              )}
              {children}
            </div>

            <Footer />
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
