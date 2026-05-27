// Default OG image for the homepage + any route without its own opengraph-image.
import { ImageResponse } from "next/og";

export const alt = "Insigtrade: AI & Automation for Smarter Trading";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const runtime = "edge";

export default async function Image() {
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
          backgroundColor: "#0f172a",
          backgroundImage:
            "radial-gradient(circle at 30% 20%, rgba(59,130,246,0.3), transparent 55%), radial-gradient(circle at 70% 80%, rgba(16,185,129,0.2), transparent 50%)",
          fontFamily: "system-ui",
        }}
      >
        <div
          style={{
            width: "120px",
            height: "120px",
            borderRadius: "28px",
            background: "linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "0 16px 48px rgba(59,130,246,0.5)",
            marginBottom: "40px",
          }}
        >
          <svg
            width="64"
            height="64"
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
            fontSize: "84px",
            fontWeight: 800,
            color: "white",
            letterSpacing: "-0.03em",
            display: "flex",
            marginBottom: "16px",
          }}
        >
          insig
          <span style={{ color: "#3b82f6" }}>trade</span>
        </div>

        <div
          style={{
            fontSize: "32px",
            color: "rgba(255,255,255,0.7)",
            fontWeight: 500,
            display: "flex",
          }}
        >
          AI & Automation for Smarter Trading
        </div>

        <div
          style={{
            fontSize: "22px",
            color: "rgba(255,255,255,0.4)",
            fontWeight: 400,
            display: "flex",
            marginTop: "32px",
          }}
        >
          insigtrade.com
        </div>
      </div>
    ),
    { ...size }
  );
}
