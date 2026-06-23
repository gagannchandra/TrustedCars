# Module 9: Testing - Tasks

## Task 1: Frontend Testing Infrastructure Setup
**Depends on**: None  
**Priority**: HIGH  
**Estimated time**: 2 hours

### Objectives
- Install all frontend testing dependencies
- Configure Vitest with jsdom environment
- Set up MSW for API mocking
- Create test utilities and helpers
- Configure coverage reporting
- Add test scripts to package.json

### Sub-tasks
1.1. Install testing dependencies (Vitest, Testing Library, MSW)
1.2. Create `vitest.config.ts` with jsdom environment
1.3. Create `src/test/setup.ts` with global test setup
1.4. Create `src/test/utils.tsx` with custom render and helpers
1.5. Create `src/test/mocks/handlers.ts` with MSW API handlers
1.6. Create `src/test/mocks/server.ts` with MSW server setup
1.7. Create `src/test/factories.ts` with test data factories
1.8. Update `package.json` with test scripts
1.9. Create `src/test/README.md` with testing documentation

### Acceptance Criteria
- [x] `npm run test` executes tests successfully
- [ ] `npm run test:coverage` generates coverage report
- [ ] MSW intercepts API calls during tests
- [ ] Test utilities work correctly
- [ ] Sample test passes

### Files to Create
- `/frontend/vitest.config.ts`
- `/frontend/src/test/setup.ts`
- `/frontend/src/test/utils.tsx`
- `/frontend/src/test/mocks/handlers.ts`
- `/frontend/src/test/mocks/server.ts`
- `/frontend/src/test/factories.ts`
- `/frontend/src/test/README.md`

### Files to Modify
- `/frontend/package.json` (add test scripts)

---

## Task 2: Frontend Store Tests
**Depends on**: Task 1  
**Priority**: HIGH  
**Estimated time**: 3 hours

### Objectives
- Test authStore login, logout, token refresh
- Test state persistence to localStorage
- Test state hydration from storage
- Test error handling in async actions

### Sub-tasks
2.1. Create `src/store/__tests__/authStore.test.ts`
2.2. Test login action (success case)
2.3. Test login action (error case)
2.4. Test logout action
2.5. Test token refresh
2.6. Test localStorage persistence
2.7. Test hydration from localStorage
2.8. Test initial state
2.9. Test user data updates

### Acceptance Criteria
- [ ] authStore has 80%+ coverage
- [ ] All state mutations tested
- [ ] All async actions tested
- [ ] Persistence tested
- [ ] Error cases tested

### Files to Create
- `/frontend/src/store/__tests__/authStore.test.ts`

---

## Task 3: Frontend API Client Tests
**Depends on**: Task 1  
**Priority**: HIGH  
**Estimated time**: 2 hours

### Objectives
- Test all API client methods
- Test request formatting
- Test response parsing
- Test error handling
- Use MSW to mock API responses

### Sub-tasks
3.1. Create `src/shared/api/__tests__/client.test.ts`
3.2. Test auth endpoints (login, register, logout)
3.3. Test car endpoints (search, get, create, update)
3.4. Test inquiry endpoints (create, list, update)
3.5. Test error handling (401, 403, 404, 500)
3.6. Test request headers (auth token)
3.7. Test request body formatting

### Acceptance Criteria
- [ ] API client has 70%+ coverage
- [ ] All endpoints tested
- [ ] MSW mocks work correctly
- [ ] Error handling tested
- [ ] Auth headers tested

### Files to Create
- `/frontend/src/shared/api/__tests__/client.test.ts`

---

## Task 4: Frontend Auth Component Tests
**Depends on**: Task 1  
**Priority**: HIGH  
**Estimated time**: 3 hours

### Objectives
- Test Login component (form submission, validation, errors)
- Test Register component (multi-step form, validation)
- Test VerifyEmail component (OTP input, verification)

### Sub-tasks
4.1. Create `src/features/auth/pages/__tests__/Login.test.tsx`
4.2. Test Login: successful login redirects to dashboard
4.3. Test Login: shows error on invalid credentials
4.4. Test Login: form validation (empty fields)
4.5. Test Login: demo credentials work

