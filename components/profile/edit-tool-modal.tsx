"use client";

import { useState } from "react";
import { X, Save } from "lucide-react";
import { Tool } from "@/lib/types";
import { CATEGORIES } from "@/lib/constants/categories";
import { TurnstileCaptcha } from "@/components/turnstile-captcha";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface EditToolModalProps {
  tool: Tool;
  isOpen: boolean;
  onClose: () => void;
  onSave: (
    toolId: string,
    updates: {
      name: string;
      description: string;
      category: string;
      promoCode?: string | null;
      promoDiscount?: string | null;
    }
  ) => Promise<void>;
  isUpdating: boolean;
}

export function EditToolModal({
  tool,
  isOpen,
  onClose,
  onSave,
  isUpdating,
}: EditToolModalProps) {
  const [editForm, setEditForm] = useState({
    name: tool.name,
    description: tool.description,
    category: tool.category || "productivity",
    promoCode: tool.promoCode || "",
    promoDiscount: tool.promoDiscount || "",
  });
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const categoryOptions = CATEGORIES.filter((cat) => cat.name !== "All");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null); // Clear any previous errors

    if (!turnstileToken) {
      setErrorMessage("Please complete the captcha verification");
      return;
    }

    // Validation des codes promo - les deux doivent être renseignés ensemble
    const promoCodeFilled = editForm.promoCode.trim() !== "";
    const promoDiscountFilled = editForm.promoDiscount.trim() !== "";
    const promoValidation = promoCodeFilled === promoDiscountFilled; // Both filled or both empty

    if (!promoValidation) {
      if (promoCodeFilled && !promoDiscountFilled) {
        setErrorMessage(
          "Discount percentage is required when promo code is provided"
        );
      } else if (!promoCodeFilled && promoDiscountFilled) {
        setErrorMessage(
          "Promo code is required when discount percentage is provided"
        );
      }
      return;
    }

    try {
      await onSave(tool.id, {
        name: editForm.name,
        description: editForm.description,
        category: editForm.category,
        promoCode: editForm.promoCode.trim() || null,
        promoDiscount: editForm.promoDiscount.trim() || null,
      });
      onClose();
      setTurnstileToken(null); // Reset captcha for next use
    } catch (error) {
      console.error("Error updating tool:", error);
      setErrorMessage("Failed to update tool. Please try again.");
    }
  };

  const handleClose = () => {
    setEditForm({
      name: tool.name,
      description: tool.description,
      category: tool.category || "productivity",
      promoCode: tool.promoCode || "",
      promoDiscount: tool.promoDiscount || "",
    });
    setTurnstileToken(null);
    setErrorMessage(null);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center p-2 sm:p-3 z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-[90%] sm:max-w-sm max-h-[90vh] sm:max-h-[85vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-3 sm:p-4 border-b border-gray-200">
          <h2 className="text-base font-semibold text-gray-900">Edit Tool</h2>
          <button
            onClick={handleClose}
            disabled={isUpdating}
            className="p-1 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <form
          onSubmit={handleSubmit}
          className="p-3 sm:p-4 space-y-3 sm:space-y-4"
        >
          {/* Tool Name */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Tool Name
            </label>
            <input
              type="text"
              value={editForm.name}
              onChange={(e) =>
                setEditForm({ ...editForm, name: e.target.value })
              }
              required
              className="w-full px-2 py-1.5 bg-white border border-gray-200 rounded text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-transparent"
              placeholder="Enter tool name"
            />
          </div>

          {/* Tool Description */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              value={editForm.description}
              onChange={(e) =>
                setEditForm({ ...editForm, description: e.target.value })
              }
              required
              rows={2}
              className="w-full px-2 py-1.5 bg-white border border-gray-200 rounded text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-transparent resize-none"
              placeholder="Enter tool description"
            />
          </div>

          {/* Category */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Category
            </label>
            <Select
              value={editForm.category}
              onValueChange={(value) =>
                setEditForm({ ...editForm, category: value })
              }
            >
              <SelectTrigger className="w-full px-2 py-1.5 bg-white border border-gray-200 rounded text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-transparent h-8">
                <SelectValue />
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

          {/* Promo Code Section (Optional) */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Promo Code <span className="text-gray-400">(optional)</span>
            </label>
            <div className="flex gap-2">
              <div className="flex-1">
                <input
                  type="text"
                  placeholder="Code (e.g., SAVE20)"
                  value={editForm.promoCode}
                  onChange={(e) =>
                    setEditForm({
                      ...editForm,
                      promoCode: e.target.value
                        .toUpperCase()
                        .replace(/\s/g, ""),
                    })
                  }
                  className="w-full px-2 py-1.5 bg-white border border-gray-200 rounded text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>
              <div className="w-16">
                <input
                  type="number"
                  placeholder="% off"
                  value={editForm.promoDiscount}
                  onChange={(e) => {
                    const value = e.target.value;
                    const numValue = parseInt(value);
                    if (
                      value === "" ||
                      (!isNaN(numValue) && numValue >= 1 && numValue <= 100)
                    ) {
                      setEditForm({ ...editForm, promoDiscount: value });
                    }
                  }}
                  min="1"
                  max="100"
                  className="w-full px-2 py-1.5 bg-white border border-gray-200 rounded text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>

          {/* Turnstile Captcha */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-2">
              Security Verification
            </label>
            <TurnstileCaptcha onVerify={setTurnstileToken} />
          </div>

          {/* Error Message */}
          {errorMessage && (
            <div className="text-red-600 text-xs text-center bg-red-50 border border-red-200 rounded px-3 py-2">
              {errorMessage}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-2 pt-3">
            <button
              type="button"
              onClick={handleClose}
              disabled={isUpdating}
              className="flex-1 px-3 py-1.5 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors text-xs font-medium disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isUpdating || !turnstileToken}
              className="flex-1 flex items-center justify-center gap-1 px-3 py-1.5 bg-gray-900 text-white rounded hover:bg-gray-800 transition-colors text-xs font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isUpdating ? (
                <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <Save className="w-3 h-3" />
              )}
              {isUpdating ? "Saving..." : "Save"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
