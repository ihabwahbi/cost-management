# Agent Component Verification Updates

## Critical Updates Required for All Primary Agents

This document contains specific code additions to prevent agents from working on orphaned components.

---

## 1. DiagnosticsResearcher Updates

### Add to Orchestration Patterns section (after line 177):

```python
## Component Activity Verification Pattern

Used to verify which components are actually active before reporting issues:

```python
async def verify_component_activity(component_files):
    # Step 1: Check import chains
    active_components = []
    for component in component_files:
        # Check if component is imported anywhere
        component_name = path.basename(component.path, '.tsx')
        imports = await bash(f'grep -r "import.*{component_name}" --include="*.tsx" --include="*.jsx"')
        
        if imports.stdout:
            # Trace up to page.tsx or layout.tsx
            import_files = imports.stdout.split('\n')
            reaches_page = False
            
            for import_file in import_files:
                file_path = import_file.split(':')[0]
                if 'page.tsx' in file_path or 'layout.tsx' in file_path:
                    reaches_page = True
                    break
            
            if reaches_page:
                component.status = "ACTIVE"
                active_components.append(component)
            else:
                component.status = "ORPHANED"
                console.log(f"⚠️ Component {component_name} doesn't reach any page")
        else:
            component.status = "NOT_IMPORTED"
            console.log(f"❌ Component {component_name} is not imported anywhere")
    
    # Step 2: Detect redundant implementations
    base_names = {}
    for component in component_files:
        base = component.path.replace('-fixed', '').replace('-v2', '').replace('-worldclass', '')
        if base not in base_names:
            base_names[base] = []
        base_names[base].append(component)
    
    for base, variants in base_names.items():
        if len(variants) > 1:
            console.warn(f"🚫 ANTI-PATTERN: {len(variants)} versions of {base} found")
            # Report only the active one
            active = [v for v in variants if v.status == "ACTIVE"]
            if active:
                primary = active[0]
                console.log(f"✅ Using active component: {primary.path}")
            else:
                console.error(f"❌ No active version found for {base}")
    
    # Step 3: Return only active components for investigation
    return active_components
```

### Update Phase 2 Workflow section (line 440):

```python
**2.1 Launch Parallel Investigations**
```python
# CRITICAL: First verify component activity if UI issues involved
if issue.involves_ui_components:
    mentioned_components = extract_component_paths(issue)
    active_components = await verify_component_activity(mentioned_components)
    
    if len(active_components) < len(mentioned_components):
        # Some components are orphaned
        orphaned = [c for c in mentioned_components if c not in active_components]
        console.warn(f"Skipping orphaned components: {orphaned}")
    
    # Only investigate active components
    target_components = active_components
else:
    target_components = issue.components

# Now run parallel investigations on verified components only
```

---

## 2. DesignIdeator Updates

### Add to Phase 1: CONTEXT ABSORPTION (after line 338):

```python
**1.1a Component Verification** [CRITICAL]
If diagnostic mentions specific component files:
```python
# Verify components are actually used before designing for them
mentioned_components = extract_components_from_diagnostic(diagnostic_report)

for component_path in mentioned_components:
    component_name = path.basename(component_path, '.tsx')
    
    # Check if imported
    imports = await bash(f'grep -r "import.*{component_name}" --include="*.tsx"')
    
    if not imports.stdout:
        console.warn(f"⚠️ Component {component_path} is not imported - may be orphaned")
        
        # Look for active alternative
        base_name = component_name.replace('-fixed', '').replace('-v2', '').replace('-worldclass', '')
        alternatives = await glob(f"**/*{base_name}*.tsx")
        
        for alt in alternatives:
            alt_name = path.basename(alt, '.tsx')
            alt_imports = await bash(f'grep -r "import.*{alt_name}" --include="*.tsx"')
            if alt_imports.stdout:
                console.log(f"✅ Found active alternative: {alt}")
                console.log(f"🔄 Redirecting design from {component_path} to {alt}")
                # Update component reference
                component_path = alt
                break
    
    # Check for anti-patterns
    if '-fixed' in component_path or '-v2' in component_path or '-worldclass' in component_path:
        console.warn(f"🚫 ANTI-PATTERN: Component {component_path} has version suffix")
        console.warn(f"⚠️ Design should target original component, not create another version")
```
✓ Verify: Working with correct active components only

### Update COMPONENT_ANALYZER task (line 102):

```python
Task(COMPONENT_ANALYZER,
     """Analyze existing component patterns and usage.
        CRITICAL: For each component:
        1. Verify it's actually imported (not orphaned)
        2. Check if multiple versions exist (anti-pattern)
        3. Identify which version is active (reaches a page)
        4. Flag files with -fixed, -v2, -worldclass suffixes
        Report: active vs orphaned components""",
     subagent_type="component-pattern-analyzer")
