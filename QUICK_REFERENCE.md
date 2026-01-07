# Ajnabi Beta - Quick Reference

## Login Credentials

```
khaldoun@ajnabi.co / PASSWORD (Management)
amin@ajnabi.co     / PASSWORD (Admin)
abed@ajnabi.co     / PASSWORD (Admin)
```

## Deployment Command

```bash
npm run build
netlify deploy --prod --dir=dist
```

## Database Info

**Platform**: Browser localStorage (users, settings, configs)
**CRM Data**: Supabase @ https://0ec90b57d6e95fcbda19832f.supabase.co

## Pipelines

1. **Students** (4 stages) - All roles
2. **Tutors** (11 stages) - Admin, Dev, Management
3. **Packages** (11 stages) - Admin, Dev, Management, Sales

## Post-Deploy Checks

- [ ] Login works for all three users
- [ ] All three pipelines are visible
- [ ] Can create a student entity
- [ ] Can move entities between stages
- [ ] Search and filter work
- [ ] Settings page loads

## Files Changed

- `services/platformDatabase.ts` - Updated passwords to "PASSWORD"
- `services/database/adapters/SupabaseAdapter.ts` - Added company_id filtering
- `netlify.toml` - Already configured

## Database Tables Created

✅ 8 tables with RLS enabled in Supabase
✅ All data seeded and ready

---

**Status**: Ready to deploy! 🚀
