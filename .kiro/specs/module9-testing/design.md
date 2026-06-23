# Module 9: Testing - Design Document

## Overview
Comprehensive testing implementation to bring TrustedCars from <15% backend coverage + 0% frontend/E2E coverage to production-ready test coverage levels.

## Current State

### Backend Tests
- **Coverage**: <15%
- **Existing**: ~25 test files mostly focused on admin RBAC
- **Location**: `/backend/tests/`
- **Framework**: pytest + httpx + pytest-asyncio
- **Missing**: Auth flows, MFA, service layer, repository layer, error cases

### Frontend Tests
- **Coverage**: 0%
- **Existing**: No test framework configured
- **Location**: `/frontend/src/` (no test files)
- **Needs**: Vitest + React Testing Library + MSW setup

### E2E Tests
- **Coverage**: 0%
- **Existing**: None
- **Needs**: Playwright setup + critical path tests

### Load Tests
- **Existing**: 6 k6 scripts in `/backend/tests/load/`
- **Status**: Not executed, no results documented
- **Needs**: Execution + results documentation

## Target State

### Backend Tests
- **Target Coverage**: 70%+
- **Focus Areas**:
  - Auth service (registration, OTP, login, token refresh, MFA)
  - RBAC permission enforcement (all permissions × all roles)
  - Repository layer (all modules)
  - Service layer error handling
  - Event outbox processing
  - Password reset flow
  - Email change verification

### Frontend Tests
- **Target Coverage**: 60%+
- **Focus Areas**:
  - Auth store and flows
  - Form validation (registration, login, car creation)
  - API client with MSW mocks
  - Critical components (CarCard, SearchFilters, InquiryForm)
  - Protected routes
  - Error handling

### E2E Tests
- **Target**: Critical user flows covered
- **Focus Areas**:
  - Registration → Email verification → Login
  - Dealer: Create car → Wait for approval
  - Buyer: Search → View car → Create inquiry
  - Admin: Review pending cars → Approve/reject
  - MFA enrollment and login

### Load Tests
- **Target**: Performance baseline established
- **Deliverables**:
  - k6 script execution results
  - Performance metrics report
  - Bottleneck identification
  - Recommendations

## Architecture

### Testing Layers

```
┌─────────────────────────────────────┐
│         E2E Tests (Playwright)       │
│  Full user flows, browser automation │
└─────────────────────────────────────┘
           ▲
           │
┌─────────────────────────────────────┐
│    Integration Tests (pytest)       │
│   API endpoints, database, Redis    │
└─────────────────────────────────────┘
           ▲
           │
┌──────────────────┬──────────────────┐
│  Backend Unit    │  Frontend Unit   │
│  (pytest)        │  (Vitest)        │
│  Services, Repos │  Components,     │
│                  │  Stores, Utils   │
└──────────────────┴──────────────────┘
```

## Implementation Plan

### Phase 1: Frontend Testing Infrastructure
**Goal**: Set up complete frontend testing environment

#### 1.1 Install Dependencies
```bash
npm install -D vitest @vitest/ui jsdom @testing-library/react @testing-library/jest-dom @testing-library/user-event msw
```

#### 1.2 Configure Vitest
- Create `vitest.config.ts`
- Configure jsdom environment
- Set up test utilities
- Configure coverage reporting

#### 1.3 Configure MSW (Mock Service Worker)
- Create MSW handlers for API mocking
- Set up MSW server for tests
- Create test fixtures

#### 1.4 Test Utilities
- Custom render function with providers
- Test data factories
- Assertion helpers

### Phase 2: Frontend Unit Tests
**Goal**: 60%+ coverage of critical frontend code

#### 2.1 Store Tests
- `authStore.ts`: Login, logout, token refresh, persistence
- Test state mutations
- Test async actions
- Test selectors

#### 2.2 API Client Tests
- `/shared/api/client.ts`: All endpoint methods
- Mock with MSW
- Test error handling
- Test request/response transformation

#### 2.3 Component Tests (Priority)
**Auth Components**:
- `Login.tsx`: Form submission, validation, error display
- `Register.tsx`: Multi-step form, validation
- `VerifyEmail.tsx`: OTP input, verification flow

**Car Components**:
- `CarCard.tsx`: Rendering, click handlers
- `SearchFilters.tsx`: Filter state, form submission
- `CreateCarForm.tsx`: Form validation, image upload

**Inquiry Components**:
- `InquiryForm.tsx`: Form submission, validation
- `InquiryCard.tsx`: Message display

**Admin Components**:
- `PendingCarsTable.tsx`: Data display, approve/reject actions

#### 2.4 Form Validation Tests
- Test Zod schemas with edge cases
- Test form error display
- Test submit handlers

### Phase 3: Backend Test Expansion
**Goal**: 70%+ coverage, all critical paths tested

