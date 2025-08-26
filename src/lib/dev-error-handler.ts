"use client";

// Development error handler to gracefully handle HMR fetch failures

export function setupDevErrorHandler() {
  if (typeof window === "undefined" || process.env.NODE_ENV !== "development") {
    return;
  }

  // Intercept fetch errors during development
  const originalFetch = window.fetch;
  window.fetch = async function (input: RequestInfo | URL, init?: RequestInit) {
    try {
      return await originalFetch(input, init);
    } catch (error) {
      // Handle specific HMR-related fetch failures
      if (error instanceof TypeError && error.message === "Failed to fetch") {
        const url = typeof input === "string" ? input : input.toString();

        // Check if this is an HMR-related request
        if (
          url.includes("_next") ||
          url.includes("webpack") ||
          url.includes("hot-reloader")
        ) {
          console.warn(
            `HMR fetch failed for ${url}. This is usually temporary during development.`,
          );

          // Return a minimal response to prevent the error from breaking the app
          return new Response(JSON.stringify({ error: "HMR fetch failed" }), {
            status: 200,
            statusText: "OK",
            headers: { "Content-Type": "application/json" },
          });
        }
      }

      throw error;
    }
  };

  // Handle unhandled promise rejections
  window.addEventListener("unhandledrejection", (event) => {
    const error = event.reason;

    if (
      error instanceof TypeError &&
      error.message === "Failed to fetch" &&
      error.stack?.includes("hot-reloader")
    ) {
      console.warn("Prevented HMR fetch error from breaking the app:", error);
      event.preventDefault(); // Prevent the error from being logged as unhandled
    }
  });

  // Handle runtime errors
  window.addEventListener("error", (event) => {
    const error = event.error;

    if (
      error instanceof TypeError &&
      error.message === "Failed to fetch" &&
      error.stack?.includes("webpack")
    ) {
      console.warn("Prevented webpack fetch error:", error);
      event.preventDefault();
    }
  });

  console.log("Development error handler initialized");
}
