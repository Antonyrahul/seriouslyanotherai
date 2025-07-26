import { AppHeader } from "./app-header";
import { Footer } from "./footer";

interface LegalLayoutProps {
  children: React.ReactNode;
}

export function LegalLayout({ children }: LegalLayoutProps) {
  return (
    <div className="min-h-screen w-full bg-background flex flex-col">
      <AppHeader showSidebarTrigger={false} />
      <main className="flex-1 flex flex-col items-center justify-start px-6 py-8">
        <div className="w-full max-w-5xl">{children}</div>
      </main>
      <Footer />
    </div>
  );
}