#### 3.1 Auth Service Tests
File: `/backend/tests/auth/test_auth_service.py` (CREATE)

Test cases:
- `test_register_user_success`: Full registration flow
- `test_register_duplicate_email`: Unique constraint
- `test_verify_email_valid_otp`: OTP verification success
- `test_verify_email_invalid_otp`: OTP verification failure
- `test_verify_email_expired_otp`: OTP expiration
- `test_login_success`: Successful login with cookies
- `test_login_invalid_credentials`: Wrong password
- `test_login_unverified_email`: Login before verification
- `test_refresh_token_success`: Token refresh flow
- `test_refresh_token_invalid`: Invalid refresh token
- `test_logout_success`: Token revocation
- `test_password_reset_flow`: Request → Verify → Reset
- `test_mfa_enroll_success`: MFA enrollment
- `test_mfa_verify_success`: MFA verification
- `test_mfa_login_success`: Login with MFA
- `test_mfa_backup_codes`: Backup code generation and usage

#### 3.2 RBAC Tests
File: `/backend/tests/rbac/test_rbac_enforcement.py` (CREATE)

Test matrix: Every permission × every role
- Test `RequirePermissions` dependency
- Test `assert_can_edit_resource` function
- Test role hierarchy (admin inherits dealer permissions)
- Test permission denial (403 responses)

```python
@pytest.mark.parametrize("role,permission,expected", [
    ("admin", "DELETE_USER", True),
    ("dealer", "DELETE_USER", False),
    ("buyer", "CREATE_CAR", False),
    # ... all combinations
])
def test_permission_enforcement(role, permission, expected):
    ...
```

#### 3.3 Repository Tests
Files: Create test for each repository
- `/backend/tests/auth/test_auth_repository.py`
- `/backend/tests/cars/test_cars_repository.py`
- `/backend/tests/inquiries/test_inquiries_repository.py`

Test cases per repository:
- CRUD operations
- Filtering and pagination
- Unique constraints
- Soft delete behavior
- Relationships (selectinload)

#### 3.4 Service Layer Tests
Files: Create test for each service
- `/backend/tests/cars/test_cars_service.py`
- `/backend/tests/inquiries/test_inquiries_service.py`
- `/backend/tests/reviews/test_reviews_service.py`

Test cases:
- Business logic validation
- Authorization checks
- Event emission (outbox)
- Error handling
- Transaction rollback on errors

#### 3.5 Event Outbox Tests
File: `/backend/tests/outbox/test_outbox_processing.py` (CREATE)

Test cases:
- Event creation during transaction
- Worker processes events in order
- Idempotency (duplicate processing)
- Retry logic on failure
- Event cascading (user deletion → car deletion)

#### 3.6 Integration Tests
File: `/backend/tests/integration/test_critical_flows.py` (CREATE)

Test complete workflows:
- Registration → Verification → Login → Protected action
- Car creation → Admin approval → Car becomes available
- Inquiry creation → Dealer response → Buyer reply
- MFA enrollment → Login with MFA → Protected action
- Password reset → Login with new password

### Phase 4: E2E Test Setup
**Goal**: Playwright configured and ready

#### 4.1 Install Playwright
```bash
cd frontend
npm install -D @playwright/test
npx playwright install
```

#### 4.2 Configure Playwright
- Create `playwright.config.ts`
- Set up test environment variables
- Configure base URL
- Set up fixtures for auth

#### 4.3 Test Utilities
- Authentication helpers (login, logout)
- Navigation helpers
- Data setup helpers (create test users, cars)
- Screenshot/video on failure

### Phase 5: E2E Critical Path Tests
**Goal**: All critical user journeys tested end-to-end

#### 5.1 Registration and Auth Flow
File: `/frontend/e2e/auth.spec.ts`

Tests:
- Complete registration flow with email verification
- Login with valid credentials
- Login with invalid credentials
- Token refresh on page reload
- Logout

#### 5.2 Dealer Flow
File: `/frontend/e2e/dealer.spec.ts`

Tests:
- Dealer creates a car listing
- Upload multiple images
- Car appears in "Pending Approval" state
- Dealer views their listings

#### 5.3 Buyer Flow
File: `/frontend/e2e/buyer.spec.ts`

Tests:
- Search for cars with filters
- View car details
- Create inquiry
- View inquiry in dashboard
- Receive response from dealer

#### 5.4 Admin Flow
File: `/frontend/e2e/admin.spec.ts`

Tests:
- View pending cars
- Approve a car
- Reject a car with reason
- View audit logs
- Suspend a user

#### 5.5 MFA Flow
File: `/frontend/e2e/mfa.spec.ts`

Tests:
- Enroll in MFA
- Scan QR code (mock)
- Verify TOTP code
- Login with MFA
- Use backup code

