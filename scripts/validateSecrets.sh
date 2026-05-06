#!/bin/bash

################################################################################
# Secrets Validation Script
# Validates that required environment variables are properly configured
################################################################################

set -e

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${YELLOW}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${YELLOW}║         Secrets & Environment Validation Script              ║${NC}"
echo -e "${YELLOW}╚════════════════════════════════════════════════════════════╝${NC}\n"

VALIDATION_PASSED=true

# Check if .env file exists
if [ ! -f .env ]; then
    echo -e "${RED}❌ .env file not found${NC}"
    exit 1
fi

echo -e "${BLUE}📋 Checking Local Environment (.env)...${NC}\n"

# Frontend secrets (required)
declare -a FRONTEND_SECRETS=(
    "VITE_FIREBASE_API_KEY"
    "VITE_FIREBASE_AUTH_DOMAIN"
    "VITE_FIREBASE_PROJECT_ID"
    "VITE_FIREBASE_STORAGE_BUCKET"
    "VITE_FIREBASE_MESSAGING_SENDER_ID"
    "VITE_FIREBASE_APP_ID"
    "VITE_FIREBASE_MEASUREMENT_ID"
    "VITE_TMDB_API_KEY"
)

# Backend secrets (required)
declare -a BACKEND_SECRETS=(
    "SESSION_SECRET"
    "SENTRY_DSN"
)

# Vercel secrets (required)
declare -a VERCEL_SECRETS=(
    "VERCEL_TOKEN"
    "VERCEL_ORG_ID"
    "VERCEL_PROJECT_ID"
)

# Check frontend secrets
echo -e "${YELLOW}🔐 Frontend Secrets (VITE_*):${NC}"
for secret in "${FRONTEND_SECRETS[@]}"; do
    value=$(grep "^$secret=" .env | cut -d '=' -f 2- | head -1)
    
    if [ -z "$value" ]; then
        echo -e "${RED}  ❌ $secret: MISSING${NC}"
        VALIDATION_PASSED=false
    else
        # Show first 10 chars + ...
        masked="${value:0:10}..."
        echo -e "${GREEN}  ✓ $secret: $masked${NC}"
    fi
done

echo ""

# Check backend secrets
echo -e "${YELLOW}🔐 Backend Secrets:${NC}"
for secret in "${BACKEND_SECRETS[@]}"; do
    value=$(grep "^$secret=" .env | cut -d '=' -f 2- | head -1)
    
    if [ -z "$value" ]; then
        echo -e "${RED}  ❌ $secret: MISSING${NC}"
        VALIDATION_PASSED=false
    else
        # Show first 10 chars + ...
        masked="${value:0:10}..."
        echo -e "${GREEN}  ✓ $secret: $masked${NC}"
    fi
done

echo ""

# Check Vercel secrets
echo -e "${YELLOW}🔐 Vercel Secrets:${NC}"
for secret in "${VERCEL_SECRETS[@]}"; do
    value=$(grep "^$secret=" .env | cut -d '=' -f 2- | head -1)
    
    if [ -z "$value" ]; then
        echo -e "${RED}  ❌ $secret: MISSING${NC}"
        VALIDATION_PASSED=false
    else
        # Show first 10 chars + ...
        masked="${value:0:10}..."
        echo -e "${GREEN}  ✓ $secret: $masked${NC}"
    fi
done

echo ""

# Check GitHub CLI secrets if gh is available
if command -v gh &> /dev/null && gh auth status &> /dev/null 2>&1; then
    echo -e "${BLUE}📋 Checking GitHub Repository Secrets...${NC}\n"
    
    REPO=$(gh repo view --json nameWithOwner --jq '.nameWithOwner' 2>/dev/null)
    
    if [ -n "$REPO" ]; then
        echo -e "${YELLOW}🔐 GitHub Actions Secrets in $REPO:${NC}"
        
        if gh secret list --repo "$REPO" &> /dev/null; then
            for secret in "${VERCEL_SECRETS[@]}"; do
                if gh secret list --repo "$REPO" | grep -q "^$secret" 2>/dev/null; then
                    echo -e "${GREEN}  ✓ $secret: SET${NC}"
                else
                    echo -e "${RED}  ❌ $secret: NOT SET in GitHub${NC}"
                    VALIDATION_PASSED=false
                fi
            done
        else
            echo -e "${YELLOW}  ⚠️  Could not check GitHub secrets (no permission)${NC}"
        fi
    fi
    echo ""
fi

# Validate format of specific secrets
echo -e "${BLUE}📋 Format Validation...${NC}\n"

