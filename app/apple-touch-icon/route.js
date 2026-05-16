import { ImageResponse } from "next/og";
import { readFileSync } from "fs";
import { join } from "path";

// icon.png is 1254x1254 — square, no cropping needed, just scale to 180x180.
export async function GET() {
  const data = readFileSync(join(process.cwd(), "app", "icon.png"));
  const src = `data:image/png;base64,${data.toString("base64")}`;

  return new ImageResponse(
    (
      <div
        style={{
          width: 180,
          height: 180,
          display: "flex",
          overflow: "hidden",
        }}
      >
        <img src={src} width={180} height={180} style={{ flexShrink: 0 }} />
      </div>
    ),
    { width: 180, height: 180 }
  );
}
