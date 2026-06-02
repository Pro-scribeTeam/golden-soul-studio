"use client";

import React from "react";

interface GoldButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost";
  size?: "sm" | "md" | "lg";
  loading?: boolean;
  children: React.ReactNode;
}

export function GoldButton({
  variant = "primary",
  size = "md",
  loading = false,
  children,
  className = "",
  disabled,
  ...props
}: GoldButtonProps) {
  const base =
    "inline-flex items-center justify-center gap-2 font-body font-semibold rounded-lg transition-all duration-200 btn-pulse cursor-pointer select-none";

  const sizes = {
    sm: "px-3 py-1.5 text-xs",
    md: "px-5 py-2.5 text-sm",
    lg: "px-7 py-3.5 text-base",
  };

  const variants = {
    primary:
      "bg-[#C9A84C] text-[#0A0A0F] hover:bg-[#D4B86A] active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_20px_#C9A84C33]",
    secondary:
      "bg-transparent text-[#C9A84C] border border-[#C9A84C] hover:bg-[#C9A84C11] active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed",
    ghost:
      "bg-transparent text-[#F5F0E8] hover:bg-[#C9A84C11] hover:text-[#C9A84C] active:scale-95",
  };

  return (
    <button
      className={`${base} ${sizes[size]} ${variants[variant]} ${className}`}
      disabled={disabled || loading}
      {...props}
    >
      {loading && (
        <span className="w-4 h-4 border-2 border-[#0A0A0F44] border-t-[#0A0A0F] rounded-full animate-spin-gold inline-block" />
      )}
      {children}
    </button>
  );
}
