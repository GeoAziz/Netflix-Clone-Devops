# Secrets Management Guide

## Environment Variables Overview

This project uses environment variables for all sensitive configuration. Never commit secrets to Git.

### Vite Environment Variables

Vite automatically loads `.env` files. Only variables prefixed with `VITE_` are exposed to client.

```
VITE_*           → Exposed to frontend (safe for non-sensitive)
VITE_PRIVATE_*   → NOT exposed (for backend reference)
DB_*             → Backend only (Vercel functions)
```

## Local Development Setup

### 1. Create `.env.local`

Copy from `.env.example` and fill in credentials:

```bash
cp .env.example .env.local
```

### 2. `.env.local` (Never commit this!)

```env
# Firebase Client SDK
VITE_FIREBASE_API_KEY=AIzaSyD...
VITE_FIREBASE_AUTH_DOMAIN=netflix-clone-prod.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=netflix-clone-prod
VITE_FIREBASE_STORAGE_BUCKET=netflix-clone-prod.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123456789:web:abc123def456
VITE_FIREBASE_MEASUREMENT_ID=G-ABC123DEF456

# TMDB API (Public, but rate-limited)
VITE_TMDB_API_KEY=your_tmdb_api_key

# Firebase Admin SDK (Backend only)
FIREBASE_ADMIN_SDK_KEY=path/to/serviceAccountKey.json

# Sentry Error Tracking
VITE_SENTRY_DSN=https://your-key@o1234567.ingest.sentry.io/1234567
VITE_SENTRY_ENVIRONMENT=development

# Analytics
VITE_GA_MEASUREMENT_ID=G-ABC123DEF456

# App Version
VITE_APP_VERSION=1.0.0
```

### 3. `.env.example`

```env
# Firebase (get from Firebase Console)
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=
VITE_FIREBASE_MEASUREMENT_ID=

# TMDB (get from https://www.themoviedb.org/settings/api)
VITE_TMDB_API_KEY=

# Firebase Admin SDK
FIREBASE_ADMIN_SDK_KEY=

# Sentry
VITE_SENTRY_DSN=
VITE_SENTRY_ENVIRONMENT=

# Analytics
VITE_GA_MEASUREMENT_ID=

# App Version
VITE_APP_VERSION=1.0.0
```

### 4. `.gitignore` Entry

```gitignore
# Environment variables
.env
.env.local
.env.*.local
serviceAccountKey.json
firebase-admin-key.json
```

## Production (Vercel) Setup

### 1. Add Secrets to Vercel Dashboard

Go to **Project Settings → Environment Variables**:

```
Name: VITE_FIREBASE_API_KEY
Value: AIzaSyD...
Environments: Production, Preview, Development
```

Add all variables from `.env.local`:

```
VITE_FIREBASE_API_KEY
VITE_FIREBASE_AUTH_DOMAIN
VITE_FIREBASE_PROJECT_ID
VITE_FIREBASE_STORAGE_BUCKET
VITE_FIREBASE_MESSAGING_SENDER_ID
VITE_FIREBASE_APP_ID
VITE_FIREBASE_MEASUREMENT_ID
VITE_TMDB_API_KEY
FIREBASE_ADMIN_SDK_KEY
VITE_SENTRY_DSN
VITE_SENTRY_ENVIRONMENT
VITE_GA_MEASUREMENT_ID
```

### 2. Vercel CLI Setup

```bash
# Install Vercel CLI
npm install -g vercel

# Link local repo to Vercel project
vercel link

# Pull environment variables
vercel env pull

# This creates .env.local with production vars
```

### 3. GitHub Secrets (for CI/CD)

Go to **GitHub Settings → Secrets and variables → Actions**:

```
VERCEL_TOKEN
VERCEL_ORG_ID
VERCEL_PROJECT_ID
```

Get values from Vercel:
- Token: Personal → Settings → Tokens
- Org ID: Team/Account name → Settings
- Project ID: Project → Settings → General

## Firebase Configuration

### Getting Firebase Credentials

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select project → Project Settings → General tab
3. Copy config object under "Your apps"

