import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { WidgetFormHistoryComponent } from "./widget-form-history.component";
import { NgbNavModule } from "@ng-bootstrap/ng-bootstrap";
@NgModule({
  declarations: [WidgetFormHistoryComponent],
  imports: [CommonModule, NgbNavModule],
  exports: [WidgetFormHistoryComponent],
})
export class WidgetFormHistoryModule {}
