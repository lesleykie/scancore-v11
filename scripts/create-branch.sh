#!/bin/bash

# Description: Create a new branch following the project's naming convention
# Dependencies: git,curl,jq
# ExecutionOrder: 10

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

log "Starting branch creation script"

# Check if issue number is provided
if [ -z "${1:-}" ]; then
  log "ERROR: Issue number is required"
  echo -e "${RED}Error: Issue number is required${NC}"
  echo "Usage: $0 <issue-number> <branch-type> [branch-description]"
  echo "Example: $0 42 feature implement-barcode-scanning"
  exit 1
fi

# Check if branch type is provided
if [ -z "${2:-}" ]; then
  log "ERROR: Branch type is required"
  echo -e "${RED}Error: Branch type is required${NC}"
  echo "Usage: $0 <issue-number> <branch-type> [branch-description]"
  echo "Example: $0 42 feature implement-barcode-scanning"
  echo "Valid branch types: feature, bugfix, hotfix"
  exit 1
fi

# Set variables
ISSUE_NUMBER=$1
BRANCH_TYPE=$2
BRANCH_DESCRIPTION=${3:-}

log "Issue number: $ISSUE_NUMBER"
log "Branch type: $BRANCH_TYPE"

# If no description provided, try to get from GitHub API
if [ -z "$BRANCH_DESCRIPTION" ] && [ -n "${GITHUB_TOKEN:-}" ]; then
    log "Fetching issue title from GitHub API"
    BRANCH_DESCRIPTION=$(curl -s -H "Authorization: token $GITHUB_TOKEN" \
      "https://api.github.com/repos/${GITHUB_REPOSITORY:-}/issues/$ISSUE_NUMBER" | \
      jq -r '.title' | tr '[:upper:]' '[:lower:]' | sed 's/[^a-z0-9]/-/g' | sed 's/--*/-/g' | sed 's/^-\|-$//g' || echo "no-description")
fi

# Fallback description
BRANCH_DESCRIPTION=${BRANCH_DESCRIPTION:-"issue-$ISSUE_NUMBER"}

log "Branch description: $BRANCH_DESCRIPTION"

# Validate branch type
if [[ ! "$BRANCH_TYPE" =~ ^(feature|bugfix|hotfix)$ ]]; then
  log "ERROR: Invalid branch type: $BRANCH_TYPE"
  echo -e "${RED}Error: Invalid branch type${NC}"
  echo "Valid branch types: feature, bugfix, hotfix"
  exit 1
fi

# Determine base branch
BASE_BRANCH="develop"
if [ "$BRANCH_TYPE" = "hotfix" ]; then
  BASE_BRANCH="main"
fi

log "Base branch: $BASE_BRANCH"

# Create branch name
BRANCH_NAME="${BRANCH_TYPE}/${ISSUE_NUMBER}-${BRANCH_DESCRIPTION}"

log "Creating branch: $BRANCH_NAME"
echo -e "${YELLOW}Creating branch ${GREEN}$BRANCH_NAME${YELLOW} from ${GREEN}$BASE_BRANCH${NC}"

# Checkout base branch
log "Fetching and checking out base branch"
git fetch origin
git checkout $BASE_BRANCH
git pull origin $BASE_BRANCH

# Create new branch
log "Creating new branch"
git checkout -b $BRANCH_NAME

# Create branch metadata file
cat << EOF > BRANCH.md
# $BRANCH_NAME

- **Issue:** #$ISSUE_NUMBER
- **Type:** $BRANCH_TYPE
- **Base Branch:** $BASE_BRANCH
- **Created:** $(date)
- **Description:** $BRANCH_DESCRIPTION

## Development Notes

Add your development notes here...
EOF

git add BRANCH.md
git commit -m "chore: initialize branch for issue #$ISSUE_NUMBER"

log "Branch created successfully"
echo -e "${GREEN}Branch $BRANCH_NAME created successfully!${NC}"
echo "You can now make your changes and push with:"
echo -e "${YELLOW}git push -u origin $BRANCH_NAME${NC}"

log "Script completed successfully"
