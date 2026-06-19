import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { CarImage } from '../../../types';

interface ImageGalleryProps {
  images: CarImage[];
  activeImage: number;
  setActiveImage: React.Dispatch<React.SetStateAction<number>>;
  badge: { className: string; dot: string; label: string };
}

export default function ImageGallery({ images, activeImage, setActiveImage, badge }: ImageGalleryProps) {
  return (
    <div className="bg-white rounded-3xl border border-slate-100 overflow-hidden shadow-sm">
      <div className="relative aspect-video bg-slate-100">
        {images[activeImage] && (
          <img src={images[activeImage].url} alt={`Car Image`} className="w-full h-full object-cover" />
        )}
        {images.length > 1 && (
          <>
            <button onClick={() => setActiveImage(i => Math.max(0, i - 1))} disabled={activeImage === 0}
              className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-white/90 backdrop-blur-md rounded-full flex items-center justify-center shadow-[0_8px_30px_rgb(0,0,0,0.12)] hover:bg-white disabled:opacity-40 transition-all">
              <ChevronLeft className="w-6 h-6 text-slate-700" />
            </button>
            <button onClick={() => setActiveImage(i => Math.min(images.length - 1, i + 1))} disabled={activeImage === images.length - 1}
              className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-white/90 backdrop-blur-md rounded-full flex items-center justify-center shadow-[0_8px_30px_rgb(0,0,0,0.12)] hover:bg-white disabled:opacity-40 transition-all">
              <ChevronRight className="w-6 h-6 text-slate-700" />
            </button>
          </>
        )}
        <div className="absolute top-4 left-4 flex gap-2">
          <span className={`inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full shadow-md ${badge.className}`}>
            <span className={`w-2 h-2 rounded-full ${badge.dot}`}></span>
            {badge.label}
          </span>
        </div>
        <div className="absolute bottom-4 right-4 bg-slate-900/80 backdrop-blur-md text-white text-xs font-bold px-4 py-2 rounded-full shadow-md">
          {activeImage + 1} / {images.length}
        </div>
      </div>
      {images.length > 1 && (
        <div className="flex gap-3 p-4 overflow-x-auto bg-slate-50">
          {images.map((img, i) => (
            <button key={i} onClick={() => setActiveImage(i)}
              className={`shrink-0 w-24 h-16 rounded-xl overflow-hidden border-[3px] transition-all shadow-sm ${i === activeImage ? 'border-primary opacity-100 scale-105' : 'border-transparent opacity-60 hover:opacity-100'}`}>
              <img src={img.url} alt={`Gallery view ${i + 1}`} loading="lazy" className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
