#!/bin/bash

#############################################################################
# Setup Script: Install Parallel Implementation Validation Hooks
#
# This script installs git pre-commit hooks that enforce M3 mandate
# (No Parallel Implementations).
#
# Run this once per developer machine or after cloning repository.
#############################################################################

set -e

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🔧 Installing Parallel Implementation Validation System"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Verify we're in git repository
if [ ! -d ".git" ]; then
  echo "❌ ERROR: Not in a git repository root"
  echo "   Run this script from repository root directory"
  echo ""
  exit 1
fi

# Verify validator script exists
if [ ! -f "./scripts/validate-no-parallel-implementations.sh" ]; then
  echo "❌ ERROR: Validator script not found"
  echo "   Expected: ./scripts/validate-no-parallel-implementations.sh"
  echo ""
  exit 1
fi

# Verify pre-commit hook template exists
if [ ! -f "./scripts/pre-commit-hook.sh" ]; then
  echo "❌ ERROR: Pre-commit hook template not found"
  echo "   Expected: ./scripts/pre-commit-hook.sh"
  echo ""
  exit 1
fi

echo "📋 Step 1: Making validator script executable..."
chmod +x ./scripts/validate-no-parallel-implementations.sh
echo "   ✅ Validator script is executable"
echo ""

echo "📋 Step 2: Making pre-commit hook template executable..."
chmod +x ./scripts/pre-commit-hook.sh
echo "   ✅ Pre-commit hook template is executable"
echo ""

echo "📋 Step 3: Installing pre-commit hook to .git/hooks/..."

# Backup existing pre-commit hook if it exists
if [ -f ".git/hooks/pre-commit" ]; then
  echo "   ⚠️  Existing pre-commit hook found"
  BACKUP_FILE=".git/hooks/pre-commit.backup.$(date +%Y%m%d_%H%M%S)"
  cp .git/hooks/pre-commit "$BACKUP_FILE"
  echo "   📦 Backed up to: $BACKUP_FILE"
fi

# Install new pre-commit hook
cp ./scripts/pre-commit-hook.sh .git/hooks/pre-commit
chmod +x .git/hooks/pre-commit
echo "   ✅ Pre-commit hook installed"
echo ""

echo "📋 Step 4: Testing validator on current codebase..."
echo ""

./scripts/validate-no-parallel-implementations.sh

TEST_RESULT=$?

echo ""

if [ $TEST_RESULT -eq 0 ]; then
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo "✅ INSTALLATION COMPLETE"
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo ""
  echo "Parallel implementation validation is now active!"
  echo ""
  echo "WHAT HAPPENS NOW:"
  echo "  • Every 'git commit' will check for parallel implementations"
  echo "  • Commits with violations will be automatically blocked"
  echo "  • Agents must fix violations before committing"
  echo ""
  echo "MANUAL VALIDATION:"
  echo "  Run anytime: ./scripts/validate-no-parallel-implementations.sh"
  echo ""
  echo "BYPASS (NOT RECOMMENDED):"
  echo "  git commit --no-verify"
  echo "  ⚠️  Only use for documented architectural decisions"
  echo ""
else
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo "⚠️  INSTALLATION COMPLETE WITH WARNINGS"
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo ""
  echo "Validation system installed, but current codebase has violations."
  echo ""
  echo "ACTION REQUIRED:"
  echo "  1. Review violations listed above"
  echo "  2. Fix parallel implementations"
  echo "  3. Commit fixes before continuing development"
  echo ""
  echo "Commits will be blocked until violations are resolved."
  echo ""
fi
