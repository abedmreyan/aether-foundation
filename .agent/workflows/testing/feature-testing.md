# Feature Testing Workflow

## Overview

Comprehensive workflow for testing new features including unit tests, integration tests, and manual testing to ensure quality and completeness.

## Agents Involved

| Phase | Primary Agent | Supporting |
|-------|---------------|------------|
| Test Planning | QA Agent | PM |
| Unit Tests | QA Agent | Backend/Frontend |
| Integration Tests | QA Agent | Backend |
| Manual Testing | QA Agent | - |
| Acceptance | PM Agent | QA |

## Prerequisites

- [ ] Feature implementation complete
- [ ] Requirements documented
- [ ] Acceptance criteria defined
- [ ] Test environment ready

---

## Step 1: Test Planning
**Agent:** QA Agent  
**Duration:** 30-60 minutes

**Create Test Plan:**

```markdown
## Test Plan: [Feature Name]

### Scope
- Feature: User profile preferences
- Components: PreferencesTab, userService
- APIs: users.updatePreferences, users.getPreferences

### Test Types
- [x] Unit tests
- [x] Integration tests
- [x] Manual testing
- [ ] Performance testing
- [ ] Security testing

### Test Cases

#### Happy Path
| ID | Description | Priority |
|----|-------------|----------|
| TC-001 | User can view preferences | High |
| TC-002 | User can update language | High |
| TC-003 | User can update timezone | High |
| TC-004 | Changes persist after refresh | High |

#### Edge Cases
| ID | Description | Priority |
|----|-------------|----------|
| TC-101 | Empty/null values handled | Medium |
| TC-102 | Invalid timezone rejected | Medium |
| TC-103 | Concurrent updates handled | Low |

#### Error Cases
| ID | Description | Priority |
|----|-------------|----------|
| TC-201 | Network error shows message | High |
| TC-202 | Unauthorized redirects to login | High |
| TC-203 | Invalid data shows validation error | Medium |

### Environment
- Browser: Chrome 120+, Firefox 120+, Safari 17+
- Mobile: iOS Safari, Chrome Android
- Roles: Admin, User, Guest

### Dependencies
- Database seeded with test users
- Valid test credentials available
```

---

## Step 2: Unit Tests
**Agent:** QA Agent  
**Duration:** 2-4 hours

### Backend Unit Tests

```typescript
// server/services/__tests__/userService.test.ts
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { updatePreferences, getPreferences } from '../userService';
import * as db from '../../db';

// Mock database
vi.mock('../../db');

describe('userService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getPreferences', () => {
    it('returns user preferences', async () => {
      (db.getUserById as any).mockResolvedValue({
        id: 1,
        preferredLanguage: 'en',
        timezone: 'UTC',
      });

      const prefs = await getPreferences(1);

      expect(prefs).toEqual({
        preferredLanguage: 'en',
        timezone: 'UTC',
      });
    });

    it('throws NOT_FOUND for invalid user', async () => {
      (db.getUserById as any).mockResolvedValue(null);

      await expect(getPreferences(999)).rejects.toThrow('NOT_FOUND');
    });

    it('returns defaults for new user', async () => {
      (db.getUserById as any).mockResolvedValue({
        id: 1,
        preferredLanguage: null,
        timezone: null,
      });

      const prefs = await getPreferences(1);

      expect(prefs).toEqual({
        preferredLanguage: 'en',
        timezone: 'UTC',
      });
    });
  });

  describe('updatePreferences', () => {
    it('updates user preferences', async () => {
      (db.updateUser as any).mockResolvedValue({
        id: 1,
        preferredLanguage: 'es',
        timezone: 'America/New_York',
      });

      const result = await updatePreferences(1, {
        preferredLanguage: 'es',
        timezone: 'America/New_York',
      });

      expect(db.updateUser).toHaveBeenCalledWith(1, {
        preferredLanguage: 'es',
        timezone: 'America/New_York',
      });
      expect(result.preferredLanguage).toBe('es');
    });

    it('validates timezone', async () => {
      await expect(
        updatePreferences(1, { timezone: 'Invalid/Zone' })
      ).rejects.toThrow('Invalid timezone');
    });

    it('validates language code', async () => {
      await expect(
        updatePreferences(1, { preferredLanguage: 'xyz' })
      ).rejects.toThrow('Invalid language code');
    });
  });
});
```

