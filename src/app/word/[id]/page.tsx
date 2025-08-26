"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import NextLayout from "@/components/NextLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, Star, Volume2, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useWords, useWordById, DictionaryWord } from "@/lib/words-context";

export default function WordDetailPage() {
  const params = useParams();
  const wordId = params.id as string;
  const { toggleStarred } = useWords();
  const { data: word, isLoading, error } = useWordById(wordId);

  const playPronunciation = async (word: DictionaryWord) => {
    // 1. Try stored audio file
    if (word.audioUrl) {
      try {
        const audio = new Audio(word.audioUrl);
        await audio.play();
        return;
      } catch (error) {
        console.error('Error playing audio file:', error);
        // Continue to Google TTS fallback
      }
    }
    // 2. Try Google TTS API
    try {
      const params = new URLSearchParams({ word: word.word, lang: word.language === 'tn' ? 'en-US' : 'en-US' });
      const response = await fetch(`/api/Google%20TTS/tts?${params.toString()}`);
      if (!response.ok) throw new Error('Google TTS failed');
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const audio = new Audio(url);
      await audio.play();
      return;
    } catch (err) {
      console.error('Google TTS fallback failed:', err);
      // Continue to browser TTS fallback
    }
    // 3. Fallback: Browser TTS
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(word.word);
      utterance.lang = word.language === 'tn' ? 'en-US' : 'en-US';
      utterance.rate = 0.8;
      utterance.pitch = 1.0;
      utterance.volume = 1.0;
      window.speechSynthesis.speak(utterance);
    } else {
      alert(`Pronunciation: ${word.word}`);
    }
  };

  const handleToggleStarred = async (wordId: string) => {
    try {
      await toggleStarred(wordId);
    } catch (error) {
      console.error("Error toggling starred status:", error);
    }
  };

  if (isLoading) {
    return (
      <NextLayout>
        <div className="container mx-auto p-4 min-h-screen bg-gradient-to-br from-cream-100 to-blue-100">
          <div className="flex justify-center items-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
            <span className="ml-2 text-gray-600">Loading word details...</span>
          </div>
        </div>
      </NextLayout>
    );
  }

  if (error || !word) {
    return (
      <NextLayout>
        <div className="container mx-auto p-4 min-h-screen bg-gradient-to-br from-cream-100 to-blue-100">
          <div className="text-center py-12 space-y-4">
            <h2 className="text-2xl font-bold text-gray-600">Word Not Found</h2>
            <p className="text-gray-500">
              The word you're looking for doesn't exist or has been removed.
            </p>
            <Link href="/">
              <Button className="bg-orange-500 hover:bg-orange-600 text-white rounded-lg">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Dictionary
              </Button>
            </Link>
          </div>
        </div>
      </NextLayout>
    );
  }

  return (
    <NextLayout>
      <div className="container mx-auto p-4 space-y-6 min-h-screen bg-gradient-to-br from-cream-100 to-blue-100">
        {/* Back Button */}
        <div className="max-w-4xl mx-auto">
          <Link href="/">
            <Button
              variant="outline"
              className="border-blue-200 hover:bg-blue-50 rounded-lg"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Dictionary
            </Button>
          </Link>
        </div>

        {/* Word Details */}
        <div className="max-w-4xl mx-auto">
          <Card className="border-blue-200 shadow-lg overflow-hidden">
            <CardContent className="p-8 space-y-6">
              {/* Header */}
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h1 className="text-4xl font-bold text-gray-800 mb-2">
                    {word.word}
                  </h1>
                  <p className="text-2xl text-orange-600 font-semibold mb-1">
                    {word.translation}
                  </p>
                  {word.pronunciation && (
                    <p className="text-lg text-gray-500 italic">
                      {word.pronunciation}
                    </p>
                  )}
                </div>
                <div className="flex items-center space-x-3">
                  {word.pronunciation && (
                    <Button
                      variant="outline"
                      size="lg"
                      onClick={() => playPronunciation(word)}
                      className="border-blue-200 hover:bg-blue-50 rounded-lg"
                    >
                      <Volume2 className="w-5 h-5 mr-2" />
                      Play
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    size="lg"
                    onClick={() => handleToggleStarred(word.id)}
                    className={cn(
                      "rounded-lg border-2 transition-all duration-200",
                      word.isStarred
                        ? "border-yellow-400 bg-yellow-50 hover:bg-yellow-100"
                        : "border-blue-200 hover:bg-blue-50",
                    )}
                  >
                    <Star
                      className={cn(
                        "w-5 h-5 mr-2",
                        word.isStarred
                          ? "fill-yellow-400 text-yellow-400"
                          : "text-gray-400",
                      )}
                    />
                    {word.isStarred ? "Saved" : "Save"}
                  </Button>
                </div>
              </div>

              {/* Language and Part of Speech */}
              <div className="flex items-center space-x-4">
                <span
                  className={cn(
                    "px-3 py-1 rounded-full text-sm font-medium",
                    word.language === "en"
                      ? "bg-green-100 text-green-700"
                      : "bg-purple-100 text-purple-700",
                  )}
                >
                  {word.language === "en" ? "English" : "Setswana"}
                </span>
                <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm font-medium">
                  {word.partOfSpeech}
                </span>
              </div>

              {/* Definition */}
              <div className="space-y-2">
                <h3 className="text-xl font-semibold text-gray-800">
                  Definition
                </h3>
                <p className="text-gray-700 text-lg leading-relaxed">
                  {word.definition}
                </p>
              </div>

              {/* Examples */}
              {word.examples && word.examples.length > 0 && (
                <div className="space-y-3">
                  <h3 className="text-xl font-semibold text-gray-800">
                    Examples
                  </h3>
                  <div className="space-y-2">
                    {word.examples.map((example, index) => (
                      <div
                        key={index}
                        className="bg-gray-50 border-l-4 border-orange-400 p-4 rounded-r-lg"
                      >
                        <p className="text-gray-700 italic">"{example}"</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Audio URL (if available) */}
              {word.audioUrl && (
                <div className="space-y-2">
                  <h3 className="text-xl font-semibold text-gray-800">Audio</h3>
                  <audio controls className="w-full">
                    <source src={word.audioUrl} type="audio/mpeg" />
                    Your browser does not support the audio element.
                  </audio>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </NextLayout>
  );
}
