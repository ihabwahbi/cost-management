---
date: 2025-10-03T15:00:00Z
author: aster
git_commit: "unknown"
branch: "unknown"
repository: "unknown"
topic: "API Procedure Specialization Architecture"
status: "draft"
tags: [architecture, api, trpc, agent-optimal]
complexity_score: 25
components:
  - "Domain Router"
  - "Specialized Procedure"
  - "Domain Helper"
---

# API Procedure Specialization Architecture

## 1. System Overview

This document outlines the **API Procedure Specialization** architecture, a framework for structuring a tRPC backend to be optimally navigable, maintainable, and scalable for AI agent developers. It directly addresses the architectural drift observed in the project's API layer, where monolithic files have become a bottleneck for efficient agentic work.

The core principle is to treat each API procedure as a self-contained "Cell," mirroring the frontend architecture's philosophy of radical granularity. By breaking down large, domain-based routers into individual procedure files, we create a low-friction environment where an AI agent's context is perfectly scoped to the task at hand. This minimizes cognitive overhead, drastically reduces the risk of unintended side effects, and enhances the discoverability of business logic through a clear, hierarchical file structure.

This architecture is a direct application of the **Agent-Navigable Dataflow Architecture (ANDA)** principles to the backend, ensuring that our API layer is as lean, explicit, and scalable as the rest of the system.

## 2. Requirements Analysis

This section defines the requirements for the API router architecture, derived directly from the core principles of the Agent-Navigable Dataflow Architecture (ANDA). The primary goal is to create a backend structure that is optimized for AI agent comprehension, modification, and scalability.

### MUST Have (Core Agent Enablement)

These requirements are non-negotiable and form the foundation of an agent-optimal API layer.

*   **M1: One Procedure, One File:** Every tRPC procedure **MUST** exist in its own dedicated file.
    *   *ANDA Principle: Radical Granularity & Atomicity.*
    *   *Rationale: This is the most critical requirement. It ensures that the context an agent needs to load is minimal and perfectly scoped. It eliminates cognitive overhead and reduces the risk of unintended side effects.*

*   **M2: Strict File Size Limit:** No procedure file **MUST** exceed 200 lines of code.
    *   *ANDA Principle: Radical Granularity & Atomicity.*
    *   *Rationale: Enforces extreme leanness, guaranteeing that any procedure and its local helpers can be fully understood by an agent in a single pass.*

*   **M3: No Parallel Implementations:** There **MUST** be only one implementation for the tRPC backend (Drizzle-based). All procedures are served through Next.js API routes at `/api/trpc`.
    *   *ANDA Principle: Explicitness over Implicitness, Lean Codebase.*
    *   *Rationale: Eliminates ambiguity for the agent. There must be a single, clear source of truth for all API logic.*
    *   *Status: ✅ COMPLETED - Legacy Supabase Edge Function implementation removed (2025-10-10)*

*   **M4: Explicit Naming Conventions:** Procedure filenames **MUST** clearly describe their single purpose (e.g., `get-kpi-metrics.procedure.ts`).
    *   *ANDA Principle: Explicitness over Implicitness.*
    *   *Rationale: Enables agents to discover procedures through file searches (glob) rather than by reading large, vaguely named files.*

### SHOULD Have (Scalability and Maintainability)

These requirements ensure the architecture remains clean and scalable as the application grows.

*   **S1: Domain-Based Grouping:** Individual procedure files **SHOULD** be grouped into directories based on their business domain (e.g., `dashboard`, `po-mapping`).
    *   *Rationale: Provides a logical, hierarchical structure that helps both agents and humans navigate the API codebase.*

*   **S2: Shared Logic in Helpers:** Reusable logic (e.g., `splitMappedAmount`) **SHOULD** be extracted into clearly named helper files within the same domain directory.
    *   *Rationale: Promotes DRY principles while keeping the helpers close to the procedures that use them, maintaining domain cohesion.*

### COULD Have (Future Optimizations)

*   **C1: Automated Structure Validation:** The CI/CD pipeline **COULD** include a validation step to enforce the "One Procedure, One File" rule and file size limits.
    *   *Rationale: Automates architectural governance, preventing future deviations.*

### WON'T Have (Out of Scope)

*   **W1: Dynamic Router Generation:** This architecture **WON'T** use dynamic file-based router generation at this stage. Routers will be composed by explicitly importing procedures.
    *   *Rationale: While elegant, dynamic generation can reduce explicitness. An agent can more easily trace explicit imports than understand a dynamic generation mechanism.*

## 3. Component Architecture

This section evaluates architectural patterns for the tRPC backend, selecting the optimal structure for agentic development based on the approved requirements.

### Component Candidates

Two primary architectural patterns were considered:

