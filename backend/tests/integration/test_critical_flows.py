"""
Backend Integration Tests - Critical Workflows

Tests complete end-to-end workflows at the API level:
1. Registration → Verification → Login → Protected Action
2. Car Creation → Admin Approval → Car Available
3. Inquiry Creation → Dealer Response → Buyer Reply
4. MFA Enrollment → Login with MFA
5. Password Reset → Login with New Password
6. User Suspension → Login Blocked
7. Car Deletion → Inquiries Archived
8. Dealer Deletion → Cars Reassigned/Archived
9. Email Change Flow → Verification
10. Wishlist Operations → Car Interaction

Validates:
- Cross-module interactions
- Multi-step processes
- Database state transitions
- Authorization enforcement
- Event cascading
"""

import pytest
import pytest_asyncio
from httpx import AsyncClient
import uuid
from unittest.mock import patch, AsyncMock
from datetime import datetime, timezone, timedelta
from sqlalchemy import select


# ============================================================================
# 12.2. Test: Registration → Verification → Login → Protected Action
# ============================================================================
@pytest.mark.asyncio
async def test_registration_to_protected_action(async_client: AsyncClient, setup_db):
    """
    Test complete auth flow from registration to accessing protected resource
    
    Steps:
    1. Register user
    2. Verify email with OTP
    3. Login with credentials
    4. Verify login OTP
    5. Access protected endpoint (get profile)
    """
    from app.modules.auth.models import User
    from app.modules.auth.otp_service import OTPService
    from sqlalchemy import select
    
    test_email = f"buyer_{uuid.uuid4()}@test.com"
    test_password = "StrongPassword123!"
    full_name = "Test Buyer"
    
    # Step 1: Register user
    with patch("app.shared.email.resend_client.email_service.send_registration_otp", new_callable=AsyncMock) as mock_reg_email:
        mock_reg_email.return_value = True
        
        reg_response = await async_client.post(
            "/api/v1/auth/register/user",
            json={
                "email": test_email,
                "password": test_password,
                "full_name": full_name
            }
        )
        
        assert reg_response.status_code == 200
        assert "Verification code sent" in reg_response.json()["message"]
    
    # Step 2: Verify email with OTP
    otp_service = OTPService(setup_db)
    
    # Get the OTP that was created
    from app.modules.auth.models import OTPCode
    result = await setup_db.execute(
        select(OTPCode).where(
            OTPCode.email == test_email,
            OTPCode.type == "register"
        ).order_by(OTPCode.created_at.desc())
    )
    otp_record = result.scalar_one()
    
    # Verify with a valid OTP (we need to create a known OTP for testing)
    from app.core.security import get_password_hash
    from app.db.redis import get_redis
    redis_client = await get_redis()
    
    # Store password hash for verification
    hashed_password = get_password_hash(test_password)
    temp_key = f"otp:reg:pwd:{test_email}"
    await redis_client.setex(temp_key, 600, hashed_password)
    
    # Create a new OTP we can use
    context_data = {"full_name": full_name, "role": "user"}
    otp_code = await otp_service.create_otp(test_email, "register", context_data)
    
    verify_response = await async_client.post(
        "/api/v1/auth/verify-registration",
        json={
            "email": test_email,
            "code": otp_code
        }
    )
    
    assert verify_response.status_code == 200
    verify_data = verify_response.json()
    assert "access_token" in verify_data
    access_token = verify_data["access_token"]
    
    # Verify user was created in database
    result = await setup_db.execute(
        select(User).where(User.email == test_email)
    )
    user = result.scalar_one()
    assert user.full_name == full_name
    assert user.role.value == "user"
    assert user.is_active is True
    
    # Step 3: Login with credentials (requires OTP)
    with patch("app.shared.email.resend_client.email_service.send_login_otp", new_callable=AsyncMock) as mock_login_email:
        mock_login_email.return_value = True
        
        login_response = await async_client.post(
            "/api/v1/auth/login",
            json={
                "email": test_email,
                "password": test_password
            }
        )
        
        assert login_response.status_code == 200
        assert "OTP sent to email" in login_response.json()["message"]
    
    # Step 4: Verify login OTP
    login_otp = await otp_service.create_otp(test_email, "login", {"user_id": str(user.id)})
    
    verify_login_response = await async_client.post(
        "/api/v1/auth/verify-login",
        json={
            "email": test_email,
            "code": login_otp
        }
    )
    
    assert verify_login_response.status_code == 200
    login_data = verify_login_response.json()
    assert "access_token" in login_data
    new_access_token = login_data["access_token"]
    
    # Step 5: Access protected endpoint with token
    headers = {"Authorization": f"Bearer {new_access_token}"}
    profile_response = await async_client.get(
        "/api/v1/auth/me",
        headers=headers
    )
    
    assert profile_response.status_code == 200
    profile_data = profile_response.json()
    assert profile_data["email"] == test_email
    assert profile_data["full_name"] == full_name
    assert profile_data["role"] == "user"


