"use client";

import { useState } from "react";
import Image from "next/image";
import { Star, StarOff } from "lucide-react";
import Link from "next/link";
import { toggleToolFeatured } from "@/app/actions/admin-actions";

interface AdminTool {
  id: string;
  name: string;
  slug: string;
  description: string;
  url: string;
  logoUrl?: string | null;
  category?: string | null;
  featured: boolean;
  origin: string;
  requiresSubscription: boolean;
  submittedBy: string;
  createdAt: Date;
  submitterName: string;
  submitterEmail: string;
}

interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

interface AdminToolsProps {
  tools: PaginatedResult<AdminTool>;
}

export function AdminTools({ tools }: AdminToolsProps) {
  const [loading, setLoading] = useState<{ [key: string]: boolean }>({});
  const [confirmTool, setConfirmTool] = useState<{
    id: string;
    name: string;
    featured: boolean;
  } | null>(null);

  const handleToggleFeatured = async (toolId: string) => {
    setLoading((prev) => ({ ...prev, [toolId]: true }));
    try {
      await toggleToolFeatured(toolId);
      setConfirmTool(null);
    } catch (error) {
      console.error("Error toggling featured:", error);
    } finally {
      setLoading((prev) => ({ ...prev, [toolId]: false }));
    }
  };

  const openConfirmModal = (tool: AdminTool) => {
    setConfirmTool({ id: tool.id, name: tool.name, featured: tool.featured });
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold">Subscription Tools</h2>
          <p className="text-sm text-gray-600">
            {tools.total} tools • Page {tools.page} of {tools.totalPages}
          </p>
        </div>
      </div>

      {/* Tools List */}
      <div className="space-y-2">
        {tools.data.map((tool) => (
          <div key={tool.id} className="bg-muted/50 rounded-lg p-3">
            <div className="flex items-center gap-3">
              {/* Logo */}
              <div className="flex-shrink-0">
                {tool.logoUrl ? (
                  <div className="w-8 h-8 rounded-md overflow-hidden">
                    <Image
                      src={tool.logoUrl}
                      alt={tool.name}
                      width={32}
                      height={32}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ) : (
                  <div className="w-8 h-8 rounded-md bg-gray-900 flex items-center justify-center">
                    <span className="text-xs font-bold text-white">
                      {tool.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                )}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 mb-1">
                  <Link
                    href={`/${tool.slug}`}
                    className="font-semibold text-gray-900 text-sm truncate hover:text-gray-700 transition-colors"
                  >
                    {tool.name}
                  </Link>
                  <span className="text-xs text-gray-600 w-fit">
                    {tool.category || "No category"}
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-2 text-xs text-gray-600">
                  <span>by {tool.submitterName}</span>
                  <a
                    href={`mailto:${tool.submitterEmail}`}
                    className="text-xs text-gray-600 hover:text-gray-900 truncate"
                  >
                    {tool.submitterEmail}
                  </a>
                </div>
              </div>

              {/* Actions */}
              <div className="flex flex-col sm:flex-row items-end sm:items-center gap-1 sm:gap-2 flex-shrink-0">
                <span
                  className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-normal border w-fit ${
                    tool.featured
                      ? "bg-green-100 text-green-800 border-green-200"
                      : "bg-red-100 text-red-800 border-red-200"
                  }`}
                >
                  {tool.featured ? "Featured" : "Hidden"}
                </span>
                <button
                  onClick={() => openConfirmModal(tool)}
                  disabled={loading[tool.id]}
                  className="p-1.5 rounded transition-colors text-gray-600 hover:bg-gray-100"
                  title={tool.featured ? "Hide tool" : "Feature tool"}
                >
                  {loading[tool.id] ? (
                    <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                  ) : tool.featured ? (
                    <Star className="w-4 h-4 fill-current" />
                  ) : (
                    <StarOff className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Pagination */}
      {tools.totalPages > 1 && (
        <div className="flex flex-col items-center gap-4 pt-4">
          <span className="text-sm text-gray-500">
            Showing {tools.data.length} of {tools.total} tools
          </span>
          <div className="flex items-center gap-2">
            {/* Previous button */}
            <button
              onClick={() =>
                (window.location.href = `/admin?tab=tools&page=${
                  tools.page - 1
                }`)
              }
              disabled={tools.page <= 1}
              className="px-3 py-1.5 text-sm border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>

            {/* Page numbers */}
            <div className="flex items-center gap-1">
              {Array.from({ length: tools.totalPages }, (_, i) => i + 1).map(
                (pageNum) => (
                  <button
                    key={pageNum}
                    onClick={() =>
                      (window.location.href = `/admin?tab=tools&page=${pageNum}`)
                    }
                    className={`px-3 py-1.5 text-sm rounded ${
                      pageNum === tools.page
                        ? "bg-gray-900 text-white"
                        : "border border-gray-300 hover:bg-gray-50"
                    }`}
                  >
                    {pageNum}
                  </button>
                )
              )}
            </div>

            {/* Next button */}
            <button
              onClick={() =>
                (window.location.href = `/admin?tab=tools&page=${
                  tools.page + 1
                }`)
              }
              disabled={tools.page >= tools.totalPages}
              className="px-3 py-1.5 text-sm border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      {confirmTool && (
        <div className="fixed inset-0 bg-black/20 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-4 max-w-sm w-full">
            <h3 className="text-sm font-medium text-gray-900 mb-2">
              {confirmTool.featured ? "Hide tool?" : "Feature tool?"}
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              {confirmTool.featured
                ? `Hide "${confirmTool.name}" from the site?`
                : `Feature "${confirmTool.name}" on the site?`}
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setConfirmTool(null)}
                className="flex-1 px-3 py-2 text-sm text-gray-600 bg-gray-100 rounded hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => handleToggleFeatured(confirmTool.id)}
                disabled={loading[confirmTool.id]}
                className="flex-1 px-3 py-2 text-sm text-white bg-gray-900 rounded hover:bg-gray-800 transition-colors disabled:opacity-50"
              >
                {loading[confirmTool.id] ? "..." : "Confirm"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
