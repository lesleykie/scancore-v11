#!/bin/bash

# Description: Test the ScanCore GitHub automation by creating test issues and branches
# Dependencies: git,curl,jq
# ExecutionOrder: 999

echo "🧪 Testing ScanCore GitHub Automation"
echo "====================================="

# Logging function
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1"
}

# Error handling
set -euo pipefail
trap 'log "ERROR: Script failed at line $LINENO"' ERR

log "Starting automation test"

# Function to check if GitHub CLI is installed
check_gh_cli() {
    if ! command -v gh &> /dev/null; then
        echo "❌ GitHub CLI (gh) is not installed"
        echo "   Install it from: https://cli.github.com/"
        return 1
    fi
    return 0
}

# Function to check if user is authenticated
check_gh_auth() {
    if ! gh auth status &> /dev/null; then
        echo "❌ Not authenticated with GitHub CLI"
        echo "   Run: gh auth login"
        return 1
    fi
    return 0
}

# Function to create a test issue
create_test_issue() {
    echo "📝 Creating test issue..."
    
    ISSUE_TITLE="Test automated branch creation - $(date +%s)"
    ISSUE_BODY="This is a test issue to verify that automated branch creation is working.

This issue should automatically:
1. Create a feature branch
2. Add a comment with branch information

If this works, the automation is properly configured!"

    if ISSUE_URL=$(gh issue create \
        --title "$ISSUE_TITLE" \
        --body "$ISSUE_BODY" \
        --label "feature" \
        --assignee "@me" 2>/dev/null); then
        
        echo "✅ Test issue created: $ISSUE_URL"
        ISSUE_NUMBER=$(echo "$ISSUE_URL" | grep -o '[0-9]*$')
        echo "📋 Issue number: #$ISSUE_NUMBER"
        
        echo ""
        echo "🔍 Check the following:"
        echo "1. Go to your repository's Actions tab"
        echo "2. Look for a 'Automated CI/CD Pipeline' workflow run"
        echo "3. Check if a branch was created: feature/$ISSUE_NUMBER-test-automated-branch-creation-*"
        echo "4. Verify a comment was added to the issue"
        
        return 0
    else
        echo "❌ Failed to create test issue"
        return 1
    fi
}

# Function to test push automation
test_push_automation() {
    echo ""
    echo "🚀 Testing push automation..."
    echo "This will create a test file and push it to trigger workflows"
    
    read -p "Do you want to test push automation? (y/N): " -n 1 -r
    echo
    
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        # Create a test file
        TEST_FILE="test-automation-$(date +%s).md"
        cat << EOF > "$TEST_FILE"
# Test Automation File

This file was created to test GitHub Actions automation.

- Created at: $(date)
- Purpose: Verify workflow triggers on push events
- Branch: $(git branch --show-current)
- Commit: $(git rev-parse HEAD)

## Expected Behavior

When this file is pushed, the following should happen:
1. Automated CI/CD Pipeline workflow should trigger
2. Repository analysis should detect changes
3. Build and test jobs should run (if applicable)
4. Script execution should run (if scripts exist)

## Cleanup

This file will be automatically removed after testing.
EOF
        
        git add "$TEST_FILE"
        git commit -m "test: verify GitHub Actions automation"
        git push
        
        echo "✅ Test file pushed"
        echo "🔍 Check your repository's Actions tab to see workflows running"
        
        # Clean up
        sleep 2
        rm "$TEST_FILE"
        git add "$TEST_FILE"
        git commit -m "test: clean up automation test file"
        git push
        
        echo "✅ Test file cleaned up"
    else
        echo "⏭️  Skipping push automation test"
    fi
}

# Function to test script execution
test_script_execution() {
    echo ""
    echo "📜 Testing script execution..."
    
    if [ ! -d "scripts" ]; then
        echo "⚠️  No scripts directory found, creating test script"
        mkdir -p scripts
    fi
    
    # Create a simple test script
    TEST_SCRIPT="scripts/test-script-$(date +%s).sh"
    cat << 'EOF' > "$TEST_SCRIPT"
#!/bin/bash

# Description: Test script for automation verification
# Dependencies: 
# ExecutionOrder: 999

echo "🧪 Test script is running!"
echo "Current directory: $(pwd)"
echo "Current user: $(whoami)"
echo "Current date: $(date)"
echo "Environment variables:"
echo "  - GITHUB_REPOSITORY: ${GITHUB_REPOSITORY:-not set}"
echo "  - GITHUB_REF: ${GITHUB_REF:-not set}"
echo "  - GITHUB_SHA: ${GITHUB_SHA:-not set}"

echo "✅ Test script completed successfully!"
EOF
    
    chmod +x "$TEST_SCRIPT"
    
    echo "✅ Created test script: $TEST_SCRIPT"
    echo "This script will be executed automatically when you push changes"
    
    # Add to git but don't commit yet
    git add "$TEST_SCRIPT"
    echo "📝 Test script added to git (not committed yet)"
    echo "   Commit and push to trigger script execution"
}

# Main execution
main() {
    if ! check_gh_cli; then
        echo "⚠️  GitHub CLI not available, skipping issue creation test"
    elif ! check_gh_auth; then
        echo "⚠️  GitHub CLI not authenticated, skipping issue creation test"
    else
        echo "✅ GitHub CLI is ready"
        echo ""
        create_test_issue
    fi
