"use client";

import Link from "next/link";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { SITE_CONFIG } from "@/lib/constants/config";

interface AppSidebarProps {
  activeCategory?: string;
}

export function AppSidebar({ activeCategory }: AppSidebarProps) {
  return (
    <Sidebar>
      <SidebarContent className="px-2 py-4">
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-1">
              {SITE_CONFIG.navigation.categories.map((category) => {
                const href =
                  category.href === "/"
                    ? "/"
                    : `/categories/${category.href.replace("/", "")}`;
                const categorySlug =
                  category.href === "/"
                    ? "all"
                    : category.href.replace("/", "");
                return (
                  <SidebarMenuItem key={category.name}>
                    <SidebarMenuButton
                      asChild
                      isActive={activeCategory === categorySlug}
                      className="w-full justify-start hover:bg-muted/50 border-none shadow-none px-3 py-2 text-sm font-normal"
                    >
                      <Link href={href}>
                        <div className="border p-1 rounded-md">
                          <category.icon className="w-4 h-4 text-muted-foreground" />
                        </div>
                        <span className="text-foreground">{category.name}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
