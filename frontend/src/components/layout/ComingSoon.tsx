import { Link, useNavigate } from 'react-router-dom';
import { Car, Wrench, ArrowLeft } from 'lucide-react';

export default function ComingSoon() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-surface flex flex-col items-center justify-center p-4">
      <div className="text-center max-w-lg mx-auto bg-white p-8 sm:p-12 rounded-[24px] sm:rounded-[32px] shadow-[0_8px_30px_rgb(0,0,0,0.06)] border border-slate-100">
        <div className="w-20 h-20 sm:w-24 sm:h-24 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6 sm:mb-8 border border-primary/20 relative">
          <Car className="w-10 h-10 sm:w-12 sm:h-12 text-primary" />
          <div className="absolute -bottom-2 -right-2 w-8 h-8 sm:w-10 sm:h-10 bg-white rounded-full flex items-center justify-center shadow-sm border border-slate-100">
            <Wrench className="w-4 h-4 sm:w-5 sm:h-5 text-amber-500" />
          </div>
        </div>
        <h1 className="font-display font-bold text-3xl sm:text-4xl text-slate-900 mb-4 tracking-tight">Coming Soon</h1>
        <p className="text-slate-500 font-medium text-base sm:text-lg mb-8 leading-relaxed">
          We're currently building something amazing for this section. Our enterprise engineers are working hard to bring this feature to you shortly.
        </p>
        <div className="flex flex-col-reverse sm:flex-row items-center justify-center gap-3 sm:gap-4">
          <button 
            onClick={() => navigate(-1)} 
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-3.5 bg-slate-50 hover:bg-slate-100 text-slate-700 font-bold rounded-xl sm:rounded-full transition-colors border border-slate-200"
          >
            <ArrowLeft className="w-4 h-4" /> Go Back
          </button>
          <Link 
            to="/" 
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-3.5 bg-primary hover:bg-blue-800 text-white font-bold rounded-xl sm:rounded-full transition-colors shadow-lg shadow-primary/20"
          >
            Return Home
          </Link>
        </div>
      </div>
    </div>
  );
}
