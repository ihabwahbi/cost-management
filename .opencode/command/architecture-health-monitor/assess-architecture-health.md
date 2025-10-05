---
description: Assesses SYSTEM-WIDE architecture health after successful migration - scans ANDA pillar integrity, detects anti-patterns across codebase, analyzes trends over last 5 migrations, calculates architecture health score, and makes governance decision (CONTINUE/PAUSE). Phase 6 of 6-phase ANDA migration workflow.
agent: architecture-health-monitor
---

## Variables

### Static Variables
ARCHITECTURE_REPORTS_DIR: "thoughts/shared/architecture-health/"
VALIDATIONS_DIR: "thoughts/shared/validations/"
LEDGER_PATH: "ledger.jsonl"

### System-Wide Architecture Health Thresholds
MAX_PROCEDURE_LINES: 200  # API Procedure Specialization Architecture
MAX_DOMAIN_ROUTER_LINES: 50  # Domain router complexity limit
MAX_CELL_COMPONENT_LINES: 400  # Radical Granularity principle
MAX_ANY_TYPE_PERCENTAGE: 0.05  # Max 5% `any` types (target: 0%)
MIN_BEHAVIORAL_ASSERTIONS: 3  # Minimum per Cell manifest
MONOLITHIC_FILE_THRESHOLD: 500  # Any file >500 lines = architectural emergency
ARCHITECTURE_DEBT_THRESHOLD: 10  # Max debt points before refactoring required
ARCHITECTURE_DEBT_EMERGENCY: 20  # Emergency threshold - immediate PAUSE

### Health Score Thresholds
HEALTH_SCORE_EXCELLENT: 90  # ≥90 - Continue confidently
HEALTH_SCORE_GOOD: 75  # 75-89 - Minor issues
HEALTH_SCORE_FAIR: 60  # 60-74 - Needs attention
HEALTH_SCORE_POOR: 60  # <60 - PAUSE required

### Trend Analysis Configuration
TREND_WINDOW: 5  # Last 5 migrations for trend analysis
DEGRADING_METRIC_WARNING: 2  # 2 degrading metrics = warning
DEGRADING_METRIC_ALERT: 3  # 3+ degrading metrics = systemic issue

### Dynamic Variables
PHASE5_HANDOFF_PATH: "/tmp/phase5-handoff.json"
# Phase 5 creates this handoff package with migration context

## Context

Phase 5 handoff package (migration context):
@[[PHASE5_HANDOFF_PATH]]

Architecture blueprint for compliance reference:
@docs/ai-native-codebase-architecture.md

Current ledger for historical metrics:
@ledger.jsonl

## Instructions

**ultrathink: Mission**: You are operating in **Phase 6** (final phase) of the 6-phase ANDA migration workflow. Phase 5 has validated THIS migration and created a handoff package for you. Your responsibility is to assess SYSTEM-WIDE architecture health, detect drift from ANDA principles across the ENTIRE codebase, identify emerging anti-patterns, analyze trends over multiple migrations, calculate architecture health score, make governance decisions (CONTINUE or PAUSE migrations), generate strategic recommendations, and update the ledger with architecture metrics for continuous tracking.

**CRITICAL SCOPE**: You assess the ENTIRE SYSTEM, not just this migration. Phase 5 already validated this specific migration. Your job is to ensure the overall codebase maintains architectural integrity and remains optimized for AI agent development.

### Core Assessment Principles

**System-Wide Vision**:
- Assess ENTIRE codebase health, not just this migration
- Track metrics across MULTIPLE migrations to detect gradual degradation
- Every migration either improves or degrades overall architecture quality

**Early Detection Prevents Disasters**:
- Catch monolithic files at migration 5, not migration 50
- Detect architecture drift before it becomes critical
- Proactive warnings prevent accumulated debt

**Proactive Governance**:
- Recommend architecture refactoring BEFORE continuing migrations
- PAUSE migrations if architecture health drops below threshold (score <60)
- Strategic guidance prevents future issues

**Trend-Based Truth**:
- One large file is a mistake; three consecutive large files is a pattern
- Track degrading metrics over TREND_WINDOW (5) migrations
- Systemic issues require systemic solutions

**Agent-Optimal First**:
- Architecture choices must optimize for AI agent navigability
- Maintain absolute leanness through 100% ANDA adoption
- Prevent architectural debt that degrades agent reliability

### Execution Protocol

