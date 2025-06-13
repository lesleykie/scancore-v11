#!/bin/bash

# Description: Template script for the automated workflow
# Dependencies: git,curl,jq
# ExecutionOrder: 999

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

log "Starting template script"

# Your code here
log "This is a template script"
echo -e "${GREEN}Script executed successfully!${NC}"

log "Script completed successfully"
