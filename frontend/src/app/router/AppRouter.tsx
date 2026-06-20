import { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { HelmetProvider } from 'react-helmet-async';
import Navbar from '../../components/layout/Navbar';
import Footer from '../../components/layout/Footer';
import ProtectedRoute from '../../components/layout/ProtectedRoute';
import ScrollToTop from '../../components/layout/ScrollToTop';

const Landing = lazy(() => import('../../features/landing/Landing'));
const Cars = lazy(() => import('../../features/cars/Cars'));
const CarDetail = lazy(() => import('../../features/cars/CarDetail'));
const Login = lazy(() => import('../../features/auth/pages/Login'));
const Register = lazy(() => import('../../features/auth/pages/Register'));
const VerifyOTP = lazy(() => import('../../features/auth/pages/VerifyOTP'));
const ForgotPassword = lazy(() => import('../../features/auth/pages/ForgotPassword'));
const VerifyResetPassword = lazy(() => import('../../features/auth/pages/VerifyResetPassword'));
const ResetPassword = lazy(() => import('../../features/auth/pages/ResetPassword'));
const Sell = lazy(() => import('../../features/sell/Sell'));
const Dashboard = lazy(() => import('../../features/dashboard/Dashboard'));
const AdminPanel = lazy(() => import('../../features/admin/AdminPanel'));
const SellerListings = lazy(() => import('../../features/sell/pages/SellerListings'));

function AppLayout({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const noNavFooter = ['/login', '/register', '/verify-otp', '/forgot-password', '/verify-reset-password', '/reset-password'].includes(location.pathname);

  return (
    <div className="flex flex-col min-h-screen">
      {!noNavFooter && <Navbar />}
      <main className={`flex-1 ${!noNavFooter ? 'pt-16' : ''}`}>
        {children}
      </main>
      {!noNavFooter && <Footer />}
    </div>
  );
}

const LoadingFallback = () => (
  <div className="min-h-screen flex items-center justify-center bg-surface">
    <div className="animate-spin w-12 h-12 border-4 border-primary border-t-transparent rounded-full"></div>
  </div>
);

export default function App() {
  return (
    <HelmetProvider>
      <Router>
        <ScrollToTop />
        <Toaster position="top-right" toastOptions={{ duration: 4000, style: { background: '#0F172A', color: '#fff', borderRadius: '12px' } }} />
        <AppLayout>
          <Suspense fallback={<LoadingFallback />}>
            <Routes>
              <Route path="/" element={<Landing />} />
              <Route path="/cars" element={<Cars />} />
              <Route path="/cars/:id" element={<CarDetail />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/verify-otp" element={<VerifyOTP />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/verify-reset-password" element={<VerifyResetPassword />} />
              <Route path="/reset-password" element={<ResetPassword />} />
              <Route path="/sell" element={<ProtectedRoute><Sell /></ProtectedRoute>} />
              <Route path="/sell/list" element={<ProtectedRoute><SellerListings /></ProtectedRoute>} />
              <Route path="/dashboard" element={<ProtectedRoute allowedRoles={['user', 'admin']}><Dashboard /></ProtectedRoute>} />
              <Route path="/dashboard/:tab" element={<ProtectedRoute allowedRoles={['user', 'admin']}><Dashboard /></ProtectedRoute>} />
              <Route path="/admin" element={<ProtectedRoute allowedRoles={['admin']}><AdminPanel /></ProtectedRoute>} />
              <Route path="*" element={
                <div className="min-h-screen flex items-center justify-center bg-gray-50">
                  <div className="text-center">
                    <div className="text-8xl mb-4">🚗</div>
                    <h2 className="text-3xl font-bold text-gray-900 mb-2">Page Not Found</h2>
                    <p className="text-gray-500 mb-6">The page you're looking for doesn't exist.</p>
                    <a href="/" className="bg-blue-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-blue-700 inline-block">Go Home</a>
                  </div>
                </div>
              } />
            </Routes>
          </Suspense>
        </AppLayout>
      </Router>
    </HelmetProvider>
  );
}
