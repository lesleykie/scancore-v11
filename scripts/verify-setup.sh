#!/bin/bash

# Description: Verify the setup of the ScanCore GitHub automation
# Dependencies: git,jq
# ExecutionOrder: 5

echo "🔍 ScanCore GitHub Automation Verification Script"
echo "================================================"

# Logging function
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1"
}

# Error handling
set -euo pipefail

log "Starting setup verification"

# Check if we're in a git repository
if ! git rev-parse --git-dir > /dev/null 2>&1; then
    echo "❌ Not in a git repository"
    exit 1
fi

echo "✅ Git repository detected"

# Check if .github directory exists
if [ ! -d ".github" ]; then
    echo "❌ .github directory not found"
    echo "   Please create the .github directory and add workflow files"
    exit 1
fi

echo "✅ .github directory found"

# Check for workflow files
WORKFLOWS_DIR=".github/workflows"
if [ ! -d "$WORKFLOWS_DIR" ]; then
    echo "❌ .github/workflows directory not found"
    exit 1
fi

echo "✅ .github/workflows directory found"

# Check for required workflow files
REQUIRED_WORKFLOWS=("automated-workflow.yml")
for workflow in "${REQUIRED_WORKFLOWS[@]}"; do
    if [ ! -f "$WORKFLOWS_DIR/$workflow" ]; then
        echo "❌ Missing workflow file: $workflow"
        exit 1
    else
        echo "✅ Found workflow file: $workflow"
    fi
done

# Check for package.json in app directory
if [ ! -f "app/package.json" ] && [ ! -f "package.json" ]; then
    echo "❌ No package.json found in app/ or root directory"
    echo "   Please ensure your Node.js app has a package.json file"
    exit 1
fi

if [ -f "app/package.json" ]; then
    echo "✅ app/package.json found"
    PACKAGE_JSON_PATH="app/package.json"
elif [ -f "package.json" ]; then
    echo "✅ package.json found"
    PACKAGE_JSON_PATH="package.json"
fi

# Check for required scripts in package.json
REQUIRED_SCRIPTS=("build")
OPTIONAL_SCRIPTS=("lint" "test" "type-check")

for script in "${REQUIRED_SCRIPTS[@]}"; do
    if ! grep -q "\"$script\":" "$PACKAGE_JSON_PATH"; then
        echo "❌ Missing required npm script: $script"
        echo "   Add this script to your package.json"
        exit 1
    else
        echo "✅ Found required npm script: $script"
    fi
done

for script in "${OPTIONAL_SCRIPTS[@]}"; do
    if ! grep -q "\"$script\":" "$PACKAGE_JSON_PATH"; then
        echo "⚠️  Missing optional npm script: $script"
        echo "   Consider adding this script to your package.json"
    else
        echo "✅ Found optional npm script: $script"
    fi
done

# Check current branch
CURRENT_BRANCH=$(git branch --show-current)
echo "📍 Current branch: $CURRENT_BRANCH"

# Check remote origin
if REMOTE_URL=$(git remote get-url origin 2>/dev/null); then
    echo "✅ Remote origin: $REMOTE_URL"
else
    echo "❌ No remote origin configured"
    echo "   Please add your GitHub repository as origin"
    exit 1
fi

# Check for scripts directory
if [ -d "scripts" ]; then
    SCRIPT_COUNT=$(find scripts -name "*.sh" | wc -l)
    echo "✅ Scripts directory found with $SCRIPT_COUNT shell scripts"
else
    echo "⚠️  No scripts directory found"
    echo "   Create a scripts/ directory if you want to use script automation"
fi

echo ""
echo "🎉 Setup verification completed successfully!"
echo ""
echo "Next steps:"
echo "1. Commit and push the .github directory to your repository"
echo "2. Go to your GitHub repository settings and enable Actions"
echo "3. Set up branch protection rules for 'main' and 'develop'"
echo "4. Create the required issue labels (feature, bug, hotfix)"
echo "5. Test by creating an issue with a 'feature' label"
echo ""
echo "Run this command to commit the workflows:"
echo "git add .github/ && git commit -m 'feat: add automated GitHub workflows' && git push"

log "Script completed successfully"
