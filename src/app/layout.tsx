import "./globals.css";
import type { Metadata } from "next";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryProvider } from "./providers";
import { WordsProvider } from "@/lib/words-context";
import ErrorBoundary from "@/components/ErrorBoundary";
import DevErrorHandler from "@/components/DevErrorHandler";

export const metadata: Metadata = {
  title: "Thanodi - Setswana English Dictionary",
  description: "Your bridge between Setswana and English languages",
  icons: {
    icon: '/favicon.ico',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body style={{ fontFamily: "Alata, sans-serif" }}>
        <DevErrorHandler />
        <ErrorBoundary>
          <ReactQueryProvider>
            <WordsProvider>
              <TooltipProvider>
                <Toaster />
                <Sonner />
                {children}
              </TooltipProvider>
            </WordsProvider>
          </ReactQueryProvider>
        </ErrorBoundary>
      </body>
    </html>
  );
}
