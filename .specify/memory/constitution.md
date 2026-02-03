<!--
SYNC IMPACT REPORT
==================
Version Change: Initial → 1.0.0
Type: MAJOR (initial constitution establishment)

Modified/Added Principles:
- Added: I. Minimal Dependencies - Strict dependency management for Angular project
- Added: II. Clean Code Standards - Comprehensive code quality requirements
- Added: III. Component Architecture - Angular-specific structural principles
- Added: IV. Performance First - Performance and bundle size optimization

Added Sections:
- Technical Constraints: Angular 19, TypeScript, testing frameworks
- Code Quality Gates: Review process and quality standards

Templates Requiring Updates:
✅ Updated: .specify/memory/constitution.md (this file)
⚠ Pending: Review .specify/templates/plan-template.md for constitution check alignment
⚠ Pending: Review .specify/templates/spec-template.md for requirements alignment
⚠ Pending: Review .specify/templates/tasks-template.md for task categorization

Follow-up TODOs:
- Conduct initial dependency audit against existing package.json
- Establish baseline bundle size metrics
- Configure automated linting for clean code standards

Date: 2026-02-02
-->

# WDX Replica Constitution

## Core Principles

### I. Minimal Dependencies (NON-NEGOTIABLE)

Every new dependency MUST be justified and approved before addition.
Dependencies are evaluated against:

- **Necessity**: Can functionality be achieved with existing dependencies or
  native capabilities?
- **Bundle Impact**: What is the size cost? Analyze with webpack-bundle-analyzer
  before approval.
- **Maintenance**: Is the package actively maintained? Check last update date
  and issue response time.
- **Tree-shakeable**: Does the dependency support tree-shaking to minimize
  unused code?
- **Alternatives**: Have lighter-weight alternatives been considered?

**Rationale**: The project currently has 50+ production dependencies. Unchecked
dependency growth leads to bloated bundles, security vulnerabilities, upgrade
complexity, and maintenance burden. Every dependency is a liability that must
earn its place.

### II. Clean Code Standards

Code MUST be readable, maintainable, and follow established patterns:

- **Naming**: Use descriptive, intention-revealing names. No abbreviations
  except industry-standard (e.g., HTTP, API, DTO).
- **Functions**: Single Responsibility Principle. Functions should do one thing
  well. Max 30 lines preferred.
- **Components**: One component per file. Max 300 lines per component file
  (template + logic).
- **Comments**: Code should be self-documenting. Comments explain WHY, not WHAT.
  Remove dead code and commented-out blocks.
- **DRY Principle**: Extract repeated logic into shared services, utilities, or
  base classes.
- **TypeScript**: Use strict typing. Avoid `any` type except when interfacing
  with untyped third-party libraries (must be justified).

**Rationale**: Clean code reduces cognitive load, accelerates onboarding,
simplifies debugging, and enables confident refactoring. Technical debt
accumulates when standards are not enforced.

### III. Component Architecture

Angular components MUST follow consistent architectural patterns:

- **Smart/Dumb Pattern**: Distinguish between container components (smart - data
  fetching, state) and presentation components (dumb - input/output only).
- **Standalone First**: New components should be standalone (Angular 19+) unless
  integration with existing NgModules requires otherwise.
- **Single Concern**: Each component represents one UI concept. Split complex
  UIs into smaller, composed components.
- **Reactive Patterns**: Prefer reactive programming with RxJS. Use signals
  (@ngrx/signals) for state management where appropriate.
- **Template Complexity**: Limit template logic. Complex computations belong in
  the component class or pipes.
- **Reusability**: Identify and extract reusable UI patterns into shared
  component libraries.

**Rationale**: Consistent architecture improves predictability, testability, and
team velocity. It prevents the emergence of "mega-components" that become
unmaintainable.

### IV. Performance First

Performance is a feature, not an afterthought:

- **Bundle Size**: Monitor and control bundle size. Target <500KB initial bundle
  (gzipped). Use lazy loading for routes and large features.
- **Change Detection**: Use OnPush change detection strategy where possible.
  Avoid unnecessary component re-renders.
- **Lazy Loading**: Feature modules should be lazy-loaded. Large libraries
  (e.g., charts, editors) must be lazy-loaded.
- **Memory Management**: Unsubscribe from observables. Use takeUntil, async
  pipe, or signals to prevent memory leaks.
- **Asset Optimization**: Images must be optimized. Use appropriate formats
  (WebP with fallbacks). Implement lazy loading for images.
- **Rendering**: Minimize DOM manipulation. Use trackBy for \*ngFor. Virtual
  scrolling for large lists (e.g., ag-grid configurations).

**Rationale**: Performance directly impacts user experience and business
metrics. Poor performance leads to user abandonment, especially on slower
networks and devices.

## Technical Constraints

**Framework**: Angular 19.2+ with standalone components as default pattern  
**Language**: TypeScript 5.7+ with strict mode enabled  
**Build Tool**: Angular CLI with webpack 5.99+  
**Testing**: Karma + Jasmine (existing), migrate to Jest for better performance
(future consideration)  
**Linting**: ESLint with @angular-eslint and @typescript-eslint configurations  
**Styling**: SCSS with component-scoped styles (no global styles except design
system tokens)  
**State Management**: @ngrx/signals for new features, @ngrx/store for existing
(no new store additions)  
**Package Manager**: npm (as evidenced by package.json)

**Approved Core Dependencies** (existing, can continue using):

- Angular Material 19.2+ (UI components)
- ag-grid-enterprise 33.3+ (data grids)
- RxJS 7.5+ (reactive programming)
- Bootstrap 5.3+ (layout utilities)
- FontAwesome (icons)

**Dependency Addition Process**:

1. Document justification with size/maintenance analysis
2. Seek alternatives analysis
3. Get approval in code review
4. Update this constitution if establishing new category

## Code Quality Gates

**Pre-commit**:

- ESLint passes with zero warnings
- Prettier formatting applied
- No console.log statements in production code

**Code Review Requirements**:

- All PRs require approval from at least one team member
- Constitution compliance must be verified
- Bundle size impact documented for dependency changes
- Performance impact considered for architectural changes

**Merge Criteria**:

- All tests passing
- No ESLint errors
- No decrease in code coverage (when coverage tooling established)
- Accessibility standards met for UI changes

**Complexity Justification**:

- Any violation of the principles above MUST include written justification
- Trade-offs must be documented
- Technical debt tickets created for future remediation if principle violation
  is temporary

## Governance

This constitution supersedes all other development practices and preferences.
All development decisions must align with these principles or document explicit
exceptions.

**Amendment Process**:

1. Propose amendment with rationale and impact analysis
2. Document affected templates and existing code
3. Gain team consensus
4. Update constitution with version increment (see versioning rules below)
5. Update dependent templates and documentation
6. Communicate changes to all team members

**Versioning**:

- **MAJOR**: Backward-incompatible changes (principle removal, fundamental
  redefinition)
- **MINOR**: New principle added or material expansion of existing principle
- **PATCH**: Clarifications, wording improvements, non-semantic refinements

**Compliance Review**:

- Constitution compliance is reviewed in every code review
- Quarterly architecture review to assess adherence and identify needed updates
- Violations are addressed immediately or documented as technical debt

**Runtime Guidance**: For detailed development workflows and agent-specific
execution patterns, refer to `.github/copilot-instructions.md` and
`.specify/templates/commands/*.md`.

**Version**: 1.0.0 | **Ratified**: 2026-02-02 | **Last Amended**: 2026-02-02
