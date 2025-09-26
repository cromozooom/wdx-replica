
import { Component } from '@angular/core';
import { WidgetComponent } from '../widget/widget.component';
import { ActivatedRoute } from '@angular/router';

type WidgetType = 'default' | 'automation' | 'widget-data-history';

@Component({
  selector: "app-dashboard",
  standalone: true,
  templateUrl: "./dashboard.component.html",
  styleUrls: ["./dashboard.component.scss"],
  imports: [WidgetComponent],
})
export class DashboardComponent {
  type: WidgetType = 'automation';

  constructor(private route: ActivatedRoute) {
    this.route.paramMap.subscribe((params: import('@angular/router').ParamMap) => {
      const param = params.get('type');
      if (param === 'automation' || param === 'widget-data-history' || param === 'default') {
        this.type = param;
      } else {
        this.type = 'automation';
      }
    });
  }
}
