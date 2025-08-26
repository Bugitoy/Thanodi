import prisma from "@/db/prisma";
import { Language } from "@prisma/client";

export type DatabaseWord = {
  id: string;
  word: string;
  language: Language;
  translation: string;
  definition: string;
  pronunciation?: string | null;
  audioUrl?: string | null;
  partOfSpeech: string;
  examples: string[];
  isStarred?: boolean;
};

// Get words by language
export async function getWordsByLanguage(language: Language, limit = 20, userId?: string) {
  try {
    const words = await prisma.word.findMany({
      where: { language },
      take: limit,
      orderBy: { word: "asc" },
      include: userId
        ? {
            StarredWords: {
              where: { userId },
            },
          }
        : undefined,
    });

    return words.map((word) => ({
      ...word,
      isStarred: userId ? (word as any).StarredWords?.length > 0 : false,
      StarredWords: undefined, // Remove this from the response
    }));
  } catch (error) {
    console.error("Error fetching words by language:", error);
    return [];
  }
}

// Search words
export async function searchWords(
  query: string,
  language: Language,
  limit = 20,
  userId?: string,
) {
  try {
    const words = await prisma.word.findMany({
      where: {
        language,
        OR: [
          { word: { contains: query, mode: "insensitive" } },
          { translation: { contains: query, mode: "insensitive" } },
          { definition: { contains: query, mode: "insensitive" } },
        ],
      },
      take: limit,
      orderBy: { word: "asc" },
      include: userId
        ? {
            StarredWords: {
              where: { userId },
            },
          }
        : undefined,
    });

    return words.map((word) => ({
      ...word,
      isStarred: userId ? (word as any).StarredWords?.length > 0 : false,
      StarredWords: undefined, // Remove this from the response
    }));
  } catch (error) {
    console.error("Error searching words:", error);
    return [];
  }
}

// Get words by first letter
export async function getWordsByLetter(
  letter: string,
  language: Language,
  limit = 20,
  userId?: string,
) {
  try {
    const words = await prisma.word.findMany({
      where: {
        language,
        word: { startsWith: letter, mode: "insensitive" },
      },
      take: limit,
      orderBy: { word: "asc" },
      include: userId
        ? {
            StarredWords: {
              where: { userId },
            },
          }
        : undefined,
    });

    return words.map((word) => ({
      ...word,
      isStarred: userId ? (word as any).StarredWords?.length > 0 : false,
      StarredWords: undefined, // Remove this from the response
    }));
  } catch (error) {
    console.error("Error fetching words by letter:", error);
    return [];
  }
}

// Get starred words for a user
export async function getStarredWords(userId: string) {
  try {
    const starredWords = await prisma.starredWord.findMany({
      where: { userId },
      include: { Word: true },
      orderBy: { Word: { word: "asc" } },
    });

    return starredWords.map((starred) => ({
      ...starred.Word,
      isStarred: true,
    }));
  } catch (error) {
    console.error("Error fetching starred words:", error);
    return [];
  }
}

// Toggle starred word for a user
export async function toggleStarredWord(userId: string, wordId: string) {
  try {
    const existing = await prisma.starredWord.findUnique({
      where: { userId_wordId: { userId, wordId } },
    });

    if (existing) {
      // Remove star
      await prisma.starredWord.delete({
        where: { userId_wordId: { userId, wordId } },
      });
      return false;
    } else {
      // Add star
      await prisma.starredWord.create({
        data: { userId, wordId },
      });
      return true;
    }
  } catch (error) {
    console.error("Error toggling starred word:", error);
    throw error;
  }
}

// Get a single word by ID
export async function getWordById(id: string, userId?: string) {
  try {
    const word = await prisma.word.findUnique({
      where: { id },
      include: userId
        ? {
            StarredWords: {
              where: { userId },
            },
          }
        : undefined,
    });

    if (!word) return null;

    return {
      ...word,
      isStarred: userId ? (word as any).StarredWords?.length > 0 : false,
      StarredWords: undefined, // Remove this from the response
    };
  } catch (error) {
    console.error("Error fetching word by ID:", error);
    return null;
  }
}

// Seed database with mock data (for development)
export async function seedDatabase() {
  try {
    const existingWords = await prisma.word.count();
    if (existingWords > 0) {
      console.log("Database already has words, skipping seed.");
      return;
    }

    const mockWords = [
      {
        word: "Amazing",
        language: Language.en,
        translation: "Makatsa",
        definition: "Describes something that is spectacular",
        pronunciation: "/əˈmeɪzɪŋ/",
        partOfSpeech: "adjective",
        examples: [
          "Her eyes were amazing and beautiful in every sense of the word",
        ],
      },
      {
        word: "Apple",
        language: Language.en,
        translation: "Apole",
        definition: "A type of fruit",
        pronunciation: "/ˈæpəl/",
        partOfSpeech: "noun",
        examples: [
          "I ate an apple for breakfast",
          "The apple tree is blooming",
        ],
      },
      {
        word: "Makatsa",
        language: Language.tn,
        translation: "Amazing",
        definition: "Go bontsha selo se se gakgamatsang",
        pronunciation: "/ma-ka-tsa/",
        partOfSpeech: "lesupi",
        examples: ["Matlho a gagwe a ne a makatsa e bile a bontle"],
      },
      // Add more words as needed
    ];

    await prisma.word.createMany({
      data: mockWords,
    });

    console.log("Database seeded successfully!");
  } catch (error) {
    console.error("Error seeding database:", error);
    throw error;
  }
}

// Get user information with subscription details
export async function getUserInfo(userId: string) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        Subscription: true,
      },
    });

    if (!user) return null;

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      image: user.image,
      plan: user.plan,
      customerId: user.customerId,
      createdAt: user.createdAt,
      subscription: user.Subscription,
    };
  } catch (error) {
    console.error("Error fetching user info:", error);
    return null;
  }
}
