import { ComponentFixture, TestBed } from "@angular/core/testing";
import { InspectorPanelComponent } from "./inspector-panel.component";
import { FlatSelectionRow } from "../../../models/flat-selection-row.interface";
import { PreviewRecord } from "../../../models/preview-record.interface";
import { QueryParameters } from "../../../models/query-parameters.interface";
import { Query } from "../../../models/query.interface";
import { SelectionItem } from "../../../models/selection-item.interface";

describe("InspectorPanelComponent", () => {
  let component: InspectorPanelComponent;
  let fixture: ComponentFixture<InspectorPanelComponent>;

  const mockQuery: Query = {
    id: "query-1",
    name: "All Contacts",
    description: "Returns all contacts in the database",
    parameters: {
      filters: [
        {
          field: "status",
          operator: "equals",
          value: "active",
          isActive: true,
        },
      ],
    },
    estimatedCount: 100,
  };

  const mockSelectionItem: SelectionItem = {
    id: "item-1",
    type: "Form",
    name: "Appointment Form",
    entityName: "Contact",
    queries: [mockQuery],
  };

  const mockFlatRow: FlatSelectionRow = {
    uniqueId: "item-1-query-1",
    sourceName: "Appointment Form",
    entityName: "Contact",
    queryName: "All Contacts",
    queryDescription: "Returns all contacts in the database",
    estimatedRecords: 100,
    queryRef: mockQuery,
    originalItem: mockSelectionItem,
  };

  const mockPreviewRecords: PreviewRecord[] = [
    {
      id: 1,
      displayData: {
        name: "John Doe",
        email: "john@example.com",
        status: "active",
      },
    },
    {
      id: 2,
      displayData: {
        name: "Jane Smith",
        email: "jane@example.com",
        status: "active",
      },
    },
  ];

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [InspectorPanelComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(InspectorPanelComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });

  it("should display empty state when no row is inspected", () => {
    component.inspectedRow = null;
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const emptyMessage = compiled.querySelector(".text-muted");
    expect(emptyMessage?.textContent).toContain(
      "Click a row to inspect query details",
    );
  });

  it("should display query information when row is inspected", () => {
    component.inspectedRow = mockFlatRow;
    component.queryParameters = mockQuery.parameters;
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain("Appointment Form");
    expect(compiled.textContent).toContain("Contact");
    expect(compiled.textContent).toContain("All Contacts");
  });

  it("should display preview data when available", () => {
    component.inspectedRow = mockFlatRow;
    component.previewData = mockPreviewRecords;
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain("John Doe");
    expect(compiled.textContent).toContain("jane@example.com");
  });

  it("should show loading state when loading is true", () => {
    component.inspectedRow = mockFlatRow;
    component.loading = true;
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const spinner = compiled.querySelector(".spinner-border");
    expect(spinner).toBeTruthy();
  });

  it("should show error message when error is provided", () => {
    component.inspectedRow = mockFlatRow;
    component.error = "Failed to load data";
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain("Failed to load data");
  });

  it("should emit previewRefresh event when refresh button is clicked", () => {
    component.inspectedRow = mockFlatRow;
    fixture.detectChanges();

    spyOn(component.previewRefresh, "emit");
    component.refreshPreview();

    expect(component.previewRefresh.emit).toHaveBeenCalledWith(
      jasmine.objectContaining({
        queryId: mockQuery.id,
        refreshType: "manual",
      }),
    );
  });

  it("should emit previewRefresh event when inspectedRow changes", () => {
    spyOn(component.previewRefresh, "emit");

    component.ngOnChanges({
      inspectedRow: {
        currentValue: mockFlatRow,
        previousValue: null,
        firstChange: true,
        isFirstChange: () => true,
      },
    });

    expect(component.previewRefresh.emit).toHaveBeenCalledWith(
      jasmine.objectContaining({
        queryId: mockQuery.id,
        refreshType: "automatic",
      }),
    );
  });

  it("should format values correctly", () => {
    expect(component.formatValue(null)).toBe("-");
    expect(component.formatValue(undefined)).toBe("-");
    expect(component.formatValue("test")).toBe("test");
    expect(component.formatValue(123)).toBe("123");
    expect(component.formatValue(new Date("2026-01-01"))).toContain("2026");
  });

  it("should get correct record count message for zero records", () => {
    const zeroRow: FlatSelectionRow = { ...mockFlatRow, estimatedRecords: 0 };
    component.inspectedRow = zeroRow;

    expect(component.getRecordCountMessage()).toBe(
      "No records match this query",
    );
  });

  it("should get correct record count message for large datasets", () => {
    const largeRow: FlatSelectionRow = {
      ...mockFlatRow,
      estimatedRecords: 15000,
    };
    component.inspectedRow = largeRow;
    component.previewData = mockPreviewRecords;

    const message = component.getRecordCountMessage();
    expect(message).toContain("15,000+");
    expect(message).toContain("Showing 2");
  });

  it("should clear inspection when clearInspection is called", () => {
    component.inspectedRow = mockFlatRow;
    component.previewData = mockPreviewRecords;
    component.queryParameters = mockQuery.parameters;

    component.clearInspection();

    expect(component.inspectedRow).toBeNull();
    expect(component.previewData).toEqual([]);
    expect(component.queryParameters).toBeNull();
  });

  it("should get preview record keys from first record", () => {
    const keys = component.getPreviewRecordKeys(mockPreviewRecords[0]);
    expect(keys).toContain("name");
    expect(keys).toContain("email");
    expect(keys).toContain("status");
  });

  it("should display query filters when available", () => {
    component.inspectedRow = mockFlatRow;
    component.queryParameters = {
      filters: [
        {
          field: "status",
          operator: "equals",
          value: "active",
          isActive: true,
        },
      ],
    };
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain("status");
    expect(compiled.textContent).toContain("active");
  });
});
