"use client";

import { useCallback } from "react";
import { useDropzone } from "react-dropzone";

type Props = {
  onFilesSelect: (files: File[]) => void;
  disabled?: boolean;
  selectedFiles?: File[];
  multiple?: boolean;
};

export function DropzoneUpload({
  onFilesSelect,
  disabled = false,
  selectedFiles = [],
  multiple = true
}: Props) {
  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      if (acceptedFiles.length > 0 && !disabled) {
        onFilesSelect(acceptedFiles);
      }
    },
    [onFilesSelect, disabled]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "image/*": [],
      "video/*": [],
    },
    multiple,
    maxSize: 100 * 1024 * 1024, // 100MB per file
    disabled,
  });

  return (
    <div>
      <label className="block text-sm font-medium text-slate-700 mb-2">
        Select File
      </label>
      <div
        {...getRootProps()}
        className={`
          border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all
          ${
            isDragActive
              ? "border-brand-primary bg-brand-primary/5"
              : "border-slate-300 hover:border-slate-400"
          }
          ${disabled ? "opacity-50 cursor-not-allowed" : ""}
        `}
      >
        <input {...getInputProps()} />

        <div className="flex flex-col items-center gap-3">
          <div
            className={`p-3 rounded-full ${
              isDragActive ? "bg-brand-primary/10" : "bg-slate-100"
            }`}
          >
            <svg
              className={`w-8 h-8 ${
                isDragActive ? "text-brand-primary" : "text-slate-400"
              }`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
              />
            </svg>
          </div>

          <div>
            <p className="text-slate-700 font-medium">
              {isDragActive ? (
                "Drop your files here"
              ) : (
                <>
                  <span className="text-brand-primary">Click to upload</span> or
                  drag and drop
                </>
              )}
            </p>
            <p className="text-sm text-slate-500 mt-1">
              {multiple
                ? "Images and videos up to 200MB each (multiple files supported)"
                : "Images and videos up to 200MB"}
            </p>
            <p className="text-xs text-slate-400 mt-1">
              💡 iPhone users: Record at 1080p for faster uploads
            </p>
          </div>
        </div>
      </div>

      {selectedFiles.length > 0 && (
        <div className="mt-3 space-y-2">
          {selectedFiles.map((file, index) => {
            const fileSizeMB = file.size / 1024 / 1024;
            const isLarge = file.size > 150 * 1024 * 1024; // > 150MB
            const isVideo = file.type.startsWith("video/");

            return (
              <div
                key={`${file.name}-${index}`}
                className="p-3 bg-slate-50 rounded-lg border border-slate-200"
              >
                <div className="flex items-center gap-2">
                  <svg
                    className="w-5 h-5 text-green-500 flex-shrink-0"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-900 truncate">
                      {file.name}
                    </p>
                    <p className="text-xs text-slate-500">
                      {fileSizeMB.toFixed(2)} MB
                    </p>
                    {isLarge && isVideo && (
                      <p className="text-xs text-amber-600 mt-1 flex items-center gap-1">
                        <span>⚠️</span>
                        <span>
                          Large file - may take {Math.ceil(fileSizeMB / 2)}-{Math.ceil(fileSizeMB)} seconds to upload
                        </span>
                      </p>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
          {selectedFiles.length > 1 && (
            <p className="text-sm text-slate-600 font-medium">
              {selectedFiles.length} files selected
            </p>
          )}
        </div>
      )}
    </div>
  );
}