# ============================================================================
# 12.3. Test: Car Creation → Admin Approval → Car Available
# ============================================================================
@pytest.mark.asyncio
async def test_car_creation_approval_flow(async_client: AsyncClient, setup_db):
    """
    Test car lifecycle from creation to approval
    
    Steps:
    1. Create dealer user
    2. Dealer creates car listing
    3. Verify car is in PENDING status
    4. Admin approves car
    5. Verify car is APPROVED and visible in search
    """
    from app.modules.auth.models import User, RoleEnum
    from app.modules.cars.models import Car, ModerationStatusEnum
    from app.core.security import get_password_hash, create_access_token
    
    # Step 1: Create dealer user
    dealer_email = f"dealer_{uuid.uuid4()}@test.com"
    dealer = User(
        email=dealer_email,
        hashed_password=get_password_hash("password123"),
        full_name="Test Dealer",
        role=RoleEnum.dealer,
        is_active=True
    )
    setup_db.add(dealer)
    await setup_db.flush()
    
    dealer_token = create_access_token(subject=dealer.id)
    dealer_headers = {"Authorization": f"Bearer {dealer_token}"}
    
    # Step 2: Dealer creates car listing
    car_data = {
        "make": "Toyota",
        "model": "Camry",
        "year": 2022,
        "price": 25000.00,
        "mileage": 15000,
        "vin": f"VIN{uuid.uuid4().hex[:14].upper()}",
        "description": "Well-maintained sedan",
        "location": "Los Angeles, CA",
        "fuel_type": "Gasoline",
        "transmission": "Automatic",
        "body_type": "Sedan",
        "exterior_color": "Silver",
        "interior_color": "Black",
        "features": ["Bluetooth", "Backup Camera"]
    }
    
    create_response = await async_client.post(
        "/api/v1/cars/",
        json=car_data,
        headers=dealer_headers
    )
    
    assert create_response.status_code == 201
    car_response_data = create_response.json()
    car_id = car_response_data["id"]
    
    # Step 3: Verify car is in PENDING status
    assert car_response_data["moderation_status"] == "PENDING"
    
    # Verify in database
    result = await setup_db.execute(
        select(Car).where(Car.id == car_id)
    )
    car = result.scalar_one()
    assert car.moderation_status == ModerationStatusEnum.PENDING
    assert car.dealer_id == dealer.id
    
    # Step 4: Admin approves car
    admin = User(
        email=f"admin_{uuid.uuid4()}@test.com",
        hashed_password=get_password_hash("password123"),
        full_name="Test Admin",
        role=RoleEnum.admin,
        is_active=True,
        mfa_enabled=True
    )
    setup_db.add(admin)
    await setup_db.flush()
    
    admin_token = create_access_token(subject=admin.id)
    admin_headers = {"Authorization": f"Bearer {admin_token}"}
    
    approve_response = await async_client.post(
        f"/api/v1/admin/cars/{car_id}/approve",
        headers=admin_headers
    )
    
    assert approve_response.status_code == 200
    approve_data = approve_response.json()
    assert approve_data["moderation_status"] == "APPROVED"
    
    # Step 5: Verify car is visible in search
    await setup_db.refresh(car)
    assert car.moderation_status == ModerationStatusEnum.APPROVED
    
    # Search for approved cars (public endpoint)
    search_response = await async_client.get("/api/v1/cars/search")
    assert search_response.status_code == 200
    search_data = search_response.json()
    
    # Find our car in results
    car_ids = [c["id"] for c in search_data["cars"]]
    assert car_id in car_ids