```javascript
{
  apiKey: "AIzaSyD...",
  authDomain: "netflix-clone-prod.firebaseapp.com",
  projectId: "netflix-clone-prod",
  storageBucket: "netflix-clone-prod.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abc123def456",
  measurementId: "G-ABC123DEF456"
}
```

### Firebase Admin SDK Key

For backend (Vercel functions):

1. Firebase Console → Project Settings → Service Accounts tab
2. Click "Generate New Private Key"
3. Save `serviceAccountKey.json` locally
4. Store path in `FIREBASE_ADMIN_SDK_KEY` or paste full JSON

**Never commit this file!** It has full database access.

## TMDB API Setup

### Getting TMDB API Key

1. Go to [TMDB Settings](https://www.themoviedb.org/settings/api)
2. Create API key (free tier)
3. Copy "API Read Access Token (v4 auth)"
4. Paste in `VITE_TMDB_API_KEY`

### Rate Limiting
- Free tier: 40 requests per 10 seconds
- Implement request batching/debouncing in client

## Sentry Integration

### Getting Sentry DSN

1. Go to [Sentry](https://sentry.io/)
2. Create organization & project
3. Select "React" as platform
4. Copy DSN: `https://xxxxx@xxxxx.ingest.sentry.io/xxxxx`
5. Paste in `VITE_SENTRY_DSN`

### Environment Setup
```
VITE_SENTRY_ENVIRONMENT=production  # In Vercel
VITE_SENTRY_ENVIRONMENT=development # In .env.local
```

## Secret Rotation Strategy

### Monthly Rotation
- [ ] Regenerate Firebase API key (keep old one for 24hrs)
- [ ] Rotate TMDB API key (create new, test, delete old)
- [ ] Review Sentry access tokens

### Emergency Rotation
If credentials leaked:

```bash
# Firebase
firebase projects describe PROJECT_ID  # Get project ID
# Go to Firebase Console → Project Settings → API keys
# Delete compromised key, create new one

# TMDB
# Go to TMDB Settings → Delete old key, create new

# Sentry
# Go to Sentry.io → Settings → Auth Tokens
# Delete compromised token, create new
```

## Access Control

### Least Privilege

| Role | Secrets Access |
|------|-----------------|
| Frontend Dev | VITE_* only (public clients) |
| Backend Dev | All API keys + Firebase Admin SDK |
| DevOps | Vercel secrets + CI/CD tokens |
| Intern | VITE_* only (development) |

### GitHub Branches Protection

```
main branch requires:
- Code review approval
- CI/CD passing
- No direct commits
```

This prevents accidental secret commits.

## Verification Checklist

- [ ] `.env.local` is in `.gitignore`
- [ ] `serviceAccountKey.json` is in `.gitignore`
- [ ] No secrets in `src/` code
- [ ] Vercel environment variables set for all branches
- [ ] GitHub Actions secrets configured
- [ ] `.env.example` has no real values
- [ ] All CI/CD tests pass with secrets
- [ ] Sentry DSN points to correct environment
- [ ] Firebase rules restrict data access

## Troubleshooting

### Variables Not Loading
```bash
# Verify .env.local exists
ls -la .env.local

# Check syntax (no spaces around =)
VITE_KEY=value  # ✅ correct
VITE_KEY = value  # ❌ wrong

# Clear node_modules cache
rm -rf node_modules/.vite
npm run dev
```

### Secrets Not in Production
```bash
# Pull from Vercel
vercel env pull

# Manually add via CLI
vercel env add VITE_KEY

# Verify in Vercel Dashboard
# Project Settings → Environment Variables
```

## Resources

- [Vite Env Variables](https://vitejs.dev/guide/env-and-mode.html)
- [Firebase Documentation](https://firebase.google.com/docs)
- [Sentry Setup](https://docs.sentry.io/platforms/javascript/guides/react/)
- [OWASP Secrets Management](https://cheatsheetseries.owasp.org/cheatsheets/Secrets_Management_Cheat_Sheet.html)