```

---

## 3. ModernizationOrchestrator Updates

### Add new Orchestration Pattern (after line 266):

```python
## Component Activity Verification Pattern

Used to validate components before including in implementation plan:

```python
async def verify_component_targets(diagnostic_components, design_components):
    # Step 1: Combine all mentioned components
    all_components = set(diagnostic_components + design_components)
    
    # Step 2: Check each component's activity status
    verification_results = {}
    
    for component_path in all_components:
        component_name = path.basename(component_path, '.tsx')
        base_name = component_name.replace('-fixed', '').replace('-v2', '').replace('-worldclass', '')
        
        # Find all variants
        variants = await glob(f"**/*{base_name}*.tsx")
        
        if len(variants) > 1:
            console.warn(f"⚠️ Multiple versions of {base_name} detected:")
            
            # Find active variant
            active_variant = None
            for variant in variants:
                variant_name = path.basename(variant, '.tsx')
                imports = await bash(f'grep -r "import.*{variant_name}" --include="*.tsx"')
                
                if imports.stdout:
                    # Check if reaches a page
                    import_files = imports.stdout.split('\n')
                    for import_file in import_files:
                        if 'page.tsx' in import_file or 'layout.tsx' in import_file:
                            active_variant = variant
                            console.log(f"✅ Active: {variant}")
                            break
                else:
                    console.log(f"❌ Orphaned: {variant}")
            
            if active_variant and active_variant != component_path:
                console.warn(f"🔄 Redirecting plan from {component_path} to {active_variant}")
                verification_results[component_path] = {
                    'redirect_to': active_variant,
                    'reason': 'original_is_orphaned'
                }
            elif not active_variant:
                console.error(f"❌ No active variant found for {base_name}")
                verification_results[component_path] = {
                    'skip': True,
                    'reason': 'no_active_variant'
                }
        else:
            # Single component - verify it's active
            imports = await bash(f'grep -r "import.*{component_name}" --include="*.tsx"')
            if not imports.stdout:
                console.warn(f"⚠️ Component {component_path} is not imported")
                verification_results[component_path] = {
                    'skip': True,
                    'reason': 'not_imported'
                }
    
    # Step 3: Add warnings to plan
    if any('redirect_to' in v for v in verification_results.values()):
        plan.add_critical_note("""
        ⚠️ COMPONENT VERIFICATION RESULTS:
        Some components have been redirected to their active versions.
        Phase 4 MUST use the redirected paths, not the originals.
        """)
    
    # Step 4: Anti-pattern prevention
    plan.add_constraint("""
    🚫 CRITICAL CONSTRAINT:
    - NEVER create new files with -fixed, -v2, or -worldclass suffixes
    - ALWAYS update the existing active component
    - If multiple versions exist, work ONLY on the imported one
    """)
    
    return verification_results
```

### Add to Phase 2: PARALLEL TECHNICAL ANALYSIS (after line 440):

```python
**2.0 Component Verification** [CRITICAL]
```python
# Before any technical analysis, verify component targets
diagnostic_components = extract_components_from_diagnostic()
design_components = extract_components_from_design()

verification = await verify_component_targets(diagnostic_components, design_components)

# Update component lists based on verification
for original, result in verification.items():
    if 'redirect_to' in result:
        TodoWrite(f"Component redirect: {original} → {result['redirect_to']}")
        # Update all references
    elif result.get('skip'):
        TodoWrite(f"Skipping orphaned component: {original}")
        # Remove from plan