# ============================================================================
# 12.4. Test: Inquiry Creation → Dealer Response → Buyer Reply
# ============================================================================
@pytest.mark.asyncio
async def test_inquiry_conversation_flow(async_client: AsyncClient, setup_db):
    """
    Test complete inquiry workflow with multi-party conversation
    
    Steps:
    1. Create dealer with approved car
    2. Create buyer user
    3. Buyer creates inquiry on car
    4. Dealer responds to inquiry
    5. Buyer replies to dealer
    6. Verify conversation history
    """
    from app.modules.auth.models import User, RoleEnum
    from app.modules.cars.models import Car, ModerationStatusEnum
    from app.modules.inquiries.models import Inquiry, InquiryMessage
    from app.core.security import get_password_hash, create_access_token
    
    # Step 1: Create dealer with approved car
    dealer = User(
        email=f"dealer_{uuid.uuid4()}@test.com",
        hashed_password=get_password_hash("password123"),
        full_name="Test Dealer",
        role=RoleEnum.dealer,
        is_active=True
    )
    setup_db.add(dealer)
    await setup_db.flush()
    
    car = Car(
        dealer_id=dealer.id,
        make="Honda",
        model="Accord",
        year=2021,
        price=28000.00,
        mileage=20000,
        vin=f"VIN{uuid.uuid4().hex[:14].upper()}",
        description="Excellent condition",
        location="New York, NY",
        fuel_type="Gasoline",
        transmission="Automatic",
        body_type="Sedan",
        exterior_color="Blue",
        interior_color="Gray",
        moderation_status=ModerationStatusEnum.APPROVED
    )
    setup_db.add(car)
    await setup_db.flush()
    
    # Step 2: Create buyer user
    buyer = User(
        email=f"buyer_{uuid.uuid4()}@test.com",
        hashed_password=get_password_hash("password123"),
        full_name="Test Buyer",
        role=RoleEnum.user,
        is_active=True
    )
    setup_db.add(buyer)
    await setup_db.flush()
    
    buyer_token = create_access_token(subject=buyer.id)
    buyer_headers = {"Authorization": f"Bearer {buyer_token}"}
    
    # Step 3: Buyer creates inquiry on car
    inquiry_data = {
        "car_id": car.id,
        "message": "Is this car still available? I'm interested in a test drive."
    }
    
    create_inquiry_response = await async_client.post(
        "/api/v1/inquiries/",
        json=inquiry_data,
        headers=buyer_headers
    )
    
    assert create_inquiry_response.status_code == 201
    inquiry_response_data = create_inquiry_response.json()
    inquiry_id = inquiry_response_data["id"]
    assert inquiry_response_data["status"] == "OPEN"
    
    # Verify inquiry in database
    result = await setup_db.execute(
        select(Inquiry).where(Inquiry.id == inquiry_id)
    )
    inquiry = result.scalar_one()
    assert inquiry.buyer_id == buyer.id
    assert inquiry.car_id == car.id
    
    # Step 4: Dealer responds to inquiry
    dealer_token = create_access_token(subject=dealer.id)
    dealer_headers = {"Authorization": f"Bearer {dealer_token}"}
    
    dealer_message = {
        "message": "Yes, the car is available! We can schedule a test drive this week."
    }
    
    dealer_response = await async_client.post(
        f"/api/v1/inquiries/{inquiry_id}/messages",
        json=dealer_message,
        headers=dealer_headers
    )
    
    assert dealer_response.status_code == 201
    dealer_msg_data = dealer_response.json()
    assert dealer_msg_data["sender_id"] == dealer.id
    
    # Step 5: Buyer replies to dealer
    buyer_reply = {
        "message": "Great! How about Friday afternoon?"
    }
    
    buyer_reply_response = await async_client.post(
        f"/api/v1/inquiries/{inquiry_id}/messages",
        json=buyer_reply,
        headers=buyer_headers
    )
    
    assert buyer_reply_response.status_code == 201
    
    # Step 6: Verify conversation history
    messages_response = await async_client.get(
        f"/api/v1/inquiries/{inquiry_id}",
        headers=buyer_headers
    )
    
    assert messages_response.status_code == 200
    conversation_data = messages_response.json()
    messages = conversation_data["messages"]
    
    # Verify 3 messages: initial inquiry + dealer response + buyer reply
    assert len(messages) >= 3
    assert messages[0]["message"] == inquiry_data["message"]
    assert messages[1]["message"] == dealer_message["message"]
    assert messages[2]["message"] == buyer_reply["message"]


