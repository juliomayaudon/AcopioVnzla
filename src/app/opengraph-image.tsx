import { ImageResponse } from "next/og";

export const alt = "Acopio Venezuela — Gestión de Centros de Acopio";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// Imagen de previsualización (Open Graph) que ven Instagram, WhatsApp, etc.
export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #0f1f5c 0%, #1B3078 55%, #1e3a8a 100%)",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center" }}>
          <div
            style={{
              width: 96,
              height: 96,
              borderRadius: 24,
              background: "#1B3078",
              border: "3px solid rgba(255,255,255,0.15)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              marginRight: 28,
              fontSize: 56,
              fontWeight: 900,
            }}
          >
            <span style={{ color: "#ffffff" }}>A</span>
            <span style={{ color: "#00A8E8" }}>V</span>
          </div>
          <div style={{ display: "flex", fontSize: 84, fontWeight: 800, letterSpacing: -2 }}>
            <span style={{ color: "#ffffff" }}>Acopio</span>
            <span style={{ color: "#00A8E8" }}>&nbsp;Venezuela</span>
          </div>
        </div>
        <div style={{ display: "flex", marginTop: 28, fontSize: 34, color: "rgba(255,255,255,0.72)" }}>
          Gestión de Centros de Acopio Humanitario
        </div>
        <div style={{ display: "flex", marginTop: 44, height: 8, width: 220, borderRadius: 4, background: "#00A8E8" }} />
      </div>
    ),
    { ...size }
  );
}
