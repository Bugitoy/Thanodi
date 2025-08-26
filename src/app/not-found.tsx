import Link from "next/link";
import NextLayout from "@/components/NextLayout";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <NextLayout>
      <div className="min-h-[50vh] flex items-center justify-center">
        <div className="text-center space-y-6">
          <div className="space-y-2">
            <h1 className="text-6xl font-bold text-gray-900">404</h1>
            <h2 className="text-2xl font-semibold text-gray-700">
              Page not found
            </h2>
            <p className="text-gray-500 max-w-md mx-auto">
              Sorry, we couldn&apos;t find the page you&apos;re looking for. The
              word you seek might be in our dictionary though!
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/">
              <Button size="lg" className="rounded-full">
                Browse Dictionary
              </Button>
            </Link>
            <Link href="/about">
              <Button variant="outline" size="lg" className="rounded-full">
                About Thanodi
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </NextLayout>
  );
}