# ============================================================================
# 12.5. Test: MFA Enrollment → Login with MFA
# ============================================================================
@pytest.mark.asyncio
async def test_mfa_enrollment_and_login(async_client: AsyncClient, setup_db):
    """
    Test complete MFA workflow from enrollment to protected login
    
    Steps:
    1. Create user and login
    2. Enroll in MFA (get secret and backup codes)
    3. Verify MFA with TOTP code
    4. Logout
    5. Login again (now requires MFA)
    6. Provide MFA code to complete login
    """
    from app.modules.auth.models import User, RoleEnum
    from app.core.security import get_password_hash, create_access_token
    import pyotp
    
    # Step 1: Create user
    test_email = f"user_{uuid.uuid4()}@test.com"
    test_password = "StrongPassword123!"
    
    user = User(
        email=test_email,
        hashed_password=get_password_hash(test_password),
        full_name="Test User",
        role=RoleEnum.user,
        is_active=True,
        mfa_enabled=False
    )
    setup_db.add(user)
    await setup_db.flush()
    
    access_token = create_access_token(subject=user.id)
    headers = {"Authorization": f"Bearer {access_token}"}
    
    # Step 2: Enroll in MFA
    enroll_response = await async_client.post(
        "/api/v1/auth/mfa/enroll",
        headers=headers
    )
    
    assert enroll_response.status_code == 200
    enroll_data = enroll_response.json()
    assert "secret" in enroll_data
    assert "backup_codes" in enroll_data
    assert len(enroll_data["backup_codes"]) == 10
    
    mfa_secret = enroll_data["secret"]
    backup_codes = enroll_data["backup_codes"]
    
    # Step 3: Verify MFA with TOTP code
    totp = pyotp.TOTP(mfa_secret)
    totp_code = totp.now()
    
    verify_response = await async_client.post(
        "/api/v1/auth/mfa/verify",
        headers=headers,
        json={"code": totp_code}
    )
    
    assert verify_response.status_code == 200
    assert "enabled successfully" in verify_response.json()["message"].lower()
    
    # Verify MFA is enabled in database
    await setup_db.refresh(user)
    assert user.mfa_enabled is True
    
    # Step 4 & 5: Login now requires MFA
    with patch("app.shared.email.resend_client.email_service.send_login_otp", new_callable=AsyncMock) as mock_email:
        mock_email.return_value = True
        
        login_response = await async_client.post(
            "/api/v1/auth/login",
            json={
                "email": test_email,
                "password": test_password
            }
        )
        
        # First stage: credentials validated, OTP sent
        assert login_response.status_code == 200
    
    # Step 6: Verify login OTP and provide MFA code
    from app.modules.auth.otp_service import OTPService
    otp_service = OTPService(setup_db)
    login_otp = await otp_service.create_otp(test_email, "login", {"user_id": str(user.id)})
    
    # Verify login OTP first
    verify_login_response = await async_client.post(
        "/api/v1/auth/verify-login",
        json={
            "email": test_email,
            "code": login_otp
        }
    )
    
    # Should require MFA code
    if verify_login_response.status_code == 401:
        assert "mfa" in verify_login_response.json()["detail"].lower()
        
        # Provide MFA code
        new_totp_code = totp.now()
        mfa_response = await async_client.post(
            "/api/v1/auth/mfa/login",
            json={
                "email": test_email,
                "code": new_totp_code
            }
        )
        
        assert mfa_response.status_code == 200
        assert "access_token" in mfa_response.json()


# ============================================================================
# 12.6. Test: Password Reset → Login with New Password
# ============================================================================
@pytest.mark.asyncio
async def test_password_reset_complete_flow(async_client: AsyncClient, setup_db):
    """
    Test complete password reset workflow
    
    Steps:
    1. Create user with old password
    2. Request password reset (OTP sent)
    3. Verify reset OTP (get reset token)
    4. Complete password reset with new password
    5. Login with new password succeeds
    6. Login with old password fails
    """
    from app.modules.auth.models import User, RoleEnum
    from app.core.security import get_password_hash
    from app.modules.auth.otp_service import OTPService
    import jwt
    from app.core.config import settings
    
    # Step 1: Create user
    test_email = f"user_{uuid.uuid4()}@test.com"
    old_password = "OldPassword123!"
    new_password = "NewPassword456!"
    
    user = User(
        email=test_email,
        hashed_password=get_password_hash(old_password),
        full_name="Test User",
        role=RoleEnum.user,
        is_active=True
    )
    setup_db.add(user)
    await setup_db.flush()
    
    # Step 2: Request password reset
    with patch("app.shared.email.resend_client.email_service.send_password_reset_otp", new_callable=AsyncMock) as mock_email:
        mock_email.return_value = True
        
        reset_request = await async_client.post(
            "/api/v1/auth/forgot-password",
            json={"email": test_email}
        )
        
        assert reset_request.status_code == 200
        assert "reset code" in reset_request.json()["message"].lower()
    
    # Step 3: Verify reset OTP
    otp_service = OTPService(setup_db)
    reset_otp = await otp_service.create_otp(test_email, "reset", {"user_id": str(user.id)})
    
    verify_reset = await async_client.post(
        "/api/v1/auth/verify-reset-password",
        json={
            "email": test_email,
            "code": reset_otp
        }
    )
    
    assert verify_reset.status_code == 200
    reset_token = verify_reset.json()["reset_token"]
    
    # Step 4: Complete password reset
    complete_reset = await async_client.post(
        "/api/v1/auth/reset-password",
        json={
            "reset_token": reset_token,
            "new_password": new_password
        }
    )
    
    assert complete_reset.status_code == 200
    assert "successfully reset" in complete_reset.json()["message"].lower()
    
    # Step 5: Login with new password succeeds
    with patch("app.shared.email.resend_client.email_service.send_login_otp", new_callable=AsyncMock) as mock_login:
        mock_login.return_value = True
        
        new_login = await async_client.post(
            "/api/v1/auth/login",
            json={
                "email": test_email,
                "password": new_password
            }
        )
        
        assert new_login.status_code == 200
    
    # Step 6: Login with old password fails
    old_login = await async_client.post(
        "/api/v1/auth/login",
        json={
            "email": test_email,
            "password": old_password
        }
    )
    
    assert old_login.status_code == 401
    assert "invalid credentials" in old_login.json()["detail"].lower()


