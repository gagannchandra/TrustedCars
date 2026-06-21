import { useState } from 'react';
import { Upload, X } from 'lucide-react';
import toast from 'react-hot-toast';

interface PhotoUploadFormProps {
  photos: {file: File; url: string}[];
  setPhotos: React.Dispatch<React.SetStateAction<{file: File; url: string}[]>>;
}

export default function PhotoUploadForm({ photos, setPhotos }: PhotoUploadFormProps) {
  const [dragOver, setDragOver] = useState(false);

  const handlePhotoAdd = (files: FileList | null) => {
    if (!files) return;
    const fileArray = Array.from(files).filter(f => {
      if (f.size > 10 * 1024 * 1024) {
        toast.error(`File ${f.name} is too large. Max size is 10MB.`);
        return false;
      }
      return true;
    });
    const newPhotos = fileArray.map(f => ({ file: f, url: URL.createObjectURL(f) }));
    setPhotos(prev => [...prev, ...newPhotos].slice(0, 20));
  };

  return (
    <div>
      <div
        onDragOver={e => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={e => { e.preventDefault(); setDragOver(false); handlePhotoAdd(e.dataTransfer.files); }}
        onClick={() => document.getElementById('photoInput')?.click()}
        className={`border-[3px] border-dashed rounded-3xl p-10 text-center cursor-pointer transition-all mb-8 ${dragOver ? 'border-primary bg-primary/5' : 'border-slate-200 hover:border-primary/50 hover:bg-slate-50'}`}>
        <div className="w-16 h-16 bg-white border border-slate-100 shadow-sm rounded-full flex items-center justify-center mx-auto mb-4">
          <Upload className="w-8 h-8 text-primary" />
        </div>
        <p className="font-display font-bold text-xl text-slate-900 mb-2">Drop photos here or click to upload</p>
        <p className="text-sm font-medium text-slate-500">Supports JPG, PNG · Max 10MB per photo · Up to 20 photos</p>
        <input id="photoInput" type="file" accept="image/*" multiple className="hidden" onChange={e => handlePhotoAdd(e.target.files)} />
      </div>

      {/* Required Angles */}
      <div className="mb-6 bg-slate-50 p-6 rounded-2xl border border-slate-100">
        <p className="text-xs font-bold text-slate-900 uppercase tracking-wide mb-4">Required Angles for Enterprise Listing</p>
        <div className="flex flex-wrap gap-2.5">
          {['Front', 'Rear', 'Left Side', 'Right Side', 'Dashboard', 'Odometer', 'Engine'].map(angle => (
            <span key={angle} className="text-xs font-bold px-3.5 py-1.5 rounded-full border transition-all bg-white text-slate-500 border-slate-200 shadow-sm">
              ○ {angle}
            </span>
          ))}
        </div>
      </div>

      {photos.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {photos.map(({ url }, i) => (
            <div key={i} className="relative aspect-video rounded-xl overflow-hidden bg-slate-100 border border-slate-200 shadow-sm group">
              <img src={url} alt="" className="w-full h-full object-cover" />
              <button type="button" onClick={() => {
                URL.revokeObjectURL(url);
                setPhotos(p => p.filter((_, j) => j !== i));
              }}
                className="absolute top-2 right-2 w-8 h-8 bg-slate-900/80 backdrop-blur-sm rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-error">
                <X className="w-4 h-4 text-white" />
              </button>
            </div>
          ))}
        </div>
      )}

      {photos.length === 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm font-medium text-amber-800 flex items-start gap-3">
          <span className="text-xl">📸</span>
          <p>Listings with 7+ high-quality photos receive <strong>3x more enterprise inquiries</strong>. Please ensure well-lit and clear images.</p>
        </div>
      )}
    </div>
  );
}
