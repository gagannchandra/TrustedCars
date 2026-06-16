import { Link } from "react-router-dom";
import type { Car } from "../data/mockData";

type Props = {
  car: Car;
  onSelect?: (id: string) => void;
};

export default function CarCard({ car, onSelect }: Props) {
  const Wrapper = ({ children }: { children: React.ReactNode }) => {
    if (onSelect) {
      return (
        <article
          onClick={() => onSelect(car.id)}
          className="group cursor-pointer overflow-hidden rounded-[var(--radius-card)] border border-[var(--color-line)] bg-white transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-slate-900/5"
        >
          {children}
        </article>
      );
    }
    return (
      <Link
        to={`/car/${car.id}`}
        className="group block overflow-hidden rounded-[var(--radius-card)] border border-[var(--color-line)] bg-white transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-slate-900/5"
      >
        {children}
      </Link>
    );
  };

  return (
    <Wrapper>
      <div className="relative aspect-4-3 overflow-hidden bg-slate-100">
        <img
          src={car.image}
          alt={`${car.year} ${car.make} ${car.model}`}
          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
          loading="lazy"
        />
        <div className="absolute inset-x-0 top-0 flex items-start justify-between p-2.5">
          <div className="flex flex-wrap gap-1">
            {car.badges.slice(0, 2).map((b) => (
              <span
                key={b}
                className="rounded-full bg-white/95 px-2 py-0.5 text-[10px] font-semibold text-slate-900 shadow-sm backdrop-blur"
              >
                {b}
              </span>
            ))}
          </div>
        </div>
        <div className="absolute bottom-2.5 left-2.5 flex items-center gap-1 rounded-full bg-[var(--color-brand-500)] px-2 py-0.5 text-[10px] font-bold text-white shadow">
          ✓ {car.inspectionScore}/100
        </div>
      </div>

      <div className="p-3.5">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <h3 className="truncate text-sm font-bold text-[var(--color-ink)]">
              {car.make} {car.model}
            </h3>
            <p className="truncate text-[12px] text-[var(--color-ink-mute)]">
              {car.variant}
            </p>
          </div>
          <div className="flex items-center gap-0.5 rounded-md bg-amber-50 px-1.5 py-0.5 text-[11px] font-semibold text-amber-700 ring-1 ring-amber-200/60">
            ★ {car.rating}
          </div>
        </div>

        <div className="mt-2.5 flex items-center gap-2 text-[11px] text-[var(--color-ink-soft)]">
          <span>{car.year}</span>
          <span className="h-2.5 w-px bg-[var(--color-line)]" />
          <span>{(car.km / 1000).toFixed(1)}k km</span>
          <span className="h-2.5 w-px bg-[var(--color-line)]" />
          <span>{car.fuel}</span>
          <span className="h-2.5 w-px bg-[var(--color-line)]" />
          <span>{car.transmission === "Automatic" ? "AT" : "MT"}</span>
        </div>

        <div className="mt-3 flex items-end justify-between border-t border-[var(--color-line)] pt-3">
          <div>
            <div className="text-base font-bold text-[var(--color-ink)]">
              ₹{car.price} L
            </div>
            <div className="text-[11px] text-[var(--color-ink-mute)]">
              All-inclusive on-road price
            </div>
          </div>
          <div className="flex items-center gap-1 text-[11px] text-[var(--color-ink-mute)]">
            <svg viewBox="0 0 24 24" fill="none" className="h-3 w-3">
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" stroke="currentColor" strokeWidth="1.8" />
              <circle cx="12" cy="10" r="2.5" stroke="currentColor" strokeWidth="1.8" />
            </svg>
            {car.city}
          </div>
        </div>
      </div>
    </Wrapper>
  );
}
