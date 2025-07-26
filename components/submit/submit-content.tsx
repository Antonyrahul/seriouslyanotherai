/* eslint-disable @next/next/no-img-element */
"use client";

import { ArrowLeft, Check, Upload, X } from "lucide-react";
import Link from "next/link";
import { useState, useRef } from "react";
import { authClient } from "@/lib/auth-client";
import { createTool, fetchUrlDescription } from "@/app/actions/tools";
import { CATEGORIES } from "@/lib/constants/categories";
import { validateUrl } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface SubscriptionLimits {
  limit: number;
  remaining: number;
  canSubmit: boolean;
}

interface SubmitContentProps {
  userToolsCount: number;
  isFirstTool: boolean;
  subscriptionLimits: SubscriptionLimits;
}

export function SubmitContent({
  isFirstTool,
  subscriptionLimits,
}: SubmitContentProps) {
  const [toolName, setToolName] = useState("");
  const [toolUrl, setToolUrl] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedPlan, setSelectedPlan] = useState("starter-monthly");
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [appImageFile, setAppImageFile] = useState<File | null>(null); // Optional app image
  const [appImagePreview, setAppImagePreview] = useState<string | null>(null); // Optional app image preview
  const [promoCode, setPromoCode] = useState(""); // Optional promo code
  const [promoDiscount, setPromoDiscount] = useState(""); // Optional promo discount percentage
  const [isDragOver, setIsDragOver] = useState(false);
  const [isAppImageDragOver, setIsAppImageDragOver] = useState(false); // Separate drag state for app image
  const [logoError, setLogoError] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState({
    name: false,
    url: false,
    category: false,
    logo: false,
  });

  const fileInputRef = useRef<HTMLInputElement>(null);
  const appImageInputRef = useRef<HTMLInputElement>(null); // Reference for app image input

  // Filter out "All" category for the dropdown
  const categoryOptions = CATEGORIES.filter((cat) => cat.name !== "All");

  // Check if form is valid
  const isFormValid =
    toolName.trim() && toolUrl.trim() && logoFile && selectedCategory;

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setToolName(e.target.value);
    setSubmitError(null);
    setFieldErrors((prev) => ({ ...prev, name: false }));
  };

  const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setToolUrl(e.target.value);
    setSubmitError(null);
    setFieldErrors((prev) => ({ ...prev, url: false }));
  };

  const processFile = (file: File) => {
    // Check file size (5MB limit for logo)
    const maxSize = 5 * 1024 * 1024; // 5MB in bytes
    if (file.size > maxSize) {
      setSubmitError("Logo file is too large. Please select a file under 5MB.");
      setLogoError(true);
      setFieldErrors((prev) => ({ ...prev, logo: true }));
      return;
    }

    setLogoFile(file);
    setLogoError(false);
    setSubmitError(null);
    setFieldErrors((prev) => ({ ...prev, logo: false }));

    // Create preview
    const reader = new FileReader();
    reader.onload = (event) => {
      setLogoPreview(event.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    processFile(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      processFile(files[0]);
    }
  };

  const removeLogo = () => {
    setLogoFile(null);
    setLogoPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // App image handling functions
  const processAppImageFile = (file: File) => {
    // Check file size (5MB limit)
    const maxSize = 5 * 1024 * 1024; // 5MB in bytes
    if (file.size > maxSize) {
      setSubmitError(
        "App image file is too large. Please select a file under 5MB."
      );
      return;
    }

    setAppImageFile(file);
    setSubmitError(null);

    // Create preview
    const reader = new FileReader();
    reader.onload = (event) => {
      setAppImagePreview(event.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleAppImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    processAppImageFile(file);
  };

  const handleAppImageDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsAppImageDragOver(true);
  };

  const handleAppImageDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsAppImageDragOver(false);
  };

  const handleAppImageDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsAppImageDragOver(false);

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      processAppImageFile(files[0]);
    }
  };

  const removeAppImage = () => {
    setAppImageFile(null);
    setAppImagePreview(null);
    if (appImageInputRef.current) {
      appImageInputRef.current.value = "";
    }
  };

  const uploadLogo = async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append("file", file);

    const response = await fetch("/api/upload-image", {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      // Get the specific error message from the API
      const errorData = await response.json();
      throw new Error(errorData.error || "Failed to upload image");
    }

    const { url } = await response.json();
    return url;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation complète des champs obligatoires
    const urlValidation = validateUrl(toolUrl);

    // Validation des codes promo - les deux doivent être renseignés ensemble
    const promoCodeFilled = promoCode.trim() !== "";
    const promoDiscountFilled = promoDiscount.trim() !== "";
    const promoValidation = promoCodeFilled === promoDiscountFilled; // Both filled or both empty

    const errors = {
      name: !toolName.trim(),
      url: !toolUrl.trim() || !urlValidation.isValid,
      logo: !logoFile,
      category: !selectedCategory,
    };

    setFieldErrors(errors);
    setLogoError(errors.logo);

    if (errors.name || errors.url || errors.logo || errors.category) {
      if (errors.name) setSubmitError("Tool name is required");
      else if (errors.url && !toolUrl.trim())
        setSubmitError("Tool URL is required");
      else if (errors.url && !urlValidation.isValid)
        setSubmitError(urlValidation.error || "Invalid URL");
      else if (errors.logo) setSubmitError("Logo is required");
      else if (errors.category) setSubmitError("Category is required");
      return;
    }

    // Validation des codes promo
    if (!promoValidation) {
      if (promoCodeFilled && !promoDiscountFilled) {
        setSubmitError(
          "Discount percentage is required when discount code is provided"
        );
      } else if (!promoCodeFilled && promoDiscountFilled) {
        setSubmitError(
          "Discount code is required when discount percentage is provided"
        );
      }
      return;
    }

    // Check subscription limits for additional tools
    if (!isFirstTool && !subscriptionLimits.canSubmit) {
      setSubmitError(
        "You have reached your limit. Upgrade to submit more tools."
      );
      return;
    }

    setIsSubmitting(true);
    setLogoError(false);
    setSubmitError(null);
    setFieldErrors({ name: false, url: false, category: false, logo: false });

    try {
      // 1. Upload logo first
      const logoUrl = await uploadLogo(logoFile!);

      // 2. Upload app image if provided (optional)
      let appImageUrl: string | null = null;
      if (appImageFile) {
        appImageUrl = await uploadLogo(appImageFile); // Reuse same upload function
      }

      // 3. Fetch description from URL (with fallback protection)
      let description = "No description available";
      try {
        description = await fetchUrlDescription(toolUrl);
      } catch (descriptionError) {
        console.warn(
          "Description fetch failed, using fallback:",
          descriptionError
        );
        // Continue with default description - don't block submission
      }

      // 4. Create tool in DB
      const result = await createTool(
        toolUrl,
        logoUrl,
        toolName,
        selectedCategory,
        description,
        appImageUrl, // Add the app image URL parameter
        promoCode || undefined, // Add promo code if provided
        promoDiscount || undefined // Add promo discount if provided
      );

      if (!result.success) {
        setSubmitError(result.error || "Failed to create tool");
        return;
      }

      const { toolId } = result;

      // Ensure toolId exists
      if (!toolId) {
        setSubmitError("Failed to create tool - missing ID");
        return;
      }

      // 4. Different flow based on tool count
      if (isFirstTool) {
        // First tool: Go through Stripe checkout
        const { error } = await authClient.subscription.upgrade({
          plan: selectedPlan, // "starter-monthly" or "starter-yearly"
          successUrl: `${window.location.origin}/success?tool-submitted=true&toolId=${toolId}&plan=${selectedPlan}`,
          cancelUrl: `${window.location.origin}/submit`,
        });

        if (error) {
          console.error("Stripe checkout error:", error);
          setSubmitError("Payment failed. Please try again.");
        }
      } else {
        // Additional tools: Direct success (tool already featured: true)
        window.location.href = `${window.location.origin}/success?tool-submitted=true&toolId=${toolId}&direct=true`;
      }
    } catch (error) {
      console.error("Submission error:", error);
      // Extract specific error message if available
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Something went wrong. Please try again.";
      setSubmitError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Back button */}
      <header className="px-6 h-12 flex items-center justify-between">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="text-sm">Back</span>
        </Link>
      </header>

      {/* Main content */}
      <div className="flex-1 flex items-start justify-center px-6 pb-12">
        <div className="w-full max-w-sm">
          {/* Title */}
          <div className="text-center mb-6">
            <h1 className="text-2xl font-semibold text-gray-900 mb-2">
              Submit a tool
            </h1>
            <p className="text-sm text-gray-600">
              Share your tool with our community
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Name/URL left (2/3) and Logo right (1/3) */}
            <div className="flex gap-4">
              {/* Left side - Name and URL (2/3) */}
              <div className="flex-1 space-y-3">
                {/* Tool Name */}
                <div>
                  <input
                    type="text"
                    placeholder="Tool Name"
                    value={toolName}
                    onChange={handleNameChange}
                    required
                    className={`w-full px-3 py-2 bg-white border rounded-lg text-sm placeholder-gray-400 focus:outline-none focus:ring-2 h-9 ${
                      fieldErrors.name
                        ? "border-red-300 focus:ring-red-500 focus:border-red-500"
                        : "border-gray-200 focus:ring-indigo-500 focus:border-transparent"
                    }`}
                  />
                </div>

                {/* Tool URL */}
                <div>
                  <input
                    type="url"
                    placeholder="Tool URL"
                    value={toolUrl}
                    onChange={handleUrlChange}
                    required
                    className={`w-full px-3 py-2 bg-white border rounded-lg text-sm placeholder-gray-400 focus:outline-none focus:ring-2 h-9 ${
                      fieldErrors.url
                        ? "border-red-300 focus:ring-red-500 focus:border-red-500"
                        : "border-gray-200 focus:ring-indigo-500 focus:border-transparent"
                    }`}
                  />
                </div>
              </div>

              {/* Right side - Logo (1/3) */}
              <div className="w-32">
                {!logoPreview ? (
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    className={`h-20 border border-dashed rounded-lg flex flex-col items-center justify-center cursor-pointer transition-colors ${
                      isDragOver
                        ? "border-indigo-400 bg-indigo-50"
                        : fieldErrors.logo
                        ? "border-red-300 hover:border-red-400"
                        : "border-gray-300 hover:border-gray-400"
                    }`}
                  >
                    <Upload className="w-6 h-6 text-gray-400 mb-1" />
                    <p className="text-xs text-gray-600 text-center px-1">
                      {isDragOver ? "Drop here" : "Upload logo"}
                    </p>
                  </div>
                ) : (
                  <div className="h-20 relative border border-gray-200 rounded-lg p-2 bg-white">
                    <img
                      src={logoPreview}
                      alt="Logo"
                      className="w-full h-full object-contain rounded"
                    />
                    <button
                      type="button"
                      onClick={removeLogo}
                      className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center text-xs hover:bg-red-600"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                )}

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/jpg"
                  onChange={handleFileSelect}
                  className="hidden"
                />
              </div>
            </div>

            {/* Category */}
            <div>
              <div className="relative">
                <Select
                  value={selectedCategory}
                  onValueChange={(value) => {
                    setSelectedCategory(value);
                    setSubmitError(null);
                    setFieldErrors((prev) => ({ ...prev, category: false }));
                  }}
                >
                  <SelectTrigger
                    className={`w-full px-3 py-2.5 bg-white border rounded-lg text-sm focus:outline-none focus:ring-2 h-auto shadow-none ${
                      fieldErrors.category
                        ? "border-red-300 focus:ring-red-500 focus:border-red-500"
                        : "border-gray-200 focus:ring-indigo-500 focus:border-transparent"
                    }`}
                  >
                    <SelectValue placeholder="Select category..." />
                  </SelectTrigger>
                  <SelectContent>
                    {categoryOptions.map((category) => (
                      <SelectItem
                        key={category.href}
                        value={category.href.substring(1)}
                      >
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* App Screenshot (Optional) */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                App Image <span className="text-gray-400">(optional)</span>
              </label>

              {!appImagePreview ? (
                <div
                  onClick={() => appImageInputRef.current?.click()}
                  onDragOver={handleAppImageDragOver}
                  onDragLeave={handleAppImageDragLeave}
                  onDrop={handleAppImageDrop}
                  className={`w-full h-24 border border-dashed rounded-lg flex flex-col items-center justify-center cursor-pointer transition-colors ${
                    isAppImageDragOver
                      ? "border-indigo-400 bg-indigo-50"
                      : "border-gray-300 hover:border-gray-400"
                  }`}
                >
                  <Upload className="w-6 h-6 text-gray-400 mb-2" />
                  <p className="text-xs text-gray-600 text-center">
                    {isAppImageDragOver
                      ? "Drop image here"
                      : "Click to upload or drag and drop"}
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    PNG, JPG up to 5MB
                  </p>
                </div>
              ) : (
                <div className="w-full h-32 relative border border-gray-200 rounded-lg p-2 bg-white">
                  <img
                    src={appImagePreview}
                    alt="App Screenshot"
                    className="w-full h-full object-contain rounded"
                  />
                  <button
                    type="button"
                    onClick={removeAppImage}
                    className="absolute -top-1 -right-1 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center text-xs hover:bg-red-600"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}

              <input
                ref={appImageInputRef}
                type="file"
                accept="image/png,image/jpeg,image/jpg"
                onChange={handleAppImageSelect}
                className="hidden"
              />
            </div>

            {/* Tool Discount Offer Section (Optional) */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tool discount <span className="text-gray-400">(optional)</span>
              </label>
              <div className="flex gap-2">
                <div className="flex-1">
                  <input
                    type="text"
                    placeholder="Discount Code"
                    value={promoCode}
                    onChange={(e) =>
                      setPromoCode(
                        e.target.value.toUpperCase().replace(/\s/g, "")
                      )
                    }
                    className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent h-9"
                  />
                </div>
                <div className="w-20">
                  <input
                    type="number"
                    placeholder="% off"
                    value={promoDiscount}
                    onChange={(e) => {
                      const value = parseInt(e.target.value);
                      if (
                        e.target.value === "" ||
                        (!isNaN(value) && value >= 1 && value <= 100)
                      ) {
                        setPromoDiscount(e.target.value);
                      }
                    }}
                    min="1"
                    max="100"
                    className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent h-9"
                  />
                </div>
              </div>
            </div>

            {/* Price section - Only show for first tool */}
            {isFirstTool && (
              <div className="border border-gray-200 rounded-lg p-4 bg-white">
                <h3 className="text-base font-medium text-gray-900 mb-3">
                  Payment
                </h3>

                {/* Monthly plan */}
                <div
                  onClick={() => setSelectedPlan("starter-monthly")}
                  className={`relative border rounded-lg p-3 mb-3 cursor-pointer transition-colors ${
                    selectedPlan === "starter-monthly"
                      ? "border-indigo-500 bg-indigo-50"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  {selectedPlan === "starter-monthly" && (
                    <div className="absolute -top-2 left-3 bg-indigo-600 text-white text-xs px-2 py-0.5 rounded">
                      Early Bird
                    </div>
                  )}

                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex space-x-1 items-baseline mb-0.5">
                        <span className="text-lg font-semibold">$1</span>
                        <span className="text-gray-400 line-through text-sm">
                          $5
                        </span>
                        <span className="text-gray-500">/</span>
                        <span className="text-gray-500">first month</span>
                      </div>
                      <div className="text-xs text-gray-600">
                        Then $5/month • Cancel anytime
                      </div>
                    </div>

                    {selectedPlan === "starter-monthly" && (
                      <div className="w-5 h-5 bg-indigo-600 rounded-full flex items-center justify-center">
                        <Check className="w-3 h-3 text-white" />
                      </div>
                    )}
                  </div>
                </div>

                {/* Annual plan */}
                <div
                  onClick={() => setSelectedPlan("starter-yearly")}
                  className={`border rounded-lg p-3 cursor-pointer transition-colors ${
                    selectedPlan === "starter-yearly"
                      ? "border-indigo-500 bg-indigo-50"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex space-x-1 items-baseline mb-0.5">
                        <span className="text-lg font-semibold">$50</span>
                        <span className="text-gray-400 line-through">$60</span>
                        <span className="text-gray-500">/</span>
                        <span className="text-gray-500">year</span>
                      </div>
                      <div className="text-xs text-gray-600">
                        Billed annually, cancel anytime
                      </div>
                    </div>

                    {selectedPlan === "starter-yearly" && (
                      <div className="w-5 h-5 bg-indigo-600 rounded-full flex items-center justify-center">
                        <Check className="w-3 h-3 text-white" />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Message for additional tools */}
            {!isFirstTool && (
              <div className="border border-gray-200 rounded-lg p-3 bg-gray-50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {subscriptionLimits.canSubmit ? (
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    ) : (
                      <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                    )}
                    <span className="text-sm font-medium text-gray-900">
                      {subscriptionLimits.canSubmit
                        ? "Ready to publish"
                        : "Upgrade needed"}
                    </span>
                  </div>
                  {subscriptionLimits.canSubmit ? (
                    <span className="text-xs text-gray-500">
                      {subscriptionLimits.remaining} left
                    </span>
                  ) : (
                    <Link
                      href="/profile"
                      className="inline-flex items-center px-2 py-1 text-xs font-medium text-gray-700 bg-white border border-gray-200 rounded hover:bg-gray-50 hover:border-gray-300 transition-colors"
                    >
                      Upgrade plan
                    </Link>
                  )}
                </div>
              </div>
            )}

            {logoError && (
              <p className="text-xs text-red-600 text-center">
                Please upload a logo
              </p>
            )}

            {submitError && (
              <div className="border border-red-200 rounded-lg p-3 bg-red-50">
                <p className="text-xs text-red-700 text-center">
                  {submitError}
                </p>
                {(submitError.includes("limit") ||
                  submitError.includes("subscription")) && (
                  <div className="mt-2 text-center">
                    <Link
                      href="/profile"
                      className="text-xs text-blue-600 hover:text-blue-800 underline"
                    >
                      Go to Profile to upgrade
                    </Link>
                  </div>
                )}
                {submitError.includes("already exists") && (
                  <div className="mt-2 text-center">
                    <p className="text-xs text-gray-600">
                      Try submitting a different tool instead
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Submit button */}
            <button
              type="submit"
              disabled={
                isSubmitting ||
                !isFormValid ||
                (!isFirstTool && !subscriptionLimits.canSubmit)
              }
              className="w-full flex items-center justify-center px-3 py-2 bg-gray-900 text-white rounded-md hover:bg-gray-800 transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting
                ? "Processing..."
                : isFirstTool
                ? "Continue"
                : !subscriptionLimits.canSubmit
                ? "Upgrade Required"
                : "Publish Tool"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
