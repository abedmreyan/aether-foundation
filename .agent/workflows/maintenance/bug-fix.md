# Bug Fix Workflow

## Overview

Systematic workflow for investigating, fixing, and validating bug fixes. Ensures thorough root cause analysis and prevents regression.

## Agents Involved

| Phase | Primary Agent | Supporting |
|-------|---------------|------------|
| Investigation | QA Agent | Backend/Frontend |
| Root Cause | Architecture Agent | QA |
| Fix | Backend/Frontend Agent | Architecture |
| Validation | QA Agent | All |

## Prerequisites

- [ ] Bug report with reproduction steps
- [ ] Environment where bug occurs identified
- [ ] Priority/severity assessed

---

## Step 1: Bug Triage
**Agent:** PM Agent  
**Duration:** 15-30 minutes

**Severity Classification:**

| Severity | Description | Response Time |
|----------|-------------|---------------|
| Critical | System down, data loss | Immediate |
| High | Major feature broken | Same day |
| Medium | Feature degraded | This sprint |
| Low | Minor issue, workaround exists | Backlog |

**Bug Report Template:**

```markdown
## Bug Report

**Title:** User cannot save profile changes

**Environment:**
- Browser: Chrome 120
- OS: macOS 14
- User role: Admin
- Tenant: Ajnabi

**Steps to Reproduce:**
1. Navigate to Settings > Profile
2. Change display name
3. Click "Save Changes"
4. Error appears

**Expected Behavior:**
Profile should save successfully

**Actual Behavior:**
Error: "Failed to save profile"

**Screenshots/Logs:**
[Attach console errors, screenshots]

**Frequency:** Always reproducible
```

---

## Step 2: Reproduction
**Agent:** QA Agent  
**Duration:** 30-60 minutes

**Tasks:**
1. Set up identical environment
2. Follow reproduction steps exactly
3. Confirm bug exists
4. Identify minimal reproduction case
5. Document variations

**Reproduction Checklist:**

```markdown
## Reproduction Verification

- [ ] Bug reproduced in development
- [ ] Bug reproduced in staging
- [ ] Identified affected versions
- [ ] Identified affected user roles
- [ ] Identified affected tenants

## Minimal Reproduction
[Simplest steps to reproduce]

## Variations Tested
- [ ] Different browsers: [results]
- [ ] Different roles: [results]
- [ ] Different data: [results]
```

---

## Step 3: Root Cause Analysis
**Agent:** Architecture Agent + Backend/Frontend Agent  
**Duration:** 1-4 hours

**Investigation Process:**

```markdown
## Root Cause Analysis

### Symptoms
- Error message: "Failed to save profile"
- Console error: `TypeError: Cannot read property 'id' of undefined`
- Network: 500 response from `/api/trpc/users.update`

### Investigation Steps
1. [x] Check server logs
2. [x] Check network requests
3. [x] Review recent commits
4. [x] Test with different data

### Root Cause
**File:** `server/services/userService.ts`
**Line:** 45
**Issue:** `user.companyId` is undefined when user object is null

### Why It Happened
- Missing null check before accessing user properties
- Edge case: Session expired but frontend didn't redirect

### Related Code
- `server/routers/users.ts:23` - Calls service without validation
- `context/AuthContext.tsx:89` - Session refresh logic
```

**Git Blame:**
```bash
# Find when the bug was introduced
git log -p --follow -- server/services/userService.ts

# Identify the commit
git blame server/services/userService.ts
```

---

## Step 4: Fix Implementation
**Agent:** Backend/Frontend Agent  
**Duration:** 1-4 hours

**Fix Guidelines:**
1. Make minimal changes
2. Add defensive coding
3. Add regression tests
4. Document the fix

**Example Fix:**

```typescript
// BEFORE (buggy)
export async function updateProfile(userId: number, data: ProfileData) {
  const user = await getUserById(userId);
  // Bug: user could be null
  const companyId = user.companyId;
  // ...
}

// AFTER (fixed)
export async function updateProfile(userId: number, data: ProfileData) {
  const user = await getUserById(userId);
  
  // Fix: Add null check
  if (!user) {
    throw new TRPCError({
      code: 'NOT_FOUND',
      message: 'User not found'
    });
  }
  
  const companyId = user.companyId;
  // ...
}
```

**Commit Message:**

```
fix(users): handle null user in updateProfile

- Add null check before accessing user properties
- Return proper error when user not found
- Add regression test

Fixes #123
```

---

## Step 5: Add Regression Test
**Agent:** QA Agent  
**Duration:** 30-60 minutes

**Create Test:**

```typescript
// server/services/__tests__/userService.test.ts

describe('updateProfile', () => {
  // Existing tests...

  // Regression test for bug #123
  it('throws NOT_FOUND when user does not exist', async () => {
    await expect(
      updateProfile(999999, { name: 'Test' })
    ).rejects.toThrow('NOT_FOUND');
  });

  it('throws NOT_FOUND when userId is invalid', async () => {
    await expect(
      updateProfile(0, { name: 'Test' })
    ).rejects.toThrow('NOT_FOUND');
  });
});
```