**1. Load Context and Create Assessment Plan**
   
   **1.1 Load Phase 5 Handoff Package**:
   ```bash
   # Read handoff package from Phase 5
   cat /tmp/phase5-handoff.json
   ```
   
   Extract:
   - Migration ID and timestamp
   - Validation status (should be SUCCESS)
   - Migration context (component name, artifacts, mandate compliance)
   - Technical metrics (test coverage, performance, LOC changes)
   - Migration-specific learnings
   - Path to Phase 5 validation report
   
   **1.2 Load Historical Context**:
   ```bash
   # Find last 5 architecture health reports for trend analysis
   ls -t $ARCHITECTURE_REPORTS_DIR/*.md | head -5
   
   # Load last 5 ledger entries with architecture metrics
   tail -5 $LEDGER_PATH | jq '.metadata.architecture_health // empty'
   ```
   
   **1.3 Create Assessment Todos with todowrite**:
   
   **System-Wide Architecture Assessment**:
   - ANDA pillar integrity scan (type safety, Cell quality, ledger completeness)
   - Specialized procedure architecture compliance (all procedures, all routers)
   - Radical granularity adherence (file size distributions across codebase)
   - Anti-pattern detection (monolithic files, missing manifests, parallel implementations)
   - Trend analysis (compare with last TREND_WINDOW migrations)
   - Architecture health score calculation
   - Governance decision (CONTINUE or PAUSE)
   - Strategic recommendations generation
   - Enhanced ledger update (merge with Phase 5 entry)
   - Architecture health report generation
   - User notification with governance decision

**2. ANDA Pillar Integrity Scan**
   
   **Execute system-wide scans regardless of this migration's outcome**
   
   **2.1 Pillar 1: Type-Safe Data Layer Assessment**
   
   Scan entire codebase for type safety:
   ```bash
   echo "Scanning for 'any' types across entire codebase..."
   ANY_COUNT=$(grep -r ': any' packages/api apps/web/components --include='*.ts' --include='*.tsx' | wc -l)
   TOTAL_LINES=$(find packages/api apps/web/components -name '*.ts' -o -name '*.tsx' | xargs wc -l | tail -1 | awk '{print $1}')
   ANY_PERCENTAGE=$(echo "scale=4; $ANY_COUNT / $TOTAL_LINES * 100" | bc)
   
   echo "Type Safety: $ANY_COUNT any types ($ANY_PERCENTAGE% of codebase)"
   echo "Threshold: MAX_ANY_TYPE_PERCENTAGE (5%)"
   echo "Target: 0% (zero any types)"
   
   # Scan for direct database calls (should be ZERO)
   DIRECT_DB=$(grep -r 'supabase\.from' apps/web/components --include='*.tsx' | wc -l)
   echo "Direct DB calls in components: $DIRECT_DB (target: 0)"
   ```
   
   **Calculate Type Safety Score**:
   ```
   type_safety_score = (100 - any_percentage * 20) - (direct_db_calls * 10)
   Target: 100 (zero violations)
   ```
   
   **2.2 Pillar 2: Smart Component Cells Quality Assessment**
   
   Scan ALL Cells for quality:
   ```bash
   CELL_DIR="apps/web/components/cells"
   
   # Count total Cells
   TOTAL_CELLS=$(find $CELL_DIR -maxdepth 1 -type d | tail -n +2 | wc -l)
   
   # Check manifests
   CELLS_WITH_MANIFESTS=$(find $CELL_DIR -name 'manifest.json' | wc -l)
   
   # Check pipelines
   CELLS_WITH_PIPELINES=$(find $CELL_DIR -name 'pipeline.yaml' | wc -l)
   
   # Check manifest quality (≥3 assertions)
   for manifest in $(find $CELL_DIR -name 'manifest.json'); do
     ASSERTIONS=$(jq '.behavioralAssertions | length' "$manifest" 2>/dev/null || echo 0)
     CELL_NAME=$(dirname "$manifest" | xargs basename)
     
     if [ "$ASSERTIONS" -lt 3 ]; then
       echo "⚠️ WARNING: $CELL_NAME has only $ASSERTIONS assertions (min: $MIN_BEHAVIORAL_ASSERTIONS)"
     fi
   done
   
   # Check file sizes (all ≤400 lines)
   find $CELL_DIR -name 'component.tsx' -exec wc -l {} + | awk '{
     if ($1 > 400) {
       print "🔴 M-CELL-3 VIOLATION:", $2, "("$1" lines)"
     }
   }'
   ```
   
   **Calculate Cell Quality Score**:
   ```
   cell_quality_score = (cells_with_manifests / total_cells) * 100
   Target: 100%
   ```
   
   **2.3 Pillar 3: Architectural Ledger Completeness**
   
   ```bash
   LEDGER_ENTRIES=$(wc -l < $LEDGER_PATH)
   COMPLETE_ENTRIES=$(jq -s 'map(select(.artifacts and .validationStatus)) | length' $LEDGER_PATH)
   COMPLETENESS=$(echo "scale=2; $COMPLETE_ENTRIES / $LEDGER_ENTRIES * 100" | bc)
   
   echo "Ledger Completeness: $COMPLETENESS% ($COMPLETE_ENTRIES/$LEDGER_ENTRIES)"
   ```

