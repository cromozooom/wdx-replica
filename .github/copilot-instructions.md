# Copilot Instructions - WDX Replica

## Project Constitution

**CRITICAL**: All development work must comply with the project constitution at `.specify/memory/constitution.md`.

Key constitutional principles:
1. **Minimal Dependencies** (NON-NEGOTIABLE): Every new dependency requires justification, bundle analysis, and approval
2. **Clean Code Standards**: Readable, typed, single-responsibility code
3. **Component Architecture**: Smart/dumb pattern, standalone-first (Angular 19+)
4. **Performance First**: Monitor bundle size, use lazy loading, OnPush change detection

Before making any changes:
- Review relevant constitutional principles
- Ensure compliance or document justified exceptions
- Consider bundle size and performance impact

## Development Guidelines

### Code Quality Standards
- Use TypeScript strict mode - avoid `any` type
- Functions max 30 lines, components max 300 lines
- Follow DRY principle - extract repeated logic
- Self-documenting code - comments explain WHY not WHAT
- ESLint must pass with zero warnings

### Component Development
- New components should be standalone (Angular 19+)
- Use OnPush change detection where possible
- Smart components: handle data/state
- Dumb components: input/output only
- Extract reusable patterns into shared libraries

### Dependency Management
- Before adding dependency: check if existing libs can solve the problem
- Analyze bundle impact with webpack-bundle-analyzer
- Document justification in PR
- Prefer tree-shakeable libraries

### Performance
- Lazy load routes and feature modules
- Use trackBy for *ngFor
- Unsubscribe from observables (takeUntil, async pipe, signals)
- Optimize images (WebP with fallbacks)
- Target <500KB initial bundle (gzipped)

### Testing
- Write tests for business logic
- Use Karma + Jasmine (existing setup)
- Test component inputs/outputs
- Integration tests for critical user flows

## Spec-Driven Development Workflow

This project uses GitHub Spec Kit. When developing features:

1. `/speckit.constitution` - Review/update principles (already done)
2. `/speckit.specify` - Define what to build (user stories, requirements)
3. `/speckit.plan` - Create technical implementation plan
4. `/speckit.tasks` - Break down into actionable tasks
5. `/speckit.implement` - Execute implementation

See `.specify/templates/` for detailed templates.

## Code Review Checklist

- [ ] Constitution compliance verified
- [ ] ESLint passes with zero warnings
- [ ] No console.log in production code
- [ ] Bundle size impact documented (if dependencies changed)
- [ ] Performance considerations addressed
- [ ] Tests passing
- [ ] Accessibility standards met (for UI changes)

## Tech Stack Reference

- Angular 19.2+ (standalone components default)
- TypeScript 5.7+ (strict mode)
- Angular Material 19.2+
- ag-grid-enterprise 33.3+
- RxJS 7.5+ / @ngrx/signals
- Bootstrap 5.3+ (layout utilities only)

Work through each development task systematically. Keep communication concise and focused. Follow constitutional principles strictly.
