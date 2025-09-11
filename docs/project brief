# **Project Brief: Cost Management Hub**

## Executive Summary

This document outlines the project brief for the **Cost Management Hub**, a web-based application designed to serve as a custom intelligence layer over existing corporate business systems. It directly addresses the critical challenge of connecting disconnected data sources—specifically, the initial P&L and budget assumptions made in Excel with the raw, daily Purchase Order (PO) data extracted from business systems.

The core problem is the current reliance on manual, error-prone spreadsheets, making it nearly impossible to link spending to specific projects and cost buckets in a timely manner. This forces stakeholders like **Resource Managers**, **M&S Coordinators**, and **Financial Controllers** into a reactive cycle of explaining cost overruns "after the fact" rather than proactively managing them.

By ingesting daily PO data and providing an intuitive interface to map it against versioned project budgets, the hub will provide a single source of truth for project costs. This transforms cost management from a forensic exercise into a strategic, proactive function, enabling better and faster business decisions. The initial MVP will focus on the most complex and high-impact **M&S (Materials and Supplies) cost line** to deliver immediate value before expanding to other areas.

## Problem Statement

The core problem is a fundamental inability to effectively track project spending against budgeted assumptions in real-time. The current process is fragmented across multiple, disconnected Excel spreadsheets—one for the initial P&L and another for manually tracking Purchase Orders (POs). This creates a significant gap between financial planning and actual expenditure.

The key pain points are:

* **Lack of Linkage**: It is extremely challenging to link individual POs to the specific projects and cost buckets they belong to.
* **Reactive Analysis**: Cost overruns are typically discovered "after the fact", leading to a reactive cycle of explaining why the budget was missed, rather than proactively managing it.
* **Inability to Control**: This lack of timely insight means the team is "never in control" of spending and cannot make informed business decisions when they matter most.

Existing business systems like SAP and ARIBA are too rigid, preventing the addition of the necessary identifiers during the PO creation process. This limitation makes the existing solutions insufficient and necessitates the creation of a custom "layer of intelligence" to bridge the data gaps.

Certainly. Here is an expanded 'Proposed Solution' that elevates the P&L and Budget Management capabilities to a core feature, as you requested.

## Proposed Solution

The proposed solution is a custom web application, the **Cost Management Hub**, that will function as a flexible intelligence layer on top of the company's existing business systems. It is built around two equally important core features: a comprehensive project financial planning module and an intelligent purchase order mapping workflow.

The core approach involves:

**1. Project Financial Planning & Forecasting**
This is a foundational feature where the entire financial plan for a project is created and maintained. Users will be able to:

* **Create Projects**: Define a new project with key attributes such as its name, sub-business line, and planned start and end dates.
* **Forecast Revenue**: Input the expected revenue for the project, with the ability to break down the value by month. All changes to the revenue forecast will be versioned, creating a clear historical record of how projections have evolved over time.
* **Define Cost Assumptions**: Build a flexible, hierarchical structure for all anticipated costs. This starts at a high level (e.g., "M&S" Cost Line), drills down to a "Spend Type" (e.g., "Operational"), and then to multiple levels of "Spend Sub Category" (e.g., "Coil Strings").
* **Set Budgets**: For each lowest-level cost category, users can assign a total budgeted cost and specify in which month that cost is expected to hit. These budget forecasts are also versioned to track changes from the initial tender phase through project execution.

**2. PO Ingestion & Mapping Workflow**
This is the core operational feature that links real-world spending to the financial plan. The workflow is as follows:

* **Data Ingestion**: The application's database will be updated with Purchase Order (PO) line-level details from a daily data export (initially via a Python script processing a CSV file).
* **Mapping Inbox**: The central feature will be an "inbox" where new, unprocessed POs appear. Users can filter and group these POs by various attributes to process them efficiently.
* **Linking Data**: Users will map these POs to the corresponding project and the specific, detailed cost assumption category that was created during the planning phase. This action directly links actual spend to the budget.

The key differentiator remains its **flexibility**. This two-part solution provides a seamless connection between high-level financial planning and granular, daily expenditure—a connection that is impossible to make in the rigid source systems. It succeeds by leveraging existing data exports and adding a targeted, user-centric layer to solve the specific data-linking problem.

## Target Users

The Cost Management Hub will be used by several teams, each with a distinct role. The core control and execution will be handled by the Planning & Supply Chain team, who will gather necessary input from other key teams.

### Core Users (Control & Execution)

* **Team**: **Planning and Supply Chain** (Resource Manager, M&S Coordinator)
* **Role in Application**: These are the primary, hands-on operators of the application. They are responsible for executing all core functions:

  * Creating new projects and defining their financial structure.
  * Inputting and managing the versioned history of revenue and cost forecasts.
  * Performing the daily PO mapping and categorization in the "inbox".
