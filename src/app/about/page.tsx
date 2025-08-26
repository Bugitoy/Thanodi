"use client";

import NextLayout from "@/components/NextLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Instagram, Facebook, Linkedin, Globe, Heart } from "lucide-react";

export default function AboutPage() {
  return (
    <NextLayout>
      <div className="max-w-4xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
          {/* Profile Image */}
          <div>
            <Card className="rounded-3xl border border-gray-200 shadow-sm overflow-hidden">
              <CardContent className="p-0">
                <div
                  className="aspect-square flex items-center justify-center"
                  style={{
                    backgroundImage:
                      "linear-gradient(to bottom right, #FFECD2, #FFDECA)",
                  }}
                >
                  <div
                    className="w-48 h-48 rounded-full flex items-center justify-center"
                    style={{
                      backgroundImage:
                        "linear-gradient(to bottom right, #F7D379, #F9B288)",
                    }}
                  >
                    <span className="text-6xl font-bold text-white">T</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* About Content */}
          <div className="space-y-6">
            <div>
              <h1 className="text-4xl font-bold text-gray-900 mb-3">
                About Thanodi
              </h1>
              <h2 className="text-xl text-gray-600 mb-6">
                Your Bridge Between Languages
              </h2>

              <div className="prose text-gray-700 leading-relaxed space-y-4">
                <p>
                  Thanodi is a comprehensive Setswana-English dictionary
                  designed to preserve and celebrate the rich linguistic
                  heritage of Botswana while making it accessible to speakers
                  worldwide.
                </p>

                <p>
                  Our mission is to bridge language barriers and help people
                  connect with Setswana culture through accurate translations,
                  clear definitions, and authentic pronunciation guides.
                </p>

                <p>
                  Whether you&apos;re a native speaker looking to refine your
                  vocabulary, a language learner taking your first steps, or a
                  researcher studying Southern African languages, Thanodi
                  provides the tools you need.
                </p>

                <p>
                  We believe that language is more than words—it&apos;s culture,
                  identity, and connection. Every definition in our dictionary
                  is crafted with respect for the nuances and beauty of both
                  English and Setswana.
                </p>
              </div>
            </div>

            {/* Social Links */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Connect with us
              </h3>
              <div className="flex gap-4">
                <Button
                  variant="outline"
                  size="icon"
                  className="w-12 h-12 rounded-full border-2 hover:bg-orange-50 hover:border-orange-300"
                >
                  <Instagram className="w-5 h-5" />
                  <span className="sr-only">Instagram</span>
                </Button>

                <Button
                  variant="outline"
                  size="icon"
                  className="w-12 h-12 rounded-full border-2 hover:bg-yellow-50 hover:border-yellow-300"
                >
                  <Facebook className="w-5 h-5" />
                  <span className="sr-only">Facebook</span>
                </Button>

                <Button
                  variant="outline"
                  size="icon"
                  className="w-12 h-12 rounded-full border-2 hover:bg-blue-50 hover:border-blue-300"
                >
                  <Linkedin className="w-5 h-5" />
                  <span className="sr-only">LinkedIn</span>
                </Button>

                <Button
                  variant="outline"
                  size="icon"
                  className="w-12 h-12 rounded-full border-2 hover:bg-orange-50 hover:border-orange-300"
                >
                  <Globe className="w-5 h-5" />
                  <span className="sr-only">Website</span>
                </Button>
              </div>
            </div>

            {/* Features */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                What makes Thanodi special
              </h3>
              <ul className="space-y-2 text-gray-700">
                <li className="flex items-center gap-2">
                  <Heart className="w-4 h-4 text-orange-500 flex-shrink-0" />
                  <span>Authentic pronunciation guides for every word</span>
                </li>
                <li className="flex items-center gap-2">
                  <Heart className="w-4 h-4 text-orange-500 flex-shrink-0" />
                  <span>Contextual examples from real usage</span>
                </li>
                <li className="flex items-center gap-2">
                  <Heart className="w-4 h-4 text-orange-500 flex-shrink-0" />
                  <span>Save and organize your favorite words</span>
                </li>
                <li className="flex items-center gap-2">
                  <Heart className="w-4 h-4 text-orange-500 flex-shrink-0" />
                  <span>Regular updates with new vocabulary</span>
                </li>
                <li className="flex items-center gap-2">
                  <Heart className="w-4 h-4 text-orange-500 flex-shrink-0" />
                  <span>Cultural context and usage notes</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </NextLayout>
  );
}
