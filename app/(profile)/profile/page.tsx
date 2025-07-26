import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { ProfileContent } from "@/components/profile/profile-content";
import {
  getUserSubscription,
  needsToolSelection,
  canUserSelectToolsThisMonth,
} from "@/app/actions/tools";
import { getUserAdvertisements } from "@/app/actions/advertise";
import {
  getSubscriptionTools,
  getAdvertisementTools,
} from "@/app/actions/tools-crud";

export default async function ProfilePage() {
  // Protected route - authentication required
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    redirect("/sign-in");
  }

  const isAdmin = session.user.role === "admin";

  // Fetch user data with separation between subscription and advertisement tools
  const [
    subscriptionTools,
    advertisementTools,
    userSubscription,
    selectionNeeded,
    selectionEligibility,
    userAdvertisements,
  ] = await Promise.all([
    getSubscriptionTools(), // Tools submitted via subscription (count towards limits)
    getAdvertisementTools(), // Tools submitted via advertisement (don't count towards limits)
    getUserSubscription(), // Current Stripe subscription details
    needsToolSelection(), // Whether user needs to select featured tools
    canUserSelectToolsThisMonth(), // Monthly tool selection eligibility
    getUserAdvertisements(), // Active advertisement campaigns
  ]);

  // Combine all user tools for display purposes
  const allUserTools = [...subscriptionTools, ...advertisementTools];

  // Tool selection system - users can choose which tools to feature monthly
  const toolSelectionInfo = {
    needsSelection: selectionNeeded.needsSelection,
    totalTools: selectionNeeded.totalTools, // Only subscription tools count towards limits
    limit: selectionNeeded.limit,
    plan: selectionNeeded.plan,
    canSelect: selectionEligibility.canSelect,
    nextSelectionDate: selectionEligibility.nextSelectionDate,
  };

  return (
    <ProfileContent
      user={session.user}
      userTools={allUserTools} // All tools displayed in profile
      subscriptionTools={subscriptionTools} // Used for limit calculations only
      userSubscription={userSubscription}
      toolSelectionInfo={toolSelectionInfo}
      userAdvertisements={userAdvertisements}
      isAdmin={isAdmin}
    />
  );
}
