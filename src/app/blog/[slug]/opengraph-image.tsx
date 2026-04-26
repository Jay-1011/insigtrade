// Per-post OG image. Next.js automatically wires this into social meta.
// Visited at /blog/{slug}/opengraph-image.png

import { ImageResponse } from "next/og";
import { getCategoryBySlug, getPostBySlug } from "@/lib/cms/store";

export const alt = "Insigtrade article preview";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const runtime = "nodejs";

const FORMAT_LABELS: Record<string, string> = {
  guide: "Guide",
  "tool-review": "Tool Review",
  comparison: "Comparison",
  listicle: "Listicle",
  tutorial: "Tutorial",
  trend: "Trend Analysis",
  "case-study": "Case Study",
  product: "Product",
  "beginner-guide": "Beginner Guide",
  workflow: "Workflow",
};

export default async function Image({
  params,
}: {
  params: { slug: string };
}) {
  const post = await getPostBySlug(params.slug);
  const title = post?.title ?? "Insigtrade — AI & Automation for Smarter Trading";
  const formatLabel = post ? FORMAT_LABELS[post.format] ?? "" : "";
  const category = post
    ? (await getCategoryBySlug(post.categorySlug))?.name ?? "Insigtrade"
    : "Insigtrade";

  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          backgroundColor: "#0f172a",
          backgroundImage:
            "radial-gradient(circle at 25% 20%, rgba(59,130,246,0.25), transparent 55%), radial-gradient(circle at 75% 85%, rgba(16,185,129,0.18), transparent 50%)",
          padding: "60px",
          fontFamily: "system-ui",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
          <div
            style={{
              width: "56px",
              height: "56px",
              borderRadius: "14px",
              background: "linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 8px 24px rgba(59,130,246,0.4)",
            }}
          >
            <svg
              width="32"
              height="32"
              viewBox="0 0 24 24"
              fill="none"
              stroke="white"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="22 7 13.5 15.5 8.5 10.5 2 17" />
              <polyline points="16 7 22 7 22 13" />
            </svg>
          </div>
          <div
            style={{
              fontSize: "30px",
              fontWeight: 700,
              color: "white",
              letterSpacing: "-0.02em",
              display: "flex",
            }}
          >
            insig
            <span style={{ color: "#3b82f6" }}>trade</span>
          </div>
        </div>

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            flexGrow: 1,
            marginTop: "20px",
          }}
        >
          {formatLabel && (
            <div style={{ display: "flex", marginBottom: "20px" }}>
              <div
                style={{
                  display: "flex",
                  padding: "8px 16px",
                  borderRadius: "999px",
                  backgroundColor: "rgba(59,130,246,0.18)",
                  color: "#60a5fa",
                  fontSize: "20px",
                  fontWeight: 600,
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                  border: "1px solid rgba(96,165,250,0.3)",
                }}
              >
                {formatLabel}
              </div>
            </div>
          )}

          <div
            style={{
              fontSize: title.length > 70 ? "52px" : "64px",
              fontWeight: 700,
              color: "white",
              lineHeight: 1.1,
              letterSpacing: "-0.02em",
              maxWidth: "1080px",
              display: "flex",
            }}
          >
            {title}
          </div>
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            paddingTop: "24px",
            borderTop: "1px solid rgba(255,255,255,0.1)",
          }}
        >
          <div
            style={{
              display: "flex",
              fontSize: "22px",
              color: "rgba(255,255,255,0.6)",
              fontWeight: 500,
            }}
          >
            {category}
          </div>
          <div
            style={{
              display: "flex",
              fontSize: "20px",
              color: "rgba(255,255,255,0.4)",
            }}
          >
            insigtrade.com
          </div>
        </div>
      </div>
    ),
    { ...size }
  );
}
