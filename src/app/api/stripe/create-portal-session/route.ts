import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import prisma from "@/db/prisma";

export async function POST(request: NextRequest) {
  try {
    const { userId } = await request.json();

    if (!userId) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 },
      );
    }

    // Get user with customer ID
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { customerId: true, email: true },
    });

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 },
      );
    }

    if (!user.customerId) {
      return NextResponse.json(
        { error: "No subscription found" },
        { status: 400 },
      );
    }

    // Get the app URL from the request headers
    const protocol = request.headers.get("x-forwarded-proto") || "http";
    const host = request.headers.get("host") || "localhost:3000";
    const appUrl = `${protocol}://${host}`;

    // Create portal session
    const portalSession = await stripe.billingPortal.sessions.create({
      customer: user.customerId,
      return_url: `${appUrl}/account`,
    });

    return NextResponse.json({ url: portalSession.url });
  } catch (error) {
    console.error("Error creating portal session:", error);
    return NextResponse.json(
      { error: "Failed to create portal session" },
      { status: 500 },
    );
  }
} 