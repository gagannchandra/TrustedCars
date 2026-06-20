import { useState, useEffect } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { ShieldCheck, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import OTPInput from '../../../components/ui/OTPInput';
import { useAuth } from '../../../shared/hooks/useAuth';

export default function VerifyResetPassword() {
  const location = useLocation();
  const navigate = useNavigate();
  const { verifyResetPassword } = useAuth();
  
  const email = location.state?.email;

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [countdown, setCountdown] = useState(60);

  useEffect(() => {
    if (!email) {
      navigate('/forgot-password');
    }
  }, [email, navigate]);

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  const handleVerify = async (code: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await verifyResetPassword(email, code);

      if (result.success && result.resetToken) {
        toast.success('Code verified! Please set a new password.');
        navigate('/reset-password', { state: { resetToken: result.resetToken } });
      } else {
        setError(result.message || 'Verification failed');
      }
    } catch (err) {
      setError('An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  if (!email) return null;

  return (
    <div className="min-h-screen bg-surface flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-md bg-white p-8 sm:p-10 rounded-3xl shadow-xl border border-slate-100 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary to-blue-400"></div>
        
        <div className="flex justify-center mb-6">
          <div className="w-14 h-14 bg-blue-50 text-primary rounded-2xl flex items-center justify-center border border-blue-100">
            <ShieldCheck className="w-7 h-7" />
          </div>
        </div>

        <h2 className="text-3xl font-display font-bold text-center text-slate-900 mb-3 tracking-tight">
          Verify Reset Code
        </h2>
        <p className="text-center text-slate-500 font-medium mb-8 leading-relaxed">
          We've sent a 6-digit code to <br/>
          <span className="font-bold text-slate-800">{email}</span>
        </p>

        {error && (
          <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-error text-sm font-medium px-4 py-3 rounded-xl mb-6">
            <AlertCircle className="w-4 h-4 shrink-0" />
            {error}
          </div>
        )}

        <div className="mb-8">
          <OTPInput 
            length={6} 
            onComplete={handleVerify} 
            isLoading={isLoading} 
            error={error ? "" : null}
          />
        </div>

        <div className="text-center mt-8">
          {countdown > 0 ? (
            <p className="text-slate-500 text-sm font-medium">
              Resend code in <span className="text-primary font-bold">{countdown}s</span>
            </p>
          ) : (
            <Link to="/forgot-password"
              className="text-primary font-bold text-sm hover:text-blue-800 transition-colors focus:outline-none focus:underline"
            >
              Request a new code
            </Link>
          )}
        </div>

      </div>
    </div>
  );
}
