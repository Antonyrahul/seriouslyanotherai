import { getToolsPaginated } from "@/app/actions/tools";
import {
  getHomepageAdvertisements,
  getAllPagesAdvertisements,
} from "@/app/actions/advertise";
import { ClientHomePage } from "./client-home-page";
import { PAGINATION_CONFIG } from "@/lib/constants/config";

export const dynamic = "force-dynamic";

export default async function Home() {
  const [{ tools, hasMore }, homepageAds, allPagesAds] = await Promise.all([
    getToolsPaginated(1, PAGINATION_CONFIG.DEFAULT_PAGE_SIZE),
    getHomepageAdvertisements(),
    getAllPagesAdvertisements(),
  ]);

  // Combine sponsored tools (all pages first, then homepage)
  const sponsoredTools = [...allPagesAds, ...homepageAds];

  return (
    <ClientHomePage
      initialTools={tools}
      sponsoredTools={sponsoredTools}
      hasMore={hasMore}
      initialPageSize={PAGINATION_CONFIG.DEFAULT_PAGE_SIZE}
    />
  );
}
