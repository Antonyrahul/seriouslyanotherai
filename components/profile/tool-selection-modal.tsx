"use client";

import { useState, useTransition } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { AlertCircle, Clock, CheckCircle2, X } from "lucide-react";
import { Tool } from "@/lib/types";
import { saveUserToolSelection } from "@/app/actions/tools";
import { toast } from "sonner";

interface ToolSelectionModalProps {
  tools: Tool[];
  limit: number;
  plan: string;
  canSelect: boolean;
  nextSelectionDate?: Date | null;
}

export function ToolSelectionModal({
  tools,
  limit,
  plan,
  canSelect,
  nextSelectionDate,
}: ToolSelectionModalProps) {
  const [open, setOpen] = useState(false);
  const [selectedToolIds, setSelectedToolIds] = useState<string[]>(
    tools.filter((t) => t.featured).map((t) => t.id)
  );
  const [isPending, startTransition] = useTransition();

  const handleToolToggle = (toolId: string, checked: boolean) => {
    if (checked) {
      if (selectedToolIds.length >= limit) {
        toast.error(
          `Your ${plan} plan allows only ${limit} active tool${
            limit > 1 ? "s" : ""
          }`
        );
        return;
      }
      setSelectedToolIds((prev) => [...prev, toolId]);
    } else {
      setSelectedToolIds((prev) => prev.filter((id) => id !== toolId));
    }
  };

  const handleSave = () => {
    startTransition(async () => {
      try {
        const result = await saveUserToolSelection(selectedToolIds);

        if (result.success) {
          toast.success(result.message);
          setOpen(false);
          // Refresh page to see changes
          window.location.reload();
        } else {
          toast.error(result.message);
        }
      } catch (error) {
        toast.error("Error saving selection");
        console.error(error);
      }
    });
  };

  const handleClose = () => {
    setSelectedToolIds(tools.filter((t) => t.featured).map((t) => t.id));
    setOpen(false);
  };

  const activeTools = tools.filter((t) => t.featured);
  const inactiveTools = tools.filter((t) => !t.featured);

  if (!canSelect && nextSelectionDate) {
    return (
      <div className="text-xs text-gray-500 flex items-center gap-2">
        <Clock className="h-3 w-3" />
        <span>
          Selection available {nextSelectionDate.toLocaleDateString("en-US")} -{" "}
          {activeTools.length}/{limit} active
        </span>
      </div>
    );
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="w-full px-3 py-2 bg-gray-50 border border-gray-200 text-gray-700 rounded hover:bg-gray-100 transition-colors text-sm font-medium flex items-center justify-center gap-2"
      >
        <AlertCircle className="h-4 w-4" />
        Choose active tools ({selectedToolIds.length}/{limit})
      </button>

      {open && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center p-2 sm:p-3 z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-[90%] sm:max-w-2xl max-h-[90vh] sm:max-h-[85vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between p-3 sm:p-4 border-b border-gray-200">
              <div>
                <h2 className="text-base font-semibold text-gray-900">
                  Select Active Tools
                </h2>
                <p className="text-xs text-gray-600 mt-1">
                  Your <span className="font-medium">{plan}</span> plan allows{" "}
                  {limit} active tool{limit > 1 ? "s" : ""}
                </p>
              </div>
              <button
                onClick={handleClose}
                disabled={isPending}
                className="p-1 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Content */}
            <div className="p-3 sm:p-4 space-y-4">
              {/* Warning */}
              <div className="text-xs text-red-700 bg-red-50 border border-red-200 p-3 rounded">
                <div className="flex items-center gap-2">
                  <AlertCircle className="h-3 w-3 text-red-600" />
                  <span className="font-medium">
                    This modification is only allowed once per month
                  </span>
                </div>
              </div>

              {/* Currently active tools */}
              {activeTools.length > 0 && (
                <div>
                  <h3 className="font-medium text-gray-700 mb-2 flex items-center text-sm">
                    <CheckCircle2 className="h-4 w-4 mr-2" />
                    Active ({activeTools.length})
                  </h3>
                  <div className="space-y-2">
                    {activeTools.map((tool) => (
                      <div
                        key={tool.id}
                        className="flex items-center space-x-3 p-2 bg-gray-50 rounded border border-gray-100"
                      >
                        <Checkbox
                          id={tool.id}
                          checked={selectedToolIds.includes(tool.id)}
                          onCheckedChange={(checked) =>
                            handleToolToggle(tool.id, checked as boolean)
                          }
                        />
                        <div className="flex-1 min-w-0">
                          <label
                            htmlFor={tool.id}
                            className="font-medium text-gray-900 cursor-pointer text-sm"
                          >
                            {tool.name}
                          </label>
                          <p className="text-xs text-gray-600 line-clamp-1">
                            {tool.description}
                          </p>
                        </div>
                        <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                          Active
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Inactive tools */}
              {inactiveTools.length > 0 && (
                <div>
                  <h3 className="font-medium text-gray-700 mb-2 flex items-center text-sm">
                    <AlertCircle className="h-4 w-4 mr-2" />
                    Inactive ({inactiveTools.length})
                  </h3>
                  <div className="space-y-2">
                    {inactiveTools.map((tool) => (
                      <div
                        key={tool.id}
                        className="flex items-center space-x-3 p-2 bg-gray-50 rounded border border-gray-100"
                      >
                        <Checkbox
                          id={tool.id}
                          checked={selectedToolIds.includes(tool.id)}
                          onCheckedChange={(checked) =>
                            handleToolToggle(tool.id, checked as boolean)
                          }
                        />
                        <div className="flex-1 min-w-0">
                          <label
                            htmlFor={tool.id}
                            className="font-medium text-gray-800 cursor-pointer text-sm"
                          >
                            {tool.name}
                          </label>
                          <p className="text-xs text-gray-600 line-clamp-1">
                            {tool.description}
                          </p>
                        </div>
                        <span className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded">
                          Inactive
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Status */}
              <div className="text-xs text-gray-600 bg-gray-50 p-3 rounded">
                <div className="flex items-center gap-2">
                  <AlertCircle className="h-3 w-3" />
                  <span>
                    {selectedToolIds.length === 0 &&
                      "Please select at least one tool"}
                    {selectedToolIds.length > 0 &&
                      selectedToolIds.length <= limit &&
                      `${selectedToolIds.length}/${limit} tools selected`}
                    {selectedToolIds.length > limit &&
                      `Too many selected (max ${limit})`}
                  </span>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="flex gap-2 p-3 sm:p-4 border-t border-gray-200">
              <button
                type="button"
                onClick={handleClose}
                disabled={isPending}
                className="flex-1 px-3 py-1.5 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors text-xs font-medium disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={
                  isPending ||
                  selectedToolIds.length > limit ||
                  selectedToolIds.length === 0
                }
                className="flex-1 px-3 py-1.5 bg-gray-900 text-white rounded hover:bg-gray-800 transition-colors text-xs font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isPending ? "Saving..." : "Save Selection"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
