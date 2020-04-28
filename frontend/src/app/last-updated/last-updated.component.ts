import { Component, OnInit } from '@angular/core';
import { StatisticsService } from '../statistics.service';
import { TotalStatistics } from '../statistics';

@Component({
  selector: 'app-last-updated',
  templateUrl: './last-updated.component.html',
  styleUrls: ['./last-updated.component.css'],
})
export class LastUpdatedComponent implements OnInit {
  public statistics: TotalStatistics;

  constructor(private statisticsService: StatisticsService) {}

  ngOnInit(): void {
    this.statisticsService.fetchTotalStatistics().subscribe((statistics) => {
      this.statistics = statistics;
    });
  }
}