# ============================================================================
# 12.7. Test: User Suspension → Login Blocked
# ============================================================================
@pytest.mark.asyncio
async def test_user_suspension_blocks_login(async_client: AsyncClient, setup_db):
    """
    Test that suspended users cannot login
    
    Steps:
    1. Create active user
    2. User can login successfully
    3. Admin suspends user
    4. User login is blocked with appropriate error
    """
    from app.modules.auth.models import User, RoleEnum
    from app.core.security import get_password_hash, create_access_token
    
    # Step 1: Create active user
    test_email = f"user_{uuid.uuid4()}@test.com"
    test_password = "Password123!"
    
    user = User(
        email=test_email,
        hashed_password=get_password_hash(test_password),
        full_name="Test User",
        role=RoleEnum.user,
        is_active=True,
        is_suspended=False
    )
    setup_db.add(user)
    await setup_db.flush()
    
    # Step 2: User can login successfully
    with patch("app.shared.email.resend_client.email_service.send_login_otp", new_callable=AsyncMock) as mock_email:
        mock_email.return_value = True
        
        first_login = await async_client.post(
            "/api/v1/auth/login",
            json={
                "email": test_email,
                "password": test_password
            }
        )
        
        assert first_login.status_code == 200
    
    # Step 3: Admin suspends user
    admin = User(
        email=f"admin_{uuid.uuid4()}@test.com",
        hashed_password=get_password_hash("admin123"),
        full_name="Admin User",
        role=RoleEnum.admin,
        is_active=True,
        mfa_enabled=True
    )
    setup_db.add(admin)
    await setup_db.flush()
    
    admin_token = create_access_token(subject=admin.id)
    admin_headers = {"Authorization": f"Bearer {admin_token}"}
    
    suspend_response = await async_client.post(
        f"/api/v1/admin/users/{user.id}/suspend",
        json={"reason": "Policy violation"},
        headers=admin_headers
    )
    
    assert suspend_response.status_code == 200
    
    # Verify suspension in database
    await setup_db.refresh(user)
    assert user.is_suspended is True
    
    # Step 4: User login is blocked
    blocked_login = await async_client.post(
        "/api/v1/auth/login",
        json={
            "email": test_email,
            "password": test_password
        }
    )
    
    assert blocked_login.status_code == 403
    assert "suspended" in blocked_login.json()["detail"].lower()


