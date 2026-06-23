# Module 9: Testing - Requirements

## Problem Statement

The TrustedCars application has **severely insufficient test coverage**:
- **Backend**: <15% coverage (only ~25 admin-focused tests)
- **Frontend**: 0% coverage (no test framework configured)
- **E2E**: 0% coverage (no E2E tests)
- **Load testing**: Scripts exist but never executed

This creates **critical risks**:
1. **Regression risk**: Code changes can break existing functionality undetected
2. **Deployment risk**: No confidence that critical paths work correctly
3. **Security risk**: RBAC and auth flows not verified
4. **Performance unknowns**: No baseline performance metrics
5. **Maintenance burden**: Manual testing is time-consuming and incomplete

## Goals

### Primary Goals
1. **Establish baseline test coverage**
   - Backend: 70%+ coverage
   - Frontend: 60%+ coverage
   - E2E: All critical paths covered

2. **Verify critical security**
   - All auth flows tested (registration, login, MFA, password reset)
   - RBAC enforcement verified for all permissions
   - Input validation tested

3. **Ensure business logic correctness**
   - Car lifecycle (create → approve → update → sell → delete)
   - Inquiry workflow (create → message → close → reopen)
   - Event processing (outbox pattern verification)

4. **Establish performance baseline**
   - Execute load tests
   - Document performance metrics
   - Identify bottlenecks

### Secondary Goals
1. Create maintainable test infrastructure
2. Enable fast feedback loop for developers
3. CI/CD integration ready
4. Comprehensive test documentation

## Functional Requirements

### FR-1: Frontend Test Infrastructure
**Priority**: HIGH

The frontend must have a complete testing environment:
- **FR-1.1**: Vitest configured with jsdom environment
- **FR-1.2**: React Testing Library configured
- **FR-1.3**: MSW (Mock Service Worker) configured for API mocking
- **FR-1.4**: Test utilities (custom render, factories, helpers)
- **FR-1.5**: Coverage reporting configured
- **FR-1.6**: Test scripts in package.json

**Acceptance Criteria**:
- `npm run test` executes all frontend tests
- `npm run test:coverage` generates coverage report
- MSW intercepts API calls during tests
- Tests run in watch mode during development

### FR-2: Frontend Unit Tests
**Priority**: HIGH

Critical frontend components and logic must be tested:

#### FR-2.1: Auth Store Tests
- Login action updates state correctly
- Logout clears user data
- Token refresh works
- State persists to localStorage
- Hydration from storage works

#### FR-2.2: API Client Tests
- All endpoint methods call correct URLs
- Request bodies are formatted correctly
- Responses are parsed correctly
- Error handling works
- Authentication headers included

#### FR-2.3: Component Tests - Auth
- `Login.tsx`: Form submission, validation, error display
- `Register.tsx`: Step progression, validation
- `VerifyEmail.tsx`: OTP input, auto-submit

#### FR-2.4: Component Tests - Cars
- `CarCard.tsx`: Renders data correctly, click handlers
- `SearchFilters.tsx`: Filter state management
- `CreateCarForm.tsx`: Form validation, image upload

#### FR-2.5: Component Tests - Inquiries
- `InquiryForm.tsx`: Submission, validation
- `InquiryCard.tsx`: Message display

#### FR-2.6: Component Tests - Admin
- `PendingCarsTable.tsx`: Approve/reject actions

**Acceptance Criteria**:
- 60%+ overall frontend coverage
- 80%+ store coverage
- 70%+ component coverage
- All critical user interactions tested
- All form validations tested

### FR-3: Backend Test Expansion
**Priority**: HIGH

Backend tests must comprehensively cover business logic:

#### FR-3.1: Auth Service Tests
Complete test coverage for authentication:
- User registration (success, duplicate email)
- Email verification (valid OTP, invalid OTP, expired OTP)
- Login (success, invalid credentials, unverified email)
- Token refresh (success, invalid token, expired token)
- Logout (token revocation)
- Password reset flow (request → verify → reset)
- MFA enrollment
- MFA verification  
- MFA login
- MFA backup codes

**Test count**: Minimum 20 test cases

#### FR-3.2: RBAC Enforcement Tests
Test permission matrix comprehensively:
- Test every permission against every role
- Verify admin inherits dealer permissions
- Verify dealers inherit buyer permissions
- Test resource ownership checks
- Test `RequirePermissions` dependency
- Test `assert_can_edit_resource` function

**Test count**: Minimum 50 test cases (permission × role combinations)

#### FR-3.3: Repository Tests
Test data layer for all modules:
- CRUD operations
- Filtering and search
- Pagination
- Sorting
- Unique constraints
- Foreign key constraints
- Soft delete behavior
- Relationship loading (selectinload)

**Modules to test**:
- Auth repository
- Cars repository
- Inquiries repository
- Reviews repository
- Wishlist repository

**Test count**: Minimum 10 test cases per repository (50 total)

