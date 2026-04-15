import { NextResponse } from "next/server";

export async function GET(request) {
  const forwarded = request.headers.get("x-forwarded-for");
  const ip = forwarded ? forwarded.split(",")[0].trim() : "unknown";
  return NextResponse.json({ ip });
}
