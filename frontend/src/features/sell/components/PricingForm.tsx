import { CheckCircle } from 'lucide-react';
import { useFormContext } from 'react-hook-form';

export default function PricingForm() {
  const { register, watch, formState: { errors } } = useFormContext();
  const price = watch('price');

  return (
    <div className="space-y-8">
      <div>
        <label className="text-xs font-bold text-slate-700 uppercase tracking-wide block mb-2">Expected Price (₹) *</label>
        <div className="relative">
          <span className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xl">₹</span>
          <input type="number" placeholder="e.g. 550000" {...register('price')}
            className={`w-full border rounded-xl pl-10 pr-5 py-4 text-xl font-bold outline-none transition-all font-display ${errors.price ? 'border-error focus:border-error focus:ring-4 focus:ring-error/10 bg-error/5 text-error' : 'border-slate-200 bg-slate-50 focus:bg-white text-slate-900 focus:border-primary focus:ring-4 focus:ring-primary/10'}`} />
        </div>
        {errors.price && <p className="text-error text-xs font-bold mt-1.5">{errors.price.message as string}</p>}
        {price && !errors.price && (
          <div className="mt-4 p-5 bg-success/10 border border-success/20 rounded-2xl text-sm font-medium text-success flex items-start gap-3">
            <CheckCircle className="w-5 h-5 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold block mb-1">Market Acceptable Range</span> 
              The suggested retail price for this model is between <strong>₹{(Number(price) * 0.9).toLocaleString('en-IN')}</strong> and <strong>₹{(Number(price) * 1.1).toLocaleString('en-IN')}</strong>.
            </div>
          </div>
        )}
      </div>
      <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100">
        <label className="flex items-center gap-4 cursor-pointer">
          <input type="checkbox" {...register('negotiable')} className="w-5 h-5 rounded border-slate-300 accent-primary" />
          <span className="text-base font-bold text-slate-900">Price is Negotiable</span>
        </label>
      </div>
      <div>
        <p className="text-xs font-bold text-slate-900 uppercase tracking-wide mb-4">Value-Adding Documents</p>
        <div className="space-y-3">
          {[
            { key: 'hasService', label: 'Authorized Service Center History' },
            { key: 'hasInvoice', label: 'Original Purchase Invoice' },
            { key: 'hasInsurance', label: 'Valid Comprehensive Insurance' },
          ].map(doc => (
            <label key={doc.key} className="flex items-center gap-4 cursor-pointer p-4 rounded-xl border border-slate-200 hover:bg-slate-50 hover:border-slate-300 transition-colors bg-white">
              <input type="checkbox" {...register(doc.key)} className="w-5 h-5 rounded border-slate-300 accent-primary" />
              <span className="text-sm font-bold text-slate-700">{doc.label}</span>
            </label>
          ))}
        </div>
      </div>
    </div>
  );
}
