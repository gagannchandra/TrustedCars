import { useState } from 'react';
import { Upload, X } from 'lucide-react';

interface PhotoUploadFormProps {
  previewPhotos: string[];
  setPreviewPhotos: React.Dispatch<React.SetStateAction<string[]>>;
}

export default function PhotoUploadForm({ previewPhotos, setPreviewPhotos }: PhotoUploadFormProps) {
  const [dragOver, setDragOver] = useState(false);

  const handlePhotoAdd = (files: FileList | null) => {
    if (!files) return;
    const urls = Array.from(files).map(f => URL.createObjectURL(f));
    setPreviewPhotos(prev => [...prev, ...urls].slice(0, 10));
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
        <p className="text-sm font-medium text-slate-500">Supports JPG, PNG · Max 10MB per photo · Up to 10 photos</p>
        <input id="photoInput" type="file" accept="image/*" multiple className="hidden" onChange={e => handlePhotoAdd(e.target.files)} />
      </div>

      {/* Required Angles */}
      <div className="mb-6 bg-slate-50 p-6 rounded-2xl border border-slate-100">
        <p className="text-xs font-bold text-slate-900 uppercase tracking-wide mb-4">Required Angles for Enterprise Listing</p>
        <div className="flex flex-wrap gap-2.5">
          {['Front', 'Rear', 'Left Side', 'Right Side', 'Dashboard', 'Odometer', 'Engine'].map(angle => (
            <span key={angle} className={`text-xs font-bold px-3.5 py-1.5 rounded-full border transition-all ${previewPhotos.length > 0 ? 'bg-success/10 text-success border-success/20' : 'bg-white text-slate-500 border-slate-200 shadow-sm'}`}>
              {previewPhotos.length > 0 ? '✓' : '○'} {angle}
            </span>
          ))}
        </div>
      </div>

      {previewPhotos.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {previewPhotos.map((url, i) => (
            <div key={i} className="relative aspect-video rounded-xl overflow-hidden bg-slate-100 border border-slate-200 shadow-sm group">
              <img src={url} alt="" className="w-full h-full object-cover" />
              <button onClick={() => setPreviewPhotos(p => p.filter((_, j) => j !== i))}
                className="absolute top-2 right-2 w-8 h-8 bg-slate-900/80 backdrop-blur-sm rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-error">
                <X className="w-4 h-4 text-white" />
              </button>
            </div>
          ))}
        </div>
      )}

      {previewPhotos.length === 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm font-medium text-amber-800 flex items-start gap-3">
          <span className="text-xl">📸</span>
          <p>Listings with 7+ high-quality photos receive <strong>3x more enterprise inquiries</strong>. Please ensure well-lit and clear images.</p>
        </div>
      )}
    </div>
  );
}
