---
name: feature-impact-analysis
description: Analyze feature requirements using Graphify before implementation. Identify related components, reusable logic, affected modules, dependencies, side effects, and propose an implementation plan without modifying source code.
---

# Feature Impact Analysis

## Purpose

Analyze the existing codebase before implementing a new feature or modifying existing functionality.

Use Graphify as the primary tool for understanding code relationships and dependencies.

**IMPORTANT: This skill is strictly read-only. Never modify source code, configuration files, database schemas, or existing project files during analysis.**

## When to Use

Activate this skill when the user asks to:

- Implement a new feature.
- Modify an existing feature.
- Refactor existing functionality.
- Change business logic or API behavior.
- Evaluate the impact of a proposed change.

## Workflow

### Step 1: Understand the Requirement

- Identify the business objective.
- Identify expected behavior.
- Identify input, output, and constraints.
- Identify acceptance criteria.
- Clarify ambiguities before proceeding.

### Step 2: Query Graphify

- Check whether a Graphify knowledge graph already exists.
- Query Graphify for components related to the requested feature.
- Trace dependencies and relationships.
- Identify relevant classes, functions, modules, and data models.

If Graphify is unavailable or outdated:

- Do not pretend that graph analysis was completed.
- Report the limitation.
- Use source-code inspection as a fallback when possible.

### Step 3: Identify Existing Components

Investigate:

- Controllers / Routes
- Services / Business Logic
- Repositories / Data Access
- Entities / Models / Schemas
- DTOs / Validators
- Middleware / Guards
- External integrations
- Background jobs / Events

Identify reusable functions, existing abstractions, and potential duplication.

### Step 4: Analyze Impact

Identify:

- Directly affected modules.
- Indirectly affected modules.
- API contract changes.
- Database changes.
- Authentication and authorization implications.
- Transaction and data consistency implications.
- Concurrency and race-condition risks.
- Backward compatibility risks.
- Existing tests that may be affected.

Distinguish confirmed dependencies from potential impacts.

### Step 5: Propose Implementation Plan

Create a step-by-step implementation plan.

For each step, specify:

- Target file or module.
- Intended modification.
- Reason for the modification.
- Dependencies.
- Expected outcome.

Prefer reusing existing architecture and conventions over introducing unnecessary abstractions.

### Step 6: Report Findings

Use the following output structure.

# Feature Impact Analysis

## 1. Requirement Understanding

- Business objective
- Expected behavior
- Acceptance criteria

## 2. Related Components

- Relevant components
- Their responsibilities
- Relationships and dependencies

## 3. Reusable Components

- Existing services
- Existing functions
- Existing abstractions
- Recommended reuse strategy

## 4. Impact Analysis

- Directly affected modules
- Indirectly affected modules
- API and database impacts
- Security implications
- Data consistency and concurrency risks
- Testing implications

## 5. Potential Side Effects

- Possible regressions
- Breaking changes
- Performance concerns
- Unhandled edge cases

## 6. Implementation Plan

Provide an ordered, actionable implementation plan.

## 7. Testing Strategy

- Unit tests
- Integration tests
- Regression tests
- Edge cases

## 8. Open Questions

List assumptions and unresolved requirements.

## Constraints

- Do not modify any source code.
- Do not create or delete files.
- Do not execute database migrations.
- Do not install dependencies.
- Do not commit changes.
- Base findings on actual code and Graphify evidence.
- Clearly state uncertainty instead of inventing relationships.
- Wait for explicit user approval before implementation.
