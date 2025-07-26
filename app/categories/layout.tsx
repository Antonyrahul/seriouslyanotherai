import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { AppHeader } from "@/components/layout/app-header";
import { Footer } from "@/components/layout/footer";

export default function CategoriesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SidebarProvider defaultOpen={true}>
      <div className="flex h-screen w-full bg-background">
        <AppSidebar />
        <SidebarInset className="flex-1">
          <main className="flex-1 overflow-auto flex flex-col">
            <AppHeader />
            <div className="flex-1 p-6">{children}</div>
            <Footer />
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
