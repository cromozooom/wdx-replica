# Research Phase: SPX Magic Selector Implementation

**Date**: February 14, 2026  
**Feature**: [spec.md](spec.md)  
**Purpose**: Technical research to resolve implementation unknowns and establish
best practices

## Research Summary

Comprehensive analysis of ng-select integration patterns, ag-grid modal
workflows, and performance optimization strategies for large dataset handling in
Angular applications.

## Key Decisions & Findings

### Decision: ng-select Advanced Customization Approach

**Rationale**: Use custom templates for option display, header/footer actions,
and advanced search trigger integration  
**Alternatives considered**: Building custom dropdown component from scratch
rejected due to accessibility and testing complexity  
**Implementation**: Custom ng-option-template with Bootstrap styling, search
debouncing, and virtual scrolling support

### Decision: Smart/Dumb Component Separation

**Rationale**: Follows constitutional architecture requirements and enables
independent testing  
**Alternatives considered**: Single monolithic component rejected for
maintainability concerns  
**Implementation**:

- Smart: `SpxMagicSelectorComponent` (state management, service integration)
- Dumb: `PreviewContainerComponent`, `InspectorPanelComponent` (pure display
  logic)

### Decision: ag-grid Integration Pattern

**Rationale**: Flatten one-to-many relationships into individual rows for direct
selection capability  
**Alternatives considered**: Hierarchical tree view rejected due to complex
selection logic  
**Implementation**: `FlatSelectionRow` interface with radio-button column
configuration and custom cell renderers

### Decision: Modal State Management Strategy

**Rationale**: Use Angular Material Dialog with reactive forms and OnPush change
detection  
**Alternatives considered**: Custom modal implementation rejected for
accessibility compliance  
**Implementation**: Centralized state service with BehaviorSubjects for
selection synchronization

### Decision: Bootstrap-Only Styling Approach

**Rationale**: Project requirement to avoid custom SCSS usage while maintaining
design consistency  
**Alternatives considered**: Angular Material theming rejected due to styling
constraints  
**Implementation**: Bootstrap utility classes with empty SCSS files for tooling
compatibility

### Decision: Data Loading & Caching Strategy

**Rationale**: Implement debounced search with intelligent caching to meet
performance requirements  
**Alternatives considered**: Real-time search rejected due to API load
concerns  
**Implementation**: 300ms debounce, in-memory caching with TTL, batch loading
for large datasets

## Performance Optimization Patterns

### Virtual Scrolling Implementation

- Enable `virtualScroll` for datasets >100 items
- Implement `trackBy` functions for change detection optimization
- Use `OnPush` strategy throughout component tree

### Memory Management

- Implement `takeUntil(destroy$)` pattern for subscription cleanup
- Use `shareReplay(1)` for observable caching
- Lazy load inspector panel data on row selection

### Bundle Size Considerations

- No new dependencies required (all functionality achievable with existing libs)
- Tree-shaking enabled for ng-select and ag-grid imports
- Lazy loading of discovery modal component when needed

## Integration Patterns

### ng-select to ag-grid Workflow

1. Basic selection via ng-select dropdown
2. Advanced trigger opens discovery modal with full ag-grid
3. Grid selection updates original ng-select state
4. Preview container reflects changes reactively

### State Synchronization

- Central `SelectionStateService` with BehaviorSubjects
- Reactive forms integration with form controls
- Event emitter pattern for parent-child communication

### Error Handling Strategy

- Retry logic for data loading failures
- Graceful degradation when preview data unavailable
- User-friendly error messages with recovery options

## Testing Approach

### Component Testing

- Smart components: Mock services, test state management
- Dumb components: Test inputs/outputs, template rendering
- Integration tests: Full user workflow scenarios

### Performance Testing

- Load testing with 1000+ form-query combinations
- Memory leak detection with repeated modal operations
- Bundle size impact verification

## Implementation Sequence

### Phase 1: Core Infrastructure

1. Interface definitions and data models
2. State management service implementation
3. Mock data service with sample domains

### Phase 2: Basic Component Implementation

1. Main selector component with ng-select integration
2. Preview container component with entity display
3. Basic selection workflow testing

### Phase 3: Advanced Modal Features

1. Discovery modal with ag-grid integration
2. Inspector panel with live data preview
3. Selection synchronization and persistence

### Phase 4: Performance Optimization

1. Virtual scrolling and lazy loading
2. Caching and debouncing implementation
3. Bundle size optimization and testing

## Technology Stack Validation

### Approved Dependencies

- ✅ ng-select: Advanced dropdown functionality
- ✅ ag-grid-enterprise: Grid display and selection
- ✅ Angular Material: Modal dialogs and base components
- ✅ Bootstrap: Utility classes for styling
- ✅ RxJS: Reactive patterns and state management

### New Dependencies: None Required

All functionality achievable with existing project dependencies, maintaining
constitutional compliance.

## Next Steps

Ready to proceed to Phase 1: Data modeling and contract definition based on
research findings.
