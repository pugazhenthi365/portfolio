import { ImageResponse } from "next/og";
import { getPortfolioContent } from "@/lib/content/repository";

export const alt = "Pugazhenthi R — Software Engineer";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const revalidate = 3600;

export default async function OpenGraphImage() {
  const { profile } = await getPortfolioContent();
  const focus = profile.positioning.split("|").map((s) => s.trim()).slice(1, 4);

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "#ffffff",
          padding: "72px 80px",
          fontFamily: "sans-serif",
          backgroundImage: "linear-gradient(#EEF2F8 1px, transparent 1px), linear-gradient(90deg, #EEF2F8 1px, transparent 1px)",
          backgroundSize: "48px 48px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 16, color: "#64748B", fontSize: 24, letterSpacing: 2 }}>
          <div style={{ width: 14, height: 14, background: "#2563EB" }} />
          {`${profile.title.toUpperCase()} — ${profile.location.toUpperCase()}`}
        </div>
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ display: "flex", fontSize: 96, fontWeight: 700, color: "#111827", letterSpacing: -4, lineHeight: 1 }}>
            {profile.full_name}
            <span style={{ color: "#2563EB" }}>.</span>
          </div>
          <div style={{ marginTop: 28, fontSize: 36, color: "#334155", maxWidth: 980, lineHeight: 1.3 }}>
            {profile.headline}
          </div>
        </div>
        <div style={{ display: "flex", gap: 40, borderTop: "2px solid #E5EAF2", paddingTop: 28 }}>
          {focus.map((f, i) => (
            <div key={f} style={{ display: "flex", gap: 12, fontSize: 26, color: "#111827" }}>
              <span style={{ color: "#2563EB" }}>{`0${i + 1}`}</span>
              {f}
            </div>
          ))}
        </div>
      </div>
    ),
    size,
  );
}
