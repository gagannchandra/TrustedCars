import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Car, Eye, EyeOff, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuthStore } from '../../../store/authStore';

const registerSchema = z.object({
  full_name: z.string().min(2, 'Full Name must be at least 2 characters'),
  email: z.string().min(1, 'Email is required').email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

type RegisterFormValues = z.infer<typeof registerSchema>;

export default function Register() {
  const navigate = useNavigate();
  const { register: authRegister } = useAuthStore();
  const [showPass, setShowPass] = useState(false);
  const [authError, setAuthError] = useState('');
  
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: { full_name: '', email: '', password: '' }
  });

  const onSubmit = async (data: RegisterFormValues) => {
    setAuthError('');
    const success = await authRegister({ ...data, role: 'user' });
    if (success) {
      toast.success('Account created successfully!');
      navigate('/');
    } else {
      setAuthError('Registration failed. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-surface flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        <Link to="/" className="flex items-center gap-3 mb-8 justify-center group">
          <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center shadow-md group-hover:bg-blue-800 transition-colors">
            <Car className="w-6 h-6 text-white" />
          </div>
          <span className="font-display font-bold text-2xl text-slate-900 tracking-tight">TrustedCars</span>
        </Link>

        <div className="bg-white rounded-[24px] border border-slate-100 shadow-xl shadow-slate-200/40 p-8 sm:p-10">
          <h1 className="font-display font-bold text-3xl text-slate-900 mb-2 tracking-tight">Create an account</h1>
          <p className="text-slate-500 text-base font-medium mb-8">Join the enterprise marketplace — it's free</p>

          {authError && (
            <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-error text-sm font-medium px-4 py-3 rounded-xl mb-6">
              <AlertCircle className="w-4 h-4 shrink-0" />{authError}
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div>
              <label className="text-sm font-bold text-slate-700 block mb-2">Full Name</label>
              <input type="text" {...register('full_name')}
                placeholder="Rahul Sharma"
                className={`w-full border rounded-xl px-4 py-3.5 text-base outline-none transition-all shadow-sm ${errors.full_name ? 'border-error focus:border-error focus:ring-4 focus:ring-error/10' : 'border-slate-200 focus:border-primary focus:ring-4 focus:ring-primary/10'}`} />
              {errors.full_name && <p className="text-error text-xs font-bold mt-1.5">{errors.full_name.message}</p>}
            </div>
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
                  placeholder="Min. 8 characters"
                  className={`w-full border rounded-xl px-4 py-3.5 pr-11 text-base outline-none transition-all shadow-sm ${errors.password ? 'border-error focus:border-error focus:ring-4 focus:ring-error/10' : 'border-slate-200 focus:border-primary focus:ring-4 focus:ring-primary/10'}`} />
                <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                  {showPass ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              {errors.password && <p className="text-error text-xs font-bold mt-1.5">{errors.password.message}</p>}
            </div>
            <button type="submit" disabled={isSubmitting}
              className="w-full bg-primary hover:bg-blue-800 disabled:opacity-60 text-white font-bold py-4 rounded-xl transition-all shadow-md text-base mt-4">
              {isSubmitting ? 'Creating account...' : 'Create Account'}
            </button>
          </form>

          <p className="text-center text-xs font-medium text-slate-400 mt-6">
            By signing up, you agree to our <a href="#" className="text-primary hover:text-blue-800 font-bold">Terms</a> and <a href="#" className="text-primary hover:text-blue-800 font-bold">Privacy Policy</a>
          </p>
          <p className="text-center text-sm font-medium text-slate-500 mt-6 pt-6 border-t border-slate-100">
            Already have an account? <Link to="/login" className="text-primary font-bold hover:text-blue-800">Sign In</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
