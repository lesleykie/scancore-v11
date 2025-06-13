#!/bin/bash

# Description: Create a new hotfix branch following the project's naming convention
# Dependencies: git,curl,jq
# ExecutionOrder: 15

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
NC='\033[0m' # No Color

# Logging function
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1"
}

# Error handling
set -euo pipefail
trap 'log "ERROR: Script failed at line $LINENO"' ERR

log "Starting hotfix creation script"

# Check if issue number is provided
if [ -z "${1:-}" ]; then
  log "ERROR: Issue number is required"
  echo -e "${RED}Error: Issue number is required${NC}"
  echo "Usage: $0 <issue-number> [branch-description]"
  echo "Example: $0 42 fix-critical-auth-bug"
  exit 1
fi

# Set variables
ISSUE_NUMBER=$1
BRANCH_DESCRIPTION=${2:-}

log "Issue number: $ISSUE_NUMBER"

# If no description provided, try to get from GitHub API
if [ -z "$BRANCH_DESCRIPTION" ] && [ -n "${GITHUB_TOKEN:-}" ]; then
    log "Fetching issue title from GitHub API"
    BRANCH_DESCRIPTION=$(curl -s -H "Authorization: token $GITHUB_TOKEN" \
      "https://api.github.com/repos/${GITHUB_REPOSITORY:-}/issues/$ISSUE_NUMBER" | \
      jq -r '.title' | tr '[:upper:]' '[:lower:]' | sed 's/[^a-z0-9]/-/g' | sed 's/--*/-/g' | sed 's/^-\|-$//g' || echo "hotfix")
fi

# Fallback description
BRANCH_DESCRIPTION=${BRANCH_DESCRIPTION:-"hotfix-$ISSUE_NUMBER"}

log "Branch description: $BRANCH_DESCRIPTION"

# Create branch name
BRANCH_NAME="hotfix/${ISSUE_NUMBER}-${BRANCH_DESCRIPTION}"

log "Creating hotfix branch: $BRANCH_NAME"
echo -e "${YELLOW}Creating hotfix branch ${GREEN}$BRANCH_NAME${YELLOW} from ${GREEN}main${NC}"

# Checkout main branch
log "Fetching and checking out main branch"
git fetch origin
git checkout main
git pull origin main

# Create new branch
log "Creating hotfix branch"
git checkout -b $BRANCH_NAME

# Create hotfix metadata file
cat << EOF > HOTFIX.md
# $BRANCH_NAME

- **Issue:** #$ISSUE_NUMBER
- **Type:** hotfix
- **Base Branch:** main
- **Created:** $(date)
- **Description:** $BRANCH_DESCRIPTION
- **Urgency:** High

## Hotfix Details

### Problem
Describe the critical issue that requires immediate attention.

### Solution
Describe the fix being implemented.

### Testing
- [ ] Unit tests added/updated
- [ ] Integration tests pass
- [ ] Manual testing completed
- [ ] Security review completed

### Deployment
- [ ] Ready for immediate production deployment
- [ ] Rollback plan prepared
EOF

git add HOTFIX.md
git commit -m "chore: initialize hotfix branch for issue #$ISSUE_NUMBER"

log "Hotfix branch created successfully"
echo -e "${GREEN}Hotfix branch $BRANCH_NAME created successfully!${NC}"
echo "You can now make your changes and push with:"
echo -e "${YELLOW}git push -u origin $BRANCH_NAME${NC}"

log "Script completed successfully"
