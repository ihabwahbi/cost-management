# Cost Management Hub Product Requirements Document (PRD)

## 1. Goals and Background Context

### **Goals**

* **Gain Control**: Achieve real-time control over project spending to protect profitability.
* **Increase Speed**: Accelerate financial analysis from days of manual work to minutes on a dashboard.
* **Reduce Effort**: Minimize the manual, repetitive workload for the Planning & Supply Chain team.
* **Improve Confidence**: Establish a single, trusted source of truth for all project cost data.
* **Enable Powerful Analytics**: Unlock detailed insights into spending patterns by adding custom identifiers not available in the source systems.
* **Create a Unified Financial Timeline**: Connect past assumptions, present spending, and future forecasts into a single, evolving view of a project's entire financial lifecycle.

### **Background Context**

The current process for tracking project costs is fragmented and static, creating a significant gap between initial financial planning and the operational reality of daily expenditure. A core reason for this challenge is that the existing business systems are rigid; they do not provide the flexibility to specify detailed project identifiers when a Purchase Order (PO) is raised.

This PRD outlines the requirements for the **Cost Management Hub**, a dynamic, **all-in-one hub** for project financial management. The application is designed to solve the data-linking problem by serving as an **evolving P&L** for each project. It will allow users to create a project's initial financial baseline, capturing the revenue and cost assumptions from the tender phase.

Crucially, this baseline is not static. The system is built to capture all subsequent updates to both revenue and cost forecasts, creating a **versioned history**. This will allow teams to see not just the current budget, but the entire story of how it has grown in complexity and evolved over time. By mapping real-time PO data (actual invoiced cost, remaining open PO value) against this living budget, the Hub connects everything in place. It will be the single tool that links a project's financial **past** (initial assumptions), **present** (as-of-today actual costs), and **future** (what's coming, and when it will come), enabling true proactive control.

The MVP will focus on the high-impact M&S cost line to prove this comprehensive model and deliver immediate value.

## 2. Requirements

### **Functional Requirements**

#### **Project & Financial Planning**

* FR1: Users must be able to create a new Project entity with a name, sub-business line, start date, and end date.
* FR2: Users must be able to define a versioned, monthly revenue forecast for each Project.
* FR3: Users must be able to create a hierarchical structure of Cost Assumptions for a Project.
* FR4: Users must be able to define a versioned, monthly budget forecast for each lowest-level Cost Assumption category.
* FR5: During the mapping phase, users must be able to create and map POs to new, deeper sub-categories that link back to the parent categories defined in the initial budget.

#### **Provisional Mapping (Pre-PO)**

* FR6: The system must provide an interface for users to submit mapping information (Project, Cost Category, etc.) using a **Purchase Requisition (PR) Number** before a PO is generated.
* FR7: The system must provide a similar interface for users to submit mapping information using an **SRM Shopping Cart Number**.

#### **Data Ingestion**

* FR8: The system must ingest PO data from a CSV file.
* FR9: The ingestion process must use `PO Number` + `PO Line Item` as the unique identifier.
* FR10: The ingestion process must preserve all pre-existing manual mappings when updating a PO record.
* FR11: The ingestion process must join PO data with external dimension tables/reports (e.g., G/L Account mapping, WBS-to-Project mapping, PO-to-Asset mapping) to enrich the data.
* FR12: The ingestion process must automatically check for and apply any existing Provisional Mappings based on a matching PR Number or SRM Shopping Cart Number.

#### **PO Mapping Inbox**

* FR13: The inbox must display unmapped POs, summarized by `PO Number`.
* FR14: The summary view for each PO must be expandable to show all its individual line items with details like quantity and value.
* FR15: The inbox view must display contextual "helper" data to make mapping more efficient, including Project Name (derived from WBS), Asset Code, FMT Status (derived from `PO Created by Name` being 'BATCH-FLM'), and Vendor details.
* FR16: The inbox must provide filtering by `Company Code`, `Plant`, `Sub Business Line`, `SLB Vendor Category`, a pasted list of PO numbers, and PO creation date.

#### **PO Management & Review**

* FR17: Users must be able to add versioned comments to any PO to capture context or review notes.
* FR18: Users must be able to apply "Action Flags" to a PO (e.g., "Flag for Cancellation," "Flag to De-expedite").
* FR19: Users must be able to edit or change a PO's mapping details after it has been initially processed.

#### **Reporting & Analytics**

