"use client";

import { useState } from "react";
import Link from "next/link";
import NextLayout from "@/components/NextLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Search, X, Star, Volume2, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Language } from "@prisma/client";
import {
  useWords,
  useWordsByLanguage,
  useWordSearch,
  useWordsByLetter,
  useStarredWords,
  DictionaryWord,
} from "@/lib/words-context";


export default function HomePage() {
  const [language, setLanguage] = useState<Language>(Language.en);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedLetter, setSelectedLetter] = useState<string>("");
  const [activeTab, setActiveTab] = useState<'all' | 'saved'>('all');
  const { toggleStarred } = useWords();
  const { data: starredWords, isLoading: isLoadingStarred, error: errorStarred } = useStarredWords();

  // Use different queries based on current state
  const {
    data: wordsByLanguage,
    isLoading: isLoadingByLanguage,
    error: errorByLanguage,
  } = useWordsByLanguage(language, 20);

  const {
    data: searchResults,
    isLoading: isLoadingSearch,
    error: errorSearch,
  } = useWordSearch(searchQuery, language, 20);

  const {
    data: wordsByLetter,
    isLoading: isLoadingByLetter,
    error: errorByLetter,
  } = useWordsByLetter(selectedLetter, language, 20);

  // Determine which data to show
  const getDisplayData = () => {
    if (searchQuery) {
      return {
        data: searchResults || [],
        isLoading: isLoadingSearch,
        error: errorSearch,
      };
    } else if (selectedLetter) {
      return {
        data: wordsByLetter || [],
        isLoading: isLoadingByLetter,
        error: errorByLetter,
      };
    } else {
      return {
        data: wordsByLanguage || [],
        isLoading: isLoadingByLanguage,
        error: errorByLanguage,
      };
    }
  };

  const { data: filteredWords, isLoading, error } = getDisplayData();

  const clearSearch = () => {
    setSearchQuery("");
    setSelectedLetter("");
  };

  const handleToggleStarred = (wordId: string) => {
    toggleStarred(wordId).catch((error) => {
      console.error("Error toggling starred status:", error);
    });
  };

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
      const response = await fetch(`/api/google-tts/tts?${params.toString()}`);
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

  const alphabet = [
    "A",
    "B",
    "C",
    "D",
    "E",
    "F",
    "G",
    "H",
    "I",
    "J",
    "K",
    "L",
    "M",
    "N",
    "O",
    "P",
    "Q",
    "R",
    "S",
    "T",
    "U",
    "V",
    "W",
    "X",
    "Y",
    "Z",
  ];

  return (
    <>
      <NextLayout>
        <div className="max-w-6xl mx-auto flex flex-col lg:pr-[7rem] lg:ml-[3rem]">

          {/* Main Content Row: Alphabet Bar + Main Content */}
          <div className="flex flex-col lg:flex-row gap-8 lg:gap-16 items-stretch min-h-[60vh]">
            {/* Alphabet Sidebar */}
            <div className="lg:w-20 flex-shrink-0 h-full">
              <div className="sticky top-[calc(3rem+5rem+1.5rem)] h-full">
                <div className="grid grid-cols-9 lg:grid-cols-1 gap-2 p-4 bg-white rounded-2xl border border-gray-200 shadow-sm h-full min-h-full">
                  {alphabet.map((letter) => (
                    <Button
                      key={letter}
                      variant={selectedLetter === letter ? "default" : "ghost"}
                      onClick={() => {
                        setSelectedLetter(
                          selectedLetter === letter ? "" : letter,
                        );
                        setSearchQuery("");
                      }}
                      className="w-8 h-8 lg:w-12 lg:h-12 text-sm lg:text-lg font-semibold rounded-lg"
                    >
                      {letter}
                    </Button>
                  ))}
                </div>
              </div>
            </div>

            {/* Main Content (All Words or Saved Words) */}
            <div className="flex-1">
              {/* Conditional Heading for All Words or Saved Words */}
              {activeTab === 'all' && (
                <h2 className="text-5xl font-bold mb-10 text-yellow-500">
                  {language === Language.en
                    ? 'Every English word translated to Setswana'
                    : 'Every Setswana word translated to English'}
                </h2>
              )}
              {activeTab === 'saved' && (
                <>
                  <h1 className="text-5xl font-bold mb-7 text-yellow-500">
                    Saved Words
                  </h1>
                  <p className="text-gray-600 max-w-2xl mb-8">
                    {language === Language.en ? "Your collection of favorite words from English translated to Setswana." : "Your collection of favorite words from Setswana translated to English."}
                    {starredWords && starredWords.length > 0 && (
                      <> You have saved {starredWords
                        .filter(word => word.language === language)
                        .filter(word => {
                          if (!selectedLetter) return true;
                          return word.word.toUpperCase().startsWith(selectedLetter);
                        }).length} word{starredWords
                        .filter(word => word.language === language)
                        .filter(word => {
                          if (!selectedLetter) return true;
                          return word.word.toUpperCase().startsWith(selectedLetter);
                        }).length !== 1 ? "s" : ""}.</>
                    )}
                  </p>
                </>
              )}
              {/* Tab Bar (now left-aligned and part of main content) */}
              <div className="mb-10">
                <div className="flex justify-between gap-0 relative lg:w-[45rem]">
                  <button
                    className={`w-1/2 text-center text-lg font-semibold pb-2 transition-colors ${activeTab === 'all' ? 'text-yellow-500' : 'text-gray-500'}`}
                    onClick={() => setActiveTab('all')}
                  >
                    All Words
                  </button>
                  <button
                    className={`w-1/2 text-center text-lg font-semibold pb-2 transition-colors ${activeTab === 'saved' ? 'text-yellow-500' : 'text-gray-500'}`}
                    onClick={() => setActiveTab('saved')}
                  >
                    Saved Words
                  </button>
                  {/* Tab bar background line */}
                  <div className="absolute left-0 right-0 bottom-0 h-0.5 bg-gray-300" />
                  {/* Active tab indicator bar */}
                  <div
                    className="absolute bottom-0 h-1 bg-yellow-400 rounded-full transition-all duration-300"
                    style={{
                      left: activeTab === 'all' ? '0%' : '50%',
                      width: '50%',
                    }}
                  />
                </div>
              </div>
              {/* Language Toggle for Saved Words */}
              {activeTab === 'saved' && (
                <>
                  <div className="flex flex-row gap-4 w-full mb-10">
                    <Button
                      variant={language === Language.en ? "default" : "outline"}
                      onClick={() => setLanguage(Language.en)}
                      className={`flex-1 w-full rounded-[7px] px-8 py-3 text-lg font-medium overflow-hidden ${language === Language.en ? "bg-yellow-400 text-gray-600" : ""}`}
                    >
                      English - Setswana
                    </Button>
                    <Button
                      variant={language === Language.tn ? "default" : "outline"}
                      onClick={() => setLanguage(Language.tn)}
                      className={`flex-1 w-full rounded-[7px] px-8 py-3 text-lg font-medium overflow-hidden ${language === Language.tn ? "bg-yellow-400 text-gray-600" : ""}`}
                    >
                      Setswana - English
                    </Button>
                  </div>
                  {/* Search Bar for Saved Words */}
                  <div className="relative mb-10 w-full">
                    <div className="relative">
                      <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                      <Input
                        type="text"
                        placeholder={`Search ${language === Language.en ? "English" : "Setswana"} words`}
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-12 pr-12 py-4 text-lg rounded-[7px] border-2 border-gray-200 transition-colors"
                      />
                      {(searchQuery || selectedLetter) && (
                        <button
                          className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                          onClick={clearSearch}
                          aria-label="Clear search"
                        >
                          <X className="w-5 h-5" />
                        </button>
                      )}
                    </div>
                  </div>
                </>
              )}
              {activeTab === 'all' ? (
                <>
                  {/* Language Toggle */}
                  <div className="flex flex-row gap-4 w-full mb-10">
                    <Button
                      variant={language === Language.en ? "default" : "outline"}
                      onClick={() => setLanguage(Language.en)} 
                      className={`flex-1 w-full rounded-[7px] px-8 py-3 text-lg font-medium overflow-hidden ${language === Language.en ? "bg-yellow-400 text-gray-600" : ""}`}
                    >
                      English - Setswana
                    </Button>
                    <Button
                      variant={language === Language.tn ? "default" : "outline"}
                      onClick={() => setLanguage(Language.tn)}
                      className={`flex-1 w-full rounded-[7px] px-8 py-3 text-lg font-medium overflow-hidden ${language === Language.tn ? "bg-yellow-400 text-gray-600" : ""}`}
                    >
                      Setswana - English
                    </Button>
                  </div>

                  {/* Search Bar */}
                  <div className="relative mb-10 w-full">
                    <div className="relative">
                      <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                      <Input
                        value={searchQuery}
                        onChange={(e) => {
                          setSearchQuery(e.target.value);
                          setSelectedLetter("");
                        }}
                        placeholder="Search words..."
                        className="pl-12 pr-12 py-4 text-lg rounded-[7px] border-2 border-gray-200 transition-colors"
                      />
                      {(searchQuery || selectedLetter) && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={clearSearch}
                          className="absolute right-2 top-1/2 transform -translate-y-1/2 w-8 h-8 rounded-full hover:bg-gray-100"
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </div>

                  {/* Loading State */}
                  {isLoading && (
                    <div className="flex justify-center items-center py-12">
                      <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
                      <span className="ml-2 text-gray-600">Loading words...</span>
                    </div>
                  )}

                  {/* Error State */}
                  {error && (
                    <div className="text-center py-12">
                      <p className="text-red-600">
                        Error loading words. Please try again.
                      </p>
                    </div>
                  )}

                  {/* Words List */}
                  {!isLoading && !error && (
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                      {filteredWords.map((word) => (
                        <Card
                          key={word.id}
                          className="hover:shadow-lg transition-all duration-200 border-blue-200 hover:border-orange-300 overflow-hidden"
                        >
                          <CardContent className="p-4 space-y-3 -mb-0.5">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <Link
                                  href={`/word/${word.id}`}
                                  className="group block"
                                >
                                  <h3 className="font-semibold text-lg group-hover:text-orange-600 transition-colors">
                                    {word.word}
                                  </h3>
                                  <p className="text-orange-600 font-medium">
                                    {word.translation}
                                  </p>
                                </Link>
                              </div>
                              <div className="flex items-center space-x-2">
                                {word.pronunciation && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => playPronunciation(word)}
                                    className="h-8 w-8 p-0 hover:bg-orange-100"
                                  >
                                    <Volume2 className="w-4 h-4" />
                                  </Button>
                                )}
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleToggleStarred(word.id)}
                                  className="h-8 w-8 p-0 hover:bg-orange-100"
                                >
                                  <Star
                                    className={cn(
                                      "w-4 h-4",
                                      word.isStarred
                                        ? "fill-yellow-400 text-yellow-400 hover:text-yellow-500"
                                        : "text-gray-400 hover:text-yellow-400",
                                    )}
                                  />
                                </Button>
                              </div>
                            </div>
                            <p className="text-sm text-gray-600 line-clamp-2">
                              {word.definition}
                            </p>
                            <div className="flex items-center justify-between text-xs text-gray-500">
                              <div className="flex items-center space-x-2">
                                <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded-full">
                                  {word.partOfSpeech}
                                </span>
                                <span
                                  className={cn(
                                    "px-2 py-1 rounded-full text-xs font-medium",
                                    word.language === "en"
                                      ? "bg-green-100 text-green-700"
                                      : "bg-purple-100 text-purple-700",
                                  )}
                                >
                                  {word.language === "en" ? "English" : "Setswana"}
                                </span>
                              </div>
                              {word.pronunciation && (
                                <span className="italic">{word.pronunciation}</span>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      ))}

                      {filteredWords.length === 0 && !isLoading && (
                        <div className="text-center py-12 md:col-span-2 lg:col-span-3">
                          <p className="text-gray-500 text-lg">
                            {searchQuery
                              ? `No words found for "${searchQuery}"`
                              : selectedLetter
                                ? `No words found starting with "${selectedLetter}"`
                                : "No words available"}
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </>
              ) : (
                // Saved Words Tab Content (moved from saved page)
                <div className="container mx-auto px-1 min-h-screen">
                  <div className="text-center space-y-4">
                    
                  </div>
                  <div className="max-w-4xl mx-auto">
                    {isLoadingStarred ? (
                      <div className="flex justify-center items-center py-12">
                        <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
                        <span className="ml-2 text-gray-600">Loading saved words...</span>
                      </div>
                    ) : errorStarred ? (
                      <div className="text-center py-12">
                        <p className="text-red-600">
                          Error loading saved words. Please try again.
                        </p>
                      </div>
                    ) : !starredWords || starredWords.length === 0 ? (
                      <div className="text-center space-y-4">
                        <Star className="w-16 h-16 mx-auto text-gray-300" />
                        <h3 className="text-xl font-semibold text-gray-600">
                          No saved words yet
                        </h3>
                        <p className="text-gray-500 max-w-md mx-auto">
                          Start exploring our dictionary and save words you'd like to
                          remember by clicking the star icon.
                        </p>
                        <div className="pt-2">
                          <Button className="bg-orange-500 hover:bg-orange-600 text-white rounded-lg" onClick={() => setActiveTab('all')}>
                            Explore Dictionary
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                          {starredWords
                            .filter(word => word.language === language)
                            .filter(word => {
                              // If no letter is selected, show all words
                              if (!selectedLetter) return true;
                              // Filter by selected letter (case-insensitive)
                              return word.word.toUpperCase().startsWith(selectedLetter);
                            })
                            .map((word) => (
                            <Card
                              key={word.id}
                              className="hover:shadow-lg transition-all duration-200 border-blue-200 hover:border-orange-300 overflow-hidden"
                            >
                              <CardContent className="p-4 space-y-3 -mb-0.5">
                                <div className="flex items-start justify-between">
                                  <div className="flex-1">
                                    <Link
                                      href={`/word/${word.id}`}
                                      className="group block"
                                    >
                                      <h3 className="font-semibold text-lg group-hover:text-orange-600 transition-colors">
                                        {word.word}
                                      </h3>
                                      <p className="text-orange-600 font-medium">
                                        {word.translation}
                                      </p>
                                    </Link>
                                  </div>
                                  <div className="flex items-center space-x-2">
                                    {word.pronunciation && (
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => playPronunciation(word)}
                                        className="h-8 w-8 p-0 hover:bg-orange-100"
                                      >
                                        <Volume2 className="w-4 h-4" />
                                      </Button>
                                    )}
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => handleToggleStarred(word.id)}
                                      className="h-8 w-8 p-0 hover:bg-orange-100"
                                    >
                                      <Star
                                        className={cn(
                                          "w-4 h-4 fill-yellow-400 text-yellow-400 hover:text-yellow-500",
                                        )}
                                      />
                                    </Button>
                                  </div>
                                </div>
                                <p className="text-sm text-gray-600 line-clamp-2">
                                  {word.definition}
                                </p>
                                <div className="flex items-center justify-between text-xs text-gray-500">
                                  <div className="flex items-center space-x-2">
                                    <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded-full">
                                      {word.partOfSpeech}
                                    </span>
                                    <span
                                      className={cn(
                                        "px-2 py-1 rounded-full text-xs font-medium",
                                        word.language === "en"
                                          ? "bg-green-100 text-green-700"
                                          : "bg-purple-100 text-purple-700",
                                      )}
                                    >
                                      {word.language === "en" ? "English" : "Setswana"}
                                    </span>
                                  </div>
                                  {word.pronunciation && (
                                    <span className="italic">{word.pronunciation}</span>
                                  )}
                                </div>
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                        
                        {/* Show message when no words match the filter */}
                        {starredWords
                          .filter(word => word.language === language)
                          .filter(word => {
                            if (!selectedLetter) return true;
                            return word.word.toUpperCase().startsWith(selectedLetter);
                          }).length === 0 && starredWords.filter(word => word.language === language).length > 0 && (
                          <div className="text-center py-12">
                            <p className="text-gray-500 text-lg">
                              {selectedLetter
                                ? `No saved ${language === Language.en ? "English" : "Setswana"} words found starting with "${selectedLetter}"`
                                : "No saved words available"}
                            </p>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </NextLayout>
    </>
  );
}
