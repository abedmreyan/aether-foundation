# End-to-End Testing Workflow

## Overview

Workflow for implementing and running end-to-end tests that verify complete user flows across the entire application stack.

## Agents Involved

| Phase | Primary Agent | Supporting |
|-------|---------------|------------|
| Setup | DevOps Agent | QA |
| Implementation | QA Agent | Frontend |
| Execution | QA Agent | DevOps |
| Reporting | QA Agent | PM |

## Prerequisites

- [ ] E2E framework installed (Playwright)
- [ ] Test environment configured
- [ ] Test data seeded
- [ ] CI/CD pipeline ready

---

## Step 1: E2E Framework Setup
**Agent:** DevOps Agent  
**Duration:** 30-60 minutes

**Install Playwright:**

```bash
# Install Playwright
npm install -D @playwright/test

# Install browsers
npx playwright install

# Create config
npx playwright init
```

**Configure Playwright:**

```typescript
// playwright.config.ts
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [
    ['html'],
    ['json', { outputFile: 'test-results.json' }],
  ],
  use: {
    baseURL: process.env.E2E_BASE_URL || 'http://localhost:5173',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
    {
      name: 'mobile-chrome',
      use: { ...devices['Pixel 5'] },
    },
    {
      name: 'mobile-safari',
      use: { ...devices['iPhone 12'] },
    },
  ],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:5173',
    reuseExistingServer: !process.env.CI,
  },
});
```

---

## Step 2: Test Utilities
**Agent:** QA Agent  
**Duration:** 1-2 hours

**Create Test Fixtures:**

```typescript
// e2e/fixtures.ts
import { test as base, expect } from '@playwright/test';

// Test user credentials
export const TEST_USERS = {
  admin: {
    email: 'admin@ajnabi.com',
    password: 'admin123',
  },
  user: {
    email: 'user@ajnabi.com',
    password: 'user123',
  },
};

// Extended test with auth fixtures
export const test = base.extend<{
  authenticatedPage: Page;
  adminPage: Page;
}>({
  // Authenticated as regular user
  authenticatedPage: async ({ page }, use) => {
    await page.goto('/login');
    await page.fill('[name="email"]', TEST_USERS.user.email);
    await page.fill('[name="password"]', TEST_USERS.user.password);
    await page.click('button[type="submit"]');
    await page.waitForURL('/dashboard');
    await use(page);
  },

  // Authenticated as admin
  adminPage: async ({ page }, use) => {
    await page.goto('/login');
    await page.fill('[name="email"]', TEST_USERS.admin.email);
    await page.fill('[name="password"]', TEST_USERS.admin.password);
    await page.click('button[type="submit"]');
    await page.waitForURL('/dashboard');
    await use(page);
  },
});

export { expect };
```

**Create Page Objects:**

```typescript
// e2e/pages/DashboardPage.ts
import { Page, Locator } from '@playwright/test';

export class DashboardPage {
  readonly page: Page;
  readonly heading: Locator;
  readonly sideNav: Locator;
  readonly userMenu: Locator;
  readonly projectsList: Locator;

  constructor(page: Page) {
    this.page = page;
    this.heading = page.getByRole('heading', { name: /dashboard/i });
    this.sideNav = page.getByRole('navigation');
    this.userMenu = page.getByTestId('user-menu');
    this.projectsList = page.getByTestId('projects-list');
  }

  async goto() {
    await this.page.goto('/dashboard');
  }

  async waitForLoad() {
    await this.heading.waitFor();
    await this.projectsList.waitFor();
  }

  async navigateTo(section: string) {
    await this.sideNav.getByText(section).click();
  }

  async openUserMenu() {
    await this.userMenu.click();
  }

  async logout() {
    await this.openUserMenu();
    await this.page.getByText('Logout').click();
    await this.page.waitForURL('/login');
  }
}
```