* FR20: The system must provide a project view that compares total budget vs. total PO value (invoiced and open).
* FR21: The system must provide a timeline view showing the versioned history of forecasts.
* FR22: Reports must support drill-down from a high-level summary down to individual PO lines.

### **Non-Functional Requirements**

* NFR1: All UI data reads must be served from the local in-browser database to ensure interactions are visually instantaneous (<50ms).
* NFR2: The application's cold start for a repeat visitor must be under 1 second.
* NFR3 (Revised): The system must provide a highly responsive user experience using optimistic updates and an "Undo" pattern for all data modifications, avoiding traditional confirmation modals.
* NFR4: The MVP will exclusively process POs related to the M&S cost line.
* NFR5: The system must maintain a versioned history of all changes made to revenue and budget forecasts.
* NFR6: The system must be built using the specified technology stack (React, Vite, SQLite WASM, etc.).

## 3. User Interface Design Goals

### **Overall UX Vision**

The vision is for a modern, simple, and intuitive application that requires zero training for a new user to be productive. The user experience must be at the center of all design decisions, prioritizing a smooth and snappy "Linear-like" feel for all interactions.

### **Key Interaction Paradigms**

* **Familiar Mental Models**: The primary interface will use a three-pane layout (e.g., Sidebar → List → Details).
* **Instant Apply + Undo**: User actions will apply instantly to the local state with a temporary "Undo" option, avoiding disruptive confirmation pop-ups.
* **Inline Everything**: Data entry and edits will happen directly in place wherever possible.
* **Zero Full-Page Reloads**: Navigation will be seamless, with panels updating in place.

### **Core Screens and Views**

* **PO Mapping Inbox**: The primary workspace for Core Users.
* **Project Dashboard**: A high-level view of a single project's financial health.
* **Provisional Mapping**: A dedicated view for proactively mapping `PR` or `SRM` numbers.
* **Project Setup/Configuration**: A view for creating projects and managing their forecasts.

### **Accessibility**

The application will aim to meet **WCAG 2.1 Level AA** standards.

### **Branding**

To be defined. The initial design will use a clean, modern, and minimal aesthetic.

### **Target Device and Platforms**

A **Web Application** primarily designed for desktop use, with responsive support for tablets.

## 4. Technical Assumptions (Revised for MVP)

### **Repository Structure**

The project will be organized in a **Monorepo**.

### **Service Architecture**

For the MVP, we will adopt a **Modern Client-Server Architecture** to prioritize speed of delivery. The frontend will be a dynamic client-side application that communicates directly with the backend via a type-safe API. The architecture will be designed in a modular way to keep an open route for a future evolution towards a local-first model.

### **Testing requirements**

The project requires a robust testing suite, including **end-to-end (E2E) tests** using a framework like Playwright.

### **Additional Technical Assumptions and Requests**

* **Frontend**: React 18, Vite, TypeScript, Tailwind CSS, shadcn/ui.
* **State & Data Fetching**: **TanStack Query (React Query)** will be used to manage all server state and caching. **Zustand** will be used for simple global UI state.
* **Backend**: Postgres, tRPC, Drizzle ORM.

## 5. Epics

* **Epic 1: Project & Financial Foundation**: Establish the core data models and UI for creating and managing Projects, including their versioned revenue and M&S cost-line budgets.
* **Epic 2: Data Ingestion & Provisional Mapping**: Build the backend data ingestion script and the user interface for proactively mapping Purchase Requisition and SRM numbers before a PO exists.
* **Epic 3: Core PO Mapping & Management**: Develop the primary "PO Mapping Inbox," including the enriched data view, the core mapping workflow, and the features for adding comments and action flags.
* **Epic 4: Reporting & Analytics**: Build the reporting dashboards that consume the mapped data, allowing users to view budget vs. actuals, see historical forecast changes, and drill down into the details.

---

### Epic 1: Project & Financial Foundation

**Goal**: This epic focuses on building the foundational data structures and user interfaces for project creation and financial planning. By the end of this epic, a user will be able to create a complete financial baseline for a new project, including versioned revenue and cost forecasts, setting the stage for the PO mapping workflows to follow.

#### Story 1.1: Create a New Project

As a **Core User**,
I want to **create a new project**,
so that I can establish a central container for all its financial data.

##### Story 1.1 Acceptance Criteria

1. I can access a "New Project" form.
2. The form must contain fields for `Project Name`, `Sub Business Line`, `Start Date`, and `End Date`.
3. All fields are mandatory.
4. Upon successful submission, a new project is created in the database, and I am taken to that project's main dashboard view.

