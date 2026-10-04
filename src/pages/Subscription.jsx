import { useEffect, useState } from "react";
import { Check, Crown, X, Loader2 } from "lucide-react";

import api from "@/services/api";

const Subscription = () => {
  const [subscription, setSubscription] = useState(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [message, setMessage] = useState("");

  const fetchSubscription = async () => {
    try {
      setLoading(true);

      const response = await api.get(`/subscriptions/me`);

      if (response.data?.success) {
        setSubscription(response.data.subscription);
      }
    } catch (error) {
      if (error.response?.status === 404) {
        setSubscription(null);
      } else {
        console.error("Subscription fetch error:", error);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubscription();
  }, []);

  const handleUpgrade = async () => {
    try {
      setProcessing(true);
      setMessage("");

      const response = await api.post(`/subscriptions`, {
        plan: "PREMIUM",
      });

      if (response.data?.success) {
        setSubscription(response.data.subscription);
        setMessage("Premium activated successfully.");
      }
    } catch (error) {
      console.error("Upgrade error:", error);

      setMessage(
        error.response?.data?.message || "Unable to activate Premium.",
      );
    } finally {
      setProcessing(false);
    }
  };

  const handleCancel = async () => {
    const confirmed = window.confirm(
      "Are you sure you want to cancel your Premium subscription?",
    );

    if (!confirmed) return;

    try {
      setProcessing(true);
      setMessage("");

      const response = await api.patch(`/subscriptions/cancel`, {});

      if (response.data?.success) {
        setSubscription(response.data.subscription);
        setMessage("Subscription cancelled successfully.");
      }
    } catch (error) {
      console.error("Cancel subscription error:", error);

      setMessage(
        error.response?.data?.message || "Unable to cancel subscription.",
      );
    } finally {
      setProcessing(false);
    }
  };

  const isPremium =
    subscription?.plan === "PREMIUM" && subscription?.status === "ACTIVE";

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <Loader2 className="animate-spin" size={30} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white px-4 py-10 md:px-10">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-yellow-500/10 text-yellow-400 border border-yellow-500/20 mb-4">
            <Crown size={18} />
            Premium Membership
          </div>

          <h1 className="text-3xl md:text-5xl font-bold mb-4">
            Choose your plan
          </h1>

          <p className="text-gray-400 max-w-2xl mx-auto">
            Enjoy your entertainment with a Premium experience.
          </p>
        </div>

        {message && (
          <div className="max-w-2xl mx-auto mb-8 px-4 py-3 rounded-lg bg-white/5 border border-white/10 text-center text-sm">
            {message}
          </div>
        )}

        <div className="grid md:grid-cols-2 gap-6 max-w-5xl mx-auto">
          {/* FREE */}
          <div className="rounded-2xl border border-white/10 bg-white/5 p-7">
            <h2 className="text-2xl font-bold mb-2">Free</h2>

            <p className="text-gray-400 mb-6">Basic access to the platform.</p>

            <div className="text-4xl font-bold mb-8">
              ₹0
              <span className="text-base text-gray-500 font-normal">
                /month
              </span>
            </div>

            <div className="space-y-4 mb-8">
              <Feature text="Access free content" />
              <Feature text="Create your watch list" />
              <Feature text="Watch history" />
              <Feature text="Personalized recommendations" />
            </div>

            {!isPremium && (
              <button
                disabled
                className="w-full py-3 rounded-xl bg-white/10 text-gray-400 cursor-not-allowed"
              >
                Current Plan
              </button>
            )}
          </div>

          {/* PREMIUM */}
          <div className="rounded-2xl border border-yellow-500/40 bg-gradient-to-b from-yellow-500/10 to-white/5 p-7 relative overflow-hidden">
            <div className="absolute top-4 right-4 px-3 py-1 text-xs font-semibold rounded-full bg-yellow-500 text-black">
              PREMIUM
            </div>

            <h2 className="text-2xl font-bold mb-2 flex items-center gap-2">
              <Crown className="text-yellow-400" size={24} />
              Premium
            </h2>

            <p className="text-gray-400 mb-6">
              Full access to Premium content.
            </p>

            <div className="text-4xl font-bold mb-8">
              ₹299
              <span className="text-base text-gray-500 font-normal">
                /month
              </span>
            </div>

            <div className="space-y-4 mb-8">
              <Feature text="Premium content access" />
              <Feature text="HD / Full HD streaming" />
              <Feature text="Unlimited watch list" />
              <Feature text="Watch history" />
              <Feature text="Personalized recommendations" />
            </div>

            {isPremium ? (
              <div className="space-y-3">
                <div className="w-full py-3 rounded-xl bg-green-500/15 text-green-400 text-center font-semibold">
                  Premium Active
                </div>

                {subscription?.endDate && (
                  <p className="text-center text-sm text-gray-400">
                    Expires on{" "}
                    {new Date(subscription.endDate).toLocaleDateString("en-IN")}
                  </p>
                )}

                <button
                  onClick={handleCancel}
                  disabled={processing}
                  className="w-full py-3 rounded-xl border border-red-500/30 text-red-400 hover:bg-red-500/10 transition disabled:opacity-50"
                >
                  {processing ? (
                    <span className="flex items-center justify-center gap-2">
                      <Loader2 size={18} className="animate-spin" />
                      Processing...
                    </span>
                  ) : (
                    "Cancel Subscription"
                  )}
                </button>
              </div>
            ) : (
              <button
                onClick={handleUpgrade}
                disabled={processing}
                className="w-full py-3 rounded-xl bg-yellow-500 hover:bg-yellow-400 text-black font-bold transition disabled:opacity-50"
              >
                {processing ? (
                  <span className="flex items-center justify-center gap-2">
                    <Loader2 size={18} className="animate-spin" />
                    Activating...
                  </span>
                ) : (
                  "Upgrade to Premium"
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const Feature = ({ text }) => (
  <div className="flex items-center gap-3 text-gray-300">
    <div className="w-6 h-6 rounded-full bg-green-500/10 flex items-center justify-center">
      <Check size={15} className="text-green-400" />
    </div>

    <span>{text}</span>
  </div>
);

export default Subscription;
