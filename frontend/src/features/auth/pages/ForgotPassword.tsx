import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Car, AlertCircle, ArrowLeft } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../../../shared/hooks/useAuth';

const forgotSchema = z.object({
  email: z.string().min(1, 'Email is required').email('Invalid email address'),
});

type ForgotFormValues = z.infer<typeof forgotSchema>;

export default function ForgotPassword() {
  const navigate = useNavigate();
  const { forgotPassword } = useAuth();
  const [authError, setAuthError] = useState('');
  
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<ForgotFormValues>({
    resolver: zodResolver(forgotSchema),
    defaultValues: { email: '' }
  });

  const onSubmit = async (data: ForgotFormValues) => {
    setAuthError('');
    const result = await forgotPassword(data.email);
    if (result.success) {
      toast.success(result.message || 'Reset code sent to email!');
      navigate('/verify-reset-password', { state: { email: data.email } });
    } else {
      setAuthError(result.message || 'Failed to request reset.');
    }
  };

  return (
    <div className="min-h-screen bg-surface flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-md bg-white p-8 sm:p-10 rounded-3xl shadow-xl border border-slate-100 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary to-blue-400"></div>
        
        <Link to="/login" className="absolute top-6 left-6 text-slate-400 hover:text-slate-600 transition-colors">
          <ArrowLeft className="w-6 h-6" />
        </Link>

        <div className="flex justify-center mb-6 mt-4">
          <div className="w-14 h-14 bg-blue-50 text-primary rounded-2xl flex items-center justify-center border border-blue-100">
            <Car className="w-7 h-7" />
          </div>
        </div>

        <h2 className="text-3xl font-display font-bold text-center text-slate-900 mb-3 tracking-tight">
          Forgot Password
        </h2>
        <p className="text-center text-slate-500 font-medium mb-8 leading-relaxed">
          Enter your email address and we'll send you a 6-digit code to reset your password.
        </p>

        {authError && (
          <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-error text-sm font-medium px-4 py-3 rounded-xl mb-6">
            <AlertCircle className="w-4 h-4 shrink-0" />
            {authError}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div>
            <label className="text-sm font-bold text-slate-700 block mb-2">Email address</label>
            <input type="email" {...register('email')}
              placeholder="you@example.com"
              className={`w-full border rounded-xl px-4 py-3.5 text-base outline-none transition-all shadow-sm ${errors.email ? 'border-error focus:border-error focus:ring-4 focus:ring-error/10 hover:border-error' : 'border-slate-200 focus:border-primary focus:ring-4 focus:ring-primary/20 hover:border-slate-300'}`} />
            {errors.email && <p className="text-error text-xs font-bold mt-1.5">{errors.email.message}</p>}
          </div>

          <button type="submit" disabled={isSubmitting}
            className="w-full bg-primary hover:bg-blue-800 disabled:opacity-60 text-white font-bold py-4 rounded-xl transition-all shadow-md hover:shadow-lg text-base transform hover:-translate-y-0.5 active:translate-y-0 duration-200 focus:outline-none focus:ring-4 focus:ring-primary/30">
            {isSubmitting ? 'Sending...' : 'Send Reset Code'}
          </button>
        </form>

      </div>
    </div>
  );
}
