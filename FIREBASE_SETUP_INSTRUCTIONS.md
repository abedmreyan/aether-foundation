# Firebase Realtime Database Setup Instructions

## ✅ Status

Your Firebase Realtime Database is **already created** and accessible at:
**https://aether-foundation-default-rtdb.firebaseio.com/**

The sign-in page you see is normal - it means the database is in "locked mode" (secure by default).

---

## Step 1: Login to Firebase CLI

You need to authenticate with Firebase to deploy the security rules:

```bash
cd /Users/abedmreyan/Desktop/aether_-foundation/ai_dev_orchestrator

# Login to Firebase (will open browser)
npx firebase-tools login
```

This will:
1. Open your browser
2. Ask you to sign in with your Google account (amryyian@gmail.com)
3. Grant Firebase CLI access

---

## Step 2: Deploy Security Rules

After logging in, deploy the security rules:

```bash
# Deploy database rules
npx firebase-tools deploy --only database --project aether-foundation
```

**Or use the provided script:**
```bash
./deploy-firebase-rules.sh
```

This will deploy the rules from `database.rules.json` to your Firebase database.

---

## Step 3: Verify Rules Deployment

1. **Go to Firebase Console**: https://console.firebase.google.com/project/aether-foundation/database/aether-foundation-default-rtdb/rules

2. **Verify rules are deployed** - You should see the rules from `database.rules.json`

3. **Test the database** - The database should now accept authenticated requests

---

## Step 4: Test Database Connection

You can test the database connection using the Firebase Admin SDK:

```bash
# Test from Node.js (if you have a test script)
node -e "
const admin = require('firebase-admin');
const serviceAccount = require('./firebase-service-account.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: 'https://aether-foundation-default-rtdb.firebaseio.com'
});

const db = admin.database();
db.ref('test').set({ message: 'Hello from Firebase!' })
  .then(() => console.log('✅ Database connection successful!'))
  .catch(err => console.error('❌ Error:', err));
"
```

---

## Database URL

Your Firebase Realtime Database URL:
```
https://aether-foundation-default-rtdb.firebaseio.com
```

This URL is already configured in:
- `.env.example` files
- `GCP_SETUP_COMPLETE.md`
- GitHub Actions workflow

---

## Security Rules Overview

The rules in `database.rules.json` provide:

- **Projects**: Readable by authenticated users, writable by admins
- **Tasks**: Readable by authenticated users, writable by assigned agent or admin
- **Agents**: Readable by all authenticated, writable by admins only
- **Users**: Users can read their own data, admins can read/write all
- **Index nodes**: For efficient queries (tasksByStatus, projectTasks, etc.)

---

## Troubleshooting

### "Permission denied" when deploying
→ Make sure you're logged in: `npx firebase-tools login`

### "Project not found"
→ Verify project ID: `npx firebase-tools projects:list`

### Rules not updating
→ Clear browser cache and check Firebase Console directly

### Database still showing sign-in page
→ This is normal for the web interface. Your app will connect via Admin SDK using the service account key.

---

## Next Steps After Rules Deployment

1. ✅ Rules deployed
2. ⏳ Configure GitHub secrets (use the service account key)
3. ⏳ Deploy backend to Cloud Run
4. ⏳ Test end-to-end connection

---

**Quick Command Reference:**

```bash
# Login
npx firebase-tools login

# Deploy rules
npx firebase-tools deploy --only database --project aether-foundation

# View database in console
open https://console.firebase.google.com/project/aether-foundation/database/aether-foundation-default-rtdb/data

# View rules
open https://console.firebase.google.com/project/aether-foundation/database/aether-foundation-default-rtdb/rules
```