# Firebase Project ID should be like "netflix-clone-devops-8614a"
PROJECT_ID=$(grep "^VITE_FIREBASE_PROJECT_ID=" .env | cut -d '=' -f 2-)
if [[ ! $PROJECT_ID =~ ^[a-z0-9-]+$ ]]; then
    echo -e "${RED}❌ Firebase Project ID format invalid: $PROJECT_ID${NC}"
    VALIDATION_PASSED=false
else
    echo -e "${GREEN}✓ Firebase Project ID format valid${NC}"
fi

# TMDB API key should be alphanumeric
TMDB_KEY=$(grep "^VITE_TMDB_API_KEY=" .env | cut -d '=' -f 2-)
if [[ ! $TMDB_KEY =~ ^[a-z0-9]+$ ]]; then
    echo -e "${RED}❌ TMDB API key format invalid${NC}"
    VALIDATION_PASSED=false
else
    echo -e "${GREEN}✓ TMDB API key format valid${NC}"
fi

# SESSION_SECRET should be 64 hex characters
SESSION=$(grep "^SESSION_SECRET=" .env | cut -d '=' -f 2-)
if [[ ! $SESSION =~ ^[a-f0-9]{64}$ ]]; then
    echo -e "${YELLOW}⚠️  SESSION_SECRET should be 64 hex characters (for security)${NC}"
else
    echo -e "${GREEN}✓ SESSION_SECRET format valid (64 hex chars)${NC}"
fi

# SENTRY_DSN should start with https://
SENTRY=$(grep "^SENTRY_DSN=" .env | cut -d '=' -f 2-)
if [[ ! $SENTRY =~ ^https:// ]]; then
    echo -e "${RED}❌ SENTRY_DSN must start with https://{{NC}"
    VALIDATION_PASSED=false
else
    echo -e "${GREEN}✓ SENTRY_DSN format valid${NC}"
fi

# VERCEL_TOKEN should start with vcp_
VERCEL_TOKEN=$(grep "^VERCEL_TOKEN=" .env | cut -d '=' -f 2-)
if [[ ! $VERCEL_TOKEN =~ ^vcp_ ]]; then
    echo -e "${RED}❌ VERCEL_TOKEN must start with vcp_${NC}"
    VALIDATION_PASSED=false
else
    echo -e "${GREEN}✓ VERCEL_TOKEN format valid${NC}"
fi

echo ""

# Security checks
echo -e "${BLUE}🔒 Security Checks...${NC}\n"

# Check if serviceAccountKey.json is committed (it shouldn't be)
if git ls-files --error-unmatch serviceAccountKey.json &> /dev/null; then
    echo -e "${RED}❌ serviceAccountKey.json is committed to Git (SECURITY RISK)${NC}"
    echo "   Remove it: git rm --cached serviceAccountKey.json"
    VALIDATION_PASSED=false
else
    echo -e "${GREEN}✓ serviceAccountKey.json not committed${NC}"
fi

# Check if .env is in .gitignore
if grep -q "^.env$" .gitignore 2>/dev/null || grep -q "^\\.env$" .gitignore 2>/dev/null; then
    echo -e "${GREEN}✓ .env file properly gitignored${NC}"
else
    echo -e "${YELLOW}⚠️  .env not in .gitignore (add it to prevent accidental commits)${NC}"
fi

# Check if secrets are exposed in .env.example
if grep -q "AIzaSy" .env.example 2>/dev/null || grep -q "vcp_" .env.example 2>/dev/null; then
    echo -e "${RED}❌ Real secrets found in .env.example (SECURITY RISK)${NC}"
    VALIDATION_PASSED=false
else
    echo -e "${GREEN}✓ .env.example does not contain real secrets${NC}"
fi

echo ""

# Final summary
echo -e "${YELLOW}╔════════════════════════════════════════════════════════════╗${NC}"

if [ "$VALIDATION_PASSED" = true ]; then
    echo -e "${GREEN}✅ All validations passed!${NC}"
    echo -e "${YELLOW}╚════════════════════════════════════════════════════════════╝${NC}\n"
    
    echo -e "${GREEN}Next steps:${NC}"
    echo "1. Set up GitHub Secrets:"
    echo "   bash scripts/setupGitHubSecrets.sh"
    echo ""
    echo "2. Add environment variables to Vercel:"
    echo "   vercel env pull .env.local"
    echo ""
    echo "3. Deploy:"
    echo "   git push origin main"
    exit 0
else
    echo -e "${RED}❌ Some validations failed${NC}"
    echo -e "${YELLOW}╚════════════════════════════════════════════════════════════╝${NC}\n"
    
    echo -e "${RED}Please fix the issues above and run this script again${NC}"
    exit 1
fi
