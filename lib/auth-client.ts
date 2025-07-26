import { createAuthClient } from "better-auth/react";
import { adminClient } from "better-auth/client/plugins";
import { stripeClient } from "@better-auth/stripe/client";

export const authClient = createAuthClient({
  baseURL:
    process.env.NODE_ENV === "production"
      ? process.env.NEXT_PUBLIC_APP_URL
      : "http://localhost:3000",
  plugins: [
    adminClient(),
    stripeClient({
      subscription: true,
    }),
  ],
});
