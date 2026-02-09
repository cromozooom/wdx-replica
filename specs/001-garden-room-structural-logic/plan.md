# Implementation Plan: Garden Room Structural Logic

**Branch**: `001-garden-room-structural-logic` | **Date**: 2026-02-08 |
**Spec**:
[specs/001-garden-room-structural-logic/spec.md](specs/001-garden-room-structural-logic/spec.md)
**Input**: Feature specification from
`/specs/001-garden-room-structural-logic/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See
`.specify/templates/commands/plan.md` for the execution workflow.

## Summary

Deliver a garden room structural logic engine that derives wall heights from
global constraints, generates member layouts (studs, plates, noggins), and
produces optimized buy/cut/hardware lists. The solution will use Angular
standalone components with @ngrx/signals for reactive derived values, a
service-based calculation layer, and deterministic bin-packing and
sheet-counting algorithms. Styling will remain SCSS/Bootstrap utilities to avoid
new dependencies.

## Technical Context

<!--
  ACTION REQUIRED: Replace the content in this section with the technical details
  for the project. The structure here is presented in advisory capacity to guide
  the iteration process.
-->

**Language/Version**: TypeScript 5.7+  
**Primary Dependencies**: Angular 19.2+ (standalone), @ngrx/signals 19.2+, RxJS
7.5+, Angular Material 19.2+, Bootstrap 5.3 (utilities)  
**Storage**: N/A (in-memory calculation; persisted state out of scope)  
**Testing**: Karma + Jasmine (existing)  
**Target Platform**: Web (modern browsers)  
**Project Type**: Web application (single Angular frontend)  
**Performance Goals**: 60 fps UI updates; derived calculations under 50 ms for
typical project sizes  
**Constraints**: Initial bundle target <500 KB gz; no new dependencies without
justification; OnPush change detection  
**Scale/Scope**: Single feature area within existing app; up to 4 walls with up
to 200 members each

## Constitution Check

_GATE: Must pass before Phase 0 research. Re-check after Phase 1 design._

**Minimal Dependencies**: PASS (no new dependency added; Tailwind request
replaced with existing SCSS + Bootstrap utilities) **Clean Code Standards**:
PASS (strict typing, small focused services, no `any`) **Component
Architecture**: PASS (standalone components, smart/dumb separation)
**Performance First**: PASS (signals, OnPush, trackBy, no heavy libs)

## Project Structure

### Documentation (this feature)

```text
specs/[###-feature]/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
├── contracts/           # Phase 1 output (/speckit.plan command)
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)

<!--
  ACTION REQUIRED: Replace the placeholder tree below with the concrete layout
  for this feature. Delete unused options and expand the chosen structure with
  real paths (e.g., apps/admin, packages/something). The delivered plan must
  not include Option labels.
-->

```text
src/
├── app/
│   ├── garden-room/
│   │   ├── components/
│   │   │   ├── project-dashboard/
│   │   │   ├── global-settings/
│   │   │   ├── wall-manager/
│   │   │   ├── material-library/
│   │   │   ├── extraction-engine/
│   │   │   └── wall-visualizer/
│   │   ├── models/
│   │   ├── services/
│   │   └── garden-room.routes.ts
│   └── app.routes.ts
├── styles.scss
└── main.ts
```

**Structure Decision**: Single Angular frontend. The feature will live under
`src/app/garden-room` with standalone components and a dedicated service layer.

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

No violations requiring justification.

## Phase 0: Research

- Output:
  [specs/001-garden-room-structural-logic/research.md](specs/001-garden-room-structural-logic/research.md)
- Status: Complete

## Phase 1: Design & Contracts

- Data Model:
  [specs/001-garden-room-structural-logic/data-model.md](specs/001-garden-room-structural-logic/data-model.md)
- Contracts:
  [specs/001-garden-room-structural-logic/contracts/structural-logic.openapi.yml](specs/001-garden-room-structural-logic/contracts/structural-logic.openapi.yml)
- Quickstart:
  [specs/001-garden-room-structural-logic/quickstart.md](specs/001-garden-room-structural-logic/quickstart.md)
- Agent Context Updated: Yes

## Constitution Check (Post-Design)

**Minimal Dependencies**: PASS (no new dependency introduced; Tailwind not
adopted)  
**Clean Code Standards**: PASS (typed models and service boundaries defined)  
**Component Architecture**: PASS (smart/dumb separation and standalone-first
layout preserved)  
**Performance First**: PASS (signals-driven derivations, OnPush planned, SVG
rendering scoped)
