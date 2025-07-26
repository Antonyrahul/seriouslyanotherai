import { AdvertiseContent } from "@/components/advertise/advertise-content";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getSubscriptionTools } from "@/app/actions/tools-crud";

export default async function AdvertisePage() {
  // Authentication required for advertisement management
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    redirect("/sign-in?from=advertise");
  }

  // Load user's subscription tools that can be boosted with advertisements
  const subscriptionTools = await getSubscriptionTools();

  return <AdvertiseContent subscriptionTools={subscriptionTools} />;
}