### Frontend Unit Tests

```typescript
// client/src/components/settings/__tests__/PreferencesTab.test.tsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { PreferencesTab } from '../PreferencesTab';
import { trpc } from '@/lib/trpc';

// Mock trpc
vi.mock('@/lib/trpc', () => ({
  trpc: {
    users: {
      getPreferences: {
        useQuery: vi.fn(),
      },
      updatePreferences: {
        useMutation: vi.fn(),
      },
    },
  },
}));

describe('PreferencesTab', () => {
  beforeEach(() => {
    (trpc.users.getPreferences.useQuery as any).mockReturnValue({
      data: { preferredLanguage: 'en', timezone: 'UTC' },
      isLoading: false,
    });
    (trpc.users.updatePreferences.useMutation as any).mockReturnValue({
      mutateAsync: vi.fn().mockResolvedValue({}),
      isLoading: false,
    });
  });

  it('renders current preferences', () => {
    render(<PreferencesTab />);

    expect(screen.getByDisplayValue('English')).toBeInTheDocument();
    expect(screen.getByDisplayValue('UTC')).toBeInTheDocument();
  });

  it('shows loading state', () => {
    (trpc.users.getPreferences.useQuery as any).mockReturnValue({
      data: null,
      isLoading: true,
    });

    render(<PreferencesTab />);

    expect(screen.getByText(/loading/i)).toBeInTheDocument();
  });

  it('updates preferences on save', async () => {
    const mutateAsync = vi.fn().mockResolvedValue({});
    (trpc.users.updatePreferences.useMutation as any).mockReturnValue({
      mutateAsync,
      isLoading: false,
    });

    render(<PreferencesTab />);

    // Change language
    fireEvent.change(screen.getByLabelText(/language/i), {
      target: { value: 'es' },
    });

    // Click save
    fireEvent.click(screen.getByText(/save/i));

    await waitFor(() => {
      expect(mutateAsync).toHaveBeenCalledWith({
        preferredLanguage: 'es',
        timezone: 'UTC',
      });
    });
  });

  it('shows success message after save', async () => {
    render(<PreferencesTab />);

    fireEvent.click(screen.getByText(/save/i));

    await waitFor(() => {
      expect(screen.getByText(/saved/i)).toBeInTheDocument();
    });
  });

  it('shows error message on failure', async () => {
    (trpc.users.updatePreferences.useMutation as any).mockReturnValue({
      mutateAsync: vi.fn().mockRejectedValue(new Error('Network error')),
      isLoading: false,
    });

    render(<PreferencesTab />);

    fireEvent.click(screen.getByText(/save/i));

    await waitFor(() => {
      expect(screen.getByText(/error/i)).toBeInTheDocument();
    });
  });
});
```

---

## Step 3: Integration Tests
**Agent:** QA Agent  
**Duration:** 2-4 hours

