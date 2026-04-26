// Initials-based avatar with deterministic gradient. Used for author bios + admin UI.
// Falls back to a real image URL if `src` is provided.

interface AvatarProps {
  name: string;
  src?: string;
  size?: number;
  className?: string;
}

const PALETTE = [
  ["#3b82f6", "#2563eb"], // blue
  ["#10b981", "#059669"], // green
  ["#8b5cf6", "#7c3aed"], // purple
  ["#f59e0b", "#d97706"], // amber
  ["#ec4899", "#db2777"], // pink
  ["#06b6d4", "#0891b2"], // cyan
];

function hashString(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + (parts[parts.length - 1][0] ?? "")).toUpperCase();
}

export default function Avatar({
  name,
  src,
  size = 48,
  className = "",
}: AvatarProps) {
  if (src) {
    return (
      /* eslint-disable-next-line @next/next/no-img-element */
      <img
        src={src}
        alt={name}
        width={size}
        height={size}
        className={`rounded-full object-cover ${className}`}
        style={{ width: size, height: size }}
        loading="lazy"
      />
    );
  }

  const initials = getInitials(name);
  const [from, to] = PALETTE[hashString(name) % PALETTE.length];

  return (
    <div
      className={`shrink-0 rounded-full flex items-center justify-center font-bold text-white ${className}`}
      style={{
        width: size,
        height: size,
        background: `linear-gradient(135deg, ${from} 0%, ${to} 100%)`,
        fontSize: size * 0.4,
        letterSpacing: "-0.02em",
      }}
      aria-label={name}
      role="img"
    >
      {initials}
    </div>
  );
}