#### FR-3.4: Service Layer Tests
Test business logic for all modules:
- Business rule validation
- Authorization checks
- Event emission (outbox)
- Error handling
- Transaction behavior
- Side effects

**Modules to test**:
- Cars service
- Inquiries service
- Reviews service
- Wishlist service
- Users service

**Test count**: Minimum 15 test cases per service (75 total)

#### FR-3.5: Event Outbox Tests
Verify event-driven architecture:
- Events created during transactions
- Worker processes events
- Idempotent processing
- Retry on failure
- Event ordering
- Cascade events (user deletion → car deletion)

**Test count**: Minimum 10 test cases

#### FR-3.6: Integration Tests
Test complete workflows end-to-end (API level):
- Registration → verification → login → protected action
- Car creation → approval → availability
- Inquiry creation → dealer response → buyer reply
- MFA enrollment → login with MFA
- Password reset → login with new password

**Test count**: Minimum 10 integration tests

**Acceptance Criteria**:
- 70%+ overall backend coverage
- 85%+ coverage for auth, cars, inquiries modules
- 80%+ repository coverage
- 75%+ service coverage
- All critical paths tested
- All error cases tested

### FR-4: E2E Test Infrastructure
**Priority**: MEDIUM

End-to-end testing must be configured:
- **FR-4.1**: Playwright installed and configured
- **FR-4.2**: Test environment variables configured
- **FR-4.3**: Base URL configured (test server)
- **FR-4.4**: Auth fixtures (login helpers)
- **FR-4.5**: Data setup helpers (create test users, cars)
- **FR-4.6**: Screenshot/video on failure configured

**Acceptance Criteria**:
- `npx playwright test` executes E2E tests
- Tests run against local dev environment
- Failed tests produce screenshots
- HTML report generated

### FR-5: E2E Critical Path Tests
**Priority**: MEDIUM

All critical user journeys must be tested:

#### FR-5.1: Auth Flow Tests
- Complete registration with email verification
- Login with valid credentials
- Login with invalid credentials (shows error)
- Token persistence across page reload
- Logout clears session

#### FR-5.2: Dealer Flow Tests
- Dealer creates car listing
- Upload multiple images
- Car appears in "Pending" state
- Dealer views their listings
- Dealer edits their car

#### FR-5.3: Buyer Flow Tests
- Search cars with filters
- View car details
- Create inquiry
- View inquiry in dashboard
- See dealer response

#### FR-5.4: Admin Flow Tests
- View pending cars
- Approve a car
- Reject a car with reason
- View audit logs
- Suspend a user

#### FR-5.5: MFA Flow Tests
- Enroll in MFA
- Display QR code
- Verify TOTP code
- Login with MFA required
- Use backup code

**Acceptance Criteria**:
- 5 major user flows tested
- All critical paths execute successfully
- Tests are stable (no flakiness)
- Tests run in under 10 minutes

### FR-6: Load Test Execution
**Priority**: MEDIUM

Existing k6 load tests must be executed and documented:

#### FR-6.1: Execute Load Tests
Run all 6 k6 scripts:
- `auth_load.js`: Auth endpoint load
- `cars_search_load.js`: Search performance
- `create_cars_load.js`: Car creation throughput
- `inquiries_load.js`: Inquiry performance
- `mixed_load.js`: Realistic traffic mix
- `spike_test.js`: Traffic spike handling

#### FR-6.2: Document Results
Create comprehensive results document:
- Performance metrics (p50, p95, p99 latency)
- Throughput (requests/second)
- Error rates
- Resource utilization
- Bottlenecks identified
- Recommendations

**Acceptance Criteria**:
- All 6 load tests executed
- Results documented with metrics
- Performance baseline established
- Bottlenecks identified
- Recommendations provided

## Non-Functional Requirements

### NFR-1: Test Performance
**Priority**: HIGH

Tests must execute quickly to enable fast feedback:
- Backend unit tests: Complete in <2 minutes
- Frontend unit tests: Complete in <1 minute
- E2E tests: Complete in <10 minutes
- Full test suite: Complete in <15 minutes

### NFR-2: Test Isolation
**Priority**: HIGH

Tests must be isolated and independent:
- No shared state between tests
- Database reset between tests
- No test interdependencies
- Deterministic results (no flakiness)
- Can run tests in any order
- Can run tests in parallel

### NFR-3: Test Maintainability
**Priority**: MEDIUM

Tests must be maintainable long-term:
- Clear test names (describe what is tested)
- DRY principle (reuse utilities)
- Good test organization (logical grouping)
- Minimal mocking (test real behavior when possible)
- Self-documenting (clear arrange-act-assert)

### NFR-4: CI/CD Integration
**Priority**: HIGH

Tests must be ready for CI/CD:
- Exit with non-zero on failure
- Generate machine-readable output
- Generate coverage reports
- Can run in Docker container
- No manual intervention needed

