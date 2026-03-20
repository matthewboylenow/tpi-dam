import Image from "next/image";

export default async function SharePage({ params }: { params: { token: string } }) {
  const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";

  let media: any = null;
  let expiresAt: string | null = null;
  let error: string | null = null;

  try {
    const res = await fetch(`${baseUrl}/api/share/${params.token}`, { cache: "no-store" });
    const data = await res.json();
    if (!res.ok) {
      error = data.error || "Could not load shared content";
    } else {
      media = data.media;
      expiresAt = data.expiresAt;
    }
  } catch {
    error = "Failed to load shared content";
  }

  if (error || !media) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
        <div className="text-center max-w-sm">
          <div className="w-16 h-16 rounded-2xl bg-red-100 flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h1 className="text-xl font-bold text-slate-900 mb-2">Link Unavailable</h1>
          <p className="text-slate-500 text-sm">{error || "This link has expired or does not exist."}</p>
        </div>
      </div>
    );
  }

  const isVideo = media.mime_type?.startsWith("video/");
  const expires = expiresAt
    ? new Date(expiresAt).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })
    : null;

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 px-4 py-4">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-base font-bold text-slate-900">Taylor Products DAM</h1>
            <p className="text-xs text-slate-400">Shared asset</p>
          </div>
          {expires && (
            <p className="text-xs text-slate-400">Expires {expires}</p>
          )}
        </div>
      </header>

      {/* Content */}
      <main className="max-w-3xl mx-auto px-4 py-8">
        {/* Media */}
        <div className="bg-white rounded-2xl overflow-hidden shadow-sm border border-slate-200 mb-6">
          {isVideo ? (
            <video
              src={media.blob_url}
              controls
              className="w-full"
              preload="metadata"
            />
          ) : (
            <div className="relative w-full" style={{ paddingBottom: "56.25%" }}>
              <Image
                src={media.blob_url}
                alt={media.caption || "Shared media"}
                fill
                className="object-contain"
                sizes="(max-width: 768px) 100vw, 768px"
              />
            </div>
          )}
        </div>

        {/* Details */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 space-y-4">
          {media.client_name && (
            <p className="text-xs font-semibold uppercase tracking-wide text-teal-600">{media.client_name}</p>
          )}
          {media.caption && (
            <h2 className="text-xl font-bold text-slate-900">{media.caption}</h2>
          )}
          {media.tags?.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {media.tags.map((tag: string) => (
                <span key={tag} className="px-2.5 py-1 bg-slate-100 text-slate-600 rounded-lg text-xs font-medium">
                  {tag}
                </span>
              ))}
            </div>
          )}
          <a
            href={media.blob_url}
            download
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-brand-primary hover:bg-brand-secondary text-white text-sm font-semibold rounded-xl transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Download
          </a>
        </div>
      </main>
    </div>
  );
}