```

---

## 4. ModernizationImplementer Updates

### Add to Phase 2: INTELLIGENT BUG FIXES (before line 655):

```python
**2.0 Component Target Verification** [CRITICAL]
Before ANY file modifications:
```typescript
// CRITICAL: Verify component is actually used
async function verifyBeforeModifying(componentPath: string) {
  console.log(`[VERIFY] Checking if ${componentPath} is active...`);
  
  // Step 1: Check if component is imported anywhere
  const componentName = path.basename(componentPath, '.tsx');
  const imports = await bash(`grep -r "import.*${componentName}" --include="*.tsx" --include="*.jsx"`);
  
  if (!imports.stdout) {
    console.warn(`⚠️ ${componentPath} is NOT imported anywhere - may be orphaned!`);
    
    // Step 2: Look for the active version
    const baseName = componentName.replace(/-fixed|-v2|-worldclass/, '');
    const variants = await glob(`**/*${baseName}*.tsx`);
    
    if (variants.length > 1) {
      console.warn(`Found ${variants.length} versions of ${baseName}`);
      
      // Find active one
      for (const variant of variants) {
        const variantName = path.basename(variant, '.tsx');
        const variantImports = await bash(`grep -r "import.*${variantName}" --include="*.tsx"`);
        
        if (variantImports.stdout) {
          console.log(`✅ Active component found: ${variant}`);
          
          // Check if it reaches a page
          const importFiles = variantImports.stdout.split('\n');
          for (const importFile of importFiles) {
            if (importFile.includes('page.tsx') || importFile.includes('layout.tsx')) {
              console.log(`✅ Component reaches UI through: ${importFile}`);
              console.log(`🔄 REDIRECTING implementation to active component: ${variant}`);
              return variant; // Return active component path
            }
          }
        }
      }
      
      console.error(`❌ No active variant found for ${baseName}`);
      throw new Error(`Refusing to modify orphaned component: ${componentPath}`);
    }
  } else {
    // Component is imported - verify it reaches UI
    const importFiles = imports.stdout.split('\n');
    let reachesUI = false;
    
    for (const importFile of importFiles) {
      if (importFile.includes('page.tsx') || importFile.includes('layout.tsx')) {
        reachesUI = true;
        console.log(`✅ Component is active and reaches UI via: ${importFile}`);
        break;
      }
    }
    
    if (!reachesUI) {
      console.warn(`⚠️ Component is imported but doesn't reach any page/layout`);
    }
  }
  
  // Step 3: Prevent anti-pattern creation
  if (componentPath.includes('-fixed') || componentPath.includes('-worldclass') || componentPath.includes('-v2')) {
    console.error(`🚫 ANTI-PATTERN PREVENTED: Never create/modify ${componentPath}`);
    
    // Find and suggest the original
    const originalPath = componentPath.replace(/-fixed|-worldclass|-v2/, '');
    if (await fileExists(originalPath)) {
      console.log(`✅ Use original component instead: ${originalPath}`);
      return originalPath;
    }
    
    throw new Error(`Anti-pattern detected: Never create new -fixed versions. Update the original component.`);
  }
  
  console.log(`✅ Component ${componentPath} verified as active`);
  return componentPath; // Return verified path
}

// Apply verification before EVERY edit
const verifiedPath = await verifyBeforeModifying(targetComponentPath);
if (verifiedPath !== targetComponentPath) {
  console.log(`📝 Updating target from ${targetComponentPath} to ${verifiedPath}`);
  targetComponentPath = verifiedPath;
}
```
✓ Verify: Working on correct active component
```

### Add to Phase 5: COMPREHENSIVE VALIDATION (line 795):

```python
**5.2 Component Activity Final Check**
```bash
#!/bin/bash
# Verify all modified components are actually used

echo "Verifying modified components are active..."

for file in $(git diff --name-only | grep -E '\.tsx$'); do
  component=$(basename "$file" .tsx)
  
  # Check if imported
  if ! grep -r "import.*$component" --include="*.tsx" > /dev/null; then
    echo "WARNING: $file may be orphaned (not imported anywhere)"
    echo "Changes may not be visible in the UI!"
  fi
  
  # Check for anti-pattern
  if echo "$file" | grep -E '(-fixed|-v2|-worldclass)\.tsx$' > /dev/null; then
    echo "ERROR: Anti-pattern detected - modified versioned file: $file"
    echo "Should have modified the original component instead!"
  fi
done

echo "Component verification complete"
```
✓ Verify: All changes in active components
```

---

## Testing the Updates

After applying all updates, test with this scenario:

```bash
# Create a test scenario with multiple component versions
touch components/test-component.tsx
touch components/test-component-fixed.tsx
touch components/test-component-worldclass.tsx

# Only import the original in a page
echo "import TestComponent from '../components/test-component'" >> app/page.tsx

# Run diagnostic on "issue with test-component-fixed"
DiagnosticsResearcher: Investigate issue with test-component-fixed rendering

# EXPECTED BEHAVIOR:
# 1. Agent detects test-component-fixed is orphaned
# 2. Finds test-component is active
# 3. Redirects investigation to test-component
# 4. Reports anti-pattern in diagnostic
```

## Success Criteria

After implementing these updates:

✅ No agent works on orphaned components  
✅ Anti-patterns (-fixed, -v2) are detected and prevented  
✅ All work redirected to active components  
✅ Clear warnings when multiple versions exist  
✅ Implementation only affects components that reach the UI  

## Rollback Plan

If issues occur, remove:
1. Component Activity Verification Pattern from each agent
2. Pre-verification steps in workflows
3. Anti-pattern prevention constraints

Keep original workflow but add manual verification step.