```typescript
// e2e/pages/LoginPage.ts
import { Page, Locator } from '@playwright/test';

export class LoginPage {
  readonly page: Page;
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly submitButton: Locator;
  readonly errorMessage: Locator;

  constructor(page: Page) {
    this.page = page;
    this.emailInput = page.getByLabel('Email');
    this.passwordInput = page.getByLabel('Password');
    this.submitButton = page.getByRole('button', { name: /login/i });
    this.errorMessage = page.getByRole('alert');
  }

  async goto() {
    await this.page.goto('/login');
  }

  async login(email: string, password: string) {
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
    await this.submitButton.click();
  }

  async expectError(message: string) {
    await expect(this.errorMessage).toContainText(message);
  }
}
```

---

## Step 3: Authentication Tests
**Agent:** QA Agent  
**Duration:** 1-2 hours

```typescript
// e2e/auth.spec.ts
import { test, expect, TEST_USERS } from './fixtures';
import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';

test.describe('Authentication', () => {
  test('user can login with valid credentials', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    
    await loginPage.login(TEST_USERS.admin.email, TEST_USERS.admin.password);
    
    await expect(page).toHaveURL('/dashboard');
  });

  test('shows error for invalid credentials', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    
    await loginPage.login('invalid@email.com', 'wrongpassword');
    
    await loginPage.expectError('Invalid email or password');
    await expect(page).toHaveURL('/login');
  });

  test('redirects unauthenticated users to login', async ({ page }) => {
    await page.goto('/dashboard');
    
    await expect(page).toHaveURL('/login');
  });

  test('user can logout', async ({ authenticatedPage }) => {
    const dashboard = new DashboardPage(authenticatedPage);
    
    await dashboard.logout();
    
    await expect(authenticatedPage).toHaveURL('/login');
  });

  test('session persists after refresh', async ({ authenticatedPage }) => {
    await authenticatedPage.reload();
    
    await expect(authenticatedPage).toHaveURL('/dashboard');
  });
});
```

---

## Step 4: Feature Flow Tests
**Agent:** QA Agent  
**Duration:** 2-4 hours

```typescript
// e2e/projects.spec.ts
import { test, expect } from './fixtures';
import { DashboardPage } from './pages/DashboardPage';

test.describe('Project Management', () => {
  test('admin can create a new project', async ({ adminPage }) => {
    const dashboard = new DashboardPage(adminPage);
    await dashboard.goto();
    
    // Navigate to projects
    await dashboard.navigateTo('Projects');
    await expect(adminPage).toHaveURL('/projects');
    
    // Create new project
    await adminPage.getByRole('button', { name: /create project/i }).click();
    await adminPage.getByLabel('Name').fill('Test Project');
    await adminPage.getByLabel('Description').fill('A test project created by E2E');
    await adminPage.getByRole('button', { name: /create/i }).click();
    
    // Verify project created
    await expect(adminPage.getByText('Test Project')).toBeVisible();
    await expect(adminPage.getByText('Project created successfully')).toBeVisible();
  });

  test('can view project details', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/projects');
    
    // Click on first project
    await authenticatedPage.getByTestId('project-card').first().click();
    
    // Verify project details page
    await expect(authenticatedPage.getByTestId('project-details')).toBeVisible();
    await expect(authenticatedPage.getByText('Tasks')).toBeVisible();
    await expect(authenticatedPage.getByText('Agents')).toBeVisible();
  });

  test('can edit project settings', async ({ adminPage }) => {
    await adminPage.goto('/projects');
    await adminPage.getByTestId('project-card').first().click();
    
    // Open settings
    await adminPage.getByRole('button', { name: /settings/i }).click();
    
    // Edit name
    await adminPage.getByLabel('Name').clear();
    await adminPage.getByLabel('Name').fill('Updated Project Name');
    await adminPage.getByRole('button', { name: /save/i }).click();
    
    // Verify update
    await expect(adminPage.getByText('Updated Project Name')).toBeVisible();
    await expect(adminPage.getByText('Settings saved')).toBeVisible();
  });
});
```