1.  **Monolithic Router (Current Approach):** A single file per domain (e.g., `dashboard.ts`) contains all related tRPC procedures and helper functions.
2.  **Specialized Procedures (Proposed Approach):** Each tRPC procedure is isolated in its own file, grouped by domain into a hierarchical folder structure.

### Candidate Evaluation

| Metric | Monolithic Router (Current) | Specialized Procedures (Proposed) | Justification |
| :--- | :--- | :--- | :--- |
| **Agent Context Size** | 🔴 **Very High** (890+ lines) | 🟢 **Very Low** (<200 lines) | An agent only needs to load the single file for the procedure it's working on, drastically reducing token usage. |
| **Discoverability** | 🔴 **Poor** | 🟢 **Excellent** | Procedures are discoverable via file system search (e.g., `glob('**/get-kpi-metrics*.ts')`). No need to read a massive file. |
| **Risk of Side Effects** | 🔴 **High** | 🟢 **Very Low** | Modifying a single, isolated file is far less likely to impact other procedures than changing code in a shared monolith. |
| **Scalability** | 🔴 **Poor** | 🟢 **Excellent** | Adding a new procedure is as simple as adding a new file. The complexity of the system does not increase the complexity of individual tasks. |
| **Adherence to ANDA** | 🔴 **Fails** | 🟢 **Fully Compliant** | The specialized model is a direct implementation of the "Radical Granularity & Atomicity" principle. |

### Decision: Specialized Procedures

The **Specialized Procedures** architecture is unequivocally selected.

The monolithic approach, while common in human-centric development, creates a high-friction environment for AI agents. It forces them to ingest large, irrelevant contexts, making modifications risky and inefficient.

The Specialized Procedures architecture treats each API endpoint as a "Cell," mirroring the frontend philosophy. This creates a clean, predictable, and low-risk environment where an agent can operate with maximum confidence and minimal overhead. This is the only approach that aligns with our strategic goal of creating an AI-agent-optimal codebase.

## 4. System Interaction Patterns

The following diagrams illustrate the fundamental shift in how an AI agent interacts with the API codebase.

### Current Architecture: Monolithic Router

This diagram shows the current state. An agent needing to modify a single piece of logic (e.g., `getRecentActivity`) must load and interact with the entire `dashboard.ts` monolith, which contains many unrelated procedures. This increases cognitive load and the risk of unintended changes.

```mermaid
graph TD
    subgraph Frontend
        A["DashboardCell (component.tsx)"]
    end

    subgraph Backend API (packages/api)
        B["dashboard.ts (890 lines)"]
        style B fill:#f9f,stroke:#333,stroke-width:2px

        C["getKPIMetrics()"]
        D["getRecentActivity()"]
        E["getPLMetrics()"]
        F["...and 5 more procedures"]
    end

    A -- "trpc.dashboard.getRecentActivity.useQuery()" --> B
    B --- C
    B --- D
    B --- E
    B --- F

    subgraph Agent Interaction
        G["AI Agent"] -- "Loads entire 890-line file to change one function" --> B
    end
```

### Proposed Architecture: Specialized Procedures

This diagram shows the new architecture. The agent can now interact with a small, targeted file (`get-recent-activity.procedure.ts`) that contains only the relevant logic. The domain router (`dashboard.router.ts`) is a simple, stable file that rarely changes and just assembles the individual procedures.

```mermaid
graph TD
    subgraph Frontend
        A["DashboardCell (component.tsx)"]
    end

    subgraph Backend API (packages/api/src/procedures/dashboard)
        B["dashboard.router.ts (15 lines)"]
        style B fill:#ccf,stroke:#333,stroke-width:2px

        C["get-kpi-metrics.procedure.ts (<200 lines)"]
        D["get-recent-activity.procedure.ts (<200 lines)"]
        style D fill:#9f9,stroke:#333,stroke-width:2px
        E["get-pl-metrics.procedure.ts (<200 lines)"]
        F["...5 more procedure files"]
    end

    A -- "trpc.dashboard.getRecentActivity.useQuery()" --> B
    B -- "Imports and composes" --> C
    B -- "Imports and composes" --> D
    B -- "Imports and composes" --> E
    B -- "Imports and composes" --> F

    subgraph Agent Interaction
        G["AI Agent"] -- "Loads only the relevant 80-line file" --> D
    end
```

## 5. File and Folder Structure

To implement the Specialized Procedures architecture, the `packages/api/src` directory will be reorganized from a feature-based model (`routers`) to a domain-based, granular model (`procedures`).

### Proposed Directory Structure

