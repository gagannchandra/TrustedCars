# RBAC Enforcement Tests

## Overview

Comprehensive test suite for Role-Based Access Control (RBAC) permission enforcement covering all critical security issues identified in the TrustedCarz audit.

**Priority**: 🔴 CRITICAL - #2 Security Risk from Audit  
**Coverage Target**: 100% of RBAC permission enforcement logic  
**Total Test Cases**: 80+ (including 50+ parametrized permission matrix tests)

## Test File

- **Location**: `/backend/tests/rbac/test_rbac_enforcement.py`
- **Lines of Code**: ~700
- **Test Functions**: 33
- **Parametrized Test Cases**: 72 (permission matrix combinations)
- **Total Test Executions**: ~80+

## What's Tested

### 1. Permission Existence Tests (6 tests)
Verifies all permissions from audit exist in the system:
- ✅ All permissions defined in enum
- ✅ All roles have permission mappings
- ✅ No duplicate permissions
- ✅ **REOPEN_INQUIRY** exists (C-02 audit fix)
- ✅ **DELETE_INQUIRY** exists (C-02 audit fix)
- ✅ **MODERATE_ANY** exists (C-03 audit fix)

### 2. Permission Matrix Tests (72 parametrized tests)
Tests EVERY permission against EVERY role using `@pytest.mark.parametrize`:

**Admin** (21 tests):
- Has ALL critical admin permissions
- DELETE_USER, SUSPEND_USER, VIEW_AUDIT_LOGS
- MODERATE_ANY, MANAGE_SETTINGS
- REOPEN_INQUIRY, DELETE_INQUIRY

**Support Agent** (13 tests):
- Has inquiry management permissions
- Has MODERATE_ANY for resource access
- Does NOT have delete/audit permissions

**Content Moderator** (11 tests):
- Has content moderation permissions
- APPROVE_CAR, REJECT_CAR, FEATURE_CAR
- DELETE_REVIEW, RESTORE_REVIEW
- Has MODERATE_ANY

**Dealer** (9 tests):
- Has NO admin permissions
- Cannot DELETE_USER, SUSPEND_USER, etc.

**User (Buyer)** (13 tests):
- Has NO special permissions
- Cannot perform any administrative actions

**Superadmin** (5 tests):
- Has ALL permissions from enum

### 3. Role Hierarchy Tests (8 tests)
Verifies role permission inheritance and separation:
- ✅ Admin has all critical permissions
- ✅ Superadmin has ALL permissions
- ✅ Support has inquiry permissions
- ✅ Moderator has content permissions
- ✅ Dealer has NO admin permissions
- ✅ User has NO permissions
- ✅ All roles mapped
- ✅ MODERATE_ANY present in admin/support/moderator

### 4. Resource Ownership Tests (7 tests)
Tests resource access control:
- ✅ Owner can edit own resource
- ✅ Non-owner cannot edit others' resource (403)
- ✅ Admin with MODERATE_ANY can edit any resource
- ✅ Support with MODERATE_ANY can edit any resource
- ✅ Dealer can edit own dealership's cars
- ✅ Dealer cannot edit other dealership's cars (403)
- ✅ User can edit if in owner list

### 5. RequirePermissions Dependency Tests (6 tests)
Tests FastAPI dependency injection for permissions:
- ✅ Single permission check passes when granted
- ✅ Multiple permissions check passes when all granted
- ✅ Missing permission raises 403
- ✅ No MFA raises 403 (MFA enforcement)
- ✅ Security violation logged to audit
- ✅ Support agent permissions work

### 6. Edge Cases and Security Tests (5 tests)
Additional security verifications:
- ✅ Unknown role returns empty permissions
- ✅ Permission values are strings (serializable)
- ✅ Role permissions stored as sets
- ✅ Multiple owners checked correctly
- ✅ Critical permissions from audit covered

## Audit Issues Addressed

### C-02: Missing Permissions (CRITICAL)
**Issue**: Routes crash due to missing `REOPEN_INQUIRY` and `DELETE_INQUIRY` permissions.

**Tests**:
- `test_reopen_inquiry_permission_exists()`
- `test_delete_inquiry_permission_exists()`
- Permission matrix includes both permissions for admin role

**Verification**: Tests confirm permissions exist in enum and are assigned to admin role.

### C-03: Missing MODERATE_ANY (CRITICAL)
**Issue**: Missing `MODERATE_ANY` permission causes authorization bypass.

**Tests**:
- `test_moderate_any_permission_exists()`
- `test_admin_and_support_both_have_moderate_any()`
- `test_admin_can_edit_any_resource()`
- `test_support_can_edit_any_resource()`

**Verification**: Tests confirm MODERATE_ANY exists and allows bypassing resource ownership checks.

## Running Tests

### Prerequisites
- Python 3.11
- PostgreSQL running (Docker or local)
- Redis running (Docker or local)
- Backend dependencies installed

### Execute All RBAC Tests
```bash
cd backend
pytest tests/rbac/test_rbac_enforcement.py -v
```

