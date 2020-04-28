import { Component } from '@angular/core';
import { StatisticsService } from './statistics.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
})
export class AppComponent {
  title = 'frontend';

  constructor(private statisticsService: StatisticsService) {}

  public showTop5USStates(event) {
    this.statisticsService.selectTop5USStates();
  }
}
