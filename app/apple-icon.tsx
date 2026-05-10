import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    <div
      style={{
        width: 180,
        height: 180,
        background: "#1A5C3A",
        display: "flex",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Stem */}
      <div
        style={{
          position: "absolute",
          bottom: 28,
          left: 84,
          width: 12,
          height: 80,
          background: "white",
          borderRadius: 8,
        }}
      />
      {/* Left leaf */}
      <div
        style={{
          position: "absolute",
          bottom: 70,
          left: 22,
          width: 64,
          height: 40,
          background: "white",
          borderRadius: "50%",
          transform: "rotate(35deg)",
        }}
      />
      {/* Right leaf */}
      <div
        style={{
          position: "absolute",
          bottom: 95,
          right: 22,
          width: 64,
          height: 40,
          background: "rgba(255,255,255,0.82)",
          borderRadius: "50%",
          transform: "rotate(-35deg)",
        }}
      />
    </div>,
    { ...size }
  );
}
