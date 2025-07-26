import { ImageResponse } from "next/og";
import { getToolBySlug } from "@/app/actions/tools";
import { SITE_CONFIG } from "@/lib/constants/config";

const size = {
  width: 1200,
  height: 630,
};

export default async function Image({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  try {
    console.log("🖼️ Generating OG image for:", params);
    const { slug } = await params;
    console.log("📝 Looking for tool with slug:", slug);

    const tool = await getToolBySlug(slug);
    console.log("🔍 Tool found:", tool ? "✅" : "❌");

    if (!tool) {
      console.log("⚠️ Tool not found, using default image");
      return new ImageResponse(
        (
          <div
            style={{
              height: "100%",
              width: "100%",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: "#ffffff",
              fontFamily: "system-ui, sans-serif",
            }}
          >
            <div
              style={{
                fontSize: 48,
                fontWeight: "600",
                color: "#1f2937",
                textAlign: "center",
                marginBottom: "24px",
              }}
            >
              Tool not found
            </div>

            {/* Logo image */}
            <img
              src="https://pub-459c6f6553344cc393826444731f5707.r2.dev/logo-big-trsp-indark.png"
              alt={SITE_CONFIG.title}
              width="140"
              height="46"
              style={{
                objectFit: "contain",
              }}
            />
          </div>
        ),
        { ...size }
      );
    }

    console.log("🎨 Generating image for tool:", tool.name);

    return new ImageResponse(
      (
        <div
          style={{
            height: "100%",
            width: "100%",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: "#ffffff",
            fontFamily: "system-ui, sans-serif",
            padding: "60px",
            position: "relative",
          }}
        >
          {/* Contenu principal centré */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              textAlign: "center",
              maxWidth: "900px",
            }}
          >
            {/* Signature principale: findly.tools/logo-outil */}
            <div
              style={{
                fontSize: "96px",
                fontWeight: "900",
                color: "#111827",
                lineHeight: 1,
                letterSpacing: "-0.03em",
                display: "flex",
                alignItems: "center",
                gap: "32px",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "baseline",
                  backgroundColor: "#111827",
                  color: "white",
                  padding: "16px 28px",
                  borderRadius: "16px",
                  fontSize: "48px",
                  fontWeight: "700",
                  letterSpacing: "-0.01em",
                }}
              >
                <span style={{ textTransform: "uppercase" }}>findly</span>
                <span
                  style={{
                    fontStyle: "italic",
                    textTransform: "uppercase",
                    opacity: 0.9,
                  }}
                >
                  .tools
                </span>
              </div>
              <span
                style={{
                  color: "#9ca3af",
                  fontSize: "72px",
                  fontWeight: "300",
                }}
              >
                /
              </span>

              {/* Logo de l'outil */}
              {tool.logoUrl ? (
                <img
                  src={tool.logoUrl}
                  alt={tool.name}
                  width="140"
                  height="140"
                  style={{
                    borderRadius: "28px",
                    objectFit: "contain",
                    filter: "drop-shadow(0 10px 20px rgba(0, 0, 0, 0.2))",
                  }}
                />
              ) : (
                <div
                  style={{
                    width: "140px",
                    height: "140px",
                    borderRadius: "28px",
                    backgroundColor: "#111827",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "white",
                    fontSize: "56px",
                    fontWeight: "700",
                    filter: "drop-shadow(0 10px 20px rgba(0, 0, 0, 0.2))",
                  }}
                >
                  {tool.name.charAt(0).toUpperCase()}
                </div>
              )}
            </div>
          </div>
        </div>
      ),
      { ...size }
    );
  } catch (error) {
    console.error("❌ Error generating OG image:", error);

    return new ImageResponse(
      (
        <div
          style={{
            height: "100%",
            width: "100%",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: "#dc2626",
            color: "white",
            fontFamily: "system-ui, sans-serif",
          }}
        >
          <div style={{ fontSize: 60, fontWeight: "bold" }}>Error</div>
          <div style={{ fontSize: 24, marginTop: "20px" }}>
            Unable to generate image
          </div>
          <div style={{ fontSize: 16, marginTop: "10px", opacity: 0.8 }}>
            {error instanceof Error ? error.message : "Unknown error"}
          </div>
        </div>
      ),
      { ...size }
    );
  }
}
