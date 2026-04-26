// Dynamic OG image generator using next/og.
// Returns a 1200x630 PNG suitable for Twitter/LinkedIn/Slack/etc.
//
// Usage:
//   /api/og?title=Best%20AI%20Tools&category=AI%20for%20Traders&format=listicle
//
// Used by:
//   - blog post opengraph-image.tsx (per-post branded shares)
//   - featuredImage fallback for posts that don't ship a custom image
//   - tool review pages
//   - homepage default OG

import { ImageResponse } from "next/og";
import type { NextRequest } from "next/server";

export const runtime = "edge";

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

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const title =
    searchParams.get("title") ?? "AI & Automation for Smarter Trading";
  const category = searchParams.get("category") ?? "Insigtrade";
  const format = searchParams.get("format") ?? "";
  const formatLabel = FORMAT_LABELS[format] ?? "";

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
        {/* Top: brand */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "14px",
          }}
        >
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

        {/* Middle: title block (flex grow to push footer) */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            flexGrow: 1,
            marginTop: "20px",
          }}
        >
          {/* Format pill */}
          {formatLabel && (
            <div
              style={{
                display: "flex",
                marginBottom: "20px",
              }}
            >
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

          {/* Title */}
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

        {/* Bottom: category + tagline */}
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
    {
      width: 1200,
      height: 630,
    }
  );
}
