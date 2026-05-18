import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import { join } from "node:path";

export const runtime = "nodejs";
export const size = { width: 64, height: 64 };
export const contentType = "image/png";

// A higher-contrast favicon variant: the cocoa monogram sits big on a
// cream disc inside a dark cocoa tile, so it stays legible and stands
// out in a browser tab strip instead of washing out on a light bg.
export default async function Icon() {
  const buf = await readFile(
    join(process.cwd(), "public", "Monogram-Transparant-Cocoa.png"),
  );
  const src = `data:image/png;base64,${buf.toString("base64")}`;

  return new ImageResponse(
    (
      <div
        style={{
          display: "flex",
          width: "100%",
          height: "100%",
          alignItems: "center",
          justifyContent: "center",
          background: "#3F2D22",
          borderRadius: 14,
        }}
      >
        <div
          style={{
            display: "flex",
            width: "82%",
            height: "82%",
            alignItems: "center",
            justifyContent: "center",
            background: "#F4ECDD",
            borderRadius: 999,
          }}
        >
          <img src={src} width={64} height={64} style={{ width: "68%", height: "68%" }} alt="" />
        </div>
      </div>
    ),
    size,
  );
}
