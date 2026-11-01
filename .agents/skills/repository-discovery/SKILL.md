---
name: repository-discovery
description: Analyze an existing codebase before feature planning or implementation. Discover related components, reusable code, dependencies, execution flows, affected modules, and potential side effects. Use this skill whenever a task requires understanding an unfamiliar area of the repository or modifying existing functionality.
---

# Repository Discovery

## 1. Objective

Your responsibility is to understand the existing codebase before any implementation takes place.

You must identify:

- Where the relevant functionality is implemented.
- How the existing components interact.
- Which services, utilities, and functions can be reused.
- Which modules may be affected by the requested change.
- What potential side effects or architectural risks may occur.

The goal is to minimize unnecessary code changes, avoid duplicated implementations, and preserve existing architecture.

**Important:** This skill is strictly read-only. Do not modify source code, configuration files, database schemas, tests, documentation, or Git state during discovery.

---

## 2. Discovery Workflow

Follow these steps in order.

### Step 1: Understand the Project Structure

Inspect the repository to identify:

- Project type and technology stack.
- Application entry points.
- Main modules and their responsibilities.
- Architectural patterns and directory conventions.
- Existing documentation and development guidelines.
- Relevant build tools and dependency management files.

Prioritize:

- README and project documentation.
- Package manifests and build configurations.
- Application entry points.
- Existing architecture documentation.

Do not inspect irrelevant directories or generated files such as `node_modules`, `dist`, `build`, and compiled artifacts unless specifically required.

### Step 2: Explore with Graphify

When Graphify is available, use it as the primary tool for exploring code relationships.

Before querying:

1. Identify the available Graphify tools and their supported operations.
2. Understand the graph structure and query capabilities.
3. Use the appropriate tools to search for relevant symbols and relationships.

Query for:

- Components related to the requested feature.
- Related classes, functions, services, and modules.
- Call relationships and dependency chains.
- References and usages of relevant functions.
- Potentially affected components.

Do not rely exclusively on Graphify results.

Cross-check important findings against the actual source code.

If Graphify is unavailable, uninitialized, or returns incomplete results, fall back to repository search tools, symbol search, and direct source inspection.

Never invent Graphify commands, tools, or query results.

### Step 3: Trace Existing Implementation

Once relevant components are identified, inspect their actual implementation.

Trace the execution flow from entry point to the final operation.

For backend functionality, examine:

- Routes and API endpoints.
- Controllers and request handlers.
- Services and business logic.
- Repositories and data access.
- Models, entities, and DTOs.
- Middleware, interceptors, and exception handlers.

For frontend functionality, examine:

- Routes and pages.
- Components and component hierarchy.
- Hooks and state management.
- API clients and service functions.
- Shared UI components.
- Data flow between components.

For database-related functionality, examine:

- Schema and entity relationships.
- Existing queries and repositories.
- Constraints and indexes.
- Transactions and migration dependencies.

Identify both direct dependencies and important indirect dependencies.

### Step 4: Identify Reusable Components

Before suggesting new implementations, search for existing functionality that can be reused.

Look for:

- Existing services and business logic.
- Utility functions and shared helpers.
- Common components and hooks.
- Existing API endpoints.
- Reusable validation and error-handling mechanisms.
- Existing database queries and repository methods.

For each reusable component, report:

- File path and relevant symbol.
- Its current responsibility.
- How it is currently used.
- Whether it can be reused directly or requires modification.

Avoid suggesting new components when existing implementations already satisfy the requirements.

### Step 5: Analyze Dependencies and Impact

Determine which parts of the system could be affected by the requested change.

Classify potential impacts into:

**Direct Impact**

- Files that will likely require modification.
- Functions or components directly involved in the feature.
- Existing APIs or database structures being changed.

**Indirect Impact**

- Other modules depending on the affected components.
- Existing features relying on shared services.
- Frontend components consuming affected APIs.
- Background jobs, events, or asynchronous processes.
- Tests and documentation depending on the modified behavior.

**Potential Side Effects**

- Breaking API contracts.
- Changes to existing business rules.
- Database consistency issues.
- Transaction and concurrency problems.
- Authentication or authorization changes.
- Performance implications.
- Backward compatibility issues.

Do not report speculative risks as confirmed problems. Clearly distinguish verified dependencies from potential impacts.

### Step 6: Identify Existing Conventions

Inspect nearby implementations to understand the project's established conventions.

Identify:

- Naming conventions.
- Folder and file organization.
- Error-handling patterns.
- Validation strategies.
- Logging conventions.
- Response formats.
- Testing patterns.
- Dependency injection and module configuration.

Future implementations should follow these conventions unless there is a justified reason to change them.

---

## 3. Discovery Output

After completing discovery, produce a structured report using the following format.

# Repository Discovery Report

## 1. Project Overview

- Technology stack:
- Architecture:
- Relevant modules:
- Important entry points:

## 2. Related Components

List the relevant files and symbols.

| Component      | File Path               | Responsibility | Relevance |
| -------------- | ----------------------- | -------------- | --------- |
| ExampleService | src/services/example.ts | Business logic | Direct    |

## 3. Existing Execution Flow

Describe how the current functionality works.

Use a sequence diagram or step-by-step flow when it helps explain interactions.

## 4. Reusable Components

Identify existing functions, services, utilities, hooks, or components that can be reused.

For each item, explain its responsibility and potential reuse.

## 5. Dependency Analysis

Describe the important relationships between the relevant modules.

Include direct and indirect dependencies where applicable.

## 6. Impact Analysis

**Direct Impact**

- ...

**Indirect Impact**

- ...

**Potential Side Effects**

- ...

## 7. Existing Conventions

Summarize the coding and architectural conventions that should be preserved.

## 8. Discovery Conclusion

Provide:

- What is already implemented.
- What functionality appears to be missing.
- Which existing components should be reused.
- Which areas may require modification.
- Important unknowns or assumptions that need further investigation.

## 9. Recommendations for Feature Planning

Provide actionable findings that can be passed to the Feature Planning skill.

Do not implement the feature or prescribe unnecessary architectural changes at this stage.

---

## 4. Operating Rules

1. Always inspect actual source code before concluding how a component works.
2. Prefer Graphify for relationship discovery, but verify findings against source code.
3. Search for existing implementations before proposing new ones.
4. Follow actual project conventions instead of imposing a preferred architecture.
5. Keep the investigation focused on the requested task.
6. Avoid reading unrelated files or entire directories unnecessarily.
7. Reference actual file paths and symbol names in findings.
8. Include line references when useful and available.
9. Clearly distinguish facts, assumptions, and unknowns.
10. Do not modify any project files during discovery.
11. Do not claim a dependency or relationship exists without supporting evidence.
12. Do not continue expanding the investigation when sufficient information has been collected.

## 5. Completion Criteria

Repository discovery is complete when:

- [ ] Project structure and relevant architecture are understood.
- [ ] Related components and entry points are identified.
- [ ] Existing execution flow is understood.
- [ ] Reusable implementations are identified.
- [ ] Relevant dependencies are mapped.
- [ ] Direct and indirect impacts are evaluated.
- [ ] Potential side effects and risks are documented.
- [ ] Relevant coding conventions are identified.
- [ ] Findings are presented in the Discovery Report.
- [ ] No project files have been modified.

**Final instruction:**

Stop after producing the Repository Discovery Report. The implementation must only begin when explicitly requested by the user or when the task workflow authorizes the next phase.
