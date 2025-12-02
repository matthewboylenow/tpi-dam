import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-brand-bg via-slate-900 to-brand-primary">
      <div className="max-w-2xl mx-auto px-6 text-center">
        <h1 className="text-5xl md:text-6xl font-bold text-white mb-6">
          Taylor Products DAM
        </h1>
        <p className="text-xl text-slate-300 mb-8">
          Digital Asset Management for Taylor Products
        </p>
        <div className="flex gap-4 justify-center">
          <Link
            href="/login"
            className="px-6 py-3 bg-brand-primary-light hover:bg-brand-primary text-white rounded-lg font-semibold transition-colors"
          >
            Log In
          </Link>
        </div>
      </div>
    </div>
  );
}
