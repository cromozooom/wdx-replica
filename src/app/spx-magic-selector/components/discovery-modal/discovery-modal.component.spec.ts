import { ComponentFixture, TestBed } from "@angular/core/testing";
import { NgbActiveModal } from "@ng-bootstrap/ng-bootstrap";
import { DiscoveryModalComponent } from "./discovery-modal.component";
import { SelectionDataService } from "../../services/selection-data.service";
import { NoopAnimationsModule } from "@angular/platform-browser/animations";

describe("DiscoveryModalComponent", () => {
  let component: DiscoveryModalComponent;
  let fixture: ComponentFixture<DiscoveryModalComponent>;
  let mockActiveModal: jasmine.SpyObj<NgbActiveModal>;
  let mockSelectionDataService: jasmine.SpyObj<SelectionDataService>;

  const mockSelectionItem = {
    id: "test-item-1",
    type: "Form" as const,
    name: "Test Form",
    entityName: "TestEntity",
    entityId: "entity-testentity",
    queries: [
      {
        id: "query-1",
        name: "Test Query",
        description: "Test description",
        parameters: { filters: [] },
        estimatedCount: 100,
      },
    ],
  };

  const mockDialogData = {
    availableItems: [
      {
        uniqueId: "test-item-1_query-1",
        sourceName: "Test Form",
        entityName: "TestEntity",
        queryName: "Test Query",
        queryDescription: "Test description",
        estimatedRecords: 100,
        queryRef: mockSelectionItem.queries[0],
        originalItem: mockSelectionItem,
        isSelected: false,
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
    mockActiveModal = jasmine.createSpyObj("NgbActiveModal", [
      "close",
      "dismiss",
    ]);
    mockSelectionDataService = jasmine.createSpyObj("SelectionDataService", [
      "flattenToGridRows",
    ]);

    await TestBed.configureTestingModule({
      imports: [DiscoveryModalComponent, NoopAnimationsModule],
      providers: [
        { provide: NgbActiveModal, useValue: mockActiveModal },
        { provide: SelectionDataService, useValue: mockSelectionDataService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(DiscoveryModalComponent);
    component = fixture.componentInstance;
    component.data = mockDialogData;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });

  it("should use already-flattened items as grid rows on init", () => {
    expect(component.rowData.length).toBe(1);
    expect(component.rowData[0].uniqueId).toBe("test-item-1_query-1");
  });

  it("should close dialog with result on confirmSelection", () => {
    component.selectedRow = component.rowData[0];
    component.confirmSelection();

    expect(mockActiveModal.close).toHaveBeenCalledWith({
      selectedRow: component.rowData[0],
      confirmed: true,
    });
  });

  it("should dismiss dialog on cancel", () => {
    component.cancel();

    expect(mockActiveModal.dismiss).toHaveBeenCalled();
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
    expect(mockActiveModal.close).toHaveBeenCalled();
  });

  it("should not confirm if no row is selected", () => {
    component.selectedRow = null;
    component.confirmSelection();

    expect(mockActiveModal.close).not.toHaveBeenCalled();
  });
});