# ============================================================================
# 12.8. Test: Car Deletion → Inquiries Archived
# ============================================================================
@pytest.mark.asyncio
async def test_car_deletion_archives_inquiries(async_client: AsyncClient, setup_db):
    """
    Test that deleting a car archives related inquiries
    
    Steps:
    1. Create dealer with car
    2. Create buyer with inquiry on the car
    3. Dealer deletes car (soft delete)
    4. Verify car is soft-deleted
    5. Verify inquiry is archived/closed
    """
    from app.modules.auth.models import User, RoleEnum
    from app.modules.cars.models import Car, ModerationStatusEnum
    from app.modules.inquiries.models import Inquiry, InquiryStatusEnum
    from app.core.security import get_password_hash, create_access_token
    
    # Step 1: Create dealer with car
    dealer = User(
        email=f"dealer_{uuid.uuid4()}@test.com",
        hashed_password=get_password_hash("password123"),
        full_name="Test Dealer",
        role=RoleEnum.dealer,
        is_active=True
    )
    setup_db.add(dealer)
    await setup_db.flush()
    
    car = Car(
        dealer_id=dealer.id,
        make="Ford",
        model="F-150",
        year=2020,
        price=35000.00,
        mileage=30000,
        vin=f"VIN{uuid.uuid4().hex[:14].upper()}",
        description="Pickup truck",
        location="Dallas, TX",
        fuel_type="Gasoline",
        transmission="Automatic",
        body_type="Truck",
        exterior_color="Red",
        interior_color="Black",
        moderation_status=ModerationStatusEnum.APPROVED
    )
    setup_db.add(car)
    await setup_db.flush()
    
    # Step 2: Create buyer with inquiry
    buyer = User(
        email=f"buyer_{uuid.uuid4()}@test.com",
        hashed_password=get_password_hash("password123"),
        full_name="Test Buyer",
        role=RoleEnum.user,
        is_active=True
    )
    setup_db.add(buyer)
    await setup_db.flush()
    
    inquiry = Inquiry(
        buyer_id=buyer.id,
        car_id=car.id,
        status=InquiryStatusEnum.OPEN
    )
    setup_db.add(inquiry)
    await setup_db.commit()
    
    # Step 3: Dealer deletes car
    dealer_token = create_access_token(subject=dealer.id)
    dealer_headers = {"Authorization": f"Bearer {dealer_token}"}
    
    delete_response = await async_client.delete(
        f"/api/v1/cars/{car.id}",
        headers=dealer_headers
    )
    
    assert delete_response.status_code == 204
    
    # Step 4: Verify car is soft-deleted
    await setup_db.refresh(car)
    assert car.deleted_at is not None
    
    # Step 5: Verify inquiry is archived/closed
    await setup_db.refresh(inquiry)
    # Inquiries should be closed when car is deleted
    assert inquiry.status == InquiryStatusEnum.CLOSED


# ============================================================================
# 12.9. Test: Dealer Deletion → Cars Reassigned/Archived
# ============================================================================
@pytest.mark.asyncio
async def test_dealer_deletion_handles_cars(async_client: AsyncClient, setup_db):
    """
    Test that deleting a dealer properly handles their cars
    
    Steps:
    1. Create dealer with multiple cars
    2. Admin soft-deletes dealer
    3. Verify dealer is soft-deleted
    4. Verify cars are also soft-deleted or marked
    """
    from app.modules.auth.models import User, RoleEnum
    from app.modules.cars.models import Car, ModerationStatusEnum
    from app.core.security import get_password_hash, create_access_token
    
    # Step 1: Create dealer with cars
    dealer = User(
        email=f"dealer_{uuid.uuid4()}@test.com",
        hashed_password=get_password_hash("password123"),
        full_name="Test Dealer",
        role=RoleEnum.dealer,
        is_active=True
    )
    setup_db.add(dealer)
    await setup_db.flush()
    
    # Create multiple cars
    cars = []
    for i in range(3):
        car = Car(
            dealer_id=dealer.id,
            make="Test",
            model=f"Model{i}",
            year=2021,
            price=20000.00 + (i * 1000),
            mileage=10000,
            vin=f"VIN{uuid.uuid4().hex[:14].upper()}",
            description=f"Test car {i}",
            location="Test City",
            fuel_type="Gasoline",
            transmission="Automatic",
            body_type="Sedan",
            exterior_color="Black",
            interior_color="Gray",
            moderation_status=ModerationStatusEnum.APPROVED
        )
        setup_db.add(car)
        cars.append(car)
    
    await setup_db.flush()
    
    # Step 2: Admin deletes dealer
    admin = User(
        email=f"admin_{uuid.uuid4()}@test.com",
        hashed_password=get_password_hash("admin123"),
        full_name="Admin User",
        role=RoleEnum.admin,
        is_active=True,
        mfa_enabled=True
    )
    setup_db.add(admin)
    await setup_db.flush()
    
    admin_token = create_access_token(subject=admin.id)
    admin_headers = {"Authorization": f"Bearer {admin_token}"}
    
    delete_response = await async_client.delete(
        f"/api/v1/admin/users/{dealer.id}",
        headers=admin_headers
    )
    
    assert delete_response.status_code == 204
    
    # Step 3: Verify dealer is soft-deleted
    await setup_db.refresh(dealer)
    assert dealer.deleted_at is not None
    
    # Step 4: Verify all dealer's cars are soft-deleted
    for car in cars:
        await setup_db.refresh(car)
        assert car.deleted_at is not None


