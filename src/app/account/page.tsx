"use client";

import { useKindeBrowserClient } from "@kinde-oss/kinde-auth-nextjs";
import { useQuery, useMutation } from "@tanstack/react-query";
import NextLayout from "@/components/NextLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { X, User, Mail, Calendar, CreditCard, Star, Loader2 } from "lucide-react";
import { Plan } from "@prisma/client";
import { useToast } from "@/hooks/use-toast";

interface UserInfo {
  id: string;
  email: string;
  name: string | null;
  image: string | null;
  plan: Plan;
  customerId: string | null;
  createdAt: string;
  subscription: {
    id: string;
    plan: Plan;
    period: "monthly" | "yearly";
    startDate: string;
    endDate: string;
  } | null;
}

export default function AccountPage() {
  const { user } = useKindeBrowserClient();
  const { toast } = useToast();

  const { data: userInfo, isLoading, error } = useQuery<UserInfo>({
    queryKey: ["user-info", user?.id],
    queryFn: async () => {
      if (!user?.id) throw new Error("User not authenticated");
      const response = await fetch(`/api/user?userId=${user.id}`);
      if (!response.ok) throw new Error("Failed to fetch user info");
      return response.json();
    },
    enabled: !!user?.id,
  });

  const createPortalSessionMutation = useMutation({
    mutationFn: async () => {
      if (!user?.id) throw new Error("User not authenticated");
      const response = await fetch("/api/stripe/create-portal-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.id }),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to create portal session");
      }
      
      const data = await response.json();
      return data.url;
    },
    onSuccess: (url) => {
      window.open(url, "_blank");
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to open billing portal",
        variant: "destructive",
      });
    },
  });

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const getSubscriptionType = () => {
    if (!userInfo?.subscription) return "Free";
    return userInfo.subscription.plan === "premium" ? "Premium" : "Free";
  };

  const getNextBillingDate = () => {
    if (!userInfo?.subscription) return "N/A";
    return formatDate(userInfo.subscription.endDate);
  };

  const isAuthenticated = !!user?.id;
  const isSubscribed = userInfo?.plan === "premium" && userInfo?.customerId;
  const isValidUser = isAuthenticated && userInfo && !error;

  const handleCancelSubscription = () => {
    createPortalSessionMutation.mutate();
  };

  if (isLoading) {
    return (
      <NextLayout>
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Account</h1>
            <p className="text-gray-600">
              Manage your Thanodi account and subscription
            </p>
          </div>
          <div className="flex justify-center items-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
            <span className="ml-2 text-gray-600">Loading account information...</span>
          </div>
        </div>
      </NextLayout>
    );
  }

  return (
    <NextLayout>
      <div className="max-w-4xl mx-auto">
        <div className={`mb-8 ${!isAuthenticated ? 'text-center' : ''}`}>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Account</h1>
          <p className="text-gray-600">
            Manage your Thanodi account and subscription
          </p>
        </div>

        <div className={`grid grid-cols-1 gap-8 ${isAuthenticated ? 'lg:grid-cols-3' : 'lg:grid-cols-1 lg:max-w-2xl lg:mx-auto'}`}>
          {/* Profile Section */}
          <div className={isAuthenticated ? "lg:col-span-2" : ""}>
            <Card className="rounded-2xl border border-gray-200 shadow-sm">
              <CardHeader className="pb-6">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-xl font-semibold">
                    Your account details:
                  </CardTitle>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="w-8 h-8 rounded-full"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
                <p className="text-gray-600">Click here to edit your info</p>
              </CardHeader>

              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div>
                    <Label
                      htmlFor="email"
                      className="text-sm font-medium text-gray-700"
                    >
                      Email:
                    </Label>
                    <div className="mt-1 relative">
                      <Input
                        id="email"
                        type="email"
                        value={isValidUser ? userInfo.email : ""}
                        readOnly
                        className="bg-gray-50 border-gray-200 text-gray-900"
                        placeholder={!isValidUser ? "Not available" : ""}
                      />
                      <Mail className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    </div>
                  </div>

                  <div>
                    <Label
                      htmlFor="username"
                      className="text-sm font-medium text-gray-700"
                    >
                      Name:
                    </Label>
                    <div className="mt-1 relative">
                      <Input
                        id="username"
                        value={isValidUser ? (userInfo.name || "Not provided") : ""}
                        readOnly
                        className="bg-gray-50 border-gray-200 text-gray-900"
                        placeholder={!isValidUser ? "Not available" : ""}
                      />
                      <User className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    </div>
                  </div>

                  <div>
                    <Label
                      htmlFor="subscription"
                      className="text-sm font-medium text-gray-700"
                    >
                      Subscription type:
                    </Label>
                    <div className="mt-1 relative">
                      <Input
                        id="subscription"
                        value={isValidUser ? getSubscriptionType() : ""}
                        readOnly
                        className="bg-gray-50 border-gray-200 text-gray-900"
                        placeholder={!isValidUser ? "Not available" : ""}
                      />
                      <Star className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-yellow-500" />
                    </div>
                  </div>

                  <div>
                    <Label
                      htmlFor="customer-since"
                      className="text-sm font-medium text-gray-700"
                    >
                      Customer since:
                    </Label>
                    <div className="mt-1 relative">
                      <Input
                        id="customer-since"
                        value={isValidUser ? formatDate(userInfo.createdAt) : ""}
                        readOnly
                        className="bg-gray-50 border-gray-200 text-gray-900"
                        placeholder={!isValidUser ? "Not available" : ""}
                      />
                      <Calendar className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    </div>
                  </div>

                  <div>
                    <Label
                      htmlFor="billing-date"
                      className="text-sm font-medium text-gray-700"
                    >
                      Next billing date:
                    </Label>
                    <div className="mt-1 relative">
                      <Input
                        id="billing-date"
                        value={isValidUser ? getNextBillingDate() : ""}
                        readOnly
                        className="bg-gray-50 border-gray-200 text-gray-900"
                        placeholder={!isValidUser ? "Not available" : ""}
                      />
                      <CreditCard className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    </div>
                  </div>
                </div>

                <Separator />

                <div>
                  {isValidUser && isSubscribed ? (
                    <Button 
                      variant="destructive" 
                      className="rounded-full px-8"
                      onClick={handleCancelSubscription}
                      disabled={createPortalSessionMutation.isPending}
                    >
                      {createPortalSessionMutation.isPending ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Opening...
                        </>
                      ) : (
                        "Cancel subscription"
                      )}
                    </Button>
                  ) : (
                    <div className="text-center py-4">
                      <p className="text-gray-500 text-sm">
                        {!isAuthenticated 
                          ? "Please sign in to manage your subscription"
                          : !isValidUser
                          ? "Account information not available"
                          : "No active subscription to cancel"
                        }
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Profile Picture Section */}
          {isAuthenticated && (
            <div>
              <Card className="rounded-2xl border border-gray-200 shadow-sm">
                <CardContent className="p-6">
                  <div className="text-center">
                    {isValidUser && userInfo.image ? (
                      <div className="w-32 h-32 mx-auto mb-6 rounded-full overflow-hidden">
                        <img
                          src={userInfo.image}
                          alt="Profile"
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ) : (
                      <div
                        className="w-32 h-32 mx-auto mb-6 rounded-full flex items-center justify-center"
                        style={{
                          backgroundImage:
                            "linear-gradient(to bottom right, #FFECD2, #FFDECA)",
                        }}
                      >
                        <div
                          className="w-16 h-16 rounded-full flex items-center justify-center"
                          style={{
                            backgroundImage:
                              "linear-gradient(to bottom right, #F7D379, #F9B288)",
                          }}
                        >
                          <User className="w-8 h-8 text-white" />
                        </div>
                      </div>
                    )}

                    <h3 className="font-semibold text-gray-900 mb-2">
                      Profile Picture
                    </h3>
                    <p className="text-sm text-gray-600 mb-4">
                      Upload a photo to personalize your account
                    </p>

                    <Button variant="outline" className="rounded-full">
                      Upload Photo
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>
    </NextLayout>
  );
}
