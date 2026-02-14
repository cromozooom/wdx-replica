import { ComponentFixture, TestBed } from "@angular/core/testing";
import { MAT_DIALOG_DATA, MatDialogRef } from "@angular/material/dialog";
import { DiscoveryModalComponent } from "./discovery-modal.component";
import { SelectionDataService } from "../../services/selection-data.service";
import { NoopAnimationsModule } from "@angular/platform-browser/animations";

describe("DiscoveryModalComponent", () => {
  let component: DiscoveryModalComponent;
  let fixture: ComponentFixture<DiscoveryModalComponent>;
  let mockDialogRef: jasmine.SpyObj<MatDialogRef<DiscoveryModalComponent>>;
  let mockSelectionDataService: jasmine.SpyObj<SelectionDataService>;

  const mockDialogData = {
    availableItems: [
      {
        id: "test-item-1",
        type: "Form" as const,
        name: "Test Form",
        entityName: "TestEntity",
        queries: [
          {
            id: "query-1",
            name: "Test Query",
            description: "Test description",
            parameters: { filters: [] },
            estimatedCount: 100,
          },
        ],
      },
    ],
    domainSchema: {
      domainId: "test-domain",
      name: "Test Domain",
      description: "Test description",
      entities: [],
      isActive: true,
    },
    modalTitle: "Test Modal",
  };

  beforeEach(async () => {
    mockDialogRef = jasmine.createSpyObj("MatDialogRef", ["close"]);
    mockSelectionDataService = jasmine.createSpyObj("SelectionDataService", [
      "flattenToGridRows",
    ]);

    // Mock flattened rows
    mockSelectionDataService.flattenToGridRows.and.returnValue([
      {
        uniqueId: "test-item-1-query-1",
        sourceName: "Test Form",
        entityName: "TestEntity",
        queryName: "Test Query",
        queryDescription: "Test description",
        estimatedRecords: 100,
        queryRef: mockDialogData.availableItems[0].queries[0],
        originalItem: mockDialogData.availableItems[0],
        isSelected: false,
      },
    ]);

    await TestBed.configureTestingModule({
      imports: [DiscoveryModalComponent, NoopAnimationsModule],
      providers: [
        { provide: MatDialogRef, useValue: mockDialogRef },
        { provide: MAT_DIALOG_DATA, useValue: mockDialogData },
        { provide: SelectionDataService, useValue: mockSelectionDataService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(DiscoveryModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });

  it("should flatten items into grid rows on init", () => {
    expect(mockSelectionDataService.flattenToGridRows).toHaveBeenCalledWith(
      mockDialogData.availableItems,
    );
    expect(component.rowData.length).toBe(1);
  });

  it("should close dialog with result on confirmSelection", () => {
    component.selectedRow = component.rowData[0];
    component.confirmSelection();

    expect(mockDialogRef.close).toHaveBeenCalledWith({
      selectedRow: component.rowData[0],
      confirmed: true,
    });
  });

  it("should close dialog without result on cancel", () => {
    component.cancel();

    expect(mockDialogRef.close).toHaveBeenCalledWith({
      confirmed: false,
    });
  });

  it("should handle row click event", () => {
    const mockEvent = {
      data: component.rowData[0],
    } as any;

    component.onRowClicked(mockEvent);

    expect(component.selectedRow).toEqual(component.rowData[0]);
  });

  it("should handle row double-click event", () => {
    const mockEvent = {
      data: component.rowData[0],
    } as any;

    component.onRowDoubleClicked(mockEvent);

    expect(component.selectedRow).toEqual(component.rowData[0]);
    expect(mockDialogRef.close).toHaveBeenCalled();
  });

  it("should not confirm if no row is selected", () => {
    component.selectedRow = null;
    component.confirmSelection();

    expect(mockDialogRef.close).not.toHaveBeenCalled();
  });
});
