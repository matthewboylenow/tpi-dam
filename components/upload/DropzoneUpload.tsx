"use client";

import { useCallback, useEffect, useState } from "react";
import { useDropzone } from "react-dropzone";

type Props = {
  onFilesSelect: (files: File[]) => void;
  onFileRemove?: (index: number) => void;
  disabled?: boolean;
  selectedFiles?: File[];
  multiple?: boolean;
};

function FilePreview({ file, index, onRemove, disabled }: { file: File; index: number; onRemove?: (i: number) => void; disabled?: boolean }) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const isImage = file.type.startsWith("image/");
  const isVideo = file.type.startsWith("video/");
  const sizeMB = (file.size / 1024 / 1024).toFixed(1);

  useEffect(() => {
    if (isImage) {
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
      return () => URL.revokeObjectURL(url);
    }
  }, [file, isImage]);

  return (
    <div className="flex items-center gap-3 p-2.5 bg-white rounded-lg border border-slate-200 group">
      {/* Thumbnail */}
      <div className="w-12 h-12 rounded-md overflow-hidden flex-shrink-0 bg-slate-100 flex items-center justify-center">
        {isImage && previewUrl ? (
          <img src={previewUrl} alt={file.name} className="w-full h-full object-cover" />
        ) : isVideo ? (
          <svg className="w-6 h-6 text-blue-500" fill="currentColor" viewBox="0 0 24 24">
            <path d="M8 5v14l11-7z" />
          </svg>
        ) : (
          <svg className="w-6 h-6 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
          </svg>
        )}
      </div>

      {/* File Info */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-slate-800 truncate">{file.name}</p>
        <div className="flex items-center gap-2 mt-0.5">
          <span className="text-xs text-slate-400">{sizeMB} MB</span>
          <span className="text-xs text-slate-300">·</span>
          <span className="text-xs text-slate-400 uppercase">{isImage ? "Image" : isVideo ? "Video" : "File"}</span>
          {file.size > 150 * 1024 * 1024 && (
            <>
              <span className="text-xs text-slate-300">·</span>
              <span className="text-xs text-amber-600 font-medium">Large file</span>
            </>
          )}
        </div>
      </div>

      {/* Remove button */}
      {onRemove && !disabled && (
        <button
          type="button"
          onClick={() => onRemove(index)}
          className="opacity-0 group-hover:opacity-100 p-1 rounded-md hover:bg-red-50 text-slate-400 hover:text-red-500 transition-all flex-shrink-0"
          aria-label="Remove file"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      )}
    </div>
  );
}

export function DropzoneUpload({
  onFilesSelect,
  onFileRemove,
  disabled = false,
  selectedFiles = [],
  multiple = true,
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
    maxSize: 200 * 1024 * 1024,
    disabled,
  });

  return (
    <div className="space-y-3">
      <div
        {...getRootProps()}
        className={`
          relative border-2 border-dashed rounded-2xl transition-all cursor-pointer
          ${isDragActive
            ? "border-brand-primary bg-brand-primary/5 scale-[1.01]"
            : "border-slate-200 hover:border-brand-primary/50 hover:bg-slate-50/50"
          }
          ${disabled ? "opacity-50 cursor-not-allowed" : ""}
        `}
      >
        <input {...getInputProps()} />

        <div className="flex flex-col items-center justify-center gap-4 py-12 px-6 text-center">
          {/* Icon */}
          <div className={`w-16 h-16 rounded-2xl flex items-center justify-center transition-colors ${
            isDragActive ? "bg-brand-primary/10" : "bg-slate-100"
          }`}>
            <svg
              className={`w-8 h-8 transition-colors ${isDragActive ? "text-brand-primary" : "text-slate-400"}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
              />
            </svg>
          </div>

          {isDragActive ? (
            <div>
              <p className="text-lg font-semibold text-brand-primary">Drop files here</p>
              <p className="text-sm text-slate-500 mt-1">Release to add them to your upload</p>
            </div>
          ) : (
            <div>
              <p className="text-base font-semibold text-slate-700">
                <span className="text-brand-primary">Click to browse</span> or drag & drop
              </p>
              <p className="text-sm text-slate-400 mt-1">
                {multiple ? "Images & videos · Multiple files supported · Up to 200MB each" : "Images & videos · Up to 200MB"}
              </p>
            </div>
          )}

          {/* Accepted formats */}
          <div className="flex items-center gap-2 flex-wrap justify-center">
            {["JPG", "PNG", "HEIC", "GIF", "WebP", "MP4", "MOV"].map(fmt => (
              <span key={fmt} className="px-2 py-0.5 bg-white border border-slate-200 rounded-md text-xs text-slate-500 font-medium shadow-sm">
                {fmt}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* File list */}
      {selectedFiles.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between px-0.5">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
              {selectedFiles.length} file{selectedFiles.length !== 1 ? "s" : ""} selected
            </p>
            {onFileRemove && !disabled && selectedFiles.length > 1 && (
              <p className="text-xs text-slate-400">Hover a file to remove it</p>
            )}
          </div>
          <div className="space-y-1.5 max-h-48 overflow-y-auto pr-0.5">
            {selectedFiles.map((file, index) => (
              <FilePreview
                key={`${file.name}-${index}`}
                file={file}
                index={index}
                onRemove={onFileRemove}
                disabled={disabled}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
