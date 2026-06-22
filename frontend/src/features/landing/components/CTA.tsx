import { useNavigate } from 'react-router-dom';

export default function CTA() {
  const navigate = useNavigate();

  return (
    <section className="py-24 bg-white">
      <div className="max-w-5xl mx-auto px-4 text-center">
        <h2 className="font-display font-bold text-4xl sm:text-5xl text-slate-900 mb-4 sm:mb-6 tracking-tight">Experience Automotive Excellence</h2>
        <p className="text-slate-500 mb-8 sm:mb-10 text-lg sm:text-xl font-medium max-w-2xl mx-auto">Join the premium network of buyers and sellers transforming the used car market.</p>
        <div className="flex flex-col sm:flex-row gap-4 sm:gap-5 justify-center">
          <button onClick={() => navigate('/cars')} className="w-full sm:w-auto bg-primary text-white font-semibold px-8 sm:px-10 py-4 rounded-xl sm:rounded-full hover:bg-blue-800 transition-colors shadow-lg shadow-primary/30 text-lg">
            Explore Inventory
          </button>
          <button onClick={() => navigate('/sell')} className="w-full sm:w-auto bg-white border-2 border-slate-200 text-slate-700 font-semibold px-8 sm:px-10 py-4 rounded-xl sm:rounded-full hover:border-slate-300 hover:bg-slate-50 transition-all text-lg shadow-sm">
            Sell Your Vehicle
          </button>
        </div>
      </div>
    </section>
  );
}
