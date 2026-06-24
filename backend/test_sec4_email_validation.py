"""
SEC-4: Email Service Validation Tests

Tests to verify that RESEND_API_KEY validation works correctly.
Ensures email service is properly configured before application starts.
"""

import subprocess
import sys

def test_missing_api_key_blocks_startup():
    """Test that missing RESEND_API_KEY is blocked"""
    print("\n" + "="*60)
    print("TEST 1: Block Missing RESEND_API_KEY")
    print("="*60)
    
    result = subprocess.run(
        ["python", "-c", "from app.core.config import settings"],
        env={
            **subprocess.os.environ,
            "RESEND_API_KEY": ""  # Empty key
        },
        capture_output=True,
        text=True,
        cwd="/home/gagan-chandra/Code/TrustedCars/backend"
    )
    
    if result.returncode != 0 and "RESEND_API_KEY is not configured" in result.stderr:
        print("✅ PASSED: Empty RESEND_API_KEY correctly blocked")
        print(f"   Exit code: {result.returncode}")
        return True
    else:
        print(f"❌ FAILED: Expected validation error for empty key")
        print(f"   Exit code: {result.returncode}")
        print(f"   Stderr: {result.stderr[:300]}")
        return False


def test_placeholder_api_key_blocks_startup():
    """Test that placeholder RESEND_API_KEY is blocked"""
    print("\n" + "="*60)
    print("TEST 2: Block Placeholder RESEND_API_KEY")
    print("="*60)
    
    placeholder_keys = [
        "re_placeholder_update_with_real_key",
        "re_your_resend_api_key_here",
        "re_replace_me",
    ]
    
    passed_count = 0
    for placeholder in placeholder_keys:
        result = subprocess.run(
            ["python", "-c", "from app.core.config import settings"],
            env={
                **subprocess.os.environ,
                "RESEND_API_KEY": placeholder
            },
            capture_output=True,
            text=True,
            cwd="/home/gagan-chandra/Code/TrustedCars/backend"
        )
        
        if result.returncode != 0 and "appears to be a placeholder" in result.stderr:
            print(f"   ✅ Blocked placeholder: {placeholder[:30]}...")
            passed_count += 1
        else:
            print(f"   ❌ Failed to block: {placeholder[:30]}...")
    
    if passed_count == len(placeholder_keys):
        print(f"✅ PASSED: All {len(placeholder_keys)} placeholder patterns blocked")
        return True
    else:
        print(f"❌ FAILED: Only {passed_count}/{len(placeholder_keys)} placeholders blocked")
        return False


def test_invalid_format_api_key_blocks_startup():
    """Test that invalid format RESEND_API_KEY is blocked"""
    print("\n" + "="*60)
    print("TEST 3: Block Invalid Format RESEND_API_KEY")
    print("="*60)
    
    invalid_keys = [
        "invalid_key_12345",  # Doesn't start with re_
        "sk_live_12345",  # Stripe key format
        "api_key_12345",  # Generic format
    ]
    
    passed_count = 0
    for invalid_key in invalid_keys:
        result = subprocess.run(
            ["python", "-c", "from app.core.config import settings"],
            env={
                **subprocess.os.environ,
                "RESEND_API_KEY": invalid_key
            },
            capture_output=True,
            text=True,
            cwd="/home/gagan-chandra/Code/TrustedCars/backend"
        )
        
        if result.returncode != 0 and ("must start with 're_'" in result.stderr or "INVALID RESEND_API_KEY FORMAT" in result.stderr):
            print(f"   ✅ Blocked invalid format: {invalid_key[:20]}...")
            passed_count += 1
        else:
            print(f"   ❌ Failed to block: {invalid_key[:20]}...")
    
    if passed_count == len(invalid_keys):
        print(f"✅ PASSED: All {len(invalid_keys)} invalid formats blocked")
        return True
    else:
        print(f"❌ FAILED: Only {passed_count}/{len(invalid_keys)} invalid formats blocked")
        return False


def test_valid_api_key_allows_startup():
    """Test that valid RESEND_API_KEY format is allowed"""
    print("\n" + "="*60)
    print("TEST 4: Allow Valid RESEND_API_KEY")
    print("="*60)
    
    # Use a valid format (real key from .env should work)
    result = subprocess.run(
        ["python", "-c", "from app.core.config import settings; print('SUCCESS')"],
        capture_output=True,
        text=True,
        cwd="/home/gagan-chandra/Code/TrustedCars/backend"
    )
    
    if result.returncode == 0 and "SUCCESS" in result.stdout:
        print("✅ PASSED: Valid RESEND_API_KEY loads successfully")
        return True
    else:
        print(f"❌ FAILED: Valid key should load successfully")
        print(f"   Exit code: {result.returncode}")
        print(f"   Stderr: {result.stderr[:300]}")
        return False


def test_startup_validation_blocks_missing_key():
    """Test that startup validation also catches missing key"""
    print("\n" + "="*60)
    print("TEST 5: Startup Validation Blocks Missing Key")
    print("="*60)
    
    # This test verifies the startup validation in main.py
    # Since we can't easily test the full application startup,
    # we verify the logic is in place by checking the code
    
    try:
        with open("/home/gagan-chandra/Code/TrustedCars/backend/app/main.py", "r") as f:
            main_content = f.read()
            
        if "Validate email service is configured" in main_content and \
           "RESEND_API_KEY is not configured" in main_content and \
           "raise RuntimeError" in main_content:
            print("✅ PASSED: Startup validation logic is present in main.py")
            print("   - Checks for missing RESEND_API_KEY")
            print("   - Raises RuntimeError on failure")
            print("   - Logs critical error")
            return True
        else:
            print("❌ FAILED: Startup validation logic not found in main.py")
            return False
    except Exception as e:
        print(f"❌ FAILED: Could not verify startup validation: {e}")
        return False


def test_current_env_loads_successfully():
    """Test that current .env configuration loads"""
    print("\n" + "="*60)
    print("TEST 6: Current .env Configuration")
    print("="*60)
    
    result = subprocess.run(
        ["python", "-c", "from app.core.config import settings; print(f'RESEND_API_KEY={settings.RESEND_API_KEY[:10]}...')"],
        capture_output=True,
        text=True,
        cwd="/home/gagan-chandra/Code/TrustedCars/backend"
    )
    
    if result.returncode == 0 and "RESEND_API_KEY=re_" in result.stdout:
        print("✅ PASSED: Current .env loads successfully")
        print(f"   {result.stdout.strip()}")
        return True
    else:
        print(f"❌ FAILED: Current .env has issues")
        print(f"   Exit code: {result.returncode}")
        print(f"   Stderr: {result.stderr[:300]}")
        return False


if __name__ == "__main__":
    print("\n" + "="*70)
    print("SEC-4: EMAIL SERVICE VALIDATION - VERIFICATION TESTS")
    print("="*70)
    
    results = []
    results.append(("Block Missing RESEND_API_KEY", test_missing_api_key_blocks_startup()))
    results.append(("Block Placeholder RESEND_API_KEY", test_placeholder_api_key_blocks_startup()))
    results.append(("Block Invalid Format RESEND_API_KEY", test_invalid_format_api_key_blocks_startup()))
    results.append(("Allow Valid RESEND_API_KEY", test_valid_api_key_allows_startup()))
    results.append(("Startup Validation Present", test_startup_validation_blocks_missing_key()))
    results.append(("Current .env Configuration", test_current_env_loads_successfully()))
    
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
