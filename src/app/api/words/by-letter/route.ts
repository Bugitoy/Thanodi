import { NextRequest, NextResponse } from "next/server";
import { Language } from "@prisma/client";
import { getWordsByLetter } from "@/lib/db-utils";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const letter = searchParams.get("letter");
    const language = searchParams.get("language") as Language;
    const limit = parseInt(searchParams.get("limit") || "20");
    const userId = searchParams.get("userId");

    if (!letter) {
      return NextResponse.json(
        { error: "Letter parameter is required" },
        { status: 400 },
      );
    }

    if (!language || !Object.values(Language).includes(language)) {
      return NextResponse.json(
        { error: "Valid language parameter is required" },
        { status: 400 },
      );
    }

    const words = await getWordsByLetter(letter, language, limit, userId || undefined);
    return NextResponse.json(words);
  } catch (error) {
    console.error("Error fetching words by letter:", error);
    return NextResponse.json(
      { error: "Failed to fetch words by letter" },
      { status: 500 },
    );
  }
}
