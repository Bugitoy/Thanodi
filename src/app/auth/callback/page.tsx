"use client";

import { useKindeBrowserClient } from "@kinde-oss/kinde-auth-nextjs";
import { useQuery } from "@tanstack/react-query";
import Loader from "@/components/Loader";
import { useRouter } from "next/navigation";
import { checkAuthStatus } from "./actions";
import { useEffect } from "react";

const Page = () => {
  const router = useRouter();
  const { user } = useKindeBrowserClient();

  const { data } = useQuery({
    queryKey: ["checkAuthStatus"],
    queryFn: async () => await checkAuthStatus(),
  });

  useEffect(() => {
    const stripePaymentLink = localStorage.getItem("stripePaymentLink");

    if (data?.success && stripePaymentLink && user?.email) {
      localStorage.removeItem("stripePaymentLink");
      router.push(`${stripePaymentLink}?prefilled_email=${user.email}`);
    } else if (data?.success === false) {
      router.push("/");
    } else if (data?.success === true && !stripePaymentLink) {
      router.push("/");
    }
  }, [data, router, user]);

  return (
    <div className="mt-20 w-full flex justify-center">
      <div className="flex flex-col items-center gap-2">
        <Loader />
        <h3 className="text-xl font-bold">Redirecting...</h3>
        <p>Please wait</p>
      </div>
    </div>
  );
};

export default Page;
