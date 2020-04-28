import { Component, OnInit } from '@angular/core';
import { StatisticsService } from '../statistics.service';
import { RegionStatistics } from '../statistics';
import { BehaviorSubject } from 'rxjs';
import { MatGridTileHeaderCssMatStyler } from '@angular/material/grid-list';

interface Location {
  lat: number;
  lng: number;
  zoom: number;
  address_level_1?: string;
  address_level_2?: string;
  address_country?: string;
  address_zip?: string;
  address_state?: string;
  label: string;
}

@Component({
  selector: 'app-map',
  templateUrl: './map.component.html',
  styleUrls: ['./map.component.css'],
})
export class MapComponent implements OnInit {
  public location: Location = {
    lat: 0,
    lng: 0,
    label: 'You are Here',
    zoom: 1,
  };

  private readonly _markers = new BehaviorSubject<RegionStatistics[]>([]);

  public readonly markers$ = this._markers.asObservable();

  public infoWindowIsOpen: boolean = false;

  constructor(public statisticsService: StatisticsService) {
    this.infoWindowIsOpen = false;

    statisticsService.selectedCity$.subscribe((_) => {
      this.updateMarkers();
    });
    statisticsService.selectedProvince$.subscribe((_) => {
      this.updateMarkers();
    });
    statisticsService.selectedRegion$.subscribe((_) => {
      this.updateMarkers();
    });
    statisticsService.top5USProvincies$.subscribe((top5USProvincies) => {
      if (top5USProvincies && top5USProvincies.length > 0) {
        this.updateTop5USStates(top5USProvincies);
      }
    });
  }

  ngOnInit(): void {}

  public onMarkerClick(event): void {}

  private updateMarkers(): void {
    console.warn('updateMarkers');

    this.infoWindowIsOpen = false;

    const selectedCity = this.statisticsService.selectedCity;
    const selectedProvince = this.statisticsService.selectedProvince;
    const selectedRegion = this.statisticsService.selectedRegion;

    if (selectedCity) {
      this.location.lat = selectedCity.latitude;
      this.location.lng = selectedCity.longitude;
      this.location.zoom = 10;

      this._markers.next([selectedCity]);
    } else if (selectedProvince) {
      this.location.lat = selectedProvince.latitude;
      this.location.lng = selectedProvince.longitude;
      this.location.zoom = 5;

      this.statisticsService
        .fetchCities(selectedProvince.region, selectedProvince.province)
        .subscribe((cities) => {
          if (cities) {
            this._markers.next(cities);
          } else {
            this._markers.next([selectedProvince]);
          }
        });
    } else if (selectedRegion) {
      this.location.lat = selectedRegion.latitude;
      this.location.lng = selectedRegion.longitude;

      if (selectedRegion.region === 'World') {
        this.location.zoom = 1;

        this._markers.next(
          this.statisticsService.regions.filter(
            (region) => region.region !== 'World'
          )
        );
      } else {
        this.location.zoom = 5;

        this.statisticsService
          .fetchProvincies(selectedRegion.region)
          .subscribe((provinces) => {
            if (provinces && provinces.length > 0) {
              this._markers.next(this.statisticsService.provinces);
            } else {
              this.location.zoom = 3;

              this._markers.next([selectedRegion]);
            }
          });
      }
    }
  }

  private updateTop5USStates(top5USProvincies) {
    this.infoWindowIsOpen = true;

    this.location.lat = top5USProvincies[0].latitude;
    this.location.lng = top5USProvincies[0].longitude;
    this.location.zoom = 5;

    this._markers.next(top5USProvincies);
  }
}
