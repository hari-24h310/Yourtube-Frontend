"use client";

import React, { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import axiosInstance from "@/lib/axiosinstance";
import { Button } from "@/components/ui/button";

declare global {
  interface Window {
    Razorpay: any;
  }
}

const PLAN_DETAILS: any = {
  bronze: { name: "Bronze", amount: 1000, description: "7 minutes watch time" },
  silver: { name: "Silver", amount: 5000, description: "10 minutes watch time" },
  gold: { name: "Gold", amount: 10000, description: "Unlimited watch time" },
};

export default function CheckoutPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [scriptReady, setScriptReady] = useState(false);

  const plan = searchParams.get("plan");
  const userId = searchParams.get("userId");
  const userEmail = searchParams.get("email");

  useEffect(() => {
    // Already loaded check
    if (window.Razorpay) {
      setScriptReady(true);
      return;
    }

    const existing = document.querySelector(
      'script[src="https://checkout.razorpay.com/v1/checkout.js"]'
    );
    if (existing) {
      existing.addEventListener("load", () => setScriptReady(true));
      return;
    }

    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    script.onload = () => {
      console.log("✅ Razorpay script loaded");
      setScriptReady(true);
    };
    script.onerror = () => {
      console.error("❌ Razorpay script failed to load");
      setError("Failed to load payment gateway. Check your internet connection.");
    };
    document.body.appendChild(script);

    return () => {
      if (document.body.contains(script)) {
        document.body.removeChild(script);
      }
    };
  }, []);

  if (!plan || !userId) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600">Invalid plan or user information</p>
        <Button onClick={() => router.push("/plans")} className="mt-4">
          Go Back to Plans
        </Button>
      </div>
    );
  }

  const planDetails = PLAN_DETAILS[plan];
  if (!planDetails) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600">Invalid plan selected</p>
        <Button onClick={() => router.push("/plans")} className="mt-4">
          Go Back to Plans
        </Button>
      </div>
    );
  }

  const handlePayment = async () => {
    const normalizedUserId = userId || sessionStorage.getItem("userId") || undefined;
    if (!normalizedUserId) {
      setError("Missing user id. Please sign in again.");
      return;
    }

    if (!window.Razorpay) {
      setError("Payment gateway not loaded. Please refresh the page and try again.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const orderRes = await axiosInstance.post("/payment/create-order", {
        userId: normalizedUserId,
        planType: plan,
        amount: planDetails.amount,
        currency: "INR",
      });

      const { orderId, amount, currency, mock } = orderRes.data;

      if (mock) {
        const verifyRes = await axiosInstance.post("/payment/verify", {
          razorpay_order_id: orderId,
          razorpay_payment_id: `mock_payment_${Date.now()}`,
          razorpay_signature: "mock_signature",
          mock: true,
          userId: normalizedUserId,
          planType: plan,
          userEmail,
        });

        if (verifyRes.data.success) {
          try {
            await axiosInstance.post("/plan/upgrade", {
              userId: normalizedUserId,
              planType: plan,
              paymentId: verifyRes.data.paymentId || `mock_payment_${Date.now()}`,
              orderId: orderId,
            });
          } catch (e) {
            console.warn("Plan upgrade failed after mock verify:", e);
          }

          router.push(`/payment-success?plan=${plan}&amount=${planDetails.amount / 100}`);
          return;
        }

        setError(verifyRes.data?.message || "Mock payment verification failed");
        setLoading(false);
        return;
      }

      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || "rzp_test_1DP5mmOlF5G5ag",
        amount: amount,
        currency: currency,
        name: "YourTube",
        description: `${planDetails.name} Plan - ${planDetails.description}`,
        order_id: orderId,
        handler: async (response: any) => {
          try {
            const verifyRes = await axiosInstance.post("/payment/verify", {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              userId: normalizedUserId,
              planType: plan,
              userEmail,
            });

            if (verifyRes.data.success) {
              try {
                await axiosInstance.post("/plan/upgrade", {
                  userId: normalizedUserId,
                  planType: plan,
                  paymentId: response.razorpay_payment_id,
                  orderId: response.razorpay_order_id,
                });
              } catch (upgradeErr) {
                console.warn("Plan upgrade failed after payment verify:", upgradeErr);
              }

              router.push(
                `/payment-success?plan=${plan}&amount=${planDetails.amount / 100}`
              );
            }
          } catch (error: any) {
            setError(
              error.response?.data?.message || "Payment verification failed"
            );
            setLoading(false);
          }
        },
        prefill: {
          email: userEmail || "",
        },
        theme: {
          color: "#0066cc",
        },
        modal: {
          ondismiss: () => {
            setLoading(false);
          },
        },
      };

      const razorpay = new window.Razorpay(options);
      razorpay.open();
    } catch (error: any) {
      setError(error.response?.data?.message || "Failed to create payment order");
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto py-12">
      <div className="bg-white border rounded-lg p-8 shadow-lg">
        <h1 className="text-3xl font-bold mb-6">Order Summary</h1>

        {!scriptReady && (
          <div className="bg-yellow-50 border border-yellow-200 text-yellow-700 p-3 rounded mb-4 text-sm">
            ⏳ Loading payment gateway...
          </div>
        )}

        <div className="space-y-4 mb-8 pb-8 border-b">
          <div className="flex justify-between">
            <span className="text-gray-600">Plan</span>
            <span className="font-semibold">{planDetails.name}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Features</span>
            <span className="font-semibold text-right text-sm">
              {planDetails.description}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Duration</span>
            <span className="font-semibold">30 days</span>
          </div>
          <div className="flex justify-between text-lg">
            <span className="font-bold">Total Amount</span>
            <span className="font-bold text-xl text-blue-600">
              ₹{planDetails.amount / 100}
            </span>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded mb-4">
            {error}
          </div>
        )}

        {error && !loading && (
          <div className="flex gap-2 mb-4">
            <Button onClick={handlePayment} className="flex-1">
              Retry Payment
            </Button>
            <Button variant="ghost" onClick={() => router.push("/plans")}>
              Change Plan
            </Button>
          </div>
        )}

        <Button
          onClick={handlePayment}
          disabled={loading || !scriptReady}
          className="w-full py-6 text-lg"
        >
          {loading
            ? "Processing..."
            : !scriptReady
            ? "Loading..."
            : "Pay with Razorpay"}
        </Button>

        <p className="text-xs text-gray-500 text-center mt-4">
          Secure payment powered by Razorpay. Your payment information is encrypted.
        </p>

        <Button
          variant="outline"
          onClick={() => router.push("/plans")}
          className="w-full mt-3"
          disabled={loading}
        >
          Cancel
        </Button>
      </div>
    </div>
  );
}