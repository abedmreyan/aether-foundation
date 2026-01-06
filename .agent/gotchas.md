# Gotchas & Common Pitfalls

Issues that agents frequently encounter. Read this to avoid wasting time.

---

## 🔴 Critical Gotchas

### 1. LocalStorage Clears on Schema Changes
**Problem**: Development uses localStorage. When you change data structures, old data causes errors.

**Solution**:
```javascript
// In browser console:
localStorage.clear();
// Then refresh and re-login
```

### 2. Barrel Exports Are Required
**Problem**: Creating a new file but forgetting to export it.

**Solution**: Always add exports to `index.ts`:
```typescript
// components/ui/index.ts
export { NewComponent } from './NewComponent';
```

### 3. Context Must Be Inside Provider
**Problem**: Using `useAuth()` or `useCRM()` outside of provider tree.

**Solution**: Check that `App.tsx` wraps components in providers.

---

## 🟡 Common Mistakes

### Paths Are Root-Level (No src/)
```
❌ src/components/...
✅ components/...
```

### Import Types Correctly
```typescript
❌ import { User } from './types/user';
✅ import type { User } from './types/user';
```

### Check Permissions Before Rendering
```typescript
❌ {entity.financialField}
✅ {canViewFinancial(user) && entity.financialField}
```

### Financial Fields Need Flag
```typescript
❌ { id: 'price', type: 'currency', label: 'Price' }
✅ { id: 'price', type: 'currency', label: 'Price', isFinancial: true }
```

---

## 🟢 Performance Tips

### PipelineBuilder.tsx is Large
Don't load the entire file for small changes. Use targeted searches.

### Prefer Smaller Edits
Instead of replacing whole functions, replace specific lines.

### Run Build After Changes
```bash
npm run build
```
Always verify changes compile.

---

## 🔧 Debug Checklist

When something isn't working:

1. [ ] Check browser console for errors
2. [ ] Run `npm run build` - any TypeScript errors?
3. [ ] Clear localStorage and re-login
4. [ ] Check that exports exist in index.ts
5. [ ] Verify context providers are mounted