4.6. Create `src/features/auth/pages/__tests__/Register.test.tsx`
4.7. Test Register: step 1 validation (email, password)
4.8. Test Register: password strength validation
4.9. Test Register: successful registration shows OTP screen

4.10. Create `src/features/auth/pages/__tests__/VerifyEmail.test.tsx`
4.11. Test VerifyEmail: OTP input accepts 6 digits
4.12. Test VerifyEmail: verification success redirects
4.13. Test VerifyEmail: shows error on invalid OTP

### Acceptance Criteria
- [ ] Login component has 70%+ coverage
- [ ] Register component has 70%+ coverage
- [ ] VerifyEmail component has 70%+ coverage
- [ ] All user interactions tested
- [ ] Form validation tested
- [ ] Error states tested

### Files to Create
- `/frontend/src/features/auth/pages/__tests__/Login.test.tsx`
- `/frontend/src/features/auth/pages/__tests__/Register.test.tsx`
- `/frontend/src/features/auth/pages/__tests__/VerifyEmail.test.tsx`

---

## Task 5: Frontend Car Component Tests
**Depends on**: Task 1  
**Priority**: MEDIUM  
**Estimated time**: 3 hours

### Objectives
- Test CarCard component rendering and interactions
- Test SearchFilters component state and submission
- Test CreateCarForm component validation and submission

### Sub-tasks
5.1. Create `src/features/cars/components/__tests__/CarCard.test.tsx`
5.2. Test CarCard: renders car data correctly
5.3. Test CarCard: click handler works
5.4. Test CarCard: displays correct status badges

5.5. Create `src/features/cars/components/__tests__/SearchFilters.test.tsx`
5.6. Test SearchFilters: filter state updates
5.7. Test SearchFilters: form submission
5.8. Test SearchFilters: reset filters

5.9. Create `src/features/cars/pages/__tests__/CreateCarForm.test.tsx`
5.10. Test CreateCarForm: form validation
5.11. Test CreateCarForm: image upload
5.12. Test CreateCarForm: successful submission
5.13. Test CreateCarForm: error handling

### Acceptance Criteria
- [ ] CarCard has 70%+ coverage
- [ ] SearchFilters has 70%+ coverage
- [ ] CreateCarForm has 70%+ coverage
- [ ] Rendering tested
- [ ] User interactions tested
- [ ] Form validation tested

### Files to Create
- `/frontend/src/features/cars/components/__tests__/CarCard.test.tsx`
- `/frontend/src/features/cars/components/__tests__/SearchFilters.test.tsx`
- `/frontend/src/features/cars/pages/__tests__/CreateCarForm.test.tsx`

---

## Task 6: Frontend Admin Component Tests
**Depends on**: Task 1  
**Priority**: MEDIUM  
**Estimated time**: 2 hours

### Objectives
- Test PendingCarsTable component
- Test approve/reject actions
- Test data display

### Sub-tasks
6.1. Create `src/features/admin/components/__tests__/PendingCarsTable.test.tsx`
6.2. Test PendingCarsTable: renders car data
6.3. Test PendingCarsTable: approve button works
6.4. Test PendingCarsTable: reject button opens dialog
6.5. Test PendingCarsTable: reject with reason submits
6.6. Test PendingCarsTable: empty state

### Acceptance Criteria
- [ ] PendingCarsTable has 70%+ coverage
- [ ] Actions tested
- [ ] Data rendering tested
- [ ] Empty state tested

### Files to Create
- `/frontend/src/features/admin/components/__tests__/PendingCarsTable.test.tsx`

---

## Task 7: Backend Auth Service Tests
**Depends on**: None  
**Priority**: HIGH  
**Estimated time**: 4 hours

### Objectives
- Comprehensive test coverage for auth service
- Test all authentication flows
- Test MFA enrollment and verification
- Test password reset flow
- Test error cases

