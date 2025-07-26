import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Server-side authentication check - ensures admin access before rendering
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    redirect("/sign-in");
  }

  // Role-based access control - only admin users can access this section
  const isAdmin = session.user.role === "admin";

  if (!isAdmin) {
    redirect("/");
  }

  return <div className="min-h-screen bg-gray-50">{children}</div>;
}
