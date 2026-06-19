import { useState } from 'react';
import { X } from 'lucide-react';
import { formatPrice, calculateEMI } from '../../../shared/utils/utils';

interface EMIModalProps {
  price: number;
  onClose: () => void;
}

export default function EMIModal({ price, onClose }: EMIModalProps) {
  const [dp, setDp] = useState(Math.round(price * 0.2));
  const [rate, setRate] = useState(9.5);
  const [tenure, setTenure] = useState(60);
  const loan = price - dp;
  const emi = loan > 0 ? calculateEMI(loan, rate, tenure) : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-3xl max-w-sm w-full shadow-2xl border border-slate-100">
        <div className="flex items-center justify-between p-6 border-b border-slate-100">
          <h3 className="font-display font-bold text-xl text-slate-900 tracking-tight">EMI Calculator</h3>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors"><X className="w-5 h-5 text-slate-400" /></button>
        </div>
        <div className="p-6 space-y-5">
          <div className="mb-2">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 block">Vehicle Price</label>
            <div className="font-display font-bold text-3xl text-slate-900 tracking-tight">{formatPrice(price)}</div>
          </div>
          <div>
            <label className="text-sm font-bold text-slate-700 mb-2 flex justify-between">
              <span>Down Payment</span><span className="text-primary">{formatPrice(dp)}</span>
            </label>
            <input type="range" min={Math.round(price * 0.1)} max={Math.round(price * 0.7)} step={10000} value={dp} onChange={e => setDp(Number(e.target.value))}
              className="w-full accent-primary h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer" />
          </div>
          <div>
            <label className="text-sm font-bold text-slate-700 mb-2 flex justify-between">
              <span>Interest Rate</span><span className="text-primary">{rate}% p.a.</span>
            </label>
            <input type="range" min={7} max={18} step={0.5} value={rate} onChange={e => setRate(Number(e.target.value))}
              className="w-full accent-primary h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer" />
          </div>
          <div>
            <label className="text-sm font-bold text-slate-700 mb-2 flex justify-between">
              <span>Loan Tenure</span><span className="text-primary">{tenure} months</span>
            </label>
            <input type="range" min={12} max={84} step={12} value={tenure} onChange={e => setTenure(Number(e.target.value))}
              className="w-full accent-primary h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer" />
          </div>
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 shadow-[inset_0_2px_4px_rgba(0,0,0,0.02)] mt-6">
            <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Estimated Monthly EMI</div>
            <div className="font-display font-bold text-4xl text-primary tracking-tight">{formatPrice(emi)}</div>
            <div className="text-xs font-medium text-slate-500 mt-2">Loan Amount: {formatPrice(loan)} for {tenure} months</div>
          </div>
          <button className="w-full bg-primary text-white py-4 rounded-xl font-bold text-base hover:bg-blue-800 shadow-md transition-colors mt-2">
            Apply for Loan Pre-Approval
          </button>
        </div>
      </div>
    </div>
  );
}
