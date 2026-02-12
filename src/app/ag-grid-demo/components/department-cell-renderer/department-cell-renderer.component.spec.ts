import { ComponentFixture, TestBed } from "@angular/core/testing";
import { DepartmentCellRendererComponent } from "./department-cell-renderer.component";
import { ICellRendererParams } from "ag-grid-community";

describe("DepartmentCellRendererComponent", () => {
  let component: DepartmentCellRendererComponent;
  let fixture: ComponentFixture<DepartmentCellRendererComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DepartmentCellRendererComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(DepartmentCellRendererComponent);
    component = fixture.componentInstance;
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });

  it("should initialize with params value", () => {
    const mockParams: Partial<ICellRendererParams> = {
      value: "Sales",
    };

    component.agInit(mockParams as ICellRendererParams);

    expect(component.value).toBe("Sales");
  });

  it("should refresh with new value", () => {
    const mockParams: Partial<ICellRendererParams> = {
      value: "Engineering",
    };

    const result = component.refresh(mockParams as ICellRendererParams);

    expect(component.value).toBe("Engineering");
    expect(result).toBe(true);
  });

  it("should display value in template", () => {
    const mockParams: Partial<ICellRendererParams> = {
      value: "Marketing",
    };

    component.agInit(mockParams as ICellRendererParams);
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const span = compiled.querySelector(".department-display");

    expect(span?.textContent).toContain("Marketing");
  });

  it("should have editable-cell class for styling", () => {
    const mockParams: Partial<ICellRendererParams> = {
      value: "HR",
    };

    component.agInit(mockParams as ICellRendererParams);
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const span = compiled.querySelector(".editable-cell");

    expect(span).toBeTruthy();
  });
});
