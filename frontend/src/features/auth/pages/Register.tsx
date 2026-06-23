import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Car, Eye, EyeOff, AlertCircle, User, Building2, ShieldCheck, CheckCircle2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../../../shared/hooks/useAuth';

const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

const registerSchema = z.object({
  full_name: z.string().min(2, 'Full Name must be at least 2 characters'),
  email: z.string().min(1, 'Email is required').email('Invalid email address'),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(passwordRegex, 'Password must contain at least 1 uppercase, 1 lowercase, 1 number, and 1 special character'),
  confirm_password: z.string().min(1, 'Please confirm your password'),
  role: z.enum(['user', 'dealer']),
  dealership_name: z.string().optional(),
  dealership_address: z.string().optional(),
}).refine((data) => data.password === data.confirm_password, {
  message: "Passwords don't match",
  path: ["confirm_password"],
}).refine((data) => {
  if (data.role === 'dealer') {
    return data.dealership_name && data.dealership_name.length >= 2;
  }
  return true;
}, {
  message: "Dealership name is required and must be at least 2 characters",
  path: ["dealership_name"],
}).refine((data) => {
  if (data.role === 'dealer') {
    return data.dealership_address && data.dealership_address.length >= 5;
  }
  return true;
}, {
  message: "Dealership address is required and must be at least 5 characters",
  path: ["dealership_address"],
});

type RegisterFormValues = z.infer<typeof registerSchema>;

