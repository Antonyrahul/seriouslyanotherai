"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { Trash2 } from "lucide-react";
import { deletePendingAdvertisement } from "@/app/actions/admin-actions";

interface AdminAdvertisement {
  id: string;
  toolId: string;
  toolName: string;
  toolUrl: string;
  toolLogoUrl?: string | null;
  startDate: Date;
  endDate: Date;
  placement: string;
  status: string;
  totalPrice: number;
  duration: number;
  discountPercentage: number;
  submitterName: string;
  submitterEmail: string;
  createdAt: Date;
}

interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

interface AdminAdvertisementsProps {
  advertisements: PaginatedResult<AdminAdvertisement>;
}

export function AdminAdvertisements({
  advertisements,
}: AdminAdvertisementsProps) {
  const [loading, setLoading] = useState<{ [key: string]: boolean }>({});
  const [confirmDelete, setConfirmDelete] = useState<{
    id: string;
    name: string;
  } | null>(null);

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  const formatPrice = (cents: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(cents / 100);
  };

  const handleDeletePending = async (adId: string) => {
    setLoading((prev) => ({ ...prev, [adId]: true }));
    try {
      await deletePendingAdvertisement(adId);
      setConfirmDelete(null);
    } catch (error) {
      console.error("Error deleting pending advertisement:", error);
    } finally {
      setLoading((prev) => ({ ...prev, [adId]: false }));
    }
  };

  const openDeleteModal = (ad: AdminAdvertisement) => {
    setConfirmDelete({ id: ad.id, name: ad.toolName });
  };

  const getStatusBadge = (ad: AdminAdvertisement) => {
    // First check if payment is pending
    if (ad.status === "pending") {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-normal bg-yellow-100 text-yellow-800 border border-yellow-200">
          Pending Payment
        </span>
      );
    }

    // Then check time-based status for paid ads
    const now = new Date();
    const start = new Date(ad.startDate);
    const end = new Date(ad.endDate);

    if (now < start) {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-normal bg-gray-100 text-gray-700 border border-gray-200">
          Scheduled
        </span>
      );
    } else if (now >= start && now <= end) {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-normal bg-gray-100 text-gray-700 border border-gray-200">
          Active
        </span>
      );
    } else {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-normal bg-gray-100 text-gray-700 border border-gray-200">
          Expired
        </span>
      );
    }
  };

  // Separate ads by status and time
  const now = new Date();
  const pendingAds = advertisements.data.filter(
    (ad) => ad.status === "pending"
  );
  const activeAds = advertisements.data.filter(
    (ad) => ad.status !== "pending" && new Date(ad.endDate) > now
  );
  const expiredAds = advertisements.data.filter(
    (ad) => ad.status !== "pending" && new Date(ad.endDate) <= now
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold">Advertisement Campaigns</h2>
          <p className="text-sm text-gray-600">
            {advertisements.total} campaigns • Page {advertisements.page} of{" "}
            {advertisements.totalPages}
          </p>
        </div>
      </div>

      {/* Pending Payment Campaigns */}
      {pendingAds.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-md font-medium text-gray-900">
            Pending Payment ({pendingAds.length})
          </h3>
          <div className="space-y-2">
            {pendingAds.map((ad) => (
              <div key={ad.id} className="bg-muted/50 rounded-lg p-3">
                <div className="flex items-center gap-3">
                  {/* Logo */}
                  <div className="flex-shrink-0">
                    {ad.toolLogoUrl ? (
                      <div className="w-8 h-8 rounded-md overflow-hidden">
                        <Image
                          src={ad.toolLogoUrl}
                          alt={ad.toolName}
                          width={32}
                          height={32}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ) : (
                      <div className="w-8 h-8 rounded-md bg-gray-900 flex items-center justify-center">
                        <span className="text-xs font-bold text-white">
                          {ad.toolName.charAt(0).toUpperCase()}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 mb-1">
                      <Link
                        href={`/${ad.toolId}`}
                        className="font-semibold text-gray-900 text-sm truncate hover:text-gray-700 transition-colors"
                      >
                        {ad.toolName}
                      </Link>
                      <span className="text-xs text-gray-600 w-fit">
                        {ad.placement === "homepage" ? "Homepage" : "All pages"}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 text-xs text-gray-600">
                      <span>
                        {formatDate(ad.startDate)} - {formatDate(ad.endDate)}
                      </span>
                      <span>by {ad.submitterName}</span>
                      <a
                        href={`mailto:${ad.submitterEmail}`}
                        className="text-xs text-gray-600 hover:text-gray-900 truncate"
                      >
                        {ad.submitterEmail}
                      </a>
                      <span className="font-medium">
                        {formatPrice(ad.totalPrice)}
                      </span>
                    </div>
                  </div>

                  {/* Status */}
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-1 sm:gap-2 flex-shrink-0">
                    {getStatusBadge(ad)}
                    <button
                      onClick={() => openDeleteModal(ad)}
                      disabled={loading[ad.id]}
                      className="p-1.5 rounded transition-colors text-gray-600 hover:bg-gray-100"
                      title="Delete pending advertisement"
                    >
                      {loading[ad.id] ? (
                        <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <Trash2 className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Active Campaigns */}
      {activeAds.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-md font-medium text-gray-900">
            Active Campaigns ({activeAds.length})
          </h3>
          <div className="space-y-2">
            {activeAds.map((ad) => (
              <div key={ad.id} className="bg-muted/50 rounded-lg p-3">
                <div className="flex items-center gap-3">
                  {/* Logo */}
                  <div className="flex-shrink-0">
                    {ad.toolLogoUrl ? (
                      <div className="w-8 h-8 rounded-md overflow-hidden">
                        <Image
                          src={ad.toolLogoUrl}
                          alt={ad.toolName}
                          width={32}
                          height={32}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ) : (
                      <div className="w-8 h-8 rounded-md bg-gray-900 flex items-center justify-center">
                        <span className="text-xs font-bold text-white">
                          {ad.toolName.charAt(0).toUpperCase()}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 mb-1">
                      <Link
                        href={`/${ad.toolId}`}
                        className="font-semibold text-gray-900 text-sm truncate hover:text-gray-700 transition-colors"
                      >
                        {ad.toolName}
                      </Link>
                      <span className="text-xs text-gray-600 w-fit">
                        {ad.placement === "homepage" ? "Homepage" : "All pages"}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 text-xs text-gray-600">
                      <span>
                        {formatDate(ad.startDate)} - {formatDate(ad.endDate)}
                      </span>
                      <span>by {ad.submitterName}</span>
                      <a
                        href={`mailto:${ad.submitterEmail}`}
                        className="text-xs text-gray-600 hover:text-gray-900 truncate"
                      >
                        {ad.submitterEmail}
                      </a>
                      <span className="font-medium">
                        {formatPrice(ad.totalPrice)}
                      </span>
                    </div>
                  </div>

                  {/* Status */}
                  <div className="flex flex-col sm:flex-row items-end sm:items-center gap-1 sm:gap-2 flex-shrink-0">
                    {getStatusBadge(ad)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Expired Campaigns */}
      {expiredAds.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-md font-medium text-gray-900">
            Previous Campaigns ({expiredAds.length})
          </h3>
          <div className="space-y-2">
            {expiredAds.map((ad) => (
              <div
                key={ad.id}
                className="bg-muted/50 rounded-lg p-3 opacity-75"
              >
                <div className="flex items-center gap-3">
                  {/* Logo */}
                  <div className="flex-shrink-0">
                    {ad.toolLogoUrl ? (
                      <div className="w-8 h-8 rounded-md overflow-hidden grayscale">
                        <Image
                          src={ad.toolLogoUrl}
                          alt={ad.toolName}
                          width={32}
                          height={32}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ) : (
                      <div className="w-8 h-8 rounded-md bg-gray-400 flex items-center justify-center">
                        <span className="text-xs font-bold text-white">
                          {ad.toolName.charAt(0).toUpperCase()}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 mb-1">
                      <Link
                        href={`/${ad.toolId}`}
                        className="font-semibold text-gray-700 text-sm truncate hover:text-gray-600 transition-colors"
                      >
                        {ad.toolName}
                      </Link>
                      <span className="text-xs text-gray-500 w-fit">
                        {ad.placement === "homepage" ? "Homepage" : "All pages"}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 text-xs text-gray-500">
                      <span>
                        {formatDate(ad.startDate)} - {formatDate(ad.endDate)}
                      </span>
                      <span>by {ad.submitterName}</span>
                      <a
                        href={`mailto:${ad.submitterEmail}`}
                        className="text-xs text-gray-500 hover:text-gray-700 truncate"
                      >
                        {ad.submitterEmail}
                      </a>
                      <span className="font-medium">
                        {formatPrice(ad.totalPrice)}
                      </span>
                    </div>
                  </div>

                  {/* Status */}
                  <div className="flex flex-col sm:flex-row items-end sm:items-center gap-1 sm:gap-2 flex-shrink-0">
                    {getStatusBadge(ad)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Pagination */}
      {advertisements.totalPages > 1 && (
        <div className="flex flex-col items-center gap-4 pt-4">
          <span className="text-sm text-gray-500">
            Showing {advertisements.data.length} of {advertisements.total}{" "}
            campaigns
          </span>
          <div className="flex items-center gap-2">
            {/* Previous button */}
            <button
              onClick={() =>
                (window.location.href = `/admin?tab=ads&page=${
                  advertisements.page - 1
                }`)
              }
              disabled={advertisements.page <= 1}
              className="px-3 py-1.5 text-sm border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>

            {/* Page numbers */}
            <div className="flex items-center gap-1">
              {Array.from(
                { length: advertisements.totalPages },
                (_, i) => i + 1
              ).map((pageNum) => (
                <button
                  key={pageNum}
                  onClick={() =>
                    (window.location.href = `/admin?tab=ads&page=${pageNum}`)
                  }
                  className={`px-3 py-1.5 text-sm rounded ${
                    pageNum === advertisements.page
                      ? "bg-gray-900 text-white"
                      : "border border-gray-300 hover:bg-gray-50"
                  }`}
                >
                  {pageNum}
                </button>
              ))}
            </div>

            {/* Next button */}
            <button
              onClick={() =>
                (window.location.href = `/admin?tab=ads&page=${
                  advertisements.page + 1
                }`)
              }
              disabled={advertisements.page >= advertisements.totalPages}
              className="px-3 py-1.5 text-sm border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {confirmDelete && (
        <div className="fixed inset-0 bg-black/20 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-4 max-w-sm w-full">
            <h3 className="text-sm font-medium text-gray-900 mb-2">
              Delete pending ad?
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              Delete pending advertisement for &ldquo;{confirmDelete.name}
              &rdquo;? This action cannot be undone.
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setConfirmDelete(null)}
                className="flex-1 px-3 py-2 text-sm text-gray-600 bg-gray-100 rounded hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDeletePending(confirmDelete.id)}
                disabled={loading[confirmDelete.id]}
                className="flex-1 px-3 py-2 text-sm text-white bg-gray-900 rounded hover:bg-gray-800 transition-colors disabled:opacity-50"
              >
                {loading[confirmDelete.id] ? "..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
