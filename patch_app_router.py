import sys

def modify_file():
    with open('frontend/src/app/router/AppRouter.tsx', 'r') as f:
        content = f.read()

    # Add lazy imports
    import re
    old_imports = """const Login = lazy(() => import('../../features/auth/pages/Login'));
const Register = lazy(() => import('../../features/auth/pages/Register'));"""
    new_imports = """const Login = lazy(() => import('../../features/auth/pages/Login'));
const Register = lazy(() => import('../../features/auth/pages/Register'));
const VerifyOTP = lazy(() => import('../../features/auth/pages/VerifyOTP'));
const ForgotPassword = lazy(() => import('../../features/auth/pages/ForgotPassword'));
const VerifyResetPassword = lazy(() => import('../../features/auth/pages/VerifyResetPassword'));
const ResetPassword = lazy(() => import('../../features/auth/pages/ResetPassword'));"""
    
    content = content.replace(old_imports, new_imports)
    
    # Update noNavFooter array
    old_nonav = """const noNavFooter = ['/login', '/register'].includes(location.pathname);"""
    new_nonav = """const noNavFooter = ['/login', '/register', '/verify-otp', '/forgot-password', '/verify-reset-password', '/reset-password'].includes(location.pathname);"""
    content = content.replace(old_nonav, new_nonav)
    
    # Add routes
    old_routes = """              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />"""
    new_routes = """              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/verify-otp" element={<VerifyOTP />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/verify-reset-password" element={<VerifyResetPassword />} />
              <Route path="/reset-password" element={<ResetPassword />} />"""
    content = content.replace(old_routes, new_routes)
    
    with open('frontend/src/app/router/AppRouter.tsx', 'w') as f:
        f.write(content)

modify_file()
