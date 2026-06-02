"use client";

import React, { useCallback, useRef } from "react";

interface GoldSliderProps {
  label: string;
  min: number;
  max: number;
  step?: number;
  value: number;
  defaultValue?: number;
  onChange: (value: number) => void;
  formatValue?: (value: number) => string;
  className?: string;
}

export function GoldSlider({
  label,
  min,
  max,
  step = 1,
  value,
  defaultValue,
  onChange,
  formatValue,
  className = "",
}: GoldSliderProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDoubleClick = useCallback(() => {
    if (defaultValue !== undefined) {
      onChange(defaultValue);
    }
  }, [defaultValue, onChange]);

  const pct = ((value - min) / (max - min)) * 100;
  const display = formatValue ? formatValue(value) : String(value);

  return (
    <div className={`space-y-1.5 ${className}`}>
      <div className="flex items-center justify-between">
        <label className="text-xs font-body text-[#F5F0E8AA] uppercase tracking-wider">
          {label}
        </label>
        <span className="text-sm font-body font-semibold text-[#C9A84C] min-w-[2.5rem] text-right">
          {display}
        </span>
      </div>
      <div className="relative" onDoubleClick={handleDoubleClick} title="Double-click to reset">
        <div
          className="absolute top-1/2 -translate-y-1/2 h-1 rounded-full bg-[#C9A84C] pointer-events-none"
          style={{ width: `${pct}%` }}
        />
        <input
          ref={inputRef}
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="relative z-10 w-full"
          style={{
            background: `linear-gradient(to right, #C9A84C ${pct}%, #3A3A4A ${pct}%)`,
          }}
        />
      </div>
      <div className="flex justify-between text-xs text-[#F5F0E866]">
        <span>{formatValue ? formatValue(min) : min}</span>
        <span>{formatValue ? formatValue(max) : max}</span>
      </div>
    </div>
  );
}
