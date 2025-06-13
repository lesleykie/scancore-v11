# ScanCore GitHub Automation Setup Guide

This guide will walk you through setting up the complete automated GitHub workflow for your ScanCore project.

## 📋 Prerequisites

- GitHub repository created for ScanCore
- Admin access to the repository
- Basic understanding of GitHub interface

## 🚀 Step 1: Enable GitHub Actions

1. **Navigate to your repository** on GitHub
2. Click **Settings** tab
3. In the left sidebar, click **Actions** → **General**
4. Under "Actions permissions":
   - Select **"Allow all actions and reusable workflows"**
5. Under "Workflow permissions":
   - Select **"Read and write permissions"**
   - Check **"Allow GitHub Actions to create and approve pull requests"**
6. Click **Save**

## 🔧 Step 2: Add Required Secrets

### 2.1 Navigate to Secrets
1. Go to **Settings** → **Secrets and variables** → **Actions**
2. Click **New repository secret**

### 2.2 Add These Secrets (Optional but Recommended)

| Secret Name | Description | How to Get |
|-------------|-------------|------------|
| `SONAR_TOKEN` | SonarCloud integration | [SonarCloud Setup](#sonarcloud-setup) |
| `SLACK_WEBHOOK_URL` | Slack notifications | [Slack Setup](#slack-setup) |
| `DEPLOY_SSH_KEY` | Server deployment | [SSH Setup](#ssh-setup) |

*Note: The workflows will run without these secrets, but some features will be disabled.*

## 📁 Step 3: Create Workflow Files

### 3.1 Create Directory Structure
In your repository, create the following directory structure:
\`\`\`
.github/
├── workflows/
│   ├── ci-cd.yml
│   ├── branch-management.yml
│   └── release-automation.yml
├── auto-assign.yml
└── labeler.yml
\`\`\`

### 3.2 Copy Workflow Files
Copy all the workflow files I provided earlier into the `.github/workflows/` directory.

### 3.3 Commit and Push
\`\`\`bash
git add .github/
git commit -m "feat: add automated GitHub workflows"
git push origin main
\`\`\`

## 🛡️ Step 4: Set Up Branch Protection Rules

### 4.1 Protect Main Branch
1. Go to **Settings** → **Branches**
2. Click **Add rule**
3. Branch name pattern: `main`
4. Enable these options:
   - ✅ **Require a pull request before merging**
   - ✅ **Require status checks to pass before merging**
   - ✅ **Require branches to be up to date before merging**
   - ✅ **Include administrators**
5. In "Status checks", add:
   - `quality-checks`
   - `build-and-test`
   - `integration-tests`
6. Click **Create**

### 4.2 Protect Develop Branch
Repeat the same process for the `develop` branch.

## 🏷️ Step 5: Set Up Issue Labels

### 5.1 Create Required Labels
Go to **Issues** → **Labels** and create these labels:

| Label | Color | Description |
|-------|-------|-------------|
| `feature` | `#0052cc` | New feature request |
| `bug` | `#d73a4a` | Bug report |
| `hotfix` | `#ff6b6b` | Critical fix needed |
| `release` | `#28a745` | Release related |
| `auto-merge` | `#6f42c1` | Automatically merge when ready |

### 5.2 Create Area Labels
| Label | Color | Description |
|-------|-------|-------------|
| `area: frontend` | `#fef2c0` | Frontend related |
| `area: backend` | `#c2e0c6` | Backend related |
| `area: database` | `#bfd4f2` | Database related |
| `area: docker` | `#f9d0c4` | Docker related |
| `area: ci/cd` | `#d4c5f9` | CI/CD related |

## 📝 Step 6: Create Issue Templates

### 6.1 Create Template Directory
Create `.github/ISSUE_TEMPLATE/` directory

### 6.2 Feature Request Template
\`\`\`yaml
name: 🚀 Feature Request
description: Suggest a new feature for ScanCore
title: "[Feature] "
labels: ["feature"]
body:
  - type: markdown
    attributes:
      value: |
        Thanks for taking the time to suggest a new feature!
  
  - type: textarea
    id: description
    attributes:
      label: Feature Description
      description: What feature would you like to see?
      placeholder: Describe the feature...
    validations:
      required: true
  
  - type: textarea
    id: use-case
    attributes:
      label: Use Case
      description: How would this feature be used?
      placeholder: Describe the use case...
    validations:
      required: true
\`\`\`

### 6.3 Bug Report Template
\`\`\`yaml
name: 🐛 Bug Report
description: Report a bug in ScanCore
title: "[Bug] "
labels: ["bug"]
body:
  - type: textarea
    id: description
    attributes:
      label: Bug Description
      description: What happened?
      placeholder: Describe the bug...
    validations:
      required: true
  
  - type: textarea
    id: steps
    attributes:
      label: Steps to Reproduce
      description: How can we reproduce this bug?
      placeholder: |
        1. Go to...
        2. Click on...
        3. See error...
    validations:
      required: true
  
  - type: textarea
    id: expected
    attributes:
      label: Expected Behavior
      description: What should have happened?
    validations:
      required: true
\`\`\`

## 🧪 Step 7: Test the Automation

### 7.1 Test Issue-to-Branch Creation
1. **Create a test issue**:
   - Title: "Test automated branch creation"
   - Add label: `feature`
2. **Check if branch was created**:
   - Go to repository branches
   - Look for `feature/[issue-number]-test-automated-branch-creation`

### 7.2 Test CI/CD Pipeline
1. **Make a small change** to any file
2. **Push to the feature branch**:
   \`\`\`bash
   git checkout feature/[issue-number]-test-automated-branch-creation
   echo "# Test" >> README.md
   git add README.md
   git commit -m "feat: test automated workflows"
   git push origin feature/[issue-number]-test-automated-branch-creation
   \`\`\`
3. **Check Actions tab** to see workflows running

### 7.3 Test PR Creation
1. **Check if PR was automatically created**
2. **Verify all status checks are running**
3. **Review the automated PR description**

## 🔍 Step 8: Monitor and Verify

### 8.1 Check Workflow Status
1. Go to **Actions** tab in your repository
2. Verify workflows are running successfully
3. Check for any error messages

### 8.2 Review Logs
If any workflow fails:
1. Click on the failed workflow
2. Click on the failed job
3. Review the logs to identify issues

## 🛠️ Optional Integrations

### SonarCloud Setup
1. Go to [SonarCloud.io](https://sonarcloud.io)
2. Sign up with your GitHub account
3. Import your repository
4. Copy the project token
5. Add as `SONAR_TOKEN` secret

### Slack Setup
1. Create a Slack app in your workspace
2. Enable incoming webhooks
3. Copy the webhook URL
4. Add as `SLACK_WEBHOOK_URL` secret

### SSH Setup (for deployment)
1. Generate SSH key pair:
   \`\`\`bash
   ssh-keygen -t rsa -b 4096 -C "github-actions"
   \`\`\`
2. Add public key to your server
3. Add private key as `DEPLOY_SSH_KEY` secret

## 🎯 Step 9: Customize for Your Needs

### 9.1 Update Deployment Scripts
Edit the deployment sections in `ci-cd.yml` to match your infrastructure:
\`\`\`yaml
- name: Deploy to Production
  if: needs.determine-strategy.outputs.deploy-environment == 'production'
  run: |
    # Replace with your deployment commands
    ssh user@your-server "cd /path/to/app && docker-compose pull && docker-compose up -d"
\`\`\`

### 9.2 Adjust Branch Strategy
If you prefer a different branching strategy, modify the branch detection logic in the workflows.

## ✅ Verification Checklist

- [ ] GitHub Actions enabled
- [ ] Workflow permissions set to read/write
- [ ] All workflow files committed and pushed
- [ ] Branch protection rules configured
- [ ] Issue labels created
- [ ] Issue templates created
- [ ] Test issue created and branch auto-generated
- [ ] Test push triggered CI/CD pipeline
- [ ] PR automatically created for feature branch
- [ ] All status checks passing

## 🚨 Troubleshooting

### Common Issues

**Workflows not triggering:**
- Check if files are in `.github/workflows/` directory
- Verify GitHub Actions is enabled
- Check workflow permissions

**Branch creation failing:**
- Verify workflow has write permissions
- Check if branch protection rules are too restrictive

**Deployment failing:**
- Verify deployment secrets are correctly set
- Check server connectivity
- Review deployment script syntax

**Status checks not appearing:**
- Ensure branch protection rules reference correct job names
- Check if workflows are completing successfully

## 📞 Support

If you encounter issues:
1. Check the **Actions** tab for detailed error logs
2. Review this guide for missed steps
3. Check GitHub's documentation for Actions
4. Create an issue in the repository for help

---

**🎉 Congratulations!** Your ScanCore repository now has full automation. Every push will trigger quality checks, testing, and deployment based on your branch strategy.
\`\`\`

Now let's create a quick verification script:
