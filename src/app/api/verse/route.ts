import { NextResponse } from "next/server";
import { fetchVerse, EsvNotFoundError, EsvApiError } from "@/lib/esv";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const ref = searchParams.get("ref")?.trim();

  if (!ref) {
    return NextResponse.json({ error: "Missing ref parameter" }, { status: 400 });
  }

  try {
    const passage = await fetchVerse(ref);
    return NextResponse.json(passage);
  } catch (err) {
    if (err instanceof EsvNotFoundError) {
      return NextResponse.json({ error: `No passage found for "${ref}".` }, { status: 400 });
    }
    if (err instanceof EsvApiError) {
      return NextResponse.json({ error: err.message }, { status: err.status === 429 ? 429 : 502 });
    }
    return NextResponse.json({ error: "Failed to fetch verse." }, { status: 502 });
  }
}
