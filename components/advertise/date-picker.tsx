"use client";

import { format } from "date-fns";
import { DateRange } from "react-day-picker";
import { Calendar } from "@/components/ui/calendar";

interface DatePickerProps {
  value: DateRange | undefined;
  onChange: (value: DateRange | undefined) => void;
}

export function DatePicker({ value, onChange }: DatePickerProps) {
  return (
    <div className="space-y-1">
      <h3 className="text-sm font-medium">Campaign Period</h3>
      <div className="text-xs text-gray-600 mb-4">
        {value?.from && value?.to ? (
          <>
            {format(value.from, "MMM dd")} - {format(value.to, "MMM dd, y")}
          </>
        ) : (
          "Select dates"
        )}
      </div>
      <div className="flex justify-center">
        <Calendar
          mode="range"
          selected={value}
          onSelect={onChange}
          disabled={(date) => {
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            return date < today;
          }}
          className="rounded-md border p-2"
        />
      </div>
    </div>
  );
}
