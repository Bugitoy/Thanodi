"use client";

import { ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { User } from "lucide-react";
import { Button } from "@/components/ui/button";

interface LayoutProps {
  children: ReactNode;
}

export default function NextLayout({ children }: LayoutProps) {
  const pathname = usePathname();

  const isActive = (path: string) => {
    return pathname === path;
  };

  return (
    <div
      className="min-h-screen"
      style={{
        backgroundImage:
          "linear-gradient(to bottom right, #FFECD2, #DCEAF7, #FFDECA)",
      }}
    >
      <header className="border-2 border-gray-300 bg-white/80 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <Link href="/" className="flex items-center space-x-2">
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center"
                style={{
                  backgroundImage:
                    "linear-gradient(to bottom right, #F7D379, #F9B288)",
                }}
              >
                <span className="text-white font-bold text-lg">T</span>
              </div>
              <span
                className="text-xl font-bold text-gray-900"
                style={{ fontFamily: "Alata, sans-serif" }}
              >
                Thanodi
              </span>
            </Link>

            {/* Navigation */}
            <nav className="hidden md:flex items-center space-x-8">
              <Link
                href="/"
                className={cn(
                  "text-lg font-medium transition-colors hover:text-orange-600",
                  isActive("/") ? "text-orange-600" : "text-gray-600",
                )}
                style={{ fontFamily: "Alata, sans-serif" }}
              >
                Dictionary
              </Link>
              <Link
                href="/pricing"
                className={cn(
                  "text-lg font-medium transition-colors hover:text-orange-600",
                  isActive("/pricing") ? "text-orange-600" : "text-gray-600",
                )}
                style={{ fontFamily: "Alata, sans-serif" }}
              >
                Pricing
              </Link>
              <Link
                href="/about"
                className={cn(
                  "text-lg font-medium transition-colors hover:text-orange-600",
                  isActive("/about") ? "text-orange-600" : "text-gray-600",
                )}
                style={{ fontFamily: "Alata, sans-serif" }}
              >
                About
              </Link>
            </nav>

            {/* User Icon */}
            <Link href="/account">
              <Button
                variant="ghost"
                size="icon"
                className="w-10 h-10 rounded-full hover:bg-gray-100"
              >
                <User className="w-5 h-5" />
                <span className="sr-only">Account</span>
              </Button>
            </Link>
          </div>

          {/* Mobile Navigation */}
          <nav className="md:hidden flex items-center justify-center space-x-6 mt-4 pt-4 border-t border-gray-200">
            <Link
              href="/"
              className={cn(
                "text-sm font-medium transition-colors hover:text-orange-600",
                isActive("/") ? "text-orange-600" : "text-gray-600",
              )}
              style={{ fontFamily: "Alata, sans-serif" }}
            >
              Dictionary
            </Link>
            <Link
              href="/pricing"
              className={cn(
                "text-sm font-medium transition-colors hover:text-orange-600",
                isActive("/pricing") ? "text-orange-600" : "text-gray-600",
              )}
              style={{ fontFamily: "Alata, sans-serif" }}
            >
              Pricing
            </Link>
            <Link
              href="/about"
              className={cn(
                "text-sm font-medium transition-colors hover:text-orange-600",
                isActive("/about") ? "text-orange-600" : "text-gray-600",
              )}
              style={{ fontFamily: "Alata, sans-serif" }}
            >
              About
            </Link>
          </nav>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 text-blue-300">
        {children}
      </main>
    </div>
  );
}
