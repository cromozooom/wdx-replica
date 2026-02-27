import { Component, ChangeDetectionStrategy } from "@angular/core";
import { ScrollScenario } from "./models/scroll-scenario.interface";
import { SCROLL_SCENARIOS } from "./models/scroll-scenarios.constant";
import { JsonEditorWrapperComponent } from "./components/jsoneditor-wrapper.component";

@Component({
  selector: "app-jsoneditor-scroll-demo",
  standalone: true,
  imports: [JsonEditorWrapperComponent],
  templateUrl: "./jsoneditor-scroll-demo.component.html",
  styleUrls: ["./jsoneditor-scroll-demo.component.scss"],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class JsonEditorScrollDemoComponent {
  scenarios: ScrollScenario[] = SCROLL_SCENARIOS;
}
