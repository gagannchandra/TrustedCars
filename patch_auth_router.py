import sys

def modify_file():
    with open('backend/app/modules/auth/router.py', 'r') as f:
        content = f.read()

    # Replace imports
    old_imports = """    MFARecoveryRequest,
)"""
    new_imports = """    MFARecoveryRequest,
    VerifyOTPRequest,
    ForgotPasswordRequest,
    ResetPasswordRequest,
)"""
    content = content.replace(old_imports, new_imports)

    # We need to replace register_user, register_dealer, login to not set cookies and return dict
    
    import re
    # Replace register_user
    content = re.sub(
        r'@router\.post\("/register/user", response_model=UserResponse\)\n@limiter\.limit\("5/minute"\)\nasync def register_user\(.*?\n\):.*?\n    return await service\.register_user\(req\)',
        r'''@router.post("/register/user")
@limiter.limit("5/minute")
async def register_user(
    request: Request, req: RegisterUserRequest, service: AuthService = Depends(get_auth_service)
):
    return await service.register_user(req)''',
        content,
        flags=re.DOTALL
    )

    # Replace register_dealer
    content = re.sub(
        r'@router\.post\("/register/dealer", response_model=UserResponse\)\n@limiter\.limit\("5/minute"\)\nasync def register_dealer\(.*?\n\):.*?\n    return await service\.register_dealer\(req\)',
        r'''@router.post("/register/dealer")
@limiter.limit("5/minute")
async def register_dealer(
    request: Request, req: RegisterDealerRequest, service: AuthService = Depends(get_auth_service)
):
    return await service.register_dealer(req)''',
        content,
        flags=re.DOTALL
    )

    # Replace login
    content = re.sub(
        r'@router\.post\("/login"\)\n@limiter\.limit\("10/minute"\)\nasync def login\(.*?\n\):.*?\n    return \{"detail": "Successfully logged in"\}',
        r'''@router.post("/login")
@limiter.limit("10/minute")
async def login(
    request: Request, req: LoginRequest, service: AuthService = Depends(get_auth_service)
):
    return await service.login(req)''',
        content,
        flags=re.DOTALL
    )
    
    # Append new OTP routes
    new_routes = """

@router.post("/verify-registration", response_model=UserResponse)
@limiter.limit("10/minute")
async def verify_registration(
    request: Request, req: VerifyOTPRequest, service: AuthService = Depends(get_auth_service)
):
    return await service.verify_registration(req.email, req.code)


@router.post("/verify-login")
@limiter.limit("10/minute")
async def verify_login(
    request: Request, response: Response, req: VerifyOTPRequest, service: AuthService = Depends(get_auth_service)
):
    tokens = await service.verify_login(req.email, req.code)
    response.set_cookie(
        key="access_token", value=tokens["access_token"], httponly=True, secure=True, samesite="lax", max_age=30 * 60,
    )
    response.set_cookie(
        key="refresh_token", value=tokens["refresh_token"], httponly=True, secure=True, samesite="lax", max_age=7 * 24 * 60 * 60,
    )
    return {"detail": "Successfully logged in"}


@router.post("/forgot-password")
@limiter.limit("5/minute")
async def forgot_password(
    request: Request, req: ForgotPasswordRequest, service: AuthService = Depends(get_auth_service)
):
    return await service.forgot_password(req.email)


@router.post("/verify-reset-password")
@limiter.limit("10/minute")
async def verify_reset_password(
    request: Request, req: VerifyOTPRequest, service: AuthService = Depends(get_auth_service)
):
    return await service.verify_reset_password(req.email, req.code)


@router.post("/reset-password")
@limiter.limit("5/minute")
async def reset_password(
    request: Request, req: ResetPasswordRequest, service: AuthService = Depends(get_auth_service)
):
    return await service.reset_password(req.reset_token, req.new_password)
"""

    with open('backend/app/modules/auth/router.py', 'w') as f:
        f.write(content + new_routes)
        
modify_file()
