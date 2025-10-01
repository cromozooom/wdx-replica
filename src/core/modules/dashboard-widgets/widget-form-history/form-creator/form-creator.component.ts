import { Component, Input } from "@angular/core";
import { FormConfig } from "../widget-form-history.models";

@Component({
  selector: "app-form-creator",
  templateUrl: "./form-creator.component.html",
  styleUrls: ["./form-creator.component.scss"],
  standalone: true,
})
export class FormCreatorComponent {
  @Input() forms: FormConfig[] = [];
}
