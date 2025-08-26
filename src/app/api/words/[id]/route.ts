import { NextRequest, NextResponse } from "next/server";
import { getWordById } from "@/lib/db-utils";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");

    const word = await getWordById(id, userId || undefined);

    if (!word) {
      return NextResponse.json({ error: "Word not found" }, { status: 404 });
    }

    return NextResponse.json(word);
  } catch (error) {
    console.error("Error fetching word:", error);
    return NextResponse.json(
      { error: "Failed to fetch word" },
      { status: 500 },
    );
  }
}
