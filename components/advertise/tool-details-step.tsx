"use client";

import { ArrowLeft } from "lucide-react";
import { useState } from "react";
import { ToolSourceSelector } from "./tool-source-selector";
import { BoostToolsList } from "./boost-tools-list";
import { NewToolForm } from "./new-tool-form";
import { validateUrl } from "@/lib/utils";
import { Tool } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { fetchUrlDescription } from "@/app/actions/tools";
import { Logo } from "../logo";

export interface ToolDetails {
  // Source type
  source: "boost-tool" | "new-ad";
  // Pour outil existant ou boosté
  selectedToolId?: string;
  // Pour nouvel outil
  name?: string;
  url?: string;
  description?: string;
  logoUrl?: string;
  appImageUrl?: string; // Optional app image URL
  category?: string;
  promoCode?: string; // Optional promo code
  promoDiscount?: string; // Optional promo discount percentage
}

interface ToolDetailsStepProps {
  onBack: () => void;
  onContinue: (details: ToolDetails) => void;
  totalPrice: number;
  subscriptionTools: Tool[];
}

export function ToolDetailsStep({
  onBack,
  onContinue,
  totalPrice,
  subscriptionTools,
}: ToolDetailsStepProps) {
  const [source, setSource] = useState<"boost-tool" | "new-ad">(
    // Default to the first available option
    subscriptionTools.length > 0 ? "boost-tool" : "new-ad"
  );
  const [selectedToolId, setSelectedToolId] = useState<string>("");
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [newToolDetails, setNewToolDetails] = useState({
    name: "",
    url: "",
    logoUrl: "",
    promoCode: "",
    promoDiscount: "",
  });
  // Store the actual File object for uploading
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [appImageFile, setAppImageFile] = useState<File | null>(null); // New: app image file
  const [fieldErrors, setFieldErrors] = useState({
    name: false,
    url: false,
    logoUrl: false,
    category: false,
    tool: false,
  });
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const clearFieldError = (field: string) => {
    setFieldErrors((prev) => ({ ...prev, [field]: false }));
    setSubmitError(null);
  };

  const handleToolSelect = (tool: Tool) => {
    setSelectedToolId(tool.id);
    clearFieldError("tool");
  };

  // Upload image function - handles both logo and app image
  const uploadImage = async (file: File): Promise<string> => {
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

  const handleContinue = async () => {
    if (source === "boost-tool") {
      // Validation pour outil existant
      const errors = {
        tool: !selectedToolId,
        name: false,
        url: false,
        logoUrl: false,
        category: false,
      };

      setFieldErrors(errors);

      if (errors.tool) {
        setSubmitError("Please select a tool");
        return;
      }

      // Passer les détails de l'outil existant
      onContinue({
        source,
        selectedToolId,
      });
    } else {
      // Validation for new tool - matching submit-content.tsx exactly
      const urlValidation = validateUrl(newToolDetails.url);

      // Validation des codes promo - les deux doivent être renseignés ensemble
      const promoCodeFilled = newToolDetails.promoCode.trim() !== "";
      const promoDiscountFilled = newToolDetails.promoDiscount.trim() !== "";
      const promoValidation = promoCodeFilled === promoDiscountFilled; // Both filled or both empty

      const errors = {
        name: !newToolDetails.name.trim(),
        url: !newToolDetails.url.trim() || !urlValidation.isValid,
        logoUrl: !logoFile, // Check for File, not data URI
        category: !selectedCategory,
        tool: false,
      };

      setFieldErrors(errors);

      // Exact same error messages as submit-content.tsx
      if (errors.name || errors.url || errors.logoUrl || errors.category) {
        if (errors.name) {
          setSubmitError("Tool name is required");
          return;
        }
        if (errors.url && !newToolDetails.url.trim()) {
          setSubmitError("Tool URL is required");
          return;
        }
        if (errors.url && !urlValidation.isValid) {
          setSubmitError(urlValidation.error || "Invalid URL");
          return;
        }
        if (errors.logoUrl) {
          setSubmitError("Logo is required");
          return;
        }
        if (errors.category) {
          setSubmitError("Category is required");
          return;
        }
      }

      // Validation des codes promo
      if (!promoValidation) {
        if (promoCodeFilled && !promoDiscountFilled) {
          setSubmitError(
            "Discount percentage is required when promo code is provided"
          );
        } else if (!promoCodeFilled && promoDiscountFilled) {
          setSubmitError(
            "Promo code is required when discount percentage is provided"
          );
        }
        return;
      }

      // Upload logo first and fetch description for new tools - exactly like submit-content.tsx
      setIsUploading(true);
      setSubmitError(null);

      try {
        // 1. Upload logo first
        const logoUrl = await uploadImage(logoFile!);

        // 2. Upload app image if provided (optional)
        let appImageUrl: string | undefined = undefined;
        if (appImageFile) {
          appImageUrl = await uploadImage(appImageFile);
        }

        // 3. Fetch description from URL automatically - with fallback protection
        let description = "No description available";
        try {
          description = await fetchUrlDescription(newToolDetails.url);
        } catch (descriptionError) {
          console.warn(
            "Description fetch failed, using fallback:",
            descriptionError
          );
          // Continue with default description - don't block submission
        }

        // Pass new tool details with uploaded logo URL and scraped description
        onContinue({
          source: "new-ad",
          name: newToolDetails.name,
          url: newToolDetails.url,
          description: description,
          logoUrl: logoUrl,
          appImageUrl: appImageUrl, // Include app image URL if provided
          category: selectedCategory,
          promoCode: newToolDetails.promoCode || undefined, // Only pass if not empty
          promoDiscount: newToolDetails.promoDiscount || undefined, // Only pass if not empty
        });
      } catch (error) {
        console.error("Processing error:", error);
        setSubmitError("Failed to process tool data. Please try again.");
      } finally {
        setIsUploading(false);
      }
    }
  };

  const isFormValid =
    source === "boost-tool"
      ? selectedToolId
      : newToolDetails.name.trim() &&
        newToolDetails.url.trim() &&
        validateUrl(newToolDetails.url).isValid &&
        logoFile && // Check for File, not data URI
        selectedCategory;

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="px-6 h-12 flex items-center justify-between">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors text-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>
      </header>

      {/* Main content */}
      <div className="px-6 pb-8">
        <div className="max-w-md mx-auto">
          {/* Title */}
          <div className="text-center mb-6 flex items-center justify-center gap-2">
            <h1 className="text-lg font-semibold">Advertise on</h1> <Logo />
          </div>

          {/* Form */}
          <div className="space-y-4">
            {/* Tool Source */}
            <ToolSourceSelector
              value={source}
              onChange={setSource}
              subscriptionToolsCount={subscriptionTools.length}
            />

            {/* Tool Selection/Form */}
            {source === "boost-tool" ? (
              <BoostToolsList
                tools={subscriptionTools}
                onSelect={handleToolSelect}
                selectedToolId={selectedToolId}
                error={fieldErrors.tool}
              />
            ) : (
              <div className="space-y-2">
                <h3 className="text-sm font-medium">New Advertisement</h3>
                <NewToolForm
                  toolDetails={newToolDetails}
                  onUpdate={setNewToolDetails}
                  onLogoFileChange={setLogoFile}
                  onError={setSubmitError} // Pass error handler
                  errors={fieldErrors}
                  onFieldChange={clearFieldError}
                  selectedCategory={selectedCategory}
                  onCategoryChange={setSelectedCategory}
                  onAppImageFileChange={setAppImageFile}
                />
              </div>
            )}

            {/* Error message */}
            {submitError && (
              <div className="border border-red-200 rounded-lg p-3 bg-red-50">
                <p className="text-xs text-red-700 text-center">
                  {submitError}
                </p>
              </div>
            )}

            {/* Continue button */}
            <Button
              className="w-full"
              disabled={!isFormValid || isUploading}
              onClick={handleContinue}
            >
              {isUploading
                ? "Processing..."
                : `Continue to Payment ($${totalPrice.toFixed(2)})`}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