**3. Specialized Procedure Architecture Compliance**
   
   **CRITICAL - Scan ALL procedures across entire codebase**
   
   **3.1 Procedure File Compliance**
   
   ```bash
   PROC_DIR="packages/api/src/procedures"
   
   echo "Scanning ALL procedure files for compliance..."
   VIOLATIONS=0
   TOTAL_PROCEDURES=0
   
   find $PROC_DIR -name '*.procedure.ts' -exec wc -l {} + | awk '{
     if ($1 > 200) {
       print "🔴 CRITICAL:", $2, "exceeds MAX_PROCEDURE_LINES ("$1" lines)"
       violations++
     }
     total++
   }
   END {
     print "Procedure Compliance:", (total-violations)/total*100"%"
   }'
   
   # CRITICAL: Check for monolithic files (>500 lines) - architectural emergency
   find $PROC_DIR -name '*.ts' -exec wc -l {} + | awk '$1 > 500 {
     print "🔴🔴🔴 ARCHITECTURAL EMERGENCY:", $2, "("$1" lines)"
     print "    This violates Radical Granularity principle"
     monolithic++
   }
   END {
     print "Monolithic files detected:", monolithic
   }'
   ```
   
   **3.2 Domain Router Compliance**
   
   ```bash
   find $PROC_DIR -name '*.router.ts' -exec wc -l {} + | awk '{
     if ($1 > 50) {
       print "🔴 CRITICAL:", $2, "exceeds MAX_DOMAIN_ROUTER_LINES ("$1" lines)"
       violations++
     }
     total++
   }
   END {
     print "Router Compliance:", (total-violations)/total*100"%"
   }'
   ```
   
   **Calculate Specialized Architecture Score**:
   ```
   procedure_compliance = (compliant_procedures / total_procedures) * 100
   router_compliance = (compliant_routers / total_routers) * 100
   specialized_architecture_score = (procedure_compliance + router_compliance) / 2
   
    Penalties:
    - Each monolithic file (>500 lines): -20 points
    - Each parallel implementation: -30 points
    ```
    
    **3.4 tRPC Procedure Export Pattern Validation**
    
    [REQUEST ENHANCEMENT: "Validating tRPC procedure export patterns. Consider 'ultrathink' if pattern violations detected for comprehensive migration strategy."]
    
    **CONTEXT**: All 17 existing procedures use direct export pattern. Router segment pattern is deprecated (see docs/2025-10-05_trpc-procedure-pattern-migration-reference.md).
    
    **Check 1: No Router Segment Exports**
    ```bash
    echo "Checking for deprecated router segment exports in procedure files..."
    ROUTER_SEGMENT_EXPORTS=$(find packages/api/src/procedures -name '*.procedure.ts' -exec grep -l 'export const.*Router = router({' {} \; 2>/dev/null | wc -l)
    
    if [ "$ROUTER_SEGMENT_EXPORTS" -gt 0 ]; then
      echo "🔴 HIGH SEVERITY: $ROUTER_SEGMENT_EXPORTS procedure files using deprecated router segment pattern"
      find packages/api/src/procedures -name '*.procedure.ts' -exec grep -l 'export const.*Router = router({' {} \; 2>/dev/null
    else
      echo "✓ All procedure files use direct export pattern"
    fi
    ```
    
    **Check 2: No Spread Operators in Domain Routers**
    ```bash
    echo "Checking for deprecated spread operators in domain routers..."
    SPREAD_OPERATORS=$(find packages/api/src/procedures -name '*.router.ts' -exec grep -l '\.\.\.' {} \; 2>/dev/null | wc -l)
    
    if [ "$SPREAD_OPERATORS" -gt 0 ]; then
      echo "🔴 HIGH SEVERITY: $SPREAD_OPERATORS domain routers using deprecated spread operator pattern"
      find packages/api/src/procedures -name '*.router.ts' -exec grep -l '\.\.\.' {} \; 2>/dev/null
    else
      echo "✓ All domain routers use direct composition"
    fi
    ```
    
    **Check 3: Export Name Consistency**
    ```bash
    echo "Checking for Router suffix in export names (should not exist)..."
    ROUTER_SUFFIX_EXPORTS=$(find packages/api/src/procedures -name '*.procedure.ts' -exec grep -l 'export const.*Router\s*=' {} \; 2>/dev/null | wc -l)
    
    if [ "$ROUTER_SUFFIX_EXPORTS" -gt 0 ]; then
      echo "🔴 HIGH SEVERITY: $ROUTER_SUFFIX_EXPORTS procedure files have Router suffix in export names"
      find packages/api/src/procedures -name '*.procedure.ts' -exec grep -H 'export const.*Router\s*=' {} \; 2>/dev/null
    else
      echo "✓ All procedure exports follow naming convention (no Router suffix)"
    fi
    ```
    
    **Check 4: Import Hygiene (Procedures Don't Import Router)**
    ```bash
    echo "Checking that procedure files don't import router unnecessarily..."
    UNNECESSARY_IMPORTS=$(find packages/api/src/procedures -name '*.procedure.ts' -exec grep -l "import.*router.*from.*trpc" {} \; 2>/dev/null | wc -l)
    
    if [ "$UNNECESSARY_IMPORTS" -gt 0 ]; then
      echo "⚠️ MEDIUM SEVERITY: $UNNECESSARY_IMPORTS procedure files import router unnecessarily"
      find packages/api/src/procedures -name '*.procedure.ts' -exec grep -l "import.*router.*from.*trpc" {} \; 2>/dev/null
    else
      echo "✓ Procedure files only import publicProcedure (router only in domain routers)"
    fi
    ```
    
    **Calculate Pattern Compliance Score:**
    ```
    pattern_violations_high = router_segment_exports + spread_operators + router_suffix_exports
    pattern_violations_medium = unnecessary_imports
    
    pattern_compliance_percentage = ((total_procedures - pattern_violations_high) / total_procedures) * 100
    
    Status:
    - 100%: Perfect compliance with direct export pattern
    - <100%: Pattern violations detected - migration to direct export pattern needed
    ```
    
    ✓ Verify: tRPC procedure export pattern compliance assessed

**4. Anti-Pattern Detection**
   
   **Scan entire codebase for architectural violations**
   
   **4.1 Parallel Component Implementations**
   ```bash
   # Look for version suffixes
   PARALLEL=$(find apps/web/components -type f \( -name '*-v2.*' -o -name '*-fixed.*' -o -name '*-new.*' -o -name '*-worldclass.*' \) | wc -l)
   
   if [ "$PARALLEL" -gt 0 ]; then
     echo "🔴 CRITICAL: $PARALLEL parallel component implementations detected"
   fi
   ```
   
   **4.2 Large Non-Cell Components**
   ```bash
   # Components >300 lines outside Cell structure
   find apps/web/components -name '*.tsx' ! -path '*/cells/*' ! -path '*/ui/*' -exec wc -l {} + | awk '$1 > 300 {
     print "⚠️ WARNING: Large non-Cell component:", $2, "("$1" lines)"
   }'
   ```
   
   **4.3 Consolidate Anti-Patterns by Severity**
   
   ```yaml
   anti_pattern_categorization:
     critical:
       - monolithic_files: [count from Step 3]
       - parallel_implementations: [count from Step 4.1]
       - direct_db_calls: [count from Step 2]
       
      high:
        - procedure_violations: [count from Step 3]
        - router_violations: [count from Step 3]
        - missing_manifests: [count from Step 2]
        - deprecated_router_segment_exports: [count from Step 3.4]
        - deprecated_spread_operators: [count from Step 3.4]
        - incorrect_export_naming: [count from Step 3.4]
        
      medium:
        - large_non_cell_components: [count from Step 4.2]
        - insufficient_assertions: [count from Step 2]
        - unnecessary_router_imports: [count from Step 3.4]
       
     low:
       - feature_flags: [if detected]
   ```
   
   **Calculate Architecture Debt**:
   ```
   architecture_debt = (critical * 10) + (high * 3) + (medium * 1)
   
   Status:
   - debt < 10: ACCEPTABLE
   - debt 10-19: WARNING - refactoring needed
   - debt ≥ 20: EMERGENCY - PAUSE required
   ```

**5. Trend Analysis**
   
   **Compare current metrics with last TREND_WINDOW (5) migrations**
   
   **5.1 Load Historical Metrics**
   
   From previous architecture health reports or ledger:
   ```bash
   # Extract architecture metrics from last 5 ledger entries
   tail -5 $LEDGER_PATH | jq '.metadata.architecture_health // empty'
   ```
   
   **5.2 Calculate Trends for Each Metric**
   
   ```yaml
   trend_detection:
     for_each_metric:
       current_value: [from Steps 2-4]
       historical_values: [from last 5 migrations]
       
       calculate:
         recent_avg: mean([last 3 values])
         older_avg: mean([first 2 values])
         delta: recent_avg - older_avg
         percentage_change: (delta / older_avg) * 100
       
       classify:
         if percentage_change > 5%: "IMPROVING ↗"
         if percentage_change < -5%: "DEGRADING ↘"
         else: "STABLE →"
   ```
   
   **5.3 Detect Consecutive Degradations (Early Warning)**
   
   ```yaml
   early_warning_system:
     track_patterns:
       - metric: [name]
         last_5_values: [v1, v2, v3, v4, v5]
         consecutive_degradations: [count where trend worsens]
         
     alerts:
       if_3_consecutive_degradations:
         level: "WARNING - Systemic issue detected"
         action: "Recommend systemic fix, not tactical"
   ```
   
   **5.4 Generate Trend Summary**
   
   ```yaml
   trend_summary:
     overall_trajectory: "IMPROVING | STABLE | DEGRADING"
     
     metrics_by_direction:
       improving: [list]
       stable: [list]
       degrading: [list]
       
     degrading_metrics_count: [N]
     consecutive_warnings: [count]
     
     projection:
       if_trends_continue:
         in_3_migrations: [projected state]
         concern_level: "LOW | MEDIUM | HIGH"
   ```

**6. Architecture Health Score Calculation**
   
   **Synthesize all measurements into actionable score**
   
   **6.1 Collect Component Scores**
   
   ```yaml
   component_scores:
     type_safety_integrity: [from Step 2.1] (weight: 25%)
     specialized_procedure_compliance: [from Step 3] (weight: 25%)
     cell_quality: [from Step 2.2] (weight: 20%)
     ledger_completeness: [from Step 2.3] (weight: 15%)
     agent_navigability: [estimated] (weight: 10%)
     mandate_compliance: [overall] (weight: 5%)
   ```
   
   **6.2 Calculate Base Score**
   
   ```
   base_score = (type_safety * 0.25) +
                (procedure_compliance * 0.25) +
                (cell_quality * 0.20) +
                (ledger_completeness * 0.15) +
                (navigability * 0.10) +
                (mandate_compliance * 0.05)
   ```
   
   **6.3 Apply Penalties**
   
   ```
   penalty = architecture_debt  # Already weighted by severity
   final_score = max(0, base_score - penalty)
   ```
   
   **6.4 Determine Health Status**
   
   ```yaml
   status_determination:
     if final_score ≥ 90: "EXCELLENT"
     elif final_score ≥ 75: "GOOD"
     elif final_score ≥ 60: "FAIR"
     else: "POOR"
     
     trend_modifier:
       if degrading and score < 85:
         downgrade_one_level: true
         reason: "Degrading trends require immediate attention"
   ```

**7. Governance Decision**
   
   **Make CONTINUE or PAUSE decision based on health assessment**
   
   **7.1 Evaluate Governance Criteria**
   
   ```yaml
   governance_evaluation:
     health_score: [final score from Step 6]
     trend_direction: [from Step 5]
     architecture_debt: [from Step 4]
     critical_anti_patterns: [count from Step 4]
     degrading_metrics_count: [from Step 5]
   ```
   
   **7.2 Make Decision**
   
   ```yaml
   decision_logic:
     # PAUSE conditions (any triggers pause)
     if health_score < 60:
       decision: "PAUSE"
       reason: "Architecture health below acceptable threshold"
       
     elif architecture_debt ≥ 20:
       decision: "PAUSE"
       reason: "Architecture debt at emergency level"
       
     elif critical_anti_patterns > 0:
       decision: "PAUSE"
       reason: "Critical anti-patterns (monolithic files, parallel implementations)"
       
     elif degrading_metrics_count ≥ 3:
       decision: "PAUSE"
       reason: "Systemic architectural degradation (3+ metrics declining)"
       
     # CONTINUE conditions
     elif health_score ≥ 90:
       decision: "CONTINUE"
       guidance: "Architecture healthy - continue confidently"
       
     elif health_score ≥ 75:
       decision: "CONTINUE"
       guidance: "Minor issues - address opportunistically"
       
     else:  # FAIR range (60-74)
       decision: "CONTINUE"
       guidance: "Architecture needs attention - plan refactoring within 3 migrations"
       monitoring: "Limit to low-complexity migrations"
   ```

**8. Strategic Recommendations Generation**
   
   **Transform findings into actionable roadmap**
   
   **8.1 Generate Recommendations for Anti-Patterns**
   
   For each detected anti-pattern:
   ```yaml
   recommendation_template:
     issue: "Found [N] [anti-pattern-type]"
     specific_files: [list with details]
     impact: "How it affects agent navigability/architecture"
     recommendation: "Specific action to take"
     priority: "URGENT | HIGH | MEDIUM | LOW"
     effort: "Estimated hours"
     benefit: "Expected improvement"
   
    examples:
      monolithic_files:
        priority: "URGENT"
        recommendation: "Split using specialized procedure pattern"
        
      missing_manifests:
        priority: "MEDIUM"
        recommendation: "Create manifests with ≥3 behavioral assertions"
        
      deprecated_router_segment_exports:
        priority: "HIGH"
        recommendation: "Migrate to direct export pattern (see docs/2025-10-05_trpc-procedure-pattern-migration-reference.md)"
        impact: "Violates current architecture standard, adds unnecessary complexity"
        effort: "0.5 hours per file (straightforward refactor)"
        benefit: "Aligns with 100% of existing procedures, improves agent navigability"
        
      deprecated_spread_operators:
        priority: "HIGH"
        recommendation: "Convert domain routers to direct composition pattern"
        impact: "Using deprecated pattern, inconsistent with codebase"
        effort: "0.25 hours per router (simple removal of spread operators)"
        benefit: "Simplifies router composition, maintains consistency"
        
      incorrect_export_naming:
        priority: "HIGH"
        recommendation: "Remove Router suffix from export names to match direct export pattern"
        impact: "Export name doesn't match procedure name (violates explicitness)"
        effort: "0.25 hours per file (rename export and update imports)"
        benefit: "Export name = procedure name (ANDA explicitness principle)"
        
      unnecessary_router_imports:
        priority: "MEDIUM"
        recommendation: "Remove router import from procedure files (only needed in domain routers)"
        impact: "Importing unused functionality, adds confusion"
        effort: "0.1 hours per file (remove one import line)"
        benefit: "Cleaner imports, clearer separation of concerns"
    ```
   
   **8.2 Generate Recommendations for Degrading Trends**
   
   **CRITICAL - Systemic fixes for systemic problems**:
   ```yaml
   degrading_trend_recommendations:
     increasing_file_sizes:
       issue: "File sizes growing over last [N] migrations"
       recommendation: "Establish file size review in architect phase"
       systemic_fix:
         - "Add file size estimation to migration plans"
         - "Flag files approaching limits early"
       priority: "MEDIUM"
       
     declining_type_safety:
       issue: "Type safety eroding systematically"
       recommendation: "Mandate type coverage checks in validation"
       systemic_fix:
         - "Add type safety threshold to validation gates"
         - "Require explicit typing for new code"
       priority: "HIGH"
   ```
   
   **8.3 Prioritize All Recommendations**
   
   ```yaml
   prioritization:
     urgent:
       definition: "Architecture debt ≥20 or monolithic files"
       action: "PAUSE migrations until addressed"
       
     high:
       definition: "Critical violations or degrading trends"
       action: "Address before next migration"
       
     medium:
       definition: "Threshold violations or concerning trends"
       action: "Address within next 3 migrations"
       
     low:
       definition: "Improvement opportunities"
       action: "Address opportunistically"
   ```

**9. Enhanced Ledger Update**
   
   **Merge architecture metrics with Phase 5 ledger entry**
   
   **9.1 Find Phase 5 Entry**
   
   ```bash
   # Migration ID from handoff package
   MIGRATION_ID=$(jq -r '.migrationId' /tmp/phase5-handoff.json)
   
   # Find entry in ledger
   grep "\"iterationId\":\"$MIGRATION_ID\"" $LEDGER_PATH
   ```
   
   **9.2 Create Architecture Health Enhancement**
   
   ```json
   {
     "architecture_health": {
       "timestamp": "ISO-8601",
       "health_score": 92,
       "status": "excellent|good|fair|poor",
       "trend": "improving|stable|degrading",
       
       "anda_pillars": {
         "type_safety_integrity": 95,
         "cell_quality_score": 88,
         "ledger_completeness": 100
       },
       
       "specialized_architecture": {
         "procedure_compliance": 100,
         "router_compliance": 100,
         "monolithic_file_count": 0
       },
       
       "anti_patterns": {
         "critical_count": 0,
         "high_count": 0,
         "medium_count": 2,
         "total_debt": 2
       },
       
       "trends": {
         "direction": "improving|stable|degrading",
         "degrading_metrics": [],
         "improving_metrics": ["cell_quality"]
       },
       
       "governance": {
         "allow_next_migration": true,
         "pause_required": false,
         "recommendations_count": 2
       }
     }
   }
   ```
   
   **9.3 Merge with Existing Entry**
   
   Read Phase 5 entry, add architecture_health to metadata, write back

**10. Generate Architecture Health Report**
   
   **Create in ARCHITECTURE_REPORTS_DIR/YYYY-MM-DD_HH-MM_architecture-health.md**
   
   **Required sections**:
   ```markdown
   # Architecture Health Assessment
   
   **Date**: {{timestamp}}
   **Migration**: {{componentName}}
   **Overall Health Score**: {{score}}/100 - {{STATUS}}
   **Trend**: {{direction}} ({{improving/stable/degrading}})
   **Governance Decision**: {{CONTINUE | PAUSE}}
   
   ---
   
   ## Executive Summary
   
   {{if CONTINUE}}:
   Architecture health is {{status}}. System ready for continued migrations.
   
   {{if PAUSE}}:
   🔴 Architecture health critical. Migrations paused until refactoring complete.
   
   **Key Findings**:
   - ANDA Pillar Integrity: {{summary}}
   - Specialized Architecture: {{summary}}
   - Anti-Patterns Detected: {{count}} ({{severity_breakdown}})
   - Trend Analysis: {{direction}} with {{degrading_count}} degrading metrics
   
   ---
   
   ## ANDA Pillar Integrity
   
   ### Pillar 1: Type-Safe Data Layer
   **Score**: {{type_safety_score}}/100
   - Any types: {{count}} ({{percentage}}%)
   - Direct DB calls: {{count}} (target: 0)
   - Status: {{✓ Excellent | ⚠️ Needs Improvement}}
   
   ### Pillar 2: Smart Component Cells
   **Score**: {{cell_quality_score}}/100
   - Cells with manifest: {{count}}/{{total}} ({{percentage}}%)
   - Cells with ≥3 assertions: {{count}}/{{total}}
   - Status: {{✓ Excellent | ⚠️ Needs Improvement}}
   
   ### Pillar 3: Architectural Ledger
   **Score**: {{ledger_completeness}}/100
   - Complete entries: {{percentage}}%
   - Status: {{✓ Excellent | ⚠️ Needs Improvement}}
   
   ---
   
   ## Specialized Procedure Architecture
   
   - **Procedure Compliance**: {{percentage}}% ({{compliant}}/{{total}} ≤200 lines)
   - **Router Compliance**: {{percentage}}% ({{compliant}}/{{total}} ≤50 lines)
   - **Monolithic Files**: {{count}} {{✓ 0 | 🔴 detected}}
   
   ---
   
   ## Anti-Pattern Detection
   
   **Total**: {{count}} (Architecture Debt: {{debt}} points)
   
   - **Critical** ({{count}}): {{list}}
   - **High** ({{count}}): {{list}}
   - **Medium** ({{count}}): {{list}}
   
   ---
   
   ## Trend Analysis
   
   **Direction**: {{Improving ↗ | Stable → | Degrading ↘}}
   
   **Degrading Metrics**: {{list}}
   **Improving Metrics**: {{list}}
   
   {{if degrading}}:
   ⚠️ **Early Warning**: {{count}} consecutive degradations detected
   
   ---
   
   ## Strategic Recommendations
   
   **Total**: {{count}}
   
   ### Urgent ({{count}}):
   {{list with details}}
   
   ### High Priority ({{count}}):
   {{list with details}}
   
   ### Medium Priority ({{count}}):
   {{list with details}}
   
   ---
   
   ## Governance Decision
   
   **Decision**: {{CONTINUE | PAUSE}}
   
   {{if CONTINUE}}:
   ✅ **CONTINUE** - Migrations may proceed
   - Health Status: {{status}}
   - Guidance: {{guidance}}
   
   {{if PAUSE}}:
   🔴 **PAUSE** - Migrations halted
   - Health Status: POOR ({{score}}/100)
   - Critical Issues: {{list}}
   - Refactoring Required: {{estimated hours}}
   - Success Criteria: Health score ≥60, zero critical anti-patterns
   
   ---
   
   ## Adoption Progress
   
   **Overall ANDA Adoption**: {{percentage}}%
   - Components migrated: {{count}}/{{total}}
   - Type safety coverage: {{percentage}}%
   - Specialized procedure compliance: {{percentage}}%
   ```

**11. User Notification**
   
   **11.1 For CONTINUE Decision**:
   ```markdown
   ═══════════════════════════════════════
   PHASE 6: ARCHITECTURE HEALTH ASSESSMENT
   ═══════════════════════════════════════
   
   **Overall Health Score**: {{score}}/100 - {{STATUS}} {{🟢|🟡}}
   **Trend**: {{direction}} ({{↗|→|↘}})
   **Governance Decision**: ✅ CONTINUE
   
   ---
   
   ## ANDA Pillar Integrity
   
   - Type-Safe Data Layer: {{score}}/100 {{✓|⚠️}}
   - Smart Component Cells: {{score}}/100 {{✓|⚠️}}
   - Architectural Ledger: {{score}}/100 {{✓|⚠️}}
   
   ## Specialized Procedure Architecture
   
   - Procedure Compliance: {{percentage}}% {{✓|⚠️}}
   - Router Compliance: {{percentage}}% {{✓|⚠️}}
   - Monolithic Files: {{count}} {{✓ 0 | 🔴}}
   
   ## Anti-Patterns: {{count}} total ({{debt}} debt points)
   
   ## Architecture Trends: {{direction}}
   
   {{if degrading}}: ⚠️ Degrading metrics: {{list}}
   
   ---
   
   ## GOVERNANCE DECISION
   
   ✅ **CONTINUE** - Migrations may proceed
   
   **Health Status**: {{status}}
   **Guidance**: {{guidance}}
   
   {{if recommendations}}:
   **Recommendations**: {{count}} items
   - Urgent: {{count}}
   - High: {{count}}
   - Medium: {{count}}
   
   ---
   
   **Reports**:
   - Architecture Health: `{{path}}`
   - Migration Validation: `{{path}}` (from Phase 5)
   - Ledger: ✓ Enhanced with architecture metrics
   
   **Adoption Progress**: {{migrated}}/{{total}} components ({{percentage}}%)
   
   **Next Steps**: Ready for next migration invocation
   ```
   
   **11.2 For PAUSE Decision**:
   ```markdown
   ═══════════════════════════════════════
   PHASE 6: ARCHITECTURE HEALTH ASSESSMENT
   ═══════════════════════════════════════
   
   **Overall Health Score**: {{score}}/100 - POOR 🔴
   **Trend**: {{direction}}
   **Governance Decision**: 🔴 PAUSE
   
   ---
   
   ## CRITICAL ARCHITECTURE ISSUES
   
   {{if debt ≥ 20}}:
   🔴 Architecture debt at emergency level: {{debt}} points (threshold: {{ARCHITECTURE_DEBT_THRESHOLD}})
   
   {{if monolithic_files > 0}}:
   🔴 {{count}} monolithic files detected (architectural emergency)
   
   {{if degrading_metrics ≥ 3}}:
   🔴 Systemic degradation: {{count}} metrics declining over last {{TREND_WINDOW}} migrations
   
   ---
   
   ## GOVERNANCE DECISION
   
   🔴 **PAUSE** - Migrations halted until refactoring complete
   
   **Health Status**: POOR ({{score}}/100)
   
   **Critical Issues**:
   {{for each blocking issue}}:
   {{number}}. {{issue}} - {{required_action}}
   
   **Refactoring Roadmap**:
   
   ### Phase 1: Address Critical Issues (Est: {{hours}} hours)
   {{urgent_recommendations}}
   
   ### Phase 2: High-Priority Improvements (Est: {{hours}} hours)
   {{high_recommendations}}
   
   **Success Criteria for Resuming**:
   - Architecture health score ≥{{HEALTH_SCORE_POOR}} (60)
   - Zero critical anti-patterns
   - Architecture debt <{{ARCHITECTURE_DEBT_THRESHOLD}} points
   
   **Next Steps**:
   1. Review refactoring roadmap
   2. Address critical issues
   3. Re-run Phase 6 assessment
   4. If health ≥60, resume migrations
   
   ⚠️ **Next migrations BLOCKED until architecture debt addressed**
   
   ---
   
   **Reports**:
   - Architecture Health: `{{path}}`
   - Ledger: ✓ Enhanced with critical status
   ```

### Success Criteria

**Architecture Assessment**
- [ ] ANDA pillar integrity scanned (type safety, Cell quality, ledger)
- [ ] Specialized procedure architecture compliance checked (all procedures, all routers)
- [ ] Anti-patterns detected and categorized by severity
- [ ] Trends analyzed across last TREND_WINDOW (5) migrations
- [ ] Architecture health score calculated (0-100)
- [ ] Governance decision determined (CONTINUE or PAUSE)

**Strategic Guidance**
- [ ] Strategic recommendations generated and prioritized
- [ ] Systemic fixes identified for degrading trends
- [ ] Effort estimates provided for recommendations
- [ ] Next actions clear based on governance decision

**Deliverables**
- [ ] Enhanced ledger entry (merged with Phase 5 entry)
- [ ] Architecture health report generated
- [ ] User notified with governance decision
- [ ] Workflow completion status communicated

### Special Considerations

**When to Request Enhanced Cognition from User**:
- Multiple anti-patterns detected requiring systematic root cause analysis
- Conflicting architecture signals (some improving, some degrading)
- Architecture debt threshold reached - need comprehensive refactoring strategy
- Complex trend patterns requiring deep synthesis

Request format: *"Analyzing architecture health trends across {{N}} migrations. Please include 'ultrathink' in your next message for comprehensive trend analysis and strategic recommendations."*

**Trend Analysis**:
- ALWAYS compare with exactly TREND_WINDOW (5) previous migrations
- Look for consecutive degradations (3+ in a row = systemic issue)
- Project future state if trends continue
- Systemic issues require systemic solutions, not tactical fixes

**Governance Philosophy**:
- Proactive governance prevents disasters
- PAUSE migrations when health <60 - don't accumulate more debt
- Better to refactor once than fight accumulated debt forever
- Architecture health trends matter more than single scores

**Ledger Enhancement**:
- Merge architecture metrics with Phase 5 entry (don't create new entry)
- Track architecture metrics even if this migration succeeded
- Enable trend analysis for next invocation

### Output Format

Provide comprehensive architecture assessment with:
- System-wide health metrics (ANDA pillars, specialized architecture)
- Anti-pattern detection results with severity categorization
- Trend analysis showing improving/stable/degrading metrics
- Architecture health score (0-100) with status
- Governance decision (CONTINUE or PAUSE) with reasoning
- Strategic recommendations prioritized by urgency
- Clear next steps based on governance decision

### Remember

You are the **strategic guardian of system-wide architecture health**. Every assessment ensures the ENTIRE codebase maintains architectural integrity and remains optimized for AI agent development. You detect drift from ANDA principles early - catching monolithic files at migration 5, not migration 50. You track trends across multiple migrations to identify systemic issues that require systemic solutions. You make governance decisions that can PAUSE future migrations if architecture debt becomes critical. You generate strategic recommendations BEFORE continuing migrations. Your assessments prevent the architectural debt that would make future agent work unreliable. You don't validate individual migrations (Phase 5 did that) - you ensure the overall system stays healthy, lean, and agent-optimal. Track comprehensively, analyze systematically, govern proactively, recommend strategically.
