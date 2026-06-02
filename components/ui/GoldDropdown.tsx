"use client";

import React from "react";
import { ChevronDown } from "lucide-react";

interface Option {
  value: string;
  label: string;
  description?: string;
  group?: string;
}

interface GoldDropdownProps {
  label?: string;
  value: string;
  options: Option[];
  onChange: (value: string) => void;
  className?: string;
  placeholder?: string;
}

export function GoldDropdown({
  label,
  value,
  options,
  onChange,
  className = "",
  placeholder = "Select...",
}: GoldDropdownProps) {
  // Group options
  const groups: Record<string, Option[]> = {};
  const ungrouped: Option[] = [];

  options.forEach((opt) => {
    if (opt.group) {
      if (!groups[opt.group]) groups[opt.group] = [];
      groups[opt.group].push(opt);
    } else {
      ungrouped.push(opt);
    }
  });

  const hasGroups = Object.keys(groups).length > 0;

  return (
    <div className={`space-y-1.5 ${className}`}>
      {label && (
        <label className="text-xs font-body text-[#F5F0E8AA] uppercase tracking-wider">
          {label}
        </label>
      )}
      <div className="relative">
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full px-3 py-2.5 pr-8 bg-[#111118] border border-[#C9A84C33] rounded-lg text-sm font-body text-[#F5F0E8] cursor-pointer outline-none focus:border-[#C9A84C] transition-colors appearance-none hover:border-[#C9A84C66]"
        >
          {placeholder && !value && (
            <option value="" disabled>
              {placeholder}
            </option>
          )}
          {hasGroups ? (
            <>
              {ungrouped.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
              {Object.entries(groups).map(([groupName, opts]) => (
                <optgroup key={groupName} label={`— ${groupName} —`}>
                  {opts.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </optgroup>
              ))}
            </>
          ) : (
            options.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))
          )}
        </select>
        <ChevronDown
          size={14}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-[#C9A84C] pointer-events-none"
        />
      </div>
    </div>
  );
}