### NFR-5: Documentation
**Priority**: MEDIUM

Test infrastructure must be well-documented:
- README in each test directory
- Setup instructions
- Execution instructions
- Troubleshooting guide
- Coverage report instructions

## Constraints

### Technical Constraints
1. Use pytest for backend tests (existing framework)
2. Use Vitest for frontend tests (Vite-native)
3. Use Playwright for E2E tests (modern, reliable)
4. Use k6 for load tests (already implemented)
5. Tests must work in CI environment (GitHub Actions)

### Resource Constraints
1. E2E tests should not require external services
2. Load tests should not impact production
3. Test databases should be isolated
4. Test execution should not exceed 15 minutes

### Compatibility Constraints
1. Tests must work on Linux (CI environment)
2. Frontend tests must work in jsdom (no real browser)
3. E2E tests require Chromium (Playwright default)

## Success Metrics

### Coverage Metrics
- [ ] Backend coverage: 70%+ (current: <15%)
- [ ] Frontend coverage: 60%+ (current: 0%)
- [ ] E2E critical paths: 100% coverage (current: 0%)

### Quality Metrics
- [ ] All tests passing
- [ ] Zero flaky tests
- [ ] Test execution time <15 minutes
- [ ] Zero critical bugs found in production

### Documentation Metrics
- [ ] Test README created (3 files minimum)
- [ ] Load test results documented
- [ ] Coverage reports generated
- [ ] Completion report created

## Out of Scope

The following are explicitly **out of scope** for this module:

1. **Visual regression testing** - Would require screenshot comparison infrastructure
2. **Mobile responsive testing** - E2E tests focus on desktop
3. **Cross-browser testing** - Playwright tests use Chromium only
4. **Accessibility testing** - Would require additional tooling (axe-core)
5. **Security penetration testing** - Requires specialized security tools
6. **Performance optimization** - Load tests document baseline, not optimize
7. **Test data generation tools** - Use simple factories, not complex generators
8. **Mutation testing** - Advanced coverage technique, not needed initially
9. **Contract testing** - API contract testing with Pact or similar
10. **Chaos engineering** - Fault injection testing for resilience

## Dependencies

### External Dependencies
- Vitest (frontend test framework)
- @testing-library/react (component testing)
- @testing-library/user-event (user interaction simulation)
- MSW (API mocking)
- Playwright (E2E testing)
- pytest (already installed)
- httpx (already installed)

### Internal Dependencies
- Working development environment
- Database migrations applied
- Redis running
- MinIO running
- Backend API running (for E2E tests)
- Frontend dev server running (for E2E tests)

### Blocked By
- No blocking dependencies

### Blocks
- Production deployment (should not deploy without tests)
- CI/CD pipeline completion (needs test execution)

## Assumptions

1. Test database can be reset between tests
2. Redis can be cleared between tests
3. S3/MinIO can use test bucket
4. Email service can be mocked (no real emails)
5. External APIs (if any) can be mocked
6. Developers will maintain tests going forward
7. CI environment has sufficient resources (CPU, memory)

## Risks

### High Risk
1. **E2E test flakiness**: E2E tests are notoriously flaky
   - **Mitigation**: Use explicit waits, stable selectors, retry logic

2. **Test execution time**: Comprehensive tests may be slow
   - **Mitigation**: Parallel execution, fast test database, selective runs

### Medium Risk
3. **Test maintenance burden**: Large test suite requires maintenance
   - **Mitigation**: DRY utilities, clear organization, good documentation

4. **Coverage obsession**: Chasing 100% coverage vs. meaningful tests
   - **Mitigation**: Focus on critical paths, not arbitrary coverage numbers

### Low Risk
5. **Tool learning curve**: Team needs to learn testing tools
   - **Mitigation**: Documentation, examples, pair programming

## Open Questions

1. **Load test target**: What is acceptable p95 latency? 
   - **Decision needed**: Define SLAs/SLOs for API endpoints

2. **E2E test frequency**: Run on every commit or nightly?
   - **Recommendation**: Unit/integration on every commit, E2E nightly or pre-deploy

3. **Test data strategy**: Factories vs. fixtures vs. seeds?
   - **Recommendation**: Factories for flexibility, fixtures for consistency

4. **Coverage enforcement**: Fail build if coverage drops?
   - **Recommendation**: Not initially, establish baseline first

## References

### Audit Issues Addressed
- Testing Audit: Backend <15%, Frontend 0%, E2E 0%
- Missing critical test cases (10 listed in audit)
- Priority 1 test plan (auth, RBAC, data integrity)

### Related Modules
- Module 1: Authentication (auth flows need testing)
- Module 2: Authorization (RBAC needs testing)
- Module 3: Backend APIs (endpoints need testing)
- Module 8: Infrastructure (load tests verify deployment readiness)

### Standards
- pytest best practices
- Testing Library guiding principles
- Playwright best practices
- k6 load testing patterns