---

## Step 6: Code Review
**Agent:** Architecture Agent  
**Duration:** 30 minutes

**Review Checklist:**

- [ ] Fix addresses root cause
- [ ] No new issues introduced
- [ ] Test coverage adequate
- [ ] Code follows conventions
- [ ] Error messages user-friendly
- [ ] Logging added for debugging

**Review Comments Template:**

```markdown
## Code Review: Bug Fix #123

### ✅ Approved

**Changes Reviewed:**
- `server/services/userService.ts`
- `server/services/__tests__/userService.test.ts`

**Feedback:**
- Good null check implementation
- Consider adding similar checks in related functions
- Test coverage looks good

**Follow-up Tasks:**
- [ ] Audit other service functions for similar issues
```

---

## Step 7: Validation
**Agent:** QA Agent  
**Duration:** 1-2 hours

**Validation Steps:**

```markdown
## Bug Fix Validation

### Original Bug
- [ ] Bug no longer reproducible
- [ ] Error message is helpful (if applicable)

### Regression Testing
- [ ] All existing tests pass
- [ ] New regression test passes
- [ ] Related features still work

### Edge Cases
- [ ] Null/undefined inputs handled
- [ ] Empty data handled
- [ ] Invalid data handled

### Cross-Browser
- [ ] Chrome: ✓
- [ ] Firefox: ✓
- [ ] Safari: ✓

### Roles Tested
- [ ] Admin: ✓
- [ ] User: ✓
```

**Validation Commands:**

```bash
# Run tests
npm run test

# Build check
npm run build

# Manual testing
npm run dev
```

---

## Step 8: Documentation
**Agent:** Backend/Frontend Agent  
**Duration:** 15 minutes

**Update Relevant Docs:**

```markdown
## Changelog Entry

### [1.2.1] - 2025-12-17

#### Fixed
- Fixed profile save error when session is expired (#123)
  - Added null check for user in updateProfile
  - Returns proper NOT_FOUND error instead of crashing
```

**Knowledge Base Entry:**

```markdown
## Known Issue: Profile Save Errors

**Symptom:** "Failed to save profile" error

**Cause:** Session expiration while editing

**Solution:** Refresh the page to re-authenticate

**Status:** Fixed in v1.2.1
```

---

## Step 9: Deployment
**Agent:** DevOps Agent  
**Duration:** 30-60 minutes

**Hotfix Deployment:**

```bash
# For critical bugs - hotfix branch
git checkout -b hotfix/123-profile-save-error
git cherry-pick <commit-sha>
git push origin hotfix/123-profile-save-error

# Deploy to staging
npm run deploy:staging

# Verify fix
npm run test:e2e:staging

# Deploy to production
npm run deploy:production
```

**Standard Deployment:**

```bash
# Merge to main
git checkout main
git merge feature/fix-123

# Deploy normally
npm run deploy
```

---

## Step 10: Post-Fix Monitoring
**Agent:** DevOps Agent  
**Duration:** Ongoing

**Monitor for:**
- Same error recurring
- Related errors appearing
- Performance impact

**Setup Alerts:**

```typescript
// Example: Error monitoring
if (error.code === 'NOT_FOUND' && error.path === 'users.update') {
  metrics.increment('user.update.not_found');
  if (metrics.get('user.update.not_found') > threshold) {
    alertOps('High rate of user not found errors');
  }
}
```

---

## Validation Checklist

### Before Merge
- [ ] Bug reproduced and understood
- [ ] Root cause identified
- [ ] Fix implemented
- [ ] Regression test added
- [ ] All tests passing
- [ ] Code reviewed
- [ ] Build passes

### After Deployment
- [ ] Bug fix verified in production
- [ ] No new errors in logs
- [ ] Related features working
- [ ] Monitoring in place

---

## Common Bug Categories

### Null/Undefined Errors
```typescript
// Add null checks
if (!data) return null;
const value = data?.property ?? defaultValue;
```

### Type Errors
```typescript
// Add type guards
if (typeof value !== 'string') {
  throw new Error('Expected string');
}
```

### Race Conditions
```typescript
// Use proper async handling
const [result1, result2] = await Promise.all([
  fetchData1(),
  fetchData2(),
]);
```

### Permission Issues
```typescript
// Check permissions explicitly
if (!canAccess(user, resource)) {
  throw new ForbiddenError();
}
```

### Data Integrity
```typescript
// Validate data
const validated = schema.parse(input);
```

---

## Files Typically Modified

| File | Action |
|------|--------|
| `server/services/*.ts` | Fix service logic |
| `server/routers/*.ts` | Add validation |
| `client/src/components/*.tsx` | Fix UI issues |
| `__tests__/*.test.ts` | Add regression tests |
| `CHANGELOG.md` | Document fix |

