#!/bin/bash

# Description: Create a new release branch following the project's naming convention
# Dependencies: git,npm
# ExecutionOrder: 20

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

log "Starting release creation script"

# Check if version is provided
if [ -z "${1:-}" ]; then
  log "ERROR: Version is required"
  echo -e "${RED}Error: Version is required${NC}"
  echo "Usage: $0 <version> [release-type]"
  echo "Example: $0 1.2.0 minor"
  exit 1
fi

# Set variables
VERSION=$1
RELEASE_TYPE=${2:-patch}

log "Version: $VERSION"
log "Release type: $RELEASE_TYPE"

# Validate release type
if [[ ! "$RELEASE_TYPE" =~ ^(major|minor|patch)$ ]]; then
  log "ERROR: Invalid release type: $RELEASE_TYPE"
  echo -e "${RED}Error: Invalid release type${NC}"
  echo "Valid release types: major, minor, patch"
  exit 1
fi

# Create branch name
BRANCH_NAME="release/${RELEASE_TYPE}/${VERSION}"

log "Creating release branch: $BRANCH_NAME"
echo -e "${YELLOW}Creating release branch ${GREEN}$BRANCH_NAME${YELLOW} from ${GREEN}develop${NC}"

# Checkout develop branch
log "Fetching and checking out develop branch"
git fetch origin
git checkout develop
git pull origin develop

# Create new branch
log "Creating release branch"
git checkout -b "$BRANCH_NAME"

# Update version in package.json
log "Updating version in package.json"
if [ -f "app/package.json" ]; then
    cd app
    npm version "$VERSION" --no-git-tag-version
    cd ..
elif [ -f "package.json" ]; then
    npm version "$VERSION" --no-git-tag-version
else
    log "WARNING: No package.json found, skipping version update"
fi

# Create release notes template
cat << EOF > RELEASE_NOTES.md
# Release $VERSION

## Changes

### Added
- 

### Changed
- 

### Fixed
- 

### Removed
- 

## Breaking Changes

None

## Migration Guide

No migration required.
EOF

# Commit changes
log "Committing version changes"
git add .
git commit -m "chore(release): bump version to $VERSION"

log "Release branch created successfully"
echo -e "${GREEN}Release branch $BRANCH_NAME created successfully!${NC}"
echo "You can now push with:"
echo -e "${YELLOW}git push -u origin $BRANCH_NAME${NC}"

log "Script completed successfully"
