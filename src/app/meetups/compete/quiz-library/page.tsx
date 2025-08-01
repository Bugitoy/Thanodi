"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useKindeBrowserClient } from "@kinde-oss/kinde-auth-nextjs";
import NextLayout from "@/components/NextLayout";
import { Plus, ArrowLeft, Loader2, Trash2, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface UserQuiz {
  id: string;
  title: string;
  description: string;
  questionCount: number;
  createdAt: string;
  updatedAt: string;
}

// Cache for storing quiz data
const quizCache = new Map<string, { data: UserQuiz[]; timestamp: number }>();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

// Performance configuration
const PERFORMANCE_CONFIG = {
  PAGE_SIZE: 12,
  DEBOUNCE_DELAY: 300,
  RETRY_ATTEMPTS: 3,
  RETRY_DELAY: 1000,
};

export default function QuizLibraryPage() {
  const { user } = useKindeBrowserClient();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const [userQuizzes, setUserQuizzes] = useState<UserQuiz[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [deleteMode, setDeleteMode] = useState(false);
  const [selectedQuizzes, setSelectedQuizzes] = useState<Set<string>>(new Set());
  const [isDeleting, setIsDeleting] = useState(false);
  const [userInfo, setUserInfo] = useState<any>(null);
  const [userLoading, setUserLoading] = useState(true);
  
  // Get the settings parameter to preserve it when navigating back
  const settingsId = searchParams.get('settings');

  // Memoized cache key
  const cacheKey = useMemo(() => `quizzes_${user?.id}_${page}`, [user?.id, page]);

  // Fetch user information to check plan and limits
  const fetchUserInfo = useCallback(async () => {
    if (!user?.id) return;
    
    try {
      const res = await fetch(`/api/user?userId=${user.id}`);
      if (res.ok) {
        const data = await res.json();
        setUserInfo(data);
      }
    } catch (error) {
      console.error('Error fetching user info:', error);
    } finally {
      setUserLoading(false);
    }
  }, [user?.id]);

  // Calculate quiz limits based on user plan
  const quizLimits = useMemo(() => {
    if (!userInfo) return { maxQuizzes: 3, currentQuizzes: 0, isFreeUser: true };
    
    const isFreeUser = userInfo.plan === 'free';
    const isPlusUser = userInfo.plan === 'plus';
    const isPremiumUser = userInfo.plan === 'premium';
    const maxQuizzes = isFreeUser ? 3 : isPlusUser ? 50 : Infinity; // Free: 3, Plus: 50, Premium: unlimited
    const currentQuizzes = userQuizzes.length; // This will be updated as we load more
    
    return { maxQuizzes, currentQuizzes, isFreeUser, isPlusUser, isPremiumUser };
  }, [userInfo, userQuizzes.length]);

  const hasReachedQuizLimit = useMemo(() => {
    return (quizLimits.isFreeUser || quizLimits.isPlusUser) && quizLimits.currentQuizzes >= quizLimits.maxQuizzes;
  }, [quizLimits]);

  // Optimized fetch function with caching and retry logic
  const fetchUserQuizzes = useCallback(async (pageNum: number = 1, isRetry: boolean = false) => {
    if (!user?.id) return;
    
    // Check cache first
    const cached = quizCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION && !isRetry) {
      setUserQuizzes(cached.data);
      setLoading(false);
      return;
    }

    try {
      const startTime = performance.now();
      const res = await fetch(`/api/user-quizzes?userId=${user.id}&page=${pageNum}&limit=${PERFORMANCE_CONFIG.PAGE_SIZE}`);
      
      if (res.ok) {
        const data = await res.json();
        const fetchTime = performance.now() - startTime;
        
        // Log performance metrics in development
        if (process.env.NODE_ENV === 'development' && fetchTime > 1000) {
          console.warn(`Quiz fetch took ${fetchTime.toFixed(2)}ms`);
        }

        if (pageNum === 1) {
          setUserQuizzes(data.quizzes || data);
          setHasMore(data.hasMore !== undefined ? data.hasMore : data.length === PERFORMANCE_CONFIG.PAGE_SIZE);
        } else {
          setUserQuizzes(prev => [...prev, ...(data.quizzes || data)]);
          setHasMore(data.hasMore !== undefined ? data.hasMore : data.length === PERFORMANCE_CONFIG.PAGE_SIZE);
        }

        // Cache the results
        quizCache.set(cacheKey, { data: data.quizzes || data, timestamp: Date.now() });
        setError(null);
        setRetryCount(0);
      } else if (res.status === 404) {
        setUserQuizzes([]);
        setHasMore(false);
      } else {
        throw new Error(`HTTP ${res.status}: ${res.statusText}`);
      }
    } catch (error) {
      console.error('Error fetching user quizzes:', error);
      
      if (!isRetry && retryCount < PERFORMANCE_CONFIG.RETRY_ATTEMPTS) {
        setRetryCount(prev => prev + 1);
        setTimeout(() => fetchUserQuizzes(pageNum, true), PERFORMANCE_CONFIG.RETRY_DELAY * retryCount);
        return;
      }
      
      setError(error instanceof Error ? error.message : 'Failed to load quizzes');
      toast({
        title: "Error",
        description: "Failed to load your quizzes. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
      setIsLoadingMore(false);
    }
  }, [user?.id, cacheKey, retryCount, toast]);

  // Load more quizzes function
  const loadMoreQuizzes = useCallback(async () => {
    if (isLoadingMore || !hasMore) return;
    
    setIsLoadingMore(true);
    const nextPage = page + 1;
    setPage(nextPage);
    await fetchUserQuizzes(nextPage);
  }, [isLoadingMore, hasMore, page, fetchUserQuizzes]);

  // Performance monitoring utility
  const logPerformance = useCallback((operation: string, duration: number) => {
    if (process.env.NODE_ENV === 'development' && duration > 1000) {
      console.warn(`Performance warning: ${operation} took ${duration.toFixed(2)}ms`);
    }
  }, []);

  // Cleanup function for cache
  useEffect(() => {
    const cleanupCache = () => {
      const now = Date.now();
      for (const [key, value] of Array.from(quizCache.entries())) {
        if (now - value.timestamp > CACHE_DURATION) {
          quizCache.delete(key);
        }
      }
    };

    // Cleanup cache every 5 minutes
    const interval = setInterval(cleanupCache, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    fetchUserInfo();
  }, [fetchUserInfo]);

  useEffect(() => {
    fetchUserQuizzes();
  }, [fetchUserQuizzes]);

  const handleCreateNewQuiz = useCallback(() => {
    if (hasReachedQuizLimit) {
      toast({
        title: "Quiz Limit Reached",
        description: `${quizLimits.isFreeUser ? 'Free' : 'Plus'} users can only create ${quizLimits.maxQuizzes} quizzes. ${quizLimits.isFreeUser ? 'Upgrade to Plus or Premium' : 'Upgrade to Premium'} to create more quizzes.`,
        variant: "destructive",
      });
      return;
    }
    
    // Preserve the settings parameter when navigating to create-quiz
    const settingsParam = settingsId ? `?settings=${settingsId}` : '';
    router.push(`/meetups/compete/create-quiz${settingsParam}`);
  }, [settingsId, router, hasReachedQuizLimit, toast]);

  const handleToggleDeleteMode = useCallback(() => {
    setDeleteMode(prev => !prev);
    setSelectedQuizzes(new Set());
  }, []);

  const handleQuizSelection = useCallback((quizId: string, checked: boolean) => {
    setSelectedQuizzes(prev => {
      const newSet = new Set(prev);
      if (checked) {
        newSet.add(quizId);
      } else {
        newSet.delete(quizId);
      }
      return newSet;
    });
  }, []);

  const handleDeleteSelected = useCallback(async () => {
    if (selectedQuizzes.size === 0) return;

    // Show confirmation dialog
    const confirmed = window.confirm(
      `Are you sure you want to delete ${selectedQuizzes.size} quiz${selectedQuizzes.size > 1 ? 'es' : ''}? This action cannot be undone.`
    );
    
    if (!confirmed) return;

    setIsDeleting(true);
    try {
      const deletePromises = Array.from(selectedQuizzes).map(async (quizId) => {
        const res = await fetch(`/api/user-quizzes/${quizId}?userId=${user?.id}`, {
          method: 'DELETE',
        });
        
        if (!res.ok) {
          throw new Error(`Failed to delete quiz ${quizId}`);
        }
        
        return quizId;
      });

      const deletedQuizIds = await Promise.all(deletePromises);
      
      // Remove deleted quizzes from state
      setUserQuizzes(prev => prev.filter(quiz => !deletedQuizIds.includes(quiz.id)));
      
      // Clear cache for this user
      const cacheKeysToDelete = Array.from(quizCache.keys()).filter(key => key.includes(user?.id || ''));
      cacheKeysToDelete.forEach(key => quizCache.delete(key));
      
      toast({
        title: "Success",
        description: `Successfully deleted ${deletedQuizIds.length} quiz${deletedQuizIds.length > 1 ? 'es' : ''}`,
      });
      
      // Exit delete mode
      setDeleteMode(false);
      setSelectedQuizzes(new Set());
    } catch (error) {
      console.error('Error deleting quizzes:', error);
      toast({
        title: "Error",
        description: "Failed to delete some quizzes. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
    }
  }, [selectedQuizzes, user?.id, toast]);

  // Memoized header component to prevent re-renders
  const HeaderComponent = useMemo(() => (
    <div className="mb-8">
      {/* Back button - above everything on small screens */}
      <div className="mb-4 sm:mb-0">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-800 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 rounded"
          aria-label="Go back to previous page"
        >
          <ArrowLeft className="w-5 h-5" />
          Back
        </button>
      </div>
      
      {/* Title and buttons - on same row */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
          {deleteMode ? `Delete Mode (${selectedQuizzes.size} selected)` : 'Your Library'}
        </h1>
        <div className="flex gap-2 w-full sm:w-auto">
          {deleteMode ? (
            <>
              <button
                onClick={handleDeleteSelected}
                disabled={selectedQuizzes.size === 0 || isDeleting}
                className="flex items-center gap-2 bg-red-500 text-white px-3 sm:px-4 py-2 rounded-lg hover:bg-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed w-full sm:w-auto justify-center focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
                aria-label="Delete selected quizzes"
              >
                {isDeleting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Trash2 className="w-4 h-4 sm:w-5 sm:h-5" />
                )}
                <span className="text-sm sm:text-base">
                  {isDeleting ? 'Deleting...' : `Delete (${selectedQuizzes.size})`}
                </span>
              </button>
              <button
                onClick={handleToggleDeleteMode}
                className="flex items-center gap-2 bg-gray-500 text-white px-3 sm:px-4 py-2 rounded-lg hover:bg-gray-600 transition-colors w-full sm:w-auto justify-center focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
                aria-label="Cancel delete mode"
              >
                <X className="w-4 h-4 sm:w-5 sm:h-5" />
                <span className="text-sm sm:text-base">Cancel</span>
              </button>
            </>
          ) : (
            <>
              <button
                onClick={handleToggleDeleteMode}
                className="flex items-center gap-2 bg-gray-500 text-white px-3 sm:px-4 py-2 rounded-lg hover:bg-gray-600 transition-colors w-full sm:w-auto justify-center focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
                aria-label="Enter delete mode"
              >
                <Trash2 className="w-4 h-4 sm:w-5 sm:h-5" />
                <span className="text-sm sm:text-base">Delete</span>
              </button>
              <button
                onClick={handleCreateNewQuiz}
                disabled={hasReachedQuizLimit || userLoading}
                className={`flex items-center gap-2 px-3 sm:px-4 py-2 rounded-lg transition-colors w-full sm:w-auto justify-center focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                  hasReachedQuizLimit || userLoading
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-blue-400 text-white hover:bg-blue-300 focus:ring-blue-400'
                }`}
                aria-label={hasReachedQuizLimit ? "Quiz limit reached. Upgrade to create more quizzes." : "Create a new quiz"}
              >
                <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
                <span className="text-sm sm:text-base">
                  {hasReachedQuizLimit ? 'Quiz Limit Reached' : 'New Quiz'}
                </span>
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  ), [router, handleCreateNewQuiz, handleToggleDeleteMode, handleDeleteSelected, deleteMode, selectedQuizzes.size, isDeleting, hasReachedQuizLimit, userLoading]);

  const handleQuizSelect = useCallback(async (quiz: UserQuiz) => {
    // Optimized quiz selection with performance tracking
    try {
      const startTime = performance.now();
      const res = await fetch(`/api/user-quizzes/${quiz.id}?userId=${user?.id}`);
      
      if (res.ok) {
        const quizData = await res.json();
        const fetchTime = performance.now() - startTime;
        
        // Log performance metrics in development
        if (process.env.NODE_ENV === 'development' && fetchTime > 500) {
          console.warn(`Quiz selection took ${fetchTime.toFixed(2)}ms`);
        }
        
        // Navigate back to choose-topic with the quiz data and preserve settings parameter
        const settingsParam = settingsId ? `&settings=${settingsId}` : '';
        router.push(`/meetups/compete/choose-topic?selectedQuiz=${quiz.id}${settingsParam}`);
      } else {
        throw new Error(`HTTP ${res.status}: ${res.statusText}`);
      }
    } catch (error) {
      console.error('Error fetching quiz data:', error);
      toast({
        title: "Error",
        description: "Failed to load quiz data. Please try again.",
        variant: "destructive",
      });
    }
  }, [user?.id, settingsId, router, toast]);

  const formatDate = useCallback((dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString();
  }, []);

  // Memoized quiz cards to prevent unnecessary re-renders
  const quizCards = useMemo(() => {
    return userQuizzes.map((quiz) => (
      <div
        key={quiz.id}
        onClick={() => !deleteMode && handleQuizSelect(quiz)}
        className={`bg-white border border-gray-200 rounded-lg p-4 sm:p-6 transition-shadow transform transition-transform duration-200 ${
          deleteMode 
            ? 'cursor-default' 
            : 'hover:shadow-lg cursor-pointer hover:scale-[1.02]'
        } ${deleteMode && selectedQuizzes.has(quiz.id) ? 'ring-2 ring-red-500 bg-red-50' : ''}`}
        role={deleteMode ? undefined : "button"}
        tabIndex={deleteMode ? undefined : 0}
        onKeyDown={deleteMode ? undefined : (e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            handleQuizSelect(quiz);
          }
        }}
        aria-label={deleteMode ? `Quiz: ${quiz.title}` : `Select quiz: ${quiz.title}`}
      >
        <div className="flex items-start justify-between mb-3 sm:mb-4">
          <div className="flex items-start gap-3 flex-1">
            {deleteMode && (
              <input
                type="checkbox"
                checked={selectedQuizzes.has(quiz.id)}
                onChange={(e) => handleQuizSelection(quiz.id, e.target.checked)}
                onClick={(e) => e.stopPropagation()}
                className="mt-1 h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300 rounded"
                aria-label={`Select ${quiz.title} for deletion`}
              />
            )}
            <h3 className="text-base sm:text-lg font-semibold text-gray-900 line-clamp-2 flex-1">
              {quiz.title}
            </h3>
          </div>
          <span className="text-xs sm:text-sm text-gray-500 bg-gray-100 px-2 py-1 rounded flex-shrink-0">
            {quiz.questionCount} Q
          </span>
        </div>
        <p className="text-gray-600 text-xs sm:text-sm mb-3 sm:mb-4 line-clamp-3">
          {quiz.description}
        </p>
        <div className="flex items-center justify-between text-xs text-gray-500">
          <span>Created {formatDate(quiz.createdAt)}</span>
          <span>Updated {formatDate(quiz.updatedAt)}</span>
        </div>
      </div>
    ));
  }, [userQuizzes, handleQuizSelect, formatDate, deleteMode, selectedQuizzes, handleQuizSelection]);

  // Skeleton loading component
  const SkeletonQuizCard = () => (
    <div className="bg-white border border-gray-200 rounded-lg p-4 sm:p-6 animate-pulse">
      <div className="flex items-start justify-between mb-3 sm:mb-4">
        <div className="h-5 bg-gray-200 rounded w-3/4"></div>
        <div className="h-4 bg-gray-200 rounded w-8"></div>
      </div>
      <div className="space-y-2 mb-3 sm:mb-4">
        <div className="h-3 bg-gray-200 rounded w-full"></div>
        <div className="h-3 bg-gray-200 rounded w-5/6"></div>
        <div className="h-3 bg-gray-200 rounded w-4/6"></div>
      </div>
      <div className="flex items-center justify-between">
        <div className="h-3 bg-gray-200 rounded w-20"></div>
        <div className="h-3 bg-gray-200 rounded w-20"></div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <NextLayout>
        <div className="max-w-6xl mx-auto p-6">
          {/* Header skeleton */}
          <div className="mb-8">
            <div className="mb-4 sm:mb-0">
              <div className="h-6 bg-gray-200 rounded w-16 animate-pulse"></div>
            </div>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="h-8 bg-gray-200 rounded w-32 animate-pulse"></div>
              <div className="h-10 bg-gray-200 rounded w-24 animate-pulse"></div>
            </div>
          </div>

          {/* Quiz cards skeleton */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {Array.from({ length: 6 }).map((_, idx) => (
              <SkeletonQuizCard key={idx} />
            ))}
          </div>
        </div>
      </NextLayout>
    );
  }

  return (
    <NextLayout>
      <div className="max-w-6xl mx-auto p-6" role="main" aria-label="Quiz library">
        {/* Header */}
        {HeaderComponent}

        {/* Quiz limit warning for free and plus users (not premium) */}
        {(quizLimits.isFreeUser || quizLimits.isPlusUser) && userQuizzes.length > 0 && (
          <div className={`mb-6 p-4 rounded-lg border ${
            hasReachedQuizLimit 
              ? 'bg-red-50 border-red-200 text-red-800' 
              : quizLimits.isFreeUser 
                ? 'bg-yellow-50 border-yellow-200 text-yellow-800'
                : 'bg-blue-50 border-blue-200 text-blue-800'
          }`}>
            <div className="flex items-start gap-3">
              <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${
                hasReachedQuizLimit 
                  ? 'bg-red-200' 
                  : quizLimits.isFreeUser 
                    ? 'bg-yellow-200'
                    : 'bg-blue-200'
              }`}>
                <svg className={`w-3 h-3 ${
                  hasReachedQuizLimit 
                    ? 'text-red-600' 
                    : quizLimits.isFreeUser 
                      ? 'text-yellow-600'
                      : 'text-blue-600'
                }`} fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div>
                <h4 className="font-medium">
                  {hasReachedQuizLimit ? 'Quiz Limit Reached' : 'Quiz Limit Warning'}
                </h4>
                <p className="text-sm mt-1">
                  {hasReachedQuizLimit 
                    ? `You've reached the maximum of ${quizLimits.maxQuizzes} quizzes for ${quizLimits.isFreeUser ? 'free' : 'plus'} users. ${quizLimits.isFreeUser ? 'Upgrade to Plus or Premium' : 'Upgrade to Premium'} to create more quizzes.`
                    : `You've created ${quizLimits.currentQuizzes} of ${quizLimits.maxQuizzes} quizzes. ${quizLimits.isFreeUser ? 'Free' : 'Plus'} users are limited to ${quizLimits.maxQuizzes} quizzes.`
                  }
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Content */}
        {error && (
          <div className="text-center py-8">
            <div className="max-w-md mx-auto">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Failed to load quizzes
              </h3>
              <p className="text-gray-600 mb-4">
                {error}
              </p>
              <button
                onClick={() => {
                  setError(null);
                  setRetryCount(0);
                  fetchUserQuizzes();
                }}
                className="bg-blue-400 text-white px-4 py-2 rounded-lg hover:bg-blue-300 transition-colors"
              >
                Try Again
              </button>
            </div>
          </div>
        )}

        {!error && userQuizzes.length === 0 && !loading && (
          <div className="text-center py-16">
            <div className="max-w-md mx-auto">
              <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Plus className="w-12 h-12 text-gray-400" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                You haven't created any quizzes yet
              </h3>
              <p className="text-gray-600 mb-6">
                Start by creating your first quiz with custom questions and answers.
              </p>
              <button
                onClick={handleCreateNewQuiz}
                disabled={hasReachedQuizLimit || userLoading}
                className={`px-4 sm:px-6 py-2 sm:py-3 rounded-lg transition-colors text-sm sm:text-base ${
                  hasReachedQuizLimit || userLoading
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-blue-400 text-white hover:bg-blue-300'
                }`}
              >
                {hasReachedQuizLimit ? 'Quiz Limit Reached' : 'Create Your First Quiz'}
              </button>
            </div>
          </div>
        )}

        {!error && userQuizzes.length > 0 && (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {quizCards}
            </div>
            
            {/* Load more button */}
            {hasMore && (
              <div className="text-center mt-8">
                <button
                  onClick={loadMoreQuizzes}
                  disabled={isLoadingMore}
                  className="bg-gray-100 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center mx-auto"
                >
                  {isLoadingMore ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Loading more quizzes...
                    </>
                  ) : (
                    'Load More Quizzes'
                  )}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </NextLayout>
  );
} 