```typescript
// __tests__/integration/preferences.test.ts
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createTestUser, deleteTestUser, getTestClient } from '../helpers';

describe('Preferences Integration', () => {
  let testUser: { id: number; token: string };
  let client: ReturnType<typeof getTestClient>;

  beforeAll(async () => {
    testUser = await createTestUser();
    client = getTestClient(testUser.token);
  });

  afterAll(async () => {
    await deleteTestUser(testUser.id);
  });

  describe('GET /trpc/users.getPreferences', () => {
    it('returns preferences for authenticated user', async () => {
      const result = await client.users.getPreferences.query();

      expect(result).toHaveProperty('preferredLanguage');
      expect(result).toHaveProperty('timezone');
    });

    it('returns 401 for unauthenticated request', async () => {
      const unauthClient = getTestClient('');

      await expect(
        unauthClient.users.getPreferences.query()
      ).rejects.toThrow('UNAUTHORIZED');
    });
  });

  describe('POST /trpc/users.updatePreferences', () => {
    it('updates preferences successfully', async () => {
      const result = await client.users.updatePreferences.mutate({
        preferredLanguage: 'fr',
        timezone: 'Europe/Paris',
      });

      expect(result.preferredLanguage).toBe('fr');
      expect(result.timezone).toBe('Europe/Paris');

      // Verify persistence
      const prefs = await client.users.getPreferences.query();
      expect(prefs.preferredLanguage).toBe('fr');
    });

    it('validates input', async () => {
      await expect(
        client.users.updatePreferences.mutate({
          preferredLanguage: 'invalid',
        })
      ).rejects.toThrow();
    });

    it('allows partial updates', async () => {
      await client.users.updatePreferences.mutate({
        preferredLanguage: 'en',
      });

      const prefs = await client.users.getPreferences.query();
      expect(prefs.preferredLanguage).toBe('en');
      expect(prefs.timezone).toBe('Europe/Paris'); // Unchanged
    });
  });

  describe('Cross-feature interactions', () => {
    it('language preference affects email templates', async () => {
      await client.users.updatePreferences.mutate({
        preferredLanguage: 'es',
      });

      // Trigger email
      const result = await client.notifications.sendTestEmail.mutate();
      
      expect(result.language).toBe('es');
    });

    it('timezone affects date displays', async () => {
      await client.users.updatePreferences.mutate({
        timezone: 'America/New_York',
      });

      const tasks = await client.tasks.list.query();
      
      // Dates should be in user's timezone
      expect(tasks[0].formattedDate).toContain('EST');
    });
  });
});
```

---

## Step 4: API Testing
**Agent:** QA Agent  
**Duration:** 1-2 hours

```typescript
// __tests__/api/preferences.test.ts
import { describe, it, expect } from 'vitest';

const API_URL = process.env.TEST_API_URL || 'http://localhost:3000';

describe('Preferences API', () => {
  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${process.env.TEST_TOKEN}`,
  };

  describe('Schema Validation', () => {
    it('rejects extra fields', async () => {
      const response = await fetch(`${API_URL}/api/trpc/users.updatePreferences`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          preferredLanguage: 'en',
          extraField: 'value',
        }),
      });

      expect(response.status).toBe(400);
    });

    it('accepts valid timezones', async () => {
      const validTimezones = [
        'UTC',
        'America/New_York',
        'Europe/London',
        'Asia/Tokyo',
      ];

      for (const tz of validTimezones) {
        const response = await fetch(`${API_URL}/api/trpc/users.updatePreferences`, {
          method: 'POST',
          headers,
          body: JSON.stringify({ timezone: tz }),
        });

        expect(response.ok).toBe(true);
      }
    });
  });

  describe('Rate Limiting', () => {
    it('enforces rate limits', async () => {
      const requests = Array(100).fill(null).map(() =>
        fetch(`${API_URL}/api/trpc/users.getPreferences`, { headers })
      );

      const responses = await Promise.all(requests);
      const rateLimited = responses.filter(r => r.status === 429);

      expect(rateLimited.length).toBeGreaterThan(0);
    });
  });
});
```

---

## Step 5: Manual Testing
**Agent:** QA Agent  
**Duration:** 1-2 hours

**Manual Test Checklist:**

```markdown
## Manual Test Execution

### Tester: [Name]
### Date: [Date]
### Environment: [Staging/Production]

---

### TC-001: View Preferences
**Steps:**
1. Login as test user
2. Navigate to Settings > Preferences
3. Verify preferences are displayed

**Expected:** Language and timezone shown
**Actual:** ✓ Pass / ✗ Fail
**Notes:**

---

### TC-002: Update Language
**Steps:**
1. Login as test user
2. Navigate to Settings > Preferences
3. Change language to Spanish
4. Click Save
5. Refresh page

**Expected:** Language remains Spanish
**Actual:** ✓ Pass / ✗ Fail
**Notes:**

---

### TC-003: Update Timezone
**Steps:**
1. Login as test user
2. Navigate to Settings > Preferences
3. Change timezone to America/New_York
4. Click Save
5. Check date displays

