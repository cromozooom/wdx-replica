import { NgModule } from "@angular/core";
import { BrowserModule } from "@angular/platform-browser";
import { RouterModule } from "@angular/router";

import { DashboardComponent } from "./dashboard/dashboard.component";
import { WidgetComponent } from "./widget/widget.component";
import { WidgetDefaultContentComponent } from "./widget-default-content/widget-default-content.component";

@NgModule({
  declarations: [],
  imports: [
    BrowserModule,
    RouterModule.forRoot([]),
    WidgetComponent,
    DashboardComponent,
    WidgetDefaultContentComponent,
  ],
  providers: [],
  bootstrap: [],
})
export class AppModule {}
