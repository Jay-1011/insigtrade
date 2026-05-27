// Branded favicon, generated at build time. Next.js wires this in automatically.
import { ImageResponse } from "next/og";

export const size = { width: 32, height: 32 };
export const contentType = "image/png";
export const runtime = "edge";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          background: "linear-gradient(135deg, #0b1220 0%, #1e3a8a 60%, #2563eb 100%)",
          borderRadius: "7px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          position: "relative",
        }}
      >
        {/* Upward trend line, cyan accent */}
        <svg
          width="32"
          height="32"
          viewBox="0 0 32 32"
          fill="none"
          stroke="#22d3ee"
          strokeWidth="2"
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
            transform: "translateY(1px)",
          }}
        >
          <div
            style={{
              width: 4,
              height: 4,
              borderRadius: 999,
              background: "#ffffff",
              marginBottom: 2,
            }}
          />
          <div
            style={{
              width: 4,
              height: 12,
              borderRadius: 2,
              background: "#ffffff",
            }}
          />
        </div>
      </div>
    ),
    { ...size }
  );
}