* **Goal**: To maintain a real-time, accurate, and single source of truth for all project costs, enabling efficiency and control.

### Key Contributors (Input Providers)

These teams provide essential information to the Core Users but do not directly operate the tool for mapping or project setup.

* **Team**: **PSD Team (Operations)**

  * **Users**: PSD Manager
  * **Role**: Provides critical operational context. The Core Users will consult them to ensure POs are mapped to the correct project activities and that spend assumptions are realistic from an operational perspective.

* **Team**: **S&C Team (Sales and Commercial)**
  * **Users**: Sales Team
  * **Role**: They are the source for the initial financial data. They provide the revenue forecasts and the original P&L cost assumptions from the tender process, which the Core Users will input during project creation.

* **Team**: **Maintenance Team (TLM Team)**
  * **Users**: Maintenance Team members
  * **Role**: Subject matter experts for maintenance-related costs. They provide input for setting maintenance budgets and assist the Core Users in correctly categorizing specific maintenance POs.

### Stakeholder / Viewer

* **Team**: **Finance & Management**
  * **Users**: Financial Controller, Upper Management
  * **Role in Application**: The primary consumers of the application's reports and dashboards. Their use will be largely read-only.
  * **Goal**: To get a quick, high-level, and accurate overview of project financial health, track budgets against actual spending, and make strategic decisions based on reliable data.

## Goals & Success Metrics

This section outlines the specific, measurable objectives for the Cost Management Hub. These goals will help us focus on delivering value and will define what a successful outcome looks like.

### Business Objectives

* **Improve Project Profitability Control**: Gain real-time insight into project spend to make proactive decisions that protect project margins.
* **Increase Decision-Making Speed**: Radically reduce the time it takes to analyze and explain monthly cost variances, from days of manual reconciliation to minutes of reviewing a dashboard.

### User Success Metrics

* **Reduce Manual Effort**: Decrease the amount of time the Planning & Supply Chain team spends on the manual, repetitive tasks of tracking POs and reconciling them in spreadsheets.
* **Increase Data Confidence**: Provide a single, trusted source of truth for project costs, reducing challenges from management and increasing confidence in financial reports.

### Key Performance Indicators (KPIs)

* **PO Mapping Velocity**: The percentage of new POs that are mapped to a project and cost category within 48 hours of being ingested into the system.
* **Budget vs. Actuals Variance**: The percentage difference between the latest budget forecast and the actual cumulative spend (invoiced + open POs) for any given project.
* **Forecast Update Frequency**: Track the number of times a project's cost forecast is updated after the initial budget is set. A lower frequency in later project stages indicates better initial planning.

## MVP Scope

This section defines the Minimum Viable Product (MVP). We will focus on delivering a core set of features that solve the most critical problem for the M&S cost line, allowing us to launch, learn, and iterate.

### Core Features (Must Have)

* **Project & Budget Management**: A user interface to create projects and define their versioned revenue and **M&S cost-line budgets** only.
* **CSV Data Ingestion**: A backend Python script that ingests, filters for M&S, and updates the database with PO data from the daily CSV report.
* **PO Mapping Inbox**: The primary user interface for filtering, grouping, and mapping unprocessed M&S POs to the correct project and cost category.
* **Basic Project Dashboard**: A simple view to display a project's total budgeted M&S cost vs. the actual M&S spend (total value of mapped POs).

### Out of Scope for MVP

* **All Cost Lines Except M&S**: The initial product will not handle any cost lines other than Materials and Supplies.
* **In-App File Uploader**: The MVP will rely on the backend script for data ingestion; a user-facing upload button will be a future feature.
* **Advanced Analytics & Dashboards**: All creative features (e.g., predictive alerts, vendor analysis, "what-if" scenarios) are out of scope for the initial release.
* **Complex User Roles & Permissions**: The MVP will assume all users have the same level of access.

### MVP Success Criteria

* The system can successfully ingest and process the daily PO report for M&S spend.
* A user is able to map 100% of new M&S POs to a project within the application.
* The dashboard view accurately reflects the total mapped spend against the defined budget.
* The Core Users confirm the tool is a viable replacement for their current Excel workflow.

## Post-MVP Vision

This section outlines the longer-term direction for the Cost Management Hub after the initial MVP has been successfully launched and validated.

### Phase 2 Features

* **Expand Cost Line Coverage**: The immediate next step will be to onboard other major cost lines beyond M&S, moving closer to a comprehensive project cost view.
* **In-App File Uploader**: Introduce the user-facing file upload feature to replace the backend Python script, making the daily data ingestion process more user-friendly.
* **Advanced Reporting**: Build out more sophisticated reports and graphical dashboards to visualize trends and data.

### Long-term Vision