### Sub-tasks
7.1. Create `tests/auth/test_auth_service.py`
7.2. Test user registration (success)
7.3. Test user registration (duplicate email)
7.4. Test email verification (valid OTP)
7.5. Test email verification (invalid OTP)
7.6. Test email verification (expired OTP)
7.7. Test login (success with cookies)
7.8. Test login (invalid credentials)
7.9. Test login (unverified email)
7.10. Test login (suspended user)
7.11. Test token refresh (success)
7.12. Test token refresh (invalid token)
7.13. Test token refresh (expired token)
7.14. Test logout (token revocation)
7.15. Test password reset request
7.16. Test password reset verification
7.17. Test password reset completion
7.18. Test MFA enrollment
7.19. Test MFA verification (valid code)
7.20. Test MFA verification (invalid code)
7.21. Test MFA login flow
7.22. Test MFA backup code generation
7.23. Test MFA backup code usage

### Acceptance Criteria
- [ ] 23+ test cases for auth service
- [ ] Auth service has 85%+ coverage
- [ ] All flows tested end-to-end
- [ ] All error cases covered
- [ ] Cookie handling tested

### Files to Create
- `/backend/tests/auth/test_auth_service.py`

---

## Task 8: Backend RBAC Enforcement Tests
**Depends on**: None  
**Priority**: HIGH  
**Estimated time**: 3 hours

### Objectives
- Test RBAC permission enforcement comprehensively
- Test all permission × role combinations
- Test role hierarchy
- Test resource ownership checks