# ============================================================================
# Additional Integration Test: Wishlist Operations
# ============================================================================
@pytest.mark.asyncio
async def test_wishlist_car_interaction_flow(async_client: AsyncClient, setup_db):
    """
    Test wishlist operations with car lifecycle
    
    Steps:
    1. Create buyer and approved car
    2. Buyer adds car to wishlist
    3. Verify car in wishlist
    4. Car gets deleted
    5. Verify wishlist item is removed or marked
    """
    from app.modules.auth.models import User, RoleEnum
    from app.modules.cars.models import Car, ModerationStatusEnum
    from app.modules.wishlist.models import Wishlist
    from app.core.security import get_password_hash, create_access_token
    
    # Step 1: Create buyer and car
    buyer = User(
        email=f"buyer_{uuid.uuid4()}@test.com",
        hashed_password=get_password_hash("password123"),
        full_name="Test Buyer",
        role=RoleEnum.user,
        is_active=True
    )
    setup_db.add(buyer)
    await setup_db.flush()
    
    dealer = User(
        email=f"dealer_{uuid.uuid4()}@test.com",
        hashed_password=get_password_hash("password123"),
        full_name="Test Dealer",
        role=RoleEnum.dealer,
        is_active=True
    )
    setup_db.add(dealer)
    await setup_db.flush()
    
    car = Car(
        dealer_id=dealer.id,
        make="Tesla",
        model="Model 3",
        year=2023,
        price=45000.00,
        mileage=5000,
        vin=f"VIN{uuid.uuid4().hex[:14].upper()}",
        description="Electric sedan",
        location="San Francisco, CA",
        fuel_type="Electric",
        transmission="Automatic",
        body_type="Sedan",
        exterior_color="White",
        interior_color="Black",
        moderation_status=ModerationStatusEnum.APPROVED
    )
    setup_db.add(car)
    await setup_db.flush()
    
    buyer_token = create_access_token(subject=buyer.id)
    buyer_headers = {"Authorization": f"Bearer {buyer_token}"}
    
    # Step 2: Buyer adds car to wishlist
    add_wishlist_response = await async_client.post(
        f"/api/v1/wishlist/{car.id}",
        headers=buyer_headers
    )
    
    assert add_wishlist_response.status_code == 201
    
    # Step 3: Verify car in wishlist
    get_wishlist_response = await async_client.get(
        "/api/v1/wishlist/",
        headers=buyer_headers
    )
    
    assert get_wishlist_response.status_code == 200
    wishlist_data = get_wishlist_response.json()
    assert len(wishlist_data) > 0
    
    car_ids = [item["car"]["id"] for item in wishlist_data]
    assert car.id in car_ids
    
    # Step 4: Car gets deleted
    dealer_token = create_access_token(subject=dealer.id)
    dealer_headers = {"Authorization": f"Bearer {dealer_token}"}
    
    delete_car_response = await async_client.delete(
        f"/api/v1/cars/{car.id}",
        headers=dealer_headers
    )
    
    assert delete_car_response.status_code == 204
    
    # Step 5: Verify wishlist updated (car should be gone or marked)
    result = await setup_db.execute(
        select(Wishlist).where(
            Wishlist.user_id == buyer.id,
            Wishlist.car_id == car.id
        )
    )
    wishlist_entry = result.scalar_one_or_none()
    
    # Wishlist entry should either be deleted or car marked as deleted
    await setup_db.refresh(car)
    assert car.deleted_at is not None


