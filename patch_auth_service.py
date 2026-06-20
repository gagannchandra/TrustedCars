import sys

def modify_file():
    with open('backend/app/modules/auth/service.py', 'r') as f:
        content = f.read()

    # We want to replace everything from "async def register_user" down to the end of login
    # Login ends before "async def refresh"
    
    import re
    # Find start of register_user
    match_start = re.search(r'    async def register_user\(self, req: RegisterUserRequest\).*?:', content, re.DOTALL)
    if not match_start:
        print("Could not find register_user")
        sys.exit(1)
        
    # Find start of refresh
    match_end = re.search(r'    async def refresh\(self, refresh_token_plain: str\):', content, re.DOTALL)
    if not match_end:
        print("Could not find refresh")
        sys.exit(1)
        
    start_idx = match_start.start()
    end_idx = match_end.start()
    
    new_methods = """    async def register_user(self, req: RegisterUserRequest) -> dict:
        existing = await self.repository.get_user_by_email(req.email)
        if existing:
            raise CustomException(400, "Email already registered")
            
        from app.modules.auth.otp_service import OTPService
        from app.shared.email.resend_client import email_service
        
        otp_service = OTPService(self.session)
        await otp_service.enforce_cooldown(req.email, "register")
        
        hashed = await self.hash_password(req.password)
        context_data = {
            "full_name": req.full_name,
            "password_hash": hashed,
            "role": RoleEnum.user.value
        }
        
        otp = await otp_service.create_otp(req.email, "register", context_data)
        success = await email_service.send_registration_otp(req.email, otp)
        
        if not success:
            raise CustomException(500, "Failed to send verification email. Please try again.")
            
        return {"message": "Verification code sent to email"}

    async def register_dealer(self, req: RegisterDealerRequest) -> dict:
        existing = await self.repository.get_user_by_email(req.email)
        if existing:
            raise CustomException(400, "Email already registered")
            
        from app.modules.auth.otp_service import OTPService
        from app.shared.email.resend_client import email_service
        
        otp_service = OTPService(self.session)
        await otp_service.enforce_cooldown(req.email, "register")
        
        hashed = await self.hash_password(req.password)
        context_data = {
            "full_name": req.full_name,
            "password_hash": hashed,
            "role": RoleEnum.dealer.value,
            "dealership_name": req.dealership_name,
            "dealership_address": req.dealership_address
        }
        
        otp = await otp_service.create_otp(req.email, "register", context_data)
        success = await email_service.send_registration_otp(req.email, otp)
        
        if not success:
            raise CustomException(500, "Failed to send verification email. Please try again.")
            
        return {"message": "Verification code sent to email"}

    async def login(self, req: LoginRequest):
        from app.db.redis import get_redis
        redis_client = await get_redis()
        lockout_key = f"failed_login:{req.email}"
        try:
            failed_attempts = await redis_client.get(lockout_key)
            if failed_attempts and int(failed_attempts) >= 5:
                raise CustomException(429, "Too many failed login attempts. Please try again later.")
        except CustomException:
            raise
        except Exception as e:
            import structlog
            structlog.get_logger(__name__).error("Redis down during login lockout check", error=str(e))
            raise CustomException(503, "Authentication service temporarily unavailable")
        
        user = await self.repository.get_user_by_email(req.email)
        if not user:
            _DUMMY_HASH = "$2b$12$G1O.N2dD8iC4C04N2bN.wOg2/yV2Hl9Xg2O3wY.s2S4uX8q9k0Y6O"
            await self.verify_password_async(req.password, _DUMMY_HASH)
            try:
                await redis_client.incr(lockout_key)
                await redis_client.expire(lockout_key, 15 * 60)
            except Exception:
                pass
            raise CustomException(401, "Invalid credentials")

        if user.is_suspended:
            raise CustomException(403, "Account suspended. Please contact support.")

        is_valid, needs_rehash = await self.verify_password_async(req.password, user.hashed_password)
        if not is_valid:
            try:
                await redis_client.incr(lockout_key)
                await redis_client.expire(lockout_key, 15 * 60)
            except Exception:
                pass
            raise CustomException(401, "Invalid credentials")

        if needs_rehash:
            user.hashed_password = await self.hash_password(req.password)
            self.session.add(user)
            
        try:
            await redis_client.delete(lockout_key)
        except Exception:
            pass

        from app.modules.auth.otp_service import OTPService
        from app.shared.email.resend_client import email_service
        
        otp_service = OTPService(self.session)
        await otp_service.enforce_cooldown(req.email, "login")
        
        otp = await otp_service.create_otp(req.email, "login", {"user_id": str(user.id)})
        success = await email_service.send_login_otp(req.email, otp)
        
        if not success:
            raise CustomException(500, "Failed to send login verification email")
            
        return {"message": "OTP sent to email. Please verify to login."}

"""
    
    new_content = content[:start_idx] + new_methods + content[end_idx:]
    
    # Now append the new OTP verification methods to the end
    append_methods = """
    async def verify_registration(self, email: str, code: str) -> User:
        from app.modules.auth.otp_service import OTPService
        otp_service = OTPService(self.session)
        
        otp_record = await otp_service.verify_otp(email, "register", code)
        context = otp_record.context_data
        
        existing = await self.repository.get_user_by_email(email)
        if existing:
            await otp_service.delete_otp(otp_record)
            raise CustomException(400, "Email already registered")
            
        user = User(
            email=email,
            hashed_password=context["password_hash"],
            full_name=context["full_name"],
            role=RoleEnum(context["role"]),
        )
        try:
            user = await self.repository.create_user(user)
            if user.role == RoleEnum.dealer:
                dealer = Dealership(
                    user_id=user.id,
                    name=context["dealership_name"],
                    address=context["dealership_address"],
                )
                await self.repository.create_dealership(dealer)
                await self._log_audit(user.id, "REGISTER_DEALER", user.id, None, f"Registered dealership {dealer.name}")
            else:
                await self._log_audit(user.id, "REGISTER_USER", user.id, None, "Registered user account")
            
            await otp_service.delete_otp(otp_record)
            await self.session.commit()
            await self.session.refresh(user)
        except IntegrityError:
            await self.session.rollback()
            raise CustomException(400, "Email already registered")
            
        return user

    async def verify_login(self, email: str, code: str) -> dict:
        from app.modules.auth.otp_service import OTPService
        otp_service = OTPService(self.session)
        
        otp_record = await otp_service.verify_otp(email, "login", code)
        
        user = await self.repository.get_user_by_email(email)
        if not user or str(user.id) != otp_record.context_data["user_id"]:
            await otp_service.delete_otp(otp_record)
            raise CustomException(401, "Invalid user record")
            
        await otp_service.delete_otp(otp_record)
        
        access_token = create_access_token(subject=user.id)
        refresh_token_plain = create_refresh_token(subject=user.id)

        family_id = uuid.uuid4()
        rt = RefreshToken(
            user_id=user.id,
            token_hash=self.hash_token(refresh_token_plain),
            family_id=family_id,
            expires_at=datetime.now(timezone.utc)
            + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS),
        )
        await self.repository.save_refresh_token(rt)
        await self._log_audit(user.id, "LOGIN_OTP", user.id, None, "User logged in via OTP")
        await self.session.commit()

        return {
            "access_token": access_token,
            "refresh_token": refresh_token_plain,
            "token_type": "bearer",
        }

    async def forgot_password(self, email: str):
        user = await self.repository.get_user_by_email(email)
        if not user:
            # Silently succeed to prevent email enumeration
            return {"message": "If that email is registered, a reset code was sent."}

        from app.modules.auth.otp_service import OTPService
        from app.shared.email.resend_client import email_service
        
        otp_service = OTPService(self.session)
        await otp_service.enforce_cooldown(email, "reset")
        
        otp = await otp_service.create_otp(email, "reset", {"user_id": str(user.id)})
        await email_service.send_password_reset_otp(email, otp)
        
        return {"message": "If that email is registered, a reset code was sent."}

    async def verify_reset_password(self, email: str, code: str):
        from app.modules.auth.otp_service import OTPService
        otp_service = OTPService(self.session)
        
        otp_record = await otp_service.verify_otp(email, "reset", code)
        
        # Don't delete OTP here, let reset_password consume it.
        # Alternatively, we could delete it and issue a short-lived JWT token to prove they verified.
        # Let's issue a temporary JWT token to make the final reset stateless.
        
        await otp_service.delete_otp(otp_record)
        
        user_id = otp_record.context_data["user_id"]
        reset_token = jwt.encode(
            {"sub": user_id, "type": "reset_password", "exp": datetime.now(timezone.utc) + timedelta(minutes=15)},
            settings.JWT_SECRET_KEY,
            algorithm=settings.ALGORITHM
        )
        
        return {"reset_token": reset_token}

    async def reset_password(self, reset_token: str, new_password: str):
        try:
            payload = jwt.decode(
                reset_token,
                settings.JWT_SECRET_KEY,
                algorithms=[settings.ALGORITHM],
            )
            if payload.get("type") != "reset_password":
                raise CustomException(401, "Invalid token type")
        except InvalidTokenError:
            raise CustomException(401, "Invalid or expired reset token")
            
        user_id = payload.get("sub")
        user = await self.repository.get_user_by_id(user_id)
        if not user:
            raise CustomException(404, "User not found")
            
        user.hashed_password = await self.hash_password(new_password)
        self.session.add(user)
        
        # Invalidate all existing sessions
        await self.session.execute(
            delete(RefreshToken).where(RefreshToken.user_id == user.id)
        )
        
        await self._log_audit(user.id, "PASSWORD_RESET", user.id, None, "User reset their password")
        await self.session.commit()
        
        return {"message": "Password successfully reset. You may now login."}
"""
    new_content += append_methods
    
    with open('backend/app/modules/auth/service.py', 'w') as f:
        f.write(new_content)
        
modify_file()
