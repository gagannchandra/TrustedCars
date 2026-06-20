import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Car, Eye, EyeOff, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../../../shared/hooks/useAuth';
import { DEMO_CREDENTIALS } from '../../../data/mockData';

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
    const success = await login(data.email, data.password);
    if (success) {
      toast.success('Successfully logged in!');
      navigate('/');
    } else {
      setAuthError('Invalid email or password. Try demo credentials below.');
    }
  };

  const fillCredential = (cred: { email: string; password: string }) => {
    setValue('email', cred.email, { shouldValidate: true });
    setValue('password', cred.password, { shouldValidate: true });
    setAuthError('');
  };

  return (
    <div className="min-h-screen bg-surface flex">
      {/* Left Panel */}
      <div className="hidden lg:flex lg:flex-1 relative items-center justify-center p-12 overflow-hidden">
        <div className="absolute inset-0">
          <img src="https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?w=1920&q=80" alt="Login bg" className="w-full h-full object-cover opacity-30" />
          <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary/95 to-slate-900/90" />
        </div>
        
        <div className="max-w-md text-white relative z-10">
          <Link to="/" className="flex items-center gap-3 mb-12 group">
            <div className="w-10 h-10 bg-white/10 backdrop-blur-sm rounded-xl flex items-center justify-center border border-white/20 group-hover:bg-white/20 transition-all">
              <Car className="w-6 h-6 text-white" />
            </div>
            <span className="font-display font-bold text-3xl tracking-tight">TrustedCars</span>
          </Link>
          <h2 className="font-display font-bold text-5xl mb-6 leading-[1.1] tracking-tight">Enterprise Car Marketplace</h2>
          <p className="text-white/80 mb-10 text-lg leading-relaxed font-medium">Join thousands of buyers and sellers who trust TrustedCars for transparent, inspection-backed car transactions.</p>
          <div className="space-y-5">
            {['200-Point Inspection on every car', 'Free RC Transfer assistance', '6-Month Warranty option', 'Best Price Guarantee'].map(f => (
              <div key={f} className="flex items-center gap-4 text-white/90 font-medium">
                <div className="w-6 h-6 bg-success/20 rounded-full flex items-center justify-center shrink-0 border border-success/30">
                  <svg className="w-3.5 h-3.5 text-success" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                </div>
                {f}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right Panel */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-12">
        <div className="w-full max-w-md">
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
            <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-error text-sm font-medium px-4 py-3 rounded-xl mb-6">
              <AlertCircle className="w-4 h-4 shrink-0" />{authError}
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div>
              <label className="text-sm font-bold text-slate-700 block mb-2">Email address</label>
              <input type="email" {...register('email')}
                placeholder="you@example.com"
                className={`w-full border rounded-xl px-4 py-3.5 text-base outline-none transition-all shadow-sm ${errors.email ? 'border-error focus:border-error focus:ring-4 focus:ring-error/10' : 'border-slate-200 focus:border-primary focus:ring-4 focus:ring-primary/10'}`} />
              {errors.email && <p className="text-error text-xs font-bold mt-1.5">{errors.email.message}</p>}
            </div>
            <div>
              <label className="text-sm font-bold text-slate-700 block mb-2">Password</label>
              <div className="relative">
                <input type={showPass ? 'text' : 'password'} {...register('password')}
                  placeholder="Enter your password"
                  className={`w-full border rounded-xl px-4 py-3.5 pr-11 text-base outline-none transition-all shadow-sm ${errors.password ? 'border-error focus:border-error focus:ring-4 focus:ring-error/10' : 'border-slate-200 focus:border-primary focus:ring-4 focus:ring-primary/10'}`} />
                <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                  {showPass ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              {errors.password && <p className="text-error text-xs font-bold mt-1.5">{errors.password.message}</p>}
              <div className="text-right mt-2">
                <a href="#" className="text-sm font-semibold text-primary hover:text-blue-800">Forgot password?</a>
              </div>
            </div>
            <button type="submit" disabled={isSubmitting}
              className="w-full bg-primary hover:bg-blue-800 disabled:opacity-60 text-white font-bold py-4 rounded-xl transition-colors text-base shadow-md mt-4">
              {isSubmitting ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <p className="text-center text-sm font-medium text-slate-500 mt-8">
            Don't have an account? <Link to="/register" className="text-primary font-bold hover:text-blue-800">Create one</Link>
          </p>

          {/* Demo Credentials */}
          <div className="mt-10 border border-slate-200 rounded-2xl p-5 bg-white shadow-sm">
            <p className="text-xs font-bold text-slate-400 mb-4 uppercase tracking-wider">Demo Credentials — Click to fill</p>
            <div className="space-y-2.5">
              {DEMO_CREDENTIALS.map(cred => (
                <button type="button" key={cred.email} onClick={() => fillCredential(cred)}
                  className="w-full flex items-center justify-between text-left px-4 py-3 rounded-xl bg-slate-50 hover:bg-slate-100 border border-transparent hover:border-slate-200 transition-colors">
                  <div>
                    <span className={`text-[10px] font-bold px-2 py-1 rounded uppercase tracking-wide mr-3 ${cred.role === 'Admin' ? 'bg-purple-100 text-purple-700' : 'bg-primary/10 text-primary'}`}>
                      {cred.role}
                    </span>
                    <span className="text-sm font-medium text-slate-700">{cred.email}</span>
                  </div>
                  <span className="text-xs text-slate-400 font-mono font-medium">{cred.password}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
