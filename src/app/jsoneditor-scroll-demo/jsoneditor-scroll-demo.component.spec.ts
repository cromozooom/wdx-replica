import { ComponentFixture, TestBed } from "@angular/core/testing";
import { JsonEditorScrollDemoComponent } from "./jsoneditor-scroll-demo.component";

describe("JsonEditorScrollDemoComponent", () => {
  let component: JsonEditorScrollDemoComponent;
  let fixture: ComponentFixture<JsonEditorScrollDemoComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [JsonEditorScrollDemoComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(JsonEditorScrollDemoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });

  it("should have 6 scenarios", () => {
    expect(component.scenarios).toBeDefined();
    expect(component.scenarios.length).toBe(6);
  });
});
