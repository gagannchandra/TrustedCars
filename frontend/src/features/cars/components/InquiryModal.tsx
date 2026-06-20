import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, CheckCircle, X } from 'lucide-react';
import { useAuth } from '../../../shared/hooks/useAuth';
import { Car } from '../../../types';
import { inquiriesApi } from '../../../shared/api/client';
import toast from 'react-hot-toast';
import { formatPrice } from '../../../shared/utils/utils';

interface InquiryModalProps {
  car: Car;
  onClose: () => void;
}

export default function InquiryModal({ car, onClose }: InquiryModalProps) {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: user?.full_name || '', phone: user?.phone || '', message: `Hi, I'm interested in the ${car.year} ${car.make} ${car.model}. Is it still available?`, date: '' });
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    try {
      setLoading(true);
      await inquiriesApi.createInquiry({
        car_id: car.id,
        message: form.message
      });
      setSent(true);
    } catch (error) {
      toast.error('Failed to send inquiry. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
        <div className="bg-white rounded-3xl p-10 max-w-sm w-full text-center shadow-2xl">
          <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <Shield className="w-8 h-8 text-primary" />
          </div>
          <h3 className="font-display font-bold text-2xl mb-3 tracking-tight text-slate-900">Sign In Required</h3>
          <p className="text-slate-500 font-medium text-sm mb-8">Please sign in to send an inquiry directly to our certified sellers.</p>
          <button onClick={() => { onClose(); navigate('/login'); }} className="w-full bg-primary text-white py-4 rounded-xl font-bold hover:bg-blue-800 transition-colors shadow-md">Sign In</button>
          <button onClick={onClose} className="w-full mt-4 text-sm font-bold text-slate-400 hover:text-slate-600 transition-colors">Cancel</button>
        </div>
      </div>
    );
  }

  if (sent) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
        <div className="bg-white rounded-3xl p-10 max-w-sm w-full text-center shadow-2xl">
          <div className="w-20 h-20 bg-success/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-10 h-10 text-success" />
          </div>
          <h3 className="font-display font-bold text-2xl mb-3 text-slate-900 tracking-tight">Inquiry Sent!</h3>
          <p className="text-slate-500 font-medium text-sm mb-8">The seller has been notified via our enterprise channel. They'll respond within 24 hours.</p>
          <button onClick={onClose} className="w-full bg-primary text-white py-4 rounded-xl font-bold hover:bg-blue-800 shadow-md">Done</button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-3xl max-w-md w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-100">
        <div className="flex items-center justify-between p-6 border-b border-slate-100">
          <h3 className="font-display font-bold text-xl text-slate-900 tracking-tight">Send Inquiry</h3>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors"><X className="w-5 h-5 text-slate-400" /></button>
        </div>
        <div className="p-6 space-y-5">
          <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 text-sm shadow-[inset_0_2px_4px_rgba(0,0,0,0.02)]">
            <span className="font-bold text-slate-900">{car.year} {car.make} {car.model}</span> · <span className="font-medium text-primary">{formatPrice(car.asking_price)}</span>
          </div>
          <div>
            <label className="text-xs font-bold text-slate-700 block mb-2">Your Name</label>
            <input placeholder="Your Name" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              className="w-full border border-slate-200 rounded-xl px-4 py-3.5 text-sm font-medium outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all bg-slate-50 focus:bg-white" />
          </div>
          <div>
            <label className="text-xs font-bold text-slate-700 block mb-2">Your Phone</label>
            <input placeholder="Your Phone" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
              className="w-full border border-slate-200 rounded-xl px-4 py-3.5 text-sm font-medium outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all bg-slate-50 focus:bg-white" />
          </div>
          <div>
            <label className="text-xs font-bold text-slate-700 block mb-2">Message</label>
            <textarea rows={3} placeholder="Your message..." value={form.message} onChange={e => setForm(f => ({ ...f, message: e.target.value }))}
              className="w-full border border-slate-200 rounded-xl px-4 py-3.5 text-sm font-medium outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all bg-slate-50 focus:bg-white resize-none" />
          </div>
          <div>
            <label className="text-xs font-bold text-slate-700 block mb-2">Preferred Visit Date</label>
            <input type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
              className="w-full border border-slate-200 rounded-xl px-4 py-3.5 text-sm font-medium outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all bg-slate-50 focus:bg-white" />
          </div>
          <button onClick={handleSubmit} disabled={loading} className="w-full bg-primary hover:bg-blue-800 text-white py-4 rounded-xl font-bold text-base transition-colors shadow-md mt-2 disabled:opacity-50">
            {loading ? 'Sending...' : 'Submit Inquiry'}
          </button>
        </div>
      </div>
    </div>
  );
}
