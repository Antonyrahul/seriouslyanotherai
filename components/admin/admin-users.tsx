"use client";

import { useState } from "react";
import Image from "next/image";
import { Eye, EyeOff, User } from "lucide-react";
import { banUser, unbanUser } from "@/app/actions/admin-actions";

interface AdminUser {
  id: string;
  name: string;
  email: string;
  image?: string | null;
  role?: string;
  createdAt: Date;
  emailVerified: boolean;
  banned: boolean;
  stripeCustomerId?: string | null;
  subscriptionPlan?: string | null;
  subscriptionStatus?: string | null;
  toolsCount: number;
}

interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

interface AdminUsersProps {
  users: PaginatedResult<AdminUser>;
  currentUserId: string;
}

export function AdminUsers({ users, currentUserId }: AdminUsersProps) {
  const [loading, setLoading] = useState<{ [key: string]: boolean }>({});
  const [confirmUser, setConfirmUser] = useState<{
    id: string;
    name: string;
    banned: boolean;
  } | null>(null);

  const handleBanUser = async (userId: string, shouldBan: boolean) => {
    setLoading((prev) => ({ ...prev, [userId]: true }));
    try {
      if (shouldBan) {
        await banUser(userId, "Banned by admin");
      } else {
        await unbanUser(userId);
      }
      setConfirmUser(null);
    } catch (error) {
      console.error("Error banning/unbanning user:", error);
    } finally {
      setLoading((prev) => ({ ...prev, [userId]: false }));
    }
  };

  const openConfirmModal = (user: AdminUser) => {
    setConfirmUser({ id: user.id, name: user.name, banned: user.banned });
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold">Users Management</h2>
          <p className="text-sm text-gray-600">
            {users.total} users • Page {users.page} of {users.totalPages}
          </p>
        </div>
      </div>

      {/* Users List */}
      <div className="space-y-2">
        {users.data.map((user) => (
          <div key={user.id} className="bg-muted/50 rounded-lg p-3">
            <div className="flex items-center gap-3">
              {/* Avatar */}
              <div className="flex-shrink-0">
                {user.image ? (
                  <div className="w-8 h-8 rounded-full overflow-hidden">
                    <Image
                      src={user.image}
                      alt={user.name}
                      width={32}
                      height={32}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ) : (
                  <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
                    <User className="w-4 h-4 text-gray-600" />
                  </div>
                )}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 mb-1">
                  <h3 className="font-semibold text-gray-900 text-sm truncate">
                    {user.name}
                  </h3>
                  {user.role === "admin" && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-normal bg-gray-100 text-gray-700 border border-gray-200 w-fit">
                      Admin
                    </span>
                  )}
                  <a
                    href={`mailto:${user.email}`}
                    className="text-xs text-gray-600 hover:text-gray-900 truncate"
                  >
                    {user.email}
                  </a>
                </div>
                <div className="flex flex-wrap items-center gap-2 text-xs text-gray-600">
                  {user.subscriptionPlan && (
                    <div className="flex items-center gap-1">
                      <span
                        className={`px-2 py-1 rounded text-xs font-medium ${
                          user.subscriptionStatus === "active"
                            ? user.subscriptionPlan.includes("starter")
                              ? "bg-blue-100 text-blue-800"
                              : user.subscriptionPlan.includes("plus")
                              ? "bg-purple-100 text-purple-800"
                              : user.subscriptionPlan.includes("max")
                              ? "bg-green-100 text-green-800"
                              : "bg-gray-100 text-gray-800"
                            : "bg-gray-100 text-gray-600"
                        }`}
                      >
                        {user.subscriptionPlan.includes("starter")
                          ? "Starter"
                          : user.subscriptionPlan.includes("plus")
                          ? "Plus"
                          : user.subscriptionPlan.includes("max")
                          ? "Max"
                          : user.subscriptionPlan}
                        {user.subscriptionPlan.includes("monthly")
                          ? " (Monthly)"
                          : user.subscriptionPlan.includes("yearly")
                          ? " (Yearly)"
                          : ""}
                      </span>
                      {user.subscriptionStatus && (
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-normal border w-fit ${
                            user.subscriptionStatus === "active"
                              ? "bg-green-100 text-green-800 border-green-200"
                              : user.subscriptionStatus === "canceled" ||
                                user.subscriptionStatus === "cancelled"
                              ? "bg-red-100 text-red-800 border-red-200"
                              : user.subscriptionStatus === "past_due"
                              ? "bg-yellow-100 text-yellow-800 border-yellow-200"
                              : user.subscriptionStatus === "unpaid"
                              ? "bg-red-100 text-red-800 border-red-200"
                              : user.subscriptionStatus === "trialing"
                              ? "bg-blue-100 text-blue-800 border-blue-200"
                              : "bg-gray-100 text-gray-800 border-gray-200"
                          }`}
                        >
                          {user.subscriptionStatus === "canceled" ||
                          user.subscriptionStatus === "cancelled"
                            ? "Canceled"
                            : user.subscriptionStatus === "active"
                            ? "Active"
                            : user.subscriptionStatus === "past_due"
                            ? "Past Due"
                            : user.subscriptionStatus === "unpaid"
                            ? "Unpaid"
                            : user.subscriptionStatus === "trialing"
                            ? "Trial"
                            : user.subscriptionStatus === "incomplete"
                            ? "Incomplete"
                            : user.subscriptionStatus}
                        </span>
                      )}
                    </div>
                  )}
                  <span>{user.toolsCount} tools</span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex flex-col sm:flex-row items-end sm:items-center gap-1 sm:gap-2 flex-shrink-0">
                <span
                  className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-normal border w-fit ${
                    user.banned
                      ? "bg-red-100 text-red-800 border-red-200"
                      : "bg-green-100 text-green-800 border-green-200"
                  }`}
                >
                  {user.banned ? "Banned" : "Active"}
                </span>
                {user.id !== currentUserId && (
                  <button
                    onClick={() => openConfirmModal(user)}
                    disabled={loading[user.id]}
                    className="p-1.5 rounded transition-colors text-gray-600 hover:bg-gray-100"
                    title={user.banned ? "Unban user" : "Ban user"}
                  >
                    {loading[user.id] ? (
                      <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                    ) : user.banned ? (
                      <Eye className="w-4 h-4" />
                    ) : (
                      <EyeOff className="w-4 h-4" />
                    )}
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Pagination */}
      {users.totalPages > 1 && (
        <div className="flex flex-col items-center gap-4 pt-4">
          <span className="text-sm text-gray-500">
            Showing {users.data.length} of {users.total} users
          </span>
          <div className="flex items-center gap-2">
            {/* Previous button */}
            <button
              onClick={() =>
                (window.location.href = `/admin?tab=users&page=${
                  users.page - 1
                }`)
              }
              disabled={users.page <= 1}
              className="px-3 py-1.5 text-sm border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>

            {/* Page numbers */}
            <div className="flex items-center gap-1">
              {Array.from({ length: users.totalPages }, (_, i) => i + 1).map(
                (pageNum) => (
                  <button
                    key={pageNum}
                    onClick={() =>
                      (window.location.href = `/admin?tab=users&page=${pageNum}`)
                    }
                    className={`px-3 py-1.5 text-sm rounded ${
                      pageNum === users.page
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
                (window.location.href = `/admin?tab=users&page=${
                  users.page + 1
                }`)
              }
              disabled={users.page >= users.totalPages}
              className="px-3 py-1.5 text-sm border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      {confirmUser && (
        <div className="fixed inset-0 bg-black/20 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-4 max-w-sm w-full">
            <h3 className="text-sm font-medium text-gray-900 mb-2">
              {confirmUser.banned ? "Unban user?" : "Ban user?"}
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              {confirmUser.banned
                ? `Unban "${confirmUser.name}"?`
                : `Ban "${confirmUser.name}"?`}
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setConfirmUser(null)}
                className="flex-1 px-3 py-2 text-sm text-gray-600 bg-gray-100 rounded hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() =>
                  handleBanUser(confirmUser.id, !confirmUser.banned)
                }
                disabled={loading[confirmUser.id]}
                className="flex-1 px-3 py-2 text-sm text-white bg-gray-900 rounded hover:bg-gray-800 transition-colors disabled:opacity-50"
              >
                {loading[confirmUser.id] ? "..." : "Confirm"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
