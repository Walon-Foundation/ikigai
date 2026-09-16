import { ImageResponse } from "next/og";

export const size = { width: 32, height: 32 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    <div
      style={{
        width: 32,
        height: 32,
        background: "#1A5C3A",
        borderRadius: 8,
        display: "flex",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Stem */}
      <div
        style={{
          position: "absolute",
          bottom: 5,
          left: 15,
          width: 2,
          height: 14,
          background: "white",
          borderRadius: 2,
        }}
      />
      {/* Left leaf */}
      <div
        style={{
          position: "absolute",
          bottom: 12,
          left: 4,
          width: 11,
          height: 7,
          background: "white",
          borderRadius: "50%",
          transform: "rotate(35deg)",
        }}
      />
      {/* Right leaf */}
      <div
        style={{
          position: "absolute",
          bottom: 16,
          right: 4,
          width: 11,
          height: 7,
          background: "rgba(255,255,255,0.82)",
          borderRadius: "50%",
          transform: "rotate(-35deg)",
        }}
      />
    </div>,
    { ...size },
  );
}
