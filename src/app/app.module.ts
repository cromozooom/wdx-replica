import { NgModule } from "@angular/core";
import { BrowserModule } from "@angular/platform-browser";
import { RouterModule } from "@angular/router";

import { AppComponent } from "./app.component";
import { DashboardComponent } from "./dashboard/dashboard.component";
import { WidgetComponent } from "./widget/widget.component";
import { WidgetDefaultContentComponent } from "./widget-default-content/widget-default-content.component";

@NgModule({
  declarations: [
    AppComponent,
    DashboardComponent,
    WidgetComponent,
    WidgetDefaultContentComponent,
  ],
  imports: [BrowserModule, RouterModule.forRoot([])],
  providers: [],
  bootstrap: [AppComponent],
})
export class AppModule {}
