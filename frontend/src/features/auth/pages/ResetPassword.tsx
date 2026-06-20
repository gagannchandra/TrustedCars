import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ShieldCheck, AlertCircle, Eye, EyeOff } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../../../shared/hooks/useAuth';

const resetSchema = z.object({
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type ResetFormValues = z.infer<typeof resetSchema>;

export default function ResetPassword() {
  const location = useLocation();
  const navigate = useNavigate();
  const { resetPassword } = useAuth();
  
  const resetToken = location.state?.resetToken;

  const [showPass, setShowPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);
  const [authError, setAuthError] = useState('');

  useEffect(() => {
    if (!resetToken) {
      navigate('/forgot-password');
    }
  }, [resetToken, navigate]);

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<ResetFormValues>({
    resolver: zodResolver(resetSchema),
    defaultValues: { password: '', confirmPassword: '' }
  });

  const onSubmit = async (data: ResetFormValues) => {
    setAuthError('');
    const result = await resetPassword(resetToken, data.password);
    if (result.success) {
      toast.success(result.message || 'Password reset successfully!');
      navigate('/login');
    } else {
      setAuthError(result.message || 'Failed to reset password.');
    }
  };

  if (!resetToken) return null;

  return (
    <div className="min-h-screen bg-surface flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-md bg-white p-8 sm:p-10 rounded-3xl shadow-xl border border-slate-100 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary to-blue-400"></div>
        
        <div className="flex justify-center mb-6 mt-4">
          <div className="w-14 h-14 bg-success/10 text-success rounded-2xl flex items-center justify-center border border-success/20">
            <ShieldCheck className="w-7 h-7" />
          </div>
        </div>

        <h2 className="text-3xl font-display font-bold text-center text-slate-900 mb-3 tracking-tight">
          Set New Password
        </h2>
        <p className="text-center text-slate-500 font-medium mb-8 leading-relaxed">
          Create a new, strong password for your account.
        </p>

        {authError && (
          <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-error text-sm font-medium px-4 py-3 rounded-xl mb-6">
            <AlertCircle className="w-4 h-4 shrink-0" />
            {authError}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div>
            <label className="text-sm font-bold text-slate-700 block mb-2">New Password</label>
            <div className="relative">
              <input type={showPass ? 'text' : 'password'} {...register('password')}
                placeholder="Enter new password"
                className={`w-full border rounded-xl px-4 py-3.5 pr-11 text-base outline-none transition-all shadow-sm ${errors.password ? 'border-error focus:border-error focus:ring-4 focus:ring-error/10 hover:border-error' : 'border-slate-200 focus:border-primary focus:ring-4 focus:ring-primary/20 hover:border-slate-300'}`} />
              <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors focus:outline-none focus:text-primary">
                {showPass ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
            {errors.password && <p className="text-error text-xs font-bold mt-1.5">{errors.password.message}</p>}
          </div>

          <div>
            <label className="text-sm font-bold text-slate-700 block mb-2">Confirm Password</label>
            <div className="relative">
              <input type={showConfirmPass ? 'text' : 'password'} {...register('confirmPassword')}
                placeholder="Confirm new password"
                className={`w-full border rounded-xl px-4 py-3.5 pr-11 text-base outline-none transition-all shadow-sm ${errors.confirmPassword ? 'border-error focus:border-error focus:ring-4 focus:ring-error/10 hover:border-error' : 'border-slate-200 focus:border-primary focus:ring-4 focus:ring-primary/20 hover:border-slate-300'}`} />
              <button type="button" onClick={() => setShowConfirmPass(!showConfirmPass)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors focus:outline-none focus:text-primary">
                {showConfirmPass ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
            {errors.confirmPassword && <p className="text-error text-xs font-bold mt-1.5">{errors.confirmPassword.message}</p>}
          </div>

          <button type="submit" disabled={isSubmitting}
            className="w-full bg-primary hover:bg-blue-800 disabled:opacity-60 text-white font-bold py-4 rounded-xl transition-all shadow-md hover:shadow-lg text-base transform hover:-translate-y-0.5 active:translate-y-0 duration-200 focus:outline-none focus:ring-4 focus:ring-primary/30">
            {isSubmitting ? 'Updating...' : 'Reset Password'}
          </button>
        </form>

      </div>
    </div>
  );
}
