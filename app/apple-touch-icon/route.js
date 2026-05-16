import { ImageResponse } from "next/og";
import { readFileSync } from "fs";
import { join } from "path";

// Source favicon.ico is a 1024x1536 PNG.
// Scale to fill 180px wide → rendered height ≈ 270px → center-crop to 180x180.
const SCALED_H = Math.round((1536 / 1024) * 180); // 270
const OFFSET_Y = -Math.round((SCALED_H - 180) / 2); // -45

export async function GET() {
  const data = readFileSync(join(process.cwd(), "app", "favicon.ico"));
  const src = `data:image/png;base64,${data.toString("base64")}`;

  return new ImageResponse(
    (
      <div
        style={{
          width: 180,
          height: 180,
          display: "flex",
          overflow: "hidden",
          alignItems: "flex-start",
        }}
      >
        <img
          src={src}
          width={180}
          height={SCALED_H}
          style={{ marginTop: OFFSET_Y, flexShrink: 0 }}
        />
      </div>
    ),
    { width: 180, height: 180 }
  );
}