### Sub-tasks
8.1. Create `tests/rbac/test_rbac_enforcement.py`
8.2. Create permission matrix test (parametrized)
8.3. Test admin has all permissions
8.4. Test admin inherits dealer permissions
8.5. Test dealer has car management permissions
8.6. Test dealer cannot access admin functions
8.7. Test buyer has basic permissions only
8.8. Test buyer cannot create cars
8.9. Test RequirePermissions dependency
8.10. Test assert_can_edit_resource function
8.11. Test resource ownership (user can edit their own resources)
8.12. Test resource ownership denial (user cannot edit others' resources)
8.13. Test MODERATE_ANY permission for admins

### Acceptance Criteria
- [ ] 50+ test cases covering permission matrix
- [ ] All permissions tested against all roles
- [ ] Role hierarchy verified
- [ ] Ownership checks verified
- [ ] 403 responses tested

### Files to Create
- `/backend/tests/rbac/test_rbac_enforcement.py`

---

## Task 9: Backend Repository Tests
**Depends on**: None  
**Priority**: MEDIUM  
**Estimated time**: 4 hours

### Objectives
- Test data layer for all repositories
- Test CRUD operations
- Test filtering, pagination, sorting
- Test constraints and relationships

### Sub-tasks
9.1. Create `tests/cars/test_cars_repository.py`
9.2. Test create car
9.3. Test get car by ID (with selectinload)
9.4. Test update car
9.5. Test delete car (soft delete)
9.6. Test search cars with filters
9.7. Test pagination
9.8. Test sorting

9.9. Create `tests/inquiries/test_inquiries_repository.py`
9.10. Test create inquiry
9.11. Test get inquiries by user
9.12. Test get inquiries by car
9.13. Test update inquiry status
9.14. Test soft delete inquiry

9.15. Create `tests/reviews/test_reviews_repository.py`
9.16. Test create review
9.17. Test get reviews by car
9.18. Test unique constraint (one review per user per car)
9.19. Test soft delete review

### Acceptance Criteria
- [ ] 3 repository test files created
- [ ] 10+ tests per repository
- [ ] CRUD operations tested
- [ ] Filtering tested
- [ ] Pagination tested
- [ ] Constraints tested

### Files to Create
- `/backend/tests/cars/test_cars_repository.py`
- `/backend/tests/inquiries/test_inquiries_repository.py`
- `/backend/tests/reviews/test_reviews_repository.py`

---

## Task 10: Backend Service Layer Tests
**Depends on**: None  
**Priority**: MEDIUM  
**Estimated time**: 4 hours

### Objectives
- Test business logic in service layer
- Test authorization checks
- Test event emission (outbox)
- Test error handling

### Sub-tasks
10.1. Create `tests/cars/test_cars_service.py`
10.2. Test create car (emits event)
10.3. Test update car (authorization check)
10.4. Test delete car (emits cascade event)
10.5. Test approve car (admin only)
10.6. Test reject car (admin only)

10.7. Create `tests/inquiries/test_inquiries_service.py`
10.8. Test create inquiry
10.9. Test reply to inquiry
10.10. Test close inquiry
10.11. Test reopen inquiry (authorization)

10.12. Create `tests/reviews/test_reviews_service.py`
10.13. Test create review
10.14. Test update review (own review only)
10.15. Test delete review

### Acceptance Criteria
- [ ] 3 service test files created
- [ ] 15+ tests per service
- [ ] Business logic tested
- [ ] Authorization tested
- [ ] Event emission verified
- [ ] Error handling tested

### Files to Create
- `/backend/tests/cars/test_cars_service.py`
- `/backend/tests/inquiries/test_inquiries_service.py`
- `/backend/tests/reviews/test_reviews_service.py`

---

## Task 11: Backend Event Outbox Tests
**Depends on**: None  
**Priority**: MEDIUM  
**Estimated time**: 2 hours

### Objectives
- Test event-driven architecture
- Test outbox pattern implementation
- Test idempotent processing
- Test event cascading

### Sub-tasks
11.1. Create `tests/outbox/test_outbox_processing.py`
11.2. Test event creation during transaction
11.3. Test worker processes pending events
11.4. Test idempotent processing (duplicate event)
11.5. Test event ordering
11.6. Test retry on failure
11.7. Test event status transitions
11.8. Test cascade events (user deletion → car deletion)

### Acceptance Criteria
- [ ] 10+ outbox tests
- [ ] Event creation tested
- [ ] Worker processing tested
- [ ] Idempotency verified
- [ ] Cascade tested

### Files to Create
- `/backend/tests/outbox/test_outbox_processing.py`

---

## Task 12: Backend Integration Tests
**Depends on**: None  
**Priority**: HIGH  
**Estimated time**: 3 hours

### Objectives
- Test complete workflows end-to-end at API level
- Test multi-step processes
- Test cross-module interactions

### Sub-tasks
12.1. Create `tests/integration/test_critical_flows.py`
12.2. Test registration → verification → login → protected action
12.3. Test car creation → admin approval → car available
12.4. Test inquiry creation → dealer response → buyer reply
12.5. Test MFA enrollment → login with MFA
12.6. Test password reset → login with new password
12.7. Test user suspension → login blocked
12.8. Test car deletion → inquiries archived
12.9. Test dealer deletion → cars reassigned/archived

### Acceptance Criteria
- [ ] 10+ integration tests
- [ ] All critical flows tested
- [ ] Cross-module interactions tested
- [ ] API responses verified
- [ ] Database state verified

### Files to Create
- `/backend/tests/integration/test_critical_flows.py`

---

## Task 13: E2E Test Infrastructure Setup
**Depends on**: None  
**Priority**: MEDIUM  
**Estimated time**: 2 hours

### Objectives
- Install Playwright
- Configure Playwright for E2E testing
- Create test utilities and fixtures
- Set up test environment

### Sub-tasks
13.1. Install Playwright in frontend
13.2. Create `playwright.config.ts`
13.3. Create `e2e/fixtures/auth.ts` (login helpers)
13.4. Create `e2e/fixtures/data.ts` (test data setup)
13.5. Create `e2e/utils/helpers.ts` (common utilities)
13.6. Configure environment variables
13.7. Create `e2e/README.md` with documentation

### Acceptance Criteria
- [ ] `npx playwright test` executes tests
- [ ] Auth fixtures work
- [ ] Screenshots on failure configured
- [ ] HTML report generated
- [ ] Sample test passes

### Files to Create
- `/frontend/playwright.config.ts`
- `/frontend/e2e/fixtures/auth.ts`
- `/frontend/e2e/fixtures/data.ts`
- `/frontend/e2e/utils/helpers.ts`
- `/frontend/e2e/README.md`

---

## Task 14: E2E Auth Flow Tests
**Depends on**: Task 13  
**Priority**: MEDIUM  
**Estimated time**: 2 hours

### Objectives
- Test complete authentication flows end-to-end
- Test registration, login, logout
- Test error cases

### Sub-tasks
14.1. Create `e2e/auth.spec.ts`
14.2. Test registration flow (success)
14.3. Test email verification
14.4. Test login with valid credentials
14.5. Test login with invalid credentials
14.6. Test token persistence on reload
14.7. Test logout

### Acceptance Criteria
- [ ] 7 E2E auth tests
- [ ] Registration flow works
- [ ] Login/logout works
- [ ] Error cases handled
- [ ] Tests are stable

### Files to Create
- `/frontend/e2e/auth.spec.ts`

---

## Task 15: E2E Dealer Flow Tests
**Depends on**: Task 13  
**Priority**: MEDIUM  
**Estimated time**: 2 hours

### Objectives
- Test dealer-specific workflows
- Test car creation and management
- Test image upload

### Sub-tasks
15.1. Create `e2e/dealer.spec.ts`
15.2. Test dealer creates car listing
15.3. Test image upload (multiple images)
15.4. Test car appears in "Pending" state
15.5. Test dealer views their listings
15.6. Test dealer edits their car

### Acceptance Criteria
- [ ] 5 dealer E2E tests
- [ ] Car creation works
- [ ] Image upload works
- [ ] Car management works
- [ ] Tests are stable

### Files to Create
- `/frontend/e2e/dealer.spec.ts`

---

## Task 16: E2E Buyer Flow Tests
**Depends on**: Task 13  
**Priority**: MEDIUM  
**Estimated time**: 2 hours

### Objectives
- Test buyer-specific workflows
- Test car search and inquiry creation
- Test buyer dashboard

### Sub-tasks
16.1. Create `e2e/buyer.spec.ts`
16.2. Test search cars with filters
16.3. Test view car details
16.4. Test create inquiry
16.5. Test view inquiry in dashboard
16.6. Test see dealer response

### Acceptance Criteria
- [ ] 5 buyer E2E tests
- [ ] Search works
- [ ] Car details work
- [ ] Inquiry creation works
- [ ] Dashboard works
- [ ] Tests are stable

### Files to Create
- `/frontend/e2e/buyer.spec.ts`

---

## Task 17: E2E Admin Flow Tests
**Depends on**: Task 13  
**Priority**: MEDIUM  
**Estimated time**: 2 hours

### Objectives
- Test admin workflows
- Test car moderation
- Test user management

### Sub-tasks
17.1. Create `e2e/admin.spec.ts`
17.2. Test view pending cars
17.3. Test approve a car
17.4. Test reject a car with reason
17.5. Test view audit logs
17.6. Test suspend a user

### Acceptance Criteria
- [ ] 5 admin E2E tests
- [ ] Moderation works
- [ ] User management works
- [ ] Audit logs work
- [ ] Tests are stable

### Files to Create
- `/frontend/e2e/admin.spec.ts`

---

## Task 18: Load Test Execution and Documentation
**Depends on**: None  
**Priority**: MEDIUM  
**Estimated time**: 2 hours

### Objectives
- Execute all k6 load tests
- Document performance metrics
- Identify bottlenecks
- Provide recommendations

### Sub-tasks
18.1. Execute `auth_load.js` - document results
18.2. Execute `cars_search_load.js` - document results
18.3. Execute `create_cars_load.js` - document results
18.4. Execute `inquiries_load.js` - document results
18.5. Execute `mixed_load.js` - document results
18.6. Execute `spike_test.js` - document results
18.7. Create `tests/load/RESULTS.md` with comprehensive results
18.8. Identify performance bottlenecks
18.9. Provide optimization recommendations

### Acceptance Criteria
- [ ] All 6 k6 tests executed
- [ ] Results documented with metrics
- [ ] p50, p95, p99 latencies recorded
- [ ] Throughput recorded
- [ ] Error rates recorded
- [ ] Bottlenecks identified
- [ ] Recommendations provided

### Files to Create
- `/backend/tests/load/RESULTS.md`

---

## Task 19: Test Documentation and Cleanup
**Depends on**: Tasks 1-18  
**Priority**: LOW  
**Estimated time**: 1 hour

### Objectives
- Create comprehensive testing documentation
- Generate coverage reports
- Clean up test code
- Create completion report

### Sub-tasks
19.1. Update `/backend/tests/README.md`
19.2. Generate backend coverage report
19.3. Generate frontend coverage report
19.4. Create `.temp/module9_testing_completion_report.md`
19.5. Document test execution instructions
19.6. Document CI integration instructions
19.7. Clean up any unused test files

### Acceptance Criteria
- [ ] Backend README updated
- [ ] Frontend README created
- [ ] Coverage reports generated
- [ ] Completion report created
- [ ] All documentation clear and complete

### Files to Modify/Create
- `/backend/tests/README.md` (update)
- `/frontend/src/test/README.md` (created in Task 1)
- `/frontend/e2e/README.md` (created in Task 13)
- `/.temp/module9_testing_completion_report.md` (create)

---

## Task 20: CI Integration Verification
**Depends on**: Tasks 1-19  
**Priority**: MEDIUM  
**Estimated time**: 1 hour

### Objectives
- Verify tests run in CI environment
- Update CI workflow if needed
- Ensure coverage reports upload correctly

### Sub-tasks
20.1. Test backend tests in CI (GitHub Actions)
20.2. Test frontend tests in CI
20.3. Update `.github/workflows/ci.yml` if needed
20.4. Verify coverage uploads
20.5. Test E2E tests in CI (optional - may need separate workflow)

### Acceptance Criteria
- [ ] Backend tests pass in CI
- [ ] Frontend tests pass in CI
- [ ] Coverage reports generated in CI
- [ ] CI workflow updated (if needed)
- [ ] All green checks

### Files to Modify
- `/.github/workflows/ci.yml` (if needed)

---

## Summary

### Task Dependencies
```
Task 1 (Frontend infra) ─┬─> Task 2 (Store tests)
                          ├─> Task 3 (API tests)
                          ├─> Task 4 (Auth components)
                          ├─> Task 5 (Car components)
                          └─> Task 6 (Admin components)

Task 7-12 (Backend tests) ─── Independent, can run in parallel

Task 13 (E2E infra) ──────┬─> Task 14 (Auth E2E)
                           ├─> Task 15 (Dealer E2E)
                           ├─> Task 16 (Buyer E2E)
                           └─> Task 17 (Admin E2E)

Task 18 (Load tests) ──────── Independent

Task 19 (Documentation) ────── Depends on all previous tasks

Task 20 (CI verification) ──── Depends on Task 19
```

### Execution Order Recommendation
1. **Wave 1** (Infrastructure): Tasks 1, 13 (parallel)
2. **Wave 2** (Backend Tests): Tasks 7, 8, 9, 10, 11, 12 (parallel)
3. **Wave 3** (Frontend Tests): Tasks 2, 3, 4, 5, 6 (parallel after Task 1)
4. **Wave 4** (E2E Tests): Tasks 14, 15, 16, 17 (parallel after Task 13)
5. **Wave 5** (Load Tests): Task 18 (independent)
6. **Wave 6** (Finalization): Tasks 19, 20 (sequential)

### Total Time Estimate
- **Infrastructure**: 4 hours (Tasks 1, 13)
- **Backend Tests**: 20 hours (Tasks 7-12)
- **Frontend Tests**: 13 hours (Tasks 2-6)
- **E2E Tests**: 8 hours (Tasks 14-17)
- **Load Tests**: 2 hours (Task 18)
- **Documentation**: 2 hours (Tasks 19-20)

**Total**: ~49 hours (~6 days)

### Coverage Targets
- Backend: 70%+ (from <15%)
- Frontend: 60%+ (from 0%)
- E2E: 5 critical flows (from 0)
- Load tests: Baseline established

### Files to Create
- **Frontend**: ~15 test files + config files
- **Backend**: ~10 test files
- **E2E**: ~5 test files + config
- **Documentation**: ~5 documentation files
- **Total**: ~35 new files
