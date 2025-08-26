"use client";

import React, { createContext, useContext, ReactNode } from "react";
import { Language } from "@prisma/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useKindeBrowserClient } from "@kinde-oss/kinde-auth-nextjs";

// Type for word with starring status
export interface DictionaryWord {
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
}

interface WordsContextType {
  // Data fetching
  getWordsByLanguage: (
    language: Language,
    limit?: number,
  ) => Promise<DictionaryWord[]>;
  searchWords: (
    query: string,
    language: Language,
    limit?: number,
  ) => Promise<DictionaryWord[]>;
  getWordsByLetter: (
    letter: string,
    language: Language,
    limit?: number,
  ) => Promise<DictionaryWord[]>;
  getStarredWords: () => Promise<DictionaryWord[]>;
  getWordById: (id: string) => Promise<DictionaryWord | null>;

  // Actions
  toggleStarred: (wordId: string) => Promise<boolean>;
}

const WordsContext = createContext<WordsContextType | undefined>(undefined);

export function WordsProvider({ children }: { children: ReactNode }) {
  const { user } = useKindeBrowserClient();
  const queryClient = useQueryClient();

  // API call functions
  const getWordsByLanguage = async (
    language: Language,
    limit = 20,
  ): Promise<DictionaryWord[]> => {
    const response = await fetch(
      `/api/words?language=${language}&limit=${limit}&userId=${user?.id || ""}`,
    );
    if (!response.ok) throw new Error("Failed to fetch words");
    return response.json();
  };

  const searchWords = async (
    query: string,
    language: Language,
    limit = 20,
  ): Promise<DictionaryWord[]> => {
    const response = await fetch(
      `/api/words/search?query=${encodeURIComponent(query)}&language=${language}&limit=${limit}&userId=${user?.id || ""}`,
    );
    if (!response.ok) throw new Error("Failed to search words");
    return response.json();
  };

  const getWordsByLetter = async (
    letter: string,
    language: Language,
    limit = 20,
  ): Promise<DictionaryWord[]> => {
    const response = await fetch(
      `/api/words/by-letter?letter=${letter}&language=${language}&limit=${limit}&userId=${user?.id || ""}`,
    );
    if (!response.ok) throw new Error("Failed to fetch words by letter");
    return response.json();
  };

  const getStarredWords = async (): Promise<DictionaryWord[]> => {
    if (!user?.id) return [];
    const response = await fetch(`/api/words/starred?userId=${user.id}`);
    if (!response.ok) throw new Error("Failed to fetch starred words");
    return response.json();
  };

  const getWordById = async (id: string): Promise<DictionaryWord | null> => {
    const response = await fetch(`/api/words/${id}?userId=${user?.id || ""}`);
    if (!response.ok) return null;
    return response.json();
  };

  // Mutation for toggling starred status
  const toggleStarredMutation = useMutation({
    mutationFn: async (wordId: string): Promise<boolean> => {
      if (!user?.id) throw new Error("User not authenticated");

      const response = await fetch("/api/words/toggle-star", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.id, wordId }),
      });

      if (!response.ok) throw new Error("Failed to toggle star");
      const result = await response.json();
      return result.isStarred;
    },
    onMutate: async (wordId: string) => {
      // Cancel any outgoing refetches (so they don't overwrite our optimistic update)
      await queryClient.cancelQueries({ queryKey: ["words"] });
      await queryClient.cancelQueries({ queryKey: ["starred-words"] });

      // Snapshot the previous values
      const previousWords = queryClient.getQueriesData({ queryKey: ["words"] });
      const previousStarredWords = queryClient.getQueryData([
        "starred-words",
        user?.id,
      ]);

      // Optimistically update all word queries
      queryClient.setQueriesData({ queryKey: ["words"] }, (old: any) => {
        if (!old) return old;
        return old.map((word: DictionaryWord) =>
          word.id === wordId ? { ...word, isStarred: !word.isStarred } : word,
        );
      });

      // Optimistically update word detail query
      queryClient.setQueryData(["word", wordId, user?.id], (old: any) => {
        if (!old) return old;
        return { ...old, isStarred: !old.isStarred };
      });

      // Return a context object with the snapshotted values
      return { previousWords, previousStarredWords };
    },
    onError: (err, wordId, context) => {
      // If the mutation fails, use the context returned from onMutate to roll back
      if (context?.previousWords) {
        context.previousWords.forEach(([queryKey, queryData]) => {
          queryClient.setQueryData(queryKey, queryData);
        });
      }
      console.error("Error toggling starred word:", err);
    },
    onSettled: () => {
      // Always refetch after error or success to ensure server state
      queryClient.invalidateQueries({ queryKey: ["words"] });
      queryClient.invalidateQueries({ queryKey: ["starred-words"] });
    },
  });

  const toggleStarred = async (wordId: string): Promise<boolean> => {
    return toggleStarredMutation.mutateAsync(wordId);
  };

  return (
    <WordsContext.Provider
      value={{
        getWordsByLanguage,
        searchWords,
        getWordsByLetter,
        getStarredWords,
        getWordById,
        toggleStarred,
      }}
    >
      {children}
    </WordsContext.Provider>
  );
}

export function useWords() {
  const context = useContext(WordsContext);
  if (context === undefined) {
    throw new Error("useWords must be used within a WordsProvider");
  }
  return context;
}

// Custom hooks for specific queries
export function useWordsByLanguage(language: Language, limit = 20) {
  const { getWordsByLanguage } = useWords();
  const { user } = useKindeBrowserClient();

  return useQuery({
    queryKey: ["words", "by-language", language, limit, user?.id],
    queryFn: () => getWordsByLanguage(language, limit),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useWordSearch(query: string, language: Language, limit = 20) {
  const { searchWords } = useWords();
  const { user } = useKindeBrowserClient();

  return useQuery({
    queryKey: ["words", "search", query, language, limit, user?.id],
    queryFn: () => searchWords(query, language, limit),
    enabled: query.length > 0,
    staleTime: 5 * 60 * 1000,
  });
}

export function useWordsByLetter(
  letter: string,
  language: Language,
  limit = 20,
) {
  const { getWordsByLetter } = useWords();
  const { user } = useKindeBrowserClient();

  return useQuery({
    queryKey: ["words", "by-letter", letter, language, limit, user?.id],
    queryFn: () => getWordsByLetter(letter, language, limit),
    enabled: letter.length > 0,
    staleTime: 5 * 60 * 1000,
  });
}

export function useStarredWords() {
  const { getStarredWords } = useWords();
  const { user } = useKindeBrowserClient();

  return useQuery({
    queryKey: ["starred-words", user?.id],
    queryFn: getStarredWords,
    enabled: !!user?.id,
    staleTime: 5 * 60 * 1000,
  });
}

export function useWordById(id: string) {
  const { getWordById } = useWords();
  const { user } = useKindeBrowserClient();

  return useQuery({
    queryKey: ["word", id, user?.id],
    queryFn: () => getWordById(id),
    enabled: !!id,
    staleTime: 10 * 60 * 1000, // 10 minutes for individual words
  });
}
