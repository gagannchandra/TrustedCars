import sys

def modify_file():
    with open('frontend/src/shared/hooks/useAuth.ts', 'r') as f:
        content = f.read()

    # We need to export verifyLogin, verifyRegistration, forgotPassword, verifyResetPassword, resetPassword
    
    # First update the destructured useAuthStore
    old_destructure = """  const { 
    isAuthenticated, 
    login: storeLogin, 
    register: storeRegister, 
    logout: storeLogout 
  } = useAuthStore();"""
  
    new_destructure = """  const { 
    isAuthenticated, 
    login: storeLogin, 
    register: storeRegister, 
    logout: storeLogout,
    verifyLogin: storeVerifyLogin,
    verifyRegistration: storeVerifyRegistration,
    forgotPassword: storeForgotPassword,
    verifyResetPassword: storeVerifyResetPassword,
    resetPassword: storeResetPassword
  } = useAuthStore();"""
  
    content = content.replace(old_destructure, new_destructure)
    
    # We update login and register to not invalidate queries since they don't log in yet
    old_login = """  const login = async (email: string, password: string) => {
    const result = await storeLogin(email, password);
    if (result.success) {
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      queryClient.invalidateQueries({ queryKey: ['wishlist'] });
    }
    return result;
  };"""
  
    new_login = """  const login = async (email: string, password: string) => {
    // Only initiates OTP, does not create session yet
    return await storeLogin(email, password);
  };
  
  const verifyLogin = async (email: string, code: string) => {
    const result = await storeVerifyLogin(email, code);
    if (result.success) {
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      queryClient.invalidateQueries({ queryKey: ['wishlist'] });
    }
    return result;
  };"""
  
    content = content.replace(old_login, new_login)
    
    old_reg = """  const register = async (data: RegisterPayload) => {
    const result = await storeRegister(data);
    if (result.success) {
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      queryClient.invalidateQueries({ queryKey: ['wishlist'] });
    }
    return result;
  };"""
  
    new_reg = """  const register = async (data: RegisterPayload) => {
    // Only initiates OTP, does not create session yet
    return await storeRegister(data);
  };

  const verifyRegistration = async (email: string, code: string) => {
    const result = await storeVerifyRegistration(email, code);
    if (result.success) {
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      queryClient.invalidateQueries({ queryKey: ['wishlist'] });
    }
    return result;
  };"""

    content = content.replace(old_reg, new_reg)
    
    old_return = """    login,
    register,
    logout,
    toggleWishlist,
  };"""
    
    new_return = """    login,
    verifyLogin,
    register,
    verifyRegistration,
    forgotPassword: storeForgotPassword,
    verifyResetPassword: storeVerifyResetPassword,
    resetPassword: storeResetPassword,
    logout,
    toggleWishlist,
  };"""
    
    content = content.replace(old_return, new_return)

    with open('frontend/src/shared/hooks/useAuth.ts', 'w') as f:
        f.write(content)

modify_file()
