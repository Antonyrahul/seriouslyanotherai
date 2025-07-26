/* eslint-disable @next/next/no-img-element */
"use client";

import { useState, useRef } from "react";
import { Upload, X } from "lucide-react";
import { createAdminTool } from "@/app/actions/admin-actions";
import { CATEGORIES } from "@/lib/constants/categories";
import { validateUrl } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface AdminSubmitFormProps {
  onSubmitStart: () => void;
  onSubmitEnd: () => void;
  onSubmitSuccess: () => void;
  onSubmitError: (error: string) => void;
}

export function AdminSubmitForm({
  onSubmitStart,
  onSubmitEnd,
  onSubmitSuccess,
  onSubmitError,
}: AdminSubmitFormProps) {
  const [toolName, setToolName] = useState("");
  const [toolUrl, setToolUrl] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [appImageFile, setAppImageFile] = useState<File | null>(null);
  const [appImagePreview, setAppImagePreview] = useState<string | null>(null);
  const [promoCode, setPromoCode] = useState("");
  const [promoDiscount, setPromoDiscount] = useState("");
  const [description, setDescription] = useState("");
  const [isDragOver, setIsDragOver] = useState(false);
  const [isAppImageDragOver, setIsAppImageDragOver] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({
    name: false,
    url: false,
    category: false,
    logo: false,
  });

  const fileInputRef = useRef<HTMLInputElement>(null);
  const appImageInputRef = useRef<HTMLInputElement>(null);

  const categoryOptions = CATEGORIES.filter((cat) => cat.name !== "All");

  const uploadImage = async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append("file", file);

    const response = await fetch("/api/upload-image", {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Failed to upload image");
    }

    const { url } = await response.json();
    return url;
  };

  const processFile = (file: File) => {
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      onSubmitError("Logo file is too large. Please select a file under 5MB.");
      setFieldErrors((prev) => ({ ...prev, logo: true }));
      return;
    }

    setLogoFile(file);
    setFieldErrors((prev) => ({ ...prev, logo: false }));

    const reader = new FileReader();
    reader.onload = (event) => {
      setLogoPreview(event.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const processAppImageFile = (file: File) => {
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      onSubmitError(
        "App image file is too large. Please select a file under 5MB."
      );
      return;
    }

    setAppImageFile(file);

    const reader = new FileReader();
    reader.onload = (event) => {
      setAppImagePreview(event.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setToolName(e.target.value);
    setFieldErrors((prev) => ({ ...prev, name: false }));
  };

  const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setToolUrl(e.target.value);
    setFieldErrors((prev) => ({ ...prev, url: false }));
  };

  const removeLogo = () => {
    setLogoFile(null);
    setLogoPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const removeAppImage = () => {
    setAppImageFile(null);
    setAppImagePreview(null);
    if (appImageInputRef.current) {
      appImageInputRef.current.value = "";
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    onSubmitStart();

    try {
      // Validation
      const urlValidation = validateUrl(toolUrl);

      const errors = {
        name: !toolName.trim(),
        url: !toolUrl.trim() || !urlValidation.isValid,
        logo: !logoFile,
        category: !selectedCategory,
      };

      setFieldErrors(errors);

      if (errors.name || errors.url || errors.logo || errors.category) {
        if (errors.name) onSubmitError("Tool name is required");
        else if (errors.url && !toolUrl.trim())
          onSubmitError("Tool URL is required");
        else if (errors.url && !urlValidation.isValid)
          onSubmitError(urlValidation.error || "Invalid URL");
        else if (errors.logo) onSubmitError("Logo is required");
        else if (errors.category) onSubmitError("Category is required");
        return;
      }

      // Upload images
      const logoUrl = await uploadImage(logoFile!);
      let appImageUrl: string | null = null;
      if (appImageFile) {
        appImageUrl = await uploadImage(appImageFile);
      }

      // Create tool
      const result = await createAdminTool(
        toolUrl,
        logoUrl,
        toolName,
        selectedCategory,
        description || undefined,
        appImageUrl,
        promoCode || undefined,
        promoDiscount || undefined
      );

      if (!result.success) {
        onSubmitError(result.error || "Failed to create tool");
        return;
      }

      // Reset form
      setToolName("");
      setToolUrl("");
      setSelectedCategory("");
      setLogoFile(null);
      setLogoPreview(null);
      setAppImageFile(null);
      setAppImagePreview(null);
      setPromoCode("");
      setPromoDiscount("");
      setDescription("");
      setFieldErrors({ name: false, url: false, category: false, logo: false });

      // Clear file inputs
      if (fileInputRef.current) fileInputRef.current.value = "";
      if (appImageInputRef.current) appImageInputRef.current.value = "";

      onSubmitSuccess();
    } catch (error) {
      console.error("Error creating tool:", error);
      onSubmitError("Failed to create tool. Please try again.");
    } finally {
      onSubmitEnd();
    }
  };

  return (
    <div className="flex items-start justify-center px-6 pb-12">
      <div className="w-full max-w-sm">
        {/* Title */}
        <div className="text-center mb-6">
          <h1 className="text-2xl font-semibold text-gray-900 mb-2">
            Submit a tool (Admin)
          </h1>
          <p className="text-sm text-gray-600">
            Add a new tool to the platform
          </p>
        </div>

        {/* Form */}
        <form
          id="admin-submit-form"
          onSubmit={handleSubmit}
          className="space-y-4"
        >
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
                  onDragOver={(e) => {
                    e.preventDefault();
                    setIsDragOver(true);
                  }}
                  onDragLeave={(e) => {
                    e.preventDefault();
                    setIsDragOver(false);
                  }}
                  onDrop={(e) => {
                    e.preventDefault();
                    setIsDragOver(false);
                    const files = e.dataTransfer.files;
                    if (files.length > 0) processFile(files[0]);
                  }}
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
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) processFile(file);
                }}
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

          {/* Description */}
          <div>
            <textarea
              placeholder="Description (optional)"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              rows={3}
            />
          </div>

          {/* App Screenshot (Optional) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              App Image <span className="text-gray-400">(optional)</span>
            </label>

            {!appImagePreview ? (
              <div
                onClick={() => appImageInputRef.current?.click()}
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsAppImageDragOver(true);
                }}
                onDragLeave={(e) => {
                  e.preventDefault();
                  setIsAppImageDragOver(false);
                }}
                onDrop={(e) => {
                  e.preventDefault();
                  setIsAppImageDragOver(false);
                  const files = e.dataTransfer.files;
                  if (files.length > 0) processAppImageFile(files[0]);
                }}
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
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) processAppImageFile(file);
              }}
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
        </form>
      </div>
    </div>
  );
}
