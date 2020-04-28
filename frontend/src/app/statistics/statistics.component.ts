import { Component, OnInit, Input } from '@angular/core';
import { ColumnDefinition, ColumnType } from '../table/table.component';
import { StatisticsService } from '../statistics.service';
import { SelectionChange } from '@angular/cdk/collections';
import { RegionStatistics } from '../statistics';

export enum StatisticsType {
  Confirmed,
  Deaths,
  Recovered,
}

@Component({
  selector: 'app-statistics',
  templateUrl: './statistics.component.html',
  styleUrls: ['./statistics.component.css'],
})
export class StatisticsComponent implements OnInit {
  @Input() title: string;
  @Input()
  set dataPropertyName(value: string) {
    if (value) {
      this.regionTableColumns[0].name = value;
      this.provinceTableColumns[0].name = value;
      this.cityTableColumns[0].name = value;
    }
  }
  @Input()
  set numberClass(value: string) {
    if (value) {
      this.regionTableColumns[0].classes = [value];
      this.provinceTableColumns[0].classes = [value];
      this.cityTableColumns[0].classes = [value];
    }
  }

  public regionTableColumns: ColumnDefinition[] = [
    {
      name: this.dataPropertyName,
      type: ColumnType.Number,
      classes: [this.numberClass],
    },
    {
      name: 'region',
      type: ColumnType.String,
      classes: [],
    },
  ];
  public provinceTableColumns: ColumnDefinition[] = [
    {
      name: this.dataPropertyName,
      type: ColumnType.Number,
      classes: [this.numberClass],
    },
    {
      name: 'province',
      type: ColumnType.String,
      classes: [],
    },
  ];
  public cityTableColumns: ColumnDefinition[] = [
    {
      name: this.dataPropertyName,
      type: ColumnType.Number,
      classes: [this.numberClass],
    },
    {
      name: 'city',
      type: ColumnType.String,
      classes: [],
    },
  ];

  constructor(public statisticsService: StatisticsService) {}

  ngOnInit(): void {}

  public onRegionTableSelectionChanged(
    change: SelectionChange<RegionStatistics>
  ): void {
    if (change.added.length > 0 && change.added[0] !== undefined) {
      this.statisticsService.selectedRegion = change.added[0];
    }
  }

  public onProvinceTableSelectionChanged(
    change: SelectionChange<RegionStatistics>
  ): void {
    if (change.added.length > 0 && change.added[0] !== undefined) {
      this.statisticsService.selectedProvince = change.added[0];
    }
  }

  public onCityTableSelectionChanged(
    change: SelectionChange<RegionStatistics>
  ): void {
    if (change.added.length > 0 && change.added[0] !== undefined) {
      this.statisticsService.selectedCity = change.added[0];
    }
  }
}