### Phase 6: Load Testing Execution
**Goal**: Performance baseline established

#### 6.1 Execute Load Tests
Run all 6 k6 scripts:
1. `auth_load.js`: Authentication endpoints
2. `cars_search_load.js`: Car search under load
3. `create_cars_load.js`: Car creation throughput
4. `inquiries_load.js`: Inquiry creation and retrieval
5. `mixed_load.js`: Realistic mixed traffic
6. `spike_test.js`: Sudden traffic spike handling

#### 6.2 Document Results
Create `/backend/tests/load/RESULTS.md`:
- Performance metrics (p95, p99 latency)
- Throughput (requests/second)
- Error rates
- Resource utilization (CPU, memory)
- Bottlenecks identified
- Recommendations

## Test Data Management

### Backend Test Data
- Use pytest fixtures for consistent test data
- Factories for creating test objects
- Database cleanup between tests
- Transaction rollback for isolation

### Frontend Test Data
- MSW handlers with mock data
- Test fixtures for common scenarios
- Factory functions for dynamic data

### E2E Test Data
- Seed database with test data before tests
- Clean up after test suite
- Isolated test users (e2e_buyer_1, e2e_dealer_1, etc.)

## Coverage Targets

### Backend
- **Overall**: 70%+
- **Critical modules** (auth, cars, inquiries): 85%+
- **Repositories**: 80%+
- **Services**: 75%+

### Frontend
- **Overall**: 60%+
- **Stores**: 80%+
- **Critical components**: 70%+
- **Forms**: 75%+

### E2E
- **Critical paths**: 100% coverage
- **5 major user flows**: All tested

## Success Criteria

### Functional
- [ ] All critical auth flows tested (registration, login, MFA, password reset)
- [ ] RBAC enforcement verified for all permissions
- [ ] Complete car lifecycle tested
- [ ] Complete inquiry lifecycle tested
- [ ] Event outbox processing verified
- [ ] Frontend auth flows tested
- [ ] Frontend forms validated
- [ ] E2E tests for all user types (buyer, dealer, admin)

### Coverage
- [ ] Backend: 70%+ coverage
- [ ] Frontend: 60%+ coverage
- [ ] E2E: All critical paths covered

### Quality
- [ ] All tests pass consistently
- [ ] Tests are isolated (no interdependencies)
- [ ] Tests are fast (<5 min total)
- [ ] Clear error messages on failure
- [ ] CI integration ready

### Documentation
- [ ] Test README created
- [ ] Load test results documented
- [ ] Coverage reports generated
- [ ] Test execution instructions

## Risks and Mitigations

### Risk: Flaky E2E Tests
**Mitigation**: 
- Use explicit waits
- Retry logic for network calls
- Stable selectors (data-testid)
- Isolated test data

### Risk: Slow Test Suite
**Mitigation**:
- Parallel test execution
- Fast test database (in-memory for unit tests)
- Selective E2E test runs
- Cache dependencies

### Risk: Test Maintenance Burden
**Mitigation**:
- DRY test utilities
- Clear test organization
- Good test naming
- Documentation

## Deliverables

1. **Frontend Testing Infrastructure**
   - `vitest.config.ts`
   - `setupTests.ts`
   - `testUtils.tsx`
   - MSW handlers

2. **Frontend Tests**
   - Store tests (3 files)
   - Component tests (12+ files)
   - API client tests (1 file)

3. **Backend Tests**
   - Auth service tests (expanded)
   - RBAC tests (comprehensive)
   - Repository tests (5 files)
   - Service tests (5 files)
   - Integration tests (1 file)
   - Outbox tests (1 file)

4. **E2E Tests**
   - `playwright.config.ts`
   - Auth flow tests
   - Dealer flow tests
   - Buyer flow tests
   - Admin flow tests
   - MFA flow tests

5. **Load Test Results**
   - `RESULTS.md` with metrics
   - Performance recommendations
   - Bottleneck analysis

6. **Documentation**
   - `/backend/tests/README.md`
   - `/frontend/tests/README.md`
   - `/frontend/e2e/README.md`
   - Module 9 completion report

## Estimation

- **Phase 1** (Frontend infrastructure): 2 hours
- **Phase 2** (Frontend tests): 6 hours
- **Phase 3** (Backend tests): 8 hours
- **Phase 4** (E2E setup): 2 hours
- **Phase 5** (E2E tests): 6 hours
- **Phase 6** (Load tests): 2 hours
- **Documentation**: 2 hours

**Total**: ~28 hours (3.5 days)

## Notes

- Use existing test patterns from `/backend/tests/admin/` as reference
- Reuse existing conftest.py fixtures
- Follow pytest best practices (arrange-act-assert)
- Frontend tests follow Testing Library philosophy (test user behavior)
- E2E tests use Page Object Model for maintainability
