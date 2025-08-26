import NextLayout from "@/components/NextLayout";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Check } from "lucide-react";
import Link from "next/link";
import PaymentLink from "@/components/PaymentLink";

enum PopularPlanType {
  NO = 0,
  YES = 1,
}

interface PricingProps {
  title: string;
  popular: PopularPlanType;
  price: number;
  description: string;
  buttonText: string;
  benefitList: string[];
  href: string;
  billing: string;
  paymentLink?: string;
}

const pricingList: PricingProps[] = [
  {
    title: "Free",
    popular: 0,
    price: 0,
    description:
      "Perfect for getting started with basic Setswana-English translations.",
    buttonText: "Get Started",
    benefitList: [
      "Basic word lookups",
      "Limited daily searches",
      "Basic pronunciation guides",
      "Community support",
      "Mobile access",
    ],
    href: "/api/auth/login",
    billing: "/month",
  },
  {
    title: "Premium",
    popular: 1,
    price: 10,
    description:
      "Unlock the full power of Thanodi with unlimited access and premium features.",
    buttonText: "Buy Now",
    benefitList: [
      "Unlimited word lookups",
      "Advanced search filters",
      "Audio pronunciations",
      "Save unlimited words",
      "Priority support",
      "Offline access",
    ],
    href: "/api/auth/login",
    paymentLink: process.env.NEXT_PUBLIC_STRIPE_MONTHLY_PLAN_LINK,
    billing: "/month",
  },
  {
    title: "Enterprise",
    popular: 0,
    price: 99,
    description:
      "Complete access for educational institutions and organizations.",
    buttonText: "Buy Now",
    benefitList: [
      "Everything in Premium",
      "Multi-user accounts",
      "Custom word collections",
      "Advanced analytics",
      "API access",
      "Priority support",
    ],
    href: "/api/auth/login",
    paymentLink: process.env.NEXT_PUBLIC_STRIPE_YEARLY_PLAN_LINK,
    billing: "/year",
  },
];

export default function PricingPage() {
  return (
    <NextLayout>
      <section id="pricing" className="container py-24 sm:py-32">
        <h2 className="text-3xl md:text-4xl font-bold text-center">
          Get
          <span className="bg-gradient-to-b from-orange-400 to-orange-600 uppercase text-transparent bg-clip-text">
            {" "}
            Unlimited{" "}
          </span>
          Access
        </h2>
        <h3 className="text-xl text-center text-muted-foreground pt-4 pb-8">
          Choose the perfect plan for your Setswana-English learning journey.
        </h3>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {pricingList.map((pricing: PricingProps) => (
            <Card
              key={pricing.title}
              className={
                pricing.popular === PopularPlanType.YES
                  ? "drop-shadow-xl shadow-black/10 dark:shadow-white/10 border-2 border-orange-200"
                  : ""
              }
            >
              <CardHeader>
                <CardTitle className="flex item-center justify-between">
                  {pricing.title}
                  {pricing.popular === PopularPlanType.YES ? (
                    <Badge
                      variant="secondary"
                      className="text-sm text-primary bg-orange-100 text-orange-700"
                    >
                      Most popular
                    </Badge>
                  ) : null}
                </CardTitle>
                <div>
                  <span className="text-3xl font-bold">${pricing.price}</span>
                  <span className="text-muted-foreground">
                    {" "}
                    {pricing.billing}
                  </span>
                </div>

                <CardDescription>{pricing.description}</CardDescription>
              </CardHeader>

              <CardContent>
                <PaymentLink
                  href={pricing.href}
                  text={pricing.buttonText}
                  paymentLink={pricing.paymentLink}
                />
              </CardContent>

              <hr className="w-4/5 m-auto mb-4" />

              <CardFooter className="flex">
                <div className="space-y-4">
                  {pricing.benefitList.map((benefit: string) => (
                    <span key={benefit} className="flex">
                      <Check className="text-orange-500" />
                      <h3 className="ml-2">{benefit}</h3>
                    </span>
                  ))}
                </div>
              </CardFooter>
            </Card>
          ))}
        </div>
      </section>
    </NextLayout>
  );
}
