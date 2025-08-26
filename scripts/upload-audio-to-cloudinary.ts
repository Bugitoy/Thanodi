// scripts/upload-audio-to-cloudinary.ts
import "dotenv/config";
import path from "path";
import fs from "fs/promises";
import cloudinary from "@/lib/cloudinary"; // adjust path
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const AUDIO_DIR = path.join(process.cwd(), "public/audio");

async function uploadAllAudio() {
  const files = await fs.readdir(AUDIO_DIR);

  for (const file of files) {
    if (!file.endsWith(".mp3")) continue;

    const word = path.basename(file, ".mp3").toLowerCase(); // "hello.mp3" → "hello"

    try {
      // Upload to Cloudinary
      const uploadResult = await cloudinary.uploader.upload(
        path.join(AUDIO_DIR, file),
        {
          resource_type: "video", // Cloudinary treats audio as "video"
          folder: "dictionary-audio", // optional folder in Cloudinary
          public_id: word,
          overwrite: true,
        }
      );

      const cloudinaryUrl = uploadResult.secure_url;

      // Update Prisma Word record with audioUrl
      const updated = await prisma.word.updateMany({
        where: {
          word: {
            equals: word,
            mode: "insensitive",
          },
        },
        data: {
          audioUrl: cloudinaryUrl,
        },
      });

      console.log(`✅ Updated '${word}' → ${cloudinaryUrl} (${updated.count} records)`);
    } catch (error) {
      console.error(`❌ Error processing ${file}:`, error);
    }
  }

  await prisma.$disconnect();
}

uploadAllAudio();