```
packages/api/src/
│
├── procedures/
│   │
│   ├── dashboard/
│   │   ├── helpers/
│   │   │   └── get-relative-time.helper.ts
│   │   │
│   │   ├── get-financial-control-metrics.procedure.ts
│   │   ├── get-kpi-metrics.procedure.ts
│   │   ├── get-main-metrics.procedure.ts
│   │   ├── get-pl-metrics.procedure.ts
│   │   ├── get-pl-timeline.procedure.ts
│   │   ├── get-promise-dates.procedure.ts
│   │   ├── get-recent-activity.procedure.ts
│   │   ├── get-timeline-budget.procedure.ts
│   │   │
│   │   └── dashboard.router.ts  # Aggregates all dashboard procedures
│   │
│   ├── po-mapping/
│   │   ├── helpers/
│   │   │   └── ... (any shared helpers for PO mapping)
│   │   │
│   │   ├── create-mapping.procedure.ts
│   │   ├── find-matching-cost-breakdown.procedure.ts
│   │   ├── get-projects.procedure.ts
│   │   ├── ... (and 6 more procedure files)
│   │   │
│   │   └── po-mapping.router.ts # Aggregates all po-mapping procedures
│
├── routers/
│   ├── dashboard.ts      # DEPRECATED -> To be deleted after refactor
│   └── po-mapping.ts     # DEPRECATED -> To be deleted after refactor
│
├── index.ts              # Main appRouter - will import from procedure routers
└── trpc.ts               # Core tRPC setup (unchanged)
```

## 6. Migration Path

This is a phased approach to refactor the existing `packages/api/src/routers/dashboard.ts` file into the new agent-optimal architecture.

### Phase 1: Preparation

1.  **Create New Directories:**
    *   Create `packages/api/src/procedures/`.
    *   Create `packages/api/src/procedures/dashboard/`.
    *   Create `packages/api/src/procedures/dashboard/helpers/`.

2.  **Create New Router File:**
    *   Create an empty `packages/api/src/procedures/dashboard/dashboard.router.ts`.

3.  **Migrate Helpers:**
    *   Move helper functions into their own files within the new `helpers` directory.
    *   Update the original `dashboard.ts` to import these functions from their new location temporarily.

### Phase 2: Procedure-by-Procedure Migration (Repeat for each procedure)

1.  **Create Procedure File:** (e.g., `get-main-metrics.procedure.ts`).
2.  **Move the Logic:** Cut the procedure logic from the old router and paste it into the new file.
3.  **Update Domain Router:** Import the new procedure into the new domain router file (e.g., `dashboard.router.ts`).
4.  **Update Main App Router:** In `packages/api/src/index.ts`, update the `appRouter` to use the new domain router.
5.  **Delete Old Code:** Delete the procedure from the old monolithic router file.
6.  **Validate:** Run type checks and tests to confirm the endpoint still works.

### Phase 3: Cleanup

1.  **Delete Old Router File:** Once all procedures are moved, delete the old monolithic file (e.g., `dashboard.ts`).
2.  **✅ COMPLETED: Supabase Edge Function Removed:** The legacy `supabase/functions/trpc/` directory has been deleted. All API procedures now serve through Next.js API routes at `/api/trpc` (completed 2025-10-10).
3.  **Final Validation:** Run all application tests.

## 7. Final Component Manifest

This manifest lists the definitive architectural components for the refactored tRPC backend.

### Component Type: Domain Router
*   **Purpose:** Aggregates individual procedures into a cohesive, domain-specific tRPC router.
*   **Components:**
    *   `dashboard.router.ts`
    *   `po-mapping.router.ts`

### Component Type: Specialized Procedure
*   **Purpose:** Encapsulates the logic for a single API endpoint.
*   **Naming Convention:** `[procedure-name].procedure.ts`
*   **Components (Dashboard Domain):**
    *   `get-financial-control-metrics.procedure.ts`
    *   `get-kpi-metrics.procedure.ts`
    *   `get-main-metrics.procedure.ts`
    *   `get-pl-metrics.procedure.ts`
    *   `get-pl-timeline.procedure.ts`
    *   `get-promise-dates.procedure.ts`
    *   `get-recent-activity.procedure.ts`
    *   `get-timeline-budget.procedure.ts`
*   **Components (PO Mapping Domain):**
    *   (List of 9 procedures)

### Component Type: Domain Helper
*   **Purpose:** Contains reusable business logic shared by procedures within the same domain.
*   **Naming Convention:** `[function-name].helper.ts`
*   **Components (Dashboard Domain):**
    *   `get-relative-time.helper.ts`
    *   `split-mapped-amount.helper.ts`
    *   `generate-pl-timeline.helper.ts`

### Deprecated Components (Migration History)
*   **Purpose:** These components were removed during the architecture migration.
*   **Status:**
    *   `packages/api/src/routers/dashboard.ts` - ✅ Migrated to specialized procedures
    *   `packages/api/src/routers/po-mapping.ts` - ✅ Migrated to specialized procedures  
    *   `supabase/functions/trpc/` - ✅ **DELETED** (2025-10-10) - Replaced with Next.js API routes
