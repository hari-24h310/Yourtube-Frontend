"use client";

import React, { useEffect, useState } from "react";
import axiosInstance from "@/lib/axiosinstance";
import { useUser } from "@/lib/AuthContext";
import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";

interface Plan {
  type: string;
  name: string;
  price: number;
  watchTimeLimit: string;
}

export default function PlansPage() {
  const { user } = useUser();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [userPlan, setUserPlan] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPlans();
    if (user?._id) {
      fetchUserPlan();
    }
  }, [user]);

  const fetchPlans = async () => {
    try {
      const res = await axiosInstance.get("/payment/plans");
      setPlans(res.data.plans);
    } catch (error) {
      console.log("Error fetching plans:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUserPlan = async () => {
    try {
      const userId = user?._id;
      if (!userId) return;
      const res = await axiosInstance.get(`/payment/user-plan/${userId}`);
      setUserPlan(res.data);
    } catch (error) {
      console.log("Error fetching user plan:", error);
    }
  };

  const handleUpgrade = (planType: string) => {
    const userId = user?._id;
    if (!userId) {
      alert("Please sign in to upgrade");
      return;
    }

    // Redirect to checkout page with plan type
    window.location.href = `/checkout?plan=${planType}&userId=${userId}&email=${user.email}`;
  };

  if (loading) {
    return <div className="text-center py-12">Loading plans...</div>;
  }

  const freePlanPrice = 0;
  const isPremium = userPlan?.planType !== "free";

  return (
    <div className="space-y-8">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold mb-2">Choose Your Plan</h1>
        <p className="text-gray-600 text-lg">
          Select the perfect plan for your viewing experience
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Free Plan */}
        <div className="border-2 border-gray-200 rounded-lg p-6 hover:border-gray-400 transition">
          <h2 className="text-2xl font-bold mb-2">Free</h2>
          <div className="mb-4">
            <span className="text-3xl font-bold">₹0</span>
            <span className="text-gray-600 ml-2">/month</span>
          </div>

          <div className="space-y-3 mb-6">
            <div className="flex items-center gap-2">
              <Check className="w-5 h-5 text-green-500" />
              <span>5 minutes watch time</span>
            </div>
            <div className="flex items-center gap-2">
              <Check className="w-5 h-5 text-green-500" />
              <span>1 download per day</span>
            </div>
            <div className="flex items-center gap-2">
              <Check className="w-5 h-5 text-green-500" />
              <span>Basic features</span>
            </div>
          </div>

          <Button
            className="w-full"
            disabled={!isPremium}
            variant={isPremium ? "outline" : "default"}
          >
            {isPremium ? "Current Plan" : "Current Plan"}
          </Button>
        </div>

        {/* Paid Plans */}
        {plans.map((plan) => (
          <div
            key={plan.type}
            className={`border-2 rounded-lg p-6 transition ${
              userPlan?.planType === plan.type
                ? "border-blue-500 bg-blue-50"
                : "border-gray-200 hover:border-blue-400"
            }`}
          >
            <h2 className="text-2xl font-bold mb-2">{plan.name}</h2>
            <div className="mb-4">
              <span className="text-3xl font-bold">₹{plan.price}</span>
              <span className="text-gray-600 ml-2">/month</span>
            </div>

            <div className="space-y-3 mb-6">
              <div className="flex items-center gap-2">
                <Check className="w-5 h-5 text-green-500" />
                <span>{plan.watchTimeLimit} watch time</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-5 h-5 text-green-500" />
                <span>Unlimited downloads</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-5 h-5 text-green-500" />
                <span>Ad-free experience</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-5 h-5 text-green-500" />
                <span>Priority support</span>
              </div>
            </div>

            <Button
              className="w-full"
              onClick={() => handleUpgrade(plan.type)}
              variant={
                userPlan?.planType === plan.type ? "default" : "outline"
              }
            >
              {userPlan?.planType === plan.type
                ? "Current Plan"
                : "Upgrade Now"}
            </Button>

            {userPlan?.planType === plan.type && userPlan?.expiryDate && (
              <p className="text-xs text-gray-600 mt-2 text-center">
                Valid until: {new Date(userPlan.expiryDate).toLocaleDateString()}
              </p>
            )}
          </div>
        ))}
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mt-12">
        <h3 className="text-lg font-bold text-blue-900 mb-3">
          Need help choosing?
        </h3>
        <p className="text-blue-800">
          All premium plans include unlimited downloads, ad-free experience, and priority support.
          The main difference is the watch time limit per video. Start with Bronze if you're unsure!
        </p>
      </div>
    </div>
  );
}
