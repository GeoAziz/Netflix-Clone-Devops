#!/bin/bash

################################################################################
# Complete Secrets Setup Workflow
# 1. Validates secrets in .env
# 2. Pushes to GitHub secrets
# 3. Verifies deployment readiness
################################################################################

set -e

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║    Complete Secrets Setup & Deployment Workflow              ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════════╝${NC}\n"

# Get script directory
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

cd "$PROJECT_ROOT"

echo -e "${YELLOW}📁 Working directory: $PROJECT_ROOT${NC}\n"

# Step 1: Validate secrets
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${YELLOW}Step 1: Validating Secrets${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}\n"

if bash scripts/validateSecrets.sh; then
    echo -e "${GREEN}✅ Secrets validation passed${NC}\n"
else
    echo -e "${RED}❌ Secrets validation failed${NC}"
    exit 1
fi

# Step 2: Setup GitHub secrets
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${YELLOW}Step 2: Setting Up GitHub Secrets${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}\n"

if command -v gh &> /dev/null; then
    if gh auth status &> /dev/null; then
        echo -e "${GREEN}✓ GitHub CLI authenticated${NC}\n"
        
        bash scripts/setupGitHubSecrets.sh
        
        echo -e "${GREEN}✅ GitHub secrets setup complete${NC}\n"
    else
        echo -e "${YELLOW}⚠️  GitHub CLI not authenticated${NC}"
        echo "Run: gh auth login"
        echo ""
        echo "Then run GitHub secrets setup manually:"
        echo "  bash scripts/setupGitHubSecrets.sh"
    fi
else
    echo -e "${YELLOW}⚠️  GitHub CLI (gh) not installed${NC}"
    echo "Install from: https://cli.github.com"
    echo ""
    echo "Or set GitHub secrets manually:"
    echo "  1. Go to: https://github.com/YOUR_REPO/settings/secrets/actions"
    echo "  2. Add: VERCEL_TOKEN, VERCEL_ORG_ID, VERCEL_PROJECT_ID"
    echo ""
    echo "Then run: git push origin main"
fi

# Step 3: Deployment readiness checklist
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${YELLOW}Step 3: Deployment Readiness Checklist${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}\n"

CHECKLIST_PASSED=true

# Check git status
if [ -z "$(git status --porcelain)" ]; then
    echo -e "${GREEN}✓ Git working directory clean${NC}"
else
    echo -e "${YELLOW}⚠️  Uncommitted changes exist${NC}"
    git status --short | head -5
    CHECKLIST_PASSED=false
fi

# Check if .env is gitignored
if grep -q "^\\.env\$" .gitignore 2>/dev/null || grep -q "^.env$" .gitignore 2>/dev/null; then
    echo -e "${GREEN}✓ .env is properly gitignored${NC}"
else
    echo -e "${RED}❌ .env not in .gitignore${NC}"
    CHECKLIST_PASSED=false
fi

# Check if npm dependencies are installed
if [ -d "node_modules" ]; then
    echo -e "${GREEN}✓ Dependencies installed${NC}"
else
    echo -e "${YELLOW}⚠️  Dependencies not installed${NC}"
    echo "  Run: npm install"
fi

# Check Vercel CLI
if command -v vercel &> /dev/null; then
    echo -e "${GREEN}✓ Vercel CLI installed${NC}"
else
    echo -e "${YELLOW}⚠️  Vercel CLI not installed${NC}"
    echo "  Install: npm i -g vercel"
fi

echo ""

if [ "$CHECKLIST_PASSED" = true ]; then
    echo -e "${GREEN}╔════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${GREEN}✅ All checks passed! Ready for deployment${NC}"
    echo -e "${GREEN}╚════════════════════════════════════════════════════════════╝${NC}\n"
    
    echo -e "${YELLOW}🚀 Next steps:${NC}"
    echo ""
    echo "1. Commit your changes (if any):"
    echo "   ${BLUE}git add .${NC}"
    echo "   ${BLUE}git commit -m 'Add DevOps infrastructure'${NC}"
    echo ""
    echo "2. Push to GitHub (triggers CI/CD):"
    echo "   ${BLUE}git push origin main${NC}"
    echo ""
    echo "3. Monitor deployment:"
    echo "   ${BLUE}https://github.com/YOUR_REPO/actions${NC}"
    echo ""
    echo "4. Verify production:"
    echo "   ${BLUE}https://your-domain.vercel.app${NC}"
    echo ""
else
    echo -e "${YELLOW}⚠️  Some checks need attention${NC}"
    echo "Fix the issues above before deploying"
fi
