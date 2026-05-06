#!/bin/bash

################################################################################
# GitHub Secrets Setup Script
# Pushes environment variables from .env to GitHub repository secrets
################################################################################

set -e

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${YELLOW}║        GitHub Secrets Setup Script                          ║${NC}"
echo -e "${YELLOW}╚════════════════════════════════════════════════════════════╝${NC}\n"

# Check if gh CLI is installed
if ! command -v gh &> /dev/null; then
    echo -e "${RED}❌ GitHub CLI (gh) is not installed${NC}"
    echo "Install from: https://cli.github.com"
    exit 1
fi

# Check if .env file exists
if [ ! -f .env ]; then
    echo -e "${RED}❌ .env file not found${NC}"
    exit 1
fi

# Check if user is authenticated with gh
if ! gh auth status &> /dev/null; then
    echo -e "${RED}❌ Not authenticated with GitHub CLI${NC}"
    echo "Run: gh auth login"
    exit 1
fi

# Get repository info
REPO=$(gh repo view --json nameWithOwner --jq '.nameWithOwner' 2>/dev/null)
if [ -z "$REPO" ]; then
    echo -e "${RED}❌ Could not determine repository${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Repository: $REPO${NC}"
echo -e "${GREEN}✓ GitHub CLI authenticated${NC}\n"

# Secrets to push to GitHub Actions
declare -a GITHUB_SECRETS=(
    "VERCEL_TOKEN"
    "VERCEL_ORG_ID"
    "VERCEL_PROJECT_ID"
)

# Environment variables to push as Vercel env vars (for all scopes)
declare -a VERCEL_ENV_VARS=(
    "VITE_FIREBASE_API_KEY"
    "VITE_FIREBASE_AUTH_DOMAIN"
    "VITE_FIREBASE_PROJECT_ID"
    "VITE_FIREBASE_STORAGE_BUCKET"
    "VITE_FIREBASE_MESSAGING_SENDER_ID"
    "VITE_FIREBASE_APP_ID"
    "VITE_FIREBASE_MEASUREMENT_ID"
    "VITE_TMDB_API_KEY"
)

echo -e "${YELLOW}📤 Pushing GitHub Secrets...${NC}\n"

# Push GitHub secrets
for secret in "${GITHUB_SECRETS[@]}"; do
    value=$(grep "^$secret=" .env | cut -d '=' -f 2-)
    
    if [ -z "$value" ]; then
        echo -e "${RED}❌ $secret not found in .env${NC}"
        continue
    fi
    
    # Push to GitHub
    echo "$value" | gh secret set "$secret" --repo "$REPO"
    echo -e "${GREEN}✓ $secret added to GitHub secrets${NC}"
done

echo -e "\n${YELLOW}📋 GitHub Secrets Added:${NC}"
gh secret list --repo "$REPO" | grep -E "VERCEL_" || echo "No VERCEL secrets found"

echo -e "\n${YELLOW}📝 Next Steps:${NC}"
echo "1. Verify secrets in GitHub:"
echo "   https://github.com/$REPO/settings/secrets/actions"
echo ""
echo "2. Push to GitHub to trigger CI/CD:"
echo "   git push origin main"
echo ""
echo "3. Monitor workflow:"
echo "   https://github.com/$REPO/actions"
echo ""

echo -e "${GREEN}✅ GitHub Secrets Setup Complete${NC}\n"
