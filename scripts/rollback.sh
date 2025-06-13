#!/bin/bash

# Script to rollback a deployment

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
NC='\033[0m' # No Color

# Check if environment is provided
if [ -z "$1" ]; then
  echo -e
