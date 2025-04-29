"use client";

import React from "react";
import { Input } from "@/app/components/ui/input";
import { Button } from "@/app/components/ui/button";

type TimeRange = "daily" | "weekly" | "monthly";

interface FiltersProps {
  filters: {
    timeRange: TimeRange;
    product: string;
    category: string;
  };
  setFilters: (filters: FiltersProps["filters"]) => void;
}

export default function Filters({ filters, setFilters }: FiltersProps) {
  return (
    <div className="flex flex-col md:flex-row gap-4 items-end mb-4">
      {/* Time Range */}
      <div>
        <label className="block text-xs font-medium mb-1">Time Range</label>
        <select
          className="border rounded px-2 py-1"
          value={filters.timeRange}
          onChange={e =>
            setFilters({ ...filters, timeRange: e.target.value as TimeRange })
          }
        >
          <option value="daily">Daily</option>
          <option value="weekly">Weekly</option>
          <option value="monthly">Monthly</option>
        </select>
      </div>
      {/* Product */}
      <div>
        <label className="block text-xs font-medium mb-1">Product</label>
        <Input
          type="text"
          placeholder="Product name"
          value={filters.product}
          onChange={e => setFilters({ ...filters, product: e.target.value })}
        />
      </div>
      {/* Category */}
      <div>
        <label className="block text-xs font-medium mb-1">Category</label>
        <Input
          type="text"
          placeholder="Category"
          value={filters.category}
          onChange={e => setFilters({ ...filters, category: e.target.value })}
        />
      </div>
      {/* Reset */}
      <Button
        variant="outline"
        onClick={() =>
          setFilters({ timeRange: "monthly", product: "", category: "" })
        }
      >
        Reset
      </Button>
    </div>
  );
}