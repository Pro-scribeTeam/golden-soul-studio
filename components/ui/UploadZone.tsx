"use client";

import React, { useCallback, useRef, useState } from "react";
import { Upload, X } from "lucide-react";

interface UploadZoneProps {
  label: string;
  accept?: string;
  onFile: (file: File) => void;
  file?: File | null;
  hint?: string;
}

export function UploadZone({
  label,
  accept = "image/*,video/*",
  onFile,
  file,
  hint,
}: UploadZoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragging(false);
      const f = e.dataTransfer.files[0];
      if (f) onFile(f);
    },
    [onFile]
  );

  const preview =
    file &&
    (file.type.startsWith("image/")
      ? URL.createObjectURL(file)
      : null);

  return (
    <div
      onClick={() => inputRef.current?.click()}
      onDragOver={(e) => {
        e.preventDefault();
        setDragging(true);
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={handleDrop}
      className={`relative border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all duration-200 ${
        dragging
          ? "border-[#C9A84C] bg-[#C9A84C11]"
          : "border-[#C9A84C33] hover:border-[#C9A84C66] hover:bg-[#C9A84C08]"
      }`}
    >
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) onFile(f);
        }}
      />

      {file ? (
        <div className="space-y-2">
          {preview ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={preview}
              alt="Preview"
              className="mx-auto max-h-32 rounded-lg object-contain"
            />
          ) : (
            <div className="w-12 h-12 mx-auto bg-[#C9A84C22] rounded-lg flex items-center justify-center">
              <Upload size={20} className="text-[#C9A84C]" />
            </div>
          )}
          <p className="text-sm text-[#F5F0E8] font-body truncate">{file.name}</p>
          <p className="text-xs text-[#F5F0E855]">
            {(file.size / 1024 / 1024).toFixed(1)} MB
          </p>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onFile(null as unknown as File);
            }}
            className="inline-flex items-center gap-1 text-xs text-[#F5F0E855] hover:text-red-400 transition-colors"
          >
            <X size={12} /> Remove
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="w-12 h-12 mx-auto bg-[#C9A84C11] rounded-xl flex items-center justify-center">
            <Upload size={20} className="text-[#C9A84C]" />
          </div>
          <div>
            <p className="text-sm font-body text-[#F5F0E8AA]">{label}</p>
            {hint && <p className="text-xs text-[#F5F0E855] mt-1">{hint}</p>}
          </div>
          <p className="text-xs text-[#C9A84C88]">Drag & drop or click to browse</p>
        </div>
      )}
    </div>
  );
}
