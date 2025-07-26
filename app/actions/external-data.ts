"use server";

import ogs from "open-graph-scraper";

const appUrl = process.env.NEXT_PUBLIC_APP_URL;
// Fetch URL metadata for tool submission using Open Graph scraper
export async function fetchUrlDescription(url: string): Promise<string> {
  try {
    console.log("🔍 Fetching description for URL:", url);

    const options = {
      url: url,
      timeout: 10000, // 10 seconds timeout
      fetchOptions: {
        headers: {
          "User-Agent": `Mozilla/5.0 (compatible; ToolBot/1.0; +${appUrl})`,
        },
      },
    };

    const { result, error } = await ogs(options);

    if (error) {
      console.log("❌ OGS Error:", error);
      return "No description available";
    }

    console.log("✅ OGS Success:", {
      ogDescription: result.ogDescription,
      ogTitle: result.ogTitle,
      twitterDescription: result.twitterDescription,
    });

    // Priority: Open Graph → Twitter → Title → Fallback
    const description =
      result.ogDescription ||
      result.twitterDescription ||
      result.ogTitle ||
      "No description available";

    console.log("📝 Final description:", description);
    return description.trim();
  } catch (error) {
    console.error("💥 Fetch error:", error);
    return "No description available";
  }
}
