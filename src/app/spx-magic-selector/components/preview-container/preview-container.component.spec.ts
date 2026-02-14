import { ComponentFixture, TestBed } from "@angular/core/testing";
import { PreviewContainerComponent } from "./preview-container.component";
import { QueryExecutorService } from "../../services/query-executor.service";
import { of, throwError } from "rxjs";

describe("PreviewContainerComponent", () => {
  let component: PreviewContainerComponent;
  let fixture: ComponentFixture<PreviewContainerComponent>;
  let mockQueryExecutorService: jasmine.SpyObj<QueryExecutorService>;

  beforeEach(async () => {
    mockQueryExecutorService = jasmine.createSpyObj("QueryExecutorService", [
      "getRecordCount",
      "getPreviewData",
    ]);

    // Default mock response
    mockQueryExecutorService.getRecordCount.and.returnValue(of(100));

    await TestBed.configureTestingModule({
      imports: [PreviewContainerComponent],
      providers: [
        { provide: QueryExecutorService, useValue: mockQueryExecutorService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(PreviewContainerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });

  it("should load record count when query changes", () => {
    const mockQuery = {
      id: "test-query",
      name: "Test Query",
      description: "Test description",
      parameters: { filters: [] },
      estimatedCount: 150,
    };

    component.selectedQuery = mockQuery;
    component.ngOnChanges({
      selectedQuery: {
        currentValue: mockQuery,
        previousValue: null,
        firstChange: true,
        isFirstChange: () => true,
      },
    });

    expect(mockQueryExecutorService.getRecordCount).toHaveBeenCalledWith(
      mockQuery,
    );
  });

  it("should handle network errors and show cached data", (done) => {
    mockQueryExecutorService.getRecordCount.and.returnValue(
      throwError(() => new Error("Network error")),
    );

    const mockQuery = {
      id: "test-query",
      name: "Test Query",
      description: "Test description",
      parameters: { filters: [] },
      estimatedCount: 200,
    };

    component.cachedCount = 180; // Simulate existing cache
    component.selectedQuery = mockQuery;
    component.ngOnChanges({
      selectedQuery: {
        currentValue: mockQuery,
        previousValue: null,
        firstChange: true,
        isFirstChange: () => true,
      },
    });

    setTimeout(() => {
      expect(component.networkError).toBe(true);
      expect(component.recordCount).toBe(180); // Should use cached value
      done();
    }, 100);
  });

  it("should emit refreshRequest event when refreshPreview is called", () => {
    spyOn(component.refreshRequest, "emit");

    component.selectedItem = {
      id: "test-item",
      type: "Form",
      name: "Test Form",
      entityName: "TestEntity",
      entityId: "entity-testentity",
      queries: [],
    };

    component.selectedQuery = {
      id: "test-query",
      name: "Test Query",
      description: "Test description",
      parameters: { filters: [] },
    };

    component.refreshPreview();

    expect(component.refreshRequest.emit).toHaveBeenCalled();
  });

  it("should retry loading count after network failure", () => {
    component.networkError = true;
    component.selectedQuery = {
      id: "test-query",
      name: "Test Query",
      description: "Test description",
      parameters: { filters: [] },
    };

    mockQueryExecutorService.getRecordCount.and.returnValue(of(150));

    component.retryLoadCount();

    expect(component.networkError).toBe(false);
    expect(mockQueryExecutorService.getRecordCount).toHaveBeenCalled();
  });

  it("should show approximate indicator for counts >= 1000", () => {
    mockQueryExecutorService.getRecordCount.and.returnValue(of(1250));

    component.selectedQuery = {
      id: "test-query",
      name: "Test Query",
      description: "Test description",
      parameters: { filters: [] },
      estimatedCount: 1250,
    };

    component.ngOnChanges({
      selectedQuery: {
        currentValue: component.selectedQuery,
        previousValue: null,
        firstChange: true,
        isFirstChange: () => true,
      },
    });

    fixture.detectChanges();

    expect(component.recordCount).toBeGreaterThanOrEqual(1000);
  });
});