* **Intelligent Automation**: Evolve the tool from a manual mapping system into an intelligent assistant. Implement features like AI-powered mapping suggestions and predictive cost overrun alerts to automate workflows and provide proactive insights.
* **Single Source of Truth**: Become the official, central hub for all project-related cost management and profitability analysis within the organization.
* **Integrated Collaboration**: Incorporate in-app collaboration features (like commenting and notifications) to streamline communication between the Planning, Operations, Sales, and Maintenance teams.

### Expansion Opportunities

* **Direct Integration**: Explore the possibility of direct API integrations with source systems (e.g., SAP, ARIBA) to fully automate the data ingestion process.
* **Role-Specific Dashboards**: Develop custom dashboards tailored to the unique needs of each user group, such as a high-level executive dashboard for the Financial Controller.

## Technical Considerations

This section captures the specific technical architecture and stack chosen for the project, designed to deliver an extremely responsive, "local-first" user experience.

### Platform Requirements

* **Target Platforms**: A **Web Application**, primarily designed for a three-pane desktop layout, but responsive and usable on tablets.
* **Browser Support**: The application will support the latest versions of all major browsers (Chrome, Firefox, Safari, Edge), leveraging modern features like Web Workers and SQLite WASM with OPFS.

* **Non-Negotiable Performance Budgets**:
  * **< 50 ms**: Warm navigation between lists and panels.
  * **< 50 ms**: Time to visual confirmation after applying a classification.
  * **< 150 ms**: Time to process a bulk classification of 100 lines locally.
  * **< 1 second**: Cold start to an interactive app for a repeat visitor.

### Technology Preferences

The stack is chosen for its modern capabilities, end-to-end type safety, and familiarity within LLM training data, making it ideal for agentic coding.

* **Frontend**: **React 18** + **Vite** + **TypeScript**.
* **UI Components**: **Tailwind CSS** for styling with **shadcn/ui** for the component library.
* **Local Persistence**: **SQLite WASM (via OPFS)** as the primary, in-browser read store.
* **In-Memory State**: **Zustand** (or MobX) for managing the observable UI state.
* **Real-time Sync**: **ElectricSQL** (or PowerSync) to replicate data between the Postgres database and the browser's SQLite database.
* **Backend API**: **tRPC** for type-safe API communication.
* **Database & ORM**: **Postgres** as the source of truth, with **Drizzle ORM**.
* **Runtime Environment**: **Cloudflare Workers** for edge authentication/proxy and **Node.js workers** for heavy-duty data ingestion.

### Architecture Considerations

* **Local-First Architecture**: This is the core principle. The UI will read data *exclusively* from the local SQLite database running in a Web Worker. This makes all interactions like filtering, sorting, and navigating feel instantaneous, as they don't require a network request.
* **Optimistic Writes with Undo**: All user changes (e.g., mapping a PO) are applied instantly to the local database and UI. The change is then sent to the server in the background. Instead of confirmation dialogs, a temporary "Undo" option is presented, creating a faster, more fluid UX.
* **Unified Data Schema**: A single schema will be defined using Drizzle and Zod types, shared between the backend and frontend. This eliminates any possibility of data model drift and ensures end-to-end type safety.
* **Agent-Friendly Design**: The architecture is explicitly designed to be reliable for AI developers, using small, single-responsibility modules, clear API contracts, and a robust suite of automated tests (including Playwright for end-to-end flows) to validate changes.

## Constraints & Assumptions

This section lists the known limitations, assumptions, and risks that will shape the project. Acknowledging these upfront helps us plan more effectively.

### Constraints

* **Data Source**: The application is entirely dependent on a manually downloaded daily CSV file ("PO Details Report") for all its spending data. There is no direct access to the source business systems (SAP/ARIBA).
* **Data Reliability**: Information in the source systems, such as the project number on a PO, is considered unreliable, which is the core reason this application is needed.
* **MVP Scope**: The initial version of the product is strictly constrained to managing the **M&S (Materials and Supplies) cost line** only.

### Key Assumptions

* **User Availability**: We assume that the Core Users (Resource Manager, M&S Coordinator) will have the necessary time and domain knowledge to perform the daily PO mapping tasks.
* **Data Consistency**: We assume that the format (columns, data types) of the daily CSV export from Power BI will remain consistent. Any uncommunicated changes to this report could break the data ingestion script.
* **Technical Feasibility**: We assume the proposed local-first architecture using SQLite WASM and a real-time sync-layer is technically viable and will perform as expected on the users' standard corporate hardware.

### Risks & Open Questions

* **Risk - Data Ingestion Fragility**: The manual process of downloading and running a script is a potential point of failure. A missed day or a script error could cause the data to become out of sync.
* **Risk - Initial Onboarding Effort**: There is a significant amount of historical data (1-2 years of POs) that will need to be mapped during the initial setup to make the tool useful from day one. This will be a considerable one-time effort.
* **Open Question**: What is the exact structure and logic of the separate "G/L Account mapping report" that is needed to filter for M&S POs?