### Execute Specific Test Categories
```bash
# Permission existence tests only
pytest tests/rbac/test_rbac_enforcement.py -k "permission_exists" -v

# Permission matrix tests only
pytest tests/rbac/test_rbac_enforcement.py -k "permission_matrix" -v

# Resource ownership tests only
pytest tests/rbac/test_rbac_enforcement.py -k "edit_resource" -v

# RequirePermissions dependency tests only
pytest tests/rbac/test_rbac_enforcement.py -k "require_permissions" -v
```

### With Coverage
```bash
pytest tests/rbac/test_rbac_enforcement.py --cov=app.shared.rbac --cov-report=html
```

## Test Patterns

### Parametrized Testing
The permission matrix uses parametrized testing to efficiently test all combinations:

```python
@pytest.mark.parametrize("role,permission,expected", [
    (RoleEnum.admin, PermissionEnum.DELETE_USER, True),
    (RoleEnum.dealer, PermissionEnum.DELETE_USER, False),
    # ... 70+ more combinations
])
def test_role_permission_matrix(role, permission, expected):
    permissions = get_role_permissions(role)
    has_permission = permission in permissions
    assert has_permission == expected
```

### Async Testing
Resource ownership and dependency tests use pytest-asyncio:

```python
@pytest.mark.asyncio
async def test_user_cannot_edit_others_resource():
    user = User(id=uuid.uuid4(), role=RoleEnum.user)
    
    with pytest.raises(CustomException) as exc_info:
        await assert_can_edit_resource(
            current_user=user,
            owner_user_ids=uuid.uuid4(),
            resource_name="inquiry"
        )
    
    assert exc_info.value.status_code == 403
```

### Mock Dependencies
FastAPI dependencies are mocked for isolated testing:

```python
request = Mock(spec=Request)
db = AsyncMock(spec=AsyncSession)

require_perm = RequirePermissions([PermissionEnum.DELETE_USER])
result = await require_perm(request, user, db)
```

## Coverage Goals

### Target Coverage
- **RBAC permissions module**: 100%
- **RBAC mappings module**: 100%
- **RBAC dependencies module**: 95%+

### What's Covered
- ✅ All permission existence checks
- ✅ All role × permission combinations
- ✅ Role hierarchy verification
- ✅ Resource ownership logic
- ✅ RequirePermissions dependency
- ✅ assert_can_edit_resource function
- ✅ MFA enforcement
- ✅ 403 response generation
- ✅ Audit logging on violation

### What's NOT Covered
- ❌ Integration with actual HTTP endpoints (covered in integration tests)
- ❌ Database persistence (covered in repository tests)
- ❌ Audit log table writes (covered in audit tests)

## Test Maintenance

### Adding New Permissions
1. Add permission to `PermissionEnum` in `/app/shared/rbac/permissions.py`
2. Add to appropriate role in `/app/shared/rbac/mappings.py`
3. Add parametrized test case to permission matrix:
   ```python
   (RoleEnum.admin, PermissionEnum.NEW_PERMISSION, True),
   (RoleEnum.dealer, PermissionEnum.NEW_PERMISSION, False),
   ```

### Adding New Roles
1. Add role to `RoleEnum` in `/app/shared/rbac/roles.py`
2. Add role mapping in `/app/shared/rbac/mappings.py`
3. Add test cases for new role in permission matrix
4. Update `test_all_roles_have_permission_mappings()`

### Modifying Role Permissions
1. Update role mapping in `/app/shared/rbac/mappings.py`
2. Update corresponding parametrized test cases
3. Run tests to verify no regressions

## Success Criteria

### Functional
- [x] All critical audit permissions verified (C-02, C-03)
- [x] All roles tested against all permissions
- [x] Role hierarchy verified
- [x] Resource ownership enforced
- [x] RequirePermissions dependency tested
- [x] MFA enforcement verified
- [x] 403 responses validated

### Coverage
- [x] 50+ permission matrix test cases
- [x] 6 permission existence tests
- [x] 8 role hierarchy tests
- [x] 7 resource ownership tests
- [x] 6 RequirePermissions tests
- [x] 5 edge case tests
- [x] **Total: 80+ test executions**

### Quality
- [x] Tests are isolated (no interdependencies)
- [x] Tests are fast (<5 seconds total)
- [x] Clear error messages on failure
- [x] Comprehensive documentation
- [x] CI integration ready

## Notes

- Tests use pytest fixtures from `/backend/tests/conftest.py`
- Async tests require `pytest-asyncio`
- Mocking uses `unittest.mock` (standard library)
- Tests follow arrange-act-assert pattern
- Test names describe what is tested
- Comments explain audit fix verification

## Related Files

- **RBAC Permissions**: `/backend/app/shared/rbac/permissions.py`
- **RBAC Mappings**: `/backend/app/shared/rbac/mappings.py`
- **RBAC Dependencies**: `/backend/app/shared/rbac/dependencies.py`
- **Role Enum**: `/backend/app/shared/rbac/roles.py`
- **Test Fixtures**: `/backend/tests/conftest.py`

## Authors

Created as part of Module 9: Testing  
Task 8: Backend RBAC Enforcement Tests (CRITICAL)
