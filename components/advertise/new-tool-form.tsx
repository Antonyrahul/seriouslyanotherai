/* eslint-disable @next/next/no-img-element */
"use client";

import { Upload, X } from "lucide-react";
import { useState, useRef } from "react";
import { CATEGORIES } from "@/lib/constants/categories";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface NewToolFormProps {
  toolDetails: {
    name: string;
    url: string;
    logoUrl: string;
    promoCode: string;
    promoDiscount: string;
  };
  onUpdate: (details: {
    name: string;
    url: string;
    logoUrl: string;
    promoCode: string;
    promoDiscount: string;
  }) => void;
  onLogoFileChange: (file: File | null) => void;
  onAppImageFileChange: (file: File | null) => void;
  onError: (message: string) => void; // New: error handler
  errors: {
    name: boolean;
    url: boolean;
    logoUrl: boolean;
    category: boolean;
  };
  onFieldChange: (field: string) => void;
  selectedCategory: string;
  onCategoryChange: (category: string) => void;
}

export function NewToolForm({
  toolDetails,
  onUpdate,
  onLogoFileChange,
  onAppImageFileChange, // New: app image file handler
  onError, // New: error handler
  errors,
  onFieldChange,
  selectedCategory,
  onCategoryChange,
}: NewToolFormProps) {
  const [logoPreview, setLogoPreview] = useState<string | null>(
    toolDetails.logoUrl || null
  );
  const [appImagePreview, setAppImagePreview] = useState<string | null>(null); // New: app image preview
  const [isDragOver, setIsDragOver] = useState(false);
  const [isAppImageDragOver, setIsAppImageDragOver] = useState(false); // New: app image drag state
  const fileInputRef = useRef<HTMLInputElement>(null);
  const appImageInputRef = useRef<HTMLInputElement>(null); // New: app image input ref

  // Filter out "All" category for the dropdown
  const categoryOptions = CATEGORIES.filter((cat) => cat.name !== "All");

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    onUpdate({ ...toolDetails, name: value });
    onFieldChange("name");
  };

  const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    onUpdate({ ...toolDetails, url: value });
    onFieldChange("url");
  };

  const handlePromoCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.toUpperCase().replace(/\s/g, "");
    onUpdate({ ...toolDetails, promoCode: value });
  };

  const handlePromoDiscountChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const value = e.target.value;
    const numValue = parseInt(value);
    if (
      value === "" ||
      (!isNaN(numValue) && numValue >= 1 && numValue <= 100)
    ) {
      onUpdate({ ...toolDetails, promoDiscount: value });
    }
  };

  const processFile = (file: File) => {
    // Check file size (5MB limit for logo)
    const maxSize = 5 * 1024 * 1024; // 5MB in bytes
    if (file.size > maxSize) {
      onError("Logo file size exceeds 5MB limit.");
      return;
    }

    onFieldChange("logoUrl");

    // Pass the File to parent for uploading
    onLogoFileChange(file);

    // Create preview
    const reader = new FileReader();
    reader.onload = (event) => {
      const logoUrl = event.target?.result as string;
      setLogoPreview(logoUrl);
      onUpdate({ ...toolDetails, logoUrl });
    };
    reader.readAsDataURL(file);
  };

  // App image handling functions
  const processAppImageFile = (file: File) => {
    // Check file size (5MB limit)
    const maxSize = 5 * 1024 * 1024; // 5MB in bytes
    if (file.size > maxSize) {
      onError("App image file size exceeds 5MB limit.");
      return;
    }

    // Pass the File to parent for uploading
    onAppImageFileChange(file);

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
    setAppImagePreview(null);
    onAppImageFileChange(null);
    if (appImageInputRef.current) {
      appImageInputRef.current.value = "";
    }
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
    setLogoPreview(null);
    onUpdate({ ...toolDetails, logoUrl: "" });
    onLogoFileChange(null); // Clear the file in parent
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div className="space-y-4">
      {/* Name/URL left (2/3) and Logo right (1/3) */}
      <div className="flex gap-4">
        {/* Left side - Name and URL (2/3) */}
        <div className="flex-1 space-y-3">
          {/* Tool Name */}
          <div>
            <input
              type="text"
              placeholder="Tool Name"
              value={toolDetails.name}
              onChange={handleNameChange}
              required
              className={`w-full px-3 py-2 bg-white border rounded-lg text-sm placeholder-gray-400 focus:outline-none focus:ring-2 h-9 ${
                errors.name
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
              value={toolDetails.url}
              onChange={handleUrlChange}
              required
              className={`w-full px-3 py-2 bg-white border rounded-lg text-sm placeholder-gray-400 focus:outline-none focus:ring-2 h-9 ${
                errors.url
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
                  : errors.logoUrl
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
              onCategoryChange(value);
              onFieldChange("category");
            }}
          >
            <SelectTrigger
              className={`w-full px-3 py-2.5 bg-white border rounded-lg text-sm focus:outline-none focus:ring-2 h-auto shadow-none ${
                errors.category
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

      {/* App Image (Optional) */}
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
            <p className="text-xs text-gray-500 mt-0.5">PNG, JPG up to 5MB</p>
          </div>
        ) : (
          <div className="w-full h-32 relative border border-gray-200 rounded-lg p-2 bg-white">
            <img
              src={appImagePreview}
              alt="App Image"
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
              value={toolDetails.promoCode}
              onChange={handlePromoCodeChange}
              className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent h-9"
            />
          </div>
          <div className="w-20">
            <input
              type="number"
              placeholder="% off"
              value={toolDetails.promoDiscount}
              onChange={handlePromoDiscountChange}
              min="1"
              max="100"
              className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent h-9"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
