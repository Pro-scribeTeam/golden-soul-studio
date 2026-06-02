"use client";

import React from "react";

interface LoadingRingProps {
  progress?: number;
  estimatedSeconds?: number;
  onCancel?: () => void;
  label?: string;
}

export function LoadingRing({
  progress,
  estimatedSeconds,
  onCancel,
  label = "Generating...",
}: LoadingRingProps) {
  return (
    <div className="flex flex-col items-center gap-4 py-8">
      {/* Spinning ring */}
      <div className="relative w-16 h-16">
        <div className="absolute inset-0 rounded-full border-4 border-[#C9A84C22]" />
        <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-[#C9A84C] animate-spin-gold" />
        {progress !== undefined && (
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-xs font-body font-bold text-[#C9A84C]">
              {Math.round(progress)}%
            </span>
          </div>
        )}
      </div>

      <p className="text-sm font-body text-[#F5F0E8AA] animate-pulse-gold">{label}</p>

      {/* Progress bar */}
      {progress !== undefined && (
        <div className="w-full max-w-xs bg-[#3A3A4A] rounded-full h-1.5">
          <div
            className="progress-gold"
            style={{ width: `${progress}%` }}
          />
        </div>
      )}

      {estimatedSeconds !== undefined && estimatedSeconds > 0 && (
        <p className="text-xs text-[#F5F0E855]">
          ~{estimatedSeconds}s remaining
        </p>
      )}

      {onCancel && (
        <button
          onClick={onCancel}
          className="text-xs text-[#F5F0E866] hover:text-[#C9A84C] transition-colors underline"
        >
          Cancel generation
        </button>
      )}
    </div>
  );
}
