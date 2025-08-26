// Robust fetch wrapper with retry logic and better error handling

export interface FetchOptions extends RequestInit {
  retries?: number;
  retryDelay?: number;
  timeout?: number;
}

export class FetchError extends Error {
  constructor(
    public status: number,
    public statusText: string,
    message?: string,
  ) {
    super(message || `HTTP ${status}: ${statusText}`);
    this.name = "FetchError";
  }
}

export async function robustFetch(
  url: string,
  options: FetchOptions = {},
): Promise<Response> {
  const {
    retries = 3,
    retryDelay = 1000,
    timeout = 10000,
    ...fetchOptions
  } = options;

  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      // Create AbortController for timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);

      const response = await fetch(url, {
        ...fetchOptions,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new FetchError(response.status, response.statusText);
      }

      return response;
    } catch (error) {
      lastError = error as Error;

      // Don't retry on certain errors
      if (
        error instanceof FetchError &&
        (error.status === 400 ||
          error.status === 401 ||
          error.status === 403 ||
          error.status === 404)
      ) {
        throw error;
      }

      // Don't retry if it's the last attempt
      if (attempt === retries) {
        break;
      }

      // Wait before retrying
      await new Promise((resolve) =>
        setTimeout(resolve, retryDelay * Math.pow(2, attempt)),
      );
    }
  }

  throw lastError || new Error("Unknown fetch error");
}

// Utility function for JSON API calls
export async function fetchJson<T = any>(
  url: string,
  options: FetchOptions = {},
): Promise<T> {
  const response = await robustFetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
  });

  if (!response.ok) {
    throw new FetchError(response.status, response.statusText);
  }

  return response.json();
}

// Check if we're in development mode
export function isDevelopment(): boolean {
  return process.env.NODE_ENV === "development";
}

// Handle development server connectivity issues
export function handleDevServerError(error: Error): void {
  if (isDevelopment()) {
    console.warn("Development server connectivity issue:", error.message);

    // In development, show a user-friendly message
    if (error.message.includes("Failed to fetch")) {
      console.warn(
        "This is likely a temporary development server issue. The page will retry automatically.",
      );
    }
  } else {
    console.error("Network error:", error);
  }
}
