# Research: Garden Room Structural Logic

**Date**: 2026-02-08

## Decisions

### Styling approach (Tailwind request)

- **Decision**: Use existing SCSS with Bootstrap 5.3 layout utilities; do not
  add Tailwind.
- **Rationale**: Constitution mandates minimal dependencies and SCSS-based
  styling. Bootstrap is already present and sufficient for responsive layouts.
  Adding Tailwind would add a new dependency and increase bundle size.
- **Alternatives considered**:
  - Tailwind CSS (rejected due to new dependency and bundle impact).
  - Angular Material layout components (kept as optional UI primitives but not
    required for layout).

### Reactive state and derived values

- **Decision**: Use @ngrx/signals for derived calculations with RxJS interop for
  async tasks.
- **Rationale**: Signals provide instant recalculation of derived values (e.g.,
  wall heights), and the project already depends on @ngrx/signals.
- **Alternatives considered**:
  - @ngrx/store (heavier for this feature; reserved for existing store usage).
  - Component-local RxJS only (less ergonomic for derived synchronous
    calculations).

### Numerical precision and units

- **Decision**: Normalize all inputs to millimeters for calculation, then format
  outputs back to the user’s unit.
- **Rationale**: Integer millimeters reduce floating-point drift, which is
  important for repeated fall calculations and bin-packing.
- **Alternatives considered**:
  - Floating-point centimeters (risk of rounding errors).
  - Fixed decimal library (new dependency not justified).

### Bin packing algorithm

- **Decision**: Use First-Fit Decreasing (FFD) for 1D bin packing of cuts.
- **Rationale**: Deterministic, fast, and produces near-optimal results for
  typical construction cut lists.
- **Alternatives considered**:
  - Exact optimization (higher complexity and slower).
  - Next-fit heuristic (simpler but typically more waste).

### Visualization

- **Decision**: Use native SVG elements in Angular templates for wall previews.
- **Rationale**: No additional dependencies and provides real-time updates based
  on signals.
- **Alternatives considered**:
  - Canvas-based renderer (more complex hit-testing).
  - External chart/graphics libraries (dependency overhead).

### Print output

- **Decision**: Add scoped `@media print` rules in existing global styles to
  render cut lists.
- **Rationale**: Works with existing styling pipeline and avoids dependencies.
- **Alternatives considered**:
  - Dedicated print library (new dependency not justified).

## Open Questions Resolved

- **Tailwind vs SCSS**: Resolved in favor of existing SCSS/Bootstrap utilities.
- **Hardware list formulas**: Treat as configurable multipliers (per linear
  meter and per square meter) provided by the user or defaults; avoids implicit
  assumptions not in spec.
