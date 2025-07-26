import { notFound } from "next/navigation";
import { Metadata } from "next";
import { PAGINATION_CONFIG, SITE_CONFIG } from "@/lib/constants/config";
import { getToolsByCategoryPaginated } from "@/app/actions/tools";
import { getAllPagesAdvertisements } from "@/app/actions/advertise";
import { CategoryPageClient } from "./client";

interface CategoryPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({
  params,
}: CategoryPageProps): Promise<Metadata> {
  const { slug } = await params;
  const category = SITE_CONFIG.navigation.categories.find(
    (cat) => cat.href === `/${slug}`
  );

  if (!category) {
    return {
      title: "Category Not Found",
    };
  }

  return {
    title: `${category.name} Tools - 1Million.tools`,
    description: `Discover the best ${category.name.toLowerCase()} tools to boost your productivity and efficiency.`,
  };
}

export default async function CategoryPage({ params }: CategoryPageProps) {
  const { slug } = await params;

  const category = SITE_CONFIG.navigation.categories.find(
    (cat) => cat.href === `/${slug}`
  );

  if (!category) {
    notFound();
  }

  // Get tools for this category with pagination and "all pages" advertisements
  const [{ tools: categoryTools, hasMore }, allPagesAds] = await Promise.all([
    getToolsByCategoryPaginated(slug, 1, PAGINATION_CONFIG.CATEGORY_PAGE_SIZE),
    getAllPagesAdvertisements(),
  ]);

  return (
    <CategoryPageClient
      initialTools={categoryTools}
      sponsoredTools={allPagesAds}
      hasMore={hasMore}
      activeCategory={slug}
      categoryHref={category.href}
    />
  );
}
