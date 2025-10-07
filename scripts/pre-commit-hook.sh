#!/bin/bash

#############################################################################
# Pre-Commit Hook: Parallel Implementation Prevention
#
# This hook runs automatically before every git commit to enforce
# M3 (No Parallel Implementations) mandate.
#
# If parallel implementations are detected, the commit is BLOCKED.
#
# Bypass (NOT RECOMMENDED): git commit --no-verify
#############################################################################

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🛡️  PRE-COMMIT VALIDATION: Parallel Implementation Check"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Check if validator script exists
if [ ! -f "./scripts/validate-no-parallel-implementations.sh" ]; then
  echo "❌ ERROR: Validator script not found"
  echo "   Expected: ./scripts/validate-no-parallel-implementations.sh"
  echo ""
  echo "Run: ./scripts/setup-validation-hooks.sh"
  echo ""
  exit 1
fi

# Run validator
./scripts/validate-no-parallel-implementations.sh

VALIDATION_RESULT=$?

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

if [ $VALIDATION_RESULT -ne 0 ]; then
  echo "❌ COMMIT BLOCKED BY PRE-COMMIT HOOK"
  echo ""
  echo "Parallel implementations detected (see errors above)."
  echo ""
  echo "RESOLUTION:"
  echo "  1. Fix violations (remove deprecated procedures)"
  echo "  2. Stage fixes: git add <files>"
  echo "  3. Retry commit"
  echo ""
  echo "BYPASS (NOT RECOMMENDED):"
  echo "  git commit --no-verify"
  echo "  ⚠️  This bypasses architectural safeguards and may violate M3"
  echo ""
  exit 1
else
  echo "✅ PRE-COMMIT VALIDATION PASSED"
  echo ""
  echo "No parallel implementations detected. Proceeding with commit..."
  echo ""
  exit 0
fi