```typescript
// e2e/tasks.spec.ts
import { test, expect } from './fixtures';

test.describe('Task Management', () => {
  test.beforeEach(async ({ adminPage }) => {
    await adminPage.goto('/projects');
    await adminPage.getByTestId('project-card').first().click();
  });

  test('can create a new task', async ({ adminPage }) => {
    await adminPage.getByRole('button', { name: /new task/i }).click();
    
    await adminPage.getByLabel('Title').fill('E2E Test Task');
    await adminPage.getByLabel('Description').fill('Created by E2E test');
    await adminPage.getByLabel('Priority').selectOption('high');
    
    await adminPage.getByRole('button', { name: /create/i }).click();
    
    await expect(adminPage.getByText('E2E Test Task')).toBeVisible();
  });

  test('can assign task to agent', async ({ adminPage }) => {
    await adminPage.getByText('E2E Test Task').click();
    
    await adminPage.getByLabel('Assign Agent').selectOption({ label: 'Aether Frontend Agent' });
    await adminPage.getByRole('button', { name: /save/i }).click();
    
    await expect(adminPage.getByText('Assigned to: Aether Frontend Agent')).toBeVisible();
  });

  test('can update task status', async ({ adminPage }) => {
    await adminPage.getByText('E2E Test Task').click();
    
    await adminPage.getByLabel('Status').selectOption('in_progress');
    await adminPage.getByRole('button', { name: /save/i }).click();
    
    await expect(adminPage.getByText('In Progress')).toBeVisible();
  });

  test('task appears in agent dashboard', async ({ adminPage }) => {
    await adminPage.goto('/agents');
    await adminPage.getByText('Aether Frontend Agent').click();
    
    await expect(adminPage.getByText('E2E Test Task')).toBeVisible();
  });
});
```

---

## Step 5: Complete User Journey Tests
**Agent:** QA Agent  
**Duration:** 2-4 hours

```typescript
// e2e/user-journey.spec.ts
import { test, expect, TEST_USERS } from './fixtures';

test.describe('Complete User Journey', () => {
  test('new project from ideation to deployment', async ({ adminPage }) => {
    // 1. Create project
    await adminPage.goto('/projects');
    await adminPage.getByRole('button', { name: /create project/i }).click();
    await adminPage.getByLabel('Name').fill('Journey Test Project');
    await adminPage.getByLabel('Description').fill('Complete journey test');
    await adminPage.getByRole('button', { name: /create/i }).click();
    
    // 2. Add tasks
    await adminPage.getByText('Journey Test Project').click();
    await adminPage.getByRole('button', { name: /new task/i }).click();
    await adminPage.getByLabel('Title').fill('Design API');
    await adminPage.getByRole('button', { name: /create/i }).click();
    
    await adminPage.getByRole('button', { name: /new task/i }).click();
    await adminPage.getByLabel('Title').fill('Implement Frontend');
    await adminPage.getByRole('button', { name: /create/i }).click();
    
    // 3. Assign agents
    await adminPage.getByText('Design API').click();
    await adminPage.getByLabel('Assign Agent').selectOption({ label: 'Aether Architecture Agent' });
    await adminPage.getByRole('button', { name: /save/i }).click();
    await adminPage.goBack();
    
    // 4. Approve tasks
    await adminPage.getByText('Design API').click();
    await adminPage.getByRole('button', { name: /approve/i }).click();
    await expect(adminPage.getByText('Approved')).toBeVisible();
    await adminPage.goBack();
    
    // 5. Check progress
    await expect(adminPage.getByTestId('project-progress')).toContainText('25%');
    
    // 6. Complete task
    await adminPage.getByText('Design API').click();
    await adminPage.getByLabel('Status').selectOption('completed');
    await adminPage.getByRole('button', { name: /save/i }).click();
    await adminPage.goBack();
    
    // 7. Verify completion
    await expect(adminPage.getByTestId('project-progress')).toContainText('50%');
  });

  test('Google Tasks sync flow', async ({ adminPage }) => {
    // Navigate to settings
    await adminPage.goto('/settings');
    await adminPage.getByText('Integrations').click();
    
    // Check Google Tasks is connected
    await expect(adminPage.getByText('Google Tasks')).toBeVisible();
    await expect(adminPage.getByText('Connected')).toBeVisible();
    
    // Create task in orchestrator
    await adminPage.goto('/projects');
    await adminPage.getByTestId('project-card').first().click();
    await adminPage.getByRole('button', { name: /new task/i }).click();
    await adminPage.getByLabel('Title').fill('Sync Test Task');
    await adminPage.getByRole('button', { name: /create/i }).click();
    
    // Trigger sync
    await adminPage.getByRole('button', { name: /sync now/i }).click();
    
    // Verify sync status
    await expect(adminPage.getByText('Synced with Google Tasks')).toBeVisible();
  });
});
```

