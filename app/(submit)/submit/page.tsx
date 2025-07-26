import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { SubmitContent } from "@/components/submit/submit-content";
import { getUserSubscription } from "@/app/actions/tools";
import { getSubscriptionTools } from "@/app/actions/tools-crud";
import { getPlanLimit } from "@/lib/constants/config";

export default async function SubmitPage() {
  // Authentication required for tool submission
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    redirect("/sign-in?from=submit");
  }

  // Load user's current subscription and tools for limit calculations
  const [userSubscription, subscriptionTools] = await Promise.all([
    getUserSubscription(), // Current Stripe subscription details
    getSubscriptionTools(), // Only subscription tools count towards limits
  ]);

  const userToolsCount = subscriptionTools.length; // Only count subscription tools
  const isFirstTool = subscriptionTools.length === 0; // First submission triggers subscription flow

  // Dynamic subscription limit calculation based on current plan
  const getSubscriptionLimits = () => {
    // First tool submission is always allowed (redirects to Stripe checkout)
    if (isFirstTool) {
      return { limit: 1, remaining: 1, canSubmit: true };
    }

    // Subsequent submissions require active subscription
    if (!userSubscription) return { limit: 0, remaining: 0, canSubmit: false };

    // Use centralized plan limits configuration
    const limit = getPlanLimit(userSubscription.plan);
    const remaining = Math.max(0, limit - userToolsCount);
    const canSubmit = remaining > 0;

    return { limit, remaining, canSubmit };
  };

  const subscriptionLimits = getSubscriptionLimits();

  return (
    <SubmitContent
      userToolsCount={userToolsCount}
      isFirstTool={isFirstTool}
      subscriptionLimits={subscriptionLimits}
    />
  );
}
