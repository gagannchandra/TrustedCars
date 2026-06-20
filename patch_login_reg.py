import sys

def modify_file():
    # Login.tsx
    with open('frontend/src/features/auth/pages/Login.tsx', 'r') as f:
        content = f.read()

    old_submit = """  const onSubmit = async (data: LoginFormValues) => {
    setAuthError('');
    const result = await login(data.email, data.password);
    if (result.success) {
      toast.success('Successfully logged in!');
      navigate('/');
    } else {
      setAuthError(result.message || 'Invalid email or password. Try demo credentials below.');
    }
  };"""
  
    new_submit = """  const onSubmit = async (data: LoginFormValues) => {
    setAuthError('');
    const result = await login(data.email, data.password);
    if (result.success) {
      toast.success(result.message || 'OTP sent to email!');
      navigate('/verify-otp', { state: { email: data.email, intent: 'login' } });
    } else {
      setAuthError(result.message || 'Invalid email or password. Try demo credentials below.');
    }
  };"""
  
    with open('frontend/src/features/auth/pages/Login.tsx', 'w') as f:
        f.write(content.replace(old_submit, new_submit))
        
    # Register.tsx
    with open('frontend/src/features/auth/pages/Register.tsx', 'r') as f:
        content = f.read()
        
    old_submit_reg = """  const onSubmit = async (data: RegisterFormValues) => {
    setAuthError('');
    const result = await register(data);
    if (result.success) {
      toast.success('Successfully registered!');
      navigate('/');
    } else {
      setAuthError(result.message || 'Registration failed.');
    }
  };"""
  
    new_submit_reg = """  const onSubmit = async (data: RegisterFormValues) => {
    setAuthError('');
    const result = await register(data);
    if (result.success) {
      toast.success(result.message || 'Verification email sent!');
      navigate('/verify-otp', { state: { email: data.email, intent: 'register' } });
    } else {
      setAuthError(result.message || 'Registration failed.');
    }
  };"""

    with open('frontend/src/features/auth/pages/Register.tsx', 'w') as f:
        f.write(content.replace(old_submit_reg, new_submit_reg))

modify_file()
