# Production Deployment Checklist

## Pre-Deployment Verification

### Code Quality ✅
- [x] No ESLint errors: `npm run lint`
- [x] No TypeScript errors
- [x] All tests passing: `npm test`
- [x] No console warnings in production build

### Security ✅
- [x] No hardcoded secrets in code
- [x] All API keys use environment variables
- [x] serviceAccountKey.json not committed
- [x] npm audit passes: `npm audit --audit-level=moderate`
- [x] Firebase rules deployed (deny-by-default)
- [x] CORS headers configured in vercel.json

### Performance ✅
- [x] Code-splitting optimized (React, Firebase, UI vendors)
- [x] Bundle size analyzed
- [x] Images optimized
- [x] CSS minified and tree-shaken
- [x] Load test baseline established

### Dependencies ✅
- [x] All packages up-to-date: `npm outdated`
- [x] No known vulnerabilities: `npm audit`
- [x] Package-lock.json committed

---

## Deployment Steps (In Order)

### Step 1: GitHub Actions Configuration
```bash
# 1. Go to repository settings
#    Settings > Secrets and variables > Actions > New repository secret

# 2. Add deployment secrets:
VERCEL_TOKEN                      # From https://vercel.com/account/tokens
VERCEL_ORG_ID                     # Your Vercel org ID
VERCEL_PROJECT_ID                 # Your Vercel project ID

# 3. Push to main branch to trigger pipeline
git push origin main

# 4. Monitor at: https://github.com/user/repo/actions
```

### Step 2: Sentry Setup
```bash
# 1. Go to https://sentry.io
# 2. Create account and new React project
# 3. Copy DSN from project settings

# 4. Update environment variables:
# In Vercel Dashboard > Settings > Environment Variables:
VITE_SENTRY_DSN=https://key@sentry.io/project-id    # Frontend
SENTRY_DSN=https://key@sentry.io/project-id          # Backend

# 5. Redeploy to activate monitoring
```

### Step 3: Firestore Configuration
```bash
# 1. Deploy security rules
firebase deploy --only firestore:rules

# 2. Deploy indexes
firebase deploy --only firestore:indexes

# 3. Verify in Firebase Console
# Firestore > Data > Rules & Indexes tabs
```

### Step 4: Environment Variables in Vercel
```bash
# Via Vercel CLI
vercel env add VITE_FIREBASE_API_KEY
vercel env add VITE_FIREBASE_AUTH_DOMAIN
vercel env add VITE_FIREBASE_PROJECT_ID
vercel env add VITE_FIREBASE_STORAGE_BUCKET
vercel env add VITE_FIREBASE_MESSAGING_SENDER_ID
vercel env add VITE_FIREBASE_APP_ID
vercel env add VITE_FIREBASE_MEASUREMENT_ID
vercel env add VITE_TMDB_API_KEY
vercel env add VITE_SENTRY_DSN
vercel env add FIREBASE_SERVICE_ACCOUNT_KEY  (base64-encoded)
vercel env add SENTRY_DSN
vercel env add SESSION_SECRET

# Or via Vercel Dashboard:
# Settings > Environment Variables > Add for Production
```

### Step 5: Initial Deployment
```bash
# 1. Ensure all code is committed
git status

# 2. Push to main (triggers CI/CD)
git push origin main

# 3. Wait for workflow to complete
# Monitor at: https://github.com/user/repo/actions

# 4. Verify deployment
# Check Vercel dashboard for green checkmark
# Visit https://your-domain.com
```

### Step 6: Post-Deployment Verification
```bash
# 1. Check health endpoints
curl https://your-domain.com/api/health

# 2. Verify monitoring is working
# - Trigger test error in browser console
# - Check Sentry dashboard for error appearance

# 3. Check performance metrics
# - Visit https://your-domain.com
# - Open DevTools Console
# - Look for "📊 Web Vital" logs

# 4. Run initial load test
npm run test:load --users=10 --duration=30
```

---

## Monitoring Post-Deployment

### Day 1 Checklist
- [ ] Check Sentry for any errors
- [ ] Monitor Vercel function logs
- [ ] Check Firebase quotas not exceeded
- [ ] Review performance metrics in analytics

### Week 1 Checklist
- [ ] Analyze load test results for bottlenecks
- [ ] Review error patterns in Sentry
- [ ] Check database query performance
- [ ] Monitor API response times

### Month 1 Checklist
- [ ] Run disaster recovery drill
- [ ] Review cost metrics
- [ ] Analyze user behavior patterns
- [ ] Plan capacity upgrades if needed

---

## Rollback Procedure (If Needed)

### Immediate Rollback (< 5 min)
```bash
# 1. Go to Vercel Dashboard
# 2. Find previous successful deployment
# 3. Click "Promote to Production"
# 4. Verify services restore
```

### Git Rollback (If code issue)
```bash
# 1. Identify problematic commit
git log --oneline

# 2. Create revert commit
git revert <commit-hash>

# 3. Push to main (triggers redeploy)
git push origin main

# 4. Wait for CI/CD to complete
```

### Database Rollback (Firestore)
```bash
# 1. List available backups
gcloud firestore backups list --project=PROJECT_ID

# 2. Restore from specific backup
gcloud firestore backups restore BACKUP_ID \
  --destination-database=default

# 3. Verify data integrity
```

---

## Emergency Contacts

| Issue | Contact | Response Time |
|-------|---------|----------------|
| Vercel Outage | support@vercel.com | Within 1 hour |
| Firebase Issue | firebase-support@google.com | Within 4 hours |
| Sentry Issues | Sentry Support (in-app) | Within 24 hours |

---

## Success Criteria

✅ **Deployment is successful when:**

- [ ] GitHub Actions CI/CD pipeline completes without errors
- [ ] Vercel deployment shows green status
- [ ] Application loads at https://your-domain.com
- [ ] No errors in browser console
- [ ] Sentry receiving events from production
- [ ] Web Vitals visible in console
- [ ] API endpoints respond < 500ms
- [ ] Firestore rules deployed and enforced
- [ ] All environment variables properly set
- [ ] No hardcoded secrets in logs

---

## Maintenance Schedule

**Daily:** Check error dashboard
**Weekly:** Review performance metrics
**Monthly:** Run load test + backup restore test
**Quarterly:** Full disaster recovery drill
**Annually:** Security audit + capacity planning

---

**Deployment Date:** _____________
**Deployed By:** _____________
**Approval:** _____________
**Status:** ✅ READY FOR PRODUCTION
