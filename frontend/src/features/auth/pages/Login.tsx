import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Car, Eye, EyeOff, AlertCircle, ShieldCheck, CheckCircle2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../../../shared/hooks/useAuth';

const loginSchema = z.object({
  email: z.string().min(1, 'Email is required').email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [showPass, setShowPass] = useState(false);
  const [authError, setAuthError] = useState('');
  
  const { register, handleSubmit, setValue, formState: { errors, isSubmitting } } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' }
  });

  const onSubmit = async (data: LoginFormValues) => {
    setAuthError('');
    const result = await login(data.email, data.password);
    if (result.success) {
      // Check if OTP is disabled (tokens returned directly)
      if ((result as any).otpDisabled) {
        toast.success('Login successful!');
        navigate('/');
      } else {
        // OTP is enabled, go to verification page
        toast.success(result.message || 'OTP sent to email!');
        navigate('/verify-otp', { state: { email: data.email, intent: 'login' } });
      }
    } else {
      setAuthError(result.message || 'Invalid email or password. Try demo credentials below.');
    }
  };

  const fillCredential = (cred: { email: string; password: string }) => {
    setValue('email', cred.email, { shouldValidate: true });
    setValue('password', cred.password, { shouldValidate: true });
    setAuthError('');
  };

  return (
    <div className="min-h-screen bg-surface flex">
      {/* Left Panel - Branding */}
      <div className="hidden lg:flex lg:flex-1 relative items-center justify-center p-12 overflow-hidden bg-slate-900">
        <div className="absolute inset-0">
          <img src="https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?w=1920&q=80" alt="Login bg" className="w-full h-full object-cover opacity-40" />
          <div className="absolute inset-0 bg-gradient-to-tr from-slate-900 via-slate-900/95 to-primary/80" />
        </div>
        
        <div className="max-w-lg text-white relative z-10 w-full">
          <Link to="/" className="flex items-center gap-3 mb-16 group inline-flex">
            <div className="w-12 h-12 bg-white/10 backdrop-blur-sm rounded-xl flex items-center justify-center border border-white/20 group-hover:bg-white/20 group-hover:scale-105 transition-all duration-300">
              <Car className="w-7 h-7 text-white" />
            </div>
            <span className="font-display font-bold text-3xl tracking-tight">TrustedCars</span>
          </Link>
          
          <h2 className="font-display font-bold text-5xl mb-6 leading-[1.15] tracking-tight">Enterprise Car Marketplace</h2>
          <p className="text-white/80 mb-12 text-lg leading-relaxed font-medium max-w-md">Join thousands of buyers and sellers who trust TrustedCars for transparent, inspection-backed car transactions.</p>
          
          <div className="space-y-6">
            {[
              { title: '200-Point Inspection', desc: 'Every vehicle meets enterprise standards' },
              { title: 'Verified Sellers', desc: 'A curated network of trusted individuals and dealers' },
              { title: 'RC Transfer Support', desc: 'End-to-end paperwork assistance' },
              { title: 'Secure Transactions', desc: 'Bank-grade security on all payments' }
            ].map(f => (
              <div key={f.title} className="flex items-start gap-4 group">
                <div className="w-8 h-8 bg-white/10 backdrop-blur-md rounded-full flex items-center justify-center shrink-0 border border-white/20 mt-1 group-hover:bg-primary/40 group-hover:border-primary/60 transition-all duration-300">
                  <CheckCircle2 className="w-4 h-4 text-white" />
                </div>
                <div>
                  <h4 className="text-white font-bold text-base mb-0.5">{f.title}</h4>
                  <p className="text-white/70 text-sm font-medium">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
          
          <div className="mt-16 pt-8 border-t border-white/10 flex items-center gap-4">
             <div className="flex -space-x-3">
                {[1, 2, 3].map(i => (
                  <div key={i} className="w-10 h-10 rounded-full border-2 border-slate-900 bg-slate-800 flex items-center justify-center overflow-hidden">
                    <img src={`https://i.pravatar.cc/100?img=${i + 10}`} alt="User" className="w-full h-full object-cover opacity-80" />
                  </div>
                ))}
             </div>
             <p className="text-sm font-medium text-white/80">
               Trusted by <span className="text-white font-bold">10,000+</span> premium users
             </p>
          </div>
        </div>
      </div>

      {/* Right Panel - Form */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-12 overflow-y-auto">
        <div className="w-full max-w-md py-8">
          {/* Mobile Logo */}
          <div className="lg:hidden flex items-center gap-2 mb-8">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <Car className="w-5 h-5 text-white" />
            </div>
            <span className="font-display font-bold text-xl text-slate-900 tracking-tight">TrustedCars</span>
          </div>

          <h1 className="font-display font-bold text-4xl text-slate-900 mb-2 tracking-tight">Welcome back</h1>
          <p className="text-slate-500 mb-10 text-base font-medium">Sign in to your TrustedCars account</p>

          {authError && (
            <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-error text-sm font-medium px-4 py-3 rounded-xl mb-6 animate-in fade-in slide-in-from-top-2">
              <AlertCircle className="w-4 h-4 shrink-0" />{authError}
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div>
              <label className="text-sm font-bold text-slate-700 block mb-2">Email address</label>
              <input type="email" {...register('email')}
                placeholder="you@example.com"
                className={`w-full border rounded-xl px-4 py-3.5 text-base outline-none transition-all shadow-sm ${errors.email ? 'border-error focus:border-error focus:ring-4 focus:ring-error/10 hover:border-error' : 'border-slate-200 focus:border-primary focus:ring-4 focus:ring-primary/20 hover:border-slate-300'}`} />
              {errors.email && <p className="text-error text-xs font-bold mt-1.5 animate-in slide-in-from-top-1">{errors.email.message}</p>}
            </div>
            <div>
              <label className="text-sm font-bold text-slate-700 block mb-2">Password</label>
              <div className="relative">
                <input type={showPass ? 'text' : 'password'} {...register('password')}
                  placeholder="Enter your password"
                  className={`w-full border rounded-xl px-4 py-3.5 pr-11 text-base outline-none transition-all shadow-sm ${errors.password ? 'border-error focus:border-error focus:ring-4 focus:ring-error/10 hover:border-error' : 'border-slate-200 focus:border-primary focus:ring-4 focus:ring-primary/20 hover:border-slate-300'}`} />
                <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors focus:outline-none focus:text-primary">
                  {showPass ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              {errors.password && <p className="text-error text-xs font-bold mt-1.5 animate-in slide-in-from-top-1">{errors.password.message}</p>}
              <div className="text-right mt-3">
                <Link to="/forgot-password" className="text-sm font-bold text-primary hover:text-blue-800 transition-colors focus:outline-none focus:underline">Forgot password?</Link>
              </div>
            </div>
            <button type="submit" disabled={isSubmitting}
              className="w-full bg-primary hover:bg-blue-800 disabled:opacity-60 text-white font-bold py-4 rounded-xl transition-all shadow-md hover:shadow-lg text-base mt-4 transform hover:-translate-y-0.5 active:translate-y-0 duration-200 focus:outline-none focus:ring-4 focus:ring-primary/30">
              {isSubmitting ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <div className="mt-8 pt-8 border-t border-slate-100 flex flex-col items-center">
            <p className="text-center text-sm font-medium text-slate-500 mb-4">
              Don't have an account? <Link to="/register" className="text-primary font-bold hover:text-blue-800 transition-colors focus:outline-none focus:underline">Create one</Link>
            </p>
            <div className="flex items-center gap-1.5 text-xs font-medium text-slate-400">
              <ShieldCheck className="w-4 h-4 text-success" />
              Your data is secure and encrypted.
            </div>
          </div>

          {/* Demo Credentials */}
          {import.meta.env.DEV && (
            <div className="mt-10 border-2 border-slate-100 rounded-2xl p-5 bg-slate-50/50 shadow-sm relative overflow-hidden group">
              <div className="absolute top-0 left-0 w-1 h-full bg-primary/20 group-hover:bg-primary/40 transition-colors"></div>
              <p className="text-xs font-bold text-slate-400 mb-4 uppercase tracking-wider">Demo Credentials — Click to fill</p>
              <div className="space-y-2.5">
                {[
                  { role: 'Admin', email: 'admin@trustedcars.in', password: 'Admin@123' },
                  { role: 'Dealer', email: 'dealer@trustedcars.in', password: 'Dealer@123' },
                  { role: 'Standard User', email: 'rahul.sharma@gmail.com', password: 'User@123' },
                  { role: 'Standard User', email: 'sneha.kapoor@gmail.com', password: 'User@123' },
                ].map(cred => (
                  <button type="button" key={cred.email} onClick={() => fillCredential(cred)}
                    className="w-full flex items-center justify-between text-left px-4 py-3 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 hover:border-primary/40 hover:shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-primary/20 group/btn">
                    <div>
                      <span className={`text-[10px] font-bold px-2 py-1 rounded uppercase tracking-wide mr-3 transition-colors ${cred.role === 'Admin' ? 'bg-purple-100 text-purple-700 group-hover/btn:bg-purple-200' : cred.role === 'Dealer' ? 'bg-amber-100 text-amber-700 group-hover/btn:bg-amber-200' : 'bg-primary/10 text-primary group-hover/btn:bg-primary/20'}`}>
                        {cred.role}
                      </span>
                      <span className="text-sm font-medium text-slate-700 group-hover/btn:text-slate-900 transition-colors">{cred.email}</span>
                    </div>
                    <span className="text-xs text-slate-400 font-mono font-medium group-hover/btn:text-slate-600 transition-colors">{cred.password}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
