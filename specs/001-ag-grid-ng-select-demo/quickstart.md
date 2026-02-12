# Quickstart: ag-Grid with ng-select Cell Demo

**Feature**: ag-Grid with ng-select Cell Demo  
**Date**: February 11, 2026

## Prerequisites

- Node.js 18+ and npm installed
- Angular CLI 19+ installed
- Project dependencies already installed (`npm install` completed)

## Running the Demo

### 1. Start Development Server

```bash
npm start
```

Server starts on `http://localhost:4200`

### 2. Navigate to Demo

Open browser and go to:

```
http://localhost:4200/ag-grid-demo
```

### 3. What You'll See

- **Grid Display**: 15 columns × 100 rows of test data
- **Status Column**: Contains ng-select dropdown in each cell (~6th column)
- **Constrained Space**: Horizontal scrolling enabled due to many columns
- **Column Widths**: Status column is narrower (~110px) to demonstrate
  constraint

## Interacting with the Demo

### Test Dropdown Functionality

1. **Click any cell** in the "Status (ng-select)" column
2. Dropdown opens immediately showing 5 options:
   - Active
   - Pending
   - Inactive
   - Suspended
   - Archived
3. Select a value
4. Cell updates immediately to show new selection

### Test Persistence

1. Select a value in row 5
2. Scroll down to row 50
3. Scroll back up to row 5
4. Click the cell again
5. ✅ Verify: Previously selected value is still shown/selected

### Test Edge Cases

1. **Viewport Edge**: Scroll to rightmost columns, open dropdown
   - ✅ Dropdown should position itself to remain visible
2. **Narrow Column**: Resize the status column to <150px
   - ✅ Dropdown should still open and options should be readable
3. **Click Outside**: Open dropdown, click anywhere outside
   - ✅ Dropdown should close

## File Structure

```
src/app/ag-grid-demo/
├── ag-grid-demo.component.ts           # Main component
├── ag-grid-demo.component.html         # Grid template
├── ag-grid-demo.component.scss         # Styling
├── ag-grid-demo.routes.ts              # Route config
├── components/
│   └── ng-select-cell-renderer/
│       ├── ng-select-cell-renderer.component.ts
│       ├── ng-select-cell-renderer.component.html
│       └── ng-select-cell-renderer.component.scss
├── services/
│   └── mock-data.service.ts            # Data generation
└── models/
    ├── grid-row.interface.ts
    └── status-option.interface.ts
```

## Development Workflow

### Making Changes

**Modify Data**:

- Edit `mock-data.service.ts` → Change field values or add columns
- Changes auto-reload with `ng serve`

**Modify Grid Config**:

- Edit `ag-grid-demo.component.ts` → Update column definitions
- Adjust widths, add/remove columns

**Modify Cell Renderer**:

- Edit `ng-select-cell-renderer.component.ts` → Change dropdown behavior
- Edit template to adjust ng-select configuration

### Running Tests

```bash
# Run all tests
ng test

# Run specific test file
ng test --include='**/ag-grid-demo/**/*.spec.ts'
```

### Building for Production

```bash
ng build --configuration production
```

Component is automatically:

- Lazy-loaded (not in main bundle)
- Tree-shaken (unused code removed)
- Minified

## Troubleshooting

### Dropdown Doesn't Open

- **Check**: Browser console for errors
- **Verify**: ng-select module is imported in component
- **Solution**: Ensure `appendTo="body"` is set in template

### Selection Doesn't Persist

- **Check**: `params.setValue()` is called in onSelectionChange
- **Verify**: ag-Grid columnDefs reference is stable

### Performance Issues

- **Check**: Browser DevTools Performance tab
- **Verify**: OnPush change detection is enabled
- **Solution**: Reduce row count temporarily to isolate issue

### Column Too Wide/Narrow

- **Adjust**: Column width in columnDefs
- **Typical Range**: 100-150px for constrained testing

## Success Criteria Verification

After running the demo, verify:

- [ ] **SC-001**: Grid loads in <2 seconds _(check Network tab)_
- [ ] **SC-002**: 100 rows × 15 columns visible
- [ ] **SC-003**: Dropdown opens in <100ms _(feels instant)_
- [ ] **SC-004**: All dropdown options readable despite narrow column
- [ ] **SC-005**: Can select values 100% of the time
- [ ] **SC-006**: Selections persist after scrolling
- [ ] **SC-007**: Dropdown functional at <150px column width

## Next Steps

### For Testing

- Resize columns to various widths
- Test with different screen sizes
- Try rapid clicking/selection changes

### For Development

- Add more columns to increase constraint
- Experiment with different ng-select configurations
- Add custom styling to dropdown

### For Integration

- Copy pattern to real feature modules
- Adapt for actual business data
- Add filtering/sorting to ng-select column

## Resources

- [ag-Grid Angular Docs](https://www.ag-grid.com/angular-data-grid/)
- [ng-select Documentation](https://github.com/ng-select/ng-select)
- [Project Constitution](../../.specify/memory/constitution.md)
- [Feature Spec](spec.md)
- [Implementation Plan](plan.md)
