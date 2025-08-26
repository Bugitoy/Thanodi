import { NextRequest, NextResponse } from "next/server";
import { Language } from "@prisma/client";
import { getWordsByLanguage } from "@/lib/db-utils";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const language = searchParams.get("language") as Language;
    const limit = parseInt(searchParams.get("limit") || "20");
    const userId = searchParams.get("userId");

    if (!language || !Object.values(Language).includes(language)) {
      return NextResponse.json(
        { error: "Valid language parameter is required" },
        { status: 400 },
      );
    }

    const words = await getWordsByLanguage(language, limit, userId || undefined);

    // If userId is provided, we could enhance with user-specific data
    // For now, just return the words
    return NextResponse.json(words);
  } catch (error) {
    console.error("Error fetching words:", error);
    return NextResponse.json(
      { error: "Failed to fetch words" },
      { status: 500 },
    );
  }
}
