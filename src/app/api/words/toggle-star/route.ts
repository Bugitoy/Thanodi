import { NextRequest, NextResponse } from "next/server";
import { toggleStarredWord } from "@/lib/db-utils";

export async function POST(request: NextRequest) {
  try {
    const { userId, wordId } = await request.json();

    if (!userId || !wordId) {
      return NextResponse.json(
        { error: "User ID and Word ID are required" },
        { status: 400 },
      );
    }

    const isStarred = await toggleStarredWord(userId, wordId);

    return NextResponse.json({ isStarred });
  } catch (error) {
    console.error("Error toggling starred word:", error);
    return NextResponse.json(
      { error: "Failed to toggle starred word" },
      { status: 500 },
    );
  }
}
