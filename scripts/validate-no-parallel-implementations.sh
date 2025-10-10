#!/bin/bash

#############################################################################
# Parallel Implementation Validator
# 
# Detects parallel implementations through multiple strategies:
# 1. Filename pattern matching (semantic version indicators)
# 2. Router comment scanning (deprecation indicators)
# 3. Semantic base name detection (similar procedure names)
#
# Returns exit code 1 if ANY violations found (hard block)
#############################################################################

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

VIOLATIONS_FOUND=0
TEMP_FILE="/tmp/validation_$$"

echo ""
echo "🔍 Scanning for parallel implementations..."
echo ""

#############################################################################
# STRATEGY 1: Filename Pattern Matching (INFORMATIONAL)
#############################################################################

echo "📋 Strategy 1: Filename pattern detection (informational)"
echo "   Patterns: *-v2, *-v3, *-fixed, *-enhanced, *-improved, *-updated, *-alt, *-new"
echo ""

PATTERN_MATCHES=$(find packages/api/src/procedures -type f \( \
  -name "*-v2.*" -o \
  -name "*-v3.*" -o \
  -name "*-fixed.*" -o \
  -name "*-enhanced.*" -o \
  -name "*-improved.*" -o \
  -name "*-updated.*" -o \
  -name "*-alt.*" -o \
  -name "*-new.*" \
\) 2>/dev/null || true)

if [ -n "$PATTERN_MATCHES" ]; then
  echo -e "${YELLOW}⚠️  Files with version-like suffixes detected (not necessarily violations):${NC}"
  echo ""
  echo "$PATTERN_MATCHES" | while read -r file; do
    echo "   • $file"
  done
  echo ""
  echo "   📝 Note: Version suffixes are acceptable if no duplicate base exists"
  echo "   📝 Strategy 3 will enforce actual duplication violations"
  echo ""
else
  echo -e "${GREEN}✅ No files with version suffixes${NC}"
  echo ""
fi

#############################################################################
# STRATEGY 2: Router Comment Scanning
#############################################################################

echo "📋 Strategy 2: Router deprecation comment detection"
echo "   Patterns: deprecated, backward, compat, legacy, keep for, old"
echo ""

ROUTER_COMMENT_VIOLATIONS=$(find packages/api/src/procedures -name "*.router.ts" \
  -exec grep -Hn "deprecated\|backward.*compat\|keep for\|legacy\|\\bold\\b" {} \; 2>/dev/null || true)

if [ -n "$ROUTER_COMMENT_VIOLATIONS" ]; then
  echo -e "${RED}❌ VIOLATION: Deprecation comments found in routers${NC}"
  echo ""
  echo "$ROUTER_COMMENT_VIOLATIONS" | while IFS=: read -r file line content; do
    echo "   • $file:$line"
    echo "     └─ $content"
  done
  echo ""
  echo "   📖 Fix: Remove deprecated procedures from router exports"
  echo ""
  VIOLATIONS_FOUND=1
else
  echo -e "${GREEN}✅ No router comment violations${NC}"
  echo ""
fi

#############################################################################
# STRATEGY 3: Semantic Base Name Detection
#############################################################################

echo "📋 Strategy 3: Semantic base name duplication"
echo "   Detecting: Multiple procedures with similar base names"
echo ""

# Extract all procedure files and normalize names
find packages/api/src/procedures -name "*.procedure.ts" -type f | \
  sed 's|.*/||' | \
  sed 's/\.procedure\.ts$//' | \
  sed 's/-enhanced$//' | \
  sed 's/-improved$//' | \
  sed 's/-updated$//' | \
  sed 's/-v[0-9]$//' | \
  sed 's/-v[0-9][0-9]$//' | \
  sed 's/-alt$//' | \
  sed 's/-new$//' | \
  sed 's/-fixed$//' | \
  sort > "$TEMP_FILE"

# Find duplicates
DUPLICATE_BASES=$(uniq -d "$TEMP_FILE")

if [ -n "$DUPLICATE_BASES" ]; then
  echo -e "${RED}❌ VIOLATION: Multiple procedures with similar base names${NC}"
  echo ""
  
  # For each duplicate base, find the actual files
  echo "$DUPLICATE_BASES" | while read -r base; do
    echo "   Base name: $base"
    find packages/api/src/procedures -name "*.procedure.ts" | \
      grep -E "/${base}(-enhanced|-improved|-updated|-v[0-9]|-alt|-new|-fixed)?\.procedure\.ts$" | \
      while read -r file; do
        echo "     • $file"
      done
    echo ""
  done
  
  echo "   📖 Fix: Keep only ONE implementation per capability"
  echo "   📖 If migration in progress: Complete replacement in SAME migration"
  echo ""
  VIOLATIONS_FOUND=1
else
  echo -e "${GREEN}✅ No semantic duplication violations${NC}"
  echo ""
fi

# Cleanup
rm -f "$TEMP_FILE"

#############################################################################
# FINAL RESULT
#############################################################################

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

if [ $VIOLATIONS_FOUND -eq 1 ]; then
  echo -e "${RED}❌ PARALLEL IMPLEMENTATIONS DETECTED${NC}"
  echo ""
  echo "Parallel implementations violate M3 (No Parallel Implementations)."
  echo ""
  echo "RESOLUTION STEPS:"
  echo "  1. Identify which implementation to keep (usually *-enhanced or newest)"
  echo "  2. Delete deprecated procedure file(s)"
  echo "  3. Remove deprecated exports from router"
  echo "  4. Update ledger 'replaced' section with deletions"
  echo "  5. Verify all frontend usage points to kept implementation"
  echo ""
  echo "POLICY:"
  echo "  • Enhanced versions MUST replace old versions in SAME migration"
  echo "  • No 'backward compatibility' period (use feature flags if needed)"
  echo "  • Router exports must be exclusive (one implementation per capability)"
  echo ""
  echo "For questions, see: docs/ai-native-codebase-architecture.md (M3 section)"
  echo ""
  exit 1
else
  echo -e "${GREEN}✅ NO PARALLEL IMPLEMENTATIONS DETECTED${NC}"
  echo ""
  echo "All procedures follow M3 (No Parallel Implementations) mandate."
  echo "Codebase is clean and ready for commit."
  echo ""
  exit 0
fi
