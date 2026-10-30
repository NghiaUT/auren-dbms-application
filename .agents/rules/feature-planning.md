---
trigger: always_on
---

# Feature Planning Rules

Before creating an implementation plan for any new feature, enhancement, or refactoring:

1. Read and follow the `feature-impact-analysis` skill at `.agent/skills/feature-impact-analysis/SKILL.md`.
2. Use Graphify to explore related components and dependencies.
3. Identify reusable services, functions, and existing abstractions.
4. Analyze directly and indirectly affected modules.
5. Identify potential side effects, regressions, and testing requirements.
6. Present the analysis and implementation plan before modifying code.

## Restrictions

- Do not modify source code during planning.
- Do not skip impact analysis for seemingly small features.
- If Graphify is unavailable, report the limitation and inspect source code as a fallback.
- Wait for user approval before implementation.
