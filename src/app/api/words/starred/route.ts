import { NextRequest, NextResponse } from "next/server";
import { getStarredWords } from "@/lib/db-utils";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 },
      );
    }

    const words = await getStarredWords(userId);
    return NextResponse.json(words);
  } catch (error) {
    console.error("Error fetching starred words:", error);
    return NextResponse.json(
      { error: "Failed to fetch starred words" },
      { status: 500 },
    );
  }
}
