import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json(
    { error: "Not implemented — built in Phase 5" },
    { status: 501 },
  );
}
