"use client";

type Props = {
  totalFiles: number;
  totalSizeBytes: number;
};

export function StorageStats({ totalFiles, totalSizeBytes }: Props) {
  const totalSizeGB = totalSizeBytes / 1024 / 1024 / 1024;
  const totalSizeMB = totalSizeBytes / 1024 / 1024;
  const averageSizeMB = totalFiles > 0 ? totalSizeMB / totalFiles : 0;

  // Estimate monthly storage cost (Vercel Blob: ~$0.15/GB/month)
  const estimatedMonthlyCost = totalSizeGB * 0.15;

  return (
    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-200">
      <div className="flex items-center gap-2 mb-4">
        <svg
          className="w-6 h-6 text-blue-600"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4"
          />
        </svg>
        <h3 className="text-lg font-semibold text-slate-900">Storage Usage</h3>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Total Files */}
        <div className="bg-white rounded-lg p-4 shadow-sm">
          <p className="text-xs font-medium text-slate-500 uppercase">
            Total Files
          </p>
          <p className="text-2xl font-bold text-slate-900 mt-1">
            {totalFiles.toLocaleString()}
          </p>
        </div>

        {/* Total Size */}
        <div className="bg-white rounded-lg p-4 shadow-sm">
          <p className="text-xs font-medium text-slate-500 uppercase">
            Total Size
          </p>
          <p className="text-2xl font-bold text-slate-900 mt-1">
            {totalSizeGB >= 1
              ? `${totalSizeGB.toFixed(2)} GB`
              : `${totalSizeMB.toFixed(0)} MB`}
          </p>
        </div>

        {/* Average File Size */}
        <div className="bg-white rounded-lg p-4 shadow-sm">
          <p className="text-xs font-medium text-slate-500 uppercase">
            Avg File Size
          </p>
          <p className="text-2xl font-bold text-slate-900 mt-1">
            {averageSizeMB.toFixed(1)} MB
          </p>
        </div>

        {/* Estimated Cost */}
        <div className="bg-white rounded-lg p-4 shadow-sm">
          <p className="text-xs font-medium text-slate-500 uppercase">
            Est. Monthly Cost
          </p>
          <p className="text-2xl font-bold text-green-600 mt-1">
            ${estimatedMonthlyCost.toFixed(2)}
          </p>
        </div>
      </div>

      {/* Cost Breakdown */}
      <div className="mt-4 p-3 bg-white/50 rounded-lg border border-blue-100">
        <p className="text-xs text-slate-600">
          <strong>Cost Breakdown:</strong> Storage ~$0.15/GB/month • Bandwidth
          ~$0.15/GB • Total estimate based on current storage only
        </p>
      </div>

      {/* Warnings */}
      {totalSizeGB > 10 && (
        <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-lg">
          <p className="text-sm text-amber-800">
            ⚠️ You&apos;re using {totalSizeGB.toFixed(1)} GB of storage. Consider
            asking users to record at 1080p to reduce file sizes.
          </p>
        </div>
      )}

      {averageSizeMB > 100 && (
        <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-lg">
          <p className="text-sm text-amber-800">
            ⚠️ Average file size is {averageSizeMB.toFixed(0)} MB. This suggests
            users may be uploading 4K videos or large images.
          </p>
        </div>
      )}
    </div>
  );
}
