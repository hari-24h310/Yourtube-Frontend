"use client";

import React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";

export default function PaymentSuccessPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const plan = searchParams.get("plan");
  const amount = searchParams.get("amount");

  const PLAN_NAMES: any = {
    bronze: "Bronze",
    silver: "Silver",
    gold: "Gold",
  };

  const planName = plan ? (PLAN_NAMES[plan as string] ?? plan) : 'Unknown';

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-blue-50 p-4">
      <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full text-center">
        <div className="mb-6">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Check className="w-8 h-8 text-green-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Payment Successful!
          </h1>
          <p className="text-gray-600">
            Your upgrade has been completed successfully.
          </p>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <p className="text-sm text-gray-600 mb-2">Plan Upgraded To</p>
          <p className="text-2xl font-bold text-blue-600 mb-2">
            {planName}
          </p>
          <p className="text-sm text-gray-600 mb-2">Amount Paid</p>
          <p className="text-xl font-bold text-gray-900">₹{amount}</p>
        </div>

        <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
          <p className="text-sm font-semibold text-green-900 mb-2">
            ✓ Benefits Activated
          </p>
          <ul className="text-sm text-green-800 space-y-1 text-left">
            <li>✓ Unlimited downloads</li>
            <li>✓ Extended watch time</li>
            <li>✓ Ad-free experience</li>
            <li>✓ Priority support</li>
          </ul>
        </div>

        <p className="text-sm text-gray-600 mb-6">
          An invoice has been sent to your registered email address.
        </p>

        <div className="space-y-3">
          <Button
            onClick={() => router.push("/")}
            className="w-full py-6 text-lg"
          >
            Go to Home
          </Button>
          <Button
            variant="outline"
            onClick={() => router.push("/downloads")}
            className="w-full"
          >
            View Downloads
          </Button>
        </div>

        <p className="text-xs text-gray-500 mt-6">
          Thank you for upgrading! Enjoy your premium experience.
        </p>
      </div>
    </div>
  );
}
