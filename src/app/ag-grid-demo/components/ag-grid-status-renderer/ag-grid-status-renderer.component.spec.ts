import { ComponentFixture, TestBed } from "@angular/core/testing";
import { AgGridStatusRendererComponent } from "./ag-grid-status-renderer.component";
import { ICellRendererParams } from "ag-grid-community";

describe("AgGridStatusRendererComponent", () => {
  let component: AgGridStatusRendererComponent;
  let fixture: ComponentFixture<AgGridStatusRendererComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AgGridStatusRendererComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(AgGridStatusRendererComponent);
    component = fixture.componentInstance;
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });

  describe("agInit", () => {
    it("should initialize with cell value from params", () => {
      const mockParams: ICellRendererParams = {
        value: "Active",
      } as any;

      component.agInit(mockParams);

      expect(component.value).toBe("Active");
      expect(component.params).toBe(mockParams);
    });

    it("should handle undefined value", () => {
      const mockParams: ICellRendererParams = {
        value: undefined,
      } as any;

      component.agInit(mockParams);

      expect(component.value).toBe("");
    });
  });

  describe("refresh", () => {
    it("should update value when refresh is called", () => {
      const initialParams: ICellRendererParams = {
        value: "Active",
      } as any;

      const updatedParams: ICellRendererParams = {
        value: "Pending",
      } as any;

      component.agInit(initialParams);
      expect(component.value).toBe("Active");

      const result = component.refresh(updatedParams);

      expect(result).toBe(true);
      expect(component.value).toBe("Pending");
      expect(component.params).toBe(updatedParams);
    });

    it("should return true to indicate successful refresh", () => {
      const mockParams: ICellRendererParams = {
        value: "Inactive",
      } as any;

      const result = component.refresh(mockParams);

      expect(result).toBe(true);
    });
  });
});
