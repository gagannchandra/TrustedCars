"""
SEC-2: Simple OTP Authentication Enforcement Verification

Quick verification that OTP validation is working correctly.
"""

import subprocess
import sys

def test_production_with_otp_disabled():
    """Test that production environment with OTP disabled is blocked"""
    print("\n" + "="*60)
    print("TEST 1: Block OTP Disabled in Production")
    print("="*60)
    
    result = subprocess.run(
        ["python", "-c", "from app.core.config import settings"],
        env={
            **subprocess.os.environ,
            "ENVIRONMENT": "production",
            "DISABLE_OTP_AUTH": "true"
        },
        capture_output=True,
        text=True,
        cwd="/home/gagan-chandra/Code/TrustedCars/backend"
    )
    
    if result.returncode != 0 and "OTP authentication cannot be disabled in production" in result.stderr:
        print("✅ PASSED: Production with OTP disabled correctly blocked")
        print(f"   Exit code: {result.returncode}")
        return True
    else:
        print(f"❌ FAILED: Expected validation error")
        print(f"   Exit code: {result.returncode}")
        print(f"   Stderr: {result.stderr[:200]}")
        return False


def test_production_with_otp_enabled():
    """Test that production environment with OTP enabled is allowed"""
    print("\n" + "="*60)
    print("TEST 2: Allow OTP Enabled in Production")
    print("="*60)
    
    result = subprocess.run(
        ["python", "-c", "from app.core.config import settings; print('SUCCESS')"],
        env={
            **subprocess.os.environ,
            "ENVIRONMENT": "production",
            "DISABLE_OTP_AUTH": "false"
        },
        capture_output=True,
        text=True,
        cwd="/home/gagan-chandra/Code/TrustedCars/backend"
    )
    
    if result.returncode == 0 and "SUCCESS" in result.stdout:
        print("✅ PASSED: Production with OTP enabled loads successfully")
        return True
    else:
        print(f"❌ FAILED: Should have loaded successfully")
        print(f"   Exit code: {result.returncode}")
        print(f"   Stderr: {result.stderr[:200]}")
        return False


def test_development_with_otp_disabled():
    """Test that development environment allows OTP to be disabled"""
    print("\n" + "="*60)
    print("TEST 3: Allow OTP Disabled in Development")
    print("="*60)
    
    result = subprocess.run(
        ["python", "-c", "from app.core.config import settings; print('SUCCESS')"],
        env={
            **subprocess.os.environ,
            "ENVIRONMENT": "development",
            "DISABLE_OTP_AUTH": "true"
        },
        capture_output=True,
        text=True,
        cwd="/home/gagan-chandra/Code/TrustedCars/backend"
    )
    
    if result.returncode == 0 and "SUCCESS" in result.stdout:
        print("✅ PASSED: Development with OTP disabled loads successfully")
        return True
    else:
        print(f"❌ FAILED: Should have loaded successfully")
        print(f"   Exit code: {result.returncode}")
        print(f"   Stderr: {result.stderr[:200]}")
        return False


def test_current_env_file():
    """Test that current .env file loads successfully"""
    print("\n" + "="*60)
    print("TEST 4: Current .env Configuration")
    print("="*60)
    
    result = subprocess.run(
        ["python", "-c", "from app.core.config import settings; print(f'ENVIRONMENT={settings.ENVIRONMENT}'); print(f'DISABLE_OTP_AUTH={settings.DISABLE_OTP_AUTH}')"],
        capture_output=True,
        text=True,
        cwd="/home/gagan-chandra/Code/TrustedCars/backend"
    )
    
    if result.returncode == 0:
        print("✅ PASSED: Current .env configuration loads successfully")
        print(f"   {result.stdout.strip()}")
        return True
    else:
        print(f"❌ FAILED: Current .env configuration has errors")
        print(f"   Exit code: {result.returncode}")
        print(f"   Stderr: {result.stderr[:200]}")
        return False


if __name__ == "__main__":
    print("\n" + "="*70)
    print("SEC-2: OTP AUTHENTICATION ENFORCEMENT - VERIFICATION TESTS")
    print("="*70)
    
    results = []
    results.append(("Block OTP Disabled in Production", test_production_with_otp_disabled()))
    results.append(("Allow OTP Enabled in Production", test_production_with_otp_enabled()))
    results.append(("Allow OTP Disabled in Development", test_development_with_otp_disabled()))
    results.append(("Current .env Configuration", test_current_env_file()))
    
    print("\n" + "="*70)
    print("TEST SUMMARY")
    print("="*70)
    
    for name, passed in results:
        status = "✅ PASS" if passed else "❌ FAIL"
        print(f"{status}: {name}")
    
    passed_count = sum(1 for _, passed in results if passed)
    total_count = len(results)
    
    print(f"\nResults: {passed_count}/{total_count} tests passed")
    
    if passed_count == total_count:
        print("\n🎉 ALL TESTS PASSED!")
        sys.exit(0)
    else:
        print(f"\n⚠️  {total_count - passed_count} test(s) failed")
        sys.exit(1)
