import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { AdminContent } from "@/components/admin/admin-content";
import {
  getAdminStats,
  getAdminUsers,
  getAdminTools,
  getAdminAdvertisements,
  getTimeSeriesData,
} from "@/app/actions/admin-actions";

export const dynamic = "force-dynamic";

interface AdminPageProps {
  searchParams: Promise<{
    page?: string;
    tab?: string;
  }>;
}

export default async function AdminPage({ searchParams }: AdminPageProps) {
  // Authentication already verified in layout - safe to use session
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  const params = await searchParams;
  const page = parseInt(params.page || "1", 10);

  // Parallel data fetching for optimal performance - all admin dashboard data
  const [stats, users, tools, advertisements, timeSeriesData] =
    await Promise.all([
      getAdminStats(), // MRR, users count, tools count, churn rate
      getAdminUsers(page, 20), // Paginated user list with subscription info
      getAdminTools(page, 20), // Paginated tools with status and metrics
      getAdminAdvertisements(page, 20), // Active advertisement campaigns
      getTimeSeriesData(), // Monthly revenue and user growth charts
    ]);

  return (
    <AdminContent
      user={session!.user}
      stats={stats}
      users={users}
      tools={tools}
      advertisements={advertisements}
      timeSeriesData={timeSeriesData}
    />
  );
}
