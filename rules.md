# Adaptive AI Global Coding Ruleset (Technology-Agnostic)

These rules are designed for use by any AI coding assistant across languages and environments. They apply adaptively depending on the scope of the project — from a quick proof-of-concept (PoC) to a production-grade, full-featured application. AI agents should scale their rigor accordingly, applying lightweight standards for rapid ideation and full standards for enterprise or production builds.

---

## Project Stage Sensitivity

- **PoC / Rapid Prototyping**: Prioritize speed, clarity, and basic functionality. Skip exhaustive testing or documentation but flag areas needing future hardening.
- **MVP / Internal Tools**: Implement core standards — basic security, modularity, and test coverage.
- **Full Production App**: Enforce all rules — secure, modular, testable, documented, and maintainable code.
- AI agents must always detect and **align behavior with the current development phase** as described in `PROJECT_SUMMARY.md` or clarified by the user.

---

## I. CONTEXT AWARENESS & STRUCTURED WORKFLOW

1. Refer to available context files (`project_rules`, `implementation-plan.md`, etc.) as primary sources of truth.
2. Generate and maintain planning files like `implementation-plan.md`, `todo.md`, `glossary.md`, and `rules_summary.md`.
3. Use `implementation-plan.md` for step-by-step execution. Mark steps as ✅ Done with brief change logs.
4. Update `glossary.md` with plain-language explanations of terms, files, and key concepts.
5. Verify before acting — avoid assumptions. Ask clarifying questions if uncertain.
6. Preserve existing functionality — iterate incrementally unless major overhauls are requested.
7. Support "Build This With Me" mode — explain steps on demand.
8. Provide prompt templates to help guide user ideation and feature definitions.
9. Use `PROJECT_SUMMARY.md` to track current goals, decisions, scope level (PoC, MVP, Prod), and project state.

---

## II. CHANGE MANAGEMENT & COLLABORATION

10. Restart or reload the system after backend/service changes.
11. Edit one file at a time, in clear, self-contained updates.
12. Refactor overly large files (>300 lines) to improve readability and modularity depending on need; this need not be mandatory.
13. Avoid hard-coded values — use constants with meaningful names.
14. Log all changes in `CHANGELOG.md` including date and purpose.
15. Use semantic commit messages (e.g., `[FEAT]`, `[FIX]`, `[REFACTOR]`).
16. Pull the latest version before starting edits. Commit often with clear messages.
17. If multiple agents are active, use `TASKS.md` to record assignments and in-progress work.
18. Label all TODOs and FIXMEs with agent identifiers where relevant.
19. Use metadata comments (e.g., `// Purpose:`, `// Last Edited:`, `// Feature:`) to explain changes.

---

## III. MODULARITY, ARCHITECTURE & CODE STYLE

20. Implement the simplest working solution appropriate to the phase.
21. Apply the Single Responsibility Principle — keep functions and modules focused.
22. Respect project structure and naming conventions across files and folders.
23. Reuse existing logic instead of duplicating functionality.
24. Use descriptive identifiers for variables, functions, and files.
25. Maintain `ARCHITECTURE.md` to explain data flow, component boundaries, and abstractions (required at MVP+).
26. Follow and enforce consistent code style rules using appropriate tooling for the language.

---

## IV. SECURITY & PRIVACY

27. For production, do not modify or commit secret files (e.g., environment variables, credentials).
28. Ensure all sensitive files are in `.gitignore` or equivalent ignore config.
29. Apply rate limiting and throttling to exposed endpoints (MVP+).
30. Use input validation and captchas where appropriate.
31. Never expose sensitive logic client-side — enforce separation.
32. Use trusted authentication providers where applicable; avoid custom auth unless required.
33. Flag sensitive data-handling areas with `// [Sensitive]` or similar markers.
34. Perform vulnerability scans before production deployment.

---

## V. TESTING & VERIFICATION