---

## Step 6: Visual Regression Tests
**Agent:** QA Agent  
**Duration:** 1-2 hours

```typescript
// e2e/visual.spec.ts
import { test, expect } from './fixtures';

test.describe('Visual Regression', () => {
  test('dashboard looks correct', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/dashboard');
    await authenticatedPage.waitForLoadState('networkidle');
    
    await expect(authenticatedPage).toHaveScreenshot('dashboard.png', {
      fullPage: true,
      maxDiffPixels: 100,
    });
  });

  test('projects page looks correct', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/projects');
    await authenticatedPage.waitForLoadState('networkidle');
    
    await expect(authenticatedPage).toHaveScreenshot('projects.png', {
      fullPage: true,
      maxDiffPixels: 100,
    });
  });

  test('dark mode renders correctly', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/dashboard');
    await authenticatedPage.evaluate(() => {
      document.documentElement.classList.add('dark');
    });
    
    await expect(authenticatedPage).toHaveScreenshot('dashboard-dark.png', {
      fullPage: true,
      maxDiffPixels: 100,
    });
  });

  test('mobile layout renders correctly', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/login');
    
    await expect(page).toHaveScreenshot('login-mobile.png');
  });
});
```

---

## Step 7: Running E2E Tests
**Agent:** QA Agent  
**Duration:** Varies

**Run Commands:**

```bash
# Run all E2E tests
npm run test:e2e

# Run specific test file
npx playwright test e2e/auth.spec.ts

# Run with UI mode
npx playwright test --ui

# Run in headed mode (see browser)
npx playwright test --headed

# Run specific browser
npx playwright test --project=chromium

# Generate report
npx playwright show-report
```

**CI/CD Integration:**

```yaml
# .github/workflows/e2e.yml
name: E2E Tests

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  e2e:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          
      - name: Install dependencies
        run: npm ci
        
      - name: Install Playwright
        run: npx playwright install --with-deps
        
      - name: Run E2E tests
        run: npm run test:e2e
        env:
          E2E_BASE_URL: http://localhost:5173
          
      - uses: actions/upload-artifact@v4
        if: failure()
        with:
          name: playwright-report
          path: playwright-report/
```

---

## Validation Checklist

### Tests
- [ ] All E2E tests pass
- [ ] Visual regression tests pass
- [ ] Multi-browser testing complete
- [ ] Mobile testing complete

### Coverage
- [ ] Authentication flows covered
- [ ] Core features covered
- [ ] Error scenarios covered
- [ ] Edge cases covered

### Performance
- [ ] Tests run in < 10 minutes
- [ ] No flaky tests
- [ ] Parallel execution works

---

## Files Created/Modified

| File | Action |
|------|--------|
| `playwright.config.ts` | E2E config |
| `e2e/fixtures.ts` | Test utilities |
| `e2e/pages/*.ts` | Page objects |
| `e2e/*.spec.ts` | Test files |
| `.github/workflows/e2e.yml` | CI/CD |