#### Story 1.2: Define and Version Revenue Forecasts

As a **Core User**,
I want to **add and edit the monthly revenue forecast for a project**,
so that I can track expected income against costs.

##### Story 1.2 Acceptance Criteria

1. From a project's dashboard, I can access a "Revenue Forecast" section.
2. I can input an "Expected Revenue" amount for each month within the project's start and end dates.
3. When I save changes to the forecast, the system saves it as a new version with the current timestamp.
4. I can view the history of past revenue forecast versions.

#### Story 1.3: Define Cost Assumption Hierarchy

As a **Core User**,
I want to **create and organize a hierarchy of cost assumptions**,
so that I can structure the project's budget logically.

##### Story 1.3 Acceptance Criteria

1. From a project's dashboard, I can access a "Cost Assumptions" section.
2. I can create top-level `Cost Line` items (initially, only "M&S" is needed).
3. Under a `Cost Line`, I can create a `Spend Type` (e.g., "Operational").
4. Under a `Spend Type`, I can create a `Spend Sub Category` (e.g., "Coil Strings").
5. The interface should make it clear how these categories are nested.

#### Story 1.4: Define and Version Budget Forecasts

As a **Core User**,
I want to **assign and edit a monthly budget for each cost category**,
so that I can plan for anticipated spending.

##### Story 1.4 Acceptance Criteria

1. When viewing a lowest-level `Spend Sub Category`, I can access its "Budget Forecast" section.
2. I can input a "Budgeted Cost" amount for each month within the project's start and end dates.
3. When I save changes to the budget, the system saves it as a new version with the current timestamp.
4. I can view the history of past budget forecast versions for that category.

---

### Epic 2: Data Ingestion & Provisional Mapping

**Goal**: This epic focuses on building the data pipeline and the proactive mapping feature. By the end of this epic, the system will be able to ingest daily PO data, and users will be able to pre-map spending using PR or SRM numbers, which the system will then use to automate the mapping process.

#### Story 2.1: Create the Provisional Mapping Form

As a **Core User**,
I want to **manually enter a PR or SRM number and its mapping details**,
so that I can proactively categorize spend before a PO is even created.

##### Story 2.1 Acceptance Criteria

1. A dedicated "Provisional Mapping" page exists in the application.
2. The page contains a form with fields for `PR Number` or `SRM Shopping Cart Number`.
3. The form allows me to select the `Project` and the specific `Cost Assumption` category to link the number to.
4. Upon submission, the provisional mapping is saved to the database.
5. I can view a list of all existing provisional mappings.

#### Story 2.2: Develop the CSV Ingestion Script

As a **System Administrator**,
I want to **run a script that processes the daily PO report CSV**,
so that new and updated PO data is loaded into the application's database.

##### Story 2.2 Acceptance Criteria

1. A Python script is created that can parse the specified CSV format of the "PO Details Report".
2. The script correctly identifies new records vs. existing records based on the `PO Number` + `PO Line Item` key.
3. The script updates existing PO records with any changed data from the CSV but does not overwrite manual mapping fields.
4. The script enriches the PO data by joining it with the G/L Account, WBS, and Asset dimension tables/reports.
5. All processed POs are stored in the database.

#### Story 2.3: Implement Automatic Mapping Logic

As a **Core User**,
I want the **ingestion script to automatically apply my provisional mappings**,
so that I don't have to manually map POs that I've already provided details for.

##### Story 2.3 Acceptance Criteria

1. During the ingestion process, for each new PO, the script checks if its `Purchase Requisition Number` or `SRM Shopping Cart Number` exists in the provisional mappings table.
2. If a match is found, the script automatically applies the saved mapping details (Project, Cost Category) to the PO record.
3. The automatically mapped PO has its status set to "Mapped".
4. The PO does not appear in the main "PO Mapping Inbox" for unprocessed items.

---

### Epic 3: Core PO Mapping & Management

**Goal**: This epic focuses on building the primary user workspace: the "PO Mapping Inbox." By the end of this epic, a user will be able to view, filter, and categorize unmapped POs using a rich, context-aware interface. They will also have the tools to manage and comment on POs, turning the inbox into a central hub for operational cost management.

#### Story 3.1: Build the PO Inbox View

As a **Core User**,
I want to **see a detailed, context-rich list of unmapped POs**,
so that I have all the information needed to make a mapping decision.

##### Story 3.1 Acceptance Criteria

