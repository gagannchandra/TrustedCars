import sys

def modify_file():
    with open('backend/app/modules/auth/service.py', 'r') as f:
        content = f.read()

    import re
    # We want to replace the end of verify_registration to issue tokens
    old_end = """            await self.session.refresh(user)
        except IntegrityError:
            await self.session.rollback()
            raise CustomException(400, "Email already registered")
            
        return user"""

    new_end = """            await self.session.refresh(user)
        except IntegrityError:
            await self.session.rollback()
            raise CustomException(400, "Email already registered")
            
        access_token = create_access_token(subject=user.id)
        refresh_token_plain = create_refresh_token(subject=user.id)

        import uuid
        family_id = uuid.uuid4()
        rt = RefreshToken(
            user_id=user.id,
            token_hash=self.hash_token(refresh_token_plain),
            family_id=family_id,
            expires_at=datetime.now(timezone.utc)
            + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS),
        )
        await self.repository.save_refresh_token(rt)
        await self.session.commit()

        return {
            "access_token": access_token,
            "refresh_token": refresh_token_plain,
            "token_type": "bearer",
        }"""
        
    content = content.replace(old_end, new_end)

    with open('backend/app/modules/auth/service.py', 'w') as f:
        f.write(content)
        
modify_file()

with open('backend/app/modules/auth/router.py', 'r') as f:
    rcontent = f.read()

import re
old_router = """@router.post("/verify-registration", response_model=UserResponse)
@limiter.limit("10/minute")
async def verify_registration(
    request: Request, req: VerifyOTPRequest, service: AuthService = Depends(get_auth_service)
):
    return await service.verify_registration(req.email, req.code)"""

new_router = """@router.post("/verify-registration")
@limiter.limit("10/minute")
async def verify_registration(
    request: Request, response: Response, req: VerifyOTPRequest, service: AuthService = Depends(get_auth_service)
):
    tokens = await service.verify_registration(req.email, req.code)
    response.set_cookie(
        key="access_token", value=tokens["access_token"], httponly=True, secure=True, samesite="lax", max_age=30 * 60,
    )
    response.set_cookie(
        key="refresh_token", value=tokens["refresh_token"], httponly=True, secure=True, samesite="lax", max_age=7 * 24 * 60 * 60,
    )
    return {"detail": "Successfully verified and logged in"}"""

with open('backend/app/modules/auth/router.py', 'w') as f:
    f.write(rcontent.replace(old_router, new_router))

