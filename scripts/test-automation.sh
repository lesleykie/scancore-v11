#!/bin/bash

echo "🧪 Testing ScanCore GitHub Automation"
echo "====================================="

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

    ISSUE_URL=$(gh issue create \
        --title "$ISSUE_TITLE" \
        --body "$ISSUE_BODY" \
        --label "feature" \
        --assignee "@me")
    
    if [ $? -eq 0 ]; then
        echo "✅ Test issue created: $ISSUE_URL"
        ISSUE_NUMBER=$(echo "$ISSUE_URL" | grep -o '[0-9]*$')
        echo "📋 Issue number: #$ISSUE_NUMBER"
        
        echo ""
        echo "🔍 Check the following:"
        echo "1. Go to your repository's Actions tab"
        echo "2. Look for a 'Branch Management' workflow run"
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
        echo "# Test Automation File" > "$TEST_FILE"
        echo "This file was created to test GitHub Actions automation." >> "$TEST_FILE"
        echo "Created at: $(date)" >> "$TEST_FILE"
        
        git add "$TEST_FILE"
        git commit -m "test: verify GitHub Actions automation"
        git push
        
        echo "✅ Test file pushed"
        echo "🔍 Check your repository's Actions tab to see workflows running"
        
        # Clean up
        rm "$TEST_FILE"
        git add "$TEST_FILE"
        git commit -m "test: clean up automation test file"
        git push
    else
        echo "⏭️  Skipping push automation test"
    fi
}

# Main execution
main() {
    if ! check_gh_cli; then
        exit 1
    fi
    
    if ! check_gh_auth; then
        exit 1
    fi
    
    echo "✅ GitHub CLI is ready"
    echo ""
    
    create_test_issue
    test_push_automation
    
    echo ""
    echo "🎯 Automation test completed!"
    echo ""
    echo "Monitor your repository's Actions tab to see the workflows in action."
}

# Run the main function
main