1. The inbox page displays a list of POs with a status of "Pending Mapping," summarized by `PO Number`.
2. Each PO in the list is expandable to show its individual line items with their `description`, `quantity`, and `value`.
3. The list must display "helper" columns for each PO, including `Project Name` (from WBS), `Asset Code` (if available), `FMT PO` or not, and `Vendor Name`.
4. The user interface follows the defined three-pane layout (Sidebar/Filters, PO List, Details Panel).

#### Story 3.2: Implement Inbox Filtering

As a **Core User**,
I want to **filter and group the POs in my inbox**,
so that I can efficiently process them in logical batches.

##### Story 3.2 Acceptance Criteria

1. The inbox contains a filter panel.
2. I can filter the list of POs by `Company Code`, `Plant`, `Sub Business Line`, and `SLB Vendor Category`.
3. I can filter the list by pasting a list of `PO Number`s into a text field.
4. I can filter the list by a `PO creation date` range.
5. The PO list updates in real-time as I apply filters.

#### Story 3.3: Implement the Core Mapping Action

As a **Core User**,
I want to **assign a PO to a project and a specific spend category**,
so that I can link actual spend to the budget.

##### Story 3.3 Acceptance Criteria

1. When I select a PO, the details panel allows me to choose a `Project` from a list of existing projects.
2. I can select a `Cost Assumption` category from a hierarchical view of the selected project's budget.
3. During this process, I must have the option to create a new, deeper sub-category "on-the-fly" that nests under an existing category.
4. Upon saving, the PO's mapping is saved, its status changes to "Mapped," and it is removed from the inbox view.
5. The action feels instantaneous, with an "Undo" option presented.

#### Story 3.4: Add Comments and Action Flags to a PO

As a **Core User**,
I want to **add comments and action flags to a PO**,
so that I can track review notes and required actions.

##### Story 3.4 Acceptance Criteria

1. In the PO details panel, there is a section for comments.
2. I can add a new, timestamped comment to the PO.
3. The details panel has controls (e.g., a menu) to apply "Action Flags" like "Flag for Cancellation" or "Flag to De-expedite."
4. Any applied flags are clearly visible on the PO in all relevant views.

#### Story 3.5: Edit an Existing PO Mapping

As a **Core User**,
I want to be able to **change the mapping of an already-processed PO**,
so that I can correct errors or re-allocate costs as project needs change.

##### Story 3.5 Acceptance Criteria

1. I can find a previously mapped PO (e.g., via a search function).
2. When viewing a mapped PO, there is an "Edit Mapping" option.
3. Activating this option allows me to change the `Project` and/or `Cost Assumption` category.
4. Saving the changes updates the PO's mapping and logs the modification.

---

### Epic 4: Reporting & Analytics

**Goal**: This epic focuses on visualizing the data that has been planned and mapped in the previous epics. By the end of this epic, stakeholders will be able to view a project's complete financial health, track performance against the budget, drill down into the details, and analyze how financial forecasts have evolved over time.

#### Story 4.1: Develop the Project Dashboard View

As a **Stakeholder**,
I want to **view a high-level dashboard of a project's financials**,
so that I can quickly assess its overall health.

##### Story 4.1 Acceptance Criteria

1. When I select a project, I am presented with a dashboard view.
2. The dashboard must display summary cards for: Total Budget, Total PO Value, Invoiced Value, and Open PO Value.
3. The dashboard displays a high-level breakdown of the budget and actual spend by `Spend Type` (e.g., Operational vs. Maintenance).
4. All financial data displayed is based on the most recent forecast version.

#### Story 4.2: Implement Report Drill-Down Functionality

As a **Stakeholder**,
I want to **drill down from a high-level summary to the individual POs**,
so that I can understand the details behind the numbers.

##### Story 4.2 Acceptance Criteria

1. From the project dashboard, I can click on a `Spend Type` to navigate to a more detailed view.
2. The detailed view shows the breakdown of spend by its `Spend Sub Categories`.
3. I can continue to click through any deeper, dynamically created sub-categories.
4. The lowest-level view displays the individual PO lines that are mapped to that category.

#### Story 4.3: Create the Forecast Timeline View

As a **Stakeholder**,
I want to **view the history of how a project's forecast has changed over time**,
so that I can understand how and why our financial plan has evolved.

##### Story 4.3 Acceptance Criteria

1. There is a dedicated "Timeline" or "History" view for each project.
2. This view visually displays the different saved versions of the `Revenue Forecast` and `Budget Forecast`.
3. I can select and compare two different versions to see how the numbers have changed between them.
4. The view clearly highlights the values that were modified between the selected versions.
