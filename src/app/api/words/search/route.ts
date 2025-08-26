import { NextRequest, NextResponse } from "next/server";
import { Language } from "@prisma/client";
import { searchWords } from "@/lib/db-utils";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("query");
    const language = searchParams.get("language") as Language;
    const limit = parseInt(searchParams.get("limit") || "20");
    const userId = searchParams.get("userId");

    if (!query) {
      return NextResponse.json(
        { error: "Query parameter is required" },
        { status: 400 },
      );
    }

    if (!language || !Object.values(Language).includes(language)) {
      return NextResponse.json(
        { error: "Valid language parameter is required" },
        { status: 400 },
      );
    }

    const words = await searchWords(query, language, limit, userId || undefined);
    return NextResponse.json(words);
  } catch (error) {
    console.error("Error searching words:", error);
    return NextResponse.json(
      { error: "Failed to search words" },
      { status: 500 },
    );
  }
}