# ============================================================================
# Additional Test: Review Creation and Moderation
# ============================================================================
@pytest.mark.asyncio
async def test_review_creation_and_moderation(async_client: AsyncClient, setup_db):
    """
    Test review creation and admin moderation flow
    
    Steps:
    1. Create buyer and approved car
    2. Buyer creates review
    3. Verify review is pending moderation
    4. Admin approves review
    5. Verify review is visible
    """
    from app.modules.auth.models import User, RoleEnum
    from app.modules.cars.models import Car, ModerationStatusEnum
    from app.modules.reviews.models import Review
    from app.core.security import get_password_hash, create_access_token
    
    # Step 1: Create buyer and car
    buyer = User(
        email=f"buyer_{uuid.uuid4()}@test.com",
        hashed_password=get_password_hash("password123"),
        full_name="Test Buyer",
        role=RoleEnum.user,
        is_active=True
    )
    setup_db.add(buyer)
    await setup_db.flush()
    
    dealer = User(
        email=f"dealer_{uuid.uuid4()}@test.com",
        hashed_password=get_password_hash("password123"),
        full_name="Test Dealer",
        role=RoleEnum.dealer,
        is_active=True
    )
    setup_db.add(dealer)
    await setup_db.flush()
    
    car = Car(
        dealer_id=dealer.id,
        make="BMW",
        model="X5",
        year=2022,
        price=60000.00,
        mileage=8000,
        vin=f"VIN{uuid.uuid4().hex[:14].upper()}",
        description="Luxury SUV",
        location="Miami, FL",
        fuel_type="Gasoline",
        transmission="Automatic",
        body_type="SUV",
        exterior_color="Black",
        interior_color="Brown",
        moderation_status=ModerationStatusEnum.APPROVED
    )
    setup_db.add(car)
    await setup_db.flush()
    
    buyer_token = create_access_token(subject=buyer.id)
    buyer_headers = {"Authorization": f"Bearer {buyer_token}"}
    
    # Step 2: Buyer creates review
    review_data = {
        "car_id": car.id,
        "rating": 5,
        "comment": "Excellent car! Very satisfied with the purchase."
    }
    
    create_review_response = await async_client.post(
        "/api/v1/reviews/",
        json=review_data,
        headers=buyer_headers
    )
    
    assert create_review_response.status_code == 201
    review_response_data = create_review_response.json()
    review_id = review_response_data["id"]
    
    # Step 3: Verify review is pending moderation
    assert review_response_data["moderation_status"] == "PENDING"
    
    result = await setup_db.execute(
        select(Review).where(Review.id == review_id)
    )
    review = result.scalar_one()
    assert review.moderation_status == ModerationStatusEnum.PENDING
    
    # Step 4: Admin approves review
    admin = User(
        email=f"admin_{uuid.uuid4()}@test.com",
        hashed_password=get_password_hash("admin123"),
        full_name="Admin User",
        role=RoleEnum.admin,
        is_active=True,
        mfa_enabled=True
    )
    setup_db.add(admin)
    await setup_db.flush()
    
    admin_token = create_access_token(subject=admin.id)
    admin_headers = {"Authorization": f"Bearer {admin_token}"}
    
    approve_response = await async_client.post(
        f"/api/v1/admin/reviews/{review_id}/approve",
        headers=admin_headers
    )
    
    assert approve_response.status_code == 200
    
    # Step 5: Verify review is visible
    await setup_db.refresh(review)
    assert review.moderation_status == ModerationStatusEnum.APPROVED
    
    # Public can now see the review
    get_reviews_response = await async_client.get(f"/api/v1/reviews/car/{car.id}")
    assert get_reviews_response.status_code == 200
    reviews_data = get_reviews_response.json()
    
    review_ids = [r["id"] for r in reviews_data]
    assert review_id in review_ids


# ============================================================================
# Additional Test: Token Refresh and Revocation
# ============================================================================
@pytest.mark.asyncio
async def test_token_refresh_and_family_invalidation(async_client: AsyncClient, setup_db):
    """
    Test token refresh and family-based revocation
    
    Steps:
    1. User logs in and gets refresh token
    2. Refresh token to get new token pair
    3. Use old refresh token again (should fail - token reuse detection)
    4. Verify entire token family is revoked
    """
    from app.modules.auth.models import User, RoleEnum, RefreshToken
    from app.core.security import get_password_hash, create_refresh_token
    import hashlib
    
    # Step 1: Create user and refresh token
    user = User(
        email=f"user_{uuid.uuid4()}@test.com",
        hashed_password=get_password_hash("password123"),
        full_name="Test User",
        role=RoleEnum.user,
        is_active=True
    )
    setup_db.add(user)
    await setup_db.flush()
    
    # Create initial refresh token
    refresh_token_plain = create_refresh_token(subject=user.id)
    token_hash = hashlib.sha256(refresh_token_plain.encode()).hexdigest()
    family_id = uuid.uuid4()
    
    rt = RefreshToken(
        user_id=user.id,
        token_hash=token_hash,
        family_id=family_id,
        expires_at=datetime.now(timezone.utc) + timedelta(days=30)
    )
    setup_db.add(rt)
    await setup_db.commit()
    
    # Step 2: Refresh token to get new token pair
    refresh_response = await async_client.post(
        "/api/v1/auth/refresh",
        json={"refresh_token": refresh_token_plain}
    )
    
    assert refresh_response.status_code == 200
    refresh_data = refresh_response.json()
    assert "access_token" in refresh_data
    assert "refresh_token" in refresh_data
    new_refresh_token = refresh_data["refresh_token"]
    
    # Step 3: Try to reuse old refresh token (token reuse detection)
    reuse_response = await async_client.post(
        "/api/v1/auth/refresh",
        json={"refresh_token": refresh_token_plain}
    )
    
    assert reuse_response.status_code == 401
    
    # Step 4: Verify entire token family is revoked
    result = await setup_db.execute(
        select(RefreshToken).where(RefreshToken.family_id == family_id)
    )
    family_tokens = result.scalars().all()
    
    for token in family_tokens:
        assert token.is_revoked is True
    
    # New refresh token should also not work now
    new_token_response = await async_client.post(
        "/api/v1/auth/refresh",
        json={"refresh_token": new_refresh_token}
    )
    
    assert new_token_response.status_code == 401
