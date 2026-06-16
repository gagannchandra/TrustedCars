import { Link } from "react-router-dom";

export default function NotFoundPage() {
  return (
    <div className="mx-auto flex max-w-md flex-col items-center px-4 py-24 text-center">
      <div className="text-6xl">🚗💨</div>
      <h1 className="mt-6 text-5xl font-bold tracking-tight text-slate-900">404</h1>
      <p className="mt-2 text-lg font-semibold text-slate-700">
        This page drove off without you
      </p>
      <p className="mt-1 text-sm text-slate-500">
        The page you're looking for doesn't exist or may have been moved.
      </p>
      <div className="mt-6 flex flex-wrap justify-center gap-3">
        <Link
          to="/"
          className="rounded-md bg-brand-500 px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-600"
        >
          Back to home
        </Link>
        <Link
          to="/cars"
          className="rounded-md border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-900 hover:bg-slate-50"
        >
          Browse cars
        </Link>
      </div>
    </div>
  );
}