export default function Register() {
  const navigate = useNavigate();
  const { register: authRegister } = useAuth();
  const [showPass, setShowPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);
  const [authError, setAuthError] = useState('');
  const [selectedRole, setSelectedRole] = useState<'user' | 'dealer'>('user');
  
  const { register, handleSubmit, setValue, watch, formState: { errors, isSubmitting } } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: { full_name: '', email: '', password: '', confirm_password: '', role: 'user', dealership_name: '', dealership_address: '' }
  });

  const watchedRole = watch('role');

  const onSubmit = async (data: RegisterFormValues) => {
    setAuthError('');
    const { confirm_password, ...submitData } = data;
    const result = await authRegister(submitData as any);
    if (result.success) {
      // Check if OTP is disabled (tokens returned directly)
      if ((result as any).otpDisabled) {
        toast.success('Account created successfully!');
        navigate('/');
      } else {
        // OTP is enabled, go to verification page
        toast.success('Account created! Please verify your email.');
        navigate('/verify-otp', { state: { email: data.email, intent: 'register' } });
      }
    } else {
      setAuthError(result.message || 'Registration failed. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-surface flex">
      
      {/* Left Panel - Branding */}
      <div className="hidden lg:flex lg:flex-1 relative items-center justify-center p-12 overflow-hidden bg-slate-900">
        <div className="absolute inset-0">
          <img src="https://images.unsplash.com/photo-1560958089-b8a1929cea89?w=1920&q=80" alt="Register bg" className="w-full h-full object-cover opacity-40" />
          <div className="absolute inset-0 bg-gradient-to-tr from-slate-900 via-slate-900/95 to-primary/80" />
        </div>
        
        <div className="max-w-lg text-white relative z-10 w-full">
          <Link to="/" className="flex items-center gap-3 mb-16 group inline-flex">
            <div className="w-12 h-12 bg-white/10 backdrop-blur-sm rounded-xl flex items-center justify-center border border-white/20 group-hover:bg-white/20 group-hover:scale-105 transition-all duration-300">
              <Car className="w-7 h-7 text-white" />
            </div>
            <span className="font-display font-bold text-3xl tracking-tight">TrustedCars</span>
          </Link>
          
          <h2 className="font-display font-bold text-5xl mb-6 leading-[1.15] tracking-tight">Your premium automotive journey starts here.</h2>
          <p className="text-white/80 mb-12 text-lg leading-relaxed font-medium max-w-md">Join the most trusted enterprise marketplace for verified, high-quality vehicles. Designed for transparency and scale.</p>
          
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

          <h1 className="font-display font-bold text-4xl text-slate-900 mb-2 tracking-tight">Create an account</h1>
          <p className="text-slate-500 mb-10 text-base font-medium">Join the enterprise marketplace — it's free</p>

          {authError && (
            <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-error text-sm font-medium px-4 py-3 rounded-xl mb-6 animate-in fade-in slide-in-from-top-2">
              <AlertCircle className="w-4 h-4 shrink-0" />{authError}
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            
            {/* Account Type Cards */}
            <div>
              <label className="text-sm font-bold text-slate-700 block mb-3">Account Type</label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => { setSelectedRole('user'); setValue('role', 'user', { shouldValidate: true }); }}
                  className={`relative flex flex-col items-start p-4 rounded-2xl border-2 text-left transition-all duration-200 focus:outline-none focus:ring-4 focus:ring-primary/20 ${selectedRole === 'user' ? 'border-primary bg-primary/5 shadow-md shadow-primary/10' : 'border-slate-200 hover:border-primary/40 hover:bg-slate-50 bg-white'}`}
                >
                  {selectedRole === 'user' && <div className="absolute top-3 right-3 text-primary animate-in zoom-in"><CheckCircle2 className="w-5 h-5" /></div>}
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center mb-3 transition-colors ${selectedRole === 'user' ? 'bg-primary text-white' : 'bg-slate-100 text-slate-500'}`}>
                    <User className="w-5 h-5" />
                  </div>
                  <h3 className={`font-bold text-base mb-1 ${selectedRole === 'user' ? 'text-primary' : 'text-slate-900'}`}>Standard User</h3>
                  <p className="text-xs text-slate-500 font-medium line-clamp-2">Browse, buy, and list personal cars</p>
                </button>

                <button
                  type="button"
                  onClick={() => { setSelectedRole('dealer'); setValue('role', 'dealer', { shouldValidate: true }); }}
                  className={`relative flex flex-col items-start p-4 rounded-2xl border-2 text-left transition-all duration-200 focus:outline-none focus:ring-4 focus:ring-primary/20 ${selectedRole === 'dealer' ? 'border-primary bg-primary/5 shadow-md shadow-primary/10' : 'border-slate-200 hover:border-primary/40 hover:bg-slate-50 bg-white'}`}
                >
                  {selectedRole === 'dealer' && <div className="absolute top-3 right-3 text-primary animate-in zoom-in"><CheckCircle2 className="w-5 h-5" /></div>}
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center mb-3 transition-colors ${selectedRole === 'dealer' ? 'bg-primary text-white' : 'bg-slate-100 text-slate-500'}`}>
                    <Building2 className="w-5 h-5" />
                  </div>
                  <h3 className={`font-bold text-base mb-1 ${selectedRole === 'dealer' ? 'text-primary' : 'text-slate-900'}`}>Enterprise Dealer</h3>
                  <p className="text-xs text-slate-500 font-medium line-clamp-2">Dealership management & inventory</p>
                </button>
              </div>
              <input type="hidden" {...register('role')} />
            </div>

            <div>
              <label className="text-sm font-bold text-slate-700 block mb-2">Full Name</label>
              <input type="text" {...register('full_name')}
                placeholder="Gagan Chandra"
                className={`w-full border rounded-xl px-4 py-3.5 text-base outline-none transition-all shadow-sm ${errors.full_name ? 'border-error focus:border-error focus:ring-4 focus:ring-error/10' : 'border-slate-200 focus:border-primary focus:ring-4 focus:ring-primary/10 hover:border-slate-300'}`} />
              {errors.full_name && <p className="text-error text-xs font-bold mt-1.5 animate-in slide-in-from-top-1">{errors.full_name.message}</p>}
            </div>
            <div>
              <label className="text-sm font-bold text-slate-700 block mb-2">Email address</label>
              <input type="email" {...register('email')}
                placeholder="you@example.com"
                className={`w-full border rounded-xl px-4 py-3.5 text-base outline-none transition-all shadow-sm ${errors.email ? 'border-error focus:border-error focus:ring-4 focus:ring-error/10' : 'border-slate-200 focus:border-primary focus:ring-4 focus:ring-primary/10 hover:border-slate-300'}`} />
              {errors.email && <p className="text-error text-xs font-bold mt-1.5 animate-in slide-in-from-top-1">{errors.email.message}</p>}
            </div>
            <div>
              <label className="text-sm font-bold text-slate-700 block mb-2">Password</label>
              <div className="relative">
                <input type={showPass ? 'text' : 'password'} {...register('password')}
                  placeholder="Min. 8 characters"
                  className={`w-full border rounded-xl px-4 py-3.5 pr-11 text-base outline-none transition-all shadow-sm ${errors.password ? 'border-error focus:border-error focus:ring-4 focus:ring-error/10' : 'border-slate-200 focus:border-primary focus:ring-4 focus:ring-primary/10 hover:border-slate-300'}`} />
                <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors focus:outline-none focus:text-primary">
                  {showPass ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              {errors.password && <p className="text-error text-xs font-bold mt-1.5 animate-in slide-in-from-top-1">{errors.password.message}</p>}
            </div>

            <div>
              <label className="text-sm font-bold text-slate-700 block mb-2">Confirm Password</label>
              <div className="relative">
                <input type={showConfirmPass ? 'text' : 'password'} {...register('confirm_password')}
                  placeholder="Confirm your password"
                  className={`w-full border rounded-xl px-4 py-3.5 pr-11 text-base outline-none transition-all shadow-sm ${errors.confirm_password ? 'border-error focus:border-error focus:ring-4 focus:ring-error/10' : 'border-slate-200 focus:border-primary focus:ring-4 focus:ring-primary/10 hover:border-slate-300'}`} />
                <button type="button" onClick={() => setShowConfirmPass(!showConfirmPass)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors focus:outline-none focus:text-primary">
                  {showConfirmPass ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              {errors.confirm_password && <p className="text-error text-xs font-bold mt-1.5 animate-in slide-in-from-top-1">{errors.confirm_password.message}</p>}
            </div>

            {/* Dealer-specific fields */}
            {watchedRole === 'dealer' && (
              <div className="space-y-6 animate-in fade-in slide-in-from-top-2 duration-300">
                <div className="pt-4 border-t border-slate-200">
                  <h3 className="text-sm font-bold text-slate-700 mb-4 flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-primary" />
                    Dealership Information
                  </h3>
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-bold text-slate-700 block mb-2">Dealership Name</label>
                      <input type="text" {...register('dealership_name')}
                        placeholder="e.g., Premium Auto Sales"
                        className={`w-full border rounded-xl px-4 py-3.5 text-base outline-none transition-all shadow-sm ${errors.dealership_name ? 'border-error focus:border-error focus:ring-4 focus:ring-error/10' : 'border-slate-200 focus:border-primary focus:ring-4 focus:ring-primary/10 hover:border-slate-300'}`} />
                      {errors.dealership_name && <p className="text-error text-xs font-bold mt-1.5 animate-in slide-in-from-top-1">{errors.dealership_name.message}</p>}
                    </div>

                    <div>
                      <label className="text-sm font-bold text-slate-700 block mb-2">Dealership Address</label>
                      <textarea {...register('dealership_address')}
                        placeholder="e.g., 123 Main Street, Bangalore, Karnataka"
                        rows={3}
                        className={`w-full border rounded-xl px-4 py-3.5 text-base outline-none transition-all shadow-sm resize-none ${errors.dealership_address ? 'border-error focus:border-error focus:ring-4 focus:ring-error/10' : 'border-slate-200 focus:border-primary focus:ring-4 focus:ring-primary/10 hover:border-slate-300'}`} />
                      {errors.dealership_address && <p className="text-error text-xs font-bold mt-1.5 animate-in slide-in-from-top-1">{errors.dealership_address.message}</p>}
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            <button type="submit" disabled={isSubmitting}
              className="w-full bg-primary hover:bg-blue-800 disabled:opacity-60 text-white font-bold py-4 rounded-xl transition-all shadow-md hover:shadow-lg text-base mt-2 transform hover:-translate-y-0.5 active:translate-y-0 duration-200 focus:outline-none focus:ring-4 focus:ring-primary/30">
              {isSubmitting ? 'Creating account...' : 'Create Account'}
            </button>
          </form>

          <div className="mt-8 pt-8 border-t border-slate-100 flex flex-col items-center">
            <p className="text-center text-sm font-medium text-slate-500 mb-4">
              Already have an account? <Link to="/login" className="text-primary font-bold hover:text-blue-800 transition-colors focus:outline-none focus:underline">Sign In</Link>
            </p>
            <div className="flex items-center gap-1.5 text-xs font-medium text-slate-400">
              <ShieldCheck className="w-4 h-4 text-success" />
              Your data is secure and encrypted.
            </div>
            <p className="text-center text-xs font-medium text-slate-400 mt-4 max-w-xs leading-relaxed">
              By signing up, you agree to our <a href="#" className="text-primary hover:text-blue-800 font-bold transition-colors">Terms</a> and <a href="#" className="text-primary hover:text-blue-800 font-bold transition-colors">Privacy Policy</a>.
            </p>
          </div>
          
        </div>
      </div>
    </div>
  );
}

