import { ComponentFixture, TestBed } from "@angular/core/testing";
import { AgGridDemoComponent } from "./ag-grid-demo.component";
import { MockDataService } from "./services/mock-data.service";
import { AgGridAngular } from "ag-grid-angular";

describe("AgGridDemoComponent", () => {
  let component: AgGridDemoComponent;
  let fixture: ComponentFixture<AgGridDemoComponent>;
  let mockDataService: MockDataService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AgGridDemoComponent, AgGridAngular],
    }).compileComponents();

    fixture = TestBed.createComponent(AgGridDemoComponent);
    component = fixture.componentInstance;
    mockDataService = TestBed.inject(MockDataService);
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });

  describe("ngOnInit", () => {
    it("should initialize component with 100 rows", () => {
      // Act
      component.ngOnInit();

      // Assert
      expect(component.rowData).toBeDefined();
      expect(component.rowData.length).toBe(100);
    });

    it("should have exactly 15 column definitions", () => {
      // Act
      component.ngOnInit();

      // Assert
      expect(component.columnDefs).toBeDefined();
      expect(component.columnDefs.length).toBe(15);
    });

    it("should configure default column settings correctly", () => {
      // Assert
      expect(component.defaultColDef.width).toBe(130);
      expect(component.defaultColDef.resizable).toBe(true);
      expect(component.defaultColDef.sortable).toBe(true);
      expect(component.defaultColDef.filter).toBe(true);
    });

    it("should configure status column with narrower width", () => {
      // Act
      component.ngOnInit();

      // Assert
      const statusColumn = component.columnDefs.find(
        (col) => col.field === "status",
      );
      expect(statusColumn).toBeDefined();
      expect(statusColumn?.width).toBe(110);
    });

    it("should have all required columns defined", () => {
      // Act
      component.ngOnInit();

      // Assert
      const expectedFields = [
        "id",
        "name",
        "email",
        "status",
        "department",
        "location",
        "role",
        "startDate",
        "salary",
        "performance",
        "projects",
        "hoursLogged",
        "certification",
        "experience",
        "team",
      ];

      expectedFields.forEach((field) => {
        const column = component.columnDefs.find((col) => col.field === field);
        expect(column).toBeDefined();
      });
    });

    it("should call MockDataService.generate with correct row count", () => {
      // Arrange
      spyOn(mockDataService, "generate").and.callThrough();

      // Act
      component.ngOnInit();

      // Assert
      expect(mockDataService.generate).toHaveBeenCalledWith(100);
    });
  });

  describe("grid configuration", () => {
    it("should have grid options configured", () => {
      expect(component.gridOptions).toBeDefined();
      expect(component.gridOptions.animateRows).toBe(true);
      expect(component.gridOptions.rowSelection).toEqual({
        mode: "singleRow",
      });
    });
  });
});
