"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { useSearchParams } from "next/navigation";

import { authClient } from "@/lib/auth-client";
import { Logo } from "../logo";

export function SignInForm() {
  const [loadingButtons, setLoadingButtons] = useState({
    google: false,
    github: false,
  });
  const [error, setError] = useState<string | null>(null);

  // Check if user came from submit page
  const searchParams = useSearchParams();
  const isFromSubmit = searchParams.get("from") === "submit";
  const isFromAdvertise = searchParams.get("from") === "advertise";

  const handleLogin = async (provider: "google" | "github") => {
    setLoadingButtons((prev) => ({ ...prev, [provider]: true }));
    setError(null);

    try {
      await authClient.signIn.social({
        provider,
        callbackURL: isFromSubmit
          ? "/submit"
          : isFromAdvertise
          ? "/advertise"
          : "/",
      });
    } catch (error) {
      setError(error instanceof Error ? error.message : "An error occurred");
    } finally {
      setLoadingButtons((prev) => ({ ...prev, [provider]: false }));
    }
  };

  return (
    <div className="min-h-[calc(100vh-100px)] flex flex-col">
      {/* Back button */}
      <div className="px-6 pt-6">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="text-sm">Back</span>
        </Link>
      </div>

      {/* Main content */}
      <div className="flex-1 flex items-center justify-center px-6">
        <div className="w-full max-w-xs">
          {/* Title */}
          <div className="text-center mb-4 flex flex-col items-center gap-2">
            <Logo />
            <h1 className="text-2xl font-semibold text-gray-900 ">
              {isFromSubmit
                ? "Sign in to submit"
                : isFromAdvertise
                ? "Sign in to advertise"
                : "Welcome back"}
            </h1>
            <p className="text-gray-600 text-sm">
              {isFromSubmit
                ? "You need to be signed in to submit a tool."
                : isFromAdvertise
                ? "You need to be signed in to advertise."
                : "Continue with your preferred method."}
            </p>
          </div>

          {/* Error message */}
          {error && (
            <div className="mb-6 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          {/* Login buttons */}
          <div className="space-y-2">
            <button
              onClick={() => handleLogin("google")}
              disabled={loadingButtons.google}
              className="w-full flex items-center justify-center gap-2 px-1 py-1.5 bg-white border border-gray-200 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="0.98em"
                height="1em"
                viewBox="0 0 256 262"
              >
                <path
                  fill="#4285F4"
                  d="M255.878 133.451c0-10.734-.871-18.567-2.756-26.69H130.55v48.448h71.947c-1.45 12.04-9.283 30.172-26.69 42.356l-.244 1.622l38.755 30.023l2.685.268c24.659-22.774 38.875-56.282 38.875-96.027"
                ></path>

                <path
                  fill="#34A853"
                  d="M130.55 261.1c35.248 0 64.839-11.605 86.453-31.622l-41.196-31.913c-11.024 7.688-25.82 13.055-45.257 13.055c-34.523 0-63.824-22.773-74.269-54.25l-1.531.13l-40.298 31.187l-.527 1.465C35.393 231.798 79.49 261.1 130.55 261.1"
                ></path>

                <path
                  fill="#FBBC05"
                  d="M56.281 156.37c-2.756-8.123-4.351-16.827-4.351-25.82c0-8.994 1.595-17.697 4.206-25.82l-.073-1.73L15.26 71.312l-1.335.635C5.077 89.644 0 109.517 0 130.55s5.077 40.905 13.925 58.602z"
                ></path>

                <path
                  fill="#EB4335"
                  d="M130.55 50.479c24.514 0 41.05 10.589 50.479 19.438l36.844-35.974C195.245 12.91 165.798 0 130.55 0C79.49 0 35.393 29.301 13.925 71.947l42.211 32.783c10.59-31.477 39.891-54.251 74.414-54.251"
                ></path>
              </svg>
              <span className="font-medium">
                {loadingButtons.google
                  ? "Signing in..."
                  : "Continue with Google"}
              </span>
            </button>

            <button
              onClick={() => handleLogin("github")}
              disabled={loadingButtons.github}
              className="w-full flex items-center justify-center gap-2 px-1 py-1.5 bg-white border border-gray-200 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="1em"
                height="1em"
                viewBox="0 0 24 24"
              >
                <path
                  fill="currentColor"
                  d="M12 2A10 10 0 0 0 2 12c0 4.42 2.87 8.17 6.84 9.5c.5.08.66-.23.66-.5v-1.69c-2.77.6-3.36-1.34-3.36-1.34c-.46-1.16-1.11-1.47-1.11-1.47c-.91-.62.07-.6.07-.6c1 .07 1.53 1.03 1.53 1.03c.87 1.52 2.34 1.07 2.91.83c.09-.65.35-1.09.63-1.34c-2.22-.25-4.55-1.11-4.55-4.92c0-1.11.38-2 1.03-2.71c-.1-.25-.45-1.29.1-2.64c0 0 .84-.27 2.75 1.02c.79-.22 1.65-.33 2.5-.33s1.71.11 2.5.33c1.91-1.29 2.75-1.02 2.75-1.02c.55 1.35.2 2.39.1 2.64c.65.71 1.03 1.6 1.03 2.71c0 3.82-2.34 4.66-4.57 4.91c.36.31.69.92.69 1.85V21c0 .27.16.59.67.5C19.14 20.16 22 16.42 22 12A10 10 0 0 0 12 2"
                ></path>
              </svg>
              <span className="font-medium">
                {loadingButtons.github
                  ? "Signing in..."
                  : "Continue with GitHub"}
              </span>
            </button>
          </div>

          {/* Terms and Privacy notice */}
          <div className="mt-4 text-center">
            <p className="text-xs text-gray-500">
              By signing in, you agree to our{" "}
              <Link href="/terms" className="text-primary hover:underline">
                Terms of Service
              </Link>{" "}
              and{" "}
              <Link href="/privacy" className="text-primary hover:underline">
                Privacy Policy
              </Link>
              .
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
