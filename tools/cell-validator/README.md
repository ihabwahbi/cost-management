# @cost-mgmt/cell-validator

CLI tool to validate Component Cell structure and configuration for the Living Blueprint Architecture.

## Overview

The Cell Validator ensures Component Cells follow the architectural standards:

- **Manifest Validation** - Verifies `manifest.json` structure and required fields
- **Pipeline Validation** - Validates `pipeline.yaml` quality gates
- **Structure Validation** - Checks for required files and patterns
- **Behavioral Assertions** - Ensures assertions are properly defined

## Installation

```bash
# From project root
pnpm install

# Make CLI executable (if not already)
chmod +x tools/cell-validator/bin/cell-validator.js
```

## Usage

### Validate a Single Cell

```bash
# From project root
pnpm --filter @cost-mgmt/cell-validator exec cell-validator validate <cell-path>

# Or directly with node
node tools/cell-validator/bin/cell-validator.js validate apps/web/cells/KPICard
```

### Validate All Cells (Future)

```bash
pnpm --filter @cost-mgmt/cell-validator exec cell-validator validate-all
```

## Validation Rules

### Manifest Requirements

The `manifest.json` must include:

- **id**: Unique Cell identifier
- **version**: Semver format (e.g., "1.0.0")
- **description**: Clear description of Cell purpose
- **dataContract**:
  - `source`: tRPC procedure reference (e.g., "projects.getById")
  - `inputSchema`: (optional) Input type definition
  - `outputSchema`: (optional) Output type definition
- **behavioralAssertions**: Array of assertions with:
  - `id`: Unique assertion identifier
  - `description`: What the assertion validates
  - `testFile`: (optional) Path to test file

### Pipeline Requirements

The `pipeline.yaml` must include:

- **gates**:
  - `typeCheck`: TypeScript compilation check
  - `lint`: Code linting
  - `unitTests`: Unit test execution with optional coverage
  - `behavioralAssertions`: Behavioral test validation
- **successCriteria**:
  - `allGatesMustPass`: Boolean (recommended: true)
  - `minCoverage`: (optional) Minimum test coverage percentage

### Structure Requirements

Required files:
- `component.tsx` - React component (< 200 lines recommended)
- `state.ts` - Zustand state management
- `manifest.json` - Cell metadata
- `pipeline.yaml` - Quality gates

Optional files:
- `README.md` - Cell documentation
- `index.ts` - Public exports

## Example Cell Structure

```
apps/web/cells/KPICard/
├── component.tsx         # React component
├── state.ts              # Zustand store
├── manifest.json         # Cell metadata
├── pipeline.yaml         # Quality gates
├── README.md            # Documentation
└── __tests__/
    ├── component.test.tsx
    └── behavioral.test.ts
```

## Example manifest.json

```json
{
  "id": "KPICard",
  "version": "1.0.0",
  "description": "Displays a single KPI metric with trend indicators",
  "dataContract": {
    "source": "projects.getKPIs"
  },
  "behavioralAssertions": [
    {
      "id": "displays-metric-value",
      "description": "Displays the metric value from data contract",
      "testFile": "__tests__/behavioral.test.ts"
    },
    {
      "id": "updates-on-data-change",
      "description": "Updates display when data contract emits new value"
    }
  ],
  "tags": ["dashboard", "metrics"]
}
```

## Example pipeline.yaml

```yaml
name: KPICard Pipeline

gates:
  typeCheck:
    command: "tsc --noEmit"
    enabled: true
  
  lint:
    command: "eslint ."
    enabled: true
  
  unitTests:
    command: "vitest run"
    coverage: 80
    enabled: true
  
  behavioralAssertions:
    command: "vitest run __tests__/behavioral.test.ts"
    enabled: true

successCriteria:
  allGatesMustPass: true
  minCoverage: 80
```

## Exit Codes

- `0` - Validation passed
- `1` - Validation failed with errors

## Development

### Type Check

```bash
pnpm type-check
```

### Run Tests

```bash
pnpm test
```

## Roadmap

- [ ] `validate-all` command to check all Cells in project
- [ ] Integration with CI/CD pipelines
- [ ] Auto-fix capabilities for common issues
- [ ] JSON Schema export for IDE autocomplete
- [ ] Performance metrics collection

## Documentation

- [Living Blueprint Architecture](../../docs/living-blueprint-architecture.md)
- [Component Cells](../../docs/living-blueprint-architecture.md#22-pillar-2-smart-component-cells)
