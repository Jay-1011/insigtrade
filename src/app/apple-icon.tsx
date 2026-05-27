// Apple touch icon, used when users add the site to iOS home screen.
import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";
export const runtime = "edge";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          background: "linear-gradient(135deg, #0b1220 0%, #1e3a8a 60%, #2563eb 100%)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          position: "relative",
        }}
      >
        {/* Upward trend line, cyan accent */}
        <svg
          width="180"
          height="180"
          viewBox="0 0 32 32"
          fill="none"
          stroke="#22d3ee"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{ position: "absolute", inset: 0, opacity: 0.85 }}
        >
          <polyline points="3 22 11 14 16 18 27 6" />
        </svg>
        {/* Monogram 'i' */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            position: "relative",
            zIndex: 1,
            transform: "translateY(4px)",
          }}
        >
          <div
            style={{
              width: 22,
              height: 22,
              borderRadius: 999,
              background: "#ffffff",
              marginBottom: 10,
            }}
          />
          <div
            style={{
              width: 22,
              height: 68,
              borderRadius: 8,
              background: "#ffffff",
            }}
          />
        </div>
      </div>
    ),
    { ...size }
  );
}