35. For PoC, write smoke tests or inline checks if feasible. For MVP+, add automated tests for all core logic.
36. Use mock data only in testing environments.
37. Run relevant tests after every change.
38. Fix failing or outdated test logic promptly.
39. Account for edge cases in logic and user input.
40. Ensure test coverage meets phase standards (light for PoC, thorough for production).

---

## VI. DEPLOYMENT & PERFORMANCE

41. Wrap unstable or partial features in flags.
42. Confirm configuration variables load correctly in each environment.
43. Optimize performance based on stack needs (e.g., lazy loading, caching).
44. Use WAFs and rate limits on public endpoints for MVP+.
45. Set up production monitoring and alerting.
46. Run post-deploy checks on endpoints, logs, and app state.
47. For production, ensure rollback mechanisms and backup plans exist.

---

## VII. DOCUMENTATION & TRACEABILITY

48. Maintain and update `CHANGELOG.md`, `PROJECT_SUMMARY.md`, `TASKS.md`, `ARCHITECTURE.md` (required at MVP+).
49. Use docstrings or header comments to explain code intent.
50. Avoid obvious or repetitive comments.
51. Document major decisions and rationale in `docs/design.md`.
52. Link to official documentation or canonical sources.
53. Maintain a requirement-to-code mapping (traceability matrix) for complex projects.

---

## VIII. MULTI-AGENT PROTOCOLS

54. All agents must read the summary, tasks, and change log before working.
55. Log and claim tasks clearly in `TASKS.md`.
56. Leave clear handoff notes and next steps.
57. Search for existing solutions before writing new code.
58. Add headers to files with timestamps, summaries, and authors.
59. Do not overwrite peer work without coordination.
60. Justify and document any sweeping code changes.

---

## IX. ADVANCED / OPTIONAL PRACTICES

61. Use toggles and staged rollouts for features.
62. Keep dev, test, and prod configurations clearly separated.
63. Use inline markers (e.g., `// Task-ID:`, `// Version:`) to aid tracing.
64. Encourage mid-session syncing and context refreshes.
65. Tag commits semantically and link to task identifiers.
66. Maintain an index or feature map for the system.
67. Offer mentorship-mode explanations on demand.

---

## X. EFFECTIVE AI CODE EDITING

68. Batch related changes to a single file in one comprehensive edit rather than sequential partial edits.
69. When editing a file that was previously modified, explicitly note which sections should remain unchanged.
70. Define precise function or line number boundaries when editing complex files to avoid overlapping changes.
71. Verify each change is applied correctly before proceeding to the next edit operation.
72. For complex files, prefer full-function edits over partial-function modifications.
73. For simple changes, provide the entire file content rather than partial updates when feasible.
74. When updating multiple functions in the same file that use similar patterns, edit them simultaneously.
75. After fixing bugs or inconsistencies from previous edits, document the issue to prevent recurrence.
76. Use explicit code diffs or line references when communicating about specific changes.
77. Maintain explicit decimal precision in numerical calculations to avoid rounding errors.

---

## XI. CODEBASE HYGIENE & SELF-GOVERNANCE

78. Flag unused variables, imports, and functions after edits.
79. Prompt refactor for duplicated logic or long functions.
80. Standardize naming patterns and file organization via linting rules.
81. Warn against known anti-patterns (e.g., logic in render).
82. Auto-suggest performance improvements (memoization, lazy-loading).
83. Track technical debt in `TECH_DEBT.md` with context and intended resolution.
84. Require plain-English explanations for complex logic blocks.
85. Prompt for accessibility features (ARIA, labels, contrast checks).
86. Offer optional “code review mode” questions to validate assumptions.
87. Auto-update `README.md` and `setup.md` post feature additions.

--

This `rules.md` file should live at the root of every project and be used to adapt AI behavior based on project maturity, scope, and user preferences. It ensures scalable, collaborative, and appropriate AI-assisted software development across all contexts.