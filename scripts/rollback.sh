#!/bin/bash

# Description: Rollback a deployment to a previous version
# Dependencies: git,docker
# ExecutionOrder: 100

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

log "Starting rollback script"

# Check if environment is provided
if [ -z "${1:-}" ]; then
  log "ERROR: Environment is required"
  echo -e "${RED}Error: Environment is required${NC}"
  echo "Usage: $0 <environment> [version]"
  echo "Example: $0 production v1.2.0"
  echo "Valid environments: development, staging, production"
  exit 1
fi

# Set variables
ENVIRONMENT=$1
TARGET_VERSION=${2:-}

log "Environment: $ENVIRONMENT"
log "Target version: ${TARGET_VERSION:-latest}"

# Validate environment
if [[ ! "$ENVIRONMENT" =~ ^(development|staging|production)$ ]]; then
  log "ERROR: Invalid environment: $ENVIRONMENT"
  echo -e "${RED}Error: Invalid environment${NC}"
  echo "Valid environments: development, staging, production"
  exit 1
fi

# Determine rollback strategy based on environment
case $ENVIRONMENT in
  development)
    log "Rolling back development environment"
    ROLLBACK_COMMAND="docker-compose -f docker-compose.dev.yml down && docker-compose -f docker-compose.dev.yml up -d"
    ;;
  staging)
    log "Rolling back staging environment"
    ROLLBACK_COMMAND="docker-compose -f docker-compose.staging.yml down && docker-compose -f docker-compose.staging.yml up -d"
    ;;
  production)
    log "Rolling back production environment"
    ROLLBACK_COMMAND="docker-compose -f docker-compose.yml down && docker-compose -f docker-compose.yml up -d"
    ;;
  *)
    log "ERROR: Unknown environment: $ENVIRONMENT"
    exit 1
    ;;
esac

# If target version is specified, checkout that version
if [ -n "$TARGET_VERSION" ]; then
  log "Checking out target version: $TARGET_VERSION"
  git fetch --tags
  if git tag -l | grep -q "^$TARGET_VERSION$"; then
    git checkout "$TARGET_VERSION"
  else
    log "WARNING: Version $TARGET_VERSION not found, using current HEAD"
  fi
fi

# Execute rollback
log "Executing rollback command: $ROLLBACK_COMMAND"
echo -e "${YELLOW}Rolling back $ENVIRONMENT environment...${NC}"

# Simulate rollback execution
eval "$ROLLBACK_COMMAND" || {
  log "ERROR: Rollback command failed"
  echo -e "${RED}Rollback failed!${NC}"
  exit 1
}

# Verify rollback
log "Verifying rollback"
sleep 5

# Check if services are running (simulate health check)
if command -v docker-compose &> /dev/null; then
  if docker-compose ps | grep -q "Up"; then
    log "Services are running after rollback"
    echo -e "${GREEN}Rollback completed successfully!${NC}"
  else
    log "WARNING: Some services may not be running properly"
    echo -e "${YELLOW}Rollback completed with warnings${NC}"
  fi
else
  log "Docker Compose not available, skipping service verification"
  echo -e "${GREEN}Rollback command executed successfully!${NC}"
fi

# Create rollback log
cat << EOF > "rollback-${ENVIRONMENT}-$(date +%Y%m%d-%H%M%S).log"
Rollback Details:
- Environment: $ENVIRONMENT
- Target Version: ${TARGET_VERSION:-current}
- Timestamp: $(date)
- Command: $ROLLBACK_COMMAND
- Status: Success
EOF

log "Rollback log created"
log "Script completed successfully"
