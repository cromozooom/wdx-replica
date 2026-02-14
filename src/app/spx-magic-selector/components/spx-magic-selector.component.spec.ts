import { ComponentFixture, TestBed } from "@angular/core/testing";
import { SpxMagicSelectorComponent } from "./spx-magic-selector.component";
import { SelectionDataService } from "../services/selection-data.service";
import { of } from "rxjs";

describe("SpxMagicSelectorComponent", () => {
  let component: SpxMagicSelectorComponent;
  let fixture: ComponentFixture<SpxMagicSelectorComponent>;
  let mockSelectionDataService: jasmine.SpyObj<SelectionDataService>;

  beforeEach(async () => {
    mockSelectionDataService = jasmine.createSpyObj("SelectionDataService", [
      "getAvailableItems",
      "searchItems",
      "getItemById",
    ]);

    // Default mock responses
    mockSelectionDataService.getAvailableItems.and.returnValue(of([]));
    mockSelectionDataService.searchItems.and.returnValue(of([]));
    mockSelectionDataService.getItemById.and.returnValue(of(null));

    await TestBed.configureTestingModule({
      imports: [SpxMagicSelectorComponent],
      providers: [
        { provide: SelectionDataService, useValue: mockSelectionDataService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(SpxMagicSelectorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });

  it("should load available items on init", () => {
    expect(mockSelectionDataService.getAvailableItems).toHaveBeenCalledWith(
      "crm-scheduling",
    );
  });

  it("should emit selectionChange event when item is selected", (done) => {
    const mockItem = {
      id: "test-item",
      type: "Form" as const,
      name: "Test Form",
      entityName: "TestEntity",
      queries: [
        {
          id: "test-query",
          name: "Test Query",
          description: "Test description",
          parameters: { filters: [] },
        },
      ],
    };

    component.selectionChange.subscribe((event) => {
      expect(event.selectedItem).toEqual(mockItem);
      expect(event.source).toBe("dropdown");
      done();
    });

    component.onSelectionChange(mockItem);
  });

  it("should clear selection when clearSelection is called", () => {
    component.clearSelection();
    expect(component.selectedItem$.value).toBeNull();
    expect(component.selectedQuery$.value).toBeNull();
  });

  it("should update domain when setDomain is called", () => {
    component.setDomain("document-management");
    expect(component.domainId).toBe("document-management");
    expect(mockSelectionDataService.getAvailableItems).toHaveBeenCalledWith(
      "document-management",
    );
  });

  it("should implement ControlValueAccessor", () => {
    const onChangeSpy = jasmine.createSpy("onChange");
    component.registerOnChange(onChangeSpy);

    const mockItem = {
      id: "test-item",
      type: "Form" as const,
      name: "Test Form",
      entityName: "TestEntity",
      queries: [
        {
          id: "test-query",
          name: "Test Query",
          description: "Test description",
          parameters: { filters: [] },
        },
      ],
    };

    component.onSelectionChange(mockItem);
    expect(onChangeSpy).toHaveBeenCalledWith(mockItem);
  });

  it("should handle disabled state", () => {
    component.setDisabledState(true);
    expect(component.disabled).toBe(true);

    component.setDisabledState(false);
    expect(component.disabled).toBe(false);
  });
});