**Expected:** Dates show Eastern Time
**Actual:** ✓ Pass / ✗ Fail
**Notes:**

---

### TC-101: Empty Values
**Steps:**
1. Login as test user
2. Navigate to Settings > Preferences
3. Try to clear language field
4. Try to clear timezone field

**Expected:** Validation prevents empty values
**Actual:** ✓ Pass / ✗ Fail
**Notes:**

---

### TC-201: Network Error
**Steps:**
1. Login as test user
2. Navigate to Settings > Preferences
3. Disable network (DevTools)
4. Click Save

**Expected:** Error message displayed
**Actual:** ✓ Pass / ✗ Fail
**Notes:**

---

### Cross-Browser Testing

| Browser | Version | Result | Notes |
|---------|---------|--------|-------|
| Chrome | 120 | ✓ | |
| Firefox | 120 | ✓ | |
| Safari | 17 | ✓ | |
| Edge | 120 | ✓ | |

### Mobile Testing

| Device | OS | Result | Notes |
|--------|-----|--------|-------|
| iPhone 15 | iOS 17 | ✓ | |
| Pixel 7 | Android 14 | ✓ | |
| iPad | iPadOS 17 | ✓ | |

---

### Summary
- Total Tests: 15
- Passed: 14
- Failed: 1
- Blocked: 0

### Failed Tests
| ID | Issue | Severity |
|----|-------|----------|
| TC-201 | Error message not styled | Low |

### Bugs Found
| ID | Description | Severity |
|----|-------------|----------|
| BUG-123 | Error toast appears twice | Medium |
```

---

## Step 6: Test Coverage Report
**Agent:** QA Agent  
**Duration:** 15 minutes

```bash
# Run coverage
npm run test:coverage

# Output
# -----------------------|---------|----------|---------|---------|
# File                   | % Stmts | % Branch | % Funcs | % Lines |
# -----------------------|---------|----------|---------|---------|
# userService.ts         | 95.2    | 88.5     | 100     | 94.8    |
# PreferencesTab.tsx     | 92.1    | 85.7     | 100     | 91.3    |
# -----------------------|---------|----------|---------|---------|
# All files              | 87.5    | 82.3     | 91.2    | 86.9    |
# -----------------------|---------|----------|---------|---------|
```

**Coverage Requirements:**

| Type | Required | Actual |
|------|----------|--------|
| Statements | 80% | 87.5% ✓ |
| Branches | 75% | 82.3% ✓ |
| Functions | 85% | 91.2% ✓ |
| Lines | 80% | 86.9% ✓ |

---

## Step 7: Acceptance Testing
**Agent:** PM Agent  
**Duration:** 30 minutes

**Acceptance Criteria Verification:**

```markdown
## Acceptance Testing: User Preferences

### Acceptance Criteria

1. ✓ User can view their current preferences
2. ✓ User can update their preferred language
3. ✓ User can update their timezone
4. ✓ Changes persist after refresh
5. ✓ Validation prevents invalid values
6. ✓ Error messages are user-friendly
7. ✓ Loading states are shown during API calls

### Sign-off

- [ ] Product Owner: Approved
- [ ] QA Lead: Approved
- [ ] Tech Lead: Approved

### Notes
All acceptance criteria met. Ready for deployment.
```

---

## Validation Checklist

### Tests
- [ ] Unit tests pass (100%)
- [ ] Integration tests pass (100%)
- [ ] API tests pass (100%)
- [ ] Manual tests pass (95%+)
- [ ] Coverage meets thresholds

### Quality
- [ ] No critical bugs
- [ ] No high severity bugs
- [ ] All acceptance criteria met
- [ ] Performance acceptable

### Sign-off
- [ ] QA approval
- [ ] PM approval
- [ ] Ready for deployment

---

## Files Modified

| File | Action |
|------|--------|
| `__tests__/unit/*.test.ts` | Unit tests |
| `__tests__/integration/*.test.ts` | Integration tests |
| `__tests__/api/*.test.ts` | API tests |
| `docs/test-results.md` | Test report |

