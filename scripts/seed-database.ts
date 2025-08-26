import { PrismaClient, Language } from "@prisma/client";

const prisma = new PrismaClient();

const sampleWords = [
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
    examples: ["I ate an apple for breakfast", "The apple tree is blooming"],
  },
  {
    word: "Bear",
    language: Language.en,
    translation: "Bere",
    definition: "A type of animal",
    pronunciation: "/bɛər/",
    partOfSpeech: "noun",
    examples: ["The bear lives in the forest", "Bears hibernate in winter"],
  },
  {
    word: "Cat",
    language: Language.en,
    translation: "Katse",
    definition: "A small domestic animal",
    pronunciation: "/kæt/",
    partOfSpeech: "noun",
    examples: [
      "The cat is sleeping on the couch",
      "My cat loves to play with yarn",
    ],
  },
  {
    word: "Dog",
    language: Language.en,
    translation: "Ntša",
    definition: "A domestic animal, often kept as a pet",
    pronunciation: "/dɔːɡ/",
    partOfSpeech: "noun",
    examples: ["The dog is barking loudly", "Dogs are loyal companions"],
  },
  {
    word: "Elephant",
    language: Language.en,
    translation: "Tlou",
    definition: "A large African or Asian mammal",
    pronunciation: "/ˈɛlɪfənt/",
    partOfSpeech: "noun",
    examples: [
      "The elephant has large ears",
      "Elephants are intelligent animals",
    ],
  },
  {
    word: "Fish",
    language: Language.en,
    translation: "Tlhapi",
    definition: "An aquatic animal",
    pronunciation: "/fɪʃ/",
    partOfSpeech: "noun",
    examples: ["The fish swims in the river", "We caught many fish today"],
  },
  {
    word: "Good",
    language: Language.en,
    translation: "Botoka",
    definition: "Having the right or desired qualities",
    pronunciation: "/ɡʊd/",
    partOfSpeech: "adjective",
    examples: ["This is a good book", "She is a good teacher"],
  },
  {
    word: "House",
    language: Language.en,
    translation: "Ntlo",
    definition: "A building for human habitation",
    pronunciation: "/haʊs/",
    partOfSpeech: "noun",
    examples: [
      "Their house is very beautiful",
      "We bought a new house last year",
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
  {
    word: "Ntlo",
    language: Language.tn,
    translation: "House",
    definition: "Lefelo la go nna",
    pronunciation: "/n-tlo/",
    partOfSpeech: "leina",
    examples: [
      "Ntlo ya bone e bontle thata",
      "Re rekile ntlo e ntšha ngwaga o o fetileng",
    ],
  },
  {
    word: "Botoka",
    language: Language.tn,
    translation: "Good",
    definition: "Se se nang le mekgwa e e siameng",
    pronunciation: "/bo-to-ka/",
    partOfSpeech: "lesupi",
    examples: ["Eno ke buka e e botoka", "Ke morutabana yo o botoka"],
  },
];

async function main() {
  console.log("Starting database seed...");

  // Clear existing words (optional)
  await prisma.word.deleteMany();
  console.log("Cleared existing words");

  // Add new words
  for (const wordData of sampleWords) {
    await prisma.word.create({
      data: wordData,
    });
  }

  console.log(`Seeded ${sampleWords.length} words`);
  console.log("Database seed completed!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
