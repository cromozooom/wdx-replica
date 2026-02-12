import { ComponentFixture, TestBed } from "@angular/core/testing";
import { FormsModule } from "@angular/forms";
import { NgSelectModule } from "@ng-select/ng-select";
import { NgSelectCellRendererComponent } from "./ng-select-cell-renderer.component";
import { ICellRendererParams } from "ag-grid-community";

describe("NgSelectCellRendererComponent", () => {
  let component: NgSelectCellRendererComponent;
  let fixture: ComponentFixture<NgSelectCellRendererComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NgSelectCellRendererComponent, FormsModule, NgSelectModule],
    }).compileComponents();

    fixture = TestBed.createComponent(NgSelectCellRendererComponent);
    component = fixture.componentInstance;
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });

  describe("ICellRendererAngularComp implementation", () => {
    it("should implement ICellRendererAngularComp interface", () => {
      // Assert
      expect(component.agInit).toBeDefined();
      expect(component.refresh).toBeDefined();
      expect(typeof component.agInit).toBe("function");
      expect(typeof component.refresh).toBe("function");
    });

    it("should have statusOptions array with 5 options", () => {
      // Assert
      expect(component.statusOptions).toBeDefined();
      expect(component.statusOptions.length).toBe(5);

      const expectedStatuses = [
        "Active",
        "Pending",
        "Inactive",
        "Suspended",
        "Archived",
      ];
      component.statusOptions.forEach((option) => {
        expect(expectedStatuses).toContain(option.label);
      });
    });
  });

  describe("agInit", () => {
    it("should initialize with cell value from params", () => {
      // Arrange
      const mockParams: ICellRendererParams = {
        value: "Active",
        setValue: jasmine.createSpy("setValue"),
      } as any;

      // Act
      component.agInit(mockParams);

      // Assert
      expect(component.value).toBe("Active");
      expect(component.params).toBe(mockParams);
    });

    it("should handle undefined value in params", () => {
      // Arrange
      const mockParams: ICellRendererParams = {
        value: undefined,
        setValue: jasmine.createSpy("setValue"),
      } as any;

      // Act
      component.agInit(mockParams);

      // Assert
      expect(component.value).toBe("");
      expect(component.params).toBe(mockParams);
    });

    it("should handle null value in params", () => {
      // Arrange
      const mockParams: ICellRendererParams = {
        value: null,
        setValue: jasmine.createSpy("setValue"),
      } as any;

      // Act
      component.agInit(mockParams);

      // Assert
      expect(component.value).toBe("");
    });
  });

  describe("refresh", () => {
    it("should update value when refresh is called", () => {
      // Arrange
      const initialParams: ICellRendererParams = {
        value: "Active",
        setValue: jasmine.createSpy("setValue"),
      } as any;

      const updatedParams: ICellRendererParams = {
        value: "Pending",
        setValue: jasmine.createSpy("setValue"),
      } as any;

      component.agInit(initialParams);
      expect(component.value).toBe("Active");

      // Act
      const result = component.refresh(updatedParams);

      // Assert
      expect(result).toBe(true);
      expect(component.value).toBe("Pending");
      expect(component.params).toBe(updatedParams);
    });

    it("should return true to indicate successful refresh", () => {
      // Arrange
      const mockParams: ICellRendererParams = {
        value: "Inactive",
        setValue: jasmine.createSpy("setValue"),
      } as any;

      // Act
      const result = component.refresh(mockParams);

      // Assert
      expect(result).toBe(true);
    });
  });

  describe("onSelectionChange", () => {
    it("should call params.setValue with new value", () => {
      // Arrange
      const setValueSpy = jasmine.createSpy("setValue");
      const mockParams: ICellRendererParams = {
        value: "Active",
        setValue: setValueSpy,
      } as any;

      component.agInit(mockParams);

      // Act
      component.onSelectionChange("Suspended");

      // Assert
      expect(setValueSpy).toHaveBeenCalledWith("Suspended");
      expect(setValueSpy).toHaveBeenCalledTimes(1);
    });

    it("should handle selection change to different status", () => {
      // Arrange
      const setValueSpy = jasmine.createSpy("setValue");
      const mockParams: ICellRendererParams = {
        value: "Pending",
        setValue: setValueSpy,
      } as any;

      component.agInit(mockParams);

      // Act
      component.onSelectionChange("Archived");

      // Assert
      expect(setValueSpy).toHaveBeenCalledWith("Archived");
    });

    it("should not throw error if params is undefined", () => {
      // Arrange
      component.params = undefined as any;

      // Act & Assert
      expect(() => component.onSelectionChange("Active")).not.toThrow();
    });

    it("should not throw error if params.setValue is undefined", () => {
      // Arrange
      component.params = {} as any;

      // Act & Assert
      expect(() => component.onSelectionChange("Active")).not.toThrow();
    });
  });

  describe("statusOptions configuration", () => {
    it("should have correct structure for each option", () => {
      // Assert
      component.statusOptions.forEach((option) => {
        expect(option.id).toBeDefined();
        expect(option.label).toBeDefined();
        expect(typeof option.id).toBe("string");
        expect(typeof option.label).toBe("string");
      });
    });

    it("should have unique IDs for each option", () => {
      // Arrange
      const ids = component.statusOptions.map((opt) => opt.id);
      const uniqueIds = new Set(ids);

      // Assert
      expect(uniqueIds.size).toBe(component.statusOptions.length);
    });
  });
});
