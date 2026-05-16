import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          background: "#1C1410",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {/* Outer ring */}
        <div
          style={{
            width: 108,
            height: 108,
            borderRadius: "50%",
            border: "1.5px solid #3A2C24",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {/* Inner accent dot */}
          <div
            style={{
              width: 18,
              height: 18,
              borderRadius: "50%",
              background: "#527252",
            }}
          />
        </div>
      </div>
    ),
    size
  );
}
