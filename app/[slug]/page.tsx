import { notFound } from "next/navigation";
import { Metadata } from "next";
import { ToolDetail } from "@/components/tools/tool-detail";
import {
  getToolBySlug,
  getAllToolSlugs,
  getOtherToolsInCategory,
  getOtherTools,
} from "@/app/actions/tools";
import { SITE_CONFIG } from "@/lib/constants/config";

interface ToolPageProps {
  params: Promise<{ slug: string }>;
}

export const dynamic = "force-dynamic";

// Dynamic SEO metadata generation for each tool page
export async function generateMetadata({
  params,
}: ToolPageProps): Promise<Metadata> {
  const { slug } = await params;
  const tool = await getToolBySlug(slug);

  if (!tool) {
    return {
      title: `Tool not found - ${SITE_CONFIG.title}`,
      description:
        "The tool you're looking for doesn't exist or is no longer available.",
    };
  }

  const title = `${tool.name} - ${SITE_CONFIG.title}`;
  const description =
    tool.description.length > 160
      ? `${tool.description.substring(0, 157)}...`
      : tool.description;

  const url = `https://${SITE_CONFIG.title}/${tool.slug}`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url,
      siteName: SITE_CONFIG.title,
      images: [
        {
          url: `${url}/opengraph-image`,
          width: 1200,
          height: 630,
          alt: `${tool.name} - Featured on ${SITE_CONFIG.title}`,
        },
      ],
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [`${url}/opengraph-image`],
    },
  };
}

export default async function ToolPage({ params }: ToolPageProps) {
  const { slug } = await params;
  const tool = await getToolBySlug(slug);

  if (!tool) {
    notFound();
  }

  // Fetch related tools from the same category (advertisement-only tools are excluded at SQL level)
  // If tool is an advertisement boosting a subscription tool, exclude the original tool as well
  let otherTools = tool.category
    ? await getOtherToolsInCategory(tool.id, tool.category, 6, tool)
    : [];

  // Fallback to general tools if category has insufficient related tools
  let sectionTitle = `Other tools in ${tool.category}`;
  if (otherTools.length === 0) {
    otherTools = await getOtherTools(tool.id, 6, tool);
    sectionTitle = "Other tools";
  }

  return (
    <ToolDetail
      tool={tool}
      otherTools={otherTools}
      sectionTitle={sectionTitle}
    />
  );
}

// Static generation for all tool slugs at build time
export async function generateStaticParams() {
  const slugs = await getAllToolSlugs();
  return slugs.map((slug) => ({
    slug,
  }));
}
