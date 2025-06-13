#!/bin/bash

echo "🔍 ScanCore GitHub Automation Verification Script"
echo "================================================"

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
REQUIRED_WORKFLOWS=("ci-cd.yml" "branch-management.yml" "release-automation.yml")
for workflow in "${REQUIRED_WORKFLOWS[@]}"; do
    if [ ! -f "$WORKFLOWS_DIR/$workflow" ]; then
        echo "❌ Missing workflow file: $workflow"
        exit 1
    else
        echo "✅ Found workflow file: $workflow"
    fi
done

# Check for package.json in app directory
if [ ! -f "app/package.json" ]; then
    echo "❌ app/package.json not found"
    echo "   Please ensure your Next.js app is in the 'app' directory"
    exit 1
fi

echo "✅ app/package.json found"

# Check for required scripts in package.json
REQUIRED_SCRIPTS=("lint" "test" "build" "type-check")
for script in "${REQUIRED_SCRIPTS[@]}"; do
    if ! grep -q "\"$script\":" app/package.json; then
        echo "⚠️  Missing npm script: $script"
        echo "   Add this script to your package.json"
    else
        echo "✅ Found npm script: $script"
    fi
done

# Check current branch
CURRENT_BRANCH=$(git branch --show-current)
echo "📍 Current branch: $CURRENT_BRANCH"

# Check remote origin
REMOTE_URL=$(git remote get-url origin 2>/dev/null)
if [ $? -eq 0 ]; then
    echo "✅ Remote origin: $REMOTE_URL"
else
    echo "❌ No remote origin configured"
    echo "   Please add your GitHub repository as origin"
    exit 1
fi

echo ""
echo "🎉 Setup verification completed!"
echo ""
echo "Next steps:"
echo "1. Commit and push the .github directory to your repository"
echo "2. Go to your GitHub repository settings and enable Actions"
echo "3. Set up branch protection rules for 'main' and 'develop'"
echo "4. Create the required issue labels"
echo "5. Test by creating an issue with a 'feature' label"
echo ""
echo "Run this command to commit the workflows:"
echo "git add .github/ && git commit -m 'feat: add automated GitHub workflows' && git push